-- Create section_status enum
CREATE TYPE section_status AS ENUM ('not_started', 'in_progress', 'review', 'complete');

-- Create sections table for hierarchical section management
CREATE TABLE IF NOT EXISTS sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  parent_section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  word_count_limit INTEGER DEFAULT 0,
  current_word_count INTEGER DEFAULT 0,
  status section_status DEFAULT 'not_started',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  content TEXT, -- Rich text content for the section
  project_id UUID, -- Future: link to specific projects/tenders
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sections_parent_id ON sections(parent_section_id);
CREATE INDEX IF NOT EXISTS idx_sections_owner_id ON sections(owner_id);
CREATE INDEX IF NOT EXISTS idx_sections_status ON sections(status);
CREATE INDEX IF NOT EXISTS idx_sections_due_date ON sections(due_date);
CREATE INDEX IF NOT EXISTS idx_sections_sort_order ON sections(parent_section_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_sections_project_id ON sections(project_id);

-- Create full-text search index on section content
CREATE INDEX IF NOT EXISTS idx_sections_content_search 
ON sections USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')));

-- Create RLS policies
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sections they own or are assigned to
CREATE POLICY "Users can view assigned sections" ON sections
  FOR SELECT USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM sections root_section 
      WHERE root_section.id = sections.id 
      OR root_section.parent_section_id = sections.id
    )
  );

-- Policy: Users can insert sections
CREATE POLICY "Users can insert sections" ON sections
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

-- Policy: Users can update sections they own
CREATE POLICY "Users can update own sections" ON sections
  FOR UPDATE USING (auth.uid() = owner_id);

-- Policy: Users can delete sections they own
CREATE POLICY "Users can delete own sections" ON sections
  FOR DELETE USING (auth.uid() = owner_id);

-- Create updated_at trigger
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent circular references in section hierarchy
CREATE OR REPLACE FUNCTION prevent_section_circular_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the parent_section_id would create a circular reference
  IF NEW.parent_section_id IS NOT NULL THEN
    -- Use recursive CTE to check for circular reference
    WITH RECURSIVE section_hierarchy AS (
      -- Base case: start from the proposed parent
      SELECT id, parent_section_id, 1 as depth
      FROM sections 
      WHERE id = NEW.parent_section_id
      
      UNION ALL
      
      -- Recursive case: traverse up the hierarchy
      SELECT s.id, s.parent_section_id, sh.depth + 1
      FROM sections s
      INNER JOIN section_hierarchy sh ON s.id = sh.parent_section_id
      WHERE sh.depth < 10 -- Prevent infinite recursion
    )
    SELECT COUNT(*) INTO STRICT 
    FROM section_hierarchy 
    WHERE id = NEW.id;
    
    -- If we found the current section in the hierarchy, it would create a circular reference
    IF FOUND THEN
      RAISE EXCEPTION 'Cannot set parent section: would create circular reference';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent circular references
CREATE TRIGGER prevent_section_circular_reference_trigger
  BEFORE INSERT OR UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION prevent_section_circular_reference();

-- Function to automatically update word count when content changes
CREATE OR REPLACE FUNCTION update_section_word_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate word count from content
  IF NEW.content IS NOT NULL THEN
    NEW.current_word_count = array_length(string_to_array(trim(regexp_replace(NEW.content, '<[^>]*>', '', 'g')), ' '), 1);
    -- Handle empty content case
    IF NEW.current_word_count IS NULL THEN
      NEW.current_word_count = 0;
    END IF;
  ELSE
    NEW.current_word_count = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update word count
CREATE TRIGGER update_section_word_count_trigger
  BEFORE INSERT OR UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_section_word_count(); 