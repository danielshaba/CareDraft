import { NextResponse } from 'next/server'
import { ragService } from '@/lib/services/rag'
import { RAGQueryRequest } from '@/types/rag'

export async function GET() {
  try {
    const body = await request.json()
    
    const queryRequest: RAGQueryRequest = {
      query: body.query,
      options: body.options,
      user_id: body.user_id,
      generate_response: body.generate_response ?? true,
      context_window: body.context_window,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      system_prompt: body.system_prompt
    }

    // Validate required fields
    if (!queryRequest.query || typeof queryRequest.query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query is required and must be a string',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    const response = await ragService.ragQuery(queryRequest)

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error performing RAG query:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RAG_QUERY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to perform RAG query',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
} 