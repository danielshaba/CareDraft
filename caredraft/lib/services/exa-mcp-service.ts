import { ExaAIConfig, SearchToolType } from '../config/exa-ai'

// Types for MCP tool responses
export interface ExaWebSearchResult {
  title: string
  url: string
  snippet: string
  id?: string
}

export interface ExaResearchPaperResult {
  title: string
  url: string
  snippet: string
  authors?: string[]
  publishedDate?: string
  journal?: string
  id?: string
}

export interface ExaCompanyResult {
  title: string
  url: string
  snippet: string
  company?: string
  sector?: string
  id?: string
}

export interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  score: number
  source: SearchToolType
  timestamp: Date
  metadata?: {
    domain?: string
    credibilityScore?: number
    careIndustryRelevance?: number
    publishedDate?: string
    author?: string
    type?: string
  }
}

export interface SearchOptions {
  maxResults?: number
  tool?: SearchToolType
  careIndustryFocus?: boolean
  maxCharacters?: number
}

export interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  searchTime: number
  query: string
  tool: SearchToolType
  metadata: {
    careOptimized: boolean
    resultsFiltered: number
    credibilityScored: boolean
  }
}

export class ExaMCPService {
  private config: ExaAIConfig
  private requestCount: Map<SearchToolType, number> = new Map()
  private lastRequestTime: Map<SearchToolType, number> = new Map()

  constructor(config: ExaAIConfig) {
    this.config = config
  }

  private isRateLimited(tool: SearchToolType): boolean {
    const limit = this.config.rateLimits[tool]
    const count = this.requestCount.get(tool) || 0
    const lastTime = this.lastRequestTime.get(tool) || 0
    const now = Date.now()

    // Reset counter if window has passed
    if (now - lastTime > limit.windowMs) {
      this.requestCount.set(tool, 0)
      this.lastRequestTime.set(tool, now)
      return false
    }

    return count >= limit.maxRequests
  }

  private updateRateLimit(tool: SearchToolType): void {
    const count = this.requestCount.get(tool) || 0
    this.requestCount.set(tool, count + 1)
    
    if (!this.lastRequestTime.has(tool)) {
      this.lastRequestTime.set(tool, Date.now())
    }
  }

  private optimizeQueryForCare(query: string): string {
    if (!this.config.careIndustryOptimization.enabled) {
      return query
    }

    const keywords = this.config.careIndustryOptimization.keywords
    const hasKeywords = keywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    )

    if (!hasKeywords) {
      return `${query} care healthcare nursing elderly residential`
    }

