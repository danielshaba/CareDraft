'use client'

import React, { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, Play, Calendar, Bell } from 'lucide-react'
import { DeadlineCheckResult, DeadlineRule, DeadlineProcessingResult } from '@/lib/services/proposal-deadline-manager'
import ProposalStatusBadge from '@/components/proposal-workflow/ProposalStatusBadge'

interface DeadlineDashboardProps {
  className?: string
}

export default function DeadlineDashboard({ className = '' }: DeadlineDashboardProps) {
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineCheckResult[]>([])
  const [, setDeadlineRules] = useState<DeadlineRule[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [lastProcessingResult, setLastProcessingResult] = useState<DeadlineProcessingResult | null>(null)
  const [hoursAhead, setHoursAhead] = useState(168) // 1 week default

  // Load data on component mount
  useEffect(() => {
    loadDashboardData()
  }, [hoursAhead])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load upcoming deadlines and rules
      // In a real implementation, these would be API calls
      console.log('Loading deadline dashboard data...')
      
      // Mock data for now
      setUpcomingDeadlines([])
      setDeadlineRules([])
      
    } catch (error) {
      console.error('Error loading deadline dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerManualProcessing = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/cron/deadline-processor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const result = await response.json()
        setLastProcessingResult(result.result)
        await loadDashboardData() // Refresh data
      } else {
        console.error('Manual processing failed')
      }
    } catch (error) {
      console.error('Error triggering manual processing:', error)
    } finally {
      setProcessing(false)
    }
  }

  const formatTimeRemaining = (hours: number) => {
    if (hours <= 0) {
      return `${Math.abs(hours).toFixed(1)}h overdue`
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h remaining`
    } else {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days}d ${remainingHours.toFixed(0)}h remaining`
    }
  }

  const getPriorityColor = (hours: number) => {
    if (hours <= 0) return 'text-red-600 bg-red-50 border-red-200'
    if (hours <= 6) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (hours <= 24) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-brand-600 bg-brand-50 border-brand-200'
  }

  const getDashboardStats = () => {
    const overdue = upcomingDeadlines.filter(d => d.hoursRemaining <= 0).length
    const urgent = upcomingDeadlines.filter(d => d.hoursRemaining > 0 && d.hoursRemaining <= 24).length
    const upcoming = upcomingDeadlines.filter(d => d.hoursRemaining > 24).length
    
    return { overdue, urgent, upcoming, total: upcomingDeadlines.length }
  }

  const stats = getDashboardStats()

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-primary-light rounded-lg">
              <Clock className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Proposal Deadlines</h2>
              <p className="text-sm text-gray-500">Monitor and manage proposal workflow deadlines</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Time range selector */}
            <select
              value={hoursAhead}
              onChange={(e) => setHoursAhead(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value={24}>Next 24 hours</option>
              <option value={72}>Next 3 days</option>
              <option value={168}>Next week</option>
              <option value={336}>Next 2 weeks</option>
              <option value={720}>Next month</option>
            </select>
            
            {/* Manual processing button */}
            <button
              onClick={triggerManualProcessing}
              disabled={processing}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
              <span>{processing ? 'Processing...' : 'Run Check'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Urgent (24h)</p>
                <p className="text-2xl font-bold text-orange-900">{stats.urgent}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-600">Upcoming</p>
                <p className="text-2xl font-bold text-brand-900">{stats.upcoming}</p>
              </div>
              <Calendar className="h-8 w-8 text-brand-500" />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Tracked</p>
                <p className="text-2xl font-bold text-green-900">{stats.total}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Last Processing Result */}
        {lastProcessingResult && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Last Processing Result</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Checked:</span>
                <span className="ml-1 font-medium">{lastProcessingResult.proposalsChecked}</span>
              </div>
              <div>
                <span className="text-gray-500">Notifications:</span>
                <span className="ml-1 font-medium">{lastProcessingResult.notificationsSent}</span>
              </div>
              <div>
                <span className="text-gray-500">Transitions:</span>
                <span className="ml-1 font-medium">{lastProcessingResult.transitionsPerformed}</span>
              </div>
              <div>
                <span className="text-gray-500">Errors:</span>
                <span className={`ml-1 font-medium ${lastProcessingResult.errors.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {lastProcessingResult.errors.length}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Processed at {new Date(lastProcessingResult.processedAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Upcoming Deadlines List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
          
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming deadlines</h3>
              <p className="mt-1 text-sm text-gray-500">
                All proposals are on track within the selected time range.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.proposalId}
                  className={`p-4 border rounded-lg ${getPriorityColor(deadline.hoursRemaining)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ProposalStatusBadge 
                        status={deadline.currentStatus} 
                        size="sm"
                        showIcon={true}
                        showLabel={true}
                      />
                      
                      <div>
                        <p className="font-medium text-gray-900">
                          Proposal {deadline.proposalId}
                        </p>
                        <p className="text-sm text-gray-600">
                          {deadline.applicableRule?.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">
                        {formatTimeRemaining(deadline.hoursRemaining)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Deadline: {new Date(deadline.deadlineAt).toLocaleString()}
                      </p>
                      {deadline.nextNotificationHours && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                          <Bell className="h-3 w-3" />
                          <span>Next reminder in {deadline.nextNotificationHours}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 