import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { AITenderParser } from '@/lib/services/ai-tender-parser'

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
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF, Word, or text files.' 
      }, { status: 400 })
    }

    // Validate file size (10MB limit for processing)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large for processing. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    console.log(`Starting AI parsing for file: ${file.name} (${file.size} bytes)`)

    // Parse document with AI
    const parser = new AITenderParser()
    const parsedData = await parser.parseTenderDocument(file)

    console.log(`AI parsing completed for ${file.name} with confidence: ${parsedData.confidence}%`)

    return NextResponse.json({
      success: true,
      parsedData,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        processedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in AI document parsing:', error)
    
    // Return a structured error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({ 
      error: 'Document parsing failed',
      details: errorMessage,
      fallback: true
    }, { status: 500 })
  }
} 