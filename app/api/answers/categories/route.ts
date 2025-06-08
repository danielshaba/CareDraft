import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase.client'

// Request validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  icon: z.string().optional(),
  sort_order: z.number().optional()
})

const listCategoriesSchema = z.object({
  include_counts: z.coerce.boolean().default(false)
})

// Helper function to get user context (mock for now)
async function getUserContext(request: NextRequest) {
  // TODO: Implement proper authentication
  return {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id'
  }
}

// GET /api/answers/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = listCategoriesSchema.parse(params)
    const { include_counts } = validatedParams

    const { user_id, organization_id } = await getUserContext(request)
    const supabase = createClient()

    let query = supabase
      .from('answer_bank_categories')
      .select('*')
      .eq('organization_id', organization_id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch categories',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // If counts are requested, get answer counts for each category
    let categoriesWithCounts = categories || []
    
    if (include_counts && categories && categories.length > 0) {
      const categoryIds = categories.map(cat => cat.id)
      
      const { data: answerCounts, error: countError } = await supabase
        .from('answer_bank')
        .select('category_id')
        .eq('organization_id', organization_id)
        .in('category_id', categoryIds)

      if (!countError && answerCounts) {
        const countMap = answerCounts.reduce((acc, answer) => {
          acc[answer.category_id] = (acc[answer.category_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        categoriesWithCounts = categories.map(category => ({
          ...category,
          answer_count: countMap[category.id] || 0
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: categoriesWithCounts,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in GET /api/answers/categories:', error)

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

// POST /api/answers/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)
    const { name, description, color, icon, sort_order } = validatedData

    const { user_id, organization_id } = await getUserContext(request)
    const supabase = createClient()

    // Check if category name already exists in the organization
    const { data: existingCategory, error: checkError } = await supabase
      .from('answer_bank_categories')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('name', name)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing category:', checkError)
      return NextResponse.json({
        success: false,
        error: {
          code: 'CHECK_ERROR',
          message: 'Failed to check existing categories',
          details: checkError.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    if (existingCategory) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DUPLICATE_NAME',
          message: 'A category with this name already exists',
          timestamp: new Date().toISOString()
        }
      }, { status: 409 })
    }

    // Get next sort order if not provided
    let finalSortOrder = sort_order
    if (finalSortOrder === undefined) {
      const { data: maxSort } = await supabase
        .from('answer_bank_categories')
        .select('sort_order')
        .eq('organization_id', organization_id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      finalSortOrder = (maxSort?.sort_order || 0) + 10
    }

    // Create the category
    const { data: category, error } = await supabase
      .from('answer_bank_categories')
      .insert({
        name,
        description,
        color,
        icon,
        sort_order: finalSortOrder,
        organization_id,
        created_by: user_id
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create category',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: category,
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/answers/categories:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid category data',
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