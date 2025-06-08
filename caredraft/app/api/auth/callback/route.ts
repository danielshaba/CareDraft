import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Check for forwarded host header (for production deployments behind load balancers)
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          // In development, we can trust the origin
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          // In production with load balancer
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          // In production without load balancer
          return NextResponse.redirect(`${origin}${next}`)
        }
      } else {
        console.error('Auth error during code exchange:', error)
        // Redirect to login with error parameter
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error&message=${encodeURIComponent(error.message)}`)
      }
    } catch (error) {
      console.error('Exception during auth callback:', error)
      // Redirect to login with generic error
      return NextResponse.redirect(`${origin}/login?error=callback_exception&message=${encodeURIComponent('Authentication callback failed')}`)
    }
  }

  // No code provided - redirect to login with error
  console.error('No auth code provided in callback')
  return NextResponse.redirect(`${origin}/login?error=no_code&message=${encodeURIComponent('No authentication code provided')}`)
}
