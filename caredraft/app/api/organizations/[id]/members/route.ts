import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { organizationService } from '@/lib/services/organization-service'
import { 
  AuthenticationError, 
  getErrorResponse,
  getErrorStatusCode 
} from '@/lib/utils/errors'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/organizations/[id]/members - Get organization members
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    const members = await organizationService.getMembers(id)

    return NextResponse.json({
      success: true,
      data: members
    })
  } catch (error) {
    console.error('Error fetching organization members:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * POST /api/organizations/[id]/members - Add member to organization
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    await organizationService.addMember(
      id,
      userId,
      role
    )

    return NextResponse.json({
      success: true,
      message: 'Member added successfully'
    })
  } catch (error) {
    console.error('Error adding member to organization:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
} 