    return query
  }

  private calculateCredibilityScore(url: string): number {
    const priorityDomains = this.config.careIndustryOptimization.priorityDomains
    const domain = new URL(url).hostname.toLowerCase()
    
    for (const priorityDomain of priorityDomains) {
      if (domain.includes(priorityDomain)) {
        return 0.9 + Math.random() * 0.1 // 0.9-1.0 for priority domains
      }
    }
    
    return 0.5 + Math.random() * 0.4 // 0.5-0.9 for other domains
  }

  private calculateCareRelevance(title: string, snippet: string): number {
    const keywords = this.config.careIndustryOptimization.keywords
    const text = `${title} ${snippet}`.toLowerCase()
    
    let relevanceScore = 0
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        relevanceScore += 0.2
      }
    }
    
    return Math.min(relevanceScore, 1.0)
  }

  // MCP Tool Integration Methods - These would call actual MCP tools in production
  async callWebSearchMCP(query: string, numResults: number = 5): Promise<ExaWebSearchResult[]> {
    // In production, this would call the actual MCP tool: mcp_exa_web_search_exa
    console.log(`[MCP] Calling web search for: "${query}" (${numResults} results)`)
    
    // Simulated response matching MCP tool structure
    return [
      {
        id: `web-${Date.now()}-1`,
        title: "NHS Care Quality Framework - Latest Guidelines",
        url: "https://www.cqc.org.uk/guidance-providers/care-homes",
        snippet: "The Care Quality Commission provides comprehensive guidance for care home providers on maintaining quality standards, regulatory compliance, and best practices for elderly residential care services."
      },
      {
        id: `web-${Date.now()}-2`,
        title: "Person-Centered Care in Residential Settings",
        url: "https://www.nhsinform.scot/care-homes/person-centered-care",
        snippet: "Evidence-based approaches to implementing person-centered care models in residential care settings, including assessment frameworks and quality monitoring systems."
      }
    ].slice(0, numResults)
  }

  async callResearchPapersMCP(query: string, numResults: number = 5, maxCharacters: number = 3000): Promise<ExaResearchPaperResult[]> {
    // In production, this would call: mcp_exa_research_paper_search
    console.log(`[MCP] Calling research papers search for: "${query}" (${numResults} results, ${maxCharacters} chars)`)
    
    return [
      {
        id: `research-${Date.now()}-1`,
        title: "Quality of Life Outcomes in Residential Care: A Systematic Review",
        url: "https://www.ncbi.nlm.nih.gov/articles/PMC1234567",
        snippet: "This systematic review examines quality of life outcomes in residential care settings, analyzing 45 studies across 12 countries to identify best practices and key indicators.",
        authors: ["Dr. Sarah Johnson", "Prof. Michael Chen"],
        publishedDate: "2024-03-15",
        journal: "Journal of Geriatric Care Research"
      }
    ].slice(0, numResults)
  }

  async callCompanyResearchMCP(companyName: string, subpages: number = 5): Promise<ExaCompanyResult[]> {
    // In production, this would call: mcp_exa_company_research
    console.log(`[MCP] Calling company research for: "${companyName}" (${subpages} subpages)`)
    
    return [
      {
        id: `company-${Date.now()}-1`,
        title: "Caring Homes Ltd - Company Profile",
        url: "https://www.caringhomes.co.uk/about",
        snippet: "Leading provider of residential care services with over 50 locations across the UK. Specializes in dementia care and person-centered approaches.",
        company: "Caring Homes Ltd",
        sector: "Residential Care"
      }
    ].slice(0, subpages)
  }

  async callCrawlingMCP(url: string): Promise<{content: string; url: string; title: string; extractedDate: string}> {
    // In production, this would call: mcp_exa_crawling
    console.log(`[MCP] Calling crawling for URL: ${url}`)
    
    return {
      content: "Detailed content from the specified URL would be extracted here, including full text, metadata, and structured data relevant to care industry research.",
      url: url,
      title: "Extracted Page Content",
      extractedDate: new Date().toISOString()
    }
  }

  // Public API Methods
  async webSearch(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const tool: SearchToolType = 'webSearch'
    
    if (this.isRateLimited(tool)) {
      throw new Error(`Rate limit exceeded for ${tool}`)
    }

    const startTime = Date.now()
    const optimizedQuery = options.careIndustryFocus !== false 
      ? this.optimizeQueryForCare(query) 
      : query

    try {
      this.updateRateLimit(tool)
      
      const mcpResults = await this.callWebSearchMCP(
        optimizedQuery, 
        options.maxResults || this.config.defaultSettings.maxResults
      )

      const results: SearchResult[] = mcpResults.map((item, index) => ({
        id: item.id || `${tool}-${Date.now()}-${index}`,
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        score: 1 - (index * 0.1),
        source: tool,
        timestamp: new Date(),
        metadata: {
          domain: new URL(item.url).hostname,
          credibilityScore: this.calculateCredibilityScore(item.url),
          careIndustryRelevance: this.calculateCareRelevance(item.title, item.snippet),
          type: 'web_result'
        }
      }))

      return {
        results,
        totalResults: results.length,
        searchTime: Date.now() - startTime,
        query: optimizedQuery,
        tool,
        metadata: {
          careOptimized: options.careIndustryFocus !== false,
          resultsFiltered: 0,
          credibilityScored: true
        }
      }
    } catch {
      console.error('Web search MCP call failed:', error)
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async searchResearchPapers(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const tool: SearchToolType = 'researchPapers'
    
    if (this.isRateLimited(tool)) {
      throw new Error(`Rate limit exceeded for ${tool}`)
    }

    const startTime = Date.now()
    const optimizedQuery = options.careIndustryFocus !== false 
      ? this.optimizeQueryForCare(query) 
      : query

    try {
      this.updateRateLimit(tool)
      
      const mcpResults = await this.callResearchPapersMCP(
        optimizedQuery,
        options.maxResults || this.config.defaultSettings.maxResults,
        options.maxCharacters || 3000
      )

      const results: SearchResult[] = mcpResults.map((item, index) => ({
        id: item.id || `${tool}-${Date.now()}-${index}`,
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        score: 1 - (index * 0.05), // Research papers get higher base scores
        source: tool,
        timestamp: new Date(),
        metadata: {
          domain: new URL(item.url).hostname,
          credibilityScore: 0.9, // Research papers generally have high credibility
          careIndustryRelevance: this.calculateCareRelevance(item.title, item.snippet),
          author: item.authors?.join(', '),
          publishedDate: item.publishedDate,
          type: 'research_paper'
        }
      }))

      return {
        results,
        totalResults: results.length,
        searchTime: Date.now() - startTime,
        query: optimizedQuery,
        tool,
        metadata: {
          careOptimized: options.careIndustryFocus !== false,
          resultsFiltered: 0,
          credibilityScored: true
        }
      }
    } catch {
      console.error('Research paper search MCP call failed:', error)
      throw new Error(`Research paper search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async searchCompanyInfo(companyName: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const tool: SearchToolType = 'companyResearch'
    
    if (this.isRateLimited(tool)) {
      throw new Error(`Rate limit exceeded for ${tool}`)
    }

    const startTime = Date.now()

    try {
      this.updateRateLimit(tool)
      
      const mcpResults = await this.callCompanyResearchMCP(
        companyName,
        options.maxResults || 5
      )

      const results: SearchResult[] = mcpResults.map((item, index) => ({
        id: item.id || `${tool}-${Date.now()}-${index}`,
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        score: 1 - (index * 0.1),
        source: tool,
        timestamp: new Date(),
        metadata: {
          domain: new URL(item.url).hostname,
          credibilityScore: this.calculateCredibilityScore(item.url),
          careIndustryRelevance: this.calculateCareRelevance(item.title, item.snippet),
          type: 'company_info'
        }
      }))

      return {
        results,
        totalResults: results.length,
        searchTime: Date.now() - startTime,
        query: companyName,
        tool,
        metadata: {
          careOptimized: false, // Company search doesn't need care optimization
          resultsFiltered: 0,
          credibilityScored: true
        }
      }
    } catch {
      console.error('Company search MCP call failed:', error)
      throw new Error(`Company search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async crawlUrl(url: string): Promise<{content: string; metadata: unknown}> {
    const tool: SearchToolType = 'crawling'
    
    if (this.isRateLimited(tool)) {
      throw new Error(`Rate limit exceeded for ${tool}`)
    }

    try {
      this.updateRateLimit(tool)
      
      const response = await this.callCrawlingMCP(url)

      return {
        content: response.content,
        metadata: {
          url: response.url,
          title: response.title,
          extractedDate: response.extractedDate,
          credibilityScore: this.calculateCredibilityScore(url)
        }
      }
    } catch {
      console.error('URL crawling MCP call failed:', error)
      throw new Error(`URL crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async intelligentSearch(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    // Determine the best tool based on query characteristics
    const queryLower = query.toLowerCase()
    
    // Research indicators
    if (queryLower.includes('research') || queryLower.includes('study') || 
        queryLower.includes('evidence') || queryLower.includes('systematic review')) {
      return this.searchResearchPapers(query, options)
    }
    
    // Company indicators
    if (queryLower.includes('company') || queryLower.includes('organization') || 
        queryLower.includes('provider') || queryLower.match(/\b\w+\s+(ltd|limited|inc|corp|plc)\b/i)) {
      const companyName = query.replace(/\b(company|organization|provider)\s+/i, '').trim()
      return this.searchCompanyInfo(companyName, options)
    }
    
    // Default to web search
    return this.webSearch(query, options)
  }

  getRateLimitStatus(): Record<SearchToolType, {remaining: number; resetTime: number}> {
    const status: Record<SearchToolType, {remaining: number; resetTime: number}> = {} as any
    
    for (const tool of Object.keys(this.config.rateLimits) as SearchToolType[]) {
      const limit = this.config.rateLimits[tool]
      const count = this.requestCount.get(tool) || 0
      const lastTime = this.lastRequestTime.get(tool) || 0
      const remaining = Math.max(0, limit.maxRequests - count)
      const resetTime = lastTime + limit.windowMs
      
      status[tool] = { remaining, resetTime }
    }
    
    return status
  }

  // Utility method to create service instance with default config
  static createWithDefaults(): ExaMCPService {
    const defaultConfig: ExaAIConfig = {
      rateLimits: {
        webSearch: { maxRequests: 20, windowMs: 60000 },
        researchPapers: { maxRequests: 10, windowMs: 60000 },
        companyResearch: { maxRequests: 5, windowMs: 60000 },
        crawling: { maxRequests: 10, windowMs: 60000 },
        competitorFinder: { maxRequests: 5, windowMs: 60000 },
        linkedinSearch: { maxRequests: 5, windowMs: 60000 },
        wikipediaSearch: { maxRequests: 15, windowMs: 60000 },
        githubSearch: { maxRequests: 10, windowMs: 60000 }
      },
      defaultSettings: {
        maxResults: 5,
        timeout: 30000,
        retryAttempts: 2,
        cacheEnabled: true,
        cacheTTL: 300000
      },
      careIndustryOptimization: {
        enabled: true,
        keywords: ['care', 'healthcare', 'nursing', 'elderly', 'residential', 'clinical', 'medical', 'patient', 'quality', 'safety'],
        priorityDomains: ['nhs.uk', 'cqc.org.uk', 'gov.uk', 'ncbi.nlm.nih.gov', 'cochrane.org']
      }
    }
    
    return new ExaMCPService(defaultConfig)
  }
} 