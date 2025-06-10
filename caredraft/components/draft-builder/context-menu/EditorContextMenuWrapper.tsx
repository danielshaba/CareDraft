'use client'

import React, { useEffect, useRef, ReactNode } from 'react'
import { Editor } from '@tiptap/react'
import { useContextMenu } from './ContextMenuProvider'

interface EditorContextMenuWrapperProps {
  editor: Editor | null
  children: ReactNode
  className?: string
}

export const EditorContextMenuWrapper: React.FC<EditorContextMenuWrapperProps> = ({
  editor,
  children,
  className
}) => {
  const { showMenu } = useContextMenu()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor || !containerRef.current) return

    const container = containerRef.current

    // Handle right-click context menu
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      
      // Get the current selection
      const selection = window.getSelection()
      if (!selection || selection.toString().trim() === '') {
        return // Don't show menu if no text is selected
      }

      const selectedText = {
        text: selection.toString(),
        range: selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      }

      showMenu(
        { x: event.clientX, y: event.clientY },
        selectedText,
        'right-click'
      )
    }

    // Handle text selection for automatic menu triggering
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.toString().trim() === '') {
        return
      }

      // Check if the selection is within our editor
      const editorElement = editor.view.dom
      if (!editorElement.contains(selection.anchorNode) && 
          !editorElement.contains(selection.focusNode)) {
        return
      }

      // Only auto-trigger if selection is substantial (more than a few characters)
      const selectedText = selection.toString()
      if (selectedText.length < 5) {
        return
      }

      // Auto-trigger context menu for longer selections after a brief delay
      const timeoutId = setTimeout(() => {
        const currentSelection = window.getSelection()
        if (currentSelection?.toString() === selectedText) {
          const range = currentSelection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          
          // Position menu below the selection
          showMenu(
            { x: rect.left, y: rect.bottom + 5 },
            { text: selectedText, range },
            'text-selection'
          )
        }
      }, 500) // Half-second delay to avoid triggering on accidental selections

      return () => clearTimeout(timeoutId)
    }

    // Handle keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Right-click equivalent (Ctrl+Shift+M)
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
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
    }

    // Add event listeners
    container.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('selectionchange', handleSelectionChange)
    container.addEventListener('keydown', handleKeyDown)

    // Touch events for mobile support
    let touchTimeout: NodeJS.Timeout

    const handleTouchStart = (event: TouchEvent) => {
      touchTimeout = setTimeout(() => {
        const selection = window.getSelection()
        if (selection && selection.toString().trim()) {
          const touch = event.touches[0]
          showMenu(
            { x: touch.clientX, y: touch.clientY },
            { text: selection.toString(), range: selection.getRangeAt(0) },
            'right-click'
          )
        }
      }, 500) // Long press duration
    }

    const handleTouchEnd = () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout)
      }
    }

    const handleTouchMove = () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout)
      }
    }

    // Add touch event listeners for mobile context menu
    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchmove', handleTouchMove)

    // Cleanup
    return () => {
      container.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('selectionchange', handleSelectionChange)
      container.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchmove', handleTouchMove)
      
      if (touchTimeout) {
        clearTimeout(touchTimeout)
      }
    }
  }, [editor, showMenu])

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ 
        // Ensure the wrapper doesn't interfere with text selection
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        msUserSelect: 'text'
      }}
    >
      {children}
    </div>
  )
}

export default EditorContextMenuWrapper 