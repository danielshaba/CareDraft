'use client'

import React from 'react'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { usePermissions, useMultiplePermissions } from '@/hooks/usePermissions'
import { UserRole, Permission } from '@/lib/auth.types'

interface ProtectedComponentProps {
  children: React.ReactNode
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
   * What to render when user doesn't have access
   */
  fallback?: React.ReactNode
  /**
   * Show nothing when user doesn't have access (default: false)
   */
  hideOnNoAccess?: boolean
  /**
   * Custom access check function
   */
  customCheck?: (user: unknown) => boolean
}

/**
 * ProtectedComponent - Conditionally renders components based on user permissions and roles
 * 
 * @example
 * // Only show for admins
 * <ProtectedComponent requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedComponent>
 * 
 * @example  
 * // Only show for users with specific permissions
 * <ProtectedComponent requiredPermissions={['manage_users', 'edit_proposals']}>
 *   <UserManagement />
 * </ProtectedComponent>
 * 
 * @example
 * // Show for users with any of these permissions
 * <ProtectedComponent anyPermissions={['view_proposals', 'create_proposals']}>
 *   <ProposalButton />
 * </ProtectedComponent>
 * 
 * @example
 * // Show fallback content when access denied
 * <ProtectedComponent 
 *   requiredRole="manager"
 *   fallback={<div>You need manager access to view this.</div>}
 * >
 *   <ManagerDashboard />
 * </ProtectedComponent>
 */
export function ProtectedComponent({
  children,
  requiredRole,
  requiredPermissions = [],
  anyPermissions = [],
  organizationId: _organizationId,
  fallback = null,
  hideOnNoAccess = false,
  customCheck,
}: ProtectedComponentProps) {
  const { user, loading } = useAuth()
  const { hasRole } = usePermissions()
  
  // Use multiple permissions hooks for permission checking
  const requiredPermsCheck = useMultiplePermissions(requiredPermissions)
  const anyPermsCheck = useMultiplePermissions(anyPermissions)

  // Show loading state while auth is loading
  if (loading) {
    return hideOnNoAccess ? null : (
      <div className="inline-flex items-center px-4 py-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
        Loading...
      </div>
    )
  }

  // No user authenticated
  if (!user) {
    return hideOnNoAccess ? null : fallback
  }

  // Check organization access
  // Note: Supabase auth user doesn't have organization_id, this would need to be fetched from the database
  // For now, skip organization check as it requires database user data
  // if (organizationId && user.organization_id !== organizationId) {
  //   return hideOnNoAccess ? null : fallback
  // }

  // Check custom access function
  if (customCheck && !customCheck(user)) {
    return hideOnNoAccess ? null : fallback
  }

  // Check required role
  if (requiredRole && !hasRole(requiredRole)) {
    return hideOnNoAccess ? null : fallback
  }

  // Check required permissions (must have ALL)
  if (requiredPermissions.length > 0 && !requiredPermsCheck.hasAll()) {
    return hideOnNoAccess ? null : fallback
  }

  // Check any permissions (must have AT LEAST ONE)
  if (anyPermissions.length > 0 && !anyPermsCheck.hasAny()) {
    return hideOnNoAccess ? null : fallback
  }

  // All checks passed - render children
  return <>{children}</>
}

// Convenience components for common access patterns

/**
 * Only render for admin users
 */
export function AdminOnly({ children, fallback, hideOnNoAccess = false }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  hideOnNoAccess?: boolean
}) {
  return (
    <ProtectedComponent
      requiredRole="admin"
      fallback={fallback}
      hideOnNoAccess={hideOnNoAccess}
    >
      {children}
    </ProtectedComponent>
  )
}

/**
 * Only render for manager users and above (manager, admin)
 */
export function ManagerOnly({ children, fallback, hideOnNoAccess = false }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  hideOnNoAccess?: boolean
}) {
  return (
    <ProtectedComponent
      requiredRole="manager"
      fallback={fallback}
      hideOnNoAccess={hideOnNoAccess}
    >
      {children}
    </ProtectedComponent>
  )
}

/**
 * Only render for writer users and above (writer, manager, admin)
 */
export function WriterOnly({ children, fallback, hideOnNoAccess = false }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  hideOnNoAccess?: boolean
}) {
  return (
    <ProtectedComponent
      requiredRole="writer"
      fallback={fallback}
      hideOnNoAccess={hideOnNoAccess}
    >
      {children}
    </ProtectedComponent>
  )
}

/**
 * Only render for authenticated users (any role)
 */
export function AuthenticatedOnly({ children, fallback, hideOnNoAccess = false }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  hideOnNoAccess?: boolean
}) {
  return (
    <ProtectedComponent
      fallback={fallback}
      hideOnNoAccess={hideOnNoAccess}
    >
      {children}
    </ProtectedComponent>
  )
}

/**
 * Higher-order component version of ProtectedComponent
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  protectionProps: Omit<ProtectedComponentProps, 'children'>
) {
  return function ProtectedComponentWrapper(props: P) {
    return (
      <ProtectedComponent {...protectionProps}>
        <Component {...props} />
      </ProtectedComponent>
    )
  }
}

/**
 * Hook for imperative access checking
 */
export function useAccessControl() {
  const { user } = useAuth()
  const { hasRole, hasPermission } = usePermissions()

  const canAccess = React.useCallback((
    requirements: {
      requiredRole?: UserRole
      requiredPermissions?: Permission[]
      anyPermissions?: Permission[]
      organizationId?: string
      customCheck?: (user: unknown) => boolean
    }
  ): boolean => {
    if (!user) return false

    const {
      requiredRole,
      requiredPermissions = [],
      anyPermissions = [],
      organizationId: _organizationId,
      customCheck
    } = requirements

    // Check organization access
    // Note: Supabase auth user doesn't have organization_id, this would need to be fetched from the database
    // For now, skip organization check as it requires database user data
    // if (organizationId && user.organization_id !== organizationId) {
    //   return false
    // }

    // Check custom access function
    if (customCheck && !customCheck(user)) {
      return false
    }

    // Check required role
    if (requiredRole && !hasRole(requiredRole)) {
      return false
    }

    // Check required permissions (must have ALL)
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
      if (!hasAllPermissions) return false
    }

    // Check any permissions (must have AT LEAST ONE)
    if (anyPermissions.length > 0) {
      const hasAnyPermission = anyPermissions.some(permission => hasPermission(permission))
      if (!hasAnyPermission) return false
    }

    return true
  }, [user, hasRole, hasPermission])

  return {
    canAccess,
    user,
    isAdmin: hasRole('admin'),
    isManager: hasRole('manager'),
    isWriter: hasRole('writer'),
    isAuthenticated: !!user,
  }
} 