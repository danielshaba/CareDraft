'use client'

import React from 'react'
import { Clock, User, MessageSquare, Calendar } from 'lucide-react'
import { ProposalStatusWorkflowData } from '@/lib/database.types'
import ProposalStatusBadge from './ProposalStatusBadge'

interface StatusHistoryPanelProps {
  statusHistory: ProposalStatusWorkflowData[]
  loading?: boolean
  className?: string
}

export default function StatusHistoryPanel({
  statusHistory,
  loading = false,
  className = ''
}: StatusHistoryPanelProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const getTransitionDescription = (from: string | null, to: string) => {
    if (!from) return `Status set to ${to}`
    
    const descriptions: Record<string, string> = {
      'draft->review': 'Submitted for review',
      'review->draft': 'Returned to draft for revisions',
      'review->submitted': 'Approved and submitted',
      'submitted->archived': 'Archived',
      'draft->archived': 'Archived from draft'
    }
    
    return descriptions[`${from}->${to}`] || `Status changed from ${from} to ${to}`
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status History</h3>
        <div className="text-center py-8">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No status changes yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Status changes will appear here once they occur.
          </p>
        </div>
      </div>
    )
  }

  // Sort by most recent first
  const sortedHistory = [...statusHistory].sort((a, b) => 
    new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  )

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Status History</h3>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {sortedHistory.map((entry, index) => (
            <li key={entry.id}>
              <div className="relative pb-8">
                {/* Timeline line */}
                {index !== sortedHistory.length - 1 && (
                  <span 
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" 
                    aria-hidden="true" 
                  />
                )}
                
                <div className="relative flex space-x-3">
                  {/* Status indicator */}
                  <div>
                    <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-gray-100">
                      <ProposalStatusBadge 
                        status={entry.to_status} 
                        size="sm" 
                        showLabel={false}
                        className="border-0 bg-transparent p-0"
                      />
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex min-w-0 flex-1 justify-between space-x-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <ProposalStatusBadge status={entry.to_status} size="sm" />
                        <span className="text-sm font-medium text-gray-900">
                          {getTransitionDescription(entry.from_status, entry.to_status)}
                        </span>
                      </div>
                      
                      {/* User info */}
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                        <User className="h-3 w-3" />
                        <span>
                          {entry.changed_by_name || 'System'}
                        </span>
                        {entry.transition_reason && (
                          <>
                            <span>•</span>
                            <span className="capitalize">
                              {entry.transition_reason.replace(/_/g, ' ')}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Comment */}
                      {entry.comment && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{entry.comment}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <time dateTime={entry.changed_at}>
                          {formatDate(entry.changed_at)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Compact version for smaller spaces
interface StatusHistoryCompactProps {
  statusHistory: ProposalStatusWorkflowData[]
  maxItems?: number
  showViewAll?: boolean
  onViewAll?: () => void
  className?: string
}

export function StatusHistoryCompact({
  statusHistory,
  maxItems = 3,
  showViewAll = true,
  onViewAll,
  className = ''
}: StatusHistoryCompactProps) {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No status changes yet
      </div>
    )
  }

  const sortedHistory = [...statusHistory]
    .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
    .slice(0, maxItems)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {sortedHistory.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <ProposalStatusBadge status={entry.to_status} size="sm" />
              <span className="text-gray-600">
                by {entry.changed_by_name || 'System'}
              </span>
            </div>
            <span className="text-gray-400 text-xs">
              {formatDate(entry.changed_at)}
            </span>
          </div>
        ))}
      </div>
      
      {showViewAll && statusHistory.length > maxItems && onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
        >
          View all {statusHistory.length} changes
        </button>
      )}
    </div>
  )
} 