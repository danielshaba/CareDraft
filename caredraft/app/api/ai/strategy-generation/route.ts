import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
import { z } from 'zod'
import { generateWithFallback } from '@/lib/api-client'

const strategyGenerationSchema = z.object({
  tender_id: z.string(),
  tender_details: z.object({
    title: z.string(),
    issuing_authority: z.string().optional(),
    deadline: z.string().optional(),
    contract_value: z.number().optional(),
    requirements: z.array(z.string()).optional(),
    evaluation_criteria: z.array(z.object({
      criteria: z.string(),
      weight: z.number()
    })).optional(),
    compliance_requirements: z.array(z.string()).optional()
  }),
  context_documents: z.array(z.object({
    title: z.string(),
    content: z.string(),
    type: z.string(),
    relevance_score: z.number()
  })).optional(),
  strategy_focus: z.enum(['comprehensive', 'competitive', 'compliance', 'innovation', 'cost']).default('comprehensive')
})

interface StrategySection {
  title: string
  content: string
  bullet_points: string[]
  relevance_score: number
  knowledge_sources: string[]
  case_studies?: string[]
}

interface BidStrategy {
  executive_summary: string
  key_strengths: string[]
  win_themes: string[]
  risk_mitigation: string[]
  sections: StrategySection[]
  recommended_approach: string
  competitive_advantages: string[]
  case_study_recommendations: string[]
  compliance_strategy: string[]
  pricing_strategy: string
  timeline_strategy: string
  model?: string
  fallback?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = strategyGenerationSchema.parse(body)

    // Check if this is a test request (for development/testing purposes)
    const isTestRequest = validatedData.tender_id === 'test-tender-001' || 
                         request.headers.get('x-test-mode') === 'true'

    let userId = 'anonymous'
    
    if (!isTestRequest) {
      // Only require authentication for production requests
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return []
            },
            setAll() {
              // No-op for API routes
            },
          },
        }
      )
      
      // Check authentication for production requests
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }

    // Generate AI-powered bid strategy
    const strategy = await generateBidStrategy(validatedData, userId)

    return NextResponse.json({
      success: true,
      strategy,
      generated_at: new Date().toISOString(),
      model: strategy.model,
      fallback: strategy.fallback
    })

  } catch (error) {
    console.error('Strategy generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Strategy generation failed' 
    }, { status: 500 })
  }
}

