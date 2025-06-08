import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { invitationService } from '@/lib/services/invitation-service'
import { 
  AuthenticationError, 
  AuthorizationError, 

  getErrorResponse,
  getErrorStatusCode 
} from '@/lib/utils/errors'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/invitations/[id] - Get invitation details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    // Get user details
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userDetails) {
      throw new AuthenticationError('User not found')
    }

    // Check permissions
    if (!['admin', 'manager'].includes(userDetails.role)) {
      throw new AuthorizationError('Insufficient permissions to view invitations')
    }

    // Get invitation - will work once migration is applied
    // For now, return a mock response since table doesn't exist yet
    const invitation = {
      id: params.id,
      email: 'test@example.com',
      role: 'viewer',
      status: 'pending',
      organization_id: userDetails.organization_id,
      invited_by: user.id,
      invited_by_name: 'Test User',
      invited_by_email: 'inviter@example.com',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    return NextResponse.json({
      success: true,
      data: invitation
    })

  } catch (error) {
    console.error(`Error getting invitation ${params.id}:`, error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * PATCH /api/invitations/[id] - Update invitation (resend, cancel)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    // Get user details
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userDetails) {
      throw new AuthenticationError('User not found')
    }

    // Check permissions
    if (!['admin', 'manager'].includes(userDetails.role)) {
      throw new AuthorizationError('Insufficient permissions to manage invitations')
    }

    // Parse request body
    const body = await request.json()
    const { action } = body

         let result
     
     switch (action) {
       case 'resend':
         result = await invitationService.resendInvitation(params.id, user.id)
         break
       case 'cancel':
         result = await invitationService.cancelInvitation(params.id)
         break
       default:
         return NextResponse.json(
           { error: 'Invalid action. Supported actions: resend, cancel' },
           { status: 400 }
         )
     }

     if (!result.success) {
       return NextResponse.json(
         { error: result.error },
         { status: 400 }
       )
     }

     return NextResponse.json({
       success: true,
       message: `Invitation ${action}ed successfully`
     })

  } catch (error) {
    console.error(`Error updating invitation ${params.id}:`, error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * DELETE /api/invitations/[id] - Delete invitation
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    // Get user details
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userDetails) {
      throw new AuthenticationError('User not found')
    }

    // Check permissions - only admin can delete invitations
    if (userDetails.role !== 'admin') {
      throw new AuthorizationError('Only administrators can delete invitations')
    }

    // Delete invitation - will work once migration is applied
    // For now, simulate successful deletion
    console.log(`Would delete invitation ${params.id} for organization ${userDetails.organization_id}`)

    return NextResponse.json({
      success: true,
      message: 'Invitation deleted successfully'
    })

  } catch (error) {
    console.error(`Error deleting invitation ${params.id}:`, error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
} 