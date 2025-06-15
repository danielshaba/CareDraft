import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface TenderKnowledgeSource {
  id: string
  title: string
  content: string
  type: 'document' | 'policy' | 'template' | 'case-study' | 'guide' | 'framework'
  source: 'internal' | 'external' | 'tender-specific'
  relevance_score: number
  topic_tags: string[]
  tender_categories: string[]
  last_updated: string
  usage_count: number
  embedding_vector?: number[]
}

export interface TenderContextQuery {
  tender_id: string
  requirements: string[]
  evaluation_criteria: Array<{ criteria: string; weight: number }>
  compliance_requirements: string[]
  issuing_authority?: string
  contract_type?: string
  max_results?: number
}

export interface KnowledgeRelevanceScore {
  source_id: string
  relevance_score: number
  relevance_factors: {
    requirement_match: number
    compliance_match: number
    authority_match: number
    topic_match: number
    historical_success: number
  }
  suggested_sections: string[]
  case_study_applicability: number
}

export class TenderKnowledgeIntegrationService {
  private static instance: TenderKnowledgeIntegrationService
  private supabase = createClientComponentClient()

  static getInstance(): TenderKnowledgeIntegrationService {
    if (!TenderKnowledgeIntegrationService.instance) {
      TenderKnowledgeIntegrationService.instance = new TenderKnowledgeIntegrationService()
    }
    return TenderKnowledgeIntegrationService.instance
  }

