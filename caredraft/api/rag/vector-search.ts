import { NextRequest, NextResponse } from 'next/server'
import { vectorStorage } from '@/lib/services/vector-storage'
import { embeddingService } from '@/lib/services/embedding-service'
import { SearchOptions } from '@/types/rag'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      query, 
      search_type = 'hybrid',
      options = {} 
    }: {
      query: string
      search_type?: 'semantic' | 'keyword' | 'hybrid'
      options?: SearchOptions & {
        keyword_weight?: number
        semantic_weight?: number
      }
    } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    let results = []

    switch (search_type) {
      case 'semantic': {
        // Generate embedding and search
        const embeddingResponse = await embeddingService.generateEmbedding({ text: query })
        results = await vectorStorage.searchVectors(embeddingResponse.embedding, options)
        break
      }
      
      case 'keyword': {
        // Perform keyword search only
        results = await vectorStorage.hybridSearch(query, {
          ...options,
          semantic_weight: 0,
          keyword_weight: 1
        })
        break
      }
      
      case 'hybrid':
      default: {
        // Perform hybrid search combining semantic and keyword
        results = await vectorStorage.hybridSearch(query, options)
        break
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        search_type,
        query,
        total_results: results.length,
        processing_time_ms: Date.now() - parseInt(request.headers.get('x-start-time') || '0')
      }
    })

  } catch (error) {
    console.error('Vector search API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform vector search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'stats': {
        // Get vector index statistics
        const indexStats = await vectorStorage.getIndexStats()
        const vectorCount = await vectorStorage.getVectorCount()
        
        return NextResponse.json({
          success: true,
          data: {
            ...indexStats,
            total_vectors: vectorCount
          }
        })
      }

      case 'health': {
        // Health check for vector search system
        try {
          const testEmbedding = await embeddingService.generateEmbedding({ 
            text: 'health check test' 
          })
          
          const testResults = await vectorStorage.searchVectors(testEmbedding.embedding, {
            max_results: 1,
            similarity_threshold: 0.1
          })

          return NextResponse.json({
            success: true,
            data: {
              status: 'healthy',
              embedding_service: 'operational',
              vector_storage: 'operational',
              test_search_results: testResults.length
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

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Vector search GET API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 