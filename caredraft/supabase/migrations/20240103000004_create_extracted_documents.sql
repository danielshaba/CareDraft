-- Create extracted_documents table
CREATE TABLE IF NOT EXISTS extracted_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- Storage path in Supabase
  file_size BIGINT,
  file_type VARCHAR(100),
  original_text TEXT, -- Raw extracted text
  processed_text TEXT, -- Cleaned/processed text for analysis
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  page_count INTEGER,
  extraction_method VARCHAR(50), -- 'pdf-js', 'mammoth', 'xml-parse'
  processing_time INTEGER, -- milliseconds
  extraction_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  extraction_error TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  extracted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_extracted_documents_user_id ON extracted_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_documents_status ON extracted_documents(extraction_status);
CREATE INDEX IF NOT EXISTS idx_extracted_documents_uploaded_at ON extracted_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_documents_file_type ON extracted_documents(file_type);

-- Create full-text search index on extracted text
CREATE INDEX IF NOT EXISTS idx_extracted_documents_text_search 
ON extracted_documents USING gin(to_tsvector('english', COALESCE(original_text, '') || ' ' || COALESCE(processed_text, '')));

-- Create RLS policies
ALTER TABLE extracted_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own documents
CREATE POLICY "Users can view own extracted documents" ON extracted_documents
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own extracted documents" ON extracted_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own extracted documents" ON extracted_documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own extracted documents" ON extracted_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_extracted_documents_updated_at
  BEFORE UPDATE ON extracted_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create document_tags table for categorization
CREATE TABLE IF NOT EXISTS document_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES extracted_documents(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for document_tags
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag);

-- RLS for document_tags
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tags for own documents" ON document_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM extracted_documents 
      WHERE id = document_tags.document_id 
      AND user_id = auth.uid()
    )
  );

-- Create document_sections table for chunked text storage
CREATE TABLE IF NOT EXISTS document_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES extracted_documents(id) ON DELETE CASCADE,
  section_number INTEGER NOT NULL,
  section_title VARCHAR(255),
  section_content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for document_sections
CREATE INDEX IF NOT EXISTS idx_document_sections_document_id ON document_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_document_sections_number ON document_sections(document_id, section_number);

-- Full-text search on sections
CREATE INDEX IF NOT EXISTS idx_document_sections_content_search 
ON document_sections USING gin(to_tsvector('english', section_content));

-- RLS for document_sections
ALTER TABLE document_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sections for own documents" ON document_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM extracted_documents 
      WHERE id = document_sections.document_id 
      AND user_id = auth.uid()
    )
  ); 