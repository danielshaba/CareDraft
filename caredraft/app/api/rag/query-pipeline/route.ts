import { NextRequest, NextResponse } from 'next/server'
import { ragQueryPipeline, RAGQueryRequest } from '@/lib/services/rag-query-pipeline'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const limitResult = await rateLimit(request, rateLimitConfigs.ai)
    
    if (!limitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          details: 'Too many requests. Please try again later.',
          retryAfter: limitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitResult.limit.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
            'Retry-After': limitResult.retryAfter?.toString() || '60'
          }
        }
      )
    }

    const body = await request.json()
    const {
      query,
      context,
      search_options = {},
      generation_options = {}
    }: RAGQueryRequest = body

    // Validate required fields
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (query.length > 1000) {
      return NextResponse.json(
        { error: 'Query is too long. Maximum length is 1000 characters.' },
        { status: 400 }
      )
    }

    // Process the RAG query
    const result = await ragQueryPipeline.processQuery({
      query: query.trim(),
      context,
      search_options: {
        max_results: Math.min(search_options.max_results || 5, 20), // Cap at 20
        similarity_threshold: search_options.similarity_threshold || 0.6,
        document_types: search_options.document_types,
        date_range: search_options.date_range,
        include_metadata: search_options.include_metadata ?? true,
        hybrid_weight: search_options.hybrid_weight,
        rerank_results: search_options.rerank_results ?? true,
        include_citations: search_options.include_citations ?? true
      },
      generation_options: {
        max_tokens: Math.min(generation_options.max_tokens || 500, 1000), // Cap at 1000
        temperature: Math.max(0, Math.min(generation_options.temperature || 0.7, 1)), // 0-1 range
        model: generation_options.model,
        system_prompt: generation_options.system_prompt,
        response_format: generation_options.response_format || 'detailed'
      }
    })

    // Add response headers
    const responseHeaders = {
      'X-RateLimit-Limit': limitResult.limit.toString(),
      'X-RateLimit-Remaining': limitResult.remaining.toString(),
      'X-Processing-Time': result.processing_time_ms.toString(),
      'X-Confidence-Score': result.confidence_score.toString()
    }

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('RAG query pipeline API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const query = searchParams.get('query')

    switch (action) {
      case 'suggestions': {
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required for suggestions' },
            { status: 400 }
          )
        }

        const suggestions = await ragQueryPipeline.getQuerySuggestions(query)
        
        return NextResponse.json({
          success: true,
          data: {
            suggestions,
            query
          }
        })
      }

      case 'health': {
        // Health check for the RAG query pipeline
        try {
          const testResult = await ragQueryPipeline.processQuery({
            query: 'health check test',
            search_options: { max_results: 1 },
            generation_options: { max_tokens: 50 }
          })

          return NextResponse.json({
            success: true,
            data: {
              status: 'healthy',
              pipeline_operational: testResult.success,
              test_processing_time: testResult.processing_time_ms,
              test_confidence: testResult.confidence_score
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            data: {
              status: 'unhealthy',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
        }
      }

      case 'stats': {
        // Return pipeline statistics
        return NextResponse.json({
          success: true,
          data: {
            pipeline_version: '1.0.0',
            supported_formats: ['detailed', 'concise', 'bullet_points'],
            max_query_length: 1000,
            max_results: 20,
            max_tokens: 1000,
            rate_limit: '30 requests per minute'
          }
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('RAG query pipeline GET API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 