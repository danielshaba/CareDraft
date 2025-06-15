import { AIError, AIErrorType } from '@/lib/api-client'

export interface ContextMenuOperation {
  id: string
  type: 'evidencing' | 'editing' | 'inputs' | 'custom' | 'other'
  action: string
  selectedText: string
  context?: string
  position?: { start: number; end: number }
  options?: Record<string, unknown>
}

export interface OperationResult {
  success: boolean
  resultText: string
  originalText: string
  operation: string
  model?: string
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  processingTime: number
  error?: string
}

export interface OperationProgress {
  operationId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number // 0-100
  message: string
  result?: OperationResult
  error?: string
}

/**
 * Centralized AI service for context menu operations
 * Provides unified interface for all AI-powered editing actions
 */
export class ContextMenuAIService {
  private operations = new Map<string, OperationProgress>()
  private progressCallbacks = new Map<string, (progress: OperationProgress) => void>()

  /**
   * Execute an AI operation with progress tracking
   */
  async executeOperation(
    operation: ContextMenuOperation,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<OperationResult> {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Initialize progress tracking
    const initialProgress: OperationProgress = {
      operationId,
      status: 'pending',
      progress: 0,
      message: 'Initializing...'
    }

    this.operations.set(operationId, initialProgress)
    if (onProgress) {
      this.progressCallbacks.set(operationId, onProgress)
      onProgress(initialProgress)
    }

    try {
      // Update progress to processing
      this.updateProgress(operationId, {
        status: 'processing',
        progress: 25,
        message: 'Sending request to AI service...'
      })

      // Route to appropriate AI endpoint based on operation type
      const result = await this.routeOperation(operation)

      // Update progress to completed
      this.updateProgress(operationId, {
        status: 'completed',
        progress: 100,
        message: 'Operation completed successfully',
        result
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      this.updateProgress(operationId, {
        status: 'error',
        progress: 0,
        message: `Operation failed: ${errorMessage}`,
        error: errorMessage
      })

      throw error
    } finally {
      // Cleanup after operation
      setTimeout(() => {
        this.operations.delete(operationId)
        this.progressCallbacks.delete(operationId)
      }, 5000) // Keep for 5 seconds for final status check
    }
  }

  /**
   * Route operation to appropriate AI endpoint
   */
  private async routeOperation(operation: ContextMenuOperation): Promise<OperationResult> {
    const _startTime = Date.now()
    
    try {
      let endpoint: string
      let requestBody: Record<string, unknown>

      // Route based on operation action
      switch (operation.action) {
        case 'expand':
          endpoint = '/api/ai/context-actions/expand'
          requestBody = {
            text: operation.selectedText,
            context: operation.context,
            expandType: operation.options?.expandType || 'detailed',
            preserveTone: operation.options?.preserveTone ?? true
          }
          break

        case 'explain-how':
          endpoint = '/api/ai/context-actions/explain'
          requestBody = {
            text: operation.selectedText,
            context: operation.context,
            explanationType: 'how',
            includeSteps: operation.options?.includeSteps ?? true
          }
          break

        case 'add-statistics':
          endpoint = '/api/ai/context-actions/statistics'
          requestBody = {
            text: operation.selectedText,
            context: operation.context,
            sector: operation.options?.sector || 'care',
            sourcePreference: operation.options?.sourcePreference || 'government'
          }
          break

        case 'add-case-study':
          endpoint = '/api/ai/context-actions/case-study'
          requestBody = {
            text: operation.selectedText,
            context: operation.context,
            caseStudyType: operation.options?.caseStudyType || 'success',
            sector: operation.options?.sector || 'care'
          }
          break

        case 'summarise':
          endpoint = '/api/ai/summarize'
          requestBody = {
            text: operation.selectedText,
            type: operation.options?.summaryType || 'executive',
            length: operation.options?.length || 'medium',
            targetAudience: operation.options?.targetAudience
          }
          break

        case 'improve-grammar':
          endpoint = '/api/ai/context-actions/grammar'
          requestBody = {
            text: operation.selectedText,
            context: operation.context,
            level: operation.options?.level || 'standard',
            preserveStyle: operation.options?.preserveStyle ?? true
          }
          break

        case 'change-tense':
          endpoint = '/api/ai/context-actions/tense'
          requestBody = {
            text: operation.selectedText,
            targetTense: operation.options?.targetTense || 'present',
            context: operation.context
          }
          break

        case 'rephrase':
          endpoint = '/api/ai/context-actions/rephrase'
          requestBody = {
            text: operation.selectedText,
            style: operation.options?.style || 'professional',
            tone: operation.options?.tone || 'neutral',
            context: operation.context
          }
          break

        case 'reduce-word-count':
          endpoint = '/api/ai/context-actions/reduce'
          requestBody = {
            text: operation.selectedText,
            targetReduction: operation.options?.targetReduction || 0.3,
            preserveKey: operation.options?.preserveKey ?? true,
            context: operation.context
          }
          break

        case 'translate':
          endpoint = '/api/ai/context-actions/translate'
          requestBody = {
            text: operation.selectedText,
            targetLanguage: operation.options?.targetLanguage || 'es',
            context: operation.context,
            preserveFormatting: operation.options?.preserveFormatting ?? true
          }
          break

        case 'caredraft-tone':
          endpoint = '/api/ai/context-actions/tone'
          requestBody = {
            text: operation.selectedText,
            targetTone: 'caredraft',
            context: operation.context,
            industry: 'care'
          }
          break

        case 'replace-banned-words':
          endpoint = '/api/ai/context-actions/tone'
          requestBody = {
            text: operation.selectedText,
            mode: 'replace-banned',
            context: operation.context
          }
          break

        case 'pure-completion':
          endpoint = '/api/ai/context-actions/completion'
          requestBody = {
            text: operation.selectedText,
            context: operation.context,
            completionType: 'natural',
            maxLength: operation.options?.maxLength || 200
          }
          break

        case 'search':
          endpoint = '/api/ai/context-actions/search'
          requestBody = {
            query: operation.selectedText,
            context: operation.context,
            searchType: operation.options?.searchType || 'semantic',
            maxResults: operation.options?.maxResults || 5
          }
          break

        default:
          throw new AIError(`Unknown operation action: ${operation.action}`, AIErrorType.VALIDATION)
      }

      // Make API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status === 429 ? AIErrorType.RATE_LIMIT : 
          response.status === 401 ? AIErrorType.AUTHENTICATION :
          response.status >= 500 ? AIErrorType.NETWORK : AIErrorType.UNKNOWN
        )
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new AIError(data.error || 'Operation failed', AIErrorType.UNKNOWN)
      }

      // Extract result text based on endpoint response format
      let resultText: string
      if (data.rewrittenText) resultText = data.rewrittenText // rewrite endpoint
      else if (data.summary) resultText = data.summary // summarize endpoint  
      else if (data.expandedText) resultText = data.expandedText // expand endpoint
      else if (data.result) resultText = data.result // generic result
      else if (data.text) resultText = data.text // generic text
      else resultText = operation.selectedText // fallback

      return {
        success: true,
        resultText,
        originalText: operation.selectedText,
        operation: operation.action,
        model: data.model,
        tokensUsed: data.tokensUsed,
        processingTime: Date.now() - _startTime
      }

    } catch (error) {
      console.error(`Context menu AI operation failed:`, error)
      
      return {
        success: false,
        resultText: operation.selectedText, // Return original text on failure
        originalText: operation.selectedText,
        operation: operation.action,
        processingTime: Date.now() - _startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update operation progress
   */
  private updateProgress(operationId: string, updates: Partial<OperationProgress>) {
    const current = this.operations.get(operationId)
    if (!current) return

    const updated = { ...current, ...updates }
    this.operations.set(operationId, updated)

    const callback = this.progressCallbacks.get(operationId)
    if (callback) {
      callback(updated)
    }
  }

  /**
   * Get operation progress
   */
  getOperationProgress(operationId: string): OperationProgress | undefined {
    return this.operations.get(operationId)
  }

  /**
   * Cancel an operation (if possible)
   */
  async cancelOperation(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId)
    if (!operation || operation.status !== 'processing') {
      return false
    }

    this.updateProgress(operationId, {
      status: 'error',
      progress: 0,
      message: 'Operation cancelled by user',
      error: 'Cancelled'
    })

    return true
  }

  /**
   * Batch process multiple operations
   */
  async executeBatch(
    operations: ContextMenuOperation[],
    onProgress?: (operationId: string, progress: OperationProgress) => void
  ): Promise<OperationResult[]> {
    const results = await Promise.allSettled(
      operations.map(op => 
        this.executeOperation(op, onProgress ? (progress) => onProgress(op.id, progress) : undefined)
      )
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          success: false,
          resultText: operations[index].selectedText,
          originalText: operations[index].selectedText,
          operation: operations[index].action,
          processingTime: 0,
          error: result.reason?.message || 'Batch operation failed'
        }
      }
    })
  }
}

// Export singleton instance
export const contextMenuAI = new ContextMenuAIService() 