-- Create tender workflow tables for the Per-Tender Creation Flow

-- Create tender workflows table
CREATE TABLE IF NOT EXISTS tender_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  issuing_authority VARCHAR(255),
  deadline TIMESTAMP WITH TIME ZONE,
  contract_value BIGINT, -- stored in cents
  region VARCHAR(100),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'strategy', 'questions', 'review', 'submitted', 'won', 'lost', 'archived')),
  current_step INTEGER DEFAULT 1, -- 1-11 for the workflow steps
  progress_percentage INTEGER DEFAULT 0,
  bid_decision TEXT CHECK (bid_decision IN ('bid', 'no-bid', 'pending')),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tender documents table
CREATE TABLE IF NOT EXISTS tender_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_workflow_id UUID NOT NULL REFERENCES tender_workflows(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(50),
  document_type TEXT DEFAULT 'rfx' CHECK (document_type IN ('rfx', 'itt', 'specification', 'questionnaire', 'attachment', 'supporting')),
  upload_status TEXT DEFAULT 'uploading' CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'processed', 'failed')),
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tender metadata table for extracted tender details
CREATE TABLE IF NOT EXISTS tender_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_workflow_id UUID NOT NULL REFERENCES tender_workflows(id) ON DELETE CASCADE,
  tender_name VARCHAR(255),
  issuing_body VARCHAR(255),
  submission_deadline TIMESTAMP WITH TIME ZONE,
  qa_deadline TIMESTAMP WITH TIME ZONE,
  contract_start_date TIMESTAMP WITH TIME ZONE,
  contract_duration_months INTEGER,
  contract_value_min BIGINT, -- in cents
  contract_value_max BIGINT, -- in cents
  evaluation_criteria JSONB DEFAULT '{}',
  scoring_weightings JSONB DEFAULT '{}',
  compliance_requirements JSONB DEFAULT '{}',
  special_conditions TEXT[],
  submission_format VARCHAR(100),
  page_limits JSONB DEFAULT '{}',
  word_limits JSONB DEFAULT '{}',
  required_sections JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bid strategies table
CREATE TABLE IF NOT EXISTS bid_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_workflow_id UUID NOT NULL REFERENCES tender_workflows(id) ON DELETE CASCADE,
  strategy_outline TEXT,
  response_approach TEXT,
  thematic_points JSONB DEFAULT '[]',
  case_study_slots JSONB DEFAULT '[]',
  win_themes JSONB DEFAULT '[]',
  risk_mitigation JSONB DEFAULT '[]',
  competitive_analysis TEXT,
  resource_requirements JSONB DEFAULT '{}',
  timeline JSONB DEFAULT '{}',
  generated_by VARCHAR(50) DEFAULT 'ai',
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tender questions table (extracted RFx questions)
CREATE TABLE IF NOT EXISTS tender_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_workflow_id UUID NOT NULL REFERENCES tender_workflows(id) ON DELETE CASCADE,
  question_number VARCHAR(50),
  question_text TEXT NOT NULL,
  question_category VARCHAR(100),
  word_limit INTEGER,
  page_limit INTEGER,
  mandatory BOOLEAN DEFAULT true,
  evaluation_criteria TEXT,
  weighting_percentage DECIMAL(5,2),
  section_reference VARCHAR(100),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'review')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  response_content TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tender analytics table
CREATE TABLE IF NOT EXISTS tender_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_workflow_id UUID NOT NULL REFERENCES tender_workflows(id) ON DELETE CASCADE,
  submission_date TIMESTAMP WITH TIME ZONE,
  outcome TEXT CHECK (outcome IN ('won', 'lost', 'pending')),
  feedback_score INTEGER CHECK (feedback_score >= 0 AND feedback_score <= 100),
  evaluator_feedback TEXT,
  lessons_learned TEXT,
  win_themes JSONB DEFAULT '[]',
  improvement_areas JSONB DEFAULT '[]',
  competitor_analysis JSONB DEFAULT '{}',
  final_score DECIMAL(5,2),
  total_cost BIGINT, -- in cents
  time_invested_hours DECIMAL(8,2),
  team_members JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tender_workflows_organization_id ON tender_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_tender_workflows_owner_id ON tender_workflows(owner_id);
CREATE INDEX IF NOT EXISTS idx_tender_workflows_status ON tender_workflows(status);
CREATE INDEX IF NOT EXISTS idx_tender_workflows_deadline ON tender_workflows(deadline);

