-- ================================================
-- PROPOSAL STATUS WORKFLOW SYSTEM MIGRATION
-- ================================================
-- Creates comprehensive status workflow system for proposals with:
-- 1. Status history tracking and audit trail
-- 2. Role-based workflow permissions
-- 3. Status transition comments and reasons
-- 4. Automatic deadline-based status updates
-- 5. Performance optimization indexes

-- ================================================
-- 1. PROPOSAL STATUS HISTORY TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS proposal_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    from_status proposal_status NULL, -- NULL for initial status
    to_status proposal_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    comment TEXT NULL,
    transition_reason TEXT NULL,
    metadata JSONB DEFAULT '{}' NOT NULL,
    automatic BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ================================================
-- 2. PROPOSAL WORKFLOW PERMISSIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS proposal_workflow_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_status proposal_status NULL, -- NULL means any status
    to_status proposal_status NOT NULL,
    required_role user_role NOT NULL,
    conditions JSONB DEFAULT '{}' NOT NULL, -- Additional conditions like ownership, deadline proximity
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ================================================
-- 3. PROPOSAL WORKFLOW SETTINGS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS proposal_workflow_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    auto_archive_after_days INTEGER DEFAULT 365,
    auto_review_reminder_days INTEGER DEFAULT 7,
    auto_submit_reminder_days INTEGER DEFAULT 3,
    require_comments_on_rejection BOOLEAN DEFAULT TRUE NOT NULL,
    require_comments_on_approval BOOLEAN DEFAULT FALSE NOT NULL,
    allow_self_approval BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id)
);

-- ================================================
-- 4. PROPOSAL REVIEWER ASSIGNMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS proposal_reviewer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    decision proposal_status NULL CHECK (decision IN ('submitted', 'review')), -- 'submitted' = approved, 'review' = rejected
    review_comments TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(proposal_id, reviewer_id)
);

-- ================================================
-- 5. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ================================================

-- Proposal Status History Indexes
CREATE INDEX IF NOT EXISTS idx_proposal_status_history_proposal_id 
    ON proposal_status_history(proposal_id);
    
CREATE INDEX IF NOT EXISTS idx_proposal_status_history_changed_at 
    ON proposal_status_history(changed_at DESC);
    
CREATE INDEX IF NOT EXISTS idx_proposal_status_history_to_status 
    ON proposal_status_history(to_status);
    
CREATE INDEX IF NOT EXISTS idx_proposal_status_history_changed_by 
    ON proposal_status_history(changed_by);

-- Proposal Workflow Permissions Indexes
CREATE INDEX IF NOT EXISTS idx_proposal_workflow_permissions_transition 
    ON proposal_workflow_permissions(from_status, to_status);
    
CREATE INDEX IF NOT EXISTS idx_proposal_workflow_permissions_role 
    ON proposal_workflow_permissions(required_role);

-- Proposal Reviewer Assignments Indexes
CREATE INDEX IF NOT EXISTS idx_proposal_reviewer_assignments_proposal_id 
    ON proposal_reviewer_assignments(proposal_id);
    
CREATE INDEX IF NOT EXISTS idx_proposal_reviewer_assignments_reviewer_id 
    ON proposal_reviewer_assignments(reviewer_id);
    
CREATE INDEX IF NOT EXISTS idx_proposal_reviewer_assignments_completed 
    ON proposal_reviewer_assignments(completed_at) 
    WHERE completed_at IS NULL;

-- ================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE proposal_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_workflow_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_workflow_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_reviewer_assignments ENABLE ROW LEVEL SECURITY;

-- Proposal Status History Policies
CREATE POLICY "Users can view status history for proposals in their organization" 
    ON proposal_status_history FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM proposals p 
            JOIN users u ON u.id = auth.uid() 
            WHERE p.id = proposal_status_history.proposal_id 
            AND p.owner_id = u.organization_id OR u.organization_id = (
                SELECT organization_id FROM users WHERE id = p.owner_id
            )
        )
    );

CREATE POLICY "Users can insert status history for proposals they can modify" 
    ON proposal_status_history FOR INSERT 
    WITH CHECK (
        changed_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM proposals p 
            JOIN users u ON u.id = auth.uid() 
            WHERE p.id = proposal_status_history.proposal_id 
            AND (p.owner_id = auth.uid() OR u.role IN ('admin', 'manager'))
        )
    );

