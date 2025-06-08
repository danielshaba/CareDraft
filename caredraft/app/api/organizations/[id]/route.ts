import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { organizationService } from '@/lib/services/organization-service'
import { 
  AuthenticationError, 
  getErrorResponse,
  getErrorStatusCode 
} from '@/lib/utils/errors'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/organizations/[id] - Get organization details
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

    const organization = await organizationService.getOrganization(params.id, user.id)

    return NextResponse.json({
      success: true,
      data: organization
    })
  } catch {
    console.error('Error fetching organization:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * PUT /api/organizations/[id] - Update organization
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    const body = await request.json()

    const organization = await organizationService.updateOrganization(
      params.id, 
      body, 
      user.id
    )

    return NextResponse.json({
      success: true,
      data: organization
    })
  } catch {
    console.error('Error updating organization:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * DELETE /api/organizations/[id] - Delete organization
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

    await organizationService.deleteOrganization(params.id, user.id)

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    })
  } catch {
    console.error('Error deleting organization:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
} 