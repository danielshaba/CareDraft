import { vectorStorage, VectorBatch } from './vector-storage'
import { embeddingService } from './embedding-service'
import { documentProcessor } from './document-processor'
import { ragService } from './rag'
import { DocumentChunk, KnowledgeDocument, ProcessingJob } from '@/types/rag'

export interface VectorProcessingResult {
  document_id: string
  chunks_processed: number
  embeddings_created: number
  vectors_stored: number
  processing_time_ms: number
  success: boolean
  errors: string[]
}

export interface VectorSearchRequest {
  query: string
  search_type: 'semantic' | 'keyword' | 'hybrid'
  max_results?: number
  similarity_threshold?: number
  document_types?: string[]
  boost_recent?: boolean
}

export class VectorIntegrationService {
  async processDocumentVectors(document: KnowledgeDocument): Promise<VectorProcessingResult> {
    const startTime = Date.now()
    const errors: string[] = []
    let chunksProcessed = 0
    let embeddingsCreated = 0
    let vectorsStored = 0

    try {
      console.log(`Processing vectors for document: ${document.title}`)

      // Step 1: Process document into chunks
      const processingResult = await documentProcessor.processDocument({
        content: document.content,
        title: document.title,
        document_type: document.document_type,
        metadata: document.metadata
      })

      if (!processingResult.success || !processingResult.chunks) {
        throw new Error(`Document processing failed: ${processingResult.error}`)
      }

      chunksProcessed = processingResult.chunks.length
      console.log(`Document chunked into ${chunksProcessed} pieces`)

      // Step 2: Generate embeddings for all chunks
      const chunkTexts = processingResult.chunks.map(chunk => chunk.content)
      const batchEmbeddingResult = await embeddingService.generateBatchEmbeddings({
        texts: chunkTexts,
        metadata: processingResult.chunks.map(chunk => chunk.metadata)
      })

      embeddingsCreated = batchEmbeddingResult.embeddings.length
      console.log(`Generated ${embeddingsCreated} embeddings`)

      // Step 3: Store chunks in database first
      const storedChunks = await this.storeDocumentChunks(
        document.id,
        processingResult.chunks
      )

      if (storedChunks.length === 0) {
        throw new Error('Failed to store document chunks in database')
      }

      // Step 4: Prepare vector batch for storage
      const vectorBatch: VectorBatch = {
        chunk_ids: storedChunks.map(chunk => chunk.id),
        embeddings: batchEmbeddingResult.embeddings.map(emb => emb.embedding),
        metadata: storedChunks.map(chunk => chunk.metadata)
      }

      // Step 5: Store vectors in vector database
      const vectorStoreSuccess = await vectorStorage.storeVectorBatch(vectorBatch, document.id)
      
      if (vectorStoreSuccess) {
        vectorsStored = vectorBatch.embeddings.length
        console.log(`Stored ${vectorsStored} vectors`)
      } else {
        errors.push('Failed to store vectors in vector database')
      }

      // Step 6: Update document status
      await ragService.updateDocumentStatus(document.id, 'completed')

      return {
        document_id: document.id,
        chunks_processed: chunksProcessed,
        embeddings_created: embeddingsCreated,
        vectors_stored: vectorsStored,
        processing_time_ms: Date.now() - startTime,
        success: vectorsStored > 0,
        errors
      }

    } catch {
      console.error('Vector processing error:', error)
      errors.push(error instanceof Error ? error.message : 'Unknown error')
      
      // Update document status to failed
      await ragService.updateDocumentStatus(document.id, 'failed')

      return {
        document_id: document.id,
        chunks_processed,
        embeddings_created,
        vectors_stored,
        processing_time_ms: Date.now() - startTime,
        success: false,
        errors
      }
    }
  }

  private async storeDocumentChunks(
    documentId: string,
    chunks: Array<{
      content: string
      metadata: Record<string, unknown>
      section_title?: string
      page_number?: number
    }>
  ): Promise<DocumentChunk[]> {
    try {
      const chunkInserts = chunks.map((chunk, index) => ({
        document_id: documentId,
        chunk_index: index,
        content: chunk.content,
        content_tokens: this.estimateTokens(chunk.content),
        chunk_size: chunk.content.length,
        overlap_tokens: 0, // Could be calculated based on chunking strategy
        metadata: chunk.metadata,
        page_number: chunk.page_number,
        section_title: chunk.section_title,
        created_at: new Date().toISOString()
      }))

      const storedChunks = await ragService.storeDocumentChunks(chunkInserts)
      return storedChunks

    } catch {
      console.error('Error storing document chunks:', error)
      return []
    }
  }

