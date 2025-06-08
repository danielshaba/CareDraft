import { vectorStorage } from './vector-storage'
import { embeddingService } from './embedding-service'
import { ragService } from './rag'
import { SearchOptions, SearchResultWithContext, DocumentType } from '@/types/rag'

export interface RAGQueryRequest {
  query: string
  context?: string
  search_options?: SearchOptions & {
    hybrid_weight?: number
    rerank_results?: boolean
    include_citations?: boolean
  }
  generation_options?: {
    max_tokens?: number
    temperature?: number
    model?: string
    system_prompt?: string
    response_format?: 'detailed' | 'concise' | 'bullet_points'
  }
}

export interface RAGQueryResponse {
  success: boolean
  query: string
  response: string
  sources: SearchResultWithContext[]
  confidence_score: number
  processing_time_ms: number
  token_usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  citations?: string[]
  error?: string
}

export interface QueryAnalysis {
  intent: 'factual' | 'procedural' | 'comparative' | 'creative' | 'analytical'
  complexity: 'simple' | 'moderate' | 'complex'
  domain_relevance: number
  suggested_search_strategy: 'semantic' | 'keyword' | 'hybrid'
  key_terms: string[]
}

export class RAGQueryPipeline {
  private readonly CONFIDENCE_THRESHOLD = 0.6
  private readonly MAX_CONTEXT_LENGTH = 4000
  private readonly DEFAULT_MAX_SOURCES = 5

