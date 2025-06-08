/**
 * AnswerBank System TypeScript Types
 * These types align with the database schema created in the migration
 */

// Answer Bank Category Types
export interface AnswerBankCategory {
  id: string
  name: string
  description?: string
  color: string // Hex color code
  icon?: string // Icon name for UI representation
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AnswerBankCategoryInsert {
  name: string
  description?: string
  color?: string
  icon?: string
  sort_order?: number
  is_active?: boolean
}

export interface AnswerBankCategoryUpdate {
  name?: string
  description?: string
  color?: string
  icon?: string
  sort_order?: number
  is_active?: boolean
}

// Answer Bank Core Types
export interface AnswerBank {
  id: string
  title: string
  content: string
  category_id?: string
  organization_id: string
  created_by: string
  updated_by?: string
  usage_count: number
  popularity_score: number
  tags: string[]
  word_count: number
  is_template: boolean
  is_public: boolean
  version: number
  parent_id?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AnswerBankInsert {
  title: string
  content: string
  category_id?: string
  organization_id: string
  created_by: string
  tags?: string[]
  is_template?: boolean
  is_public?: boolean
  parent_id?: string
  metadata?: Record<string, unknown>
}

export interface AnswerBankUpdate {
  title?: string
  content?: string
  category_id?: string
  updated_by?: string
  tags?: string[]
  is_template?: boolean
  is_public?: boolean
  metadata?: Record<string, unknown>
}

// Answer Bank with Statistics (from view)
export interface AnswerBankWithStats extends AnswerBank {
  category_name?: string
  category_color?: string
  category_icon?: string
  avg_rating: number
  rating_count: number
  created_by_email?: string
  created_by_first_name?: string
  created_by_last_name?: string
  updated_by_email?: string
}

// Usage Tracking Types
export interface AnswerBankUsageTracking {
  id: string
  answer_id: string
  user_id: string
  organization_id: string
  context?: string
  used_at: string
  session_id?: string
  metadata: Record<string, unknown>
}

export interface AnswerBankUsageTrackingInsert {
  answer_id: string
  user_id: string
  organization_id: string
  context?: string
  session_id?: string
  metadata?: Record<string, unknown>
}

// Ratings Types
export interface AnswerBankRating {
  id: string
  answer_id: string
  user_id: string
  rating: number // 1-5 scale
  feedback?: string
  created_at: string
  updated_at: string
}

export interface AnswerBankRatingInsert {
  answer_id: string
  user_id: string
  rating: number
  feedback?: string
}

export interface AnswerBankRatingUpdate {
  rating?: number
  feedback?: string
}

// API Response Types
export interface AnswerBankListResponse {
  data: AnswerBankWithStats[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface AnswerBankSearchFilters {
  query?: string
  category_id?: string
  tags?: string[]
  is_template?: boolean
  is_public?: boolean
  created_by?: string
  created_after?: string
  created_before?: string
  min_rating?: number
  sort_by?: 'created_at' | 'updated_at' | 'popularity_score' | 'usage_count' | 'title'
  sort_order?: 'asc' | 'desc'
}

export interface AnswerBankSearchParams extends AnswerBankSearchFilters {
  page?: number
  per_page?: number
}

// Context Types for Usage Tracking
export type AnswerBankUsageContext = 
  | 'draft_builder'
  | 'brainstorm'
  | 'knowledge_hub'
  | 'search'
  | 'template'
  | 'copy_paste'
  | 'quick_insert'
  | 'general'

// Template Types
export interface AnswerBankTemplate extends AnswerBank {
  is_template: true
}

export interface AnswerBankTemplateCategory {
  category: AnswerBankCategory
  templates: AnswerBankTemplate[]
  count: number
}

// Analytics Types
export interface AnswerBankAnalytics {
  total_answers: number
  total_usage: number
  avg_rating: number
  most_used_categories: Array<{
    category: AnswerBankCategory
    usage_count: number
  }>
  recent_activity: Array<{
    answer: AnswerBankWithStats
    usage_count: number
    last_used: string
  }>
  top_rated: AnswerBankWithStats[]
  usage_trends: Array<{
    date: string
    usage_count: number
  }>
}

// Form Types for UI Components
export interface AnswerBankFormData {
  title: string
  content: string
  category_id: string
  tags: string[]
  is_template: boolean
  is_public: boolean
  metadata?: Record<string, unknown>
}

export interface AnswerBankQuickInsertData {
  answer_id: string
  context: AnswerBankUsageContext
  session_id?: string
}

// Export/Import Types
export interface AnswerBankExportData {
  answers: AnswerBank[]
  categories: AnswerBankCategory[]
  export_date: string
  organization_id: string
  version: string
}

export interface AnswerBankImportOptions {
  merge_categories: boolean
  update_existing: boolean
  preserve_metadata: boolean
  assign_to_category?: string
}

// Error Types
export interface AnswerBankError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// Validation Types
export interface AnswerBankValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}

// Database Function Types
export interface PopularityScoreUpdate {
  answer_id: string
  new_score: number
}

export interface UsageIncrementParams {
  answer_id: string
  user_id: string
  context?: AnswerBankUsageContext
  session_id?: string
} 