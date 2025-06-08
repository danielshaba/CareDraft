import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase'

// Define route patterns
const authRoutes = ['/login', '/signup', '/reset-password', '/auth']
const publicRoutes = ['/', '/pricing', '/about', '/contact', '/terms', '/privacy']
const protectedRoutes = ['/dashboard', '/proposals', '/answer-bank', '/research', '/settings', '/admin', '/extract']

// Role-based route access
const roleBasedRoutes = {
  admin: ['/admin', '/admin/users', '/admin/organizations', '/admin/settings'],
  manager: ['/admin/users', '/settings/organization', '/settings/billing'],
  writer: [], // All authenticated routes
  viewer: [], // All authenticated routes (read-only enforced at component level)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  try {
    // Create Supabase client for middleware
    const { supabase, response } = updateSession(request)
    
    // Try to get the user - if there's no session, this will fail and that's ok
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user || null
    } catch {
      // No session or auth error - user is not authenticated
      user = null
    }

    const isAuthenticated = !!user
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
    const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/'
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthRoute && pathname !== '/auth/callback') {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Allow access to public routes for everyone
    if (isPublicRoute) {
      return response
    }

    // Allow auth routes for unauthenticated users
    if (!isAuthenticated && (isAuthRoute || pathname === '/')) {
      return response
    }

    // Redirect unauthenticated users to login for protected routes
    if (!isAuthenticated && isProtectedRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Role-based access control for authenticated users
    if (isAuthenticated && user) {
      try {
        // Get user profile with role information
        const { data: profile } = await supabase
          .from('users')
          .select('role, organization_id')
          .eq('id', user.id)
          .single()

        if (profile?.role) {
          // Check role-based route access
          const userRole = profile.role as keyof typeof roleBasedRoutes
          
          // Check if current route requires a higher role
          for (const [requiredRole, routes] of Object.entries(roleBasedRoutes)) {
            if (routes.some(route => pathname.startsWith(route))) {
              if (!hasRoleAccess(userRole, requiredRole as keyof typeof roleBasedRoutes)) {
                // Redirect to unauthorized page or dashboard
                const unauthorizedUrl = new URL('/unauthorized', request.url)
                return NextResponse.redirect(unauthorizedUrl)
              }
            }
          }
        }
      } catch (profileError) {
        // If profile fetch fails, still allow access to authenticated routes
        console.warn('Could not fetch user profile for role check')
      }
    }

    // Allow access if we reach here
    return response
    
  } catch (middlewareError) {
    console.error('Unexpected middleware error:', middlewareError)
    
    // If middleware fails, redirect to login for protected routes
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Allow access to public routes even if middleware fails
    return NextResponse.next()
  }
}

/**
 * Check if user role has access to required role level
 */
function hasRoleAccess(userRole: keyof typeof roleBasedRoutes, requiredRole: keyof typeof roleBasedRoutes): boolean {
  const roleHierarchy = {
    viewer: 1,
    writer: 2,
    manager: 3,
    admin: 4
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
} 