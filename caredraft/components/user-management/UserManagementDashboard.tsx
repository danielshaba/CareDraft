'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus, 
  Users, 
  Shield, 
  Mail,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingButton } from '@/components/ui/loading-button'
import { useUserManagement } from '@/hooks/usePermissions'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { createClient } from '@/lib/supabase'
import { RoleAssignmentModal } from './RoleAssignmentModal'
import { InviteUserModal } from './InviteUserModal'
import { InvitationList } from './InvitationList'
import type { Database } from '@/lib/database.types'
import { formatDistanceToNow } from 'date-fns'

// Types
type User = Database['public']['Tables']['users']['Row']
type UserRole = Database['public']['Enums']['user_role']

interface UserWithStats extends User {
  last_active?: string | null
  proposal_count?: number
  organization_name?: string
}

interface UserManagementState {
  users: UserWithStats[]
  filteredUsers: UserWithStats[]
  loading: boolean
  error: string | null
  searchQuery: string
  roleFilter: UserRole | 'all'
  currentPage: number
  usersPerPage: number
  totalUsers: number
  selectedUsers: string[]
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800', 
  writer: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800'
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  writer: 'Writer', 
  viewer: 'Viewer'
}

export function UserManagementDashboard() {
  const { user: currentUser } = useAuth()
  const userManagement = useUserManagement()
  const supabase = createClient()

  const [state, setState] = useState<UserManagementState>({
    users: [],
    filteredUsers: [],
    loading: true,
    error: null,
    searchQuery: '',
    roleFilter: 'all',
    currentPage: 1,
    usersPerPage: 10,
    totalUsers: 0,
    selectedUsers: []
  })

  const [roleModalUser, setRoleModalUser] = useState<UserWithStats | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  // Load users
  const loadUsers = async () => {
    if (!currentUser?.organization_id) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', currentUser.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const usersWithStats: UserWithStats[] = users.map(user => ({
        ...user,
        last_active: user.updated_at,
        proposal_count: 0 // TODO: Add actual proposal count
      }))

      setState(prev => ({
        ...prev,
        users: usersWithStats,
        filteredUsers: usersWithStats,
        totalUsers: usersWithStats.length,
        loading: false
      }))
    } catch {
      console.error('Error loading users:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to load users',
        loading: false
      }))
    }
  }

  // Filter users based on search and filters
  const filterUsers = () => {
    let filtered = [...state.users]

    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (state.roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === state.roleFilter)
    }

    setState(prev => ({
      ...prev,
      filteredUsers: filtered,
      totalUsers: filtered.length,
      currentPage: 1
    }))
  }

  // Handle search
  const handleSearch = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }

  // Handle role filter
  const handleRoleFilter = (role: UserRole | 'all') => {
    setState(prev => ({ ...prev, roleFilter: role }))
  }

  // Get current page users
  const getCurrentPageUsers = () => {
    const startIndex = (state.currentPage - 1) * state.usersPerPage
    const endIndex = startIndex + state.usersPerPage
    return state.filteredUsers.slice(startIndex, endIndex)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }))
  }

  // Calculate pagination
  const totalPages = Math.ceil(state.totalUsers / state.usersPerPage)
  const currentPageUsers = getCurrentPageUsers()
  const startIndex = (state.currentPage - 1) * state.usersPerPage + 1
  const endIndex = Math.min(startIndex + state.usersPerPage - 1, state.totalUsers)

  // Effects
  useEffect(() => {
    loadUsers()
  }, [currentUser?.organization_id])

  useEffect(() => {
    filterUsers()
  }, [state.searchQuery, state.roleFilter, state.users])

  if (!userManagement.canViewUserList()) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">You don't have permission to view the user list.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Current Users
            </div>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invitations
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' ? (
        <>
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={state.searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Simple Role Filter Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={state.roleFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRoleFilter('all')}
                >
                  All
                </Button>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <Button
                    key={role}
                    variant={state.roleFilter === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRoleFilter(role as UserRole)}
                  >
                    {label}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  onClick={loadUsers}
                  disabled={state.loading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            {userManagement.canInviteUsers() && (
              <Button 
                className="gap-2"
                onClick={() => setInviteModalOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                Invite User
              </Button>
            )}
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{state.users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = state.users.filter(u => u.role === role).length
          return (
            <Card key={role}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Shield className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{label}s</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({state.totalUsers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : state.error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{state.error}</p>
              <Button 
                variant="outline" 
                onClick={loadUsers}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : currentPageUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {state.searchQuery || state.roleFilter !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'No users in your organization yet.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Last Active</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={ROLE_COLORS[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            {user.last_active 
                              ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true })
                              : 'Never'
                            }
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {user.created_at 
                              ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
                              : 'Unknown'
                            }
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setRoleModalUser(user)}
                              title="Edit Role"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                title="Deactivate User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex} to {endIndex} of {state.totalUsers} users
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(state.currentPage - 1)}
                      disabled={state.currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={page === state.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(state.currentPage + 1)}
                      disabled={state.currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

        </>
      ) : (
        <InvitationList 
          onInviteUser={() => setInviteModalOpen(true)}
        />
      )}

      {/* Role Assignment Modal */}
      {roleModalUser && (
        <RoleAssignmentModal
          user={roleModalUser}
          isOpen={!!roleModalUser}
          onClose={() => setRoleModalUser(null)}
          onRoleChanged={async (userId: string, newRole: UserRole) => {
            try {
              // Update user role in database
              const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId)

              if (error) throw error

              // Update local state
              setState(prev => ({
                ...prev,
                users: prev.users.map(u => 
                  u.id === userId ? { ...u, role: newRole } : u
                ),
                filteredUsers: prev.filteredUsers.map(u => 
                  u.id === userId ? { ...u, role: newRole } : u
                )
              }))

              setRoleModalUser(null)
            } catch {
              console.error('Error updating user role:', error)
              // Handle error (could add toast notification here)
            }
          }}
        />
      )}

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInviteSent={() => {
          // Refresh invitations if on invitations tab
          if (activeTab === 'invitations') {
            // The InvitationList component will handle its own refresh
          }
        }}
      />
    </div>
  )
} 