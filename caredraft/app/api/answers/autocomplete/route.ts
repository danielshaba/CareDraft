import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase.client'

// Request validation schema
const autocompleteSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.coerce.number().min(1).max(20).default(8),
  include_categories: z.coerce.boolean().default(true),
  include_tags: z.coerce.boolean().default(true),
  include_titles: z.coerce.boolean().default(true)
})

interface AutocompleteSuggestion {
  type: 'title' | 'category' | 'tag'
  value: string
  label: string
  count?: number
  relevance: number
  metadata?: Record<string, unknown>
}

// Helper function to get user context (mock for now)
async function getUserContext() {
  // TODO: Implement proper authentication
  return {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id'
  }
}

// POST /api/answers/autocomplete - Get search suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = autocompleteSchema.parse(body)
    const { query, limit, include_categories, include_tags, include_titles } = validatedData

    const { organization_id } = await getUserContext()
    const supabase = createClient()

    const suggestions: AutocompleteSuggestion[] = []
    const queryLower = query.toLowerCase()

    // Get title suggestions from answers
    if (include_titles) {
      const { data: titleResults, error: titleError } = await supabase
        .from('answer_bank')
        .select('title, usage_count')
        .eq('organization_id', organization_id)
        .ilike('title', `%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(Math.ceil(limit * 0.6)) // Allocate 60% to titles

      if (!titleError && titleResults) {
        titleResults.forEach(result => {
          const relevance = calculateTitleRelevance(result.title, queryLower, result.usage_count || 0, 0)
          suggestions.push({
            type: 'title',
            value: result.title,
            label: result.title,
            relevance,
            metadata: {
              usage_count: result.usage_count
            }
          })
        })
      }
    }

    // Get category suggestions (mock data for now)
    if (include_categories) {
      const mockCategories = [
        { name: 'Technical', color: '#3B82F6' },
        { name: 'Compliance', color: '#EF4444' },
        { name: 'Social Value', color: '#10B981' },
        { name: 'Commercial', color: '#8B5CF6' },
        { name: 'Operations', color: '#F59E0B' }
      ]

      const matchingCategories = mockCategories.filter(cat => 
        cat.name.toLowerCase().includes(queryLower)
      )

      matchingCategories.forEach(result => {
        const relevance = calculateCategoryRelevance(result.name, queryLower)
        suggestions.push({
          type: 'category',
          value: result.name,
          label: `📁 ${result.name}`,
          relevance,
          metadata: {
            color: result.color
          }
        })
      })
    }

    // Get tag suggestions (mock data for now)
    if (include_tags) {
      const mockTags = [
        { tag: 'innovation', count: 15 },
        { tag: 'sustainability', count: 12 },
        { tag: 'digital-transformation', count: 8 },
        { tag: 'community-engagement', count: 10 },
        { tag: 'cost-savings', count: 6 }
      ]

      const matchingTags = mockTags.filter(tag => 
        tag.tag.toLowerCase().includes(queryLower)
      )

      matchingTags.forEach((result: { tag: string; count: number }) => {
        const relevance = calculateTagRelevance(result.tag, queryLower, result.count)
        suggestions.push({
          type: 'tag',
          value: result.tag,
          label: `🏷️ ${result.tag}`,
          count: result.count,
          relevance,
          metadata: {
            usage_count: result.count
          }
        })
      })
    }

    // Sort by relevance and limit results
    const sortedSuggestions = suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        suggestions: sortedSuggestions,
        query,
        total_suggestions: suggestions.length,
        metadata: {
          categories_included: include_categories,
          tags_included: include_tags,
          titles_included: include_titles
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in POST /api/answers/autocomplete:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid autocomplete parameters',
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

// GET /api/answers/autocomplete - Simple autocomplete interface
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: 'Query parameter "q" or "query" is required',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 })
    }

    // Convert GET params to POST body format
    const autocompleteData = {
      query,
      limit: parseInt(searchParams.get('limit') || '8'),
      include_categories: searchParams.get('include_categories') !== 'false',
      include_tags: searchParams.get('include_tags') !== 'false',
      include_titles: searchParams.get('include_titles') !== 'false'
    }

    // Create a new request object for POST handler
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries())
      },
      body: JSON.stringify(autocompleteData)
    })

    return POST(postRequest)

  } catch (error) {
    console.error('Error in GET /api/answers/autocomplete:', error)
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

// Helper function to calculate title relevance
function calculateTitleRelevance(title: string, query: string, usageCount: number, avgRating: number): number {
  let score = 0
  
  const titleLower = title.toLowerCase()
  
  // Exact match gets highest score
  if (titleLower === query) {
    score += 100
  } else if (titleLower.startsWith(query)) {
    score += 80
  } else if (titleLower.includes(query)) {
    score += 60
  }
  
  // Boost based on usage and rating
  score += Math.min(usageCount * 2, 20) // Cap usage boost at 20
  score += (avgRating || 0) * 5
  
  return score
}

// Helper function to calculate category relevance
function calculateCategoryRelevance(categoryName: string, query: string): number {
  let score = 0
  
  const categoryLower = categoryName.toLowerCase()
  
  if (categoryLower === query) {
    score += 100
  } else if (categoryLower.startsWith(query)) {
    score += 80
  } else if (categoryLower.includes(query)) {
    score += 60
  }
  
  // Categories get a slight boost as they're organizational tools
  score += 10
  
  return score
}

// Helper function to calculate tag relevance
function calculateTagRelevance(tag: string, query: string, count: number): number {
  let score = 0
  
  const tagLower = tag.toLowerCase()
  
  if (tagLower === query) {
    score += 100
  } else if (tagLower.startsWith(query)) {
    score += 80
  } else if (tagLower.includes(query)) {
    score += 60
  }
  
  // Boost based on tag popularity
  score += Math.min(count * 3, 15) // Cap tag boost at 15
  
  return score
} 