CREATE INDEX IF NOT EXISTS idx_tender_documents_workflow_id ON tender_documents(tender_workflow_id);
CREATE INDEX IF NOT EXISTS idx_tender_documents_type ON tender_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_tender_documents_status ON tender_documents(upload_status);

CREATE INDEX IF NOT EXISTS idx_tender_metadata_workflow_id ON tender_metadata(tender_workflow_id);
CREATE INDEX IF NOT EXISTS idx_tender_metadata_deadline ON tender_metadata(submission_deadline);

CREATE INDEX IF NOT EXISTS idx_bid_strategies_workflow_id ON bid_strategies(tender_workflow_id);

CREATE INDEX IF NOT EXISTS idx_tender_questions_workflow_id ON tender_questions(tender_workflow_id);
CREATE INDEX IF NOT EXISTS idx_tender_questions_assigned_to ON tender_questions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tender_questions_status ON tender_questions(status);

CREATE INDEX IF NOT EXISTS idx_tender_analytics_workflow_id ON tender_analytics(tender_workflow_id);
CREATE INDEX IF NOT EXISTS idx_tender_analytics_outcome ON tender_analytics(outcome);

-- Enable Row Level Security
ALTER TABLE tender_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- tender_workflows policies
CREATE POLICY "Users can view tender workflows from their organization"
  ON tender_workflows FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create tender workflows in their organization"
  ON tender_workflows FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND owner_id = auth.uid());

CREATE POLICY "Users can update tender workflows they own or are admins/managers"
  ON tender_workflows FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND 
    (owner_id = auth.uid() OR is_user_manager_or_admin())
  );

CREATE POLICY "Admins can delete tender workflows"
  ON tender_workflows FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_user_admin());

-- tender_documents policies
CREATE POLICY "Users can view tender documents from workflows in their organization"
  ON tender_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tender_workflows tw 
      WHERE tw.id = tender_documents.tender_workflow_id 
      AND tw.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can create tender documents for workflows they can access"
  ON tender_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tender_workflows tw 
      WHERE tw.id = tender_documents.tender_workflow_id 
      AND tw.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update tender documents for workflows they can access"
  ON tender_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tender_workflows tw 
      WHERE tw.id = tender_documents.tender_workflow_id 
      AND tw.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete tender documents for workflows they can access"
  ON tender_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tender_workflows tw 
      WHERE tw.id = tender_documents.tender_workflow_id 
      AND tw.organization_id = get_user_organization_id()
    )
  );

-- Apply similar patterns for other tables
CREATE POLICY "tender_metadata_org_access" ON tender_metadata FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tender_workflows tw 
      WHERE tw.id = tender_metadata.tender_workflow_id 
      AND tw.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "bid_strategies_org_access" ON bid_strategies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tender_workflows tw 
      WHERE tw.id = bid_strategies.tender_workflow_id 
      AND tw.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "tender_questions_org_access" ON tender_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tender_workflows tw 
      WHERE tw.id = tender_questions.tender_workflow_id 
      AND tw.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "tender_analytics_org_access" ON tender_analytics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tender_workflows tw 
      WHERE tw.id = tender_analytics.tender_workflow_id 
      AND tw.organization_id = get_user_organization_id()
    )
  );

-- Add trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_tender_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER tender_workflows_updated_at
  BEFORE UPDATE ON tender_workflows
  FOR EACH ROW EXECUTE FUNCTION update_tender_updated_at();

CREATE TRIGGER tender_documents_updated_at
  BEFORE UPDATE ON tender_documents
  FOR EACH ROW EXECUTE FUNCTION update_tender_updated_at();

CREATE TRIGGER tender_metadata_updated_at
  BEFORE UPDATE ON tender_metadata
  FOR EACH ROW EXECUTE FUNCTION update_tender_updated_at();

CREATE TRIGGER bid_strategies_updated_at
  BEFORE UPDATE ON bid_strategies
  FOR EACH ROW EXECUTE FUNCTION update_tender_updated_at();

CREATE TRIGGER tender_questions_updated_at
  BEFORE UPDATE ON tender_questions
  FOR EACH ROW EXECUTE FUNCTION update_tender_updated_at();

CREATE TRIGGER tender_analytics_updated_at
  BEFORE UPDATE ON tender_analytics
  FOR EACH ROW EXECUTE FUNCTION update_tender_updated_at(); 