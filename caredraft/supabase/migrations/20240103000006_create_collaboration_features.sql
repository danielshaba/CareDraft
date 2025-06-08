-- Create collaboration features for real-time comments, versions, and user presence
-- Migration: 20240103000006_create_collaboration_features.sql

-- Create comments table for inline comments on sections
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threaded comments
  text_range_start INTEGER, -- Character position where comment starts
  text_range_end INTEGER,   -- Character position where comment ends
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_section_id ON comments(section_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_resolved ON comments(is_resolved);

-- Create versions table for document version control
CREATE TABLE IF NOT EXISTS versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_snapshot TEXT NOT NULL, -- Full content at this version
  version_number INTEGER NOT NULL,
  change_summary TEXT, -- Brief description of changes
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for versions
CREATE INDEX IF NOT EXISTS idx_versions_section_id ON versions(section_id);
CREATE INDEX IF NOT EXISTS idx_versions_user_id ON versions(user_id);
CREATE INDEX IF NOT EXISTS idx_versions_version_number ON versions(section_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at DESC);

-- Create unique constraint for version numbers per section
CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_section_version_unique 
ON versions(section_id, version_number);

-- Create user_presence table for collaborative cursors and presence indicators
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  cursor_position INTEGER DEFAULT 0, -- Character position of cursor
  selection_start INTEGER, -- Start of text selection
  selection_end INTEGER,   -- End of text selection
  is_active BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_presence
CREATE INDEX IF NOT EXISTS idx_user_presence_section_id ON user_presence(section_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_active ON user_presence(is_active);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- Create unique constraint for one presence record per user per section
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_presence_user_section_unique 
ON user_presence(user_id, section_id);

-- Create mentions table to track @mentions in comments
CREATE TABLE IF NOT EXISTS mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioning_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for mentions
CREATE INDEX IF NOT EXISTS idx_mentions_comment_id ON mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user ON mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_mentioning_user ON mentions(mentioning_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_is_read ON mentions(is_read);
CREATE INDEX IF NOT EXISTS idx_mentions_created_at ON mentions(created_at DESC);

-- Enable RLS on all collaboration tables
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments table
-- Users can view comments on sections they have access to
CREATE POLICY "Users can view comments on accessible sections" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sections 
      WHERE sections.id = comments.section_id 
      AND (sections.owner_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

-- Users can insert comments on sections they have access to
CREATE POLICY "Users can insert comments on accessible sections" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM sections 
      WHERE sections.id = section_id 
      AND (sections.owner_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for versions table
-- Users can view versions of sections they have access to
CREATE POLICY "Users can view versions of accessible sections" ON versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sections 
      WHERE sections.id = versions.section_id 
      AND (sections.owner_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

-- Users can insert versions for sections they have access to
CREATE POLICY "Users can insert versions for accessible sections" ON versions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM sections 
      WHERE sections.id = section_id 
      AND (sections.owner_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

-- RLS Policies for user_presence table
-- Users can view presence of others on sections they have access to
CREATE POLICY "Users can view presence on accessible sections" ON user_presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sections 
      WHERE sections.id = user_presence.section_id 
      AND (sections.owner_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

-- Users can manage their own presence
CREATE POLICY "Users can manage own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for mentions table
-- Users can view mentions where they are mentioned or are the mentioner
CREATE POLICY "Users can view relevant mentions" ON mentions
  FOR SELECT USING (
    auth.uid() = mentioned_user_id OR 
    auth.uid() = mentioning_user_id
  );

-- Users can insert mentions when they are the mentioner
CREATE POLICY "Users can insert mentions as mentioner" ON mentions
  FOR INSERT WITH CHECK (auth.uid() = mentioning_user_id);

-- Users can update mentions where they are mentioned (to mark as read)
CREATE POLICY "Users can update mentions where mentioned" ON mentions
  FOR UPDATE USING (auth.uid() = mentioned_user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically increment version number
CREATE OR REPLACE FUNCTION auto_increment_version_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the next version number for this section
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO NEW.version_number
  FROM versions 
  WHERE section_id = NEW.section_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment version numbers
CREATE TRIGGER auto_increment_version_number_trigger
  BEFORE INSERT ON versions
  FOR EACH ROW
  EXECUTE FUNCTION auto_increment_version_number();

-- Function to update user presence last_seen timestamp
CREATE OR REPLACE FUNCTION update_user_presence_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_seen on presence updates
CREATE TRIGGER update_user_presence_last_seen_trigger
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_last_seen();

-- Function to clean up old presence records (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_presence_records()
RETURNS void AS $$
BEGIN
  DELETE FROM user_presence 
  WHERE last_seen < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Enable real-time subscriptions for all collaboration tables
-- This allows clients to subscribe to changes in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE versions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE mentions; 