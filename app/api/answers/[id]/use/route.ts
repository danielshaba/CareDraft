import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase.client'

// Request validation schema
const trackUsageSchema = z.object({
  context: z.enum(['proposal_draft', 'brainstorm', 'template', 'copy_paste', 'reference']),
  proposal_id: z.string().uuid().optional(),
  section_type: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// Helper function to get user context (mock for now)
async function getUserContext(request: NextRequest) {
  // TODO: Implement proper authentication
  return {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id'
  }
}

// POST /api/answers/[id]/use - Track usage of an answer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = trackUsageSchema.parse(body)
    const { context, proposal_id, section_type, metadata } = validatedData
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

    // Track the usage
    const { data: usageRecord, error: usageError } = await supabase
      .from('answer_bank_usage_tracking')
      .insert({
        answer_id: id,
        user_id,
        organization_id,
        context,
        proposal_id,
        section_type,
        metadata: metadata || {},
        used_at: new Date().toISOString()
      })
      .select('id, used_at')
      .single()

    if (usageError) {
      console.error('Error tracking usage:', usageError)
      return NextResponse.json({
        success: false,
        error: {
          code: 'TRACKING_ERROR',
          message: 'Failed to track usage',
          details: usageError.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // Increment usage count and update popularity score
    const { error: incrementError } = await supabase
      .rpc('increment_answer_usage', { answer_id: id })

    if (incrementError) {
      console.warn('Failed to increment usage count:', incrementError)
      // Don't fail the request for this, just log it
    }

    return NextResponse.json({
      success: true,
      data: {
        usage_id: usageRecord.id,
        answer_id: id,
        answer_title: answer.title,
        context,
        tracked_at: usageRecord.used_at
      },
      message: 'Usage tracked successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in POST /api/answers/[id]/use:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid usage tracking data',
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

// GET /api/answers/[id]/use - Get usage statistics for an answer
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
      .from('answer_bank')
      .select('id, title, usage_count, popularity_score, organization_id')
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

    // Get usage breakdown by context
    const { data: usageBreakdown, error: breakdownError } = await supabase
      .from('answer_bank_usage_tracking')
      .select('context, used_at')
      .eq('answer_id', id)
      .eq('organization_id', organization_id)
      .order('used_at', { ascending: false })
      .limit(100) // Limit to recent usages

    if (breakdownError) {
      console.error('Error fetching usage breakdown:', breakdownError)
      return NextResponse.json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch usage statistics',
          details: breakdownError.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // Calculate context breakdown
    const contextBreakdown = (usageBreakdown || []).reduce((acc, usage) => {
      acc[usage.context] = (acc[usage.context] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get recent usage (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentUsages = (usageBreakdown || []).filter(usage => 
      new Date(usage.used_at) >= thirtyDaysAgo
    )

    return NextResponse.json({
      success: true,
      data: {
        answer_id: id,
        answer_title: answer.title,
        total_usage_count: answer.usage_count || 0,
        popularity_score: answer.popularity_score || 0,
        usage_breakdown: {
          by_context: contextBreakdown,
          recent_count: recentUsages.length,
          recent_usages: recentUsages.slice(0, 10) // Last 10 usages
        },
        statistics: {
          most_used_context: Object.keys(contextBreakdown).reduce((a, b) => 
            contextBreakdown[a] > contextBreakdown[b] ? a : b, 
            Object.keys(contextBreakdown)[0]
          ),
          usage_frequency: calculateUsageFrequency(usageBreakdown || [])
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in GET /api/answers/[id]/use:', error)
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

// Helper function to calculate usage frequency
function calculateUsageFrequency(usages: Array<{ used_at: string }>): string {
  if (usages.length === 0) return 'never'
  if (usages.length === 1) return 'once'

  const now = new Date()
  const firstUsage = new Date(Math.min(...usages.map(u => new Date(u.used_at).getTime())))
  const daysSinceFirst = Math.ceil((now.getTime() - firstUsage.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSinceFirst === 0) return 'multiple times today'
  
  const usagePerDay = usages.length / daysSinceFirst
  
  if (usagePerDay >= 1) return 'daily'
  if (usagePerDay >= 0.5) return 'every few days'
  if (usagePerDay >= 0.25) return 'weekly'
  if (usagePerDay >= 0.1) return 'monthly'
  
  return 'rarely'
} 