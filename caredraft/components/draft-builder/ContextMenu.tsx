'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  PencilIcon,
  DocumentTextIcon,
  SparklesIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  SpeakerWaveIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  BookOpenIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { useFactCheck } from './fact-check/FactCheckProvider'

interface Position {
  x: number
  y: number
}

interface ContextMenuProps {
  isVisible: boolean
  position: Position
  selectedText: string
  onClose: () => void
  onAction: (action: string, data?: any) => void
}

interface MenuAction {
  id: string
  label: string
  description: string
  icon: React.ComponentType<any>
  category: 'evidencing' | 'editing' | 'inputs' | 'custom' | 'other'
  shortcut?: string
  disabled?: boolean
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isVisible,
  position,
  selectedText,
  onClose,
  onAction
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { performFactCheck, isLoading } = useFactCheck()

  const menuActions: MenuAction[] = [
    // EVIDENCING Section
    {
      id: 'fact-check',
      label: 'Fact Check',
      description: 'Verify accuracy with AI sources',
      icon: CheckCircleIcon,
      category: 'evidencing',
      shortcut: 'F'
    },

    // EDITING Section  
    {
      id: 'improve',
      label: 'Improve',
      description: 'Enhance clarity and impact',
      icon: PencilIcon,
      category: 'editing',
      shortcut: 'I'
    },
    {
      id: 'expand',
      label: 'Expand',
      description: 'Add detail and examples',
      icon: DocumentTextIcon,
      category: 'editing',
      shortcut: 'E'
    },
    {
      id: 'summarize',
      label: 'Summarize',
      description: 'Create concise version',
      icon: DocumentDuplicateIcon,
      category: 'editing',
      shortcut: 'S'
    },

    // INPUTS Section
    {
      id: 'incorporate',
      label: 'Incorporate',
      description: 'Merge additional content seamlessly',
      icon: DocumentDuplicateIcon,
      category: 'inputs',
      shortcut: 'Ctrl+I'
    },
    {
      id: 'we-will',
      label: 'We Will',
      description: 'Convert to action-oriented statements',
      icon: SpeakerWaveIcon,
      category: 'inputs',
      shortcut: 'W'
    },
    {
      id: 'translate',
      label: 'Translate',
      description: 'Multi-language support',
      icon: GlobeAltIcon,
      category: 'inputs',
      shortcut: 'T'
    },

    // CUSTOM Section
    {
      id: 'tone-voice',
      label: 'CareDraft Tone of Voice',
      description: 'Apply brand voice standards',
      icon: SparklesIcon,
      category: 'custom',
      shortcut: 'V'
    },
    {
      id: 'replace-words',
      label: 'Replace Banned Words',
      description: 'Use dignified alternatives',
      icon: ShieldCheckIcon,
      category: 'custom',
      shortcut: 'R'
    },

    // OTHER Section
    {
      id: 'pure-completion',
      label: 'Pure Completion',
      description: 'AI-powered text continuation',
      icon: BeakerIcon,
      category: 'other',
      shortcut: 'C'
    },
    {
      id: 'search',
      label: 'Search',
      description: 'Find relevant knowledge',
      icon: MagnifyingGlassIcon,
      category: 'other',
      shortcut: 'Ctrl+F'
    }
  ]

  const categories = [
    { id: 'evidencing', label: 'EVIDENCING', color: 'bg-brand-500' },
    { id: 'editing', label: 'EDITING', color: 'bg-green-500' },
    { id: 'inputs', label: 'INPUTS', color: 'bg-purple-500' },
    { id: 'custom', label: 'CUSTOM', color: 'bg-orange-500' },
    { id: 'other', label: 'OTHER', color: 'bg-gray-500' }
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }

      // Handle shortcuts
      const action = menuActions.find(action => {
        if (action.shortcut?.includes('Ctrl')) {
          return event.ctrlKey && event.key.toLowerCase() === action.shortcut.split('+')[1].toLowerCase()
        }
        return event.key.toLowerCase() === action.shortcut?.toLowerCase()
      })

      if (action && selectedText) {
        event.preventDefault()
        handleActionClick(action.id)
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, selectedText, onClose])

  const handleActionClick = async (actionId: string) => {
    if (!selectedText.trim()) return

    setLoading(actionId)
    
    try {
      const action = menuActions.find(a => a.id === actionId)
      if (!action) return

      // Special handling for fact-check
      if (actionId === 'fact-check') {
        await performFactCheck({
          text: selectedText,
          ai_source: 'library',
          word_limit: 100,
          citation_style: 'apa'
        })
      } else {
        // Call the appropriate API endpoint
        const apiEndpoint = `/api/ai/context-actions/${actionId.replace('-', '-')}`
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: selectedText,
            // Add default parameters based on action type
            ...(actionId === 'translate' && { target_language: 'Spanish' }),
            ...(actionId === 'tone-voice' && { tone_style: 'professional' }),
            ...(actionId === 'we-will' && { commitment_level: 'confident' }),
            ...(actionId === 'pure-completion' && { completion_length: 'medium' }),
            ...(actionId === 'search' && { search_scope: 'knowledge_base' })
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to ${action.label.toLowerCase()}`)
        }

        const result = await response.json()
        onAction(actionId, result.data)
      }
    } catch (error) {
      console.error(`Error in ${actionId}:`, error)
      // Show error toast or notification
    } finally {
      setLoading(null)
      onClose()
    }
  }

  const getActionsByCategory = (categoryId: string) => {
    return menuActions.filter(action => action.category === categoryId)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 min-w-64 max-w-sm"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -10px)'
        }}
      >
        <div className="p-4">
          <div className="text-xs text-gray-500 mb-3">
            Selected: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(
                  activeCategory === category.id ? null : category.id
                )}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  activeCategory === category.id
                    ? `${category.color} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-1">
            {activeCategory ? (
              getActionsByCategory(activeCategory).map(action => (
                <ActionButton
                  key={action.id}
                  action={action}
                  loading={loading === action.id}
                  onClick={() => handleActionClick(action.id)}
                />
              ))
            ) : (
              // Show most commonly used actions when no category selected
              menuActions.slice(0, 6).map(action => (
                <ActionButton
                  key={action.id}
                  action={action}
                  loading={loading === action.id}
                  onClick={() => handleActionClick(action.id)}
                />
              ))
            )}
          </div>

          {!activeCategory && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              Click category buttons to see all actions
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface ActionButtonProps {
  action: MenuAction
  loading: boolean
  onClick: () => void
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, loading, onClick }) => {
  const Icon = action.icon

  return (
    <button
      onClick={onClick}
      disabled={action.disabled || loading}
      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-4 h-4 text-gray-600" />
      <div className="flex-1 text-left">
        <div className="text-sm font-medium text-gray-900">{action.label}</div>
        <div className="text-xs text-gray-500">{action.description}</div>
      </div>
      {action.shortcut && (
        <div className="text-xs text-gray-400 font-mono">
          {action.shortcut}
        </div>
      )}
      {loading && (
        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      )}
    </button>
  )
}

export default ContextMenu 