import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase.client'

// Request validation schemas
const updateAnswerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  category_id: z.string().uuid('Invalid category ID').optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  is_template: z.boolean().optional(),
  is_public: z.boolean().optional()
})

// Helper function to get user context (mock for now)
async function getUserContext(request: NextRequest) {
  // TODO: Implement proper authentication
  return {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id'
  }
}

// GET /api/answers/[id] - Get single answer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user_id, organization_id } = await getUserContext(request)
    
    // Validate UUID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid answer ID format',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 })
    }

    const supabase = createClient()

    // Get answer with stats
    const { data: answer, error } = await supabase
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
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single()

    if (error || !answer) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Answer not found or not accessible',
          timestamp: new Date().toISOString()
        }
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: answer,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in GET /api/answers/[id]:', error)
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

// PUT /api/answers/[id] - Update answer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateAnswerSchema.parse(body)
    const { user_id, organization_id } = await getUserContext(request)

    // Validate UUID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid answer ID format',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 })
    }

    const supabase = createClient()

    // Check if answer exists and user has permission
    const { data: existingAnswer, error: fetchError } = await supabase
      .from('answer_bank')
      .select('id, created_by, organization_id')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single()

    if (fetchError || !existingAnswer) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Answer not found or not accessible',
          timestamp: new Date().toISOString()
        }
      }, { status: 404 })
    }

    // Check permissions (owner or admin can edit)
    if (existingAnswer.created_by !== user_id) {
      // TODO: Add proper role-based permission check
      return NextResponse.json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to edit this answer',
          timestamp: new Date().toISOString()
        }
      }, { status: 403 })
    }

    // Validate category exists if provided
    if (validatedData.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('answer_bank_categories')
        .select('id')
        .eq('id', validatedData.category_id)
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

    // Update the answer
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    }

    const { data: updatedAnswer, error: updateError } = await supabase
      .from('answer_bank')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization_id)
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

    if (updateError) {
      console.error('Error updating answer:', updateError)
      return NextResponse.json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update answer',
          details: updateError.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedAnswer,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in PUT /api/answers/[id]:', error)

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

// DELETE /api/answers/[id] - Delete answer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user_id, organization_id } = await getUserContext(request)

    // Validate UUID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid answer ID format',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 })
    }

    const supabase = createClient()

    // Check if answer exists and user has permission
    const { data: existingAnswer, error: fetchError } = await supabase
      .from('answer_bank')
      .select('id, created_by, organization_id, title')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single()

    if (fetchError || !existingAnswer) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Answer not found or not accessible',
          timestamp: new Date().toISOString()
        }
      }, { status: 404 })
    }

    // Check permissions (owner or admin can delete)
    if (existingAnswer.created_by !== user_id) {
      // TODO: Add proper role-based permission check
      return NextResponse.json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to delete this answer',
          timestamp: new Date().toISOString()
        }
      }, { status: 403 })
    }

    // Delete the answer (cascading deletes will handle related records)
    const { error: deleteError } = await supabase
      .from('answer_bank')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization_id)

    if (deleteError) {
      console.error('Error deleting answer:', deleteError)
      return NextResponse.json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete answer',
          details: deleteError.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Answer "${existingAnswer.title}" deleted successfully`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in DELETE /api/answers/[id]:', error)
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