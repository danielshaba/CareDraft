-- Migration: Add Research Session Sharing Notifications
-- Description: Add research_session_shared notification type and preferences
-- Date: 2024-12-06

-- Add research_session_shared to the notification_type enum
ALTER TYPE notification_type ADD VALUE 'research_session_shared';

-- Add research session sharing notification preferences to user_notification_preferences table
DO $$
BEGIN
    -- Check if columns don't already exist before adding them
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_notification_preferences' 
                   AND column_name = 'email_research_session_shared') THEN
        ALTER TABLE user_notification_preferences 
        ADD COLUMN email_research_session_shared BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_notification_preferences' 
                   AND column_name = 'app_research_session_shared') THEN
        ALTER TABLE user_notification_preferences 
        ADD COLUMN app_research_session_shared BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
END $$;

-- Function to create research session shared notification
CREATE OR REPLACE FUNCTION create_research_session_shared_notification(
  p_user_id UUID,
  p_session_id UUID,
  p_session_title TEXT,
  p_sharer_id UUID,
  p_sharer_name TEXT,
  p_query_preview TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  action_url TEXT;
BEGIN
  -- Validate that both users exist
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User with id % does not exist', p_user_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_sharer_id) THEN
    RAISE EXCEPTION 'Sharer with id % does not exist', p_sharer_id;
  END IF;
  
  -- Create action URL for viewing the shared session
  action_url := '/dashboard/research-sessions/' || p_session_id;
  
  -- Create the notification
  INSERT INTO notifications (
    user_id, 
    type, 
    title, 
    content, 
    action_url,
    related_entity_type, 
    related_entity_id, 
    sender_id,
    priority
  ) VALUES (
    p_user_id,
    'research_session_shared',
    p_sharer_name || ' shared a research session with you',
    jsonb_build_object(
      'session_title', p_session_title,
      'sharer_name', p_sharer_name,
      'session_id', p_session_id,
      'access_level', 'view',
      'query_preview', COALESCE(p_query_preview, LEFT(p_session_title, 100))
    ),
    action_url,
    'research_session',
    p_session_id,
    p_sharer_id,
    2 -- Medium priority
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_research_session_shared_notification TO authenticated;

-- Comment on function
COMMENT ON FUNCTION create_research_session_shared_notification IS 'Creates a notification when a research session is shared with a user'; 