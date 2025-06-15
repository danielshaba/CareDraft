'use client'

import { useState, useCallback, useEffect } from 'react'
import { TextExtractionResult } from '@/lib/text-extraction'

export function useTextExtraction() {
  const [isExtracting, setIsExtracting] = useState(false)
  const [lastResult, setLastResult] = useState<TextExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client-side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const extractFromStorage = useCallback(async (
    filePath: string,
    fileName: string
  ): Promise<TextExtractionResult> => {
    // Ensure we're on client-side before extracting
    if (!isClient || typeof window === 'undefined') {
      const errorResult: TextExtractionResult = {
        text: '',
        metadata: {
          wordCount: 0,
          characterCount: 0,
          processingTime: 0,
          extractionMethod: 'pdf'
        },
        error: 'Text extraction is only available client-side'
      }
      return errorResult
    }

    setIsExtracting(true)
    setError(null)

    try {
      // Dynamic import to avoid SSR issues
      const { extractTextFromStorage } = await import('@/lib/text-extraction')
      const result = await extractTextFromStorage(filePath, fileName)
      setLastResult(result)
      
      if (result.error) {
        setError(result.error)
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Text extraction failed'
      setError(errorMessage)
      
      const errorResult: TextExtractionResult = {
        text: '',
        metadata: {
          wordCount: 0,
          characterCount: 0,
          processingTime: 0,
          extractionMethod: 'pdf'
        },
        error: errorMessage
      }
      
      setLastResult(errorResult)
      return errorResult
    } finally {
      setIsExtracting(false)
    }
  }, [isClient])

  return {
    extractTextFromStorage: extractFromStorage,
    isExtracting,
    lastResult,
    error,
    clearError: () => setError(null),
    isClient // Expose client state for components to check
  }
} 