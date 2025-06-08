import { createClient } from '@/lib/supabase.client'

export interface EmbeddingRequest {
  text: string
  metadata?: Record<string, unknown>
}

export interface EmbeddingResponse {
  embedding: number[]
  model: string
  tokens: number
  cached?: boolean
}

export interface BatchEmbeddingRequest {
  texts: string[]
  metadata?: Record<string, unknown>[]
  batch_size?: number
}

export interface BatchEmbeddingResponse {
  embeddings: EmbeddingResponse[]
  total_tokens: number
  processing_time_ms: number
  cached_count: number
}

export class EmbeddingService {
  private supabase = createClient()
  private cache = new Map<string, { embedding: number[], timestamp: number }>()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  private readonly MAX_CACHE_SIZE = 1000
  private readonly MAX_TEXT_LENGTH = 8000
  private readonly BATCH_SIZE = 10

  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      // Validate input
      if (!request.text || typeof request.text !== 'string') {
        throw new Error('Text is required and must be a string')
      }

      if (request.text.length > this.MAX_TEXT_LENGTH) {
        throw new Error(`Text is too long. Maximum length is ${this.MAX_TEXT_LENGTH} characters.`)
      }

      const cleanText = this.cleanText(request.text)
      
      // Check cache first
      const cacheKey = this.getCacheKey(cleanText)
      const cached = this.getFromCache(cacheKey)
      
      if (cached) {
        return {
          embedding: cached.embedding,
          model: 'text-embedding-ada-002',
          tokens: this.estimateTokens(cleanText),
          cached: true
        }
      }

      // Generate new embedding
      const response = await this.callEmbeddingAPI(cleanText)
      
      // Cache the result
      this.addToCache(cacheKey, response.embedding)
      
