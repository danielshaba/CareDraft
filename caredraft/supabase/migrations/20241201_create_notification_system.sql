-- Create notification_types enum
CREATE TYPE notification_type AS ENUM (
  'mention',
  'deadline', 
  'proposal_update',
  'review_request',
  'system_announcement',
  'team_invitation',
  'document_shared',
  'research_session_shared'
); 