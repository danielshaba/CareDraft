'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Users,
  Edit,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Shield,
  Brain,
  ExternalLink,
  Star
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Volume {
  id: string
  title: string
  sections: Section[]
}

interface Section {
  id: string
  title: string
  status: 'not_started' | 'in_progress' | 'completed' | 'review'
  owner?: string
  due_date?: string
  word_limit?: number
  word_count?: number
}

interface ComplianceRequirement {
  id: string
  title: string
  status: 'met' | 'partial' | 'missing' | 'not_applicable'
  priority: 'high' | 'medium' | 'low'
  description: string
  link?: string
}

interface RiskFactor {
  category: string
  risk: string
  level: 'high' | 'medium' | 'low'
  impact: number
  mitigation?: string
}

export default function TenderSummaryPage() {
  const [volumes] = useState<Volume[]>([
    {
      id: 'vol-1',
      title: 'Volume 1: Technical Proposal',
      sections: [
        {
          id: 'sec-1-1',
          title: 'Service Delivery Approach',
          status: 'in_progress',
          owner: 'Alice Smith',
          due_date: '2024-01-25',
          word_limit: 800,
          word_count: 485
        },
        {
          id: 'sec-1-2',
          title: 'Quality Management Framework',
          status: 'not_started',
          owner: 'John Doe',
          due_date: '2024-01-28',
          word_limit: 600,
          word_count: 0
        },
        {
          id: 'sec-1-3',
          title: 'Risk Management Strategy',
          status: 'completed',
          owner: 'Sarah Wilson',
          due_date: '2024-01-22',
          word_limit: 500,
          word_count: 492
        }
      ]
    },
    {
      id: 'vol-2',
      title: 'Volume 2: Commercial Proposal',
      sections: [
        {
          id: 'sec-2-1',
          title: 'Pricing Schedule',
          status: 'not_started',
          owner: 'Mike Johnson',
          due_date: '2024-01-30',
          word_limit: 300,
          word_count: 0
        },
        {
          id: 'sec-2-2',
          title: 'Value for Money Statement',
          status: 'review',
          owner: 'Alice Smith',
          due_date: '2024-01-26',
          word_limit: 750,
          word_count: 742
        }
      ]
    }
  ])

  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set(['vol-1']))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'risk' | 'compliance' | 'deadlines'>('risk')

  // Mock data for risk assessment
  const riskScore = 73
  const bidRecommendation = 'BID'
  
  const riskFactors: RiskFactor[] = [
    {
      category: 'Technical',
      risk: 'Complex integration requirements',
      level: 'medium',
      impact: 6,
      mitigation: 'Leverage existing partnerships'
    },
    {
      category: 'Commercial',
      risk: 'Tight pricing requirements',
      level: 'high',
      impact: 8,
      mitigation: 'Value engineering approach'
    },
    {
      category: 'Timeline',
      risk: 'Aggressive delivery schedule',
      level: 'medium',
      impact: 5,
      mitigation: 'Phased implementation'
    },
    {
      category: 'Resource',
      risk: 'Specialized skill requirements',
      level: 'low',
      impact: 3,
      mitigation: 'Training and recruitment plan'
    }
  ]

  const complianceRequirements: ComplianceRequirement[] = [
    {
      id: 'cqc',
      title: 'CQC Registration',
      status: 'met',
      priority: 'high',
      description: 'Current CQC registration required',
      link: 'https://cqc.org.uk'
    },
    {
      id: 'tupe',
      title: 'TUPE Compliance',
      status: 'partial',
      priority: 'high',
      description: 'Transfer of undertakings compliance'
    },
    {
      id: 'gdpr',
      title: 'GDPR Compliance',
      status: 'met',
      priority: 'high',
      description: 'Data protection compliance required'
    },
    {
      id: 'social-value',
      title: 'Social Value Policy',
      status: 'missing',
      priority: 'medium',
      description: '10% minimum social value commitment'
    },
    {
      id: 'iso27001',
      title: 'ISO 27001 Certification',
      status: 'met',
      priority: 'medium',
      description: 'Information security management'
    }
  ]

  const criticalDeadlines = [
    {
      id: 'clarifications',
      title: 'Final Clarifications',
      date: '2024-01-20',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'submission',
      title: 'Tender Submission',
      date: '2024-02-05',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'presentation',
      title: 'Presentation Date',
      date: '2024-02-15',
      status: 'scheduled',
      priority: 'medium'
    }
  ]

  const toggleVolumeExpanded = (volumeId: string) => {
    const newExpanded = new Set(expandedVolumes)
    if (newExpanded.has(volumeId)) {
      newExpanded.delete(volumeId)
    } else {
      newExpanded.add(volumeId)
    }
    setExpandedVolumes(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-brand-100 text-brand-800',
      completed: 'bg-green-100 text-green-800',
      review: 'bg-yellow-100 text-yellow-800'
    }
    
    const labels = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed',
      review: 'Review'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const getComplianceStatusBadge = (status: string) => {
    const variants = {
      met: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      missing: 'bg-red-100 text-red-800',
      not_applicable: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      met: 'Met',
      partial: 'Partial',
      missing: 'Missing',
      not_applicable: 'N/A'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getWordCountColor = (wordCount: number, wordLimit: number) => {
    const percentage = (wordCount / wordLimit) * 100
    if (percentage > 100) return 'text-red-600'
    if (percentage > 90) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    })
  }

  const generatePDFReport = async () => {
    try {
      const response = await fetch(`/api/tender/tender_123/generate-report`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'tender-summary-report.html'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        console.error('Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating PDF report:', error)
    }
  }

  const totalSections = volumes.reduce((acc, vol) => acc + vol.sections.length, 0)
  const completedSections = volumes.reduce((acc, vol) => 
    acc + vol.sections.filter(sec => sec.status === 'completed').length, 0
  )
  const progressPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Collapsible Sidebar */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border-r border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Tender Intelligence</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* Bid/No-Bid Recommendation */}
              <div className="mb-6">
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700 mb-1">
                    {bidRecommendation}
                  </div>
                  <div className="text-sm text-green-600 mb-2">
                    Risk Score: {riskScore}/100
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${riskScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('risk')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'risk' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Risk
                </button>
                <button
                  onClick={() => setActiveTab('compliance')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'compliance' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Compliance
                </button>
                <button
                  onClick={() => setActiveTab('deadlines')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'deadlines' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Deadlines
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'risk' && (
                  <motion.div
                    key="risk"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      Risk Assessment
                    </h3>
                    
                    <div className="space-y-3">
                      {riskFactors.map((risk, index) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {risk.category}
                            </span>
                            <Badge className={getRiskLevelColor(risk.level)}>
                              {risk.level.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{risk.risk}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">Impact:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-red-500 h-1 rounded-full transition-all"
                                style={{ width: `${risk.impact * 10}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{risk.impact}/10</span>
                          </div>
                          {risk.mitigation && (
                            <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                              <strong>Mitigation:</strong> {risk.mitigation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'compliance' && (
                  <motion.div
                    key="compliance"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-brand-600" />
                      Compliance Requirements
                    </h3>
                    
                    <div className="space-y-3">
                      {complianceRequirements.map((req) => (
                        <div key={req.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {req.title}
                            </span>
                            <div className="flex items-center gap-2">
                              {req.priority === 'high' && (
                                <Star className="w-3 h-3 text-red-500" />
                              )}
                              {getComplianceStatusBadge(req.status)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                          {req.link && (
                            <a 
                              href={req.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1"
                            >
                              Learn more <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'deadlines' && (
                  <motion.div
                    key="deadlines"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Critical Deadlines
                    </h3>
                    
                    <div className="space-y-3">
                      {criticalDeadlines.map((deadline) => (
                        <div key={deadline.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {deadline.title}
                            </span>
                            <Badge className={deadline.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-brand-100 text-brand-800'}>
                              {deadline.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {formatDate(deadline.date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar Footer */}
            <div className="p-6 border-t border-gray-200">
              <Button 
                onClick={generatePDFReport}
                className="w-full bg-gradient-to-r from-teal-600 to-brand-600 hover:from-teal-700 hover:to-brand-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Generate PDF Report
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Toggle Button (when collapsed) */}
      {sidebarCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSidebarCollapsed(false)}
            className="bg-white shadow-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tender Summary</h1>
              <p className="text-gray-600 mt-1">NHS Community Care Services - Yorkshire Region</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* AI Insights Alert */}
              <Alert className="max-w-md">
                <Brain className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>AI Insight:</strong> This tender has high win probability based on your past successes in similar healthcare contracts.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 rounded-lg">
                    <FileText className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Sections</div>
                    <div className="text-2xl font-bold">{totalSections}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold">{completedSections}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">In Progress</div>
                    <div className="text-2xl font-bold">
                      {volumes.reduce((acc, vol) => 
                        acc + vol.sections.filter(sec => sec.status === 'in_progress').length, 0
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Progress</div>
                    <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Overall Progress</h3>
                <span className="text-sm text-gray-600">
                  {completedSections} of {totalSections} sections completed
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </CardContent>
          </Card>

          {/* Volumes and Sections */}
          <div className="space-y-4">
            {volumes.map((volume) => (
              <Card key={volume.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer bg-gradient-to-r from-gray-50 to-brand-50 hover:from-gray-100 hover:to-brand-100 transition-colors"
                  onClick={() => toggleVolumeExpanded(volume.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{volume.title}</CardTitle>
                        <CardDescription>
                          {volume.sections.length} sections • {
                            volume.sections.filter(s => s.status === 'completed').length
                          } completed
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="ghost">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </Button>
                      
                      {expandedVolumes.has(volume.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedVolumes.has(volume.id) && (
                  <CardContent className="p-0">
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Word Limit</TableHead>
                            <TableHead>Word Count</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {volume.sections.map((section) => (
                            <TableRow key={section.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {section.title}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(section.status)}
                              </TableCell>
                              <TableCell>
                                {section.owner && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                                      <span className="text-teal-600 text-xs font-medium">
                                        {section.owner.split(' ').map(n => n[0]).join('')}
                                      </span>
                                    </div>
                                    <span className="text-sm">{section.owner}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {section.due_date && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(section.due_date)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {section.word_limit && (
                                  <span className="text-sm text-gray-600">
                                    {section.word_limit} words
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {section.word_limit && (
                                  <span className={`text-sm font-medium ${
                                    getWordCountColor(section.word_count || 0, section.word_limit)
                                  }`}>
                                    {section.word_count || 0} / {section.word_limit}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button size="sm" variant="ghost">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </motion.div>
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Add Volume Button */}
            <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                    <Plus className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Volume</h3>
                  <p className="text-gray-600 mb-4">
                    Create a new volume to organize your tender response sections
                  </p>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Volume
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="bg-gradient-to-r from-teal-50 to-brand-50 border-teal-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600" />
                Recommended Next Steps
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-teal-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4 text-brand-600" />
                    <span className="font-medium">Upload Documents</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload tender documents to auto-extract requirements and questions
                  </p>
                  <Button size="sm" variant="outline">
                    Go to Documents
                  </Button>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-teal-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Assign Team Members</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Assign sections to team members and set deadlines
                  </p>
                  <Button size="sm" variant="outline">
                    Manage Team
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 