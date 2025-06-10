import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF, Word, or Excel files.' 
      }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
    const filePath = `tender-documents/${user.id}/${uniqueFilename}`

    // Upload to Supabase Storage
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from('tender-uploads')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get file URL
    const { data: urlData } = supabase.storage
      .from('tender-uploads')
      .getPublicUrl(filePath)

    // Store document record
    const { data: documentRecord, error: dbError } = await supabase
      .from('tender_documents')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        status: 'uploaded'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('tender-uploads').remove([filePath])
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    // Start AI parsing (simulate)
    const parsedData = await simulateAIParsing(file)

    // Update document with parsed data
    const { error: updateError } = await supabase
      .from('tender_documents')
      .update({
        status: 'parsed',
        parsed_metadata: parsedData
      })
      .eq('id', documentRecord.id)

    if (updateError) {
      console.error('Error updating document with parsed data:', updateError)
    }

    return NextResponse.json({
      success: true,
      document: {
        ...documentRecord,
        parsed_metadata: parsedData
      }
    })

  } catch (error) {
    console.error('Error in document upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Simulate AI parsing function
async function simulateAIParsing(file: File) {
  // In production, this would use a real AI service like OpenAI, Anthropic, or AWS Textract
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Mock parsed data based on filename
  const filename = file.name.toLowerCase()
  
  const mockData = {
    title: filename.includes('nhs') ? 'NHS Community Care Services - Yorkshire Region' :
           filename.includes('council') ? 'Social Care Services Framework Agreement' :
           filename.includes('health') ? 'Healthcare Support Services Contract' :
           'Government Services Procurement',
    
    issuing_authority: filename.includes('nhs') ? 'NHS Yorkshire and Humber ICB' :
                      filename.includes('council') ? 'Birmingham City Council' :
                      filename.includes('health') ? 'Department of Health and Social Care' :
                      'Central Government Procurement',
    
    contract_value: Math.floor(Math.random() * 5000000 + 1000000),
    
    region: filename.includes('yorkshire') ? 'Yorkshire' :
           filename.includes('birmingham') ? 'Birmingham' :
           filename.includes('london') ? 'London' :
           filename.includes('manchester') ? 'Manchester' :
           'National',
    
    deadline: new Date(Date.now() + (30 + Math.floor(Math.random() * 60)) * 24 * 60 * 60 * 1000).toISOString(),
    
    description: `Comprehensive ${filename.includes('care') ? 'care' : 'support'} services including assessment, planning, and delivery of support packages for ${filename.includes('elderly') ? 'elderly residents' : 'vulnerable adults'}.`,
    
    evaluation_criteria: [
      { criteria: 'Technical Quality', weight: 40 },
      { criteria: 'Commercial', weight: 30 },
      { criteria: 'Social Value', weight: 20 },
      { criteria: 'Experience', weight: 10 }
    ],
    
    compliance_requirements: [
      filename.includes('nhs') ? 'CQC Registration Required' : 'Regulatory Compliance Required',
      'Public Liability Insurance (£10M minimum)',
      'DBS Checks for all staff',
      'ISO 9001 Quality Management',
      filename.includes('health') ? 'Information Governance Toolkit' : 'Data Protection Compliance'
    ],
    
    key_dates: [
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Clarification Questions Deadline'
      },
      {
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Site Visit Deadline'
      },
      {
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Submission Deadline'
      }
    ]
  }

  return mockData
} 