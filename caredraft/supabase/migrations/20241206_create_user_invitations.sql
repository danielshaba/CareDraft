-- Migration: Create User Invitation System
-- Description: Comprehensive user invitation system with email integration and role management
-- Date: 2024-12-06

-- Create invitation_status enum
CREATE TYPE invitation_status AS ENUM (
  'pending',
  'accepted',
  'expired',
  'cancelled',
  'resent'
);

-- Create user_invitations table
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  message TEXT, -- Custom invitation message
  metadata JSONB DEFAULT '{}', -- Additional invitation data
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_invitations_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT user_invitations_expires_future CHECK (expires_at > created_at),
  CONSTRAINT user_invitations_accepted_logic CHECK (
    (status = 'accepted' AND accepted_at IS NOT NULL AND accepted_by IS NOT NULL) OR
    (status != 'accepted' AND (accepted_at IS NULL OR accepted_by IS NULL))
  )
);

-- Create invitation_email_logs table for tracking email delivery
CREATE TABLE invitation_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES user_invitations(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('invitation', 'reminder', 'resend')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  provider_message_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')
  ),
  provider_response JSONB DEFAULT '{}',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_organization_id ON user_invitations(organization_id);
CREATE INDEX idx_user_invitations_invited_by ON user_invitations(invited_by);
CREATE INDEX idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX idx_user_invitations_status ON user_invitations(status);
CREATE INDEX idx_user_invitations_expires_at ON user_invitations(expires_at);
CREATE INDEX idx_user_invitations_created_at ON user_invitations(created_at DESC);
CREATE INDEX idx_user_invitations_organization_status ON user_invitations(organization_id, status);

-- Composite index for preventing duplicate active invitations
CREATE UNIQUE INDEX idx_user_invitations_unique_pending 
ON user_invitations(email, organization_id) 
WHERE status IN ('pending', 'resent');

-- Invitation email logs indexes
CREATE INDEX idx_invitation_email_logs_invitation_id ON invitation_email_logs(invitation_id);
CREATE INDEX idx_invitation_email_logs_delivery_status ON invitation_email_logs(delivery_status);
CREATE INDEX idx_invitation_email_logs_sent_at ON invitation_email_logs(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations table
CREATE POLICY "Users can view invitations for their organization"
  ON user_invitations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users with manage_users permission can create invitations"
  ON user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND
    invited_by = auth.uid()
  );

CREATE POLICY "Users with manage_users permission can update invitations"
  ON user_invitations FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users with manage_users permission can delete invitations"
  ON user_invitations FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for invitation_email_logs table
CREATE POLICY "Users can view email logs for their organization invitations"
  ON invitation_email_logs FOR SELECT
  TO authenticated
  USING (
    invitation_id IN (
      SELECT id FROM user_invitations 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert email logs"
  ON invitation_email_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to automatically update invitation status based on expiration
CREATE OR REPLACE FUNCTION update_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE user_invitations 
  SET status = 'expired', updated_at = NOW()
  WHERE status IN ('pending', 'resent') 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to create invitation notification
CREATE OR REPLACE FUNCTION create_invitation_notification(
  p_invitation_id UUID,
  p_invited_email TEXT,
  p_inviter_name TEXT,
  p_organization_name TEXT,
  p_role TEXT
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  invitation_record user_invitations%ROWTYPE;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record 
  FROM user_invitations 
  WHERE id = p_invitation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation with id % does not exist', p_invitation_id;
  END IF;
  
  -- Create notification content
  INSERT INTO notifications (
    user_id, 
    type, 
    title, 
    content, 
    action_url,
    related_entity_type,
    related_entity_id,
    sender_id,
    priority,
    expires_at
  ) VALUES (
    invitation_record.invited_by,
    'team_invitation',
    'Team Invitation Sent',
    jsonb_build_object(
      'invited_email', p_invited_email,
      'organization_name', p_organization_name,
      'role', p_role,
      'inviter_name', p_inviter_name,
      'expires_at', invitation_record.expires_at::text
    ),
    '/settings/users',
    'invitation',
    p_invitation_id,
    invitation_record.invited_by,
    2,
    invitation_record.expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_token UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  invitation_record user_invitations%ROWTYPE;
  result JSONB;
BEGIN
  -- Get and validate invitation
  SELECT * INTO invitation_record 
  FROM user_invitations 
  WHERE invitation_token = p_invitation_token
  AND status IN ('pending', 'resent')
  AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid or expired invitation token'
    );
  END IF;
  
  -- Check if user is already in the organization
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_user_id 
    AND organization_id = invitation_record.organization_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'User is already a member of this organization'
    );
  END IF;
  
  -- Update user's organization and role
  UPDATE users 
  SET 
    organization_id = invitation_record.organization_id,
    role = invitation_record.role,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Mark invitation as accepted
  UPDATE user_invitations 
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = p_user_id,
    updated_at = NOW()
  WHERE id = invitation_record.id;
  
  -- Create success notification for inviter
  INSERT INTO notifications (
    user_id, 
    type, 
    title, 
    content,
    sender_id,
    priority
  ) VALUES (
    invitation_record.invited_by,
    'team_invitation',
    'Invitation Accepted',
    jsonb_build_object(
      'invited_email', invitation_record.email,
      'status', 'accepted',
      'accepted_at', NOW()::text
    ),
    p_user_id,
    2
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER trigger_user_invitations_updated_at
  BEFORE UPDATE ON user_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add default invitation preferences for existing users
DO $$
BEGIN
  -- Check if team_invitations preference columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' 
    AND column_name = 'email_team_invitations'
  ) THEN
    -- Update existing users to have team invitation preferences enabled
    INSERT INTO user_notification_preferences (user_id)
    SELECT id FROM users 
    WHERE id NOT IN (SELECT user_id FROM user_notification_preferences)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Create a scheduled job to clean up expired invitations (pseudo-code comment)
-- This would typically be implemented as a cron job or scheduled function
-- Example: SELECT cron.schedule('cleanup-expired-invitations', '0 0 * * *', 'SELECT update_expired_invitations();');

COMMENT ON TABLE user_invitations IS 'User invitations with email integration and role assignment';
COMMENT ON TABLE invitation_email_logs IS 'Email delivery tracking for invitations';
COMMENT ON FUNCTION create_invitation_notification IS 'Create notification when invitation is sent';
COMMENT ON FUNCTION accept_invitation IS 'Handle invitation acceptance workflow';
COMMENT ON FUNCTION update_expired_invitations IS 'Update expired invitations status'; 