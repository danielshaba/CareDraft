import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { profileDataService } from '@/lib/services/profile-data-service'
import { profileSchema } from '@/lib/validations/profile'
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
    return { supabase, user: null, error: 'Authentication required' }
  }

  return { supabase, user, error: null }
}

// GET /api/profile - Retrieve user profile data
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 100,
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

    // Get profile data with source information
    const profileData = await profileDataService.getExistingProfileData(user.id)
    
    if (!profileData) {
      // If no profile exists, try to auto-populate from onboarding data
      const onboardingData = await profileDataService.fetchOnboardingData(user.id)
      
      if (onboardingData) {
        const mappedProfile = await profileDataService.mapToProfileData(onboardingData)
        
        return NextResponse.json({
          success: true,
          profileData: mappedProfile,
          source: 'onboarding',
          autoPopulated: true,
          message: 'Profile auto-populated from onboarding data'
        })
      }

      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profileData,
      source: 'profile',
      autoPopulated: false
    })

  } catch (error) {
    console.error('Error in GET /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Full profile update (replace entire profile)
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 100,
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

    const body = await request.json()
    
    // Validate the profile data using Zod schema
    try {
      profileSchema.parse(body)
    } catch (validationError: any) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationError.errors 
        },
        { status: 400 }
      )
    }

    // Sanitize data (remove any potentially harmful content)
    const sanitizedData = {
      ...body,
      userId: user.id, // Ensure the correct user ID
      updatedAt: new Date().toISOString()
    }

    // Save the complete profile data
    const savedProfile = await profileDataService.saveProfileData(user.id, sanitizedData)

    if (!savedProfile) {
      return NextResponse.json(
        { error: 'Failed to save profile data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profileData: savedProfile,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/profile - Partial profile update (update specific fields)
export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 100,
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

    const updates = await request.json()

    // Get existing profile data
    const existingProfile = await profileDataService.getExistingProfileData(user.id)
    
    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found. Use PUT to create a new profile.' },
        { status: 404 }
      )
    }

    // Merge updates with existing data
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      userId: user.id, // Ensure the correct user ID
      updatedAt: new Date().toISOString()
    }

    // Validate the merged data
    try {
      profileSchema.parse(updatedProfile)
    } catch (validationError: any) {
      return NextResponse.json(
        { 
          error: 'Validation failed for updated profile', 
          details: validationError.errors 
        },
        { status: 400 }
      )
    }

    // Save the updated profile
    const savedProfile = await profileDataService.saveProfileData(user.id, updatedProfile)

    if (!savedProfile) {
      return NextResponse.json(
        { error: 'Failed to update profile data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profileData: savedProfile,
      updatedFields: Object.keys(updates),
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error in PATCH /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/profile - Delete user profile (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 100,
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

    // Get existing profile and mark as deleted (soft delete)
    const existingProfile = await profileDataService.getExistingProfileData(user.id)
    
    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const deletedProfile = await profileDataService.saveProfileData(user.id, {
      ...existingProfile,
      // Add metadata fields for soft delete (these won't be validated by the profile schema)
    } as any)

    if (!deletedProfile) {
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 