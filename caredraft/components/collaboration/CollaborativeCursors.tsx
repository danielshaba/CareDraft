'use client'

import React, { useEffect, useState } from 'react'
import { UserPresence, getUserColor, getUserDisplayName } from '@/types/collaboration'

interface CollaborativeCursorsProps {
  presences: UserPresence[]
  editorRef: React.RefObject<HTMLElement>
  className?: string
}

interface CursorPosition {
  x: number
  y: number
  userId: string
  userName: string
  color: string
}

export function CollaborativeCursors({ 
  presences, 
  editorRef, 
  className = '' 
}: CollaborativeCursorsProps) {
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([])

  // Calculate cursor positions based on text positions
  useEffect(() => {
    if (!editorRef.current) return

    const calculatePositions = () => {
      const positions: CursorPosition[] = []

      presences.forEach(presence => {
        if (!presence.is_active || !presence.cursor_position) return

        try {
          const position = getTextPosition(presence.cursor_position)
          if (position) {
            positions.push({
              x: position.x,
              y: position.y,
              userId: presence.user_id,
              userName: getUserDisplayName(presence.user || {}),
              color: getUserColor(presence.user_id)
            })
          }
        } catch {
          console.warn('Error calculating cursor position:', error)
        }
      })

      setCursorPositions(positions)
    }

    const getTextPosition = (offset: number): { x: number; y: number } | null => {
      if (!editorRef.current) return null

      try {
        const range = document.createRange()
        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          null
        )

        let currentOffset = 0
        let node

        while ((node = walker.nextNode())) {
          const nodeLength = node.textContent?.length || 0
          
          if (currentOffset + nodeLength >= offset) {
            const offsetInNode = offset - currentOffset
            range.setStart(node, Math.min(offsetInNode, nodeLength))
            range.setEnd(node, Math.min(offsetInNode, nodeLength))
            
            const rect = range.getBoundingClientRect()
            const editorRect = editorRef.current.getBoundingClientRect()
            
            return {
              x: rect.left - editorRect.left,
              y: rect.top - editorRect.top
            }
          }
          
          currentOffset += nodeLength
        }

        // If offset is beyond content, position at end
        if (offset >= currentOffset) {
          range.selectNodeContents(editorRef.current)
          range.collapse(false)
          const rect = range.getBoundingClientRect()
          const editorRect = editorRef.current.getBoundingClientRect()
          
          return {
            x: rect.left - editorRect.left,
            y: rect.top - editorRect.top
          }
        }
      } catch {
        console.warn('Error in getTextPosition:', error)
      }

      return null
    }

    calculatePositions()

    // Recalculate on window resize or content changes
    const handleResize = () => calculatePositions()
    const observer = new MutationObserver(calculatePositions)

    window.addEventListener('resize', handleResize)
    if (editorRef.current) {
      observer.observe(editorRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      })
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
    }
  }, [presences, editorRef])

  return (
    <div className={`absolute inset-0 pointer-events-none z-10 ${className}`}>
      {cursorPositions.map(cursor => (
        <CollaborativeCursor
          key={cursor.userId}
          x={cursor.x}
          y={cursor.y}
          userName={cursor.userName}
          color={cursor.color}
        />
      ))}
    </div>
  )
}

interface CollaborativeCursorProps {
  x: number
  y: number
  userName: string
  color: string
}

function CollaborativeCursor({ x, y, userName, color }: CollaborativeCursorProps) {
  return (
    <div
      className="absolute transform -translate-x-0.5 pointer-events-none animate-pulse"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000
      }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 h-5 absolute"
        style={{ backgroundColor: color }}
      />
      
      {/* User label */}
      <div
        className="absolute top-0 left-1 px-1.5 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap text-shadow-sm"
        style={{ 
          backgroundColor: color,
          fontSize: '11px',
          lineHeight: '14px',
          transform: 'translateY(-100%)'
        }}
      >
        {userName}
      </div>

      {/* Cursor pointer */}
      <div
        className="absolute top-0 left-0 w-0 h-0"
        style={{
          borderLeft: '3px solid transparent',
          borderRight: '3px solid transparent',
          borderTop: `4px solid ${color}`,
          transform: 'translateY(-4px)'
        }}
      />
    </div>
  )
} 