import { createClient } from '@/lib/supabase'
import { 
  KnowledgeDocument, 
  DocumentChunk, 
  DocumentEmbedding,
  DocumentUploadRequest,
  SearchRequest,
  SearchResultWithContext,
  RAGQueryRequest,
  RAGResponse,
  ProcessingJob,
  DocumentProcessingResult,
  DocumentWithStats,
  ChunkingConfig,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_OVERLAP_SIZE,
  DEFAULT_SIMILARITY_THRESHOLD,
  DEFAULT_MAX_RESULTS
} from '@/types/rag'

export class RAGService {
  private supabase = createClient()

  // Document Management
  async uploadDocument(request: DocumentUploadRequest): Promise<KnowledgeDocument> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Generate checksum for duplicate detection
      const checksum = request.content ? 
        await this.generateChecksum(request.content) : 
        undefined

      const documentData = {
        title: request.title,
        content: request.content || '',
        file_name: request.file?.name,
        file_size: request.file?.size,
        document_type: request.document_type,
        mime_type: request.file?.type,
        uploaded_by: user.id,
        metadata: request.metadata || {},
        tags: request.tags || [],
        source_url: request.source_url,
        checksum,
        processing_status: 'pending' as const
      }

      const { data, error } = await this.supabase
        .from('knowledge_documents')
        .insert(documentData)
        .select()
        .single()

      if (error) throw error

      // Start processing job
      this.processDocumentAsync(data.id)

