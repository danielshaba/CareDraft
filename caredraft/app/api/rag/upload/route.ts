import { NextRequest, NextResponse } from 'next/server'
import { ragService } from '@/lib/services/rag'
// import { documentProcessor } from '@/lib/services/document-processor'
import { DocumentUploadRequest, DocumentType } from '@/types/rag'

export async function GET(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const tags = formData.get('tags') as string
    const metadata = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File is required',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 50MB limit',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    // Extract text content from file
    let content: string
    try {
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        content = await file.text()
      } else {
        // For now, only support text files
        // In production, you'd add PDF, Word, etc. parsers
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNSUPPORTED_FILE_TYPE',
              message: `File type ${file.type} is not supported yet. Please upload text files (.txt, .md)`,
              timestamp: new Date().toISOString()
            }
          },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_PROCESSING_ERROR',
            message: 'Failed to extract text from file',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    // Determine document type from file extension
    const getDocumentType = (fileName: string): DocumentType => {
      const extension = fileName.split('.').pop()?.toLowerCase()
      switch (extension) {
        case 'pdf': return 'pdf'
        case 'doc':
        case 'docx': return 'word'
        case 'txt': return 'text'
        case 'md':
        case 'markdown': return 'markdown'
        case 'xls':
        case 'xlsx': return 'excel'
        case 'ppt':
        case 'pptx': return 'powerpoint'
        default: return 'other'
      }
    }

    // Parse optional fields
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : []
    const parsedMetadata = metadata ? JSON.parse(metadata) : {}

    const uploadRequest: DocumentUploadRequest = {
      file,
      title: title || file.name.replace(/\.[^/.]+$/, ''), // Remove extension if no title provided
      content,
      document_type: getDocumentType(file.name),
      tags: parsedTags,
      metadata: {
        ...parsedMetadata,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        upload_method: 'file_upload'
      }
    }

    const document = await ragService.uploadDocument(uploadRequest)

    return NextResponse.json({
      success: true,
      data: {
        document,
        message: 'File uploaded successfully. Processing will begin shortly.'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload file',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

// Get upload status and progress
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Document ID is required',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    const document = await ragService.getDocument(documentId)

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
            timestamp: new Date().toISOString()
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        document,
        processing_complete: document.processing_complete || false,
        progress: {
          status: document.processing_status,
          chunks: document.chunk_count || 0,
          embeddings: document.embedding_count || 0,
          total_tokens: document.total_tokens || 0
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting upload status:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get upload status',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
} 