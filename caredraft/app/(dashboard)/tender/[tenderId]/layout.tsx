'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  FileText, 
  Upload, 
  List, 
  Edit3, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Target,
  Users,
  Brain,
  Download,
  BarChart3
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TENDER_TABS } from '@/lib/types/tender'

interface TenderLayoutProps {
  children: React.ReactNode
}

export default function TenderLayout({ children }: TenderLayoutProps) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const tenderId = params?.tenderId as string

  const [activeTab, setActiveTab] = useState('summary')
  const [tenderData, setTenderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Extract current tab from pathname
  useEffect(() => {
    const pathSegments = pathname.split('/')
    const tabFromUrl = pathSegments[pathSegments.length - 1]
    
    if (TENDER_TABS.find(tab => tab.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    } else {
      setActiveTab('summary')
    }
  }, [pathname])

  // Mock tender data - replace with actual API call
  useEffect(() => {
    const loadTenderData = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setTenderData({
        id: tenderId,
        title: 'NHS Community Care Services - Yorkshire Region',
        issuing_authority: 'NHS Yorkshire and Humber ICB',
        deadline: '2024-02-15T17:00:00Z',
        contract_value: 250000000, // £2.5M
        region: 'Yorkshire',
        status: 'draft',
        current_step: 2,
        progress_percentage: 25,
        bid_decision: 'pending',
        risk_score: 35,
        created_at: '2024-01-15T09:00:00Z'
      })
      setIsLoading(false)
    }

    if (tenderId) {
      loadTenderData()
    }
  }, [tenderId])

  const getTabIcon = (iconName: string) => {
    const icons = {
      FileText,
      Upload,
      List,
      Edit3,
      CheckCircle2,
      Brain,
      Users,
      Download,
      BarChart3
    }
    const Icon = icons[iconName as keyof typeof icons] || FileText
    return Icon
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      analyzing: 'bg-brand-100 text-brand-800',
      strategy: 'bg-purple-100 text-purple-800',
      questions: 'bg-yellow-100 text-yellow-800',
      review: 'bg-orange-100 text-orange-800',
      submitted: 'bg-green-100 text-green-800',
      won: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-600'
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600'
    if (score < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tender Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={getStatusColor(tenderData?.status)}>
                    {tenderData?.status?.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className={getRiskColor(tenderData?.risk_score)}>
                    Risk: {tenderData?.risk_score}%
                  </Badge>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {tenderData?.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {tenderData?.issuing_authority}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {formatCurrency(tenderData?.contract_value)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due: {formatDate(tenderData?.deadline)}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Progress: {tenderData?.progress_percentage}%
                </div>
                <Progress 
                  value={tenderData?.progress_percentage} 
                  className="mb-3"
                />
                <div className="text-xs text-gray-500">
                  Step {tenderData?.current_step} of 11
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {TENDER_TABS.map((tab) => {
                const Icon = getTabIcon(tab.icon)
                const isActive = activeTab === tab.id
                
                return (
                  <Link
                    key={tab.id}
                    href={`/tender/${tenderId}/${tab.id}`}
                    className={`
                      relative py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${isActive 
                        ? 'border-teal-500 text-teal-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.title}
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Documents
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Assign Team
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Set Deadlines
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Deadlines */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Key Deadlines</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-red-500" />
                    <div>
                      <div className="font-medium">Final Submission</div>
                      <div className="text-gray-500">{formatDate(tenderData?.deadline)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <div>
                      <div className="font-medium">Q&A Deadline</div>
                      <div className="text-gray-500">Jan 30, 2024</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Team Members</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-600 text-xs font-medium">JD</span>
                    </div>
                    <div>
                      <div className="font-medium">John Doe</div>
                      <div className="text-gray-500 text-xs">Lead</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-600 text-xs font-medium">AS</span>
                    </div>
                    <div>
                      <div className="font-medium">Alice Smith</div>
                      <div className="text-gray-500 text-xs">Writer</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 