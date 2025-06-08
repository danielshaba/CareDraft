'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { usePermissions } from '@/hooks/usePermissions'
import { UserRole, Permission } from '@/lib/auth.types'
import { FullscreenLoader } from '@/components/LoadingSpinner'

interface RouteGuardProps {
  children: React.ReactNode
  /**
   * Redirect URL for unauthenticated users (default: '/login')
   */
  loginUrl?: string
  /**
   * Redirect URL for unauthorized users (default: '/unauthorized')
   */
  unauthorizedUrl?: string
  /**
   * Required role (user must have this role or higher)
   */
  requiredRole?: UserRole
  /**
   * Required permissions (user must have ALL of these permissions)
   */
  requiredPermissions?: Permission[]
  /**
   * Any permissions (user must have AT LEAST ONE of these permissions)  
   */
  anyPermissions?: Permission[]
  /**
   * Organization ID (user must belong to this organization)
   */
  organizationId?: string
  /**
   * Custom authorization check function
   */
  customCheck?: (user: unknown) => boolean
  /**
   * Show loading spinner during auth check (default: true)
   */
  showLoading?: boolean
  /**
   * Allow access for unauthenticated users (default: false)
   */
  allowUnauthenticated?: boolean
}

/**
 * RouteGuard - Protects routes by redirecting users based on authentication and authorization
 * 
 * @example
 * // Protect admin routes
 * <RouteGuard requiredRole="admin">
 *   <AdminDashboard />
 * </RouteGuard>
 * 
 * @example
 * // Protect specific permissions
 * <RouteGuard requiredPermissions={['manage_users']}>
 *   <UserManagement />
 * </RouteGuard>
 * 
 * @example
 * // Custom unauthorized redirect
 * <RouteGuard 
 *   requiredRole="manager"
 *   unauthorizedUrl="/dashboard"
 * >
 *   <ManagerPanel />
 * </RouteGuard>
 */
export function RouteGuard({
  children,
  loginUrl = '/login',
  unauthorizedUrl = '/unauthorized',
  requiredRole,
  requiredPermissions = [],
  anyPermissions = [],
  organizationId,
  customCheck,
  showLoading = true,
  allowUnauthenticated = false,
}: RouteGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { hasRole, hasPermission } = usePermissions()

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return

    // Check if user is authenticated
    if (!user && !allowUnauthenticated) {
      router.push(loginUrl)
      return
    }

    // If unauthenticated users are allowed and no user, just return
    if (!user && allowUnauthenticated) {
      return
    }

    // Now we know user is authenticated, check authorization
    if (user) {
      // Check organization access
      if (organizationId && (user as any).organization_id !== organizationId) {
        router.push(unauthorizedUrl)
        return
      }

      // Check custom authorization function
      if (customCheck && !customCheck(user)) {
        router.push(unauthorizedUrl)
        return
      }

      // Check required role
      if (requiredRole && !hasRole(requiredRole)) {
        router.push(unauthorizedUrl)
        return
      }

      // Check required permissions (must have ALL)
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
        if (!hasAllPermissions) {
          router.push(unauthorizedUrl)
          return
        }
      }

      // Check any permissions (must have AT LEAST ONE)
      if (anyPermissions.length > 0) {
        const hasAnyPermission = anyPermissions.some(permission => hasPermission(permission))
        if (!hasAnyPermission) {
          router.push(unauthorizedUrl)
          return
        }
      }
    }
  }, [
    user,
    loading,
    router,
    loginUrl,
    unauthorizedUrl,
    requiredRole,
    requiredPermissions,
    anyPermissions,
    organizationId,
    customCheck,
    allowUnauthenticated,
    hasRole,
    hasPermission,
  ])

  // Show loading state while auth is checking
  if (loading && showLoading) {
    return <FullscreenLoader message="Verifying access..." />
  }

  // If user is not authenticated and unauthenticated users aren't allowed, show loading
  if (!user && !allowUnauthenticated && showLoading) {
    return <FullscreenLoader message="Redirecting to login..." />
  }

  // If we reach here, user has passed all checks or is loading
  return <>{children}</>
}

/**
 * Convenience route guards for common patterns
 */

/**
 * Requires user to be authenticated
 */
export function AuthenticatedRoute({ 
  children, 
  loginUrl = '/login',
  showLoading = true 
}: {
  children: React.ReactNode
  loginUrl?: string
  showLoading?: boolean
}) {
  return (
    <RouteGuard 
      loginUrl={loginUrl}
      showLoading={showLoading}
    >
      {children}
    </RouteGuard>
  )
}

/**
 * Requires admin role
 */
export function AdminRoute({ 
  children, 
  loginUrl = '/login',
  unauthorizedUrl = '/dashboard',
  showLoading = true 
}: {
  children: React.ReactNode
  loginUrl?: string
  unauthorizedUrl?: string
  showLoading?: boolean
}) {
  return (
    <RouteGuard 
      requiredRole="admin"
      loginUrl={loginUrl}
      unauthorizedUrl={unauthorizedUrl}
      showLoading={showLoading}
    >
      {children}
    </RouteGuard>
  )
}

/**
 * Requires manager role or higher
 */
export function ManagerRoute({ 
  children, 
  loginUrl = '/login',
  unauthorizedUrl = '/dashboard',
  showLoading = true 
}: {
  children: React.ReactNode
  loginUrl?: string
  unauthorizedUrl?: string
  showLoading?: boolean
}) {
  return (
    <RouteGuard 
      requiredRole="manager"
      loginUrl={loginUrl}
      unauthorizedUrl={unauthorizedUrl}
      showLoading={showLoading}
    >
      {children}
    </RouteGuard>
  )
}

/**
 * Requires writer role or higher
 */
export function WriterRoute({ 
  children, 
  loginUrl = '/login',
  unauthorizedUrl = '/dashboard',
  showLoading = true 
}: {
  children: React.ReactNode
  loginUrl?: string
  unauthorizedUrl?: string
  showLoading?: boolean
}) {
  return (
    <RouteGuard 
      requiredRole="writer"
      loginUrl={loginUrl}
      unauthorizedUrl={unauthorizedUrl}
      showLoading={showLoading}
    >
      {children}
    </RouteGuard>
  )
}

/**
 * Higher-order component for page-level route protection
 */
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<RouteGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...guardProps}>
        <Component {...props} />
      </RouteGuard>
    )
  }
} 