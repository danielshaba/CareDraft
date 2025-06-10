-- =====================================================
-- Fact Checks System for Draft Builder
-- =====================================================
-- This migration creates the table structure for storing
-- fact-check results, source attributions, and confidence scores
-- for the Draft Builder fact-checking system.

-- Create fact_checks table
CREATE TABLE IF NOT EXISTS fact_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content and source information
    text_content TEXT NOT NULL,
    text_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for deduplication
    source_text TEXT, -- Original source text for context
    
    -- AI source configuration
    ai_source VARCHAR(20) NOT NULL CHECK (ai_source IN ('library', 'creative', 'internet')),
    
    -- Verification results
    is_verified BOOLEAN NOT NULL DEFAULT false,
    confidence_score VARCHAR(10) NOT NULL CHECK (confidence_score IN ('high', 'medium', 'low')),
    confidence_percentage INTEGER CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
    
    -- Sources and citations
    sources JSONB DEFAULT '[]'::jsonb, -- Array of source objects
    citations TEXT, -- Formatted citation text
    citation_style VARCHAR(20) DEFAULT 'apa' CHECK (citation_style IN ('apa', 'mla', 'chicago')),
    
    -- Word limit settings
    word_limit INTEGER DEFAULT 100 CHECK (word_limit IN (50, 100, 200)),
    expanded_content TEXT, -- Content with expanded word limit
    
    -- Metadata
    verification_details JSONB DEFAULT '{}'::jsonb, -- Additional verification info
    model_used VARCHAR(100), -- AI model used for verification
    processing_time_ms INTEGER, -- Time taken for verification
    
    -- Caching and expiry
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    cache_key VARCHAR(255), -- For efficient lookups
    
    -- User and session tracking
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID, -- For anonymous sessions
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    UNIQUE(text_hash, ai_source, word_limit)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_fact_checks_text_hash ON fact_checks(text_hash);
CREATE INDEX IF NOT EXISTS idx_fact_checks_cache_key ON fact_checks(cache_key);
CREATE INDEX IF NOT EXISTS idx_fact_checks_user_id ON fact_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_fact_checks_expires_at ON fact_checks(expires_at);
CREATE INDEX IF NOT EXISTS idx_fact_checks_ai_source ON fact_checks(ai_source);
CREATE INDEX IF NOT EXISTS idx_fact_checks_confidence ON fact_checks(confidence_score);
CREATE INDEX IF NOT EXISTS idx_fact_checks_created_at ON fact_checks(created_at DESC);

-- Create fact_check_sources table for detailed source information
CREATE TABLE IF NOT EXISTS fact_check_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fact_check_id UUID NOT NULL REFERENCES fact_checks(id) ON DELETE CASCADE,
    
    -- Source details
    title TEXT NOT NULL,
    url TEXT,
    author TEXT,
    publication_date DATE,
    publisher TEXT,
    description TEXT,
    
    -- Source quality metrics
    reliability_score INTEGER CHECK (reliability_score >= 0 AND reliability_score <= 100),
    source_type VARCHAR(20) CHECK (source_type IN ('academic', 'government', 'news', 'organization', 'other')),
    
    -- Content excerpts
    relevant_excerpt TEXT, -- Specific text that supports the fact
    context_excerpt TEXT, -- Surrounding context
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fact_check_sources
CREATE INDEX IF NOT EXISTS idx_fact_check_sources_fact_check_id ON fact_check_sources(fact_check_id);
CREATE INDEX IF NOT EXISTS idx_fact_check_sources_source_type ON fact_check_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_fact_check_sources_reliability ON fact_check_sources(reliability_score DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_fact_checks_updated_at 
    BEFORE UPDATE ON fact_checks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fact_check_sources_updated_at 
    BEFORE UPDATE ON fact_check_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired fact checks
CREATE OR REPLACE FUNCTION cleanup_expired_fact_checks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM fact_checks WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies
ALTER TABLE fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_check_sources ENABLE ROW LEVEL SECURITY;

-- Policy for fact_checks: users can only access their own fact checks or public ones
CREATE POLICY "Users can view their own fact checks" ON fact_checks
    FOR SELECT USING (
        auth.uid() = user_id 
        OR user_id IS NULL -- Allow access to public/anonymous fact checks
    );

CREATE POLICY "Users can insert their own fact checks" ON fact_checks
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR (auth.uid() IS NULL AND user_id IS NULL) -- Allow anonymous inserts
    );

CREATE POLICY "Users can update their own fact checks" ON fact_checks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fact checks" ON fact_checks
    FOR DELETE USING (auth.uid() = user_id);

-- Policy for fact_check_sources: inherit access from parent fact_check
CREATE POLICY "Users can view sources for accessible fact checks" ON fact_check_sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM fact_checks 
            WHERE fact_checks.id = fact_check_sources.fact_check_id
            AND (fact_checks.user_id = auth.uid() OR fact_checks.user_id IS NULL)
        )
    );

CREATE POLICY "Users can insert sources for their fact checks" ON fact_check_sources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM fact_checks 
            WHERE fact_checks.id = fact_check_sources.fact_check_id
            AND (fact_checks.user_id = auth.uid() OR fact_checks.user_id IS NULL)
        )
    );

CREATE POLICY "Users can update sources for their fact checks" ON fact_check_sources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM fact_checks 
            WHERE fact_checks.id = fact_check_sources.fact_check_id
            AND fact_checks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sources for their fact checks" ON fact_check_sources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM fact_checks 
            WHERE fact_checks.id = fact_check_sources.fact_check_id
            AND fact_checks.user_id = auth.uid()
        )
    );

-- Create view for fact checks with source counts
CREATE OR REPLACE VIEW fact_checks_with_sources AS
SELECT 
    fc.*,
    COUNT(fcs.id) as source_count,
    AVG(fcs.reliability_score) as avg_reliability_score
FROM fact_checks fc
LEFT JOIN fact_check_sources fcs ON fc.id = fcs.fact_check_id
GROUP BY fc.id;

-- Grant permissions
GRANT ALL ON fact_checks TO authenticated;
GRANT ALL ON fact_check_sources TO authenticated;
GRANT SELECT ON fact_checks_with_sources TO authenticated;

-- Grant permissions for anonymous users (limited)
GRANT SELECT, INSERT ON fact_checks TO anon;
GRANT SELECT, INSERT ON fact_check_sources TO anon;
GRANT SELECT ON fact_checks_with_sources TO anon;

-- Add helpful comments
COMMENT ON TABLE fact_checks IS 'Stores fact-check results with AI source attribution and confidence scoring';
COMMENT ON TABLE fact_check_sources IS 'Detailed source information for fact-check verification';
COMMENT ON COLUMN fact_checks.text_hash IS 'SHA-256 hash of text_content for efficient deduplication';
COMMENT ON COLUMN fact_checks.ai_source IS 'AI source used: library, creative, or internet';
COMMENT ON COLUMN fact_checks.confidence_score IS 'Confidence level: high, medium, or low';
COMMENT ON COLUMN fact_checks.sources IS 'JSON array of source objects for quick access';
COMMENT ON COLUMN fact_checks.expires_at IS 'Cache expiry time, defaults to 7 days';
COMMENT ON FUNCTION cleanup_expired_fact_checks() IS 'Removes expired fact-check entries to maintain cache size'; 