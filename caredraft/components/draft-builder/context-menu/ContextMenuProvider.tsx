'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

export interface ContextMenuPosition {
  x: number
  y: number
}

export interface SelectedText {
  text: string
  range: Range | null
}

export type ContextMenuCategory = 'EVIDENCING' | 'EDITING' | 'INPUTS' | 'CUSTOM' | 'OTHER'

export interface ContextMenuAction {
  id: string
  label: string
  icon?: React.ComponentType<any>
  category: ContextMenuCategory
  description?: string
  shortcut?: string
  handler: (selectedText: SelectedText) => void | Promise<void>
}

interface ContextMenuState {
  isOpen: boolean
  position: ContextMenuPosition | null
  selectedText: SelectedText | null
  triggerType: 'right-click' | 'text-selection' | 'keyboard' | null
  activeCategory: ContextMenuCategory | null
}

interface ContextMenuContextType {
  state: ContextMenuState
  actions: ContextMenuAction[]
  showMenu: (position: ContextMenuPosition, selectedText: SelectedText, triggerType: ContextMenuState['triggerType']) => void
  hideMenu: () => void
  setActiveCategory: (category: ContextMenuCategory | null) => void
  registerAction: (action: ContextMenuAction) => void
  unregisterAction: (actionId: string) => void
  executeAction: (actionId: string) => Promise<void>
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null)

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext)
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider')
  }
  return context
}

interface ContextMenuProviderProps {
  children: React.ReactNode
}

export const ContextMenuProvider: React.FC<ContextMenuProviderProps> = ({ children }) => {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: null,
    selectedText: null,
    triggerType: null,
    activeCategory: null,
  })

  const [actions, setActions] = useState<ContextMenuAction[]>([])
  const menuRef = useRef<HTMLDivElement>(null)

  // Show context menu
  const showMenu = useCallback((
    position: ContextMenuPosition,
    selectedText: SelectedText,
    triggerType: ContextMenuState['triggerType']
  ) => {
    setState({
      isOpen: true,
      position,
      selectedText,
      triggerType,
      activeCategory: null,
    })
  }, [])

  // Hide context menu
  const hideMenu = useCallback(() => {
    setState({
      isOpen: false,
      position: null,
      selectedText: null,
      triggerType: null,
      activeCategory: null,
    })
  }, [])

  // Set active category
  const setActiveCategory = useCallback((category: ContextMenuCategory | null) => {
    setState(prev => ({ ...prev, activeCategory: category }))
  }, [])

  // Register an action
  const registerAction = useCallback((action: ContextMenuAction) => {
    setActions(prev => {
      const filtered = prev.filter(a => a.id !== action.id)
      return [...filtered, action]
    })
  }, [])

  // Unregister an action
  const unregisterAction = useCallback((actionId: string) => {
    setActions(prev => prev.filter(a => a.id !== actionId))
  }, [])

  // Execute an action
  const executeAction = useCallback(async (actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    if (!action || !state.selectedText) return

    try {
      await action.handler(state.selectedText)
      hideMenu()
    } catch (error) {
      console.error('Failed to execute context menu action:', error)
      // Could show error toast here
    }
  }, [actions, state.selectedText, hideMenu])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Space or Ctrl+Shift+E to open context menu
      if ((event.ctrlKey && event.code === 'Space') || 
          (event.ctrlKey && event.shiftKey && event.key === 'E')) {
        event.preventDefault()
        
        const selection = window.getSelection()
        if (selection && selection.toString().trim()) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          
          showMenu(
            { x: rect.left, y: rect.bottom + 5 },
            { text: selection.toString(), range },
            'keyboard'
          )
        }
      }

      // Escape to close menu
      if (event.key === 'Escape' && state.isOpen) {
        hideMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showMenu, hideMenu, state.isOpen])

  // Handle clicks outside menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (state.isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideMenu()
      }
    }

    if (state.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }

    // Return empty cleanup function when menu is not open
    return () => {}
  }, [state.isOpen, hideMenu])

  const contextValue: ContextMenuContextType = {
    state,
    actions,
    showMenu,
    hideMenu,
    setActiveCategory,
    registerAction,
    unregisterAction,
    executeAction,
  }

  return (
    <ContextMenuContext.Provider value={contextValue}>
      {children}
      <div ref={menuRef} />
    </ContextMenuContext.Provider>
  )
} 