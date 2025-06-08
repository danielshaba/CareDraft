import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase.client'

// Request validation schemas
const createAnswerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  content: z.string().min(1, 'Content is required'),
  category_id: z.string().uuid('Invalid category ID').optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  is_template: z.boolean().default(false),
  is_public: z.boolean().default(false)
})

const listAnswersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category_id: z.string().uuid().optional(),
  search: z.string().optional(),
  tags: z.string().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'usage_count', 'popularity_score']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  is_template: z.coerce.boolean().optional(),
  is_public: z.coerce.boolean().optional()
})

// Helper function to get user context (mock for now)
async function getUserContext(request: NextRequest) {
  // TODO: Implement proper authentication
  return {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id'
  }
}

// GET /api/answers - List answers with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validatedParams = listAnswersSchema.parse(params)
    const { page, limit, category_id, search, tags, sort_by, sort_order, is_template, is_public } = validatedParams

    const { user_id, organization_id } = await getUserContext(request)
    const supabase = createClient()
    
    // Build query
    let query = supabase
      .from('answer_bank_with_stats')
      .select(`
        id,
        title,
        content,
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

    // Apply filters
    if (category_id) query = query.eq('category_id', category_id)
    if (is_template !== undefined) query = query.eq('is_template', is_template)
    if (is_public !== undefined) query = query.eq('is_public', is_public)
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim())
      query = query.overlaps('tags', tagArray)
    }

    // Apply sorting and pagination
    query = query.order(sort_by, { ascending: sort_order === 'asc' })
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: answers, error } = await query

    if (error) {
      console.error('Error fetching answers:', error)
      return NextResponse.json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch answers',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('answer_bank')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization_id)

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        answers: answers || [],
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
    console.error('Error in GET /api/answers:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
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

// POST /api/answers - Create new answer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAnswerSchema.parse(body)
    const { title, content, category_id, tags, metadata, is_template, is_public } = validatedData

    const { user_id, organization_id } = await getUserContext(request)
    const supabase = createClient()

    // Validate category exists if provided
    if (category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('answer_bank_categories')
        .select('id')
        .eq('id', category_id)
        .eq('organization_id', organization_id)
        .single()

      if (categoryError || !category) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Category not found or not accessible',
            timestamp: new Date().toISOString()
          }
        }, { status: 400 })
      }
    }

    // Create the answer
    const { data: answer, error } = await supabase
      .from('answer_bank')
      .insert({
        title,
        content,
        category_id,
        organization_id,
        created_by: user_id,
        tags: tags || [],
        metadata: metadata || {},
        is_template,
        is_public
      })
      .select(`
        id,
        title,
        content,
        category_id,
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
        metadata
      `)
      .single()

    if (error) {
      console.error('Error creating answer:', error)
      return NextResponse.json({
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create answer',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: answer,
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/answers:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
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