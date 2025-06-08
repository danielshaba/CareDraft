import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { UserLifecycleService } from '@/lib/services/user-lifecycle-service'

const lifecycleService = new UserLifecycleService()

// POST /api/admin/users/lifecycle - Perform user lifecycle operations
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

    // Check permissions - only admins and managers can perform lifecycle operations
    if (!['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { operation, data } = body

    let result
    
    switch (operation) {
      case 'deactivate_user':
        result = await lifecycleService.deactivateUser(data, session.user.id)
        return NextResponse.json({ 
          success: true, 
          message: 'User deactivated successfully',
          result 
        })

      case 'reactivate_user':
        result = await lifecycleService.reactivateUser(data, session.user.id)
        return NextResponse.json({ 
          success: true, 
          message: 'User reactivated successfully',
          result 
        })

      case 'bulk_update_roles':
        result = await lifecycleService.bulkUpdateUserRoles(data, session.user.id)
        return NextResponse.json({ 
          success: true, 
          message: `${result} users updated successfully`,
          result 
        })

      case 'bulk_deactivate':
        result = await lifecycleService.bulkDeactivateUsers(data, session.user.id)
        return NextResponse.json({ 
          success: true, 
          message: `${result} users deactivated successfully`,
          result 
        })

      case 'export_user_data':
        result = await lifecycleService.exportUserData(
          data.userId,
          session.user.id,
          data.options
        )
        return NextResponse.json({ 
          success: true, 
          message: 'User data exported successfully',
          result 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in user lifecycle operation:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/admin/users/lifecycle?type=deactivated - Get lifecycle data
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

    // Check permissions
    if (!['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case 'deactivated':
        const deactivatedUsers = await lifecycleService.getDeactivatedUsers(
          currentUser.role === 'admin' ? undefined : currentUser.organization_id
        )
        return NextResponse.json({ 
          success: true, 
          data: deactivatedUsers 
        })

      case 'cleanup_run':
        const cleanupResults = await lifecycleService.runAutomatedCleanup()
        return NextResponse.json({ 
          success: true, 
          message: 'Cleanup completed',
          data: cleanupResults 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in user lifecycle GET:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 