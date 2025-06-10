import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { organizationService } from '@/lib/services/organization-service'
import { 
  AuthenticationError, 
  getErrorResponse,
  getErrorStatusCode 
} from '@/lib/utils/errors'

/**
 * GET /api/organizations - List user's organizations
 */
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    const organizations = await organizationService.getUserOrganizations(user.id)

    return NextResponse.json({
      success: true,
      data: organizations
    })
  } catch (error) {
    console.error(`Error listing organizations: ${error}`)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * POST /api/organizations - Create new organization
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    const body = await request.json()
    const { name, slug, description, industry, size, billing_email, website } = body

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const organization = await organizationService.createOrganization({
      name,
      slug,
      description,
      industry,
      size,
      billing_email,
      website
    })

    return NextResponse.json({
      success: true,
      data: organization
    }, { status: 201 })
  } catch (error) {
    console.error(`Error creating organization: ${error}`)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
} 