'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

// Context types (simplified for now)
export type AISource = 'library' | 'creative' | 'internet'
export type ConfidenceScore = 'high' | 'medium' | 'low'
export type CitationStyle = 'apa' | 'mla' | 'chicago'
export type WordLimit = 50 | 100 | 200

interface FactCheck {
  id: string
  text_content: string
  text_hash: string
  ai_source: AISource
  is_verified: boolean
  confidence_score: ConfidenceScore
  confidence_percentage?: number
  sources: any[]
  citations?: string
  citation_style: CitationStyle
  word_limit: WordLimit
  expanded_content?: string
  created_at: string
  updated_at: string
}

interface FactCheckSource {
  id: string
  fact_check_id: string
  title: string
  url?: string
  author?: string
  reliability_score?: number
  relevant_excerpt?: string
}

interface FactCheckRequest {
  text: string
  ai_source: AISource
  word_limit: WordLimit
  citation_style?: CitationStyle
  user_id?: string
  session_id?: string
}

interface FactCheckResponse {
  fact_check: FactCheck
  sources: FactCheckSource[]
  is_cached: boolean
  processing_time_ms: number
}

interface FactCheckContextType {
  isLoading: boolean
  currentFactCheck?: FactCheck
  activeSources: FactCheckSource[]
  selectedAISource: AISource
  selectedWordLimit: WordLimit
  selectedCitationStyle: CitationStyle
  
  performFactCheck: (request: FactCheckRequest) => Promise<FactCheckResponse>
  clearFactCheck: () => void
  updateAISource: (source: AISource) => void
  updateWordLimit: (limit: WordLimit) => void
  updateCitationStyle: (style: CitationStyle) => void
}

// Create the context
const FactCheckContext = createContext<FactCheckContextType | undefined>(undefined)

// Custom hook to use the fact-check context
export function useFactCheck() {
  const context = useContext(FactCheckContext)
  if (context === undefined) {
    throw new Error('useFactCheck must be used within a FactCheckProvider')
  }
  return context
}

// Provider component
interface FactCheckProviderProps {
  children: React.ReactNode
}

export function FactCheckProvider({ children }: FactCheckProviderProps) {
  // State
  const [isLoading, setIsLoading] = useState(false)
  const [currentFactCheck, setCurrentFactCheck] = useState<FactCheck | undefined>()
  const [activeSources, setActiveSources] = useState<FactCheckSource[]>([])
  const [selectedAISource, setSelectedAISource] = useState<AISource>('library')
  const [selectedWordLimit, setSelectedWordLimit] = useState<WordLimit>(100)
  const [selectedCitationStyle, setSelectedCitationStyle] = useState<CitationStyle>('apa')

  // API call function
  const performFactCheck = useCallback(async (request: FactCheckRequest): Promise<FactCheckResponse> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/ai/fact-check/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fact check failed')
      }

      const result: FactCheckResponse = await response.json()
      
      // Update state
      setCurrentFactCheck(result.fact_check)
      setActiveSources(result.sources)

      return result
    } catch (error) {
      console.error('Fact check error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Clear current fact check
  const clearFactCheck = useCallback(() => {
    setCurrentFactCheck(undefined)
    setActiveSources([])
  }, [])

  // Update AI source
  const updateAISource = useCallback((source: AISource) => {
    setSelectedAISource(source)
  }, [])

  // Update word limit
  const updateWordLimit = useCallback((limit: WordLimit) => {
    setSelectedWordLimit(limit)
  }, [])

  // Update citation style
  const updateCitationStyle = useCallback((style: CitationStyle) => {
    setSelectedCitationStyle(style)
  }, [])

  // Context value
  const contextValue: FactCheckContextType = {
    // State
    isLoading,
    currentFactCheck,
    activeSources,
    selectedAISource,
    selectedWordLimit,
    selectedCitationStyle,
    
    // Actions
    performFactCheck,
    clearFactCheck,
    updateAISource,
    updateWordLimit,
    updateCitationStyle,
  }

  return (
    <FactCheckContext.Provider value={contextValue}>
      {children}
    </FactCheckContext.Provider>
  )
} 