-- Create AI Operations tracking table for context menu actions
CREATE TABLE IF NOT EXISTS ai_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Operation details
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'fact_check', 'evidencing', 'editing', 'incorporate', 'we_will', 'translate',
    'tone_voice', 'replace_words', 'pure_completion', 'search'
  )),
  operation_subtype TEXT, -- e.g., 'library_ai', 'creative_ai', 'internet_ai' for fact_check
  
  -- Request/Response data
  request_data JSONB NOT NULL,
  response_data JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Performance metrics
  processing_time_ms INTEGER,
  ai_model_used TEXT,
  tokens_used INTEGER,
  api_cost_usd DECIMAL(10, 6),
  
  -- Context and metadata
  source_text_length INTEGER,
  target_language TEXT, -- for translations
  quality_score DECIMAL(3, 2), -- 0.00 to 100.00
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
  
  -- Draft builder integration
  draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
  section_id TEXT, -- which section of the draft was being edited
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_operations_user_id ON ai_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_operations_org_id ON ai_operations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_operations_type ON ai_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_operations_created_at ON ai_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_operations_draft_id ON ai_operations(draft_id);
CREATE INDEX IF NOT EXISTS idx_ai_operations_success ON ai_operations(success);

-- Create composite indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_operations_user_type_date ON ai_operations(user_id, operation_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_operations_org_type_date ON ai_operations(organization_id, operation_type, created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_operations_updated_at
  BEFORE UPDATE ON ai_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_operations_updated_at();

-- Create analytics view for reporting
CREATE OR REPLACE VIEW ai_operations_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as operation_date,
  operation_type,
  operation_subtype,
  organization_id,
  COUNT(*) as operation_count,
  COUNT(*) FILTER (WHERE success = true) as successful_operations,
  COUNT(*) FILTER (WHERE success = false) as failed_operations,
  AVG(processing_time_ms) as avg_processing_time_ms,
  SUM(tokens_used) as total_tokens_used,
  SUM(api_cost_usd) as total_cost_usd,
  AVG(quality_score) as avg_quality_score,
  COUNT(*) FILTER (WHERE user_feedback = 'positive') as positive_feedback_count,
  COUNT(*) FILTER (WHERE user_feedback = 'negative') as negative_feedback_count
FROM ai_operations
GROUP BY 
  DATE_TRUNC('day', created_at),
  operation_type,
  operation_subtype,
  organization_id;

-- Row Level Security (RLS)
ALTER TABLE ai_operations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own operations
CREATE POLICY "Users can view own AI operations" ON ai_operations
  FOR SELECT USING (
    auth.uid() = user_id 
  );

-- Policy: Users can insert their own operations
CREATE POLICY "Users can insert own AI operations" ON ai_operations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy: Organization admins can view all operations in their org
CREATE POLICY "Org admins can view org AI operations" ON ai_operations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.organization_id = ai_operations.organization_id
      AND uo.role IN ('admin', 'owner')
    )
  );

-- Add helpful comments
COMMENT ON TABLE ai_operations IS 'Tracks AI-powered context menu operations for analytics and usage monitoring';
COMMENT ON COLUMN ai_operations.operation_type IS 'Type of AI operation performed (fact_check, editing, etc.)';
COMMENT ON COLUMN ai_operations.operation_subtype IS 'Subtype of operation (library_ai, creative_ai, internet_ai, etc.)';
COMMENT ON COLUMN ai_operations.request_data IS 'Input data and parameters for the AI operation';
COMMENT ON COLUMN ai_operations.response_data IS 'AI response data and results';
COMMENT ON COLUMN ai_operations.quality_score IS 'Computed quality score from 0.00 to 100.00';
COMMENT ON COLUMN ai_operations.user_feedback IS 'Optional user feedback on operation quality';
COMMENT ON VIEW ai_operations_analytics IS 'Aggregated analytics view for AI operations reporting'; 