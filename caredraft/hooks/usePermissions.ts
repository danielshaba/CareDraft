'use client'

import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { 
  UserProfile, 
  UserRole, 
  Permission
} from '@/lib/auth.types'
import { 
  userHasRole, 
  userHasPermission, 
  userCanAccessOrganization,
  userCanManageUser
} from '@/lib/auth.utils'

/**
 * Comprehensive permissions hook
 * Provides role-based access control utilities
 */
export function usePermissions() {
  const { user } = useAuth()

  return {
    // Basic permission checks
    hasRole: (role: UserRole) => userHasRole(user, role),
    hasPermission: (permission: Permission) => userHasPermission(user, permission),
    
    // Organization access
    canAccessOrganization: (orgId: string) => userCanAccessOrganization(user, orgId),
    canManageUser: (targetUser: UserProfile) => userCanManageUser(user, targetUser),
    
    // Specific feature permissions
    canViewProposals: () => userHasPermission(user, 'view_proposals'),
    canCreateProposals: () => userHasPermission(user, 'create_proposals'),
    canEditProposals: () => userHasPermission(user, 'edit_proposals'),
    canDeleteProposals: () => userHasPermission(user, 'delete_proposals'),
    
    canViewAnswerBank: () => userHasPermission(user, 'view_answer_bank'),
    canEditAnswerBank: () => userHasPermission(user, 'edit_answer_bank'),
    
    canViewResearch: () => userHasPermission(user, 'view_research'),
    canCreateResearch: () => userHasPermission(user, 'create_research'),
    
    canManageUsers: () => userHasPermission(user, 'manage_users'),
    canManageOrganization: () => userHasPermission(user, 'manage_organization'),
    
    // Role checks
    isAdmin: () => userHasRole(user, 'admin'),
    isManager: () => userHasRole(user, 'manager'),
    isWriter: () => userHasRole(user, 'writer'),
    isViewer: () => userHasRole(user, 'viewer'),
    
    // Organization checks
    isInSameOrganization: (otherUser: UserProfile) => {
      if (!user || !otherUser) return false
      return user.organization_id === otherUser.organization_id
    },
    getUserOrganizationId: () => user?.organization_id || null,
    
    // Current user info
    getCurrentUser: () => user,
    getCurrentRole: () => user?.role || null,
  }
}

/**
 * Hook to check multiple permissions at once
 */
export function useMultiplePermissions(permissions: Permission[]) {
  const { user } = useAuth()
  
  return {
    hasAll: () => permissions.every(permission => userHasPermission(user, permission)),
    hasAny: () => permissions.some(permission => userHasPermission(user, permission)),
    hasNone: () => permissions.every(permission => !userHasPermission(user, permission)),
    permissions: permissions.reduce((acc, permission) => {
      acc[permission] = userHasPermission(user, permission)
      return acc
    }, {} as Record<Permission, boolean>)
  }
}

/**
 * Hook to check if user can access a specific proposal
 */
export function useCanAccessProposal(proposalOrgId?: string) {
  const { user } = useAuth()
  const permissions = usePermissions()
  
  if (!user || !proposalOrgId) return false
  
  // Must have view permission and be in same organization
  return permissions.canViewProposals() && permissions.canAccessOrganization(proposalOrgId)
}

/**
 * Hook to check if user can edit a specific proposal
 */
export function useCanEditProposal(proposalOrgId?: string, proposalCreatorId?: string) {
  const { user } = useAuth()
  const permissions = usePermissions()
  
  if (!user || !proposalOrgId) return false
  
  // Must be in same organization
  if (!permissions.canAccessOrganization(proposalOrgId)) return false
  
  // Admins and managers can edit any proposal in their org
  if (permissions.isAdmin() || permissions.isManager()) {
    return permissions.canEditProposals()
  }
  
  // Writers can edit their own proposals
  if (permissions.isWriter() && proposalCreatorId === user.id) {
    return permissions.canEditProposals()
  }
  
  return false
}

/**
 * Hook for user management permissions
 */
