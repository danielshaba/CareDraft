-- Migration: Create Export System Tables
-- Description: Tables for document export functionality, storage tracking, and email delivery
-- Date: 2024-12-01

-- ====================
-- EXPORTED DOCUMENTS TABLE
-- ====================
-- Stores metadata for all exported documents
CREATE TABLE IF NOT EXISTS exported_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_title TEXT NOT NULL,
    export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'docx')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    download_count INTEGER DEFAULT 0,
    shareable_link TEXT,
    expires_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- DOCUMENT SHARES TABLE
-- ====================
-- Manages shared document links and access control
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES exported_documents(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    allow_download BOOLEAN DEFAULT TRUE,
    require_authentication BOOLEAN DEFAULT FALSE,
    custom_message TEXT,
    notify_on_access BOOLEAN DEFAULT FALSE,
    max_downloads INTEGER,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- DOCUMENT ACCESS LOGS TABLE
-- ====================
-- Audit trail for document access and operations
CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES exported_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('download', 'view', 'share', 'delete', 'create')),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- EMAIL DELIVERY LOG TABLE
-- ====================
-- Tracks email delivery for exported documents
CREATE TABLE IF NOT EXISTS email_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES exported_documents(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    email_provider TEXT,
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- INDEXES FOR PERFORMANCE
-- ====================

-- Exported documents indexes
CREATE INDEX IF NOT EXISTS idx_exported_documents_user_id ON exported_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_exported_documents_organization_id ON exported_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_exported_documents_proposal_id ON exported_documents(proposal_id);
CREATE INDEX IF NOT EXISTS idx_exported_documents_created_at ON exported_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exported_documents_format ON exported_documents(export_format);
CREATE INDEX IF NOT EXISTS idx_exported_documents_expires_at ON exported_documents(expires_at) WHERE expires_at IS NOT NULL;

-- Document shares indexes  
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by ON document_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_document_shares_expires_at ON document_shares(expires_at);

-- Document access logs indexes
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_accessed_at ON document_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_access_type ON document_access_logs(access_type);

-- Email delivery logs indexes
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_document_id ON email_delivery_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_sender_id ON email_delivery_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_recipient_email ON email_delivery_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_delivery_status ON email_delivery_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_created_at ON email_delivery_logs(created_at DESC);

-- ====================
-- ROW LEVEL SECURITY POLICIES
-- ====================

-- Enable RLS on all tables
ALTER TABLE exported_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Exported documents policies
CREATE POLICY "Users can view their own exported documents" ON exported_documents
    FOR SELECT USING (
        user_id = auth.uid() OR 
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create exported documents" ON exported_documents
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own exported documents" ON exported_documents
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own exported documents" ON exported_documents
    FOR DELETE USING (user_id = auth.uid());

-- Document shares policies
CREATE POLICY "Users can view shares for their documents" ON document_shares
    FOR SELECT USING (
        shared_by = auth.uid() OR
        document_id IN (
            SELECT id FROM exported_documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create shares for their documents" ON document_shares
    FOR INSERT WITH CHECK (
        shared_by = auth.uid() AND
        document_id IN (
            SELECT id FROM exported_documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update shares they created" ON document_shares
    FOR UPDATE USING (shared_by = auth.uid());

CREATE POLICY "Users can delete shares they created" ON document_shares
    FOR DELETE USING (shared_by = auth.uid());

-- Document access logs policies (read-only for users, full access for their documents)
CREATE POLICY "Users can view access logs for their documents" ON document_access_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        document_id IN (
            SELECT id FROM exported_documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert access logs" ON document_access_logs
    FOR INSERT WITH CHECK (true); -- Allow system to log all access

-- Email delivery logs policies
CREATE POLICY "Users can view email logs for their documents" ON email_delivery_logs
    FOR SELECT USING (
        sender_id = auth.uid() OR
        document_id IN (
            SELECT id FROM exported_documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create email logs for their documents" ON email_delivery_logs
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        document_id IN (
            SELECT id FROM exported_documents WHERE user_id = auth.uid()
        )
    );

-- ====================
-- HELPER FUNCTIONS
-- ====================

-- Function to clean up expired documents
CREATE OR REPLACE FUNCTION cleanup_expired_documents()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired documents
    WITH deleted AS (
        DELETE FROM exported_documents 
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    -- Delete expired shares
    DELETE FROM document_shares WHERE expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(doc_id UUID, share_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Increment document download count
    UPDATE exported_documents 
    SET download_count = download_count + 1,
        updated_at = NOW()
    WHERE id = doc_id;
    
    -- Increment share download count if share_id provided
    IF share_id IS NOT NULL THEN
        UPDATE document_shares 
        SET download_count = download_count + 1
        WHERE id = share_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get document analytics
CREATE OR REPLACE FUNCTION get_document_analytics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_documents', COUNT(*),
        'total_downloads', SUM(download_count),
        'documents_by_format', json_object_agg(export_format, format_count),
        'recent_activity', (
            SELECT json_agg(
                json_build_object(
                    'date', DATE(created_at),
                    'count', daily_count
                )
            )
            FROM (
                SELECT DATE(created_at) as created_at, COUNT(*) as daily_count
                FROM exported_documents 
                WHERE user_id = user_uuid 
                AND created_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) DESC
                LIMIT 30
            ) daily_stats
        )
    )
    INTO result
    FROM (
        SELECT 
            export_format,
            COUNT(*) as format_count
        FROM exported_documents 
        WHERE user_id = user_uuid
        GROUP BY export_format
    ) format_stats;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================
-- TRIGGERS
-- ====================

-- Update updated_at timestamp on exported_documents changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exported_documents_updated_at
    BEFORE UPDATE ON exported_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================
-- COMMENTS
-- ====================

COMMENT ON TABLE exported_documents IS 'Stores metadata for exported documents (PDF/DOCX)';
COMMENT ON TABLE document_shares IS 'Manages shared document links with expiration and access control';
COMMENT ON TABLE document_access_logs IS 'Audit trail for all document operations';
COMMENT ON TABLE email_delivery_logs IS 'Tracks email delivery status for exported documents';

COMMENT ON FUNCTION cleanup_expired_documents() IS 'Removes expired documents and shares, returns count of deleted documents';
COMMENT ON FUNCTION increment_download_count(UUID, UUID) IS 'Increments download counters for documents and shares';
COMMENT ON FUNCTION get_document_analytics(UUID) IS 'Returns analytics data for user documents in JSON format'; 