      return {
        embedding: response.embedding,
        model: response.model,
        tokens: response.usage?.total_tokens || this.estimateTokens(cleanText),
        cached: false
      }

    } catch {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  async generateBatchEmbeddings(request: BatchEmbeddingRequest): Promise<BatchEmbeddingResponse> {
    const startTime = Date.now()
    const batchSize = request.batch_size || this.BATCH_SIZE
    const embeddings: EmbeddingResponse[] = []
    let totalTokens = 0
    let cachedCount = 0

    try {
      // Process in batches
      for (let i = 0; i < request.texts.length; i += batchSize) {
        const batch = request.texts.slice(i, i + batchSize)
        const batchMetadata = request.metadata?.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (text, index) => {
          const metadata = batchMetadata?.[index]
          const result = await this.generateEmbedding({ text, metadata })
          
          if (result.cached) {
            cachedCount++
          }
          totalTokens += result.tokens
          
          return result
        })

        const batchResults = await Promise.all(batchPromises)
        embeddings.push(...batchResults)

        // Add small delay between batches to avoid rate limiting
        if (i + batchSize < request.texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      return {
        embeddings,
        total_tokens: totalTokens,
        processing_time_ms: Date.now() - startTime,
        cached_count: cachedCount
      }

    } catch {
      console.error('Error generating batch embeddings:', error)
      throw error
    }
  }

  async storeEmbedding(
    chunkId: string,
    documentId: string,
    embedding: number[],
    model: string = 'text-embedding-ada-002'
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('document_embeddings')
        .insert({
          chunk_id: chunkId,
          document_id: documentId,
          embedding,
          embedding_model: model,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing embedding:', error)
        return false
      }

      return true
    } catch {
      console.error('Error storing embedding:', error)
      return false
    }
  }

  async searchSimilarEmbeddings(
    queryEmbedding: number[],
    options: {
      similarity_threshold?: number
      max_results?: number
      document_types?: string[]
      date_range?: { start?: string, end?: string }
    } = {}
  ): Promise<Array<{
    chunk_id: string
    document_id: string
    similarity_score: number
    chunk_content: string
    document_title: string
    document_type: string
    metadata: Record<string, unknown>
  }>> {
    try {
      const threshold = options.similarity_threshold || 0.7
      const maxResults = options.max_results || 10

      // Build the query with filters
      let rpcCall = this.supabase.rpc('search_similar_chunks', {
        query_embedding: queryEmbedding,
        similarity_threshold: threshold,
        max_results: maxResults
      })

      const { data, error } = await rpcCall

      if (error) {
        console.error('Error searching similar embeddings:', error)
        throw error
      }

      // Apply additional filters if needed
      let results = data || []

      if (options.document_types && options.document_types.length > 0) {
        results = results.filter(result => 
          options.document_types!.includes(result.document_type)
        )
      }

      if (options.date_range) {
        results = results.filter(result => {
          const docDate = new Date(result.created_at)
          const start = options.date_range!.start ? new Date(options.date_range!.start) : null
          const end = options.date_range!.end ? new Date(options.date_range!.end) : null
          
          if (start && docDate < start) return false
          if (end && docDate > end) return false
          return true
        })
      }

      return results.slice(0, maxResults)

    } catch {
      console.error('Error searching similar embeddings:', error)
      throw error
    }
  }

  private async callEmbeddingAPI(text: string): Promise<{
    embedding: number[]
    model: string
    usage?: { total_tokens: number }
  }> {
    const response = await fetch('/api/ai/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Embedding API error: ${response.statusText} - ${errorData.error || 'Unknown error'}`)
    }

    return await response.json()
  }

  private cleanText(text: string): string {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ')
    
    // Remove control characters but keep line breaks
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    
    // Normalize quotes
    cleaned = cleaned.replace(/[""]/g, '"')
    cleaned = cleaned.replace(/['']/g, "'")
    
    return cleaned.trim()
  }

  private getCacheKey(text: string): string {
    // Create a hash of the text for caching
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  private getFromCache(key: string): { embedding: number[], timestamp: number } | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return cached
  }

  private addToCache(key: string, embedding: number[]): void {
    // Clean up old entries if cache is getting too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, Math.floor(this.MAX_CACHE_SIZE / 2))
      oldestKeys.forEach(k => this.cache.delete(k))
    }

    this.cache.set(key, {
      embedding,
      timestamp: Date.now()
    })
  }

  private estimateTokens(text: string): number {
    // Improved token estimation based on OpenAI's tokenizer patterns
    const words = text.split(/\s+/).length
    const chars = text.length
    
    // Account for punctuation, special characters, and word boundaries
    const punctuation = (text.match(/[.,;:!?()[\]{}'"]/g) || []).length
    const numbers = (text.match(/\d+/g) || []).length
    
    // Rough estimation: average word = 1.3 tokens, with adjustments
    return Math.ceil(words * 1.3 + punctuation * 0.5 + numbers * 0.8)
  }

  // Analytics and monitoring
  async getEmbeddingStats(): Promise<{
    total_embeddings: number
    embeddings_by_model: Record<string, number>
    storage_usage_mb: number
    cache_hit_rate: number
    avg_similarity_scores: number[]
  }> {
    try {
      const { data: embeddings } = await this.supabase
        .from('document_embeddings')
        .select('embedding_model, created_at')

      const { data: recentSearches } = await this.supabase
        .from('rag_search_queries')
        .select('metadata')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100)

      const totalEmbeddings = embeddings?.length || 0
      const embeddingsByModel = embeddings?.reduce((acc, emb) => {
        acc[emb.embedding_model] = (acc[emb.embedding_model] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Estimate storage usage (1536 dimensions * 4 bytes per float)
      const storageUsageMB = (totalEmbeddings * 1536 * 4) / (1024 * 1024)

      return {
        total_embeddings: totalEmbeddings,
        embeddings_by_model: embeddingsByModel,
        storage_usage_mb: Math.round(storageUsageMB * 100) / 100,
        cache_hit_rate: this.calculateCacheHitRate(),
        avg_similarity_scores: []
      }
    } catch {
      console.error('Error getting embedding stats:', error)
      throw error
    }
  }

  private calculateCacheHitRate(): number {
    // This would need to be tracked over time in a real implementation
    return 0.15 // Placeholder: 15% cache hit rate
  }

  // Cleanup and maintenance
  async cleanupOldEmbeddings(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
      
      const { data, error } = await this.supabase
        .from('document_embeddings')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id')

      if (error) throw error

      return data?.length || 0
    } catch {
      console.error('Error cleaning up old embeddings:', error)
      throw error
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const embeddingService = new EmbeddingService() 