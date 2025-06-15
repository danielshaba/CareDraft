'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VersionsService } from '@/lib/services/collaboration'
import { CreateVersionInput } from '@/types/collaboration'

interface UseAutoSaveOptions {
  sectionId: string
  content: string
  enabled?: boolean
  debounceMs?: number
  onSave?: (success: boolean, error?: string) => void
  onVersionCreated?: (versionNumber: number) => void
}

interface UseAutoSaveReturn {
  isSaving: boolean
  lastSaved: Date | null
  saveError: string | null
  saveNow: () => Promise<void>
  hasUnsavedChanges: boolean
}

export function useAutoSave({
  sectionId,
  content,
  enabled = true,
  debounceMs = 30000, // 30 seconds default
  onSave,
  onVersionCreated
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const lastContentRef = useRef<string>('')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveContentRef = useRef<string>('')

  // Track if content has changed since last save
  useEffect(() => {
    if (content !== lastSaveContentRef.current) {
      setHasUnsavedChanges(true)
      setSaveError(null)
    }
  }, [content])

  const performSave = useCallback(async (contentToSave: string, changeSummary?: string) => {
    if (!sectionId || !contentToSave.trim()) {
      return
    }

    try {
      setIsSaving(true)
      setSaveError(null)

      // Calculate word count
      const wordCount = contentToSave.trim().split(/\s+/).length

      // Generate change summary if not provided
      let summary = changeSummary
      if (!summary && lastSaveContentRef.current) {
        summary = generateChangeSummary(lastSaveContentRef.current, contentToSave)
      }

      const versionInput: CreateVersionInput = {
        section_id: sectionId,
        content_snapshot: contentToSave,
        change_summary: summary,
        word_count: wordCount
      }

      const version = await VersionsService.createVersion(versionInput)
      
      if (version) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        lastSaveContentRef.current = contentToSave
        onSave?.(true)
        onVersionCreated?.(version.version_number)
      } else {
        throw new Error('Failed to create version')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save'
      setSaveError(errorMessage)
      onSave?.(false, errorMessage)
      console.error('Auto-save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [sectionId, onSave, onVersionCreated])

  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    await performSave(content)
  }, [content, performSave])

  // Auto-save with debouncing
  useEffect(() => {
    if (!enabled || !content || content === lastContentRef.current) {
      return
    }

    lastContentRef.current = content

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      performSave(content)
    }, debounceMs)

    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, enabled, debounceMs, performSave])

  // Save on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && enabled) {
        event.preventDefault()
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        // Attempt to save immediately (though this may not complete)
        performSave(content, 'Auto-save on page unload')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, enabled, content, performSave])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    isSaving,
    lastSaved,
    saveError,
    saveNow,
    hasUnsavedChanges
  }
}

// Helper function to generate a basic change summary
function generateChangeSummary(oldContent: string, newContent: string): string {
  const oldWords = oldContent.trim().split(/\s+/).length
  const newWords = newContent.trim().split(/\s+/).length
  const wordDiff = newWords - oldWords

  if (Math.abs(wordDiff) < 5) {
    return 'Minor edits'
  } else if (wordDiff > 0) {
    return `Added ${wordDiff} words`
  } else {
    return `Removed ${Math.abs(wordDiff)} words`
  }
}

// Hook for manual version creation with custom change summary
export function useVersionControl(sectionId: string) {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createVersion = useCallback(async (
    content: string, 
    changeSummary: string
  ): Promise<number | null> => {
    if (!sectionId || !content.trim()) {
      return null
    }

    try {
      setIsCreating(true)
      setError(null)

      const wordCount = content.trim().split(/\s+/).length

      const versionInput: CreateVersionInput = {
        section_id: sectionId,
        content_snapshot: content,
        change_summary: changeSummary,
        word_count: wordCount
      }

      const version = await VersionsService.createVersion(versionInput)
      return version?.version_number || null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create version'
      setError(errorMessage)
      console.error('Version creation error:', error)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [sectionId])

  return {
    createVersion,
    isCreating,
    error
  }
} 