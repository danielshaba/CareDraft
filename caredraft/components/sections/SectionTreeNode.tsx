'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { SectionWithChildren } from '@/lib/sections'
import { SectionStatus } from '@/types/database'
import { StatusSelector } from './StatusBadge'
import OwnerSelector from './OwnerSelector'
import DueDatePicker from './DueDatePicker'

interface Owner {
  id: string
  email?: string
  full_name?: string
}

interface SectionTreeNodeProps {
  section: SectionWithChildren
  level: number
  isExpanded: boolean
  isSelected: boolean
  onToggleExpanded: () => void
  onSelect: () => void
  onUpdate: (updates: Record<string, unknown>) => void
  onDelete: () => void
  onAddChild: () => void
  availableOwners?: Owner[]
  children?: React.ReactNode
}

export default function SectionTreeNode({
  section,
  level,
  isExpanded,
  isSelected,
  onToggleExpanded,
  onSelect,
  onUpdate,
  onDelete,
  onAddChild,
  availableOwners = [],
  children
}: SectionTreeNodeProps) {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(section.title)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const hasChildren = section.children && section.children.length > 0
  const indentLevel = level * 16 // 16px per level

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false)
      }
    }

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    
    return () => {} // Return empty cleanup function when not adding listener
  }, [showContextMenu])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  const handleEditSubmit = () => {
    if (editTitle.trim() && editTitle !== section.title) {
      onUpdate({ title: editTitle.trim() })
    }
    setIsEditing(false)
    setEditTitle(section.title)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditTitle(section.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }





  return (
    <div className="relative">
      <div
        className={`
          flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors group
          ${isSelected ? 'bg-brand-primary-light border border-brand-primary' : 'hover:bg-gray-50'}
        `}
        style={{ paddingLeft: `${indentLevel + 8}px` }}
        onClick={onSelect}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) {
              onToggleExpanded()
            }
          }}
          className={`
            flex items-center justify-center w-4 h-4 mr-2 rounded transition-colors
            ${hasChildren 
              ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-200' 
              : 'text-transparent'
            }
          `}
        >
          {hasChildren && (
            isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          )}
        </button>

        {/* Section Icon */}
        <div className="flex items-center justify-center w-4 h-4 mr-2">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-brand-primary" />
            ) : (
              <Folder className="h-4 w-4 text-brand-primary" />
            )
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
        </div>

        {/* Section Title */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-brand-primary rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex flex-col">
              <span className={`text-sm font-medium truncate ${isSelected ? 'text-brand-primary-dark' : 'text-gray-900'}`}>
                {section.title}
              </span>
              
              {/* Section metadata */}
              <div className="flex items-center space-x-3 mt-1">
                {/* Status badge with dropdown */}
                <StatusSelector
                  currentStatus={section.status}
                  onStatusChange={(newStatus: SectionStatus) => onUpdate({ status: newStatus })}
                  size="sm"
                />
                
                {/* Word count */}
                {section.word_limit && section.word_limit > 0 && (
                  <span className="text-xs text-gray-500">
                    {(section.content || '').split(' ').filter(w => w.length > 0).length}/{section.word_limit} words
                  </span>
                )}
                
                {/* Owner Selector */}
                <div onClick={(e) => e.stopPropagation()}>
                  <OwnerSelector
                    currentOwner={section.owner}
                    availableOwners={availableOwners}
                    onOwnerChange={(ownerId) => onUpdate({ assigned_to: ownerId || undefined })}
                    size="sm"
                    placeholder="Assign..."
                  />
                </div>
                
                {/* Due Date Picker */}
                <div onClick={(e) => e.stopPropagation()}>
                  <DueDatePicker
                    currentDate={section.due_date || undefined}
                    onDateChange={(date) => onUpdate({ due_date: date })}
                    size="sm"
                    placeholder="Due date..."
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Context Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowContextMenu(!showContextMenu)
          }}
          className={`
            p-1 rounded transition-colors
            ${showContextMenu ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}
            ${isSelected || showContextMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {/* Context Menu */}
        {showContextMenu && (
          <div
            ref={contextMenuRef}
            className="absolute right-0 top-8 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
                setShowContextMenu(false)
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddChild()
                setShowContextMenu(false)
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add subsection
            </button>
            <hr className="my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
                setShowContextMenu(false)
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {children}
    </div>
  )
} 