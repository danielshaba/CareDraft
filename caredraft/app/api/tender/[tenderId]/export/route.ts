import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

const exportRequestSchema = z.object({
  format: z.enum(['pdf', 'docx', 'html']),
  includeBranding: z.boolean().default(true),
  includeAppendices: z.boolean().default(true),
  watermark: z.boolean().default(false),
  password: z.string().optional(),
  sections: z.array(z.string()).optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenderId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { format, includeBranding, includeAppendices, watermark, password: _password, sections: _sections } = exportRequestSchema.parse(body)
    
    const { tenderId } = await params

    // Get tender data
    const { data: tender, error: tenderError } = await supabase
      .from('tender_workflows')
      .select(`
        *,
        tender_metadata (*)
      `)
      .eq('id', tenderId)
      .single()

    if (tenderError || !tender) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 })
    }

    // Mock tender content for demonstration
    const tenderContent = {
      title: tender.title || 'NHS Community Care Services - Yorkshire Region',
      executiveSummary: 'CareDraft is a leading provider of community care services with over 15 years of experience in delivering high-quality, person-centered care across Yorkshire. Our comprehensive approach combines qualified staff, innovative technology, and deep community connections to deliver exceptional outcomes for service users.',
      technicalApproach: 'Our technical approach is built on evidence-based practices, continuous quality improvement, and robust compliance frameworks. We utilize digital care planning systems, real-time monitoring, and comprehensive staff training programs to ensure consistent, high-quality service delivery.',
      commercial: 'Our competitive pricing model reflects our commitment to delivering value for money while maintaining the highest standards of care. We offer transparent pricing with no hidden costs and flexible contract terms that adapt to changing needs.',
      qualityAssurance: 'Quality is at the heart of everything we do. Our quality assurance framework includes regular audits, continuous staff training, service user feedback systems, and compliance monitoring to ensure we exceed regulatory requirements and deliver outstanding outcomes.',
      riskManagement: 'We have identified and developed comprehensive mitigation strategies for all potential risks including staffing, regulatory compliance, technology failures, and service continuity. Our risk register is regularly reviewed and updated.',
      implementationPlan: 'Our implementation plan includes a phased approach with clear milestones, dedicated project management, staff transition planning, and comprehensive service user communication to ensure seamless service delivery from day one.'
    }

    let exportData: Buffer | string

    switch (format) {
      case 'pdf':
        exportData = await generatePDF(tenderContent, { includeBranding, includeAppendices, watermark })
        break
      case 'docx':
        exportData = await generateDOCX(tenderContent, { includeBranding, includeAppendices, watermark })
        break
      case 'html':
        exportData = generateHTML(tenderContent, { includeBranding, includeAppendices, watermark })
        break
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Set appropriate headers for download
    const fileName = `tender-${tenderId}-${Date.now()}.${format}`
    const contentType = getContentType(format)

    const response = new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': exportData.length.toString()
      }
    })

    return response

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

async function generatePDF(content: any, options: any): Promise<Buffer> {
  const doc = new jsPDF()

  // Title page
  doc.setFontSize(24)
  doc.text(content.title, 20, 40)
  
  if (options.watermark) {
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(50)
    doc.text('DRAFT', 60, 150, { angle: 45 })
    doc.setTextColor(0, 0, 0)
  }

  // Add branding if requested
  if (options.includeBranding) {
    doc.setFontSize(12)
    doc.text('CareDraft - Professional Care Services', 20, 20)
  }

  // Content sections
  let yPosition = 60
  const sections = [
    { title: 'Executive Summary', content: content.executiveSummary },
    { title: 'Technical Approach', content: content.technicalApproach },
    { title: 'Commercial Proposal', content: content.commercial },
    { title: 'Quality Assurance', content: content.qualityAssurance },
    { title: 'Risk Management', content: content.riskManagement },
    { title: 'Implementation Plan', content: content.implementationPlan }
  ]

  sections.forEach((section) => {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.text(section.title, 20, yPosition)
    yPosition += 10

    doc.setFontSize(11)
    const splitText = doc.splitTextToSize(section.content, 170)
    doc.text(splitText, 20, yPosition)
    yPosition += splitText.length * 5 + 10
  })

  // Add page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(`Page ${i} of ${pageCount}`, 180, 290)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

async function generateDOCX(content: any, options: any): Promise<Buffer> {
  const paragraphs = []

  // Title
  paragraphs.push(
    new Paragraph({
      text: content.title,
      heading: HeadingLevel.TITLE,
    })
  )

  if (options.watermark) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'DRAFT - CONFIDENTIAL', color: 'CCCCCC', size: 48 })]
      })
    )
  }

  // Branding
  if (options.includeBranding) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'CareDraft - Professional Care Services', bold: true })]
      })
    )
  }

  // Content sections
  const sections = [
    { title: 'Executive Summary', content: content.executiveSummary },
    { title: 'Technical Approach', content: content.technicalApproach },
    { title: 'Commercial Proposal', content: content.commercial },
    { title: 'Quality Assurance', content: content.qualityAssurance },
    { title: 'Risk Management', content: content.riskManagement },
    { title: 'Implementation Plan', content: content.implementationPlan }
  ]

  sections.forEach((section) => {
    paragraphs.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
      })
    )
    paragraphs.push(
      new Paragraph({
        text: section.content,
      })
    )
    paragraphs.push(new Paragraph({ text: '' })) // Empty paragraph for spacing
  })

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

function generateHTML(content: any, options: any): string {
  const branding = options.includeBranding ? '<div class="branding">CareDraft - Professional Care Services</div>' : ''
  const watermark = options.watermark ? '<div class="watermark">DRAFT</div>' : ''

  const sections = [
    { title: 'Executive Summary', content: content.executiveSummary },
    { title: 'Technical Approach', content: content.technicalApproach },
    { title: 'Commercial Proposal', content: content.commercial },
    { title: 'Quality Assurance', content: content.qualityAssurance },
    { title: 'Risk Management', content: content.riskManagement },
    { title: 'Implementation Plan', content: content.implementationPlan }
  ]

  const sectionsHTML = sections.map(section => `
    <section>
      <h2>${section.title}</h2>
      <p>${section.content}</p>
    </section>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${content.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .branding { color: #666; font-size: 12px; margin-bottom: 20px; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); 
                     font-size: 72px; color: rgba(200, 200, 200, 0.3); z-index: -1; }
        h1 { color: #333; border-bottom: 2px solid #007ACC; padding-bottom: 10px; }
        h2 { color: #007ACC; margin-top: 30px; }
        section { margin-bottom: 30px; }
        p { text-align: justify; }
        @media print { .watermark { position: absolute; } }
      </style>
    </head>
    <body>
      ${branding}
      ${watermark}
      <h1>${content.title}</h1>
      ${sectionsHTML}
    </body>
    </html>
  `
}

function getContentType(format: string): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'html':
      return 'text/html'
    default:
      return 'application/octet-stream'
  }
} 