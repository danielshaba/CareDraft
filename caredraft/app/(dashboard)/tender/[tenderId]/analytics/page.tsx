'use client'

import React, { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Eye,
  Download,
  MessageSquare,
  Edit3
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Metric {
  label: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
}

interface ActivityItem {
  id: string
  user: string
  action: string
  section: string
  timestamp: string
  type: 'edit' | 'view' | 'comment' | 'export'
}

interface ComplianceItem {
  requirement: string
  status: 'complete' | 'incomplete' | 'needs-review'
  progress: number
  lastUpdated: string
}

export default function TenderAnalyticsPage() {
  // const params = useParams()
  // const tenderId = params.tenderId as string
  const [timeRange, setTimeRange] = useState('7d')

  const metrics: Metric[] = [
    {
      label: 'Completion Rate',
      value: '87%',
      change: '+12%',
      changeType: 'positive',
      icon: Target
    },
    {
      label: 'Team Engagement',
      value: '94%',
      change: '+8%',
      changeType: 'positive',
      icon: Users
    },
    {
      label: 'Time to Complete',
      value: '18 days',
      change: '-3 days',
      changeType: 'positive',
      icon: Clock
    },
    {
      label: 'Quality Score',
      value: '92/100',
      change: '+5',
      changeType: 'positive',
      icon: Award
    },
    {
      label: 'Compliance Rate',
      value: '96%',
      change: '+2%',
      changeType: 'positive',
      icon: CheckCircle2
    },
    {
      label: 'Collaboration',
      value: '156 actions',
      change: '+23',
      changeType: 'positive',
      icon: MessageSquare
    }
  ]

  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      user: 'Sarah Johnson',
      action: 'Updated pricing strategy',
      section: 'Commercial',
      timestamp: '2 hours ago',
      type: 'edit'
    },
    {
      id: '2',
      user: 'Michael Chen',
      action: 'Added compliance documentation',
      section: 'Quality Assurance',
      timestamp: '4 hours ago',
      type: 'edit'
    },
    {
      id: '3',
      user: 'Emma Williams',
      action: 'Reviewed technical approach',
      section: 'Technical',
      timestamp: '6 hours ago',
      type: 'view'
    },
    {
      id: '4',
      user: 'David Brown',
      action: 'Exported document draft',
      section: 'Export',
      timestamp: '8 hours ago',
      type: 'export'
    },
    {
      id: '5',
      user: 'Lisa Parker',
      action: 'Added comment on risk assessment',
      section: 'Risk Management',
      timestamp: '1 day ago',
      type: 'comment'
    }
  ]

  const complianceItems: ComplianceItem[] = [
    {
      requirement: 'CQC Registration Evidence',
      status: 'complete',
      progress: 100,
      lastUpdated: '2 hours ago'
    },
    {
      requirement: 'DBS Disclosure Policy',
      status: 'complete',
      progress: 100,
      lastUpdated: '4 hours ago'
    },
    {
      requirement: 'Safeguarding Procedures',
      status: 'needs-review',
      progress: 85,
      lastUpdated: '1 day ago'
    },
    {
      requirement: 'Staff Training Records',
      status: 'incomplete',
      progress: 60,
      lastUpdated: '2 days ago'
    },
    {
      requirement: 'Insurance Documentation',
      status: 'complete',
      progress: 100,
      lastUpdated: '3 hours ago'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit': return <Edit3 className="w-4 h-4 text-brand-500" />
      case 'view': return <Eye className="w-4 h-4 text-green-500" />
      case 'comment': return <MessageSquare className="w-4 h-4 text-purple-500" />
      case 'export': return <Download className="w-4 h-4 text-orange-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getComplianceStatus = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>
      case 'needs-review':
        return <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>
      case 'incomplete':
        return <Badge className="bg-red-100 text-red-800">Incomplete</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Yorkshire Community Care Services Tender</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <Icon className="w-8 h-8 text-brand-600" />
                      <div className={`text-sm font-medium ${
                        metric.changeType === 'positive' ? 'text-green-600' :
                        metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <div className="text-sm text-gray-600">{metric.label}</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Progress Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Section Completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { section: 'Executive Summary', progress: 100 },
                  { section: 'Technical Approach', progress: 95 },
                  { section: 'Commercial', progress: 85 },
                  { section: 'Quality Assurance', progress: 90 },
                  { section: 'Risk Management', progress: 75 },
                  { section: 'Implementation Plan', progress: 80 }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.section}</span>
                      <span className="font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Contribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Sarah Johnson', role: 'Project Lead', contributions: 45 },
                  { name: 'Michael Chen', role: 'Technical Lead', contributions: 38 },
                  { name: 'Emma Williams', role: 'Quality Manager', contributions: 29 },
                  { name: 'David Brown', role: 'Commercial Manager', contributions: 22 },
                  { name: 'Lisa Parker', role: 'Compliance Officer', contributions: 18 }
                ].map((member, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{member.contributions}</div>
                      <div className="text-sm text-gray-600">actions</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-gray-600">{activity.action}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {activity.section} • {activity.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{item.requirement}</h4>
                        {getComplianceStatus(item.status)}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Last updated: {item.lastUpdated}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Response Time (avg)</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-medium">2.3 hours</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quality Score Trend</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-medium">+12% this week</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Collaboration Index</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-medium">94% active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">On Track</div>
                      <div className="text-sm text-gray-600">All critical milestones met</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="font-medium">Attention Needed</div>
                      <div className="text-sm text-gray-600">2 compliance items need review</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 