'use client'

import React from 'react'
import { 
  Clock, 
  Play, 
  Eye, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { SectionStatus } from '@/types/database'

interface StatusBadgeProps {
  status: SectionStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showLabel?: boolean
  className?: string
  onClick?: () => void
}

export default function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className = '',
  onClick
}: StatusBadgeProps) {
  const getStatusConfig = (status: SectionStatus) => {
    switch (status) {
      case 'not_started':
        return {
          label: 'Not Started',
          icon: Clock,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          hoverBg: 'hover:bg-gray-200'
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          icon: Play,
          bgColor: 'bg-brand-100',
          textColor: 'text-brand-700',
          borderColor: 'border-brand-200',
          hoverBg: 'hover:bg-brand-200'
        }
      case 'review':
        return {
          label: 'Review',
          icon: Eye,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          hoverBg: 'hover:bg-yellow-200'
        }
      case 'complete':
        return {
          label: 'Complete',
          icon: CheckCircle,
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          hoverBg: 'hover:bg-green-200'
        }
      default:
        return {
          label: 'Unknown',
          icon: AlertCircle,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          hoverBg: 'hover:bg-gray-200'
        }
    }
  }

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-0.5 text-xs',
          icon: 'h-3 w-3',
          gap: 'gap-1'
        }
      case 'md':
        return {
          container: 'px-2.5 py-1 text-sm',
          icon: 'h-4 w-4',
          gap: 'gap-1.5'
        }
      case 'lg':
        return {
          container: 'px-3 py-1.5 text-base',
          icon: 'h-5 w-5',
          gap: 'gap-2'
        }
    }
  }

  const config = getStatusConfig(status)
  const sizeClasses = getSizeClasses(size)
  const Icon = config.icon

  const baseClasses = `
    inline-flex items-center font-medium rounded-full border transition-colors
    ${config.bgColor} ${config.textColor} ${config.borderColor}
    ${onClick ? `cursor-pointer ${config.hoverBg}` : ''}
    ${sizeClasses.container}
    ${sizeClasses.gap}
    ${className}
  `.trim()

  const content = (
    <>
      {showIcon && <Icon className={sizeClasses.icon} />}
      {showLabel && <span>{config.label}</span>}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={baseClasses}
        title={`Change status from ${config.label}`}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={baseClasses}>
      {content}
    </span>
  )
}

// Status selector dropdown component
interface StatusSelectorProps {
  currentStatus: SectionStatus
  onStatusChange: (status: SectionStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatusSelector({
  currentStatus,
  onStatusChange,
  disabled = false,
  size = 'md'
}: StatusSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const statuses: SectionStatus[] = ['not_started', 'in_progress', 'review', 'complete']

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    
    return () => {} // Return empty cleanup function when not adding listener
  }, [isOpen])

  const handleStatusSelect = (status: SectionStatus) => {
    onStatusChange(status)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <StatusBadge
        status={currentStatus}
        size={size}
        onClick={disabled ? undefined : () => setIsOpen(!isOpen)}
        className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
      />

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-max">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusSelect(status)}
              className={`
                w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors
                ${status === currentStatus ? 'bg-gray-50' : ''}
              `}
            >
              <StatusBadge
                status={status}
                size={size}
                className="pointer-events-none"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Progress indicator for section completion
interface SectionProgressProps {
  totalSections: number
  completedSections: number
  inProgressSections: number
  reviewSections: number
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

export function SectionProgress({
  totalSections,
  completedSections,
  inProgressSections,
  reviewSections,
  size = 'md',
  showDetails = true
}: SectionProgressProps) {
  const notStartedSections = totalSections - completedSections - inProgressSections - reviewSections
  const completionPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0

  const getProgressBarHeight = () => {
    switch (size) {
      case 'sm': return 'h-1'
      case 'md': return 'h-2'
      case 'lg': return 'h-3'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs'
      case 'md': return 'text-sm'
      case 'lg': return 'text-base'
    }
  }

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${getProgressBarHeight()}`}>
        <div className="h-full flex">
          {/* Completed */}
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${(completedSections / totalSections) * 100}%` }}
          />
          {/* In Review */}
          <div
            className="bg-yellow-500 transition-all duration-300"
            style={{ width: `${(reviewSections / totalSections) * 100}%` }}
          />
          {/* In Progress */}
          <div
            className="bg-brand-500 transition-all duration-300"
            style={{ width: `${(inProgressSections / totalSections) * 100}%` }}
          />
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className={`flex items-center justify-between ${getTextSize()}`}>
          <span className="font-medium text-gray-900">
            {completionPercentage}% Complete
          </span>
          <span className="text-gray-500">
            {completedSections} of {totalSections} sections
          </span>
        </div>
      )}

      {/* Status breakdown */}
      {showDetails && totalSections > 0 && (
        <div className={`flex items-center gap-4 ${getTextSize()}`}>
          {completedSections > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600">{completedSections} complete</span>
            </div>
          )}
          {reviewSections > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-gray-600">{reviewSections} in review</span>
            </div>
          )}
          {inProgressSections > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-brand-500 rounded-full" />
              <span className="text-gray-600">{inProgressSections} in progress</span>
            </div>
          )}
          {notStartedSections > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-gray-600">{notStartedSections} not started</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 