-- Proposal Workflow Permissions Policies (Admin only)
CREATE POLICY "Only admins can manage workflow permissions" 
    ON proposal_workflow_permissions FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Proposal Workflow Settings Policies
CREATE POLICY "Users can view workflow settings for their organization" 
    ON proposal_workflow_settings FOR SELECT 
    USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Only admins can manage workflow settings" 
    ON proposal_workflow_settings FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update workflow settings" 
    ON proposal_workflow_settings FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Proposal Reviewer Assignments Policies
CREATE POLICY "Users can view reviewer assignments for proposals in their organization" 
    ON proposal_reviewer_assignments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM proposals p 
            JOIN users u ON u.id = auth.uid() 
            WHERE p.id = proposal_reviewer_assignments.proposal_id 
            AND p.owner_id = u.organization_id OR u.organization_id = (
                SELECT organization_id FROM users WHERE id = p.owner_id
            )
        )
    );

CREATE POLICY "Managers and admins can assign reviewers" 
    ON proposal_reviewer_assignments FOR INSERT 
    WITH CHECK (
        assigned_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Assigned reviewers can update their assignments" 
    ON proposal_reviewer_assignments FOR UPDATE 
    USING (
        reviewer_id = auth.uid() OR 
        (assigned_by = auth.uid() AND 
         EXISTS (
             SELECT 1 FROM users 
             WHERE id = auth.uid() AND role IN ('admin', 'manager')
         ))
    );

-- ================================================
-- 7. DATABASE FUNCTIONS FOR WORKFLOW LOGIC
-- ================================================

-- Function to log status changes automatically
CREATE OR REPLACE FUNCTION log_proposal_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO proposal_status_history (
            proposal_id,
            from_status,
            to_status,
            changed_by,
            changed_at,
            automatic
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(auth.uid(), NEW.owner_id), -- Use auth.uid() if available, else proposal owner
            NOW(),
            FALSE -- Manual change, automatic changes handled separately
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can transition proposal status
CREATE OR REPLACE FUNCTION can_user_transition_proposal_status(
    p_proposal_id UUID,
    p_from_status proposal_status,
    p_to_status proposal_status,
    p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role user_role;
    v_is_owner BOOLEAN;
    v_is_assigned_reviewer BOOLEAN;
    v_permission_exists BOOLEAN;
BEGIN
    -- Get user role and ownership status
    SELECT 
        u.role,
        (p.owner_id = p_user_id)
    INTO v_user_role, v_is_owner
    FROM users u
    JOIN proposals p ON p.id = p_proposal_id
    WHERE u.id = p_user_id;
    
    -- Check if user is assigned as reviewer
    SELECT EXISTS(
        SELECT 1 FROM proposal_reviewer_assignments 
        WHERE proposal_id = p_proposal_id 
        AND reviewer_id = p_user_id 
        AND completed_at IS NULL
    ) INTO v_is_assigned_reviewer;
    
    -- Check if transition is allowed based on permissions
    SELECT EXISTS(
        SELECT 1 FROM proposal_workflow_permissions 
        WHERE (from_status IS NULL OR from_status = p_from_status)
        AND to_status = p_to_status
        AND required_role = v_user_role
        AND enabled = TRUE
    ) INTO v_permission_exists;
    
    -- Business rules
    CASE 
        -- Authors can submit drafts for review
        WHEN p_from_status = 'draft' AND p_to_status = 'review' THEN
            RETURN v_is_owner AND v_user_role IN ('writer', 'manager', 'admin');
            
        -- Reviewers and managers can approve/reject
        WHEN p_from_status = 'review' AND p_to_status IN ('submitted', 'draft') THEN
            RETURN (v_is_assigned_reviewer OR v_user_role IN ('manager', 'admin')) 
                   AND v_user_role IN ('manager', 'admin');
                   
        -- Admins can do anything
        WHEN v_user_role = 'admin' THEN
            RETURN TRUE;
            
        -- Check explicit permissions
        ELSE
            RETURN v_permission_exists;
    END CASE;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get proposal status workflow history
CREATE OR REPLACE FUNCTION get_proposal_status_workflow(p_proposal_id UUID)
RETURNS TABLE (
    id UUID,
    from_status proposal_status,
    to_status proposal_status,
    changed_by_name TEXT,
    changed_by_email TEXT,
    changed_at TIMESTAMP WITH TIME ZONE,
    comment TEXT,
    transition_reason TEXT,
    automatic BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psh.id,
        psh.from_status,
        psh.to_status,
        u.full_name as changed_by_name,
        u.email as changed_by_email,
        psh.changed_at,
        psh.comment,
        psh.transition_reason,
        psh.automatic
    FROM proposal_status_history psh
    JOIN users u ON u.id = psh.changed_by
    WHERE psh.proposal_id = p_proposal_id
    ORDER BY psh.changed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically archive expired proposals
CREATE OR REPLACE FUNCTION auto_archive_expired_proposals()
RETURNS INTEGER AS $$
DECLARE
    v_archived_count INTEGER := 0;
    v_proposal_record RECORD;
BEGIN
    -- Archive proposals past deadline and in submitted status
    FOR v_proposal_record IN
        SELECT p.id, p.deadline, p.owner_id
        FROM proposals p
        JOIN proposal_workflow_settings pws ON pws.organization_id = (
            SELECT organization_id FROM users WHERE id = p.owner_id
        )
        WHERE p.status = 'submitted'
        AND p.deadline < NOW() - INTERVAL '1 day' * pws.auto_archive_after_days
    LOOP
        -- Update proposal status
        UPDATE proposals 
        SET status = 'archived'
        WHERE id = v_proposal_record.id;
        
        -- Log the automatic status change
        INSERT INTO proposal_status_history (
            proposal_id,
            from_status,
            to_status,
            changed_by,
            changed_at,
            comment,
            automatic
        ) VALUES (
            v_proposal_record.id,
            'submitted',
            'archived',
            v_proposal_record.owner_id,
            NOW(),
            'Automatically archived due to deadline expiry',
            TRUE
        );
        
        v_archived_count := v_archived_count + 1;
    END LOOP;
    
    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 8. TRIGGERS
-- ================================================

-- Trigger to automatically log status changes
CREATE TRIGGER trigger_log_proposal_status_change
    AFTER UPDATE OF status ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION log_proposal_status_change();

-- ================================================
-- 9. DEFAULT WORKFLOW PERMISSIONS
-- ================================================

-- Insert default workflow permissions
INSERT INTO proposal_workflow_permissions (from_status, to_status, required_role) VALUES
    -- Writers can create drafts and submit for review
    (NULL, 'draft', 'writer'),
    ('draft', 'review', 'writer'),
    
    -- Managers can review and approve/reject
    ('review', 'submitted', 'manager'),
    ('review', 'draft', 'manager'),
    ('submitted', 'archived', 'manager'),
    
    -- Admins can do everything
    (NULL, 'draft', 'admin'),
    ('draft', 'review', 'admin'),
    ('draft', 'submitted', 'admin'),
    ('draft', 'archived', 'admin'),
    ('review', 'draft', 'admin'),
    ('review', 'submitted', 'admin'),
    ('review', 'archived', 'admin'),
    ('submitted', 'draft', 'admin'),
    ('submitted', 'review', 'admin'),
    ('submitted', 'archived', 'admin')
ON CONFLICT DO NOTHING;

-- ================================================
-- 10. SAMPLE DATA FOR TESTING (OPTIONAL)
-- ================================================

-- Create default workflow settings for existing organizations
INSERT INTO proposal_workflow_settings (
    organization_id,
    auto_archive_after_days,
    auto_review_reminder_days,
    auto_submit_reminder_days
)
SELECT DISTINCT organization_id, 365, 7, 3
FROM users
WHERE organization_id IS NOT NULL
ON CONFLICT (organization_id) DO NOTHING;

-- ================================================
-- 11. COMMENTS AND DOCUMENTATION
-- ================================================

COMMENT ON TABLE proposal_status_history IS 'Audit trail for all proposal status changes with timestamps and user attribution';
COMMENT ON TABLE proposal_workflow_permissions IS 'Role-based permissions matrix for proposal status transitions';
COMMENT ON TABLE proposal_workflow_settings IS 'Organization-specific workflow configuration and automation rules';
COMMENT ON TABLE proposal_reviewer_assignments IS 'Assignment of specific reviewers to proposals with decision tracking';

COMMENT ON FUNCTION can_user_transition_proposal_status IS 'Validates if a user has permission to transition a proposal from one status to another';
COMMENT ON FUNCTION get_proposal_status_workflow IS 'Returns complete status history for a proposal with user details';
COMMENT ON FUNCTION auto_archive_expired_proposals IS 'Automatically archives proposals that have exceeded their deadline by configured days'; 