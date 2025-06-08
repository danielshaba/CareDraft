import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase.client'

// Request validation schema
const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  category_id: z.string().uuid().optional(),
  tags: z.string().optional(),
  is_template: z.coerce.boolean().optional(),
  is_public: z.coerce.boolean().optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  sort_by: z.enum(['relevance', 'created_at', 'updated_at', 'usage_count', 'popularity_score', 'rating']).default('relevance'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  include_content: z.coerce.boolean().default(true)
})

// Helper function to get user context (mock for now)
async function getUserContext(request: NextRequest) {
  // TODO: Implement proper authentication
  return {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id'
  }
}

// Helper function to highlight search terms in text
function highlightSearchTerms(text: string, searchTerms: string[]): string {
  let highlightedText = text
  
  searchTerms.forEach(term => {
    if (term.length >= 3) { // Only highlight terms with 3+ characters
      const regex = new RegExp(`(${term})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
    }
  })
  
  return highlightedText
}

// Helper function to extract search snippet
function extractSnippet(content: string, searchTerms: string[], maxLength: number = 200): string {
  // Find the first occurrence of any search term
  let bestMatch = -1
  let matchedTerm = ''
  
  for (const term of searchTerms) {
    const index = content.toLowerCase().indexOf(term.toLowerCase())
    if (index !== -1 && (bestMatch === -1 || index < bestMatch)) {
      bestMatch = index
      matchedTerm = term
    }
  }
  
  if (bestMatch === -1) {
    // No match found, return beginning of content
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
  }
  
  // Calculate snippet start position
  const snippetStart = Math.max(0, bestMatch - Math.floor(maxLength / 2))
  const snippetEnd = Math.min(content.length, snippetStart + maxLength)
  
  let snippet = content.substring(snippetStart, snippetEnd)
  
  // Add ellipsis if needed
  if (snippetStart > 0) snippet = '...' + snippet
  if (snippetEnd < content.length) snippet = snippet + '...'
  
  return snippet
}

// POST /api/answers/search - Advanced search with filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = searchSchema.parse(body)
    const { 
      query, 
      page, 
      limit, 
      category_id, 
      tags, 
      is_template, 
      is_public, 
      min_rating,
      sort_by, 
      sort_order,
      include_content
    } = validatedData

    const { user_id, organization_id } = await getUserContext(request)
    const supabase = createClient()

    // Prepare search terms for highlighting
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length >= 2)
    
    // Build base query with full-text search
    let searchQuery = supabase
      .from('answer_bank_with_stats')
      .select(`
        id,
        title,
        ${include_content ? 'content,' : ''}
        category_id,
        category_name,
        organization_id,
        created_by,
        created_at,
        updated_at,
        usage_count,
        popularity_score,
        word_count,
        is_template,
        is_public,
        tags,
        metadata,
        avg_rating,
        total_ratings
      `)
      .eq('organization_id', organization_id)

    // Apply full-text search
    searchQuery = searchQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`)

    // Apply additional filters
    if (category_id) searchQuery = searchQuery.eq('category_id', category_id)
    if (is_template !== undefined) searchQuery = searchQuery.eq('is_template', is_template)
    if (is_public !== undefined) searchQuery = searchQuery.eq('is_public', is_public)
    if (min_rating !== undefined) searchQuery = searchQuery.gte('avg_rating', min_rating)
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim())
      searchQuery = searchQuery.overlaps('tags', tagArray)
    }

    // Apply sorting
    switch (sort_by) {
      case 'relevance':
        // For relevance, we'll sort by a combination of factors
        searchQuery = searchQuery.order('popularity_score', { ascending: false })
        break
      case 'rating':
        searchQuery = searchQuery.order('avg_rating', { ascending: sort_order === 'asc' })
        break
      default:
        searchQuery = searchQuery.order(sort_by, { ascending: sort_order === 'asc' })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    searchQuery = searchQuery.range(offset, offset + limit - 1)

    const { data: results, error } = await searchQuery

    if (error) {
      console.error('Error performing search:', error)
      return NextResponse.json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Failed to perform search',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('answer_bank_with_stats')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization_id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)

    // Process results to add search highlights and snippets
    const processedResults = (results || []).map(result => {
      const processed = {
        ...result,
        highlighted_title: highlightSearchTerms(result.title, searchTerms),
        search_snippet: result.content ? extractSnippet(result.content, searchTerms) : null,
        highlighted_snippet: null as string | null,
        relevance_score: calculateRelevanceScore(result, searchTerms)
      }

      if (processed.search_snippet) {
        processed.highlighted_snippet = highlightSearchTerms(processed.search_snippet, searchTerms)
      }

      // Remove full content if not requested
      if (!include_content) {
        delete (processed as any).content
      }

      return processed
    })

    // Re-sort by relevance if that was requested
    if (sort_by === 'relevance') {
      processedResults.sort((a, b) => {
        if (sort_order === 'asc') {
          return a.relevance_score - b.relevance_score
        }
        return b.relevance_score - a.relevance_score
      })
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        results: processedResults,
        search_meta: {
          query,
          total_results: totalCount || 0,
          search_terms: searchTerms,
          filters_applied: {
            category_id,
            tags: tags ? tags.split(',').map(t => t.trim()) : null,
            is_template,
            is_public,
            min_rating
          }
        },
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in POST /api/answers/search:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search parameters',
          details: error.errors,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

// Helper function to calculate relevance score
function calculateRelevanceScore(result: any, searchTerms: string[]): number {
  let score = 0
  
  const title = result.title.toLowerCase()
  const content = (result.content || '').toLowerCase()
  
  // Title matches get higher score
  searchTerms.forEach(term => {
    const termLower = term.toLowerCase()
    
    // Exact title match
    if (title.includes(termLower)) {
      score += 10
    }
    
    // Content match
    const contentMatches = (content.match(new RegExp(termLower, 'g')) || []).length
    score += contentMatches * 2
  })
  
  // Boost based on usage and rating
  score += (result.usage_count || 0) * 0.1
  score += (result.avg_rating || 0) * 2
  score += (result.popularity_score || 0) * 0.5
  
  return score
}

// GET /api/answers/search - Simple search (for compatibility)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: 'Search query parameter "q" or "query" is required',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 })
    }

    // Convert GET params to POST body format
    const searchData = {
      query,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      category_id: searchParams.get('category_id') || undefined,
      tags: searchParams.get('tags') || undefined,
      is_template: searchParams.get('is_template') ? searchParams.get('is_template') === 'true' : undefined,
      is_public: searchParams.get('is_public') ? searchParams.get('is_public') === 'true' : undefined,
      min_rating: searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'relevance',
      sort_order: (searchParams.get('sort_order') as any) || 'desc',
      include_content: searchParams.get('include_content') ? searchParams.get('include_content') === 'true' : true
    }

    // Create a new request object for POST handler
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries())
      },
      body: JSON.stringify(searchData)
    })

    return POST(postRequest)

  } catch (error) {
    console.error('Error in GET /api/answers/search:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
} 