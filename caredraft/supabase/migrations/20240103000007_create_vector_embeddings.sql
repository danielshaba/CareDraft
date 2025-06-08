-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Document types for categorization
CREATE TYPE document_type AS ENUM (
  'pdf',
  'word',
  'text',
  'markdown',
  'excel',
  'powerpoint',
  'web_page',
  'other'
);

-- Document processing status
CREATE TYPE processing_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'archived'
);

-- Knowledge base documents table
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  document_type document_type NOT NULL DEFAULT 'other',
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_status processing_status DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,
  checksum TEXT UNIQUE,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document chunks table for storing text segments
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_tokens INTEGER,
  chunk_size INTEGER NOT NULL,
  overlap_tokens INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  page_number INTEGER,
  section_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure chunk ordering per document
  UNIQUE(document_id, chunk_index)
);

-- Vector embeddings table
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI Ada 002 dimensions, adjust if using different model
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one embedding per chunk
  UNIQUE(chunk_id)
);

-- Search queries log for analytics and improvement
CREATE TABLE rag_search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  query_embedding vector(1536),
  results_count INTEGER DEFAULT 0,
  confidence_threshold DECIMAL DEFAULT 0.7,
  search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_generated BOOLEAN DEFAULT false,
  response_rating INTEGER CHECK (response_rating >= 1 AND response_rating <= 5),
  metadata JSONB DEFAULT '{}'
);

-- Search results for tracking which documents were retrieved
CREATE TABLE rag_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID NOT NULL REFERENCES rag_search_queries(id) ON DELETE CASCADE,
  chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  similarity_score DECIMAL NOT NULL,
  rank_position INTEGER NOT NULL,
  was_used_in_response BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_knowledge_documents_type ON knowledge_documents(document_type);
CREATE INDEX idx_knowledge_documents_status ON knowledge_documents(processing_status);
CREATE INDEX idx_knowledge_documents_active ON knowledge_documents(is_active) WHERE is_active = true;
CREATE INDEX idx_knowledge_documents_uploaded_by ON knowledge_documents(uploaded_by);
CREATE INDEX idx_knowledge_documents_tags ON knowledge_documents USING GIN(tags);
CREATE INDEX idx_knowledge_documents_metadata ON knowledge_documents USING GIN(metadata);
CREATE INDEX idx_knowledge_documents_checksum ON knowledge_documents(checksum);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_chunk_index ON document_chunks(document_id, chunk_index);
CREATE INDEX idx_document_chunks_content_tokens ON document_chunks(content_tokens);
CREATE INDEX idx_document_chunks_metadata ON document_chunks USING GIN(metadata);

-- Vector similarity search index (HNSW for better performance)
CREATE INDEX idx_document_embeddings_vector ON document_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_document_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX idx_document_embeddings_model ON document_embeddings(embedding_model);

CREATE INDEX idx_rag_queries_user_id ON rag_search_queries(user_id);
CREATE INDEX idx_rag_queries_timestamp ON rag_search_queries(search_timestamp);
CREATE INDEX idx_rag_queries_rating ON rag_search_queries(response_rating) WHERE response_rating IS NOT NULL;

CREATE INDEX idx_rag_results_query_id ON rag_search_results(query_id);
CREATE INDEX idx_rag_results_similarity ON rag_search_results(similarity_score DESC);
CREATE INDEX idx_rag_results_rank ON rag_search_results(query_id, rank_position);

-- RLS Policies

-- Knowledge documents: Users can read all active documents, but only upload/modify their own
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active knowledge documents" ON knowledge_documents
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can insert their own documents" ON knowledge_documents
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own documents" ON knowledge_documents
  FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all documents" ON knowledge_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Document chunks: Inherit access from parent document
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read chunks of accessible documents" ON document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents 
      WHERE id = document_chunks.document_id 
      AND is_active = true
    )
  );

CREATE POLICY "Users can manage chunks of their documents" ON document_chunks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents 
      WHERE id = document_chunks.document_id 
      AND (uploaded_by = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      ))
    )
  );

-- Document embeddings: Same access pattern as chunks
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read embeddings of accessible documents" ON document_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents 
      WHERE id = document_embeddings.document_id 
      AND is_active = true
    )
  );

CREATE POLICY "Users can manage embeddings of their documents" ON document_embeddings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents 
      WHERE id = document_embeddings.document_id 
      AND (uploaded_by = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      ))
    )
  );

-- Search queries: Users can only see their own queries
ALTER TABLE rag_search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own search queries" ON rag_search_queries
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all search queries" ON rag_search_queries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Search results: Users can access results from their queries
ALTER TABLE rag_search_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access results from their queries" ON rag_search_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rag_search_queries 
      WHERE id = rag_search_results.query_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert search results" ON rag_search_results
  FOR INSERT WITH CHECK (true);

-- Updated at trigger for knowledge_documents
CREATE OR REPLACE FUNCTION update_knowledge_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_documents_updated_at
  BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_documents_updated_at();

-- Function to calculate document statistics
CREATE OR REPLACE FUNCTION get_document_stats(doc_id UUID)
RETURNS JSON AS $$
DECLARE
  chunk_count INTEGER;
  total_tokens INTEGER;
  embedding_count INTEGER;
  avg_similarity DECIMAL;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(content_tokens), 0)
  INTO chunk_count, total_tokens
  FROM document_chunks 
  WHERE document_id = doc_id;
  
  SELECT COUNT(*)
  INTO embedding_count
  FROM document_embeddings 
  WHERE document_id = doc_id;
  
  RETURN json_build_object(
    'chunk_count', chunk_count,
    'total_tokens', total_tokens,
    'embedding_count', embedding_count,
    'processing_complete', chunk_count = embedding_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for similarity search
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding vector(1536),
  similarity_threshold decimal DEFAULT 0.7,
  max_results integer DEFAULT 10
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_title TEXT,
  chunk_content TEXT,
  similarity_score DECIMAL,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id AS chunk_id,
    dc.document_id,
    kd.title AS document_title,
    dc.content AS chunk_content,
    (1 - (de.embedding <=> query_embedding)) AS similarity_score,
    dc.metadata
  FROM document_chunks dc
  JOIN document_embeddings de ON dc.id = de.chunk_id
  JOIN knowledge_documents kd ON dc.document_id = kd.id
  WHERE kd.is_active = true
    AND kd.processing_status = 'completed'
    AND (1 - (de.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 