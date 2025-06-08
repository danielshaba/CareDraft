'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrganizationManager } from '@/components/organization/OrganizationManager'
import { Building2, Plus } from 'lucide-react'

export default function OrganizationsPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  const mockOrganizations = [
    {
      id: 'org-1',
      name: 'CareDraft Main',
      description: 'Primary healthcare organization',
      memberCount: 25,
      status: 'active'
    },
    {
      id: 'org-2', 
      name: 'Care Partners Ltd',
      description: 'Secondary care partner organization',
      memberCount: 12,
      status: 'active'
    },
    {
      id: 'org-3',
      name: 'Health Solutions Inc',
      description: 'Consulting and advisory services',
      memberCount: 8,
      status: 'inactive'
    }
  ]

  if (selectedOrgId) {
    return (
      <OrganizationManager 
        organizationId={selectedOrgId}
        onClose={() => setSelectedOrgId(null)}
      />
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your organizations, settings, and members
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockOrganizations.map((org) => (
          <Card key={org.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{org.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className={`inline-block w-2 h-2 rounded-full ${
                        org.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-sm text-gray-500 capitalize">{org.status}</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-4">{org.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {org.memberCount} members
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedOrgId(org.id)}
                >
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="h-3 w-3 bg-green-500 rounded-full" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Organizations</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="h-3 w-3 bg-orange-500 rounded-full" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">45</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="h-3 w-3 bg-purple-500 rounded-full" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Members</p>
                <p className="text-2xl font-bold">15</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 