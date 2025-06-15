import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'

// Define route patterns
const authRoutes = ['/login', '/signup', '/reset-password', '/auth']
const publicRoutes = ['/', '/pricing', '/about', '/contact', '/terms', '/privacy']
const protectedRoutes = ['/dashboard', '/proposals', '/answer-bank', '/research', '/settings', '/admin', '/extract']
const onboardingRoutes = ['/onboarding/welcome', '/onboarding/verify-email', '/onboarding/profile', '/onboarding/knowledge', '/onboarding/team-setup', '/onboarding/tutorial', '/onboarding/first-tender']

// Role-based route access
const roleBasedRoutes = {
  admin: ['/admin', '/admin/users', '/admin/organizations', '/admin/settings'],
  manager: ['/admin/users', '/settings/organization', '/settings/billing'],
  writer: [], // All authenticated routes
  viewer: [], // All authenticated routes (read-only enforced at component level)
}

// Onboarding step mapping
const onboardingStepRoutes = {
  1: '/onboarding/welcome',
  2: '/onboarding/profile', 
  3: '/onboarding/knowledge',
  4: '/onboarding/team-setup',
  5: '/onboarding/tutorial',
  6: '/onboarding/first-tender'
}

/**
 * Check if user has completed onboarding
 */
async function checkOnboardingStatus(supabase: any, userId: string): Promise<{
  isCompleted: boolean
  nextStep: number
  shouldRedirect: boolean
  redirectUrl: string | null
}> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_steps_completed')
      .eq('id', userId)
      .single()

    if (error || !user) {
      // If no user data, assume they need full onboarding
      return {
        isCompleted: false,
        nextStep: 1,
        shouldRedirect: true,
        redirectUrl: '/onboarding/welcome'
      }
    }

    // If onboarding is already marked complete, no redirect needed
    if (user.onboarding_completed) {
      return {
        isCompleted: true,
        nextStep: 0,
        shouldRedirect: false,
        redirectUrl: null
      }
    }

    // Check completed steps
    const completedSteps = user.onboarding_steps_completed || []
    
    // Find next incomplete step
    let nextStep = 1
    for (let step = 1; step <= 6; step++) {
      if (!completedSteps.includes(step)) {
        nextStep = step
        break
      }
    }

    // If all steps completed, mark as complete
    if (completedSteps.length >= 6) {
      // Update completion status in database
      await supabase
        .from('users')
        .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
        .eq('id', userId)

      return {
        isCompleted: true,
        nextStep: 0,
        shouldRedirect: false,
        redirectUrl: null
      }
    }

    return {
      isCompleted: false,
      nextStep,
      shouldRedirect: true,
      redirectUrl: onboardingStepRoutes[nextStep as keyof typeof onboardingStepRoutes] || '/onboarding/welcome'
    }

  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // Fallback to requiring onboarding
    return {
      isCompleted: false,
      nextStep: 1,
      shouldRedirect: true,
      redirectUrl: '/onboarding/welcome'
    }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files, API routes, and auth callbacks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // EARLY RETURN: Allow all onboarding routes without any checks
  // This prevents any middleware-related authentication issues during onboarding
  const isOnboardingRoute = onboardingRoutes.some(route => pathname.startsWith(route))
  if (isOnboardingRoute) {
    return NextResponse.next()
  }

  try {
    // Create Supabase client for middleware
    const response = await updateSession(request)
    
    // We need to create a new server client to get user data
    // The updateSession function already handles session refresh
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No need to set cookies in middleware, updateSession handles it
          },
        },
      }
    )
    
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

    // Allow access to public routes for everyone
    if (isPublicRoute) {
      return response
    }

    // Allow auth routes for unauthenticated users
    if (!isAuthenticated && (isAuthRoute || pathname === '/')) {
      return response
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthRoute) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // For protected routes, check onboarding completion
    if (isAuthenticated && user && isProtectedRoute) {
      try {
        const onboardingStatus = await checkOnboardingStatus(supabase, user.id)
        
        if (!onboardingStatus.isCompleted && onboardingStatus.shouldRedirect) {
          // User needs to complete onboarding before accessing protected routes
          const redirectUrl = new URL(onboardingStatus.redirectUrl!, request.url)
          return NextResponse.redirect(redirectUrl)
        }
      } catch (onboardingError) {
        // If onboarding check fails, allow access but log the error
        console.warn('Onboarding status check failed:', onboardingError)
      }
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