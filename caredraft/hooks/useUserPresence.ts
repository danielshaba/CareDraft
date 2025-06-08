'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { UserPresenceService } from '@/lib/services/collaboration'
import { UserPresence, UpdateUserPresenceInput } from '@/types/collaboration'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useUserPresence(sectionId: string) {
  const { user } = useAuth()
  const [presences, setPresences] = useState<UserPresence[]>([])
  const [loading, setLoading] = useState(false)

  const updatePresence = useCallback(async (
    cursorPosition: number | null = null,
    selectionStart: number | null = null,
    selectionEnd: number | null = null
  ) => {
    if (!user || !sectionId) return

    try {
      const presenceInput: UpdateUserPresenceInput = {
        section_id: sectionId,
        cursor_position: cursorPosition ?? 0, // Default to 0 if null
        selection_start: selectionStart,
        selection_end: selectionEnd,
        is_active: true
      }
      
      await UserPresenceService.updatePresence(presenceInput)
    } catch (catchError) {
      console.error('Error updating presence:', catchError)
    }
  }, [user, sectionId])

  const removePresence = useCallback(async () => {
    if (!user || !sectionId) return

    try {
      await UserPresenceService.setInactive(sectionId)
    } catch (catchError) {
      console.error('Error removing presence:', catchError)
    }
  }, [user, sectionId])

  useEffect(() => {
    if (!user || !sectionId) return

    let subscription: RealtimeChannel | null = null

    const setupPresence = async () => {
      setLoading(true)
      try {
        // Load initial presences
        const initialPresences = await UserPresenceService.getActiveUsers(sectionId)
        setPresences(initialPresences)

        // Set up real-time subscription
        subscription = UserPresenceService.subscribeToPresence(
          sectionId,
          (payload) => {
            // Handle real-time updates
            setPresences(prev => {
              if (payload.eventType === 'INSERT' && payload.new) {
                return [...prev, payload.new]
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                return prev.map(p => p.id === payload.new!.id ? payload.new! : p)
              } else if (payload.eventType === 'DELETE' && payload.old) {
                return prev.filter(p => p.id !== payload.old!.id)
              }
              return prev
            })
          }
        )
      } catch (catchError) {
        console.error('Error setting up presence:', catchError)
      } finally {
        setLoading(false)
      }
    }

    setupPresence()

    // Cleanup on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
      removePresence()
    }
  }, [user, sectionId, removePresence])

  // Update presence when user becomes inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        removePresence()
      }
    }

    const handleBeforeUnload = () => {
      removePresence()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [removePresence])

  return {
    presences: presences.filter(p => p.user_id !== user?.id), // Exclude current user
    loading,
    updatePresence,
    removePresence
  }
}

// Hook for getting cursor position from text editor
export function useEditorCursor(editorRef: React.RefObject<HTMLElement>) {
  const getCursorPosition = useCallback((): number => {
    if (!editorRef.current) return 0

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return 0

    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(editorRef.current)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    
    return preCaretRange.toString().length
  }, [editorRef])

  const getSelectionRange = useCallback((): { start: number; end: number } => {
    if (!editorRef.current) return { start: 0, end: 0 }

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return { start: 0, end: 0 }

    const range = selection.getRangeAt(0)
    
    // Get start position
    const preStartRange = range.cloneRange()
    preStartRange.selectNodeContents(editorRef.current)
    preStartRange.setEnd(range.startContainer, range.startOffset)
    const start = preStartRange.toString().length

    // Get end position
    const preEndRange = range.cloneRange()
    preEndRange.selectNodeContents(editorRef.current)
    preEndRange.setEnd(range.endContainer, range.endOffset)
    const end = preEndRange.toString().length

    return { start, end }
  }, [editorRef])

  return {
    getCursorPosition,
    getSelectionRange
  }
} 