  async processQuery(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    const startTime = Date.now()
    
    try {
      console.log(`Processing RAG query: "${request.query}"`)

      // Step 1: Analyze query to optimize search strategy
      const queryAnalysis = await this.analyzeQuery(request.query)
      console.log('Query analysis:', queryAnalysis)

      // Step 2: Perform enhanced similarity search
      const searchResults = await this.performEnhancedSearch(
        request.query,
        queryAnalysis,
        request.search_options
      )

      if (searchResults.length === 0) {
        return {
          success: false,
          query: request.query,
          response: "I couldn't find relevant information in the knowledge base to answer your question.",
          sources: [],
          confidence_score: 0,
          processing_time_ms: Date.now() - startTime,
          error: "No relevant sources found"
        }
      }

      // Step 3: Rerank results if requested
      const rankedResults = request.search_options?.rerank_results 
        ? await this.rerankResults(request.query, searchResults)
        : searchResults

      // Step 4: Build context from top results
      const context = this.buildContext(rankedResults, request.context)

      // Step 5: Generate LLM response
      const llmResponse = await this.generateResponse(
        request.query,
        context,
        rankedResults,
        queryAnalysis,
        request.generation_options
      )

      // Step 6: Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(
        rankedResults,
        llmResponse.response,
        queryAnalysis
      )

      // Step 7: Extract citations if requested
      const citations = request.search_options?.include_citations
        ? this.extractCitations(rankedResults)
        : undefined

      return {
        success: true,
        query: request.query,
        response: llmResponse.response,
        sources: rankedResults.slice(0, this.DEFAULT_MAX_SOURCES),
        confidence_score: confidenceScore,
        processing_time_ms: Date.now() - startTime,
        token_usage: llmResponse.token_usage,
        citations
      }

    } catch {
      console.error('RAG query pipeline error:', error)
      return {
        success: false,
        query: request.query,
        response: "I encountered an error while processing your question. Please try again.",
        sources: [],
        confidence_score: 0,
        processing_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async analyzeQuery(query: string): Promise<QueryAnalysis> {
    try {
      // Simple rule-based query analysis
      const lowerQuery = query.toLowerCase()
      
      // Determine intent
      let intent: QueryAnalysis['intent'] = 'factual'
      if (lowerQuery.includes('how to') || lowerQuery.includes('steps') || lowerQuery.includes('process')) {
        intent = 'procedural'
      } else if (lowerQuery.includes('compare') || lowerQuery.includes('difference') || lowerQuery.includes('vs')) {
        intent = 'comparative'
      } else if (lowerQuery.includes('create') || lowerQuery.includes('generate') || lowerQuery.includes('suggest')) {
        intent = 'creative'
      } else if (lowerQuery.includes('analyze') || lowerQuery.includes('evaluate') || lowerQuery.includes('assess')) {
        intent = 'analytical'
      }

      // Determine complexity
      const complexity = query.split(' ').length > 15 ? 'complex' : 
                        query.split(' ').length > 8 ? 'moderate' : 'simple'

      // Extract key terms (simple approach)
      const keyTerms = query
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['what', 'how', 'when', 'where', 'why', 'which', 'that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word))
        .slice(0, 5)

      // Care sector relevance (simple keyword matching)
      const careSectorTerms = ['care', 'patient', 'resident', 'medication', 'assessment', 'compliance', 'cqc', 'safeguarding', 'policy', 'procedure']
      const domainRelevance = careSectorTerms.some(term => lowerQuery.includes(term)) ? 0.8 : 0.4

      // Suggest search strategy
      const suggested_search_strategy = intent === 'factual' ? 'semantic' : 
                                      intent === 'procedural' ? 'hybrid' : 'semantic'

      return {
        intent,
        complexity,
        domain_relevance: domainRelevance,
        suggested_search_strategy,
        key_terms: keyTerms
      }

    } catch {
      console.error('Query analysis error:', error)
      return {
        intent: 'factual',
        complexity: 'simple',
        domain_relevance: 0.5,
        suggested_search_strategy: 'hybrid',
        key_terms: []
      }
    }
  }

  private async performEnhancedSearch(
    query: string,
    analysis: QueryAnalysis,
    options?: SearchOptions & { hybrid_weight?: number }
  ): Promise<SearchResultWithContext[]> {
    try {
      const searchOptions: SearchOptions = {
        max_results: options?.max_results || 10,
        similarity_threshold: options?.similarity_threshold || 0.6,
        document_types: options?.document_types,
        date_range: options?.date_range,
        include_metadata: true
      }

      // Adjust search strategy based on analysis
      if (analysis.suggested_search_strategy === 'semantic') {
        const embeddingResponse = await embeddingService.generateEmbedding({ text: query })
        return await vectorStorage.searchVectors(embeddingResponse.embedding, searchOptions)
      } else {
        // Use hybrid search with adjusted weights
        const semanticWeight = options?.hybrid_weight || 0.7
        const keywordWeight = 1 - semanticWeight
        
        return await vectorStorage.hybridSearch(query, {
          ...searchOptions,
          semantic_weight: semanticWeight,
          keyword_weight: keywordWeight
        })
      }

    } catch {
      console.error('Enhanced search error:', error)
      return []
    }
  }

  private async rerankResults(
    query: string,
    results: SearchResultWithContext[]
  ): Promise<SearchResultWithContext[]> {
    try {
      // Simple reranking based on query term overlap and recency
      return results
        .map(result => {
          const queryTerms = query.toLowerCase().split(/\s+/)
          const contentTerms = result.chunk_content.toLowerCase().split(/\s+/)
          
          // Calculate term overlap
          const overlap = queryTerms.filter(term => 
            contentTerms.some(contentTerm => contentTerm.includes(term))
          ).length / queryTerms.length

          // Boost recent documents
          const recencyBoost = result.metadata?.created_at ? 
            Math.max(0, 1 - (Date.now() - new Date(result.metadata.created_at).getTime()) / (365 * 24 * 60 * 60 * 1000)) * 0.1 : 0

          return {
            ...result,
            similarity_score: result.similarity_score + overlap * 0.2 + recencyBoost
          }
        })
        .sort((a, b) => b.similarity_score - a.similarity_score)

    } catch {
      console.error('Reranking error:', error)
      return results
    }
  }

  private buildContext(
    results: SearchResultWithContext[],
    additionalContext?: string
  ): string {
    try {
      let context = additionalContext ? `Additional Context: ${additionalContext}\n\n` : ''
      
      context += 'Relevant Information:\n\n'
      
      let currentLength = context.length
      
      for (const result of results) {
        const sourceInfo = `Source: ${result.document_title} (${result.document_type})\n`
        const content = `${result.chunk_content}\n\n`
        
        if (currentLength + sourceInfo.length + content.length > this.MAX_CONTEXT_LENGTH) {
          break
        }
        
        context += sourceInfo + content
        currentLength += sourceInfo.length + content.length
      }

      return context.trim()

    } catch {
      console.error('Context building error:', error)
      return additionalContext || ''
    }
  }

  private async generateResponse(
    query: string,
    context: string,
    sources: SearchResultWithContext[],
    analysis: QueryAnalysis,
    options?: {
      max_tokens?: number
      temperature?: number
      model?: string
      system_prompt?: string
      response_format?: 'detailed' | 'concise' | 'bullet_points'
    }
  ) {
    try {
      const systemPrompt = options?.system_prompt || this.buildSystemPrompt(analysis, options?.response_format)
      
      const prompt = `${systemPrompt}

Context Information:
${context}

User Question: ${query}

Please provide a helpful and accurate response based on the context information provided.`

      // Use the existing RAG service to generate response
      const response = await ragService.generateResponse({
        query: prompt,
        context: '',
        sources: sources,
        max_tokens: options?.max_tokens || 500,
        temperature: options?.temperature || 0.7
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate response')
      }

      return {
        response: response.response || 'I apologize, but I was unable to generate a response.',
        token_usage: response.token_usage
      }

    } catch {
      console.error('Response generation error:', error)
      return {
        response: 'I encountered an error while generating a response. Please try again.',
        token_usage: undefined
      }
    }
  }

  private buildSystemPrompt(analysis: QueryAnalysis, format?: string): string {
    let basePrompt = "You are a helpful AI assistant specializing in care sector knowledge and documentation. "
    
    switch (analysis.intent) {
      case 'procedural':
        basePrompt += "Provide clear, step-by-step instructions when answering procedural questions. "
        break
      case 'comparative':
        basePrompt += "When comparing items, clearly highlight similarities and differences. "
        break
      case 'analytical':
        basePrompt += "Provide thorough analysis with supporting evidence from the context. "
        break
      default:
        basePrompt += "Provide accurate, factual information based on the context provided. "
    }

    switch (format) {
      case 'concise':
        basePrompt += "Keep your response concise and to the point. "
        break
      case 'bullet_points':
        basePrompt += "Format your response using bullet points for clarity. "
        break
      case 'detailed':
      default:
        basePrompt += "Provide a comprehensive response with relevant details. "
    }

    basePrompt += "Always cite your sources and indicate if information is not available in the provided context."

    return basePrompt
  }

  private calculateConfidenceScore(
    sources: SearchResultWithContext[],
    response: string,
    analysis: QueryAnalysis
  ): number {
    try {
      if (sources.length === 0) return 0

      // Base confidence from source similarity scores
      const avgSimilarity = sources.reduce((sum, source) => sum + source.similarity_score, 0) / sources.length
      
      // Boost for domain relevance
      const domainBoost = analysis.domain_relevance * 0.2
      
      // Boost for multiple sources
      const sourceCountBoost = Math.min(sources.length / 5, 1) * 0.1
      
      // Penalty for very short responses (might indicate lack of information)
      const lengthPenalty = response.length < 100 ? 0.2 : 0

      const confidence = Math.min(1, Math.max(0, avgSimilarity + domainBoost + sourceCountBoost - lengthPenalty))
      
      return Math.round(confidence * 100) / 100

    } catch {
      console.error('Confidence calculation error:', error)
      return 0.5
    }
  }

  private extractCitations(sources: SearchResultWithContext[]): string[] {
    try {
      return sources.map((source, index) => 
        `[${index + 1}] ${source.document_title} (${source.document_type})`
      )
    } catch {
      console.error('Citation extraction error:', error)
      return []
    }
  }

  async batchProcessQueries(queries: string[]): Promise<RAGQueryResponse[]> {
    try {
      const results = await Promise.all(
        queries.map(query => this.processQuery({ query }))
      )
      return results
    } catch {
      console.error('Batch processing error:', error)
      return queries.map(query => ({
        success: false,
        query,
        response: 'Error processing query',
        sources: [],
        confidence_score: 0,
        processing_time_ms: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  async getQuerySuggestions(partialQuery: string): Promise<string[]> {
    try {
      // Simple query suggestions based on common patterns
      const suggestions = [
        `How to ${partialQuery}`,
        `What is ${partialQuery}`,
        `${partialQuery} policy`,
        `${partialQuery} procedure`,
        `${partialQuery} compliance requirements`
      ]
      
      return suggestions.filter(s => s.length > partialQuery.length + 5)
    } catch {
      console.error('Query suggestions error:', error)
      return []
    }
  }
}

export const ragQueryPipeline = new RAGQueryPipeline() 