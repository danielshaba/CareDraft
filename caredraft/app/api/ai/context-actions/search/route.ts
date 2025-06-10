import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { KnowledgeSearchService, SearchQuery } from '@/lib/services/knowledge-search'
import { AIError } from '@/lib/errors'

const searchRequestSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  context_text: z.string().optional(),
  search_scope: z.enum(['knowledge_base', 'web', 'both']).default('knowledge_base'),
  result_limit: z.number().min(1).max(20).default(5),
  include_summaries: z.boolean().default(true),
  content_types: z.array(z.string()).optional()
})

const searchResponseSchema = z.object({
  search_results: z.array(z.object({
    id: z.string(),
    title: z.string(),
    excerpt: z.string(),
    type: z.string(),
    source: z.string(),
    relevance_score: z.number(),
    url: z.string().optional()
  })),
  ai_summary: z.string().optional(),
  suggested_queries: z.array(z.string()).optional(),
  total_results: z.number(),
  search_time_ms: z.number(),
  context_integration: z.object({
    related_content: z.array(z.string()),
    context_relevance: z.number().min(0).max(100)
  }).optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, context_text, search_scope, result_limit, include_summaries, content_types } = searchRequestSchema.parse(body)

    const searchService = KnowledgeSearchService.getInstance()
    
    // Prepare search query with enhanced context
    const enhancedQuery = context_text ? 
      `${query} (Context: ${context_text.substring(0, 200)}...)` : 
      query

    const searchQueryParams: SearchQuery = {
      query: enhancedQuery,
      useLibraryAI: search_scope === 'knowledge_base' || search_scope === 'both',
      useInternetAI: search_scope === 'web' || search_scope === 'both',
      filters: {
        contentType: content_types?.join(',') || 'all',
        dateRange: 'all',
        source: 'all',
        sortBy: 'relevance',
        tags: []
      }
    }

    // Perform search
    const searchResponse = await searchService.search(searchQueryParams)

    // Limit results
    const limitedResults = searchResponse.results.slice(0, result_limit)

    // Transform results to match our schema
    const transformedResults = limitedResults.map(result => ({
      id: result.id,
      title: result.title,
      excerpt: result.excerpt,
      type: result.type,
      source: result.source,
      relevance_score: result.relevanceScore,
      url: result.url
    }))

    // Calculate context integration if context text provided
    let contextIntegration
    if (context_text && limitedResults.length > 0) {
      const relatedContent = limitedResults
        .filter(result => result.relevanceScore > 0.6)
        .map(result => result.title)
        .slice(0, 3)
      
      const contextRelevance = Math.round(
        limitedResults.reduce((acc, result) => acc + result.relevanceScore, 0) / 
        limitedResults.length * 100
      )

      contextIntegration = {
        related_content: relatedContent,
        context_relevance: contextRelevance
      }
    }

    const validatedResponse = searchResponseSchema.parse({
      search_results: transformedResults,
      ai_summary: include_summaries ? searchResponse.aiSummary : undefined,
      suggested_queries: searchResponse.suggestedQueries,
      total_results: searchResponse.totalCount,
      search_time_ms: searchResponse.searchTime,
      context_integration: contextIntegration
    })

    return NextResponse.json({
      success: true,
      data: validatedResponse,
      metadata: {
        search_scope,
        enhanced_query: enhancedQuery !== query,
        processing_time_ms: Date.now()
      }
    })

  } catch (error) {
    console.error('Search error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof AIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to perform search' },
      { status: 500 }
    )
  }
} 