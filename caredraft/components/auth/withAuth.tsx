'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { usePermissions } from '@/hooks/usePermissions'
import { UserRole, Permission } from '@/lib/auth.types'
import { FullscreenLoader } from '@/components/LoadingSpinner'

interface WithAuthOptions {
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
   * Loading message to show during auth check
   */
  loadingMessage?: string
  /**
   * Allow access for unauthenticated users (default: false)
   */
  allowUnauthenticated?: boolean
}

/**
 * Higher-order component for page-level authentication protection
 * 
 * @example
 * // Basic authentication requirement
 * export default withAuth(MyPage)
 * 
 * @example
 * // Role-based protection
 * export default withAuth(AdminPage, { requiredRole: 'admin' })
 * 
 * @example
 * // Permission-based protection
 * export default withAuth(UserManagementPage, { 
 *   requiredPermissions: ['manage_users'] 
 * })
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    loginUrl = '/login',
    unauthorizedUrl = '/unauthorized',
    requiredRole,
    requiredPermissions = [],
    anyPermissions = [],
    organizationId,
    customCheck,
    loadingMessage = 'Verifying access...',
    allowUnauthenticated = false,
  } = options

  return function AuthenticatedComponent(props: P) {
    const router = useRouter()
    const { user, loading } = useAuth()
    const { hasRole, hasPermission } = usePermissions()

    React.useEffect(() => {
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
      hasRole,
      hasPermission,
    ])

    // Show loading state while auth is checking
    if (loading) {
      return <FullscreenLoader message={loadingMessage} />
    }

    // If user is not authenticated and unauthenticated users aren't allowed, show loading
    if (!user && !allowUnauthenticated) {
      return <FullscreenLoader message="Redirecting to login..." />
    }

    // If we reach here, user has passed all checks
    return <WrappedComponent {...props} />
  }
}

/**
 * HOC that requires authentication (any authenticated user)
 */
export function withAuthRequired<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loginUrl = '/login'
) {
  return withAuth(WrappedComponent, { loginUrl })
}

/**
 * HOC that requires admin role
 */
export function withAdminRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<WithAuthOptions, 'requiredRole'> = {}
) {
  return withAuth(WrappedComponent, { ...options, requiredRole: 'admin' })
}

/**
 * HOC that requires manager role or higher
 */
export function withManagerRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<WithAuthOptions, 'requiredRole'> = {}
) {
  return withAuth(WrappedComponent, { ...options, requiredRole: 'manager' })
}

/**
 * HOC that requires writer role or higher
 */
export function withWriterRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<WithAuthOptions, 'requiredRole'> = {}
) {
  return withAuth(WrappedComponent, { ...options, requiredRole: 'writer' })
}

/**
 * HOC that requires specific permissions
 */
export function withPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permissions: Permission[],
  options: Omit<WithAuthOptions, 'requiredPermissions'> = {}
) {
  return withAuth(WrappedComponent, { ...options, requiredPermissions: permissions })
}

/**
 * HOC that requires any of the specified permissions
 */
export function withAnyPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permissions: Permission[],
  options: Omit<WithAuthOptions, 'anyPermissions'> = {}
) {
  return withAuth(WrappedComponent, { ...options, anyPermissions: permissions })
}

/**
 * HOC factory for organization-specific access
 */
export function withOrganization<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  organizationId: string,
  options: Omit<WithAuthOptions, 'organizationId'> = {}
) {
  return withAuth(WrappedComponent, { ...options, organizationId })
} 