-- AnswerBank System Database Schema
-- Migration: Create answer bank tables with proper structure, indexes, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create answer_bank_categories table for standardized categorization
CREATE TABLE answer_bank_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI representation
  icon VARCHAR(50), -- Icon name for UI representation
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create answer_bank table
CREATE TABLE answer_bank (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category_id uuid REFERENCES answer_bank_categories(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  popularity_score DECIMAL(5,2) DEFAULT 0.0,
  tags TEXT[], -- Array of tags for flexible categorization
  word_count INTEGER DEFAULT 0,
  is_template BOOLEAN DEFAULT false, -- Indicates if this is a reusable template
  is_public BOOLEAN DEFAULT false, -- Indicates if this can be shared across organizations
  version INTEGER DEFAULT 1,
  parent_id uuid REFERENCES answer_bank(id) ON DELETE SET NULL, -- For versioning
  metadata JSONB DEFAULT '{}', -- Flexible metadata storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT answer_bank_title_length CHECK (LENGTH(title) >= 3),
  CONSTRAINT answer_bank_content_length CHECK (LENGTH(content) >= 10),
  CONSTRAINT answer_bank_popularity_range CHECK (popularity_score >= 0.0 AND popularity_score <= 10.0),
  CONSTRAINT answer_bank_usage_count_positive CHECK (usage_count >= 0),
  CONSTRAINT answer_bank_word_count_positive CHECK (word_count >= 0)
);

-- Create answer_bank_usage_tracking table for analytics
CREATE TABLE answer_bank_usage_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  answer_id uuid NOT NULL REFERENCES answer_bank(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  context VARCHAR(100), -- Context where the answer was used (e.g., 'draft_builder', 'brainstorm')
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id uuid, -- Optional session tracking
  metadata JSONB DEFAULT '{}' -- Additional tracking data
);

-- Create answer_bank_ratings table for user feedback
CREATE TABLE answer_bank_ratings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  answer_id uuid NOT NULL REFERENCES answer_bank(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate ratings from same user
  UNIQUE(answer_id, user_id)
);

-- Create indexes for performance optimization
-- AnswerBank main table indexes
CREATE INDEX idx_answer_bank_organization_id ON answer_bank(organization_id);
CREATE INDEX idx_answer_bank_category_id ON answer_bank(category_id);
CREATE INDEX idx_answer_bank_created_by ON answer_bank(created_by);
CREATE INDEX idx_answer_bank_created_at ON answer_bank(created_at DESC);
CREATE INDEX idx_answer_bank_updated_at ON answer_bank(updated_at DESC);
CREATE INDEX idx_answer_bank_popularity_score ON answer_bank(popularity_score DESC);
CREATE INDEX idx_answer_bank_usage_count ON answer_bank(usage_count DESC);
CREATE INDEX idx_answer_bank_is_template ON answer_bank(is_template) WHERE is_template = true;
CREATE INDEX idx_answer_bank_is_public ON answer_bank(is_public) WHERE is_public = true;
CREATE INDEX idx_answer_bank_parent_id ON answer_bank(parent_id) WHERE parent_id IS NOT NULL;

-- Full-text search indexes for title and content
CREATE INDEX idx_answer_bank_title_fts ON answer_bank USING GIN (to_tsvector('english', title));
CREATE INDEX idx_answer_bank_content_fts ON answer_bank USING GIN (to_tsvector('english', content));
CREATE INDEX idx_answer_bank_combined_fts ON answer_bank USING GIN (to_tsvector('english', title || ' ' || content));

-- Tags array index for tag-based searches
CREATE INDEX idx_answer_bank_tags ON answer_bank USING GIN (tags);

-- Category table indexes
CREATE INDEX idx_answer_bank_categories_name ON answer_bank_categories(name);
CREATE INDEX idx_answer_bank_categories_sort_order ON answer_bank_categories(sort_order);
CREATE INDEX idx_answer_bank_categories_active ON answer_bank_categories(is_active) WHERE is_active = true;

-- Usage tracking indexes
CREATE INDEX idx_answer_bank_usage_answer_id ON answer_bank_usage_tracking(answer_id);
CREATE INDEX idx_answer_bank_usage_user_id ON answer_bank_usage_tracking(user_id);
CREATE INDEX idx_answer_bank_usage_organization_id ON answer_bank_usage_tracking(organization_id);
CREATE INDEX idx_answer_bank_usage_used_at ON answer_bank_usage_tracking(used_at DESC);
CREATE INDEX idx_answer_bank_usage_context ON answer_bank_usage_tracking(context);

-- Ratings indexes
CREATE INDEX idx_answer_bank_ratings_answer_id ON answer_bank_ratings(answer_id);
CREATE INDEX idx_answer_bank_ratings_user_id ON answer_bank_ratings(user_id);
CREATE INDEX idx_answer_bank_ratings_rating ON answer_bank_ratings(rating);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_answer_bank_categories_updated_at 
  BEFORE UPDATE ON answer_bank_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answer_bank_updated_at 
  BEFORE UPDATE ON answer_bank 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answer_bank_ratings_updated_at 
  BEFORE UPDATE ON answer_bank_ratings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate word count
CREATE OR REPLACE FUNCTION calculate_word_count(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Remove HTML tags and calculate word count
  RETURN array_length(
    string_to_array(
      trim(regexp_replace(content_text, '<[^>]*>', ' ', 'g')), 
      ' '
    ), 
    1
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate word count
CREATE OR REPLACE FUNCTION update_answer_bank_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count = calculate_word_count(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_answer_bank_word_count
  BEFORE INSERT OR UPDATE OF content ON answer_bank
  FOR EACH ROW EXECUTE FUNCTION update_answer_bank_word_count();

-- Row Level Security (RLS) Policies
ALTER TABLE answer_bank_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_bank_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_bank_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for answer_bank_categories (read-only for all authenticated users)
CREATE POLICY "answer_bank_categories_select" ON answer_bank_categories
  FOR SELECT TO authenticated
  USING (is_active = true);

-- RLS Policies for answer_bank
-- Users can only access answers from their organization or public answers
CREATE POLICY "answer_bank_select" ON answer_bank
  FOR SELECT TO authenticated
  USING (
    organization_id = auth.jwt() ->> 'organization_id'::text
    OR is_public = true
  );

-- Users can only insert answers for their organization
CREATE POLICY "answer_bank_insert" ON answer_bank
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = auth.jwt() ->> 'organization_id'::text
    AND created_by = auth.uid()
  );

-- Users can only update answers they created within their organization
CREATE POLICY "answer_bank_update" ON answer_bank
  FOR UPDATE TO authenticated
  USING (
    organization_id = auth.jwt() ->> 'organization_id'::text
    AND created_by = auth.uid()
  )
  WITH CHECK (
    organization_id = auth.jwt() ->> 'organization_id'::text
    AND updated_by = auth.uid()
  );

-- Users can only delete answers they created within their organization
CREATE POLICY "answer_bank_delete" ON answer_bank
  FOR DELETE TO authenticated
  USING (
    organization_id = auth.jwt() ->> 'organization_id'::text
    AND created_by = auth.uid()
  );

-- RLS Policies for usage tracking
CREATE POLICY "answer_bank_usage_tracking_select" ON answer_bank_usage_tracking
  FOR SELECT TO authenticated
  USING (organization_id = auth.jwt() ->> 'organization_id'::text);

CREATE POLICY "answer_bank_usage_tracking_insert" ON answer_bank_usage_tracking
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = auth.jwt() ->> 'organization_id'::text
    AND user_id = auth.uid()
  );

-- RLS Policies for ratings
CREATE POLICY "answer_bank_ratings_select" ON answer_bank_ratings
  FOR SELECT TO authenticated
  USING (true); -- Users can read all ratings for answers they can access

CREATE POLICY "answer_bank_ratings_insert" ON answer_bank_ratings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "answer_bank_ratings_update" ON answer_bank_ratings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "answer_bank_ratings_delete" ON answer_bank_ratings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Insert default categories
INSERT INTO answer_bank_categories (name, description, color, icon, sort_order) VALUES
  ('Executive Summary', 'High-level overview and key points for executive summaries', '#3B82F6', 'FileText', 1),
  ('Service Delivery', 'Content related to service delivery approaches and methodologies', '#10B981', 'Users', 2),
  ('Technical Approach', 'Technical solutions, methodologies, and implementation details', '#8B5CF6', 'Settings', 3),
  ('Quality Assurance', 'Quality control, standards, and assurance procedures', '#F59E0B', 'Shield', 4),
  ('Risk Management', 'Risk assessment, mitigation strategies, and contingency plans', '#EF4444', 'AlertTriangle', 5),
  ('Compliance & Regulatory', 'Regulatory compliance, standards, and legal requirements', '#6B7280', 'CheckSquare', 6),
  ('Pricing & Commercial', 'Pricing models, commercial terms, and value propositions', '#059669', 'DollarSign', 7),
  ('Team & Resources', 'Team structure, qualifications, and resource allocation', '#DC2626', 'Users', 8),
  ('Project Management', 'Project planning, timelines, and management approaches', '#7C3AED', 'Calendar', 9),
  ('Innovation & Technology', 'Innovative solutions, technology adoption, and digital transformation', '#0891B2', 'Lightbulb', 10);

-- Create functions for answer bank operations
-- Function to update popularity score based on usage and ratings
CREATE OR REPLACE FUNCTION update_answer_popularity_score(answer_id_param uuid)
RETURNS void AS $$
DECLARE
  usage_weight DECIMAL := 0.3;
  rating_weight DECIMAL := 0.7;
  max_usage INTEGER;
  avg_rating DECIMAL;
  normalized_usage DECIMAL;
  new_score DECIMAL;
BEGIN
  -- Get maximum usage count for normalization
  SELECT COALESCE(MAX(usage_count), 1) INTO max_usage FROM answer_bank;
  
  -- Get average rating for this answer
  SELECT COALESCE(AVG(rating::DECIMAL), 0) INTO avg_rating 
  FROM answer_bank_ratings WHERE answer_id = answer_id_param;
  
  -- Get normalized usage (0-1 scale)
  SELECT COALESCE(usage_count::DECIMAL / max_usage, 0) INTO normalized_usage 
  FROM answer_bank WHERE id = answer_id_param;
  
  -- Calculate weighted popularity score (0-10 scale)
  new_score := (normalized_usage * usage_weight + (avg_rating / 5.0) * rating_weight) * 10.0;
  
  -- Update the answer
  UPDATE answer_bank 
  SET popularity_score = new_score 
  WHERE id = answer_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_answer_usage(
  answer_id_param uuid,
  user_id_param uuid,
  context_param VARCHAR(100) DEFAULT 'general',
  session_id_param uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Get user's organization ID
  SELECT auth.jwt() ->> 'organization_id'::text INTO org_id;
  
  -- Insert usage tracking record
  INSERT INTO answer_bank_usage_tracking (
    answer_id, 
    user_id, 
    organization_id, 
    context, 
    session_id
  ) VALUES (
    answer_id_param,
    user_id_param,
    org_id,
    context_param,
    session_id_param
  );
  
  -- Increment usage count
  UPDATE answer_bank 
  SET usage_count = usage_count + 1 
  WHERE id = answer_id_param;
  
  -- Update popularity score
  PERFORM update_answer_popularity_score(answer_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for answer bank with aggregated data
CREATE VIEW answer_bank_with_stats AS
SELECT 
  ab.*,
  abc.name as category_name,
  abc.color as category_color,
  abc.icon as category_icon,
  COALESCE(avg_ratings.avg_rating, 0) as avg_rating,
  COALESCE(avg_ratings.rating_count, 0) as rating_count,
  creator.email as created_by_email,
  creator_profile.first_name as created_by_first_name,
  creator_profile.last_name as created_by_last_name,
  updater.email as updated_by_email
FROM answer_bank ab
LEFT JOIN answer_bank_categories abc ON ab.category_id = abc.id
LEFT JOIN (
  SELECT 
    answer_id,
    AVG(rating::DECIMAL) as avg_rating,
    COUNT(*) as rating_count
  FROM answer_bank_ratings
  GROUP BY answer_id
) avg_ratings ON ab.id = avg_ratings.answer_id
LEFT JOIN auth.users creator ON ab.created_by = creator.id
LEFT JOIN user_profiles creator_profile ON ab.created_by = creator_profile.user_id
LEFT JOIN auth.users updater ON ab.updated_by = updater.id;

-- Grant necessary permissions
GRANT SELECT ON answer_bank_categories TO authenticated;
GRANT ALL ON answer_bank TO authenticated;
GRANT ALL ON answer_bank_usage_tracking TO authenticated;
GRANT ALL ON answer_bank_ratings TO authenticated;
GRANT SELECT ON answer_bank_with_stats TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_answer_usage TO authenticated;
GRANT EXECUTE ON FUNCTION update_answer_popularity_score TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_word_count TO authenticated; 