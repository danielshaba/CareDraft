import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || 'http://localhost:3000'
    
    // Set the redirect URL - default to dashboard callback
    const emailRedirectTo = redirectTo 
      ? `${origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : `${origin}/api/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    })

    if (error) {
      console.error('Magic link error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Magic link sent successfully',
      success: true
    })

  } catch (error) {
    console.error('Magic link API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 