  async performVectorSearch(request: VectorSearchRequest) {
    try {
      const {
        query,
        search_type,
        max_results = 10,
        similarity_threshold = 0.7,
        document_types,
        boost_recent = false
      } = request

      const searchOptions = {
        max_results,
        similarity_threshold,
        document_types,
        include_metadata: true,
        boost_recent
      }

      let results = []

      switch (search_type) {
        case 'semantic': {
          const embeddingResponse = await embeddingService.generateEmbedding({ text: query })
          results = await vectorStorage.searchVectors(embeddingResponse.embedding, searchOptions)
          break
        }
        
        case 'keyword': {
          results = await vectorStorage.hybridSearch(query, {
            ...searchOptions,
            semantic_weight: 0,
            keyword_weight: 1
          })
          break
        }
        
        case 'hybrid':
        default: {
          results = await vectorStorage.hybridSearch(query, {
            ...searchOptions,
            semantic_weight: 0.7,
            keyword_weight: 0.3
          })
          break
        }
      }

      return {
        success: true,
        results,
        search_type,
        total_results: results.length,
        query
      }

    } catch {
      console.error('Vector search error:', error)
      return {
        success: false,
        results: [],
        search_type: request.search_type,
        total_results: 0,
        query: request.query,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async generateRAGResponse(query: string, context?: string) {
    try {
      // Perform hybrid search to get relevant context
      const searchResult = await this.performVectorSearch({
        query,
        search_type: 'hybrid',
        max_results: 5,
        similarity_threshold: 0.6,
        boost_recent: true
      })

      if (!searchResult.success || searchResult.results.length === 0) {
        return {
          success: false,
          error: 'No relevant context found for query'
        }
      }

      // Use the RAG service to generate response
      return await ragService.generateResponse({
        query,
        context: context || '',
        sources: searchResult.results,
        max_tokens: 500,
        temperature: 0.7
      })

    } catch {
      console.error('RAG response generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async optimizeVectorDatabase() {
    try {
      console.log('Starting vector database optimization...')
      
      // Get current statistics
      const stats = await vectorStorage.getVectorCount()
      console.log(`Current vector count: ${stats}`)

      // Clean up orphaned embeddings (embeddings without corresponding chunks)
      const cleanupResult = await this.cleanupOrphanedEmbeddings()
      console.log(`Cleaned up ${cleanupResult.deleted_embeddings} orphaned embeddings`)

      // Rebuild indexes if needed
      await vectorStorage.optimizeIndex?.()
      
      return {
        success: true,
        optimization_completed: true,
        cleanup_result: cleanupResult,
        timestamp: new Date().toISOString()
      }

    } catch {
      console.error('Vector database optimization error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async cleanupOrphanedEmbeddings() {
    try {
      // This would involve checking for embeddings without corresponding chunks
      // For now, return a placeholder result
      return {
        deleted_embeddings: 0,
        checked_embeddings: await vectorStorage.getVectorCount()
      }
    } catch {
      console.error('Cleanup error:', error)
      return {
        deleted_embeddings: 0,
        checked_embeddings: 0
      }
    }
  }

  private estimateTokens(text: string): number {
    // Simple token estimation (words * 1.3)
    return Math.ceil(text.split(/\s+/).length * 1.3)
  }

  async getVectorSystemHealth() {
    try {
      const stats = {
        total_vectors: await vectorStorage.getVectorCount(),
        embedding_service_stats: await embeddingService.getEmbeddingStats(),
        vector_storage_healthy: true
      }

      // Test embedding generation
      const testEmbedding = await embeddingService.generateEmbedding({
        text: 'health check test'
      })

      // Test vector search
      const testSearch = await vectorStorage.searchVectors(testEmbedding.embedding, {
        max_results: 1,
        similarity_threshold: 0.1
      })

      return {
        success: true,
        stats,
        health_check_passed: true,
        test_search_results: testSearch.length,
        timestamp: new Date().toISOString()
      }

    } catch {
      console.error('Health check error:', error)
      return {
        success: false,
        health_check_passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }
}

export const vectorIntegration = new VectorIntegrationService() 