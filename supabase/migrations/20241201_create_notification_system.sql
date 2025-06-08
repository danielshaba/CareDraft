-- Migration: Create Notification System
-- Description: Comprehensive notification system with real-time capabilities
-- Date: 2024-12-01

-- Create notification_types enum
CREATE TYPE notification_type AS ENUM (
  'mention',
  'deadline', 
  'proposal_update',
  'review_request',
  'system_announcement',
  'team_invitation',
  'document_shared'
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  read_status BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  related_entity_type VARCHAR(50), -- 'proposal', 'comment', 'section', etc.
  related_entity_id UUID,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration for temporary notifications
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5) -- 1=low, 5=urgent
);

-- Create user notification preferences table
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Email notification preferences
  email_mentions BOOLEAN NOT NULL DEFAULT TRUE,
  email_deadlines BOOLEAN NOT NULL DEFAULT TRUE,
  email_proposal_updates BOOLEAN NOT NULL DEFAULT TRUE,
  email_review_requests BOOLEAN NOT NULL DEFAULT TRUE,
  email_system_announcements BOOLEAN NOT NULL DEFAULT TRUE,
  email_team_invitations BOOLEAN NOT NULL DEFAULT TRUE,
  email_document_shared BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- In-app notification preferences  
  app_mentions BOOLEAN NOT NULL DEFAULT TRUE,
  app_deadlines BOOLEAN NOT NULL DEFAULT TRUE,
  app_proposal_updates BOOLEAN NOT NULL DEFAULT TRUE,
  app_review_requests BOOLEAN NOT NULL DEFAULT TRUE,
  app_system_announcements BOOLEAN NOT NULL DEFAULT TRUE,
  app_team_invitations BOOLEAN NOT NULL DEFAULT TRUE,
  app_document_shared BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Timing preferences
  email_digest_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (email_digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'never')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notification aggregates for efficient querying
CREATE TABLE notification_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_status ON notifications(read_status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_status) WHERE read_status = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);

-- Composite indexes for common queries
CREATE INDEX idx_notifications_user_type_created ON notifications(user_id, type, created_at DESC);
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, read_status, created_at DESC);

-- Index for user preferences
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Index for aggregates
CREATE INDEX idx_notification_aggregates_user_id ON notification_aggregates(user_id);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications for any user"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); -- System/admin can create notifications for any user

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for user_notification_preferences table
CREATE POLICY "Users can view their own notification preferences"
  ON user_notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
  ON user_notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
  ON user_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for notification_aggregates table
CREATE POLICY "Users can view their own notification aggregates"
  ON notification_aggregates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification aggregates"
  ON notification_aggregates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification aggregates"
  ON notification_aggregates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to update notification aggregate counts
CREATE OR REPLACE FUNCTION update_notification_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment unread count for new notification
    INSERT INTO notification_aggregates (user_id, unread_count)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      unread_count = notification_aggregates.unread_count + 1,
      updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle read status changes
    IF OLD.read_status = FALSE AND NEW.read_status = TRUE THEN
      -- Decrement unread count when marking as read
      UPDATE notification_aggregates 
      SET unread_count = GREATEST(0, unread_count - 1),
          last_read_at = NOW(),
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF OLD.read_status = TRUE AND NEW.read_status = FALSE THEN
      -- Increment unread count when marking as unread
      UPDATE notification_aggregates 
      SET unread_count = unread_count + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count if deleting unread notification
    IF OLD.read_status = FALSE THEN
      UPDATE notification_aggregates 
      SET unread_count = GREATEST(0, unread_count - 1),
          updated_at = NOW()
      WHERE user_id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic aggregate updates
CREATE TRIGGER trigger_update_notification_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_notification_aggregates();

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET read_status = TRUE, updated_at = NOW()
  WHERE user_id = target_user_id AND read_status = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Update aggregate to reflect all read
  UPDATE notification_aggregates 
  SET unread_count = 0,
      last_read_at = NOW(),
      updated_at = NOW()
  WHERE user_id = target_user_id;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(unread_count, 0) 
    FROM notification_aggregates 
    WHERE user_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create notification with proper validation
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR(255),
  p_content JSONB DEFAULT '{}',
  p_action_url TEXT DEFAULT NULL,
  p_related_entity_type VARCHAR(50) DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_sender_id UUID DEFAULT NULL,
  p_priority INTEGER DEFAULT 1,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User with id % does not exist', p_user_id;
  END IF;
  
  -- Create the notification
  INSERT INTO notifications (
    user_id, type, title, content, action_url,
    related_entity_type, related_entity_id, sender_id,
    priority, expires_at
  ) VALUES (
    p_user_id, p_type, p_title, p_content, p_action_url,
    p_related_entity_type, p_related_entity_id, p_sender_id,
    p_priority, p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_aggregates_updated_at
  BEFORE UPDATE ON notification_aggregates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for notification details with sender information
CREATE VIEW notification_details AS
SELECT 
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.content,
  n.read_status,
  n.action_url,
  n.related_entity_type,
  n.related_entity_id,
  n.priority,
  n.created_at,
  n.updated_at,
  n.expires_at,
  s.id as sender_id,
  s.full_name as sender_name,
  s.email as sender_email,
  CASE 
    WHEN n.expires_at IS NOT NULL AND n.expires_at < NOW() THEN TRUE
    ELSE FALSE
  END as is_expired
FROM notifications n
LEFT JOIN users s ON n.sender_id = s.id;

-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_aggregates;

-- Insert default notification preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_notification_preferences);

-- Insert default aggregates for existing users
INSERT INTO notification_aggregates (user_id, unread_count)
SELECT id, 0 FROM users 
WHERE id NOT IN (SELECT user_id FROM notification_aggregates);

COMMENT ON TABLE notifications IS 'User notifications with real-time support';
COMMENT ON TABLE user_notification_preferences IS 'User preferences for email and in-app notifications';
COMMENT ON TABLE notification_aggregates IS 'Aggregated notification counts for efficient queries';
COMMENT ON FUNCTION create_notification IS 'Create a new notification with validation';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Mark all notifications as read for a user';
COMMENT ON FUNCTION cleanup_expired_notifications IS 'Remove expired notifications';
COMMENT ON FUNCTION get_unread_notification_count IS 'Get unread notification count for a user'; 