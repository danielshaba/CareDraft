'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { 
  Users, UserX, UserCheck, ShieldAlert, Download, Calendar, Clock, 
  MoreVertical, Search, Filter, AlertTriangle, CheckCircle, 
  FileDown, BarChart3, Activity, User, Shield
} from 'lucide-react'

export function UserLifecycleManager() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('deactivated')
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  const mockDeactivatedUsers = [
    {
      id: '1',
      email: 'deactivated@example.com',
      full_name: 'John Doe',
      role: 'writer',
      deactivated_at: new Date().toISOString(),
      deactivation_reason: 'Account violation'
    },
    {
      id: '2',
      email: 'inactive@example.com',
      full_name: 'Jane Smith',
      role: 'viewer',
      deactivated_at: new Date(Date.now() - 86400000).toISOString(),
      deactivation_reason: 'Inactive for 90 days'
    }
  ]

  const mockAuditLogs = [
    {
      id: '1',
      actionType: 'user_deactivated',
      actorEmail: 'admin@example.com',
      targetUserEmail: 'user@example.com',
      createdAt: new Date().toISOString(),
      metadata: { reason: 'Policy violation' }
    },
    {
      id: '2',
      actionType: 'role_changed',
      actorEmail: 'admin@example.com',
      targetUserEmail: 'user2@example.com',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      metadata: { from: 'viewer', to: 'writer' }
    }
  ]

  const handleReactivateUser = (userId: string) => {
    toast.success('User Reactivated', `User ${userId} has been successfully reactivated`)
  }

  const handleExportData = (userId: string) => {
    toast.info('Export Started', 'User data export has been initiated')
  }

  const handleBulkOperation = (operation: string) => {
    toast.info('Bulk Operation', `${operation} operation has been initiated`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Lifecycle Management</h2>
          <p className="text-gray-600">Manage user deactivation, audit logs, and compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleBulkOperation('Cleanup')}>
            <Filter className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
          <Button onClick={() => handleBulkOperation('Export All')}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="deactivated">
            <UserX className="h-4 w-4 mr-2" />
            Deactivated Users
          </TabsTrigger>
          <TabsTrigger value="audit-logs">
            <BarChart3 className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <Activity className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deactivated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Deactivated Users ({mockDeactivatedUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDeactivatedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{user.role}</Badge>
                            <span className="text-xs text-gray-500">
                              Deactivated {new Date(user.deactivated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Reason: {user.deactivation_reason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportData(user.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleReactivateUser(user.id)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Reactivate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Audit Logs ({mockAuditLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAuditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.actionType === 'user_deactivated' ? 'destructive' : 'default'}>
                          {log.actionType.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          by {log.actorEmail}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        Target: {log.targetUserEmail}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Deactivated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockDeactivatedUsers.length}</div>
                <p className="text-xs text-gray-600">+2 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAuditLogs.length}</div>
                <p className="text-xs text-gray-600">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Compliant</span>
                </div>
                <p className="text-xs text-gray-600">All requirements met</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 