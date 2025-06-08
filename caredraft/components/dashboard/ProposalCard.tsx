'use client'

import React from 'react'
import Link from 'next/link'
import { Database } from '@/lib/database.types'

// Type definitions from database
type ProposalStatus = Database['public']['Enums']['proposal_status']

// Extended interface for proposal card data
export interface ProposalCardData {
  id: string
  title: string
  description?: string
  status: ProposalStatus
  deadline?: string | Date
  progress?: number // 0-100 percentage
  organizationName?: string
  estimatedValue?: number
  lastUpdated?: string | Date
  isUrgent?: boolean
}

interface ProposalCardProps {
  proposal: ProposalCardData
  onClick?: (proposal: ProposalCardData) => void
  showActions?: boolean
  isLoading?: boolean
  className?: string
}

// Status configuration for badges and colors
const STATUS_CONFIG: Record<ProposalStatus, {
  label: string
  bgColor: string
  textColor: string
  dotColor: string
}> = {
  draft: {
    label: 'Draft',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    dotColor: 'bg-gray-400'
  },
  review: {
    label: 'In Review',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    dotColor: 'bg-blue-400'
  },
  submitted: {
    label: 'Submitted',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    dotColor: 'bg-green-400'
  },
  archived: {
    label: 'Archived',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    dotColor: 'bg-yellow-400'
  }
}

// Utility functions
const formatDeadline = (deadline?: string | Date): string => {
  if (!deadline) return 'No deadline'
  
  const date = typeof deadline === 'string' ? new Date(deadline) : deadline
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`
  } else if (diffDays === 0) {
    return 'Due today'
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

const formatCurrency = (amount?: number): string => {
  if (!amount) return 'Value TBD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const getDeadlineUrgency = (deadline?: string | Date): 'urgent' | 'warning' | 'normal' => {
  if (!deadline) return 'normal'
  
  const date = typeof deadline === 'string' ? new Date(deadline) : deadline
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 0) return 'urgent'
  if (diffDays <= 3) return 'urgent'
  if (diffDays <= 7) return 'warning'
  return 'normal'
}

// Status Badge Component
const StatusBadge: React.FC<{ status: ProposalStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status]
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      <span className={`w-1.5 h-1.5 ${config.dotColor} rounded-full mr-1.5`}></span>
      {config.label}
    </span>
  )
}

// Progress Bar Component
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div 
        className="bg-brand-primary h-1.5 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${clampedProgress}%` }}
      ></div>
    </div>
  )
}

// Loading Skeleton Component
const ProposalCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="h-2 bg-gray-200 rounded w-full mb-3"></div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
)

// Main Proposal Card Component
export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onClick,
  showActions = true,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return <ProposalCardSkeleton />
  }

  const deadlineUrgency = getDeadlineUrgency(proposal.deadline)
  const deadlineText = formatDeadline(proposal.deadline)
  const progress = proposal.progress || 0

  const handleClick = () => {
    if (onClick) {
      onClick(proposal)
    }
  }

  const cardContent = (
    <div 
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-6 
        hover:shadow-md hover:border-gray-300 
        transition-all duration-200 ease-in-out
        cursor-pointer group
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Header with Title and Status */}
      <div className="flex items-start justify-between mb-3">
        <h3 
          className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-primary-dark transition-colors"
          style={{ fontFamily: 'var(--font-poppins)' }}
          title={proposal.title}
        >
          {proposal.title}
        </h3>
        <div className="ml-3 flex-shrink-0">
          <StatusBadge status={proposal.status} />
        </div>
      </div>

      {/* Description */}
      {proposal.description && (
        <p 
          className="text-xs text-gray-600 line-clamp-2 mb-4"
          style={{ fontFamily: 'var(--font-open-sans)' }}
          title={proposal.description}
        >
          {proposal.description}
        </p>
      )}

      {/* Organization */}
      {proposal.organizationName && (
        <p 
          className="text-xs text-gray-500 mb-3"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          {proposal.organizationName}
        </p>
      )}

      {/* Deadline and Value */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span 
            className={`text-xs ${
              deadlineUrgency === 'urgent' ? 'text-red-600 font-medium' :
              deadlineUrgency === 'warning' ? 'text-amber-600 font-medium' :
              'text-gray-500'
            }`}
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {deadlineText}
          </span>
        </div>
        
        {proposal.estimatedValue && (
          <span 
            className="text-xs text-gray-600 font-medium"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {formatCurrency(proposal.estimatedValue)}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span 
            className="text-xs text-gray-500"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            Progress
          </span>
          <span 
            className="text-xs text-gray-600 font-medium"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            {Math.round(progress)}%
          </span>
        </div>
        <ProgressBar progress={progress} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {proposal.lastUpdated && (
          <span 
            className="text-xs text-gray-400"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            Updated {new Date(proposal.lastUpdated).toLocaleDateString()}
          </span>
        )}
        
        {proposal.isUrgent && (
          <span className="inline-flex items-center text-xs text-red-600">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Urgent
          </span>
        )}
      </div>
    </div>
  )

  // Wrap in Link if this should be clickable
  if (showActions) {
    return (
      <Link href={`/proposals/${proposal.id}`} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

export default ProposalCard 