'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Keyboard } from 'lucide-react'
import { useContextMenu, ContextMenuCategory } from './ContextMenuProvider'
import { cn } from '@/lib/utils'

const categoryColors = {
  EVIDENCING: 'bg-brand-50 border-brand-200 text-brand-700',
  EDITING: 'bg-green-50 border-green-200 text-green-700',
  INPUTS: 'bg-purple-50 border-purple-200 text-purple-700',
  CUSTOM: 'bg-orange-50 border-orange-200 text-orange-700',
  OTHER: 'bg-gray-50 border-gray-200 text-gray-700',
}

const categoryDescriptions = {
  EVIDENCING: 'Enhance content with evidence and examples',
  EDITING: 'Improve writing quality and style',
  INPUTS: 'Add and integrate content',
  CUSTOM: 'Apply CareDraft-specific enhancements',
  OTHER: 'Additional tools and utilities',
}

interface ContextMenuProps {
  className?: string
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ className }) => {
  const { state, actions, hideMenu, setActiveCategory, executeAction } = useContextMenu()
  const menuRef = useRef<HTMLDivElement>(null)

  // Group actions by category
  const actionsByCategory = actions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = []
    }
    acc[action.category].push(action)
    return acc
  }, {} as Record<ContextMenuCategory, typeof actions>)

  // Handle keyboard navigation
  useEffect(() => {
    if (!state.isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.isOpen, hideMenu])

  // Auto-position menu to stay within viewport
  const getMenuStyle = () => {
    if (!state.position) return {}

    const { x, y } = state.position
    const menuWidth = 320
    const menuHeight = 400
    const padding = 10

    let adjustedX = x
    let adjustedY = y

    // Adjust horizontal position
    if (x + menuWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuWidth - padding
    }
    if (adjustedX < padding) {
      adjustedX = padding
    }

    // Adjust vertical position
    if (y + menuHeight > window.innerHeight - padding) {
      adjustedY = y - menuHeight - 10
    }
    if (adjustedY < padding) {
      adjustedY = padding
    }

    return {
      left: adjustedX,
      top: adjustedY,
    }
  }

  if (!state.isOpen || !state.position) return null

  const menuContent = (
    <AnimatePresence>
      {state.isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden',
            className
          )}
          style={getMenuStyle()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Context Actions</h3>
                                 <p className="text-xs text-gray-500 mt-0.5">
                   Selected: "{state.selectedText?.text.slice(0, 30)}{(state.selectedText?.text.length || 0) > 30 ? '...' : ''}"
                 </p>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Keyboard className="h-3 w-3 mr-1" />
                <span>Esc</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(categoryColors).map(([category, colorClass]) => {
              const categoryActions = actionsByCategory[category as ContextMenuCategory] || []
              
              if (categoryActions.length === 0) return null

              return (
                <div key={category} className="border-b border-gray-100 last:border-b-0">
                  {/* Category Header */}
                  <div className={cn('px-4 py-2 text-xs font-medium uppercase tracking-wider', colorClass)}>
                    <div className="flex items-center justify-between">
                      <span>{category}</span>
                      <span className="text-xs opacity-70">{categoryActions.length}</span>
                    </div>
                    <p className="text-xs mt-0.5 normal-case opacity-80 font-normal">
                      {categoryDescriptions[category as ContextMenuCategory]}
                    </p>
                  </div>

                  {/* Category Actions */}
                  <div className="py-1">
                    {categoryActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => executeAction(action.id)}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors group flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          {action.icon && (
                            <div className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-gray-600">
                              <action.icon className="w-full h-full" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                              {action.label}
                            </div>
                            {action.description && (
                              <div className="text-xs text-gray-500 group-hover:text-gray-600 mt-0.5">
                                {action.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          {action.shortcut && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                              {action.shortcut}
                            </span>
                          )}
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Total: {actions.length} actions available</span>
              <div className="flex items-center space-x-2">
                <span className="px-1.5 py-0.5 bg-white rounded text-xs font-mono">Ctrl+Space</span>
                <span>or</span>
                <span className="px-1.5 py-0.5 bg-white rounded text-xs font-mono">Ctrl+Shift+E</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Render into portal to ensure proper z-index layering
  return createPortal(menuContent, document.body)
}

export default ContextMenu 