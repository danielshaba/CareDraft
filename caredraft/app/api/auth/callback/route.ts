import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')
  
  // Get the redirect destination - default to dashboard
  let next = searchParams.get('next') ?? '/dashboard'
  
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  console.log('Auth callback - Code:', code ? 'present' : 'missing')
  console.log('Auth callback - Error:', error, errorCode, errorDescription)
  console.log('Auth callback - Next:', next)

  // Handle error cases first
  if (error) {
    console.error('Auth callback error:', { error, errorCode, errorDescription })
    
    let errorMessage = 'Authentication failed'
    if (errorCode === 'otp_expired') {
      errorMessage = 'The magic link has expired. Please request a new one.'
    } else if (errorCode === 'access_denied') {
      errorMessage = 'Access was denied. Please try again.'
    } else if (errorDescription) {
      errorMessage = errorDescription.replace(/\+/g, ' ')
    }
    
    return NextResponse.redirect(
      `${origin}/login?error=callback_error&message=${encodeURIComponent(errorMessage)}`
    )
  }

  // Handle missing code
  if (!code) {
    console.error('No auth code provided in callback')
    return NextResponse.redirect(
      `${origin}/login?error=no_code&message=${encodeURIComponent('No authentication code provided')}`
    )
  }

  // Process the authentication code
  try {
    const supabase = await createClient()
    
    console.log('Attempting to exchange code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      
      let errorMessage = 'Failed to authenticate'
      if (exchangeError.message.includes('invalid') || exchangeError.message.includes('expired')) {
        errorMessage = 'The magic link is invalid or has expired. Please request a new one.'
      } else {
        errorMessage = exchangeError.message
      }
      
      return NextResponse.redirect(
        `${origin}/login?error=exchange_error&message=${encodeURIComponent(errorMessage)}`
      )
    }

    if (!data.session || !data.user) {
      console.error('No session or user after successful code exchange')
      return NextResponse.redirect(
        `${origin}/login?error=no_session&message=${encodeURIComponent('Authentication succeeded but no session was created')}`
      )
    }

    console.log('Auth successful - User:', data.user.email)
    
    // Check if this is a new user who needs onboarding
    try {
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, full_name, created_at')
        .eq('id', data.user.id)
        .single()
      
      if (userError && userError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking user existence:', userError)
        // Continue with normal flow if there's an error
      } else if (!existingUser) {
        console.log('New user detected - creating basic profile and redirecting to onboarding')
        
        // Create a minimal user profile for new users  
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.email?.split('@')[0] || 'New User',
            organization_id: 'default-org', // Temporary - will be updated in onboarding
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (createUserError) {
          console.error('Error creating user profile:', createUserError)
          // Continue to onboarding anyway - they can complete setup there
        } else {
          console.log('Basic user profile created')
        }
        
        // New user - redirect to onboarding instead of dashboard
        const redirectUrl = next === '/dashboard' ? '/onboarding/welcome' : next
        
        // Determine the correct redirect URL
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        let finalRedirectUrl: string
        if (isLocalEnv) {
          finalRedirectUrl = `${origin}${redirectUrl}`
        } else if (forwardedHost) {
          finalRedirectUrl = `https://${forwardedHost}${redirectUrl}`
        } else {
          finalRedirectUrl = `${origin}${redirectUrl}`
        }
        
        console.log('Redirecting new user to onboarding:', finalRedirectUrl)
        return NextResponse.redirect(finalRedirectUrl)
      } else {
        console.log('Existing user detected - proceeding to dashboard')
      }
    } catch (checkError) {
      console.error('Error during new user check:', checkError)
      // Continue with normal flow if there's an error
    }
    
    // Determine the correct redirect URL for existing users
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    let redirectUrl: string
    if (isLocalEnv) {
      // In development, we can trust the origin
      redirectUrl = `${origin}${next}`
    } else if (forwardedHost) {
      // In production with load balancer
      redirectUrl = `https://${forwardedHost}${next}`
    } else {
      // In production without load balancer
      redirectUrl = `${origin}${next}`
    }
    
    console.log('Redirecting to:', redirectUrl)
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('Exception during auth callback:', error)
    return NextResponse.redirect(
      `${origin}/login?error=callback_exception&message=${encodeURIComponent('An unexpected error occurred during authentication')}`
    )
  }
}
