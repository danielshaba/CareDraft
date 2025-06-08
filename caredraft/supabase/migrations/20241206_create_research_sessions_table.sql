-- Create ResearchSessions table for session-based research tracking
CREATE TABLE IF NOT EXISTS research_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    query TEXT NOT NULL,
    results JSONB DEFAULT '[]'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shared_with JSONB DEFAULT '[]'::jsonb,
    session_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT research_sessions_title_length CHECK (length(title) > 0 AND length(title) <= 200),
    CONSTRAINT research_sessions_query_length CHECK (length(query) > 0 AND length(query) <= 2000),
    CONSTRAINT research_sessions_shared_with_is_array CHECK (jsonb_typeof(shared_with) = 'array'),
    CONSTRAINT research_sessions_session_metadata_is_object CHECK (jsonb_typeof(session_metadata) = 'object'),
    CONSTRAINT research_sessions_results_is_array CHECK (jsonb_typeof(results) = 'array')
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_by ON research_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_research_sessions_organization_id ON research_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON research_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_sessions_updated_at ON research_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_sessions_title ON research_sessions USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_research_sessions_query ON research_sessions USING gin(to_tsvector('english', query));
CREATE INDEX IF NOT EXISTS idx_research_sessions_shared_with ON research_sessions USING gin(shared_with);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_research_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER trigger_research_sessions_updated_at
    BEFORE UPDATE ON research_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_research_sessions_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions and sessions shared with them
CREATE POLICY "Users can view own and shared research sessions" ON research_sessions
    FOR SELECT USING (
        created_by = auth.uid() 
        OR shared_with ? auth.uid()::text
        OR organization_id IN (
            SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can create research sessions
CREATE POLICY "Users can create research sessions" ON research_sessions
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND organization_id IN (
            SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own research sessions
CREATE POLICY "Users can update own research sessions" ON research_sessions
    FOR UPDATE USING (
        created_by = auth.uid()
    ) WITH CHECK (
        created_by = auth.uid()
    );

-- Policy: Users can delete their own research sessions
CREATE POLICY "Users can delete own research sessions" ON research_sessions
    FOR DELETE USING (
        created_by = auth.uid()
    );

-- Create helper functions for research session management

-- Function to get user's research sessions with pagination
CREATE OR REPLACE FUNCTION get_user_research_sessions(
    user_id UUID,
    page_size INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0,
    search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    query TEXT,
    results JSONB,
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    shared_with JSONB,
    session_metadata JSONB,
    is_shared BOOLEAN,
    result_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.id,
        rs.title,
        rs.query,
        rs.results,
        rs.created_by,
        rs.organization_id,
        rs.created_at,
        rs.updated_at,
        rs.shared_with,
        rs.session_metadata,
        (rs.created_by != user_id) as is_shared,
        jsonb_array_length(rs.results) as result_count
    FROM research_sessions rs
    WHERE (
        rs.created_by = user_id 
        OR rs.shared_with ? user_id::text
        OR rs.organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.user_id = user_id
        )
    )
    AND (
        search_query IS NULL 
        OR rs.title ILIKE '%' || search_query || '%'
        OR rs.query ILIKE '%' || search_query || '%'
    )
    ORDER BY rs.updated_at DESC
    LIMIT page_size
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to share research session with users
CREATE OR REPLACE FUNCTION share_research_session(
    session_id UUID,
    user_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    current_shared JSONB;
BEGIN
    -- Get current shared_with array
    SELECT shared_with INTO current_shared
    FROM research_sessions
    WHERE id = session_id AND created_by = auth.uid();
    
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "Session not found or access denied"}'::jsonb;
    END IF;
    
    -- Add new user IDs to shared_with array
    UPDATE research_sessions
    SET shared_with = (
        SELECT jsonb_agg(DISTINCT elem)
        FROM (
            SELECT jsonb_array_elements_text(current_shared) as elem
            UNION
            SELECT unnest(user_ids)::text as elem
        ) combined
    )
    WHERE id = session_id;
    
    RETURN '{"success": true, "message": "Session shared successfully"}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get research session statistics
CREATE OR REPLACE FUNCTION get_research_session_stats(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_sessions', COUNT(*),
        'own_sessions', COUNT(*) FILTER (WHERE created_by = user_id),
        'shared_sessions', COUNT(*) FILTER (WHERE created_by != user_id),
        'total_results', COALESCE(SUM(jsonb_array_length(results)), 0),
        'avg_results_per_session', COALESCE(AVG(jsonb_array_length(results)), 0),
        'recent_sessions_30d', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
    ) INTO stats
    FROM research_sessions
    WHERE (
        created_by = user_id 
        OR shared_with ? user_id::text
        OR organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.user_id = get_research_session_stats.user_id
        )
    );
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON research_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_research_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION share_research_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_research_session_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_research_sessions_updated_at TO authenticated; 