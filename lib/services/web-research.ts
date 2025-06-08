// Define types locally since knowledge-hub types may not be available yet
export interface ExternalSearchResult {
  id: string
  title: string
  url: string
  snippet: string
  source: string
  type: 'web' | 'news' | 'academic' | 'regulatory' | 'guidance'
  publishedAt: string
  relevanceScore: number
  metadata: {
    domain: string
    wordCount: number
    hasImages: boolean
    isNews: boolean
    language: string
    highlights?: string[]
  }
}

export interface SearchFilters {
  contentType?: string[]
  dateRange?: {
    startDate: Date
    endDate: Date
  }
  source?: string[]
  tags?: string[]
}

export interface WebResearchOptions {
  query: string
  filters?: SearchFilters
  maxResults?: number
  includeCompetitors?: boolean
  includePolicyUpdates?: boolean
  includeResearchPapers?: boolean
}

export interface CompetitorInfo {
  name: string
  url: string
  description: string
  category: string
}

export interface PolicyUpdate {
  title: string
  source: string
  url: string
  publishedAt: string
  summary: string
  category: string
}

export interface ResearchPaper {
  title: string
  authors: string[]
  journal: string
  publishedAt: string
  url: string
  abstract: string
  keywords: string[]
}

export class WebResearchService {
  private static readonly CARE_SECTOR_COMPETITORS = [
    'care homes uk',
    'residential care providers',
    'domiciliary care services',
    'healthcare staffing agencies',
    'care management software',
    'elderly care services'
  ]

  private static readonly POLICY_SOURCES = [
    'CQC Care Quality Commission',
    'Department of Health and Social Care',
    'NHS England',
    'Social Care Institute for Excellence',
    'Skills for Care',
    'Care England'
  ]

  /**
   * Perform comprehensive web research using AI-powered search
   */
  async performWebResearch(options: WebResearchOptions): Promise<{
    webResults: ExternalSearchResult[]
    competitors: CompetitorInfo[]
    policyUpdates: PolicyUpdate[]
    researchPapers: ResearchPaper[]
  }> {
    try {
      const results = await Promise.allSettled([
        this.searchWeb(options.query, options.maxResults || 10),
        options.includeCompetitors ? this.findCompetitors(options.query) : Promise.resolve([]),
        options.includePolicyUpdates ? this.searchPolicyUpdates(options.query) : Promise.resolve([]),
        options.includeResearchPapers ? this.searchResearchPapers(options.query) : Promise.resolve([])
      ])

      return {
        webResults: results[0].status === 'fulfilled' ? results[0].value : [],
        competitors: results[1].status === 'fulfilled' ? results[1].value : [],
        policyUpdates: results[2].status === 'fulfilled' ? results[2].value : [],
        researchPapers: results[3].status === 'fulfilled' ? results[3].value : []
      }
    } catch (error) {
      console.error('Web research failed:', error)
      throw new Error('Failed to perform web research')
    }
  }

