'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { 
  Users, UserPlus, UserX, ShieldAlert, Download, MoreVertical,
  Search, Filter, CheckCircle, AlertTriangle
} from 'lucide-react'
import { UserManagementDashboard } from './UserManagementDashboard'
import { UserLifecycleManager } from './UserLifecycleManager'
import { InvitationList } from './InvitationList'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  deactivatedUsers: number
  pendingInvitations: number
  adminUsers: number
  managerUsers: number
  writerUsers: number
  viewerUsers: number
}

export function EnhancedUserManagementDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('users')
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    deactivatedUsers: 0,
    pendingInvitations: 0,
    adminUsers: 0,
    managerUsers: 0,
    writerUsers: 0,
    viewerUsers: 0
  })

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    // Mock data for now
    setStats({
      totalUsers: 45,
      activeUsers: 42,
      deactivatedUsers: 3,
      pendingInvitations: 5,
      adminUsers: 2,
      managerUsers: 8,
      writerUsers: 25,
      viewerUsers: 10
    })
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'text-brand-600',
    bgColor = 'bg-brand-50'
  }: {
    title: string
    value: number
    icon: unknown
    color?: string
    bgColor?: string
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, roles, invitations, and lifecycle</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="text-brand-primary"
          bgColor="bg-brand-primary-light"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={CheckCircle}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Deactivated"
          value={stats.deactivatedUsers}
          icon={UserX}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          title="Pending Invites"
          value={stats.pendingInvitations}
          icon={AlertTriangle}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-primary-dark">{stats.adminUsers}</div>
              <div className="text-sm text-gray-500">Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-primary">{stats.managerUsers}</div>
              <div className="text-sm text-gray-500">Managers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.writerUsers}</div>
              <div className="text-sm text-gray-500">Writers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.viewerUsers}</div>
              <div className="text-sm text-gray-500">Viewers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Active Users
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <UserPlus className="h-4 w-4 mr-2" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="lifecycle">
            <ShieldAlert className="h-4 w-4 mr-2" />
            User Lifecycle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagementDashboard />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationList />
        </TabsContent>

        <TabsContent value="lifecycle">
          <UserLifecycleManager />
        </TabsContent>
      </Tabs>
    </div>
  )
} 