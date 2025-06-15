"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Settings, 
  Users, 
  Crown, 
  Globe, 
  Mail, 
  Phone,
  MapPin,
  Clock,
  ChevronLeft,
  Plus
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import type { Organization } from '@/lib/services/organization-service'
import { useAuth } from '@/components/providers/MinimalAuthProvider'

interface OrganizationManagerProps {
  organizationId: string
  onClose?: () => void
}

export function OrganizationManager({ organizationId, onClose }: OrganizationManagerProps) {
  const { user } = useAuth()
  const { error: showError } = useToast()
  
  const [activeTab, setActiveTab] = useState<'details' | 'settings' | 'members'>('details')
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganization()
  }, [organizationId])

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      // For now, return mock data since table doesn't exist yet
      const mockOrganization: Organization = {
        id: organizationId,
        name: 'CareDraft Organization',
        slug: 'caredraft-org',
        description: 'Healthcare proposal management organization',
        logo_url: undefined,
        website: 'https://caredraft.co.uk',
        industry: 'Healthcare',
        size: '50-100',
        billing_email: 'billing@caredraft.co.uk',
        phone: '+44 20 1234 5678',
        address: '123 Healthcare Street',
        city: 'London',
        country: 'United Kingdom',
        timezone: 'Europe/London',
        settings: {
          branding: {
            primary_color: '#3B82F6',
            secondary_color: '#64748B'
          },
          features: {
            research_sessions_enabled: true,
            compliance_tracking_enabled: true,
            advanced_analytics_enabled: false,
            api_access_enabled: false,
            sso_enabled: false
          },
          limits: {
            max_users: 10,
            max_proposals: 50,
            max_storage_gb: 5,
            max_api_calls_per_month: 1000
          },
          workflow: {
            require_approval_for_proposals: false,
            auto_archive_after_days: 365
          },
          notifications: {
            system_announcements: true,
            feature_updates: true,
            security_alerts: true
          }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: user?.id || ''
      }
      
      setOrganization(mockOrganization)
    } catch (error) {
      console.error('Error fetching organization:', error)
      showError('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading organization...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Organization not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-2xl font-bold">Organization Management</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'details'
              ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Details
        </button>
        
        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'settings'
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        )}
        
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'members'
              ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Users className="h-4 w-4" />
          Members
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Organization Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-brand-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-brand-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{organization.name}</h2>
                <p className="text-gray-600">{organization.description}</p>
              </div>
            </div>
          </div>

          {/* Organization Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Organization Name</label>
                  <p className="mt-1 text-gray-900">{organization.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="mt-1 text-gray-900">{organization.description || 'No description'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Industry</label>
                  <p className="mt-1 text-gray-900">{organization.industry || 'Not specified'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Organization Size</label>
                  <p className="mt-1 text-gray-900">{organization.size || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600">Website</label>
                    <p className="mt-1 text-gray-900">{organization.website || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600">Billing Email</label>
                    <p className="mt-1 text-gray-900">{organization.billing_email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="mt-1 text-gray-900">{organization.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <div className="mt-1 text-gray-900">
                      {[organization.address, organization.city, organization.country]
                        .filter(Boolean)
                        .join(', ') || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600">Timezone</label>
                    <p className="mt-1 text-gray-900">{organization.timezone || 'UTC'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'settings' && user?.role === 'admin' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Organization Settings</h3>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feature Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={organization.settings.features.research_sessions_enabled}
                    readOnly
                    className="rounded border-gray-300"
                  />
                  <span>Research Sessions Enabled</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={organization.settings.features.compliance_tracking_enabled}
                    readOnly
                    className="rounded border-gray-300"
                  />
                  <span>Compliance Tracking Enabled</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={organization.settings.features.advanced_analytics_enabled}
                    readOnly
                    className="rounded border-gray-300"
                  />
                  <span>Advanced Analytics Enabled</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Max Users</label>
                  <p className="mt-1 text-gray-900">{organization.settings.limits.max_users}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Max Proposals</label>
                  <p className="mt-1 text-gray-900">{organization.settings.limits.max_proposals}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Storage Limit (GB)</label>
                  <p className="mt-1 text-gray-900">{organization.settings.limits.max_storage_gb}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">API Calls/Month</label>
                  <p className="mt-1 text-gray-900">{organization.settings.limits.max_api_calls_per_month}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Organization Members</h3>
            {user?.role === 'admin' && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">
                    <Crown className="h-3 w-3 mr-1" />
                    {user?.role}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Owner
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 