  /**
   * Search the web using AI-powered search
   */
  private async searchWeb(query: string, maxResults: number = 10): Promise<ExternalSearchResult[]> {
    try {
      // Enhanced query for care sector context
      const careContextQuery = `${query} healthcare care sector UK residential domiciliary`
      
      const response = await fetch('/api/web-research/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: careContextQuery,
          maxResults,
          type: 'web'
        })
      })

      if (!response.ok) {
        throw new Error(`Web search failed: ${response.statusText}`)
      }

      const data = await response.json()
      return this.formatWebResults(data.results || [])
    } catch (error) {
      console.error('Web search error:', error)
      return []
    }
  }

  /**
   * Find competitors in the care sector
   */
  private async findCompetitors(query: string): Promise<CompetitorInfo[]> {
    try {
      const competitorQueries = WebResearchService.CARE_SECTOR_COMPETITORS.map(
        category => `${query} ${category}`
      )

      const results = await Promise.allSettled(
        competitorQueries.map(async (competitorQuery) => {
          const response = await fetch('/api/web-research/competitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: competitorQuery,
              maxResults: 5
            })
          })

          if (!response.ok) {
            throw new Error(`Competitor search failed: ${response.statusText}`)
          }

          return response.json()
        })
      )

      const allCompetitors: CompetitorInfo[] = []
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.competitors) {
          allCompetitors.push(...result.value.competitors)
        }
      })

      // Remove duplicates and limit results
      const uniqueCompetitors = this.removeDuplicateCompetitors(allCompetitors)
      return uniqueCompetitors.slice(0, 20)
    } catch (error) {
      console.error('Competitor search error:', error)
      return []
    }
  }

  /**
   * Search for policy updates from relevant sources
   */
  private async searchPolicyUpdates(query: string): Promise<PolicyUpdate[]> {
    try {
      const policyQueries = WebResearchService.POLICY_SOURCES.map(
        source => `${query} site:${this.getSourceDomain(source)} OR "${source}"`
      )

      const results = await Promise.allSettled(
        policyQueries.map(async (policyQuery) => {
          const response = await fetch('/api/web-research/policy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: policyQuery,
              maxResults: 5
            })
          })

          if (!response.ok) {
            throw new Error(`Policy search failed: ${response.statusText}`)
          }

          return response.json()
        })
      )

      const allPolicies: PolicyUpdate[] = []
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.policies) {
          allPolicies.push(...result.value.policies)
        }
      })

      // Sort by date and limit results
      return allPolicies
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 15)
    } catch (error) {
      console.error('Policy search error:', error)
      return []
    }
  }

  /**
   * Search for academic research papers
   */
  private async searchResearchPapers(query: string): Promise<ResearchPaper[]> {
    try {
      const academicQuery = `${query} healthcare elderly care residential care social care UK`
      
      const response = await fetch('/api/web-research/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: academicQuery,
          maxResults: 10
        })
      })

      if (!response.ok) {
        throw new Error(`Research paper search failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.papers || []
    } catch (error) {
      console.error('Research paper search error:', error)
      return []
    }
  }

  /**
   * Format web search results
   */
  private formatWebResults(rawResults: any[]): ExternalSearchResult[] {
    return rawResults.map((result, index) => ({
      id: `web-${index}`,
      title: result.title || 'Untitled',
      url: result.url || '',
      snippet: result.text || result.snippet || '',
      source: this.extractDomain(result.url || ''),
      type: 'web' as const,
      publishedAt: result.publishedDate || new Date().toISOString(),
      relevanceScore: result.score || 0.8,
      metadata: {
        domain: this.extractDomain(result.url || ''),
        wordCount: (result.text || '').split(' ').length,
        hasImages: false,
        isNews: this.isNewsSource(result.url || ''),
        language: 'en'
      }
    }))
  }

  /**
   * Remove duplicate competitors based on domain
   */
  private removeDuplicateCompetitors(competitors: CompetitorInfo[]): CompetitorInfo[] {
    const seen = new Set<string>()
    return competitors.filter(competitor => {
      const domain = this.extractDomain(competitor.url)
      if (seen.has(domain)) {
        return false
      }
      seen.add(domain)
      return true
    })
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  /**
   * Get domain for a policy source
   */
  private getSourceDomain(source: string): string {
    const domainMap: Record<string, string> = {
      'CQC Care Quality Commission': 'cqc.org.uk',
      'Department of Health and Social Care': 'gov.uk',
      'NHS England': 'england.nhs.uk',
      'Social Care Institute for Excellence': 'scie.org.uk',
      'Skills for Care': 'skillsforcare.org.uk',
      'Care England': 'careengland.org.uk'
    }
    return domainMap[source] || source.toLowerCase().replace(/\s+/g, '')
  }

  /**
   * Check if URL is from a news source
   */
  private isNewsSource(url: string): boolean {
    const newsIndicators = ['news', 'bbc', 'guardian', 'telegraph', 'times', 'independent', 'reuters', 'ap']
    const domain = this.extractDomain(url).toLowerCase()
    return newsIndicators.some(indicator => domain.includes(indicator))
  }

  /**
   * Enhanced search with AI-powered content analysis
   */
  async searchWithContentAnalysis(query: string, options: {
    includeAnalysis?: boolean
    maxResults?: number
    focusAreas?: string[]
  } = {}): Promise<{
    results: ExternalSearchResult[]
    analysis?: {
      trends: string[]
      keyInsights: string[]
      recommendations: string[]
    }
  }> {
    const results = await this.searchWeb(query, options.maxResults)
    
    if (!options.includeAnalysis) {
      return { results }
    }

    try {
      // Analyze content using AI
      const contentTexts = results.map(r => r.snippet).join('\n\n')
      const analysisResponse = await fetch('/api/ai/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentTexts,
          query,
          focusAreas: options.focusAreas || ['trends', 'insights', 'recommendations']
        })
      })

      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json()
        return { results, analysis }
      }
    } catch (error) {
      console.error('Content analysis failed:', error)
    }

    return { results }
  }
}

export const webResearchService = new WebResearchService() 