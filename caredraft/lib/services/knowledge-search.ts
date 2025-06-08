'use client'

import { supabase } from '@/lib/supabase'

// Types for search functionality
export interface SearchResult {
  id: string
  title: string
  content: string
  excerpt: string
  type: 'document' | 'policy' | 'template' | 'research' | 'news' | 'compliance'
  source: string
  url?: string
  date: string
  relevanceScore: number
  metadata: {
    author?: string
    tags: string[]
    fileType?: string
    wordCount?: number
    lastModified?: string
  }
}

export interface SearchQuery {
  query: string
  useLibraryAI: boolean
  useInternetAI: boolean
  filters: {
    contentType: string
    dateRange: string
    source: string
    sortBy: string
    tags?: string[]
  }
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  searchTime: number
  aiSummary?: string
  suggestedQueries?: string[]
  facets: {
    contentTypes: { [key: string]: number }
    sources: { [key: string]: number }
    tags: { [key: string]: number }
  }
}

// Mock document database for demonstration
const mockDocuments: SearchResult[] = [
  {
    id: '1',
    title: 'CQC Inspection Preparation Guide',
    content: 'Comprehensive guide for preparing for CQC inspections in care homes...',
    excerpt: 'Essential steps and documentation required for successful CQC inspections including staff training records, care plans, and safety protocols.',
    type: 'document',
    source: 'internal',
    date: '2024-01-15',
    relevanceScore: 0.95,
    metadata: {
      author: 'Quality Team',
      tags: ['cqc', 'inspection', 'compliance', 'care-standards'],
      fileType: 'pdf',
      wordCount: 2500,
      lastModified: '2024-01-15'
    }
  },
  {
    id: '2',
    title: 'Medication Management Best Practices',
    content: 'Guidelines for safe medication administration and storage in care settings...',
    excerpt: 'Best practices for medication management including storage, administration, documentation, and staff training requirements.',
    type: 'policy',
    source: 'internal',
    date: '2024-02-01',
    relevanceScore: 0.88,
    metadata: {
      author: 'Clinical Team',
      tags: ['medication', 'safety', 'clinical-care', 'staff-training'],
      fileType: 'pdf',
      wordCount: 1800,
      lastModified: '2024-02-01'
    }
  },
  {
    id: '3',
    title: 'Care Plan Template - Dementia Care',
    content: 'Standardized care plan template specifically designed for dementia care residents...',
    excerpt: 'Comprehensive care plan template covering cognitive assessment, behavioral management, and person-centered care approaches for dementia.',
    type: 'template',
    source: 'internal',
    date: '2024-01-20',
    relevanceScore: 0.82,
    metadata: {
      author: 'Care Team',
      tags: ['dementia', 'care-plans', 'person-centered', 'templates'],
      fileType: 'doc',
      wordCount: 1200,
      lastModified: '2024-01-20'
    }
  },
  {
    id: '4',
    title: 'Staff Training Requirements 2024',
    content: 'Updated mandatory training requirements for all care home staff...',
    excerpt: 'Complete overview of mandatory training including safeguarding, health and safety, infection control, and specialized care training.',
    type: 'document',
    source: 'internal',
    date: '2024-01-10',
    relevanceScore: 0.79,
    metadata: {
      author: 'HR Department',
      tags: ['staff-training', 'mandatory-training', 'compliance', 'hr'],
      fileType: 'pdf',
      wordCount: 3200,
      lastModified: '2024-01-10'
    }
  },
  {
    id: '5',
    title: 'Infection Control Protocols',
    content: 'Comprehensive infection prevention and control measures for care homes...',
    excerpt: 'Detailed protocols for infection prevention including PPE usage, cleaning procedures, outbreak management, and staff health monitoring.',
    type: 'policy',
    source: 'internal',
    date: '2024-01-25',
    relevanceScore: 0.76,
    metadata: {
      author: 'Infection Control Team',
      tags: ['infection-control', 'ppe', 'cleaning', 'health-safety'],
      fileType: 'pdf',
      wordCount: 2800,
      lastModified: '2024-01-25'
    }
  }
]

export class KnowledgeSearchService {
  private static instance: KnowledgeSearchService
  private searchHistory: string[] = []

