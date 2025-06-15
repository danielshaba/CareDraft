'use client'

import React from 'react'
import { 
  FileText, 
  Eye, 
  Send, 
  Archive,
  AlertCircle
} from 'lucide-react'
import { ProposalStatus } from '@/lib/database.types'

interface ProposalStatusBadgeProps {
  status: ProposalStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showLabel?: boolean
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export default function ProposalStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className = '',
  onClick,
  disabled = false
}: ProposalStatusBadgeProps) {
  const getStatusConfig = (status: ProposalStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          icon: FileText,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          hoverBg: 'hover:bg-gray-200',
          dotColor: 'bg-gray-500'
        }
      case 'review':
        return {
          label: 'Review',
          icon: Eye,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          hoverBg: 'hover:bg-yellow-200',
          dotColor: 'bg-yellow-500'
        }
      case 'submitted':
        return {
          label: 'Submitted',
          icon: Send,
          bgColor: 'bg-teal-100',
          textColor: 'text-teal-700',
          borderColor: 'border-teal-200',
          hoverBg: 'hover:bg-teal-200',
          dotColor: 'bg-teal-600'
        }
      case 'archived':
        return {
          label: 'Archived',
          icon: Archive,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-700',
          borderColor: 'border-slate-200',
          hoverBg: 'hover:bg-slate-200',
          dotColor: 'bg-slate-500'
        }
      default:
        return {
          label: 'Unknown',
          icon: AlertCircle,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          hoverBg: 'hover:bg-gray-200',
          dotColor: 'bg-gray-500'
        }
    }
  }

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-0.5 text-xs',
          icon: 'h-3 w-3',
          dot: 'w-1.5 h-1.5',
          gap: 'gap-1'
        }
      case 'md':
        return {
          container: 'px-2.5 py-1 text-sm',
          icon: 'h-4 w-4',
          dot: 'w-2 h-2',
          gap: 'gap-1.5'
        }
      case 'lg':
        return {
          container: 'px-3 py-1.5 text-base',
          icon: 'h-5 w-5',
          dot: 'w-2.5 h-2.5',
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
    ${onClick && !disabled ? `cursor-pointer ${config.hoverBg}` : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${sizeClasses.container}
    ${sizeClasses.gap}
    ${className}
  `.trim()

  const content = (
    <>
      {showIcon && !showLabel && <Icon className={sizeClasses.icon} />}
      {showIcon && showLabel && <span className={`${config.dotColor} ${sizeClasses.dot} rounded-full mr-1.5`}></span>}
      {showLabel && <span>{config.label}</span>}
    </>
  )

  if (onClick && !disabled) {
    return (
      <button
        onClick={onClick}
        className={baseClasses}
        title={`Change status from ${config.label}`}
        disabled={disabled}
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
interface ProposalStatusSelectorProps {
  currentStatus: ProposalStatus
  availableTransitions: ProposalStatus[]
  onStatusChange: (status: ProposalStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function ProposalStatusSelector({
  currentStatus,
  availableTransitions,
  onStatusChange,
  disabled = false,
  size = 'md',
  loading = false
}: ProposalStatusSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

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
    
    return undefined
  }, [isOpen])

  const handleStatusSelect = (status: ProposalStatus) => {
    onStatusChange(status)
    setIsOpen(false)
  }

  const isTransitionDisabled = disabled || loading || availableTransitions.length === 0

  return (
    <div className="relative" ref={dropdownRef}>
      {loading ? (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      ) : (
        <ProposalStatusBadge
          status={currentStatus}
          size={size}
          onClick={isTransitionDisabled ? undefined : () => setIsOpen(!isOpen)}
          disabled={isTransitionDisabled}
        />
      )}

      {isOpen && !isTransitionDisabled && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-max">
          {availableTransitions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No transitions available
            </div>
          ) : (
            availableTransitions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={`
                  w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors
                  ${status === currentStatus ? 'bg-gray-50' : ''}
                `}
              >
                <ProposalStatusBadge
                  status={status}
                  size={size}
                  showIcon={false}
                  className="pointer-events-none"
                />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
} 