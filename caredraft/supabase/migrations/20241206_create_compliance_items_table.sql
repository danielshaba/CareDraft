-- ================================================
-- COMPLIANCE ITEMS TABLE MIGRATION
-- ================================================
-- Creates comprehensive compliance tracking system for proposals with:
-- 1. Auto-populated items from AI extraction results
-- 2. Manual addition of custom compliance items
-- 3. Completion status tracking with notes
-- 4. Source document linking and page references
-- 5. Integration with Extract module results

-- ================================================
-- 1. COMPLIANCE ITEMS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS compliance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    requirement TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('auto', 'manual')),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT NULL,
    source_document_id UUID NULL, -- References extracted_documents if available
    source_page INTEGER NULL,
    confidence_score DECIMAL(3,2) NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ================================================
-- 2. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ================================================

-- Primary indexes for common queries
CREATE INDEX IF NOT EXISTS idx_compliance_items_proposal_id 
    ON compliance_items(proposal_id);
    
CREATE INDEX IF NOT EXISTS idx_compliance_items_source_type 
    ON compliance_items(source_type);
    
CREATE INDEX IF NOT EXISTS idx_compliance_items_completed 
    ON compliance_items(completed);
    
CREATE INDEX IF NOT EXISTS idx_compliance_items_sort_order 
    ON compliance_items(proposal_id, sort_order);
    
CREATE INDEX IF NOT EXISTS idx_compliance_items_source_document 
    ON compliance_items(source_document_id) 
    WHERE source_document_id IS NOT NULL;

-- Composite index for common filtering
CREATE INDEX IF NOT EXISTS idx_compliance_items_proposal_type_order 
    ON compliance_items(proposal_id, source_type, sort_order);

-- ================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on the table
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;

-- Users can view compliance items for proposals in their organization
CREATE POLICY "Users can view compliance items for their organization proposals" 
    ON compliance_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM proposals p 
            JOIN users u ON u.id = auth.uid() 
            WHERE p.id = compliance_items.proposal_id 
            AND (
                p.owner_id = auth.uid() OR 
                u.organization_id = (
                    SELECT organization_id FROM users WHERE id = p.owner_id
                )
            )
        )
    );

-- Users can insert compliance items for proposals they can modify
CREATE POLICY "Users can insert compliance items for their proposals" 
    ON compliance_items FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM proposals p 
            JOIN users u ON u.id = auth.uid() 
            WHERE p.id = compliance_items.proposal_id 
            AND (
                p.owner_id = auth.uid() OR 
                u.role IN ('admin', 'manager')
            )
        )
    );

-- Users can update compliance items for proposals they can modify
CREATE POLICY "Users can update compliance items for their proposals" 
    ON compliance_items FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM proposals p 
            JOIN users u ON u.id = auth.uid() 
            WHERE p.id = compliance_items.proposal_id 
            AND (
                p.owner_id = auth.uid() OR 
                u.role IN ('admin', 'manager')
            )
        )
    );

-- Users can delete compliance items for proposals they can modify
CREATE POLICY "Users can delete compliance items for their proposals" 
    ON compliance_items FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM proposals p 
            JOIN users u ON u.id = auth.uid() 
            WHERE p.id = compliance_items.proposal_id 
            AND (
                p.owner_id = auth.uid() OR 
                u.role IN ('admin', 'manager')
            )
        )
    );

-- ================================================
-- 4. DATABASE FUNCTIONS FOR COMPLIANCE OPERATIONS
-- ================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_compliance_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at field
CREATE TRIGGER trigger_update_compliance_items_updated_at
    BEFORE UPDATE ON compliance_items
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_items_updated_at();

-- Function to get compliance completion statistics for a proposal
CREATE OR REPLACE FUNCTION get_compliance_statistics(p_proposal_id UUID)
RETURNS TABLE (
    total_items INTEGER,
    completed_items INTEGER,
    completion_percentage DECIMAL(5,2),
    auto_items INTEGER,
    manual_items INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_items,
        COUNT(CASE WHEN completed = TRUE THEN 1 END)::INTEGER as completed_items,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN completed = TRUE THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
            ELSE 0.0
        END as completion_percentage,
        COUNT(CASE WHEN source_type = 'auto' THEN 1 END)::INTEGER as auto_items,
        COUNT(CASE WHEN source_type = 'manual' THEN 1 END)::INTEGER as manual_items
    FROM compliance_items 
    WHERE proposal_id = p_proposal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder compliance items
CREATE OR REPLACE FUNCTION reorder_compliance_items(
    p_proposal_id UUID,
    p_item_ids UUID[],
    p_new_orders INTEGER[]
) RETURNS BOOLEAN AS $$
DECLARE
    i INTEGER;
BEGIN
    -- Validate input arrays have same length
    IF array_length(p_item_ids, 1) != array_length(p_new_orders, 1) THEN
        RETURN FALSE;
    END IF;
    
    -- Update sort orders
    FOR i IN 1..array_length(p_item_ids, 1) LOOP
        UPDATE compliance_items 
        SET sort_order = p_new_orders[i], updated_at = NOW()
        WHERE id = p_item_ids[i] AND proposal_id = p_proposal_id;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 5. COMMENTS AND DOCUMENTATION
-- ================================================

COMMENT ON TABLE compliance_items IS 'Stores compliance checklist items for proposals with auto-population from AI extraction and manual additions';
COMMENT ON COLUMN compliance_items.source_type IS 'Indicates if item was auto-populated from AI extraction or manually added';
COMMENT ON COLUMN compliance_items.confidence_score IS 'AI confidence score for auto-extracted items (0.0 to 1.0)';
COMMENT ON COLUMN compliance_items.source_document_id IS 'References the extracted document that generated this compliance item';
COMMENT ON COLUMN compliance_items.sort_order IS 'Order for displaying items in the UI, lower numbers appear first'; 