export function useUserManagement() {
  const { user } = useAuth()
  const permissions = usePermissions()
  
  return {
    canCreateUser: () => permissions.canManageUsers(),
    canEditUser: (targetUser: UserProfile) => permissions.canManageUser(targetUser),
    canDeleteUser: (targetUser: UserProfile) => {
      // Only admins can delete users, and not themselves
      return permissions.isAdmin() && 
             permissions.canManageUser(targetUser) && 
             targetUser.id !== user?.id
    },
    canChangeUserRole: (targetUser: UserProfile, newRole: UserRole) => {
      if (!permissions.canManageUser(targetUser)) return false
      
      // Admins can assign any role
      if (permissions.isAdmin()) return true
      
      // Managers can only assign writer or viewer roles
      if (permissions.isManager()) {
        return newRole === 'writer' || newRole === 'viewer'
      }
      
      return false
    },
    canViewUserList: () => permissions.canManageUsers(),
    canInviteUsers: () => permissions.canManageUsers(),
  }
}

/**
 * Hook for organization-level permissions
 */
export function useOrganizationPermissions() {
  const permissions = usePermissions()
  
  return {
    canViewOrganizationSettings: () => permissions.canManageOrganization(),
    canEditOrganizationSettings: () => permissions.canManageOrganization(),
    canManageSubscription: () => permissions.canManageOrganization(),
    canViewUsageStatistics: () => permissions.canManageOrganization() || permissions.canManageUsers(),
    canExportData: () => permissions.canManageOrganization(),
    canDeleteOrganization: () => permissions.isAdmin() && permissions.canManageOrganization(),
  }
}

/**
 * Hook for proposal-specific permissions with fine-grained control
 */
export function useProposalPermissions(proposal?: {
  organization_id: string
  created_by: string
  status?: string
}) {
  const { user } = useAuth()
  const permissions = usePermissions()
  
  if (!user || !proposal) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canSubmit: false,
      canApprove: false,
      canArchive: false,
    }
  }
  
  const isInSameOrg = permissions.canAccessOrganization(proposal.organization_id)
  const isCreator = proposal.created_by === user.id
  const isDraft = proposal.status === 'draft'
  
  return {
    canView: isInSameOrg && permissions.canViewProposals(),
    
    canEdit: isInSameOrg && (
      (permissions.isAdmin() || permissions.isManager()) ||
      (permissions.isWriter() && isCreator && isDraft)
    ) && permissions.canEditProposals(),
    
    canDelete: isInSameOrg && (
      permissions.isAdmin() ||
      (permissions.isManager() && permissions.canDeleteProposals()) ||
      (permissions.isWriter() && isCreator && isDraft && permissions.canDeleteProposals())
    ),
    
    canSubmit: isInSameOrg && (
      (permissions.isAdmin() || permissions.isManager()) ||
      (permissions.isWriter() && isCreator)
    ) && isDraft,
    
    canApprove: isInSameOrg && (permissions.isAdmin() || permissions.isManager()),
    
    canArchive: isInSameOrg && (permissions.isAdmin() || permissions.isManager()),
  }
}

/**
 * Hook for answer bank permissions
 */
export function useAnswerBankPermissions() {
  const permissions = usePermissions()
  
  return {
    canViewAnswers: () => permissions.canViewAnswerBank(),
    canCreateAnswers: () => permissions.canEditAnswerBank(),
    canEditAnswers: () => permissions.canEditAnswerBank(),
    canDeleteAnswers: () => permissions.canEditAnswerBank() && (
      permissions.isAdmin() || permissions.isManager()
    ),
    canCategorizeAnswers: () => permissions.canEditAnswerBank(),
    canExportAnswers: () => permissions.canViewAnswerBank() && (
      permissions.isAdmin() || permissions.isManager()
    ),
  }
}

/**
 * Hook for research session permissions
 */
export function useResearchPermissions() {
  const permissions = usePermissions()
  
  return {
    canViewResearch: () => permissions.canViewResearch(),
    canCreateResearch: () => permissions.canCreateResearch(),
    canEditOwnResearch: () => permissions.canCreateResearch(),
    canEditAllResearch: () => permissions.canCreateResearch() && (
      permissions.isAdmin() || permissions.isManager()
    ),
    canDeleteResearch: () => permissions.canCreateResearch() && (
      permissions.isAdmin() || permissions.isManager()
    ),
    canExportResearch: () => permissions.canViewResearch() && (
      permissions.isAdmin() || permissions.isManager()
    ),
  }
} 