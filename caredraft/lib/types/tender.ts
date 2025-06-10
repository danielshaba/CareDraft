// TypeScript interfaces for the Per-Tender Creation Flow

export interface TenderWorkflow {
  id: string
  title: string
  issuing_authority?: string
  deadline?: string // ISO date
  contract_value?: number // in cents
  region?: string
  status: 'draft' | 'analyzing' | 'strategy' | 'questions' | 'review' | 'submitted' | 'won' | 'lost' | 'archived'
  current_step: number // 1-11 for workflow steps
  progress_percentage: number
  bid_decision?: 'bid' | 'no-bid' | 'pending'
  risk_score: number // 0-100
  organization_id: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface TenderDocument {
  id: string
  tender_workflow_id: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  document_type: 'rfx' | 'itt' | 'specification' | 'questionnaire' | 'attachment' | 'supporting'
  upload_status: 'uploading' | 'uploaded' | 'processing' | 'processed' | 'failed'
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
  extracted_data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TenderMetadata {
  id: string
  tender_workflow_id: string
  tender_name?: string
  issuing_body?: string
  submission_deadline?: string
  qa_deadline?: string
  contract_start_date?: string
  contract_duration_months?: number
  contract_value_min?: number // in cents
  contract_value_max?: number // in cents
  evaluation_criteria: Record<string, any>
  scoring_weightings: Record<string, any>
  compliance_requirements: Record<string, any>
  special_conditions?: string[]
  submission_format?: string
  page_limits: Record<string, any>
  word_limits: Record<string, any>
  required_sections: Record<string, any>
  created_at: string
  updated_at: string
}

export interface BidStrategy {
  id: string
  tender_workflow_id: string
  strategy_outline?: string
  response_approach?: string
  thematic_points: string[]
  case_study_slots: Array<{
    theme: string
    description: string
    suggested_cases?: string[]
  }>
  win_themes: string[]
  risk_mitigation: Array<{
    risk: string
    mitigation: string
    likelihood: 'low' | 'medium' | 'high'
  }>
  competitive_analysis?: string
  resource_requirements: Record<string, any>
  timeline: Record<string, any>
  generated_by: string
  confidence_score: number // 0-100
  created_at: string
  updated_at: string
}

export interface TenderQuestion {
  id: string
  tender_workflow_id: string
  question_number?: string
  question_text: string
  question_category?: string
  word_limit?: number
  page_limit?: number
  mandatory: boolean
  evaluation_criteria?: string
  weighting_percentage?: number
  section_reference?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'review'
  assigned_to?: string
  due_date?: string
  response_content?: string
  word_count: number
  created_at: string
  updated_at: string
}

export interface TenderAnalytics {
  id: string
  tender_workflow_id: string
  submission_date?: string
  outcome?: 'won' | 'lost' | 'pending'
  feedback_score?: number // 0-100
  evaluator_feedback?: string
  lessons_learned?: string
  win_themes: string[]
  improvement_areas: string[]
  competitor_analysis: Record<string, any>
  final_score?: number
  total_cost?: number // in cents
  time_invested_hours?: number
  team_members: Array<{
    user_id: string
    role: string
    hours_contributed?: number
  }>
  created_at: string
  updated_at: string
}

// Workflow step definitions
export interface TenderWorkflowStep {
  id: number
  title: string
  description: string
  component: string
  required: boolean
  status: 'pending' | 'current' | 'completed' | 'skipped'
}

export const TENDER_WORKFLOW_STEPS: TenderWorkflowStep[] = [
  {
    id: 1,
    title: "Kick Off New Tender",
    description: "Initialize tender workflow from dashboard",
    component: "TenderKickOff",
    required: true,
    status: 'pending'
  },
  {
    id: 2,
    title: "Upload RFx Documents",
    description: "Upload and auto-parse tender documents",
    component: "DocumentUpload",
    required: true,
    status: 'pending'
  },
  {
    id: 3,
    title: "Confirm/Edit Tender Details",
    description: "Review and confirm extracted tender information",
    component: "TenderDetails",
    required: true,
    status: 'pending'
  },
  {
    id: 4,
    title: "Review Tender Summary",
    description: "Review deadlines, compliance, and bid recommendation",
    component: "TenderSummary",
    required: true,
    status: 'pending'
  },
  {
    id: 5,
    title: "Index Knowledge Hub",
    description: "Tag and index documents for AI retrieval",
    component: "KnowledgeIndex",
    required: true,
    status: 'pending'
  },
  {
    id: 6,
    title: "Generate Bid Strategy",
    description: "AI-generated response approach and themes",
    component: "BidStrategy",
    required: true,
    status: 'pending'
  },
  {
    id: 7,
    title: "Map & Auto-Fill Questions",
    description: "Extract and map all RFx questions",
    component: "QuestionMapping",
    required: true,
    status: 'pending'
  },
  {
    id: 8,
    title: "Collaborative Response Drafting",
    description: "Team-based response creation and editing",
    component: "ResponseDrafting",
    required: true,
    status: 'pending'
  },
  {
    id: 9,
    title: "Quality Assurance Review",
    description: "Final review and quality checks",
    component: "QualityReview",
    required: true,
    status: 'pending'
  },
  {
    id: 10,
    title: "Final Compilation & Export",
    description: "Compile responses and export submission",
    component: "FinalCompilation",
    required: true,
    status: 'pending'
  },
  {
    id: 11,
    title: "Post-Submission Tracking",
    description: "Track outcome and capture analytics",
    component: "PostSubmission",
    required: false,
    status: 'pending'
  }
]

// Tab configuration for the modular UI
export interface TenderTab {
  id: string
  title: string
  description: string
  icon: string
  component: string
  enabled: boolean
  step_range: number[] // which workflow steps this tab covers
}

export const TENDER_TABS: TenderTab[] = [
  {
    id: 'summary',
    title: 'Summary',
    description: 'Overview and key details',
    icon: 'FileText',
    component: 'TenderSummaryTab',
    enabled: true,
    step_range: [1, 4]
  },
  {
    id: 'strategy',
    title: 'AI Strategy',
    description: 'Generate bid strategy with AI',
    icon: 'Brain',
    component: 'TenderStrategyTab',
    enabled: true,
    step_range: [5, 6]
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload and manage tender documents',
    icon: 'Upload',
    component: 'TenderDocumentsTab',
    enabled: true,
    step_range: [2]
  },
  {
    id: 'requirements',
    title: 'Requirements',
    description: 'Extracted questions and requirements',
    icon: 'List',
    component: 'TenderRequirementsTab',
    enabled: true,
    step_range: [7]
  },
  {
    id: 'proposal',
    title: 'Proposal',
    description: 'Response drafting and collaboration',
    icon: 'Edit3',
    component: 'TenderProposalTab',
    enabled: true,
    step_range: [6, 8, 9]
  },
  {
    id: 'compliance',
    title: 'Compliance Matrix',
    description: 'Compliance tracking and validation',
    icon: 'CheckCircle2',
    component: 'TenderComplianceTab',
    enabled: true,
    step_range: [9, 10]
  },
  {
    id: 'collaborate',
    title: 'Collaborate',
    description: 'Team collaboration and task management',
    icon: 'Users',
    component: 'TenderCollaborateTab',
    enabled: true,
    step_range: [8, 9]
  },
  {
    id: 'export',
    title: 'Export',
    description: 'Document export and submission',
    icon: 'Download',
    component: 'TenderExportTab',
    enabled: true,
    step_range: [10]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Performance tracking and insights',
    icon: 'BarChart3',
    component: 'TenderAnalyticsTab',
    enabled: true,
    step_range: [11]
  }
]

// Form interfaces
export interface CreateTenderWorkflowData {
  title: string
  issuing_authority?: string
  deadline?: string
  contract_value?: number
  region?: string
}

export interface TenderDocumentUploadData {
  files: File[]
  document_type: TenderDocument['document_type']
}

export interface TenderQuestionResponse {
  question_id: string
  content: string
  word_count: number
  status: TenderQuestion['status']
  assigned_to?: string
}

// API response types
export interface TenderWorkflowWithRelations extends TenderWorkflow {
  documents?: TenderDocument[]
  metadata?: TenderMetadata
  strategy?: BidStrategy
  questions?: TenderQuestion[]
  analytics?: TenderAnalytics
} 