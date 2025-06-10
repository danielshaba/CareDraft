'use client'

import React, { useState } from 'react'
import { 
  X, 
  Shield, 
  AlertTriangle, 
  Check,
  User,
  Users,
  Crown,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingButton } from '@/components/ui/loading-button'
import { useUserManagement } from '@/hooks/usePermissions'
import { createClient } from '@/lib/supabase'
import type { UserRole, Permission, ROLE_PERMISSIONS } from '@/lib/auth.types'
import type { Database } from '@/lib/database.types'

type User = Database['public']['Tables']['users']['Row']

interface RoleAssignmentModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onRoleChanged?: (userId: string, newRole: UserRole) => void
}

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  admin: Crown,
  manager: Users,
  writer: User,
  viewer: Eye
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  manager: 'bg-brand-100 text-brand-800 border-brand-200',
  writer: 'bg-green-100 text-green-800 border-green-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200'
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full system access including user management and organization settings',
  manager: 'Can manage users and all proposals within the organization',
  writer: 'Can create and edit proposals, access answer bank and research',
  viewer: 'Read-only access to proposals, answer bank, and research'
}

// Import the actual permissions mapping
const ROLE_PERMISSIONS_MAP: Record<UserRole, Permission[]> = {
  viewer: [
    'view_proposals',
    'view_answer_bank',
    'view_research',
  ],
  writer: [
    'view_proposals',
    'create_proposals',
    'edit_proposals',
    'view_answer_bank',
    'edit_answer_bank',
    'view_research',
    'create_research',
  ],
  manager: [
    'view_proposals',
    'create_proposals',
    'edit_proposals',
    'delete_proposals',
    'view_answer_bank',
    'edit_answer_bank',
    'view_research',
    'create_research',
    'manage_users',
  ],
  admin: [
    'view_proposals',
    'create_proposals',
    'edit_proposals',
    'delete_proposals',
    'manage_users',
    'manage_organization',
    'view_answer_bank',
    'edit_answer_bank',
    'view_research',
    'create_research',
  ],
}

const PERMISSION_LABELS: Record<Permission, string> = {
  'view_proposals': 'View Proposals',
  'create_proposals': 'Create Proposals',
  'edit_proposals': 'Edit Proposals',
  'delete_proposals': 'Delete Proposals',
  'manage_users': 'Manage Users',
  'manage_organization': 'Manage Organization',
  'view_answer_bank': 'View Answer Bank',
  'edit_answer_bank': 'Edit Answer Bank',
  'view_research': 'View Research',
  'create_research': 'Create Research'
}

export function RoleAssignmentModal({ 
  user, 
  isOpen, 
  onClose, 
  onRoleChanged 
}: RoleAssignmentModalProps) {
  const userManagement = useUserManagement()
  const supabase = createClient()
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      onClose()
      return
    }

    // Check if user can change to this role
    if (!userManagement.canChangeUserRole(user, selectedRole)) {
      setError('You do not have permission to assign this role')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: selectedRole })
        .eq('id', user.id)

      if (updateError) throw updateError

      onRoleChanged?.(user.id, selectedRole)
      onClose()
    } catch {
      console.error('Error updating user role:', err)
      setError('Failed to update user role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableRoles = (): UserRole[] => {
    const roles: UserRole[] = ['viewer', 'writer', 'manager', 'admin']
    return roles.filter(role => userManagement.canChangeUserRole(user, role))
  }

  const availableRoles = getAvailableRoles()
  const hasChanges = selectedRole !== user.role

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <Shield className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Role</h2>
              <p className="text-sm text-gray-600">
                Change role for {user.full_name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current User Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <Badge className={ROLE_COLORS[user.role]}>
                  Current: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select New Role</h3>
            <div className="space-y-3">
              {availableRoles.map((role) => {
                const Icon = ROLE_ICONS[role]
                const isSelected = selectedRole === role
                const isCurrent = user.role === role
                
                return (
                  <div
                    key={role}
                    className={`
                      relative border rounded-lg p-4 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-brand-500 bg-brand-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                      ${isCurrent ? 'opacity-75' : ''}
                    `}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${ROLE_COLORS[role].replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', '')}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {role}
                          </h4>
                          {isCurrent && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                          {isSelected && !isCurrent && (
                            <Check className="h-4 w-4 text-brand-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {ROLE_DESCRIPTIONS[role]}
                        </p>
                        
                        {/* Permissions Preview */}
                        <div className="flex flex-wrap gap-1">
                          {ROLE_PERMISSIONS_MAP[role].map((permission) => (
                            <Badge 
                              key={permission} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {PERMISSION_LABELS[permission]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Warning for privilege escalation */}
          {selectedRole === 'admin' && user.role !== 'admin' && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Admin Role Assignment</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You are about to grant admin privileges to this user. Admins have full access to 
                  the system including user management and organization settings.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleRoleChange}
            loading={loading}
            disabled={!hasChanges || loading}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            {hasChanges ? 'Update Role' : 'No Changes'}
          </LoadingButton>
        </div>
      </div>
    </div>
  )
} 