  static getInstance(): KnowledgeSearchService {
    if (!KnowledgeSearchService.instance) {
      KnowledgeSearchService.instance = new KnowledgeSearchService()
    }
    return KnowledgeSearchService.instance
  }

  // Main search function that combines traditional and AI-powered search
  async search(searchQuery: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now()
    
    try {
      let results: SearchResult[] = []
      let aiSummary: string | undefined
      let suggestedQueries: string[] = []

      // Traditional keyword search
      const keywordResults = await this.performKeywordSearch(searchQuery)
      results = [...keywordResults]

      // AI-powered semantic search if Library AI is enabled
      if (searchQuery.useLibraryAI) {
        const semanticResults = await this.performSemanticSearch(searchQuery)
        results = this.mergeAndRankResults(results, semanticResults)
        
        // Generate AI summary of search results
        aiSummary = await this.generateSearchSummary(searchQuery.query, results.slice(0, 5))
        
        // Generate suggested queries
        suggestedQueries = await this.generateSuggestedQueries(searchQuery.query, results)
      }

      // External web search if Internet AI is enabled
      if (searchQuery.useInternetAI) {
        const webResults = await this.performWebSearch(searchQuery)
        results = [...results, ...webResults]
      }

      // Apply filters
      results = this.applyFilters(results, searchQuery.filters)

      // Sort results
      results = this.sortResults(results, searchQuery.filters.sortBy)

      // Generate facets for filtering
      const facets = this.generateFacets(results)

      // Add to search history
      this.addToSearchHistory(searchQuery.query)

      const searchTime = Date.now() - startTime

      return {
        results,
        totalCount: results.length,
        searchTime,
        aiSummary,
        suggestedQueries,
        facets
      }
    } catch {
      console.error('Search error:', error)
      throw new Error('Search failed. Please try again.')
    }
  }

  // Traditional keyword-based search
  private async performKeywordSearch(searchQuery: SearchQuery): Promise<SearchResult[]> {
    const query = searchQuery.query.toLowerCase()
    
    return mockDocuments.filter(doc => {
      const searchableText = `${doc.title} ${doc.content} ${doc.excerpt} ${doc.metadata.tags.join(' ')}`.toLowerCase()
      return searchableText.includes(query)
    }).map(doc => ({
      ...doc,
      relevanceScore: this.calculateKeywordRelevance(doc, query)
    }))
  }

