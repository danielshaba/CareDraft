import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase.client'

// Request validation schema
const rateAnswerSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(500, 'Comment must be less than 500 characters').optional()
})

// Helper function to get user context (mock for now)
async function getUserContext(request: NextRequest) {
  // TODO: Implement proper authentication
  return {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id'
  }
}

// POST /api/answers/[id]/rate - Rate an answer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = rateAnswerSchema.parse(body)
    const { rating, comment } = validatedData
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

    // Verify answer exists and is accessible
    const { data: answer, error: answerError } = await supabase
      .from('answer_bank')
      .select('id, title, organization_id')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single()

    if (answerError || !answer) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Answer not found or not accessible',
          timestamp: new Date().toISOString()
        }
      }, { status: 404 })
    }

    // Check if user has already rated this answer
    const { data: existingRating, error: checkError } = await supabase
      .from('answer_bank_ratings')
      .select('id, rating')
      .eq('answer_id', id)
      .eq('user_id', user_id)
      .eq('organization_id', organization_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing rating:', checkError)
      return NextResponse.json({
        success: false,
        error: {
          code: 'CHECK_ERROR',
          message: 'Failed to check existing rating',
          details: checkError.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    let ratingRecord
    let isUpdate = false

    if (existingRating) {
      // Update existing rating
      const { data: updatedRating, error: updateError } = await supabase
        .from('answer_bank_ratings')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Error updating rating:', updateError)
        return NextResponse.json({
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update rating',
            details: updateError.message,
            timestamp: new Date().toISOString()
          }
        }, { status: 500 })
      }

      ratingRecord = updatedRating
      isUpdate = true
    } else {
      // Create new rating
      const { data: newRating, error: createError } = await supabase
        .from('answer_bank_ratings')
        .insert({
          answer_id: id,
          user_id,
          organization_id,
          rating,
          comment
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Error creating rating:', createError)
        return NextResponse.json({
          success: false,
          error: {
            code: 'CREATE_ERROR',
            message: 'Failed to create rating',
            details: createError.message,
            timestamp: new Date().toISOString()
          }
        }, { status: 500 })
      }

      ratingRecord = newRating
      isUpdate = false
    }

    // Update answer popularity score
    const { error: popularityError } = await supabase
      .rpc('update_answer_popularity_score', { answer_id: id })

    if (popularityError) {
      console.warn('Failed to update popularity score:', popularityError)
      // Don't fail the request for this, just log it
    }

    return NextResponse.json({
      success: true,
      data: {
        rating_id: ratingRecord.id,
        answer_id: id,
        answer_title: answer.title,
        rating: ratingRecord.rating,
        comment: ratingRecord.comment,
        is_update: isUpdate,
        rated_at: ratingRecord.created_at
      },
      message: isUpdate ? 'Rating updated successfully' : 'Rating created successfully',
      timestamp: new Date().toISOString()
    }, { status: isUpdate ? 200 : 201 })

  } catch (error) {
    console.error('Error in POST /api/answers/[id]/rate:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid rating data',
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

// GET /api/answers/[id]/rate - Get ratings for an answer
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

    // Verify answer exists and is accessible
    const { data: answer, error: answerError } = await supabase
      .from('answer_bank_with_stats')
      .select('id, title, avg_rating, total_ratings, organization_id')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single()

    if (answerError || !answer) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Answer not found or not accessible',
          timestamp: new Date().toISOString()
        }
      }, { status: 404 })
    }

    // Get all ratings for this answer
    const { data: ratings, error: ratingsError } = await supabase
      .from('answer_bank_ratings')
      .select('rating, comment, created_at, updated_at, user_id')
      .eq('answer_id', id)
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError)
      return NextResponse.json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch ratings',
          details: ratingsError.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // Get user's own rating
    const userRating = ratings?.find(r => r.user_id === user_id)

    // Calculate rating distribution
    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    }

    ratings?.forEach(rating => {
      ratingDistribution[rating.rating as keyof typeof ratingDistribution]++
    })

    // Remove user_id from ratings for privacy (except user's own rating)
    const sanitizedRatings = ratings?.map(rating => ({
      rating: rating.rating,
      comment: rating.comment,
      created_at: rating.created_at,
      updated_at: rating.updated_at,
      is_own: rating.user_id === user_id
    }))

    return NextResponse.json({
      success: true,
      data: {
        answer_id: id,
        answer_title: answer.title,
        summary: {
          average_rating: answer.avg_rating || 0,
          total_ratings: answer.total_ratings || 0,
          rating_distribution: ratingDistribution
        },
        user_rating: userRating ? {
          rating: userRating.rating,
          comment: userRating.comment,
          created_at: userRating.created_at,
          updated_at: userRating.updated_at
        } : null,
        all_ratings: sanitizedRatings || []
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in GET /api/answers/[id]/rate:', error)
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

// DELETE /api/answers/[id]/rate - Remove user's rating
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

    // Find and delete user's rating
    const { data: deletedRating, error: deleteError } = await supabase
      .from('answer_bank_ratings')
      .delete()
      .eq('answer_id', id)
      .eq('user_id', user_id)
      .eq('organization_id', organization_id)
      .select('id, rating')
      .single()

    if (deleteError || !deletedRating) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No rating found to delete',
          timestamp: new Date().toISOString()
        }
      }, { status: 404 })
    }

    // Update answer popularity score
    const { error: popularityError } = await supabase
      .rpc('update_answer_popularity_score', { answer_id: id })

    if (popularityError) {
      console.warn('Failed to update popularity score:', popularityError)
      // Don't fail the request for this, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Rating removed successfully',
      data: {
        deleted_rating_id: deletedRating.id,
        answer_id: id
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in DELETE /api/answers/[id]/rate:', error)
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