import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase'

// Define protected and auth-only routes
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/proposals',
  '/extract',
  '/brainstorm',
  '/draft-builder',
  '/tender-details',
  '/knowledge-hub'
]

const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Create Supabase client for middleware
  const { supabase, response } = createMiddlewareSupabaseClient(request)
  
  try {
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware auth error:', error)
    }

    const isAuthenticated = !!session?.user
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthRoute) {
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // Redirect unauthenticated users from protected routes to login
    if (!isAuthenticated && isProtectedRoute) {
      const loginUrl = new URL('/login', request.url)
      // Add the original URL as a redirect parameter
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // For all other routes, continue with the response
    return response

  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue
    return response
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 