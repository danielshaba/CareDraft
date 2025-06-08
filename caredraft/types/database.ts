export interface ExtractedDocument {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  original_text?: string
  processed_text?: string
  word_count: number
  character_count: number
  page_count?: number
  extraction_method?: 'pdf-js' | 'mammoth' | 'xml-parse'
  processing_time?: number
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
  extraction_error?: string
  uploaded_at: string
  extracted_at?: string
  created_at: string
  updated_at: string
}

export interface DocumentTag {
  id: string
  document_id: string
  tag: string
  created_at: string
}

export interface DocumentSection {
  id: string
  document_id: string
  section_number: number
  section_title?: string
  section_content: string
  word_count: number
  character_count: number
  created_at: string
}

export type SectionStatus = 'not_started' | 'in_progress' | 'review' | 'complete'

export interface Section {
  id: string
  title: string
  description?: string
  parent_section_id?: string
  word_count_limit: number
  current_word_count: number
  status: SectionStatus
  owner_id?: string
  due_date?: string
  sort_order: number
  content?: string
  project_id?: string
  created_at: string
  updated_at: string
}

export interface SectionInsert {
  title: string
  description?: string
  parent_section_id?: string
  word_count_limit?: number
  current_word_count?: number
  status?: SectionStatus
  owner_id?: string
  due_date?: string
  sort_order?: number
  content?: string
  project_id?: string
}

export interface SectionUpdate {
  title?: string
  description?: string
  parent_section_id?: string
  word_count_limit?: number
  current_word_count?: number
  status?: SectionStatus
  owner_id?: string
  due_date?: string
  sort_order?: number
  content?: string
  project_id?: string
}

export interface ExtractedDocumentInsert {
  user_id: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  original_text?: string
  processed_text?: string
  word_count?: number
  character_count?: number
  page_count?: number
  extraction_method?: 'pdf-js' | 'mammoth' | 'xml-parse'
  processing_time?: number
  extraction_status?: 'pending' | 'processing' | 'completed' | 'failed'
  extraction_error?: string
  uploaded_at?: string
  extracted_at?: string
}

export interface ExtractedDocumentUpdate {
  original_text?: string
  processed_text?: string
  word_count?: number
  character_count?: number
  page_count?: number
  extraction_method?: 'pdf-js' | 'mammoth' | 'xml-parse'
  processing_time?: number
  extraction_status?: 'pending' | 'processing' | 'completed' | 'failed'
  extraction_error?: string
  extracted_at?: string
}

// Database tables interface extension
// Compliance Items interfaces
export interface ComplianceItem {
  id: string
  proposal_id: string
  requirement: string
  source_type: 'auto' | 'manual'
  completed: boolean
  notes?: string
  source_document_id?: string
  source_page?: number
  confidence_score?: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ComplianceItemInsert {
  proposal_id: string
  requirement: string
  source_type?: 'auto' | 'manual'
  completed?: boolean
  notes?: string
  source_document_id?: string
  source_page?: number
  confidence_score?: number
  sort_order?: number
}

export interface ComplianceItemUpdate {
  requirement?: string
  source_type?: 'auto' | 'manual'
  completed?: boolean
  notes?: string
  source_document_id?: string
  source_page?: number
  confidence_score?: number
  sort_order?: number
}

export interface ComplianceStatistics {
  total_items: number
  completed_items: number
  completion_percentage: number
  auto_items: number
  manual_items: number
}

export interface Database {
  public: {
    Tables: {
      // ... existing tables ...
      extracted_documents: {
        Row: ExtractedDocument
        Insert: ExtractedDocumentInsert
        Update: ExtractedDocumentUpdate
      }
      document_tags: {
        Row: DocumentTag
        Insert: Omit<DocumentTag, 'id' | 'created_at'>
        Update: Partial<Omit<DocumentTag, 'id' | 'created_at'>>
      }
      document_sections: {
        Row: DocumentSection
        Insert: Omit<DocumentSection, 'id' | 'created_at'>
        Update: Partial<Omit<DocumentSection, 'id' | 'created_at'>>
      }
      sections: {
        Row: Section
        Insert: SectionInsert
        Update: SectionUpdate
      }
      compliance_items: {
        Row: ComplianceItem
        Insert: ComplianceItemInsert
        Update: ComplianceItemUpdate
      }
    }
    Functions: {
      get_compliance_statistics: {
        Args: { p_proposal_id: string }
        Returns: ComplianceStatistics[]
      }
      reorder_compliance_items: {
        Args: { 
          p_proposal_id: string
          p_item_ids: string[]
          p_new_orders: number[]
        }
        Returns: boolean
      }
    }
  }
} 