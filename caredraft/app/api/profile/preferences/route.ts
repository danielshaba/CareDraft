import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// import { profileDataService } from '@/lib/services/profile-data-service' // TODO: Enable when preferences storage is implemented
import { accountPreferencesSchema } from '@/lib/validations/profile'
import { rateLimit } from '@/lib/utils/rate-limit'

async function getAuthenticatedUser(_request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { user: null, error: 'Authentication required' }
  }

  return { user, error: null }
}

// GET /api/profile/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 200,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    // Since ProfileData doesn't include preferences, we'll store them separately
    // For now, return default preferences - this would be enhanced to store preferences
    // in a separate table or as user metadata
    const defaultPreferences = accountPreferencesSchema.parse({})
    
    return NextResponse.json({
      success: true,
      preferences: defaultPreferences,
      isDefault: true,
      message: 'Using default preferences - preference storage not yet implemented'
    })

  } catch (error) {
    console.error('Error in GET /api/profile/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/profile/preferences - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    const preferenceUpdates = await request.json()

    // Since ProfileData doesn't include preferences, this endpoint would need
    // a separate preferences storage system. For now, validate the input and return it.
    
    // Validate preference updates
    try {
      const validatedPreferences = accountPreferencesSchema.parse(preferenceUpdates)
      
      // TODO: Store preferences in a separate table or user metadata
      // For now, just return the validated preferences
      
      return NextResponse.json({
        success: true,
        preferences: validatedPreferences,
        message: 'Preferences validated but not persisted - storage not yet implemented'
      })
      
    } catch (validationError: any) {
      return NextResponse.json(
        { 
          error: 'Invalid preferences data', 
          details: validationError.errors 
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in PATCH /api/profile/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 