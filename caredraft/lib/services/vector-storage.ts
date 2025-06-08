import { createClient } from '@/lib/supabase'
import { embeddingService } from './embedding-service'
import { DocumentChunk, SearchResultWithContext, SearchOptions, DocumentType } from '@/types/rag'

// Use SearchResultWithContext as VectorSearchResult for consistency
export type VectorSearchResult = SearchResultWithContext

// Enhanced search options that extend the base SearchOptions
export interface EnhancedVectorSearchOptions extends SearchOptions {
  boost_recent?: boolean
  keyword_weight?: number
  semantic_weight?: number
}

export interface VectorIndex {
  id: string
  name: string
  dimension: number
  metric: 'cosine' | 'l2' | 'inner_product'
  created_at: string
  document_count: number
  chunk_count: number
}

export interface IndexStats {
  total_vectors: number
  index_size_mb: number
  avg_vector_length: number
  memory_usage_mb: number
  search_performance_ms: number
}

export interface VectorBatch {
  chunk_ids: string[]
  embeddings: number[][]
  metadata: Record<string, unknown>[]
}

export class VectorStorageManager {
  private supabase = createClient()
  private readonly INDEX_REBUILD_THRESHOLD = 10000 // Rebuild index after 10k insertions
  private insertionCount = 0

  async createIndex(name: string, dimension: number = 1536): Promise<string> {
    try {
      // Create index metadata (note: vector_indexes table may not exist yet)
      console.log('Vector index creation requested:', name)
      return 'default-index'
    } catch {
      console.error('Error creating vector index:', error)
      throw error
    }
  }

  async storeVectorBatch(batch: VectorBatch, documentId: string): Promise<boolean> {
    try {
      if (batch.chunk_ids.length !== batch.embeddings.length) {
        throw new Error('Chunk IDs and embeddings arrays must have the same length')
      }

      const insertData = batch.chunk_ids.map((chunkId, index) => ({
        chunk_id: chunkId,
        document_id: documentId,
        embedding: batch.embeddings[index],
        embedding_model: 'text-embedding-ada-002',
        created_at: new Date().toISOString()
      }))

      const { error } = await this.supabase
        .from('document_embeddings')
        .insert(insertData)

      if (error) {
        console.error('Error storing vector batch:', error)
        return false
      }

      this.insertionCount += batch.chunk_ids.length

      // Check if we need to rebuild index
      if (this.insertionCount >= this.INDEX_REBUILD_THRESHOLD) {
        await this.optimizeIndex()
        this.insertionCount = 0
      }

      return true
    } catch {
      console.error('Error storing vector batch:', error)
      return false
    }
  }

