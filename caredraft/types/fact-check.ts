// Fact Check System Types
// ===========================

export type AISource = 'library' | 'creative' | 'internet'
export type ConfidenceScore = 'high' | 'medium' | 'low'
export type CitationStyle = 'apa' | 'mla' | 'chicago'
export type WordLimit = 50 | 100 | 200
export type SourceType = 'academic' | 'government' | 'news' | 'organization' | 'other'

// Database Models
// ================

export interface FactCheck {
  id: string
  text_content: string
  text_hash: string
  source_text?: string
  ai_source: AISource
  is_verified: boolean
  confidence_score: ConfidenceScore
  confidence_percentage?: number
  sources: FactCheckSource[]
  citations?: string
  citation_style: CitationStyle
  word_limit: WordLimit
  expanded_content?: string
  verification_details: Record<string, any>
  model_used?: string
  processing_time_ms?: number
  expires_at: string
  cache_key?: string
  user_id?: string
  session_id?: string
  created_at: string
  updated_at: string
}

export interface FactCheckSource {
  id: string
  fact_check_id: string
  title: string
  url?: string
  author?: string
  publication_date?: string
  publisher?: string
  description?: string
  reliability_score?: number
  source_type?: SourceType
  relevant_excerpt?: string
  context_excerpt?: string
  created_at: string
  updated_at: string
}

// API Request/Response Types
// ==========================

export interface FactCheckRequest {
  text: string
  ai_source: AISource
  word_limit: WordLimit
  citation_style?: CitationStyle
  user_id?: string
  session_id?: string
}

export interface FactCheckResponse {
  fact_check: FactCheck
  sources: FactCheckSource[]
  is_cached: boolean
  processing_time_ms: number
}

export interface SourceAttributionRequest {
  fact_check_id: string
  citation_style: CitationStyle
  include_excerpts?: boolean
}

export interface SourceAttributionResponse {
  formatted_citations: string
  sources: FactCheckSource[]
  citation_style: CitationStyle
}

// Component Props Types
// =====================

export interface FactCheckOverlayProps {
  isVisible: boolean
  position: { x: number; y: number }
  selectedText: string
  onClose: () => void
  onFactCheck: (result: FactCheckResponse) => void
}

export interface AISourceToggleProps {
  selectedSource: AISource
  onSourceChange: (source: AISource) => void
  disabled?: boolean
}

export interface ConfidenceIndicatorProps {
  confidence: ConfidenceScore
  percentage?: number
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export interface SourceAttributionProps {
  sources: FactCheckSource[]
  citationStyle: CitationStyle
  onCitationStyleChange: (style: CitationStyle) => void
  onShowSource: (source: FactCheckSource) => void
}

export interface WordLimitControlsProps {
  currentLimit: WordLimit
  onLimitChange: (limit: WordLimit) => void
  disabled?: boolean
}

// Context Types
// =============

export interface FactCheckContextType {
  // State
  isLoading: boolean
  currentFactCheck?: FactCheck
  activeSources: FactCheckSource[]
  selectedAISource: AISource
  selectedWordLimit: WordLimit
  selectedCitationStyle: CitationStyle
  
  // Actions
  performFactCheck: (request: FactCheckRequest) => Promise<FactCheckResponse>
  getSourceAttribution: (request: SourceAttributionRequest) => Promise<SourceAttributionResponse>
  clearFactCheck: () => void
  updateAISource: (source: AISource) => void
  updateWordLimit: (limit: WordLimit) => void
  updateCitationStyle: (style: CitationStyle) => void
  
  // Cache management
  getCachedFactCheck: (textHash: string, aiSource: AISource, wordLimit: WordLimit) => Promise<FactCheck | null>
  invalidateCache: (textHash?: string) => Promise<void>
}

// Utility Types
// =============

export interface FactCheckCache {
  [key: string]: FactCheck
}

export interface OverlayPosition {
  x: number
  y: number
  width?: number
  height?: number
}

export interface FactCheckError {
  code: string
  message: string
  details?: Record<string, any>
}

// Confidence Scoring Types
// ========================

export interface ConfidenceMetrics {
  source_reliability: number
  content_accuracy: number
  citation_quality: number
  verification_depth: number
  consensus_level: number
}

export interface ConfidenceCalculation {
  overall_score: ConfidenceScore
  percentage: number
  metrics: ConfidenceMetrics
  reasoning: string[]
}

// Search and Filtering Types
// ===========================

export interface FactCheckFilters {
  ai_source?: AISource[]
  confidence_score?: ConfidenceScore[]
  source_type?: SourceType[]
  date_range?: {
    start: string
    end: string
  }
  reliability_threshold?: number
}

export interface FactCheckSearchParams {
  query?: string
  filters?: FactCheckFilters
  sort_by?: 'created_at' | 'confidence_percentage' | 'source_count'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Export helper functions type
export interface FactCheckHelpers {
  generateTextHash: (text: string) => string
  generateCacheKey: (textHash: string, aiSource: AISource, wordLimit: WordLimit) => string
  calculateConfidence: (sources: FactCheckSource[], verificationDetails: Record<string, any>) => ConfidenceCalculation
  formatCitation: (source: FactCheckSource, style: CitationStyle) => string
  isExpired: (factCheck: FactCheck) => boolean
} 