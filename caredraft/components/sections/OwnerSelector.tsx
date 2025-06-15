'use client'

import React, { useState, useRef, useEffect } from 'react'
import { User, ChevronDown, X } from 'lucide-react'

interface Owner {
  id: string
  email?: string
  full_name?: string
}

interface OwnerSelectorProps {
  currentOwner?: Owner
  availableOwners: Owner[]
  onOwnerChange: (ownerId: string | null) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  placeholder?: string
}

export default function OwnerSelector({
  currentOwner,
  availableOwners,
  onOwnerChange,
  size = 'md',
  disabled = false,
  placeholder = 'Assign owner...'
}: OwnerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleOwnerSelect = (owner: Owner | null) => {
    onOwnerChange(owner?.id || null)
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

  const getDisplayName = (owner: Owner) => {
    return owner.full_name || owner.email || 'Unknown User'
  }

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
            : currentOwner
              ? 'bg-white text-gray-900 border-gray-300 hover:border-brand-primary'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-brand-primary'
          }
          ${isOpen ? 'border-brand-primary ring-2 ring-brand-primary' : ''}
        `}
      >
        <div className="flex items-center min-w-0">
          <User className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2 flex-shrink-0`} />
          <span className="truncate">
            {currentOwner ? getDisplayName(currentOwner) : placeholder}
          </span>
        </div>
        
        <div className="flex items-center ml-2">
          {currentOwner && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOwnerSelect(null)
              }}
              className="p-0.5 rounded hover:bg-gray-200 mr-1"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
          <ChevronDown 
            className={`
              ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400 transition-transform
              ${isOpen ? 'rotate-180' : ''}
            `} 
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {availableOwners.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No users available
            </div>
          ) : (
            <>
              {/* Clear selection option */}
              {currentOwner && (
                <button
                  onClick={() => handleOwnerSelect(null)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                >
                  <div className="flex items-center">
                    <X className="h-4 w-4 mr-2" />
                    Clear assignment
                  </div>
                </button>
              )}
              
              {/* Owner options */}
              {availableOwners.map((owner) => (
                <button
                  key={owner.id}
                  onClick={() => handleOwnerSelect(owner)}
                  className={`
                    w-full px-3 py-2 text-left text-sm hover:bg-brand-primary-light transition-colors
                    ${currentOwner?.id === owner.id ? 'bg-brand-primary-light text-brand-primary-dark' : 'text-gray-900'}
                  `}
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {owner.full_name || 'Unknown User'}
                      </div>
                      {owner.email && (
                        <div className="text-xs text-gray-500 truncate">
                          {owner.email}
                        </div>
                      )}
                    </div>
                    {currentOwner?.id === owner.id && (
                      <div className="ml-2 h-2 w-2 bg-brand-primary-light0 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
} 