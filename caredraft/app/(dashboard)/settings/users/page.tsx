import React from 'react'
import { AuthenticatedLayout } from '@/components/shared/Layout'
import { UserManagementDashboard } from '@/components/user-management/UserManagementDashboard'
import { ProtectedComponent } from '@/components/ProtectedComponent'

export default function UserManagementPage() {
  return (
    <AuthenticatedLayout>
      <ProtectedComponent 
        requiredPermissions={['manage_users']}
        fallback={
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600">
                You don&apos;t have permission to access user management. 
                Contact your administrator if you need access.
              </p>
            </div>
          </div>
        }
      >
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage users, roles, and permissions for your organization
            </p>
          </div>
          
          <UserManagementDashboard />
        </div>
      </ProtectedComponent>
    </AuthenticatedLayout>
  )
} 
// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'