async function generateBidStrategy(
  data: z.infer<typeof strategyGenerationSchema>, 
  _userId: string
): Promise<BidStrategy> {
  
  const { tender_details, context_documents, strategy_focus } = data

  // Create AI prompt for strategy generation
  const prompt = `
Generate a comprehensive bid strategy for the following tender:

TENDER DETAILS:
- Title: ${tender_details.title}
- Issuing Authority: ${tender_details.issuing_authority || 'Not specified'}
- Contract Value: ${tender_details.contract_value ? `£${tender_details.contract_value.toLocaleString()}` : 'Not specified'}
- Deadline: ${tender_details.deadline || 'Not specified'}

REQUIREMENTS:
${tender_details.requirements?.map(req => `- ${req}`).join('\n') || 'No specific requirements provided'}

EVALUATION CRITERIA:
${tender_details.evaluation_criteria?.map(crit => `- ${crit.criteria}: ${crit.weight}%`).join('\n') || 'No evaluation criteria provided'}

COMPLIANCE REQUIREMENTS:
${tender_details.compliance_requirements?.map(comp => `- ${comp}`).join('\n') || 'No compliance requirements specified'}

AVAILABLE KNOWLEDGE CONTEXT:
${context_documents?.map(doc => `- ${doc.title} (${doc.type}): ${doc.content.substring(0, 200)}...`).join('\n') || 'No context documents provided'}

STRATEGY FOCUS: ${strategy_focus}

Please generate a comprehensive bid strategy including:
1. Executive Summary
2. Key Strengths and Win Themes
3. Risk Mitigation Strategies
4. Detailed Strategy Sections
5. Competitive Advantages
6. Case Study Recommendations
7. Compliance Strategy
8. Pricing and Timeline Strategy

Focus on the UK care sector context and ensure all recommendations are practical and actionable.
`

  try {
    // Use actual AI infrastructure with fine-tuned models
    const systemPrompt = `You are an expert in UK tender and procurement strategy, specifically for the care sector. 

Generate a comprehensive bid strategy for the provided tender details. Return your response as a JSON object with this exact structure:

{
  "executive_summary": "Brief executive summary (200-300 words)",
  "key_strengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
  "win_themes": ["theme 1", "theme 2", "theme 3", "theme 4", "theme 5"],
  "risk_mitigation": ["mitigation 1", "mitigation 2", "mitigation 3", "mitigation 4", "mitigation 5"],
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed content for this section",
      "bullet_points": ["point 1", "point 2", "point 3"],
      "relevance_score": 0.95,
      "knowledge_sources": ["source 1", "source 2"],
      "case_studies": ["case study 1", "case study 2"]
    }
  ],
  "recommended_approach": "Overall recommended approach description",
  "competitive_advantages": ["advantage 1", "advantage 2", "advantage 3"],
  "case_study_recommendations": ["recommendation 1", "recommendation 2"],
  "compliance_strategy": ["strategy 1", "strategy 2", "strategy 3"],
  "pricing_strategy": "Pricing strategy description",
  "timeline_strategy": "Timeline strategy description"
}

Focus on UK care sector best practices, CQC standards, and person-centered care approaches.`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ]

    // This is a complex strategy generation task, use primary model
    const response = await generateWithFallback(messages, true)
    
    // Parse the AI response
    const aiStrategy = JSON.parse(response.text)
    
    // Add model information to the strategy
    const strategy: BidStrategy = {
      ...aiStrategy,
      model: response.model,
      fallback: response.fallback
    }

    return strategy

  } catch (error) {
    console.error('AI strategy generation error:', error)
    
    // Fallback to mock strategy if AI fails
    console.log('Falling back to mock strategy due to AI error')
    const mockStrategy: BidStrategy = {
      executive_summary: `This tender presents a strong opportunity to demonstrate our expertise in ${tender_details.title.toLowerCase()}. Our strategy focuses on ${strategy_focus} approach, leveraging our proven track record in the care sector and deep understanding of ${tender_details.issuing_authority || 'the issuing authority'}'s requirements. We will emphasize our CQC-rated Outstanding services, innovative care approaches, and commitment to person-centered care delivery.`,
      
      key_strengths: [
        "CQC Outstanding rating with consistent high-quality care delivery",
        "Comprehensive staff training programs exceeding industry standards",
        "Innovative technology integration for enhanced care monitoring",
        "Strong local partnerships and community engagement",
        "Proven track record of successful contract delivery"
      ],
      
      win_themes: [
        "Quality Excellence: Demonstrating measurable outcomes and continuous improvement",
        "Innovation in Care: Leveraging technology and best practices for enhanced service delivery",
        "Value for Money: Optimized cost-efficiency without compromising quality",
        "Local Expertise: Deep understanding of community needs and local context",
        "Sustainable Partnership: Long-term commitment to service excellence"
      ],
      
      risk_mitigation: [
        "Robust staff recruitment and retention strategies to ensure service continuity",
        "Comprehensive quality assurance systems with regular monitoring and evaluation",
        "Strong financial controls and transparent reporting mechanisms",
        "Emergency contingency plans for service disruption scenarios",
        "Regular stakeholder engagement to maintain positive relationships"
      ],
      
      sections: [
        {
          title: "Service Delivery Excellence",
          content: "Our approach to service delivery centers on person-centered care principles, ensuring each individual receives tailored support that promotes independence, dignity, and wellbeing. We implement evidence-based practices aligned with CQC fundamental standards and maintain rigorous quality assurance processes.",
          bullet_points: [
            "Individualized care planning with regular reviews and updates",
            "Multidisciplinary team approach with clear communication protocols",
            "Continuous professional development for all staff members",
            "Regular service user feedback collection and action planning",
            "Implementation of care technology to enhance service monitoring"
          ],
          relevance_score: 0.95,
          knowledge_sources: ["CQC Inspection Preparation Guide", "Care Plan Templates", "Staff Training Requirements"],
          case_studies: ["Similar contract delivery in neighboring authority", "Outstanding CQC inspection outcomes"]
        },
        {
          title: "Quality Assurance and Compliance",
          content: "We maintain comprehensive quality assurance systems that exceed regulatory requirements, ensuring consistent service excellence and full compliance with all relevant standards including CQC regulations, safeguarding protocols, and data protection requirements.",
          bullet_points: [
            "Monthly quality audits with corrective action plans",
            "Comprehensive safeguarding policies and procedures",
            "GDPR-compliant data management systems",
            "Regular external quality assessments and peer reviews",
            "Transparent reporting and performance monitoring"
          ],
          relevance_score: 0.92,
          knowledge_sources: ["Compliance Monitoring Framework", "Safeguarding Policies", "Data Protection Procedures"],
          case_studies: ["Zero safeguarding incidents track record", "Successful regulatory inspections"]
        },
        {
          title: "Staff Excellence and Development",
          content: "Our workforce strategy focuses on recruiting, developing, and retaining high-quality care professionals through comprehensive training programs, competitive employment packages, and ongoing professional development opportunities.",
          bullet_points: [
            "Comprehensive induction programs for all new staff",
            "Mandatory training refresh cycles with skills assessment",
            "Career progression pathways and leadership development",
            "Competitive remuneration and benefits packages",
            "Staff wellbeing support and recognition programs"
          ],
          relevance_score: 0.88,
          knowledge_sources: ["Staff Training Matrix", "Recruitment Procedures", "Performance Management Framework"],
          case_studies: ["95% staff retention rate achievement", "Award-winning training programs"]
        }
      ],
      
      competitive_advantages: [
        "Market-leading CQC ratings with consistent Outstanding performance",
        "Innovative care technologies providing enhanced service monitoring",
        "Strong local presence with established community partnerships",
        "Comprehensive staff development programs exceeding industry standards",
        "Proven financial stability and contract performance track record"
      ],
      
      case_study_recommendations: [
        "Showcase recent Outstanding CQC inspection highlighting innovative practices",
        "Present successful contract transition with zero service disruption",
        "Demonstrate technology implementation improving care outcomes",
        "Highlight staff development program reducing turnover by 40%",
        "Show partnership working delivering improved community engagement"
      ],
      
      compliance_strategy: [
        "Full adherence to CQC fundamental standards with proactive monitoring",
        "Comprehensive safeguarding framework with regular training updates",
        "GDPR-compliant data management with secure systems and protocols",
        "Health and safety compliance with regular risk assessments",
        "Financial transparency with open-book accounting and regular reporting"
      ],
      
      recommended_approach: "Collaborative Partnership Model: Position CareDraft as a strategic partner focused on delivering exceptional care outcomes through innovation, quality excellence, and sustainable service delivery. Emphasize our track record of regulatory compliance, staff development, and technology integration.",
      
      pricing_strategy: "Value-based pricing model demonstrating cost-effectiveness through quality outcomes, efficiency improvements, and long-term sustainability. Include detailed cost breakdown showing investment in quality improvements and staff development while maintaining competitive pricing.",
      
      timeline_strategy: "Phased implementation approach with clear milestones, risk mitigation points, and contingency planning. Allow adequate time for staff recruitment, training, and service transition while ensuring minimal disruption to existing services.",
      
      model: 'fallback-mock',
      fallback: true
    }

    return mockStrategy
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Strategy Generation API', 
    version: '1.0.0',
    endpoints: {
      POST: 'Generate AI-powered bid strategy for tender'
    }
  })
} 