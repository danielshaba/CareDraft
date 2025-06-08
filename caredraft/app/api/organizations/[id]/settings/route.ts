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
 * GET /api/organizations/[id]/settings - Get organization settings
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
      data: organization.settings
    })
  } catch {
    console.error('Error fetching organization settings:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * PUT /api/organizations/[id]/settings - Update organization settings
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

    const settings = await organizationService.updateOrganizationSettings(
      params.id, 
      body, 
      user.id
    )

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch {
    console.error('Error updating organization settings:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
} 