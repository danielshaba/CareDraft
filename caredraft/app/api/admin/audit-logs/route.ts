import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { UserLifecycleService } from '@/lib/services/user-lifecycle-service'

const lifecycleService = new UserLifecycleService()

// GET /api/admin/audit-logs - Get audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions - admins and managers can view audit logs
    if (!['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'logs'

    if (type === 'stats') {
      // Get audit log statistics
      const stats = await lifecycleService.getAuditLogStats(
        currentUser.role === 'admin' ? undefined : currentUser.organization_id
      )
      return NextResponse.json({ success: true, data: stats })
    }

    // Parse filter parameters
    const actionTypes = searchParams.get('actionTypes')?.split(',').filter(Boolean)
    const actorId = searchParams.get('actorId')
    const targetUserId = searchParams.get('targetUserId')
    const organizationId = searchParams.get('organizationId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter object
    const filter: Record<string, unknown> = {
      limit,
      offset
    }

    if (actionTypes && actionTypes.length > 0) {
      filter.actionType = actionTypes
    }

    if (actorId) {
      filter.actorId = actorId
    }

    if (targetUserId) {
      filter.targetUserId = targetUserId
    }

    // Apply organization filtering for non-admin users
    if (currentUser.role === 'admin') {
      if (organizationId) {
        filter.organizationId = organizationId
      }
    } else {
      filter.organizationId = currentUser.organization_id
    }

    if (startDate) {
      filter.startDate = new Date(startDate)
    }

    if (endDate) {
      filter.endDate = new Date(endDate)
    }

    const auditLogs = await lifecycleService.getAuditLogs(filter)

    return NextResponse.json({
      success: true,
      data: auditLogs,
      pagination: {
        limit,
        offset,
        hasMore: auditLogs.length === limit
      }
    })

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/audit-logs - Manually log an audit event
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions - only admins and managers can log events
    if (!['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      actionType,
      targetUserId,
      organizationId,
      previousValues,
      newValues,
      metadata
    } = body

    // Get request context
    const userAgent = request.headers.get('user-agent')
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : realIp

    const auditId = await lifecycleService.logAuditEvent({
      actionType,
      actorId: session.user.id,
      targetUserId,
      organizationId: organizationId || currentUser.organization_id,
      previousValues,
      newValues,
      metadata,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined
    })

    return NextResponse.json({
      success: true,
      message: 'Audit event logged successfully',
      auditId
    })

  } catch (error) {
    console.error('Error logging audit event:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 