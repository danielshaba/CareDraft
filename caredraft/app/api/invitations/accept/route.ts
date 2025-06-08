import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase'
import { invitationService } from '@/lib/services/invitation-service'
import { 
  ValidationError,
  getErrorResponse,
  getErrorStatusCode 
} from '@/lib/utils/errors'

/**
 * POST /api/invitations/accept - Accept invitation using token
 */
export async function POST(request: NextRequest) {
  try {
    // const supabase = createClient()
    
    // Parse request body
    const body = await request.json()
    const { token, userId } = body

    // Validate required fields
    if (!token) {
      throw new ValidationError('Invitation token is required')
    }

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    // Accept invitation
    const result = await invitationService.acceptInvitation(token, userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId: result.organizationId,
        role: result.role
      }
    })

  } catch (error) {
    console.error('Error accepting invitation:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * GET /api/invitations/accept?token=... - Get invitation details by token
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from query parameters
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      throw new ValidationError('Invitation token is required')
    }

    // Get invitation details
    const result = await invitationService.getInvitationByToken(token)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.invitation
    })

  } catch (error) {
    console.error('Error getting invitation by token:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
} 