  // AI-powered semantic search using embeddings
  private async performSemanticSearch(searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      // In a real implementation, this would:
      // 1. Generate embeddings for the search query
      // 2. Perform vector similarity search against document embeddings
      // 3. Use the existing AI infrastructure to enhance results
      
      // For now, simulate semantic search with enhanced keyword matching
      const enhancedQuery = await this.enhanceQueryWithAI(searchQuery.query)
      
      return mockDocuments.filter(doc => {
        const searchableText = `${doc.title} ${doc.content} ${doc.excerpt} ${doc.metadata.tags.join(' ')}`.toLowerCase()
        return enhancedQuery.some(term => searchableText.includes(term.toLowerCase()))
      }).map(doc => ({
        ...doc,
        relevanceScore: this.calculateSemanticRelevance(doc, enhancedQuery)
      }))
    } catch {
      console.error('Semantic search error:', error)
      return []
    }
  }

  // External web search simulation
  private async performWebSearch(searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      // Use AI-powered web research service
      const response = await fetch('/api/web-research/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.query,
          maxResults: 15,
          type: 'web'
        })
      })

      if (!response.ok) {
        console.error('Web search failed:', response.statusText)
        return this.getFallbackWebResults(searchQuery)
      }

      const data = await response.json()
      const webResults = (data.results || []).map((result: unknown) => ({
        id: result.id,
        title: result.title,
        content: result.snippet,
        excerpt: result.snippet.substring(0, 200) + '...',
        type: this.categorizeWebResult(result) as SearchResult['type'],
        source: result.source,
        url: result.url,
        date: result.publishedAt ? new Date(result.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        relevanceScore: result.relevanceScore || 0.7,
        metadata: {
          tags: this.extractTagsFromWebResult(result),
          fileType: 'web',
          wordCount: result.metadata?.wordCount || 0
        }
      }))

      return webResults

    } catch {
      console.error('Web search error:', error)
      return this.getFallbackWebResults(searchQuery)
    }
  }

  private getFallbackWebResults(searchQuery: SearchQuery): SearchResult[] {
    // Fallback to mock results when web search fails
    const fallbackResults: SearchResult[] = [
      {
        id: 'web-fallback-1',
        title: 'CQC Latest Guidelines Update',
        content: 'Recent updates to CQC inspection guidelines with new focus areas for 2024.',
        excerpt: 'The Care Quality Commission has updated its inspection guidelines with new focus areas for 2024.',
        type: 'news',
        source: 'cqc',
        url: 'https://www.cqc.org.uk/guidance',
        date: '2024-02-15',
        relevanceScore: 0.85,
        metadata: {
          tags: ['cqc', 'guidelines', 'updates', '2024'],
          fileType: 'web'
        }
      },
      {
        id: 'web-fallback-2',
        title: 'NHS Social Care Standards',
        content: 'Official NHS guidance on social care standards and best practices.',
        excerpt: 'Comprehensive guidance on implementing social care standards across different care settings.',
        type: 'compliance',
        source: 'nhs',
        url: 'https://www.england.nhs.uk/social-care/',
        date: '2024-02-10',
        relevanceScore: 0.80,
        metadata: {
          tags: ['nhs', 'social-care', 'standards', 'compliance'],
          fileType: 'web'
        }
      }
    ]

    return fallbackResults.filter(result => 
      result.title.toLowerCase().includes(searchQuery.query.toLowerCase()) ||
      result.content.toLowerCase().includes(searchQuery.query.toLowerCase())
    )
  }

  private categorizeWebResult(result: unknown): string {
    const domain = result.source?.toLowerCase() || ''
    const title = result.title?.toLowerCase() || ''
    
    if (domain.includes('cqc') || title.includes('inspection') || title.includes('regulation')) {
      return 'compliance'
    } else if (domain.includes('nhs') || title.includes('clinical') || title.includes('medical')) {
      return 'research'
    } else if (title.includes('news') || title.includes('update') || title.includes('announcement')) {
      return 'news'
    } else if (title.includes('policy') || title.includes('guideline') || title.includes('standard')) {
      return 'policy'
    } else {
      return 'document'
    }
  }

  private extractTagsFromWebResult(result: unknown): string[] {
    const tags: string[] = []
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    
    // Common care sector keywords
    const keywords = [
      'care', 'elderly', 'dementia', 'nursing', 'residential', 'domiciliary',
      'cqc', 'inspection', 'compliance', 'safety', 'medication', 'training',
      'safeguarding', 'infection-control', 'quality', 'standards'
    ]
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword)
      }
    })
    
    return tags.slice(0, 5) // Limit to 5 tags
  }

  // Enhance search query using AI
  private async enhanceQueryWithAI(query: string): Promise<string[]> {
    try {
      // Use the existing AI infrastructure to expand the query
      const response = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ideas',
          context: `Search query: "${query}"`,
          prompt: `Generate related search terms and synonyms for: "${query}"`
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Extract keywords from AI response
        const keywords = data.ideas?.map((idea: unknown) => idea.title) || []
        return [query, ...keywords]
      }
    } catch {
      console.error('AI query enhancement error:', error)
    }
    
    return [query]
  }

  // Generate AI summary of search results
  private async generateSearchSummary(query: string, results: SearchResult[]): Promise<string> {
    try {
      const context = results.map(r => `${r.title}: ${r.excerpt}`).join('\n')
      
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'executive',
          content: context,
          prompt: `Summarize the key findings for the search query: "${query}"`
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.summary || 'No summary available.'
      }
    } catch {
      console.error('AI summary generation error:', error)
    }
    
    return 'Search completed successfully.'
  }

  // Generate suggested queries based on results
  private async generateSuggestedQueries(query: string, results: SearchResult[]): Promise<string[]> {
    try {
      const tags = results.flatMap(r => r.metadata.tags).slice(0, 10)
      const context = `Original query: "${query}"\nRelated topics: ${tags.join(', ')}`
      
      const response = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ideas',
          context,
          prompt: 'Generate 3-5 related search queries that might be helpful'
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.ideas?.map((idea: unknown) => idea.title).slice(0, 5) || []
      }
    } catch {
      console.error('Suggested queries generation error:', error)
    }
    
    return []
  }

  // Merge and rank results from different search methods
  private mergeAndRankResults(keywordResults: SearchResult[], semanticResults: SearchResult[]): SearchResult[] {
    const merged = new Map<string, SearchResult>()
    
    // Add keyword results
    keywordResults.forEach(result => {
      merged.set(result.id, result)
    })
    
    // Add semantic results, boosting score if already exists
    semanticResults.forEach(result => {
      if (merged.has(result.id)) {
        const existing = merged.get(result.id)!
        existing.relevanceScore = Math.max(existing.relevanceScore, result.relevanceScore) * 1.2
      } else {
        merged.set(result.id, result)
      }
    })
    
    return Array.from(merged.values()).sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  // Apply search filters
  private applyFilters(results: SearchResult[], filters: unknown): SearchResult[] {
    let filtered = results

    // Content type filter
    if (filters.contentType !== 'all') {
      filtered = filtered.filter(r => r.type === filters.contentType)
    }

    // Source filter
    if (filters.source !== 'all') {
      filtered = filtered.filter(r => r.source === filters.source)
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setDate(now.getDate() - 1)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(r => new Date(r.date) >= filterDate)
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(r => 
        filters.tags.some((tag: string) => r.metadata.tags.includes(tag))
      )
    }

    return filtered
  }

  // Sort search results
  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    switch (sortBy) {
      case 'date':
        return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      case 'title':
        return results.sort((a, b) => a.title.localeCompare(b.title))
      case 'type':
        return results.sort((a, b) => a.type.localeCompare(b.type))
      case 'popularity':
        // Simulate popularity based on metadata
        return results.sort((a, b) => (b.metadata.wordCount || 0) - (a.metadata.wordCount || 0))
      case 'relevance':
      default:
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
  }

  // Generate facets for filtering UI
  private generateFacets(results: SearchResult[]) {
    const facets = {
      contentTypes: {} as { [key: string]: number },
      sources: {} as { [key: string]: number },
      tags: {} as { [key: string]: number }
    }

    results.forEach(result => {
      // Content types
      facets.contentTypes[result.type] = (facets.contentTypes[result.type] || 0) + 1
      
      // Sources
      facets.sources[result.source] = (facets.sources[result.source] || 0) + 1
      
      // Tags
      result.metadata.tags.forEach(tag => {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1
      })
    })

    return facets
  }

  // Calculate keyword relevance score
  private calculateKeywordRelevance(doc: SearchResult, query: string): number {
    const title = doc.title.toLowerCase()
    const content = doc.content.toLowerCase()
    const excerpt = doc.excerpt.toLowerCase()
    
    let score = 0
    
    // Title matches get highest weight
    if (title.includes(query)) score += 0.5
    
    // Content matches
    if (content.includes(query)) score += 0.3
    
    // Excerpt matches
    if (excerpt.includes(query)) score += 0.2
    
    // Tag matches
    const tagMatches = doc.metadata.tags.filter(tag => 
      tag.toLowerCase().includes(query)
    ).length
    score += tagMatches * 0.1
    
    return Math.min(score, 1.0)
  }

  // Calculate semantic relevance score
  private calculateSemanticRelevance(doc: SearchResult, enhancedQuery: string[]): number {
    const searchableText = `${doc.title} ${doc.content} ${doc.excerpt} ${doc.metadata.tags.join(' ')}`.toLowerCase()
    
    let score = 0
    enhancedQuery.forEach((term, index) => {
      if (searchableText.includes(term.toLowerCase())) {
        // First term (original query) gets highest weight
        score += index === 0 ? 0.6 : 0.1
      }
    })
    
    return Math.min(score, 1.0)
  }

  // Search history management
  private addToSearchHistory(query: string) {
    if (query.trim() && !this.searchHistory.includes(query)) {
      this.searchHistory.unshift(query)
      this.searchHistory = this.searchHistory.slice(0, 10) // Keep last 10 searches
    }
  }

  getSearchHistory(): string[] {
    return [...this.searchHistory]
  }

  clearSearchHistory() {
    this.searchHistory = []
  }
} 