  /**
   * Index tender-specific documents with topic-based tagging
   */
  async indexTenderDocuments(
    tenderId: string, 
    documents: Array<{ title: string; content: string; type: string }>
  ): Promise<void> {
    try {
      for (const doc of documents) {
        // Extract topics using AI analysis
        const topics = await this.extractTopicsFromContent(doc.content)
        
        // Generate embeddings for semantic search
        const embeddings = await this.generateEmbeddings(doc.content)
        
        // Categorize by tender type
        const categories = await this.categorizeTenderDocument(doc.content, doc.type)
        
        // Store in knowledge base with enhanced metadata
        await this.supabase.from('tender_knowledge_sources').insert({
          tender_id: tenderId,
          title: doc.title,
          content: doc.content,
          type: doc.type,
          topic_tags: topics,
          tender_categories: categories,
          embedding_vector: embeddings,
          created_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error indexing tender documents:', error)
      throw new Error('Failed to index tender documents')
    }
  }

  /**
   * Get contextually relevant knowledge for tender strategy generation
   */
  async getRelevantKnowledge(query: TenderContextQuery): Promise<{
    sources: TenderKnowledgeSource[]
    relevance_scores: KnowledgeRelevanceScore[]
    case_study_recommendations: string[]
  }> {
    try {
      // Get all potential knowledge sources
      const sources = await this.getAllKnowledgeSources()
      
      // Calculate relevance scores for each source
      const relevanceScores = await Promise.all(
        sources.map(source => this.calculateRelevanceScore(source, query))
      )
      
      // Sort by relevance score
      const sortedSources = sources
        .map((source, index) => ({ source, score: relevanceScores[index] }))
        .sort((a, b) => b.score.relevance_score - a.score.relevance_score)
        .slice(0, query.max_results || 10)
      
      // Extract case study recommendations
      const caseStudyRecommendations = this.extractCaseStudyRecommendations(
        sortedSources.map(s => s.source),
        query
      )
      
      return {
        sources: sortedSources.map(s => s.source),
        relevance_scores: sortedSources.map(s => s.score),
        case_study_recommendations: caseStudyRecommendations
      }
    } catch (error) {
      console.error('Error getting relevant knowledge:', error)
      throw new Error('Failed to retrieve relevant knowledge')
    }
  }

  /**
   * AI-powered topic extraction from document content
   */
  private async extractTopicsFromContent(content: string): Promise<string[]> {
    try {
      // Use AI to analyze content and extract relevant topics
      // For now, simulate with keyword-based extraction
      const keywords = [
        'cqc', 'inspection', 'compliance', 'safeguarding', 'care-planning',
        'medication', 'staff-training', 'quality-assurance', 'person-centered',
        'dementia', 'mental-health', 'community-care', 'domiciliary',
        'residential', 'nursing-home', 'supported-living', 'day-care',
        'nhs', 'local-authority', 'ccg', 'icb', 'social-services',
        'health-safety', 'infection-control', 'gdpr', 'data-protection',
        'emergency-procedures', 'risk-assessment', 'incident-reporting'
      ]
      
      const contentLower = content.toLowerCase()
      const extractedTopics = keywords.filter(keyword => 
        contentLower.includes(keyword.replace('-', ' ')) || 
        contentLower.includes(keyword)
      )
      
      return extractedTopics.slice(0, 10) // Limit to 10 most relevant topics
    } catch (error) {
      console.error('Error extracting topics:', error)
      return []
    }
  }

  /**
   * Generate embeddings for semantic similarity search
   */
  private async generateEmbeddings(_content: string): Promise<number[]> {
    try {
      // In production, use OpenAI embeddings API or similar
      // For now, return mock embeddings
      const mockEmbedding = Array.from({ length: 768 }, () => Math.random() - 0.5)
      return mockEmbedding
    } catch (error) {
      console.error('Error generating embeddings:', error)
      return []
    }
  }

  /**
   * Categorize tender documents by type and focus area
   */
  private async categorizeTenderDocument(content: string, type: string): Promise<string[]> {
    const categories: string[] = [type]
    const contentLower = content.toLowerCase()
    
    // Service type categorization
    if (contentLower.includes('community') || contentLower.includes('domiciliary')) {
      categories.push('community-care')
    }
    if (contentLower.includes('residential') || contentLower.includes('nursing')) {
      categories.push('residential-care')
    }
    if (contentLower.includes('mental health') || contentLower.includes('psychiatric')) {
      categories.push('mental-health')
    }
    if (contentLower.includes('dementia') || contentLower.includes('alzheimer')) {
      categories.push('dementia-care')
    }
    
    // Authority type categorization
    if (contentLower.includes('nhs') || contentLower.includes('clinical commissioning')) {
      categories.push('nhs-contract')
    }
    if (contentLower.includes('local authority') || contentLower.includes('council')) {
      categories.push('local-authority')
    }
    
    return categories
  }

  /**
   * Get all available knowledge sources
   */
  private async getAllKnowledgeSources(): Promise<TenderKnowledgeSource[]> {
    // Mock knowledge sources for demo
    return [
      {
        id: '1',
        title: 'CQC Inspection Preparation Guide',
        content: 'Comprehensive guide for preparing for CQC inspections including documentation requirements, staff training protocols, and quality assurance measures...',
        type: 'guide',
        source: 'internal',
        relevance_score: 0,
        topic_tags: ['cqc', 'inspection', 'compliance', 'quality-assurance'],
        tender_categories: ['care-standards', 'nhs-contract'],
        last_updated: '2024-01-15',
        usage_count: 25
      },
      {
        id: '2',
        title: 'Community Care Service Delivery Framework',
        content: 'Evidence-based framework for delivering high-quality community care services including person-centered planning and outcome measurement...',
        type: 'framework',
        source: 'internal',
        relevance_score: 0,
        topic_tags: ['community-care', 'service-delivery', 'person-centered', 'outcomes'],
        tender_categories: ['community-care', 'local-authority'],
        last_updated: '2024-02-01',
        usage_count: 18
      },
      {
        id: '3',
        title: 'NHS Contract Success Case Study - Yorkshire',
        content: 'Detailed case study of successful NHS contract delivery highlighting innovation, quality improvements, and cost efficiencies achieved in Yorkshire region...',
        type: 'case-study',
        source: 'internal',
        relevance_score: 0,
        topic_tags: ['nhs', 'contract-success', 'yorkshire', 'innovation', 'quality'],
        tender_categories: ['nhs-contract', 'community-care'],
        last_updated: '2024-01-20',
        usage_count: 32
      }
    ]
  }

  /**
   * Calculate relevance score for a knowledge source against tender requirements
   */
  private async calculateRelevanceScore(
    source: TenderKnowledgeSource, 
    query: TenderContextQuery
  ): Promise<KnowledgeRelevanceScore> {
    let totalScore = 0
    const factors = {
      requirement_match: 0,
      compliance_match: 0,
      authority_match: 0,
      topic_match: 0,
      historical_success: 0
    }

    // Calculate requirement match
    const requirementMatches = query.requirements.filter(req =>
      source.content.toLowerCase().includes(req.toLowerCase()) ||
      source.topic_tags.some(tag => req.toLowerCase().includes(tag))
    ).length
    factors.requirement_match = (requirementMatches / Math.max(query.requirements.length, 1)) * 100
    totalScore += factors.requirement_match * 0.3

    // Calculate compliance match
    const complianceMatches = query.compliance_requirements.filter(comp =>
      source.content.toLowerCase().includes(comp.toLowerCase()) ||
      source.topic_tags.some(tag => comp.toLowerCase().includes(tag))
    ).length
    factors.compliance_match = (complianceMatches / Math.max(query.compliance_requirements.length, 1)) * 100
    totalScore += factors.compliance_match * 0.25

    // Calculate authority match
    if (query.issuing_authority) {
      const authorityMatch = source.content.toLowerCase().includes(query.issuing_authority.toLowerCase()) ||
                           source.tender_categories.some(cat => query.issuing_authority!.toLowerCase().includes(cat))
      factors.authority_match = authorityMatch ? 100 : 0
      totalScore += factors.authority_match * 0.2
    }

    // Calculate topic relevance
    const topicMatches = source.topic_tags.filter(tag =>
      query.requirements.some(req => req.toLowerCase().includes(tag)) ||
      query.evaluation_criteria.some(crit => crit.criteria.toLowerCase().includes(tag))
    ).length
    factors.topic_match = (topicMatches / Math.max(source.topic_tags.length, 1)) * 100
    totalScore += factors.topic_match * 0.15

    // Historical success factor
    factors.historical_success = Math.min(source.usage_count * 2, 100)
    totalScore += factors.historical_success * 0.1

    return {
      source_id: source.id,
      relevance_score: Math.min(totalScore, 100),
      relevance_factors: factors,
      suggested_sections: this.suggestRelevantSections(source, query),
      case_study_applicability: source.type === 'case-study' ? factors.requirement_match : 0
    }
  }

  /**
   * Suggest which sections of a source are most relevant
   */
  private suggestRelevantSections(
    source: TenderKnowledgeSource, 
    _query: TenderContextQuery
  ): string[] {
    const sections: string[] = []
    
    // Analyze content to suggest relevant sections
    if (source.content.toLowerCase().includes('quality')) {
      sections.push('Quality Assurance')
    }
    if (source.content.toLowerCase().includes('compliance')) {
      sections.push('Compliance Framework')
    }
    if (source.content.toLowerCase().includes('training')) {
      sections.push('Staff Development')
    }
    if (source.content.toLowerCase().includes('innovation')) {
      sections.push('Innovation Approach')
    }
    
    return sections.slice(0, 3)
  }

  /**
   * Extract case study recommendations based on tender context
   */
  private extractCaseStudyRecommendations(
    sources: TenderKnowledgeSource[], 
    query: TenderContextQuery
  ): string[] {
    const caseStudies = sources.filter(source => source.type === 'case-study')
    
    return caseStudies
      .map(cs => `${cs.title}: Demonstrates ${cs.topic_tags.slice(0, 3).join(', ')} relevant to ${query.issuing_authority || 'this tender'}`)
      .slice(0, 5)
  }

  /**
   * Update usage statistics for knowledge sources
   */
  async updateKnowledgeUsage(sourceIds: string[]): Promise<void> {
    try {
      await Promise.all(
        sourceIds.map(id =>
          this.supabase
            .from('tender_knowledge_sources')
            .update({ 
              usage_count: 1, // Simplified for now
              last_used: new Date().toISOString()
            })
            .eq('id', id)
        )
      )
    } catch (error) {
      console.error('Error updating knowledge usage:', error)
    }
  }
} 