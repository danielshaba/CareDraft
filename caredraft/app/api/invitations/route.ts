import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { invitationService } from '@/lib/services/invitation-service'
import { 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError,
  getErrorResponse,
  getErrorStatusCode 
} from '@/lib/utils/errors'
import type { UserRole } from '@/lib/auth.types'

/**
 * GET /api/invitations - List invitations for organization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    // Get user details and organization
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userDetails) {
      throw new AuthenticationError('User not found')
    }

    // Check permissions - only admin and manager can view invitations
    if (!['admin', 'manager'].includes(userDetails.role)) {
      throw new AuthorizationError('Insufficient permissions to view invitations')
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Get invitations
    const result = await invitationService.getInvitations(userDetails.organization_id, status)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        invitations: result.invitations,
        stats: result.stats
      }
    })

  } catch (error) {
    console.error('Error listing invitations:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * POST /api/invitations - Create new invitation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    // Get user details
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('organization_id, role, full_name')
      .eq('id', user.id)
      .single()

    if (userError || !userDetails) {
      throw new AuthenticationError('User not found')
    }

    // Check permissions - only admin and manager can create invitations
    if (!['admin', 'manager'].includes(userDetails.role)) {
      throw new AuthorizationError('Insufficient permissions to create invitations')
    }

    // Parse request body
    const body = await request.json()
    const { email, role, message, customExpiryDays } = body

    // Validate required fields
    if (!email || !role) {
      throw new ValidationError('Email and role are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format')
    }

    // Validate role
    const validRoles: UserRole[] = ['admin', 'manager', 'writer', 'viewer']
    if (!validRoles.includes(role)) {
      throw new ValidationError('Invalid role specified')
    }

    // Managers can only assign writer/viewer roles
    if (userDetails.role === 'manager' && ['admin', 'manager'].includes(role)) {
      throw new AuthorizationError('Managers cannot assign admin or manager roles')
    }

    // Create invitation
    const result = await invitationService.createInvitation({
      email,
      role,
      message,
      customExpiryDays
    }, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.invitation
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating invitation:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
} 