import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const supabase = createClient()
    
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!exchangeError) {
        console.log('✅ Authentication successful, redirecting to:', next)
        // Authentication successful, redirect to dashboard or intended page
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('❌ Code exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
      }
    } catch (error) {
      console.error('❌ Exception during code exchange:', error)
      return NextResponse.redirect(`${origin}/login?error=exchange_exception`)
    }
  }

  console.error('❌ No code provided in callback')
  // No code provided, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=no_code`)
} 