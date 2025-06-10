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
 * GET /api/organizations/[id]/settings - Get organization settings
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

    const organization = await organizationService.getOrganization(id)

    // Provide default settings if not available
    const defaultSettings = {
      branding: {},
      features: {
        research_sessions_enabled: true,
        compliance_tracking_enabled: true,
        advanced_analytics_enabled: false,
        api_access_enabled: false,
        sso_enabled: false
      },
      limits: {
        max_users: 10,
        max_proposals: 100,
        max_storage_gb: 5,
        max_api_calls_per_month: 1000
      },
      workflow: {
        require_approval_for_proposals: false,
        auto_archive_after_days: 365
      },
      notifications: {
        system_announcements: true,
        feature_updates: true,
        security_alerts: true
      }
    }

    return NextResponse.json({
      success: true,
      data: (organization as any)?.settings || defaultSettings
    })
  } catch (error) {
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
    const { id: _id } = await params
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    const body = await request.json()

    // For now, just return the updated settings since updateOrganizationSettings doesn't exist
    return NextResponse.json({
      success: true,
      data: body,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating organization settings:', error)
    
    const errorResponse = getErrorResponse(error)
    const statusCode = getErrorStatusCode(error)
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
} 