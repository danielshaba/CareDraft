// RAG System Types for Vector Embeddings and Knowledge Base

export type DocumentType = 
  | 'pdf'
  | 'word'
  | 'text'
  | 'markdown'
  | 'excel'
  | 'powerpoint'
  | 'web_page'
  | 'other'

export type ProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'archived'

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  file_name?: string
  file_size?: number
  document_type: DocumentType
  mime_type?: string
  uploaded_by?: string
  uploaded_at: string
  updated_at: string
  processing_status: ProcessingStatus
  metadata: Record<string, unknown>
  tags: string[]
  source_url?: string
  checksum?: string
  version: number
  is_active: boolean
  created_at: string
}

export interface DocumentChunk {
  id: string
  document_id: string
  chunk_index: number
  content: string
  content_tokens?: number
  chunk_size: number
  overlap_tokens: number
  metadata: Record<string, unknown>
  page_number?: number
  section_title?: string
  created_at: string
}

export interface DocumentEmbedding {
  id: string
  chunk_id: string
  document_id: string
  embedding: number[]
  embedding_model: string
  created_at: string
}

export interface RAGSearchQuery {
  id: string
  user_id?: string
  query_text: string
  query_embedding?: number[]
  results_count: number
  confidence_threshold: number
  search_timestamp: string
  response_generated: boolean
  response_rating?: number
  metadata: Record<string, unknown>
}

export interface RAGSearchResult {
  id: string
  query_id: string
  chunk_id: string
  similarity_score: number
  rank_position: number
  was_used_in_response: boolean
  created_at: string
}

// Extended types for UI and processing
export interface DocumentWithStats extends KnowledgeDocument {
  chunk_count?: number
  embedding_count?: number
  total_tokens?: number
  processing_complete?: boolean
}

export interface SearchResultWithContext {
  chunk_id: string
  document_id: string
  document_title: string
  chunk_content: string
  similarity_score: number
  metadata: Record<string, unknown>
  document?: Partial<KnowledgeDocument>
  highlighted_content?: string
}

export interface RAGResponse {
  answer: string
  sources: SearchResultWithContext[]
  confidence: number
  query_id: string
  generated_at: string
  tokens_used: number
  processing_time_ms: number
}

// Configuration types
export interface ChunkingConfig {
  max_chunk_size: number
  overlap_size: number
  chunk_strategy: 'fixed' | 'semantic' | 'sentence'
  preserve_formatting: boolean
  include_metadata: boolean
}

export interface EmbeddingConfig {
  model: string
  dimensions: number
  batch_size: number
  rate_limit_per_minute: number
}

export interface RAGConfig {
  chunking: ChunkingConfig
  embedding: EmbeddingConfig
  similarity_threshold: number
  max_results: number
  context_window_size: number
  enable_reranking: boolean
}

// Processing and upload types
export interface DocumentUploadRequest {
  file?: File
  title: string
  content?: string
  document_type: DocumentType
  tags?: string[]
  metadata?: Record<string, unknown>
  source_url?: string
}

export interface ProcessingJob {
  id: string
  document_id: string
  status: ProcessingStatus
  progress: number
  error_message?: string
  started_at: string
  completed_at?: string
  chunks_processed: number
  embeddings_created: number
}

export interface DocumentProcessingResult {
  document_id: string
  chunks_created: number
  embeddings_generated: number
  processing_time_ms: number
  success: boolean
  error?: string
}

// Search and query types
export interface SearchOptions {
  similarity_threshold?: number
  max_results?: number
  document_types?: DocumentType[]
  tags?: string[]
  date_range?: {
    start: string
    end: string
  }
  include_metadata?: boolean
  rerank_results?: boolean
}

export interface SearchRequest {
  query: string
  options?: SearchOptions
  user_id?: string
}

export interface RAGQueryRequest extends SearchRequest {
  generate_response?: boolean
  context_window?: number
  temperature?: number
  max_tokens?: number
  system_prompt?: string
}

// Analytics and metrics types
export interface DocumentAnalytics {
  total_documents: number
  documents_by_type: Record<DocumentType, number>
  documents_by_status: Record<ProcessingStatus, number>
  total_chunks: number
  total_embeddings: number
  storage_used_mb: number
  upload_trends: Array<{
    date: string
    count: number
  }>
}

export interface SearchAnalytics {
  total_queries: number
  average_results_per_query: number
  average_confidence: number
  popular_queries: Array<{
    query: string
    count: number
    avg_confidence: number
  }>
  query_trends: Array<{
    date: string
    count: number
  }>
  response_ratings: Record<number, number>
}

// Error types
export interface RAGError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

export interface ProcessingError extends RAGError {
  document_id: string
  chunk_index?: number
  step: 'upload' | 'chunking' | 'embedding' | 'storage'
}

// Utility types
export type SimilarityMetric = 'cosine' | 'euclidean' | 'dot_product'

export interface VectorSearchOptions {
  metric: SimilarityMetric
  threshold: number
  limit: number
  include_metadata: boolean
}

// API response types
export interface APIResponse<T> {
  data: T
  success: boolean
  error?: RAGError
  timestamp: string
}

export type DocumentListResponse = APIResponse<{
  documents: DocumentWithStats[]
  total: number
  page: number
  limit: number
}>

export type SearchResponse = APIResponse<{
  results: SearchResultWithContext[]
  query_id: string
  total_results: number
  processing_time_ms: number
}>

export type RAGQueryResponse = APIResponse<RAGResponse>

// Constants
export const SUPPORTED_DOCUMENT_TYPES: Record<DocumentType, string[]> = {
  pdf: ['.pdf'],
  word: ['.doc', '.docx'],
  text: ['.txt'],
  markdown: ['.md', '.markdown'],
  excel: ['.xls', '.xlsx'],
  powerpoint: ['.ppt', '.pptx'],
  web_page: [],
  other: []
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const DEFAULT_CHUNK_SIZE = 1000
export const DEFAULT_OVERLAP_SIZE = 200
export const DEFAULT_SIMILARITY_THRESHOLD = 0.7
export const DEFAULT_MAX_RESULTS = 10
export const EMBEDDING_DIMENSIONS = 1536 // OpenAI Ada 002 