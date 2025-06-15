'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, X, Clock, AlertTriangle } from 'lucide-react'

interface DueDatePickerProps {
  currentDate?: string
  onDateChange: (date: string | null) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  placeholder?: string
  minDate?: string
}

export default function DueDatePicker({
  currentDate,
  onDateChange,
  size = 'md',
  disabled = false,
  placeholder = 'Set due date...',
  minDate
}: DueDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(currentDate || '')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
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

  // Update local state when prop changes
  useEffect(() => {
    setSelectedDate(currentDate || '')
  }, [currentDate])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    onDateChange(date || null)
    setIsOpen(false)
  }

  const handleClearDate = () => {
    setSelectedDate('')
    onDateChange(null)
    setIsOpen(false)
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'lg':
        return 'text-base px-4 py-3'
      default:
        return 'text-sm px-3 py-2'
    }
  }

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `Overdue (${date.toLocaleDateString()})`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    if (diffDays <= 7) return `Due in ${diffDays} days`
    return date.toLocaleDateString()
  }

  const getDateStatus = (dateString: string): 'overdue' | 'urgent' | 'warning' | 'normal' => {
    if (!dateString) return 'normal'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'overdue'
    if (diffDays <= 1) return 'urgent'
    if (diffDays <= 3) return 'warning'
    return 'normal'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} text-red-500`} />
      case 'urgent':
        return <Clock className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} text-orange-500`} />
      case 'warning':
        return <Clock className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} text-yellow-500`} />
      default:
        return <Calendar className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
    }
  }

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 border-red-300 bg-red-50'
      case 'urgent':
        return 'text-orange-600 border-orange-300 bg-orange-50'
      case 'warning':
        return 'text-yellow-600 border-yellow-300 bg-yellow-50'
      default:
        return currentDate ? 'text-gray-900 border-gray-300 bg-white' : 'text-gray-500 border-gray-200 bg-gray-50'
    }
  }

  const status = currentDate ? getDateStatus(currentDate) : 'normal'

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]
  const effectiveMinDate = minDate || today

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between rounded-lg border transition-colors
          ${getSizeClasses()}
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
            : getStatusColors(status)
          }
          ${isOpen ? 'border-brand-primary ring-2 ring-brand-primary' : ''}
          hover:border-brand-primary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary
        `}
      >
        <div className="flex items-center min-w-0">
          {getStatusIcon(status)}
          <span className="ml-2 truncate">
            {currentDate ? formatDisplayDate(currentDate) : placeholder}
          </span>
        </div>
        
        <div className="flex items-center ml-2">
          {currentDate && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClearDate()
              }}
              className="p-0.5 rounded hover:bg-gray-200 mr-1"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select due date
            </label>
            <input
              ref={inputRef}
              type="date"
              value={selectedDate}
              min={effectiveMinDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
            
            {/* Quick date options */}
            <div className="mt-3 space-y-1">
              <div className="text-xs font-medium text-gray-500 mb-2">Quick options</div>
              {[
                { label: 'Tomorrow', days: 1 },
                { label: 'In 3 days', days: 3 },
                { label: 'Next week', days: 7 },
                { label: 'In 2 weeks', days: 14 }
              ].map(({ label, days }) => {
                const quickDate = new Date()
                quickDate.setDate(quickDate.getDate() + days)
                const quickDateString = quickDate.toISOString().split('T')[0]
                
                return (
                  <button
                    key={label}
                    onClick={() => handleDateChange(quickDateString)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-brand-primary-light hover:text-brand-primary-dark rounded transition-colors"
                  >
                    {label} ({quickDate.toLocaleDateString()})
                  </button>
                )
              })}
            </div>

            {/* Clear option */}
            {currentDate && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <button
                  onClick={handleClearDate}
                  className="w-full text-left px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="flex items-center">
                    <X className="h-4 w-4 mr-2" />
                    Clear due date
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 