      return data
    } catch {
      console.error('Error uploading document:', error)
      throw error
    }
  }

  async getDocument(id: string): Promise<DocumentWithStats | null> {
    try {
      const { data, error } = await this.supabase
        .from('knowledge_documents')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) throw error

      // Get document statistics
      const { data: stats } = await this.supabase
        .rpc('get_document_stats', { doc_id: id })

      return { ...data, ...stats }
    } catch {
      console.error('Error fetching document:', error)
      return null
    }
  }

  async listDocuments(options?: {
    page?: number
    limit?: number
    type?: string
    status?: string
    search?: string
  }): Promise<{ documents: DocumentWithStats[], total: number }> {
    try {
      const page = options?.page || 1
      const limit = options?.limit || 20
      const offset = (page - 1) * limit

      let query = this.supabase
        .from('knowledge_documents')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (options?.type) {
        query = query.eq('document_type', options.type)
      }

      if (options?.status) {
        query = query.eq('processing_status', options.status)
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%, content.ilike.%${options.search}%`)
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)

      if (error) throw error

      // Add stats to each document
      const documentsWithStats = await Promise.all(
        (data || []).map(async (doc) => {
          const { data: stats } = await this.supabase
            .rpc('get_document_stats', { doc_id: doc.id })
          return { ...doc, ...stats }
        })
      )

      return {
        documents: documentsWithStats,
        total: count || 0
      }
    } catch {
      console.error('Error listing documents:', error)
      throw error
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('knowledge_documents')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      return true
    } catch {
      console.error('Error deleting document:', error)
      return false
    }
  }

  // Document Processing
  private async processDocumentAsync(documentId: string): Promise<void> {
    try {
      // Update status to processing
      await this.supabase
        .from('knowledge_documents')
        .update({ processing_status: 'processing' })
        .eq('id', documentId)

      const result = await this.processDocument(documentId)
      
      // Update status based on result
      await this.supabase
        .from('knowledge_documents')
        .update({ 
          processing_status: result.success ? 'completed' : 'failed'
        })
        .eq('id', documentId)

    } catch {
      console.error('Error processing document:', error)
      await this.supabase
        .from('knowledge_documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId)
    }
  }

  private async processDocument(documentId: string): Promise<DocumentProcessingResult> {
    const startTime = Date.now()
    
    try {
      // Get document
      const { data: document, error } = await this.supabase
        .from('knowledge_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) throw error

      // Chunk the document
      const chunks = await this.chunkDocument(document.content, {
        max_chunk_size: DEFAULT_CHUNK_SIZE,
        overlap_size: DEFAULT_OVERLAP_SIZE,
        chunk_strategy: 'fixed',
        preserve_formatting: true,
        include_metadata: true
      })

      // Store chunks
      const chunkData = chunks.map((chunk, index) => ({
        document_id: documentId,
        chunk_index: index,
        content: chunk.content,
        content_tokens: chunk.tokens,
        chunk_size: chunk.content.length,
        overlap_tokens: chunk.overlap_tokens || 0,
        metadata: chunk.metadata || {},
        page_number: chunk.page_number,
        section_title: chunk.section_title
      }))

      const { data: savedChunks, error: chunkError } = await this.supabase
        .from('document_chunks')
        .insert(chunkData)
        .select()

      if (chunkError) throw chunkError

      // Generate embeddings
      let embeddingsCreated = 0
      for (const chunk of savedChunks) {
        try {
          const embedding = await this.generateEmbedding(chunk.content)
          
          await this.supabase
            .from('document_embeddings')
            .insert({
              chunk_id: chunk.id,
              document_id: documentId,
              embedding: embedding,
              embedding_model: 'text-embedding-ada-002'
            })

          embeddingsCreated++
        } catch (embeddingError) {
          console.error(`Error creating embedding for chunk ${chunk.id}:`, embeddingError)
        }
      }

      const processingTime = Date.now() - startTime

      return {
        document_id: documentId,
        chunks_created: savedChunks.length,
        embeddings_generated: embeddingsCreated,
        processing_time_ms: processingTime,
        success: embeddingsCreated === savedChunks.length
      }

    } catch {
      console.error('Error in document processing:', error)
      return {
        document_id: documentId,
        chunks_created: 0,
        embeddings_generated: 0,
        processing_time_ms: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async chunkDocument(content: string, config: ChunkingConfig) {
    // Use the enhanced document processor
    const { documentProcessor } = await import('./document-processor')
    return await documentProcessor.processDocument(content, config)
  }

  private getOverlap(text: string, overlapSize: number): string {
    const words = text.split(' ')
    return words.slice(-overlapSize).join(' ')
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('/api/ai/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.embedding
    } catch {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  // Search Operations
  async searchSimilar(request: SearchRequest): Promise<SearchResultWithContext[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(request.query)

      const threshold = request.options?.similarity_threshold || DEFAULT_SIMILARITY_THRESHOLD
      const maxResults = request.options?.max_results || DEFAULT_MAX_RESULTS

      // Perform similarity search
      const { data, error } = await this.supabase
        .rpc('search_similar_chunks', {
          query_embedding: queryEmbedding,
          similarity_threshold: threshold,
          max_results: maxResults
        })

      if (error) throw error

      // Log the search query
      await this.logSearchQuery(request, queryEmbedding, data?.length || 0)

      return data || []
    } catch {
      console.error('Error in similarity search:', error)
      throw error
    }
  }

  async ragQuery(request: RAGQueryRequest): Promise<RAGResponse> {
    const startTime = Date.now()
    
    try {
      // Get similar chunks
      const searchResults = await this.searchSimilar(request)

      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find relevant information to answer your question.",
          sources: [],
          confidence: 0,
          query_id: '',
          generated_at: new Date().toISOString(),
          tokens_used: 0,
          processing_time_ms: Date.now() - startTime
        }
      }

      // Generate response using LLM
      const context = searchResults
        .slice(0, request.context_window || 5)
        .map(result => result.chunk_content)
        .join('\n\n')

      const systemPrompt = request.system_prompt || 
        'You are a helpful assistant for CareDraft, a proposal management system. Answer questions based on the provided context from the company knowledge base. Be specific and cite relevant information.'

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Context:\n${context}\n\nQuestion: ${request.query}` }
          ],
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1000
        })
      })

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`)
      }

      const chatData = await response.json()

      // Calculate confidence based on similarity scores
      const avgSimilarity = searchResults.reduce((sum, r) => sum + r.similarity_score, 0) / searchResults.length
      const confidence = Math.min(avgSimilarity * 1.2, 1.0) // Boost confidence slightly

      return {
        answer: chatData.choices[0].message.content,
        sources: searchResults,
        confidence,
        query_id: crypto.randomUUID(),
        generated_at: new Date().toISOString(),
        tokens_used: chatData.usage?.total_tokens || 0,
        processing_time_ms: Date.now() - startTime
      }

    } catch {
      console.error('Error in RAG query:', error)
      throw error
    }
  }

  private async logSearchQuery(request: SearchRequest, embedding: number[], resultsCount: number): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      await this.supabase
        .from('rag_search_queries')
        .insert({
          user_id: user?.id,
          query_text: request.query,
          query_embedding: embedding,
          results_count: resultsCount,
          confidence_threshold: request.options?.similarity_threshold || DEFAULT_SIMILARITY_THRESHOLD,
          metadata: request.options || {}
        })
    } catch {
      // Non-critical error - don't throw
      console.error('Error logging search query:', error)
    }
  }

  // Utility methods
  private async generateChecksum(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Analytics
  async getDocumentAnalytics() {
    try {
      const { data: documents } = await this.supabase
        .from('knowledge_documents')
        .select('document_type, processing_status, created_at')
        .eq('is_active', true)

      const { data: chunks } = await this.supabase
        .from('document_chunks')
        .select('id')

      const { data: embeddings } = await this.supabase
        .from('document_embeddings')
        .select('id')

      return {
        total_documents: documents?.length || 0,
        total_chunks: chunks?.length || 0,
        total_embeddings: embeddings?.length || 0,
        documents_by_type: this.groupBy(documents || [], 'document_type'),
        documents_by_status: this.groupBy(documents || [], 'processing_status'),
      }
    } catch {
      console.error('Error fetching analytics:', error)
      throw error
    }
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key])
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

export const ragService = new RAGService() 