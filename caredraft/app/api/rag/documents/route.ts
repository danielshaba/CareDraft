import { NextRequest, NextResponse } from 'next/server'
import { ragService } from '@/lib/services/rag'
import { DocumentUploadRequest } from '@/types/rag'

export async function GET() {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const result = await ragService.listDocuments({
      page,
      limit,
      type,
      status,
      search
    })

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error listing documents:', error)
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'DOCUMENT_LIST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list documents',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const uploadRequest: DocumentUploadRequest = {
      title: body.title,
      content: body.content,
      document_type: body.document_type,
      tags: body.tags,
      metadata: body.metadata,
      source_url: body.source_url
    }

    // Validate required fields
    if (!uploadRequest.title || !uploadRequest.content) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title and content are required',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    const document = await ragService.uploadDocument(uploadRequest)

    return NextResponse.json({
      success: true,
      data: document,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DOCUMENT_UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload document',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
} 