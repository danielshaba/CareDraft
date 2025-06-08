import { createClient } from '@/lib/supabase.client'
import { ComplianceItemInsert, ComplianceItem } from '@/lib/database.types'

// Types for Extract API integration
interface ExtractionResult {
  content: string
  confidence: number
  sourceText: string
  category: string
}

interface ExtractResponse {
  success: boolean
  results: ExtractionResult[]
  model: string
  fallback: boolean
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  error?: string
}

// Configuration for compliance extraction
const COMPLIANCE_EXTRACTION_CONFIG = {
  minConfidenceThreshold: 0.6, // Minimum confidence score to include item
  maxResults: 15, // Maximum compliance items to extract
  batchSize: 10, // Number of items to process at once
  defaultSortOrder: 100, // Default sort order for new items
}

/**
 * Service class for extracting compliance requirements from documents
 * and transforming them into structured compliance checklist items
 */
export class ComplianceExtractionService {
  private supabase = createClient()

  /**
   * Extract compliance requirements from document text using AI
   */
  async extractComplianceFromText(
    text: string,
    documentName?: string
  ): Promise<ExtractionResult[]> {
    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          category: 'compliance-requirements',
          documentName,
          maxResults: COMPLIANCE_EXTRACTION_CONFIG.maxResults,
        }),
      })

      if (!response.ok) {
        throw new Error(`Extract API error: ${response.status} ${response.statusText}`)
      }

      const data: ExtractResponse = await response.json()

      if (!data.success) {
        throw new Error(`Extract API failed: ${data.error}`)
      }

      // Filter results by confidence threshold
      return data.results.filter(
        (result) => result.confidence >= COMPLIANCE_EXTRACTION_CONFIG.minConfidenceThreshold * 100
      )
    } catch {
      console.error('Error extracting compliance requirements:', error)
      throw new Error(
        error instanceof Error 
          ? `Failed to extract compliance: ${error.message}`
          : 'Failed to extract compliance requirements'
      )
    }
  }

  /**
   * Transform extraction results into compliance item format
   */
  transformToComplianceItems(
    results: ExtractionResult[],
    proposalId: string,
    sourceDocumentId?: string
  ): ComplianceItemInsert[] {
    return results.map((result, index) => ({
      proposal_id: proposalId,
      requirement: result.content,
      source_type: 'auto' as const,
      completed: false,
      notes: `Source: ${result.sourceText.substring(0, 200)}${result.sourceText.length > 200 ? '...' : ''}`,
      source_document_id: sourceDocumentId,
      confidence_score: result.confidence / 100, // Convert 0-100 to 0-1
      sort_order: index + 1,
    }))
  }

  /**
   * Save compliance items to the database
   */
  async saveComplianceItems(items: ComplianceItemInsert[]): Promise<ComplianceItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('compliance_items')
        .insert(items)
        .select()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data || []
    } catch {
      console.error('Error saving compliance items:', error)
      throw new Error(
        error instanceof Error 
          ? `Failed to save compliance items: ${error.message}`
          : 'Failed to save compliance items'
      )
    }
  }

  /**
   * Get existing compliance items for a proposal
   */
  async getComplianceItems(proposalId: string): Promise<ComplianceItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('compliance_items')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('sort_order', { ascending: true })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data || []
    } catch {
      console.error('Error fetching compliance items:', error)
      throw new Error(
        error instanceof Error 
          ? `Failed to fetch compliance items: ${error.message}`
          : 'Failed to fetch compliance items'
      )
    }
  }

  /**
   * Check if proposal already has auto-extracted compliance items
   */
  async hasAutoExtractedItems(proposalId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('compliance_items')
        .select('id')
        .eq('proposal_id', proposalId)
        .eq('source_type', 'auto')
        .limit(1)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return (data?.length || 0) > 0
    } catch {
      console.error('Error checking auto-extracted items:', error)
      return false
    }
  }

  /**
   * Remove existing auto-extracted items for a proposal
   */
  async removeAutoExtractedItems(proposalId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('compliance_items')
        .delete()
        .eq('proposal_id', proposalId)
        .eq('source_type', 'auto')

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch {
      console.error('Error removing auto-extracted items:', error)
      throw new Error(
        error instanceof Error 
          ? `Failed to remove auto-extracted items: ${error.message}`
          : 'Failed to remove auto-extracted items'
      )
    }
  }

  /**
   * Get the next sort order for manual items
   */
  async getNextSortOrder(proposalId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('compliance_items')
        .select('sort_order')
        .eq('proposal_id', proposalId)
        .order('sort_order', { ascending: false })
        .limit(1)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const maxOrder = data?.[0]?.sort_order || 0
      return maxOrder + 1
    } catch {
      console.error('Error getting next sort order:', error)
      return COMPLIANCE_EXTRACTION_CONFIG.defaultSortOrder
    }
  }

  /**
   * Add a manual compliance item
   */
  async addManualItem(
    proposalId: string,
    requirement: string,
    notes?: string
  ): Promise<ComplianceItem> {
    try {
      const sortOrder = await this.getNextSortOrder(proposalId)

      const item: ComplianceItemInsert = {
        proposal_id: proposalId,
        requirement,
        source_type: 'manual',
        completed: false,
        notes,
        sort_order: sortOrder,
      }

      const { data, error } = await this.supabase
        .from('compliance_items')
        .insert(item)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data
    } catch {
      console.error('Error adding manual compliance item:', error)
      throw new Error(
        error instanceof Error 
          ? `Failed to add manual item: ${error.message}`
          : 'Failed to add manual compliance item'
      )
    }
  }

  /**
   * Update compliance item completion status and notes
   */
  async updateComplianceItem(
    itemId: string,
    updates: {
      completed?: boolean
      notes?: string
      requirement?: string
    }
  ): Promise<ComplianceItem> {
    try {
      const { data, error } = await this.supabase
        .from('compliance_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data
    } catch {
      console.error('Error updating compliance item:', error)
      throw new Error(
        error instanceof Error 
          ? `Failed to update compliance item: ${error.message}`
          : 'Failed to update compliance item'
      )
    }
  }

  /**
   * Delete a compliance item
   */
  async deleteComplianceItem(itemId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('compliance_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch {
      console.error('Error deleting compliance item:', error)
      throw new Error(
        error instanceof Error 
          ? `Failed to delete compliance item: ${error.message}`
          : 'Failed to delete compliance item'
      )
    }
  }

  /**
   * Reorder compliance items
   */
  async reorderItems(proposalId: string, itemIds: string[]): Promise<void> {
    try {
      // Update sort order for each item
      const updates = itemIds.map((id, index) => ({
        id,
        sort_order: index + 1,
      }))

      for (const update of updates) {
        await this.supabase
          .from('compliance_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('proposal_id', proposalId)
      }
    } catch {
      console.error('Error reordering compliance items:', error)
      throw new Error(
        error instanceof Error 
          ? `Failed to reorder items: ${error.message}`
          : 'Failed to reorder compliance items'
      )
    }
  }

  /**
   * Main workflow: Extract and populate compliance items for a proposal
   */
  async extractAndPopulateCompliance(
    proposalId: string,
    documentText: string,
    documentName?: string,
    sourceDocumentId?: string,
    replaceExisting = false
  ): Promise<{
    success: boolean
    itemsCreated: number
    itemsSkipped: number
    error?: string
  }> {
    try {
      // Check if auto-extracted items already exist
      const hasExisting = await this.hasAutoExtractedItems(proposalId)

      if (hasExisting && !replaceExisting) {
        return {
          success: false,
          itemsCreated: 0,
          itemsSkipped: 0,
          error: 'Auto-extracted compliance items already exist. Set replaceExisting=true to overwrite.',
        }
      }

      // Remove existing auto-extracted items if replacing
      if (hasExisting && replaceExisting) {
        await this.removeAutoExtractedItems(proposalId)
      }

      // Extract compliance requirements from document
      const extractionResults = await this.extractComplianceFromText(
        documentText,
        documentName
      )

      if (extractionResults.length === 0) {
        return {
          success: true,
          itemsCreated: 0,
          itemsSkipped: 0,
        }
      }

      // Transform results to compliance items
      const complianceItems = this.transformToComplianceItems(
        extractionResults,
        proposalId,
        sourceDocumentId
      )

      // Save to database
      const savedItems = await this.saveComplianceItems(complianceItems)

      return {
        success: true,
        itemsCreated: savedItems.length,
        itemsSkipped: extractionResults.length - savedItems.length,
      }
    } catch {
      console.error('Error in extractAndPopulateCompliance:', error)
      return {
        success: false,
        itemsCreated: 0,
        itemsSkipped: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Get compliance statistics for a proposal
   */
  async getComplianceStatistics(proposalId: string) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_compliance_statistics', { p_proposal_id: proposalId })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data?.[0] || {
        total_items: 0,
        completed_items: 0,
        completion_percentage: 0,
        auto_items: 0,
        manual_items: 0,
      }
    } catch {
      console.error('Error getting compliance statistics:', error)
      throw new Error(
        error instanceof Error 
          ? `Failed to get compliance statistics: ${error.message}`
          : 'Failed to get compliance statistics'
      )
    }
  }
}

// Export singleton instance
export const complianceExtractionService = new ComplianceExtractionService()

// Export types for use in components
export type { ExtractionResult, ExtractResponse } 