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

  // Convert Supabase Auth User to UserProfile-compatible object for permission checking
  const userProfile: UserProfile | null = user ? {
    id: user.id,
    auth_id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || '',
    role: user.user_metadata?.role || 'viewer',
    organization_id: user.user_metadata?.organization_id || '',
    email_confirmed: user.email_confirmed_at !== null,
    created_at: user.created_at,
    updated_at: user.updated_at || user.created_at
  } as UserProfile : null

  return {
    // Basic permission checks
    hasRole: (role: UserRole) => userHasRole(userProfile, role),
    hasPermission: (permission: Permission) => userHasPermission(userProfile, permission),
    
    // Organization access
    canAccessOrganization: (orgId: string) => userCanAccessOrganization(userProfile, orgId),
    canManageUser: (targetUser: UserProfile) => userCanManageUser(userProfile, targetUser),
    
    // Specific feature permissions
    canViewProposals: () => userHasPermission(userProfile, 'view_proposals'),
    canCreateProposals: () => userHasPermission(userProfile, 'create_proposals'),
    canEditProposals: () => userHasPermission(userProfile, 'edit_proposals'),
    canDeleteProposals: () => userHasPermission(userProfile, 'delete_proposals'),
    
    canViewAnswerBank: () => userHasPermission(userProfile, 'view_answer_bank'),
    canEditAnswerBank: () => userHasPermission(userProfile, 'edit_answer_bank'),
    
    canViewResearch: () => userHasPermission(userProfile, 'view_research'),
    canCreateResearch: () => userHasPermission(userProfile, 'create_research'),
    
    canManageUsers: () => userHasPermission(userProfile, 'manage_users'),
    canManageOrganization: () => userHasPermission(userProfile, 'manage_organization'),
    
    // Role checks
    isAdmin: () => userHasRole(userProfile, 'admin'),
    isManager: () => userHasRole(userProfile, 'manager'),
    isWriter: () => userHasRole(userProfile, 'writer'),
    isViewer: () => userHasRole(userProfile, 'viewer'),
    
    // Organization checks
    isInSameOrganization: (otherUser: UserProfile) => {
      if (!userProfile || !otherUser) return false
      return userProfile.organization_id === otherUser.organization_id
    },
    getUserOrganizationId: () => userProfile?.organization_id || null,
    
    // Current user info
    getCurrentUser: () => userProfile,
    getCurrentRole: () => userProfile?.role || null,
  }
}

/**
 * Hook to check multiple permissions at once
 */
export function useMultiplePermissions(permissions: Permission[]) {
  const { user } = useAuth()
  
  // Convert Supabase Auth User to UserProfile-compatible object for permission checking
  const userProfile: UserProfile | null = user ? {
    id: user.id,
    auth_id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || '',
    role: user.user_metadata?.role || 'viewer',
    organization_id: user.user_metadata?.organization_id || '',
    email_confirmed: user.email_confirmed_at !== null,
    created_at: user.created_at,
    updated_at: user.updated_at || user.created_at
  } as UserProfile : null
  
  return {
    hasAll: () => permissions.every(permission => userHasPermission(userProfile, permission)),
    hasAny: () => permissions.some(permission => userHasPermission(userProfile, permission)),
    hasNone: () => permissions.every(permission => !userHasPermission(userProfile, permission)),
    permissions: permissions.reduce((acc, permission) => {
      acc[permission] = userHasPermission(userProfile, permission)
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