'use client'

import React from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Users,
  Calendar,
  Target
} from 'lucide-react'
import { SectionWithChildren } from '@/lib/sections'
import { SectionStatus } from '@/types/database'
import StatusBadge, { SectionProgress } from './StatusBadge'

interface SectionStatusDashboardProps {
  sections: SectionWithChildren[]
  className?: string
}

interface StatusMetrics {
  total: number
  notStarted: number
  inProgress: number
  review: number
  complete: number
  overdue: number
  dueToday: number
  dueSoon: number
  assignedUsers: number
  avgWordsPerSection: number
  totalWords: number
}

export default function SectionStatusDashboard({
  sections,
  className = ''
}: SectionStatusDashboardProps) {
  
  const calculateMetrics = (sections: SectionWithChildren[]): StatusMetrics => {
    const flatSections = flattenSections(sections)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
    
    const metrics: StatusMetrics = {
      total: flatSections.length,
      notStarted: 0,
      inProgress: 0,
      review: 0,
      complete: 0,
      overdue: 0,
      dueToday: 0,
      dueSoon: 0,
      assignedUsers: 0,
      avgWordsPerSection: 0,
      totalWords: 0
    }

    const uniqueUsers = new Set<string>()
    let totalWordCount = 0

    flatSections.forEach(section => {
      // Status counts
      switch (section.status) {
        case 'not_started':
          metrics.notStarted++
          break
        case 'in_progress':
          metrics.inProgress++
          break
        case 'review':
          metrics.review++
          break
        case 'complete':
          metrics.complete++
          break
      }

      // Due date analysis
      if (section.due_date) {
        const dueDate = new Date(section.due_date)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
        
        if (dueDateOnly < today && section.status !== 'complete') {
          metrics.overdue++
        } else if (dueDateOnly.getTime() === today.getTime()) {
          metrics.dueToday++
        } else if (dueDateOnly <= threeDaysFromNow) {
          metrics.dueSoon++
        }
      }

      // User assignment
      if (section.owner_id) {
        uniqueUsers.add(section.owner_id)
      }

      // Word count
      totalWordCount += section.current_word_count
    })

    metrics.assignedUsers = uniqueUsers.size
    metrics.totalWords = totalWordCount
    metrics.avgWordsPerSection = metrics.total > 0 ? Math.round(totalWordCount / metrics.total) : 0

    return metrics
  }

  const flattenSections = (sections: SectionWithChildren[]): SectionWithChildren[] => {
    const result: SectionWithChildren[] = []
    
    const traverse = (sectionList: SectionWithChildren[]) => {
      sectionList.forEach(section => {
        result.push(section)
        if (section.children && section.children.length > 0) {
          traverse(section.children)
        }
      })
    }
    
    traverse(sections)
    return result
  }

  const metrics = calculateMetrics(sections)
  const completionRate = metrics.total > 0 ? Math.round((metrics.complete / metrics.total) * 100) : 0

  const getStatusDistribution = () => [
    { status: 'complete' as SectionStatus, count: metrics.complete, percentage: (metrics.complete / metrics.total) * 100 },
    { status: 'review' as SectionStatus, count: metrics.review, percentage: (metrics.review / metrics.total) * 100 },
    { status: 'in_progress' as SectionStatus, count: metrics.inProgress, percentage: (metrics.inProgress / metrics.total) * 100 },
    { status: 'not_started' as SectionStatus, count: metrics.notStarted, percentage: (metrics.notStarted / metrics.total) * 100 }
  ]

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-primary" />
              Section Status Overview
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Track progress across all sections
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-primary">{completionRate}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Progress Overview */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Overall Progress</h4>
          <SectionProgress
            totalSections={metrics.total}
            completedSections={metrics.complete}
            inProgressSections={metrics.inProgress}
            reviewSections={metrics.review}
            size="lg"
            showDetails={true}
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Sections */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sections</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.total}</p>
              </div>
              <Target className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          {/* Overdue */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{metrics.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          {/* Due Today */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Due Today</p>
                <p className="text-2xl font-bold text-orange-900">{metrics.dueToday}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          {/* Assigned Users */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Assigned Users</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.assignedUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Status Distribution</h4>
          <div className="space-y-3">
            {getStatusDistribution().map(({ status, count, percentage }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={status} size="sm" />
                  <span className="text-sm text-gray-600">{count} sections</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        status === 'complete' ? 'bg-green-500' :
                        status === 'review' ? 'bg-yellow-500' :
                        status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Word Count Statistics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Content Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">Total Words</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalWords.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">Avg Words/Section</p>
              <p className="text-xl font-bold text-gray-900">{metrics.avgWordsPerSection}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        {(metrics.dueToday > 0 || metrics.dueSoon > 0 || metrics.overdue > 0) && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Deadline Alerts
            </h4>
            <div className="space-y-2">
              {metrics.overdue > 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    <strong>{metrics.overdue}</strong> section{metrics.overdue !== 1 ? 's' : ''} overdue
                  </span>
                </div>
              )}
              {metrics.dueToday > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    <strong>{metrics.dueToday}</strong> section{metrics.dueToday !== 1 ? 's' : ''} due today
                  </span>
                </div>
              )}
              {metrics.dueSoon > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    <strong>{metrics.dueSoon}</strong> section{metrics.dueSoon !== 1 ? 's' : ''} due within 3 days
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 