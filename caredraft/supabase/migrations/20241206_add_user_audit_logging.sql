-- Migration: Add user audit logging and deactivation tracking
-- Description: Implements comprehensive audit logging for all user management actions

-- Add deactivation tracking to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for active users query performance
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_users_deactivated_at ON public.users(deactivated_at) WHERE deactivated_at IS NOT NULL;

-- Create audit_logs table for comprehensive user management tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN (
        'user_created', 'user_updated', 'user_deactivated', 'user_reactivated',
        'role_changed', 'invitation_sent', 'invitation_accepted', 'invitation_cancelled',
        'organization_created', 'organization_updated', 'organization_deleted',
        'user_organization_added', 'user_organization_removed',
        'bulk_role_update', 'bulk_deactivation', 'data_export'
    )),
    
    -- Who performed the action
    actor_id UUID REFERENCES public.users(id),
    actor_email TEXT,
    actor_role TEXT,
    
    -- What was affected
    target_user_id UUID REFERENCES public.users(id),
    target_user_email TEXT,
    organization_id UUID,
    
    -- Action details
    previous_values JSONB,
    new_values JSONB,
    metadata JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Compliance
    retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 years')
);

-- Create indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON public.audit_logs(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Create cleanup configuration table
CREATE TABLE IF NOT EXISTS public.cleanup_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cleanup rules
    expired_invitations_days INTEGER DEFAULT 30,
    inactive_users_days INTEGER DEFAULT 365,
    audit_log_retention_days INTEGER DEFAULT 2555, -- 7 years
    
    -- Auto-cleanup settings
    auto_cleanup_enabled BOOLEAN DEFAULT false,
    last_cleanup_run TIMESTAMPTZ,
    cleanup_schedule TEXT DEFAULT 'daily', -- daily, weekly, monthly
    
    -- Notification settings
    notify_before_cleanup BOOLEAN DEFAULT true,
    notification_days_before INTEGER DEFAULT 7,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default cleanup configuration
INSERT INTO public.cleanup_config (id) 
VALUES (gen_random_uuid()) 
ON CONFLICT DO NOTHING;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action_type TEXT,
    p_actor_id UUID DEFAULT NULL,
    p_target_user_id UUID DEFAULT NULL,
    p_organization_id UUID DEFAULT NULL,
    p_previous_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_audit_id UUID;
    v_actor_email TEXT;
    v_actor_role TEXT;
    v_target_email TEXT;
BEGIN
    -- Get actor details
    IF p_actor_id IS NOT NULL THEN
        SELECT email, role INTO v_actor_email, v_actor_role
        FROM public.users 
        WHERE id = p_actor_id;
    END IF;
    
    -- Get target user email
    IF p_target_user_id IS NOT NULL THEN
        SELECT email INTO v_target_email
        FROM public.users 
        WHERE id = p_target_user_id;
    END IF;
    
    -- Insert audit log
    INSERT INTO public.audit_logs (
        action_type, actor_id, actor_email, actor_role,
        target_user_id, target_user_email, organization_id,
        previous_values, new_values, metadata,
        ip_address, user_agent, session_id
    ) VALUES (
        p_action_type, p_actor_id, v_actor_email, v_actor_role,
        p_target_user_id, v_target_email, p_organization_id,
        p_previous_values, p_new_values, p_metadata,
        p_ip_address, p_user_agent, p_session_id
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- Function for user deactivation with audit logging
CREATE OR REPLACE FUNCTION public.deactivate_user(
    p_user_id UUID,
    p_actor_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_record public.users%ROWTYPE;
    v_previous_values JSONB;
BEGIN
    -- Get current user state
    SELECT * INTO v_user_record
    FROM public.users 
    WHERE id = p_user_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or already deactivated';
    END IF;
    
    -- Store previous values for audit
    v_previous_values = jsonb_build_object(
        'is_active', true,
        'deactivated_at', NULL,
        'deactivated_by', NULL,
        'deactivation_reason', NULL
    );
    
    -- Deactivate user
    UPDATE public.users
    SET 
        is_active = false,
        deactivated_at = NOW(),
        deactivated_by = p_actor_id,
        deactivation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log audit event
    PERFORM public.log_audit_event(
        'user_deactivated',
        p_actor_id,
        p_user_id,
        NULL,
        v_previous_values,
        jsonb_build_object(
            'is_active', false,
            'deactivated_at', NOW(),
            'deactivated_by', p_actor_id,
            'deactivation_reason', p_reason
        ),
        p_metadata
    );
    
    RETURN true;
END;
$$;

-- Function for user reactivation with audit logging
CREATE OR REPLACE FUNCTION public.reactivate_user(
    p_user_id UUID,
    p_actor_id UUID,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_record public.users%ROWTYPE;
    v_previous_values JSONB;
BEGIN
    -- Get current user state
    SELECT * INTO v_user_record
    FROM public.users 
    WHERE id = p_user_id AND is_active = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or already active';
    END IF;
    
    -- Store previous values for audit
    v_previous_values = jsonb_build_object(
        'is_active', false,
        'deactivated_at', v_user_record.deactivated_at,
        'deactivated_by', v_user_record.deactivated_by,
        'deactivation_reason', v_user_record.deactivation_reason
    );
    
    -- Reactivate user
    UPDATE public.users
    SET 
        is_active = true,
        deactivated_at = NULL,
        deactivated_by = NULL,
        deactivation_reason = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log audit event
    PERFORM public.log_audit_event(
        'user_reactivated',
        p_actor_id,
        p_user_id,
        NULL,
        v_previous_values,
        jsonb_build_object(
            'is_active', true,
            'deactivated_at', NULL,
            'deactivated_by', NULL,
            'deactivation_reason', NULL
        ),
        p_metadata
    );
    
    RETURN true;
END;
$$;

-- Function for bulk role updates with audit logging
CREATE OR REPLACE FUNCTION public.bulk_update_user_roles(
    p_user_ids UUID[],
    p_new_role TEXT,
    p_actor_id UUID,
    p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_previous_role TEXT;
    v_updated_count INTEGER := 0;
BEGIN
    -- Validate role
    IF p_new_role NOT IN ('admin', 'manager', 'writer', 'viewer') THEN
        RAISE EXCEPTION 'Invalid role: %', p_new_role;
    END IF;
    
    -- Update each user and log audit event
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        -- Get current role
        SELECT role INTO v_previous_role
        FROM public.users 
        WHERE id = v_user_id AND is_active = true;
        
        IF FOUND AND v_previous_role != p_new_role THEN
            -- Update role
            UPDATE public.users
            SET 
                role = p_new_role,
                updated_at = NOW()
            WHERE id = v_user_id;
            
            -- Log audit event
            PERFORM public.log_audit_event(
                'role_changed',
                p_actor_id,
                v_user_id,
                NULL,
                jsonb_build_object('role', v_previous_role),
                jsonb_build_object('role', p_new_role),
                jsonb_build_object(
                    'bulk_operation', true,
                    'total_users', array_length(p_user_ids, 1)
                ) || COALESCE(p_metadata, '{}'::jsonb)
            );
            
            v_updated_count := v_updated_count + 1;
        END IF;
    END LOOP;
    
    -- Log bulk operation summary
    PERFORM public.log_audit_event(
        'bulk_role_update',
        p_actor_id,
        NULL,
        NULL,
        NULL,
        jsonb_build_object(
            'new_role', p_new_role,
            'user_count', v_updated_count,
            'user_ids', p_user_ids
        ),
        p_metadata
    );
    
    RETURN v_updated_count;
END;
$$;

-- Function for automated cleanup
CREATE OR REPLACE FUNCTION public.automated_cleanup()
RETURNS TABLE (
    cleanup_type TEXT,
    records_affected INTEGER,
    details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config public.cleanup_config%ROWTYPE;
    v_expired_invitations INTEGER;
    v_old_audit_logs INTEGER;
BEGIN
    -- Get cleanup configuration
    SELECT * INTO v_config
    FROM public.cleanup_config
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cleanup configuration not found';
    END IF;
    
    -- Clean up expired invitations
    DELETE FROM public.user_invitations
    WHERE status = 'pending' 
    AND expires_at < NOW() - INTERVAL '1 day' * v_config.expired_invitations_days;
    
    GET DIAGNOSTICS v_expired_invitations = ROW_COUNT;
    
    -- Return cleanup results
    IF v_expired_invitations > 0 THEN
        RETURN QUERY SELECT 
            'expired_invitations'::TEXT,
            v_expired_invitations,
            jsonb_build_object('days_threshold', v_config.expired_invitations_days);
    END IF;
    
    -- Clean up old audit logs (respect retention period)
    DELETE FROM public.audit_logs
    WHERE retention_until < NOW();
    
    GET DIAGNOSTICS v_old_audit_logs = ROW_COUNT;
    
    IF v_old_audit_logs > 0 THEN
        RETURN QUERY SELECT 
            'audit_logs'::TEXT,
            v_old_audit_logs,
            jsonb_build_object('retention_policy', '7 years');
    END IF;
    
    -- Update last cleanup run
    UPDATE public.cleanup_config
    SET last_cleanup_run = NOW()
    WHERE id = v_config.id;
    
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Users can view audit logs for their organization" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND (
                u.role IN ('admin', 'manager') 
                OR (organization_id IS NOT NULL AND u.organization_id = audit_logs.organization_id)
            )
        )
    );

CREATE POLICY "Admins and managers can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager')
        )
    );

-- RLS Policies for cleanup_config
CREATE POLICY "Admins can manage cleanup config" ON public.cleanup_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, UPDATE ON public.cleanup_config TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.automated_cleanup TO authenticated; 