  async searchVectors(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const {
        similarity_threshold = 0.7,
        max_results = 10,
        document_types,
        date_range,
        include_metadata = true
      } = options

      const { data, error } = await this.supabase.rpc('search_similar_chunks', {
        query_embedding: queryEmbedding,
        similarity_threshold,
        max_results: max_results * 2
      })

      if (error) throw error
      let results = data || []

      if (document_types && document_types.length > 0) {
        results = results.filter((r: unknown) => document_types.includes(r.document_type))
      }

      if (date_range) {
        results = results.filter((r: unknown) => {
          const date = new Date(r.created_at)
          const start = date_range.start ? new Date(date_range.start) : null
          const end = date_range.end ? new Date(date_range.end) : null
          
          if (start && date < start) return false
          if (end && date > end) return false
          return true
        })
      }

      results = results.slice(0, max_results)

      return results.map((r: unknown) => ({
        chunk_id: r.chunk_id,
        document_id: r.document_id,
        similarity_score: r.similarity_score,
        chunk_content: r.chunk_content,
        document_title: r.document_title,
        document_type: r.document_type,
        metadata: include_metadata ? (r.metadata || {}) : {}
      }))

    } catch {
      console.error('Error searching vectors:', error)
      throw error
    }
  }

  async hybridSearch(
    query: string,
    options: SearchOptions & {
      keyword_weight?: number
      semantic_weight?: number
    } = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const {
        keyword_weight = 0.3,
        semantic_weight = 0.7,
        max_results = 10
      } = options

      const embeddingResponse = await embeddingService.generateEmbedding({ text: query })
      
      const semanticResults = await this.searchVectors(embeddingResponse.embedding, {
        ...options,
        max_results: max_results * 2
      })

      const keywordResults = await this.keywordSearch(query, {
        max_results: max_results * 2,
        document_types: options.document_types
      })

      const combinedResults = this.combineSearchResults(
        semanticResults,
        keywordResults,
        semantic_weight,
        keyword_weight
      )

      return combinedResults.slice(0, max_results)

    } catch {
      console.error('Error in hybrid search:', error)
      throw error
    }
  }

  private async keywordSearch(
    query: string,
    options: { max_results: number, document_types?: DocumentType[] }
  ): Promise<VectorSearchResult[]> {
    try {
      let searchQuery = this.supabase
        .from('document_chunks')
        .select(`
          id,
          document_id,
          content,
          metadata,
          created_at,
          document:knowledge_documents!inner(
            title,
            document_type
          )
        `)
        .textSearch('content', query, {
          type: 'websearch',
          config: 'english'
        })
        .limit(options.max_results)

      if (options.document_types && options.document_types.length > 0) {
        searchQuery = searchQuery.in('document.document_type', options.document_types)
      }

      const { data, error } = await searchQuery
      if (error) throw error

      return (data || []).map((chunk: unknown) => ({
        chunk_id: chunk.id,
        document_id: chunk.document_id,
        similarity_score: 0.8,
        chunk_content: chunk.content,
        document_title: chunk.document.title,
        document_type: chunk.document.document_type,
        metadata: chunk.metadata || {}
      }))

    } catch {
      console.error('Error in keyword search:', error)
      return []
    }
  }

  private combineSearchResults(
    semanticResults: VectorSearchResult[],
    keywordResults: VectorSearchResult[],
    semanticWeight: number,
    keywordWeight: number
  ): VectorSearchResult[] {
    const resultMap = new Map<string, VectorSearchResult>()

    semanticResults.forEach(result => {
      resultMap.set(result.chunk_id, {
        ...result,
        similarity_score: result.similarity_score * semanticWeight
      })
    })

    keywordResults.forEach(result => {
      const existing = resultMap.get(result.chunk_id)
      if (existing) {
        existing.similarity_score += result.similarity_score * keywordWeight
      } else {
        resultMap.set(result.chunk_id, {
          ...result,
          similarity_score: result.similarity_score * keywordWeight
        })
      }
    })

    return Array.from(resultMap.values())
      .sort((a, b) => b.similarity_score - a.similarity_score)
  }

  async getIndexStats(): Promise<IndexStats> {
    try {
      // Get total vector count
      const { count: totalVectors } = await this.supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })

      // Calculate average vector length (assuming 1536 dimensions for OpenAI embeddings)
      const avgVectorLength = 1536

      // Estimate memory usage (vectors + indexes)
      const vectorSizeMB = (totalVectors || 0) * avgVectorLength * 4 / (1024 * 1024) // 4 bytes per float
      const indexOverheadMB = vectorSizeMB * 0.3 // Approximate HNSW index overhead

      return {
        total_vectors: totalVectors || 0,
        index_size_mb: Math.round((vectorSizeMB + indexOverheadMB) * 100) / 100,
        avg_vector_length: avgVectorLength,
        memory_usage_mb: Math.round(vectorSizeMB * 100) / 100,
        search_performance_ms: 50 // Default estimate
      }

    } catch {
      console.error('Error getting index stats:', error)
      return {
        total_vectors: 0,
        index_size_mb: 0,
        avg_vector_length: 1536,
        memory_usage_mb: 0,
        search_performance_ms: 50
      }
    }
  }

  async optimizeIndex(indexId?: string): Promise<void> {
    try {
      // In a production environment, this would rebuild indexes
      console.log('Vector index optimization requested')
    } catch {
      console.error('Error optimizing index:', error)
      // Don't throw - optimization is not critical for functionality
    }
  }

  async deleteVectorsByDocument(documentId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('document_embeddings')
        .delete()
        .eq('document_id', documentId)

      return !error
    } catch {
      console.error('Error deleting vectors:', error)
      return false
    }
  }

  async getVectorCount(documentId?: string): Promise<number> {
    try {
      let query = this.supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })

      if (documentId) {
        query = query.eq('document_id', documentId)
      }

      const { count } = await query
      return count || 0
    } catch {
      console.error('Error getting vector count:', error)
      return 0
    }
  }

  // Batch operations for performance
  async bulkInsertVectors(
    vectors: Array<{
      chunk_id: string
      document_id: string
      embedding: number[]
      metadata?: Record<string, unknown>
    }>,
    batchSize: number = 100
  ): Promise<{ success: number, failed: number }> {
    let success = 0
    let failed = 0

    try {
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize)
        
        const insertData = batch.map(v => ({
          chunk_id: v.chunk_id,
          document_id: v.document_id,
          embedding: v.embedding,
          embedding_model: 'text-embedding-ada-002',
          created_at: new Date().toISOString(),
          metadata: v.metadata || {}
        }))

        const { error } = await this.supabase
          .from('document_embeddings')
          .insert(insertData)

        if (error) {
          console.error(`Error inserting batch ${i}-${i + batchSize}:`, error)
          failed += batch.length
        } else {
          success += batch.length
        }

        // Small delay to avoid overwhelming the database
        if (i + batchSize < vectors.length) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      return { success, failed }
    } catch {
      console.error('Error in bulk insert:', error)
      return { success, failed: vectors.length - success }
    }
  }
}

export const vectorStorage = new VectorStorageManager() 