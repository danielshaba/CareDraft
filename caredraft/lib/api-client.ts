import OpenAI from 'openai'
import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  PRIMARY_OPENAI_MODEL: z.string().min(1, 'Primary OpenAI model is required'),
  FALLBACK_OPENAI_MODEL: z.string().min(1, 'Fallback OpenAI model is required'),
  // Optional backup models in case fine-tuned models fail
  BACKUP_PRIMARY_MODEL: z.string().default('gpt-4o-mini'),
  BACKUP_FALLBACK_MODEL: z.string().default('gpt-3.5-turbo'),
  // AI Configuration
  AI_DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  AI_LOG_REQUESTS: z.string().transform(val => val === 'true').default('false'),
  AI_MAX_RETRIES: z.string().transform(val => parseInt(val) || 3).default('3'),
  AI_TIMEOUT_MS: z.string().transform(val => parseInt(val) || 45000).default('45000'),
})

// Validate environment variables
const env = envSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PRIMARY_OPENAI_MODEL: process.env.PRIMARY_OPENAI_MODEL,
  FALLBACK_OPENAI_MODEL: process.env.FALLBACK_OPENAI_MODEL,
  BACKUP_PRIMARY_MODEL: process.env.BACKUP_PRIMARY_MODEL,
  BACKUP_FALLBACK_MODEL: process.env.BACKUP_FALLBACK_MODEL,
  AI_DEBUG_MODE: process.env.AI_DEBUG_MODE,
  AI_LOG_REQUESTS: process.env.AI_LOG_REQUESTS,
  AI_MAX_RETRIES: process.env.AI_MAX_RETRIES,
  AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
})

// OpenAI client configuration
const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: env.AI_TIMEOUT_MS,
  maxRetries: env.AI_MAX_RETRIES,
})

// Model configuration
const PRIMARY_OPENAI_MODEL = env.PRIMARY_OPENAI_MODEL
const FALLBACK_OPENAI_MODEL = env.FALLBACK_OPENAI_MODEL
const BACKUP_PRIMARY_MODEL = env.BACKUP_PRIMARY_MODEL
const BACKUP_FALLBACK_MODEL = env.BACKUP_FALLBACK_MODEL

// Debug logging
const DEBUG_MODE = env.AI_DEBUG_MODE
const LOG_REQUESTS = env.AI_LOG_REQUESTS

// Helper function to detect if model is fine-tuned
function isFineTunedModel(model: string): boolean {
  return model.startsWith('ft:') || model.includes('ftjob-')
}

// Helper function to get model display name
function getModelDisplayName(model: string): string {
  if (isFineTunedModel(model)) {
    if (model.includes('ftjob-GEQ7rH6zO5uHGenTo81wAm2I')) return 'CareDraft Fine-tuned GPT-4.1 Mini'
    if (model.includes('ftjob-4cCrjAiMMhDNZgOAPr06Sr3w')) return 'CareDraft Fine-tuned GPT-4.1 Nano'
    return `Fine-tuned: ${model.split(':').pop()?.substring(0, 12) || 'Unknown'}`
  }
  return model
}

// Custom error types
export enum AIErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  CONTENT_POLICY = 'content_policy',
  VALIDATION = 'validation',
  MODEL_ERROR = 'model_error',
  UNKNOWN = 'unknown'
}

export class AIError extends Error {
  type: AIErrorType
  retryAfter?: number
  originalError?: unknown
  model?: string

  constructor(message: string, type: AIErrorType, originalError?: unknown, retryAfter?: number, model?: string) {
    super(message)
    this.name = 'AIError'
    this.type = type
    this.originalError = originalError
    this.retryAfter = retryAfter
    this.model = model
  }
}

// Parse OpenAI errors
export function parseOpenAIError(error: unknown, model?: string): AIError {
  if ((error as any)?.status === 401) {
    return new AIError('OpenAI authentication failed', AIErrorType.AUTHENTICATION, error, undefined, model)
  }
  
  if ((error as any)?.status === 429) {
    const retryAfter = (error as any)?.headers?.['retry-after'] ? parseInt((error as any).headers['retry-after']) : undefined
    return new AIError('OpenAI rate limit exceeded', AIErrorType.RATE_LIMIT, error, retryAfter, model)
  }
  
  if ((error as any)?.status === 400) {
    const errorMessage = (error as any)?.error?.message || 'Validation error'
    if (errorMessage.includes('model') || errorMessage.includes('fine-tune')) {
      return new AIError(`Model error: ${errorMessage}`, AIErrorType.MODEL_ERROR, error, undefined, model)
    }
    return new AIError('OpenAI validation error', AIErrorType.VALIDATION, error, undefined, model)
  }
  
  if ((error as any)?.status >= 500) {
    return new AIError('OpenAI server error', AIErrorType.NETWORK, error, undefined, model)
  }
  
  if ((error as any)?.code === 'ECONNRESET' || (error as any)?.code === 'ETIMEDOUT') {
    return new AIError('Network error connecting to OpenAI', AIErrorType.NETWORK, error, undefined, model)
  }
  
  return new AIError(
    (error as any)?.message || 'Unknown OpenAI error',
    AIErrorType.UNKNOWN,
    error,
    undefined,
    model
  )
}

// Log request for debugging
function logRequest(model: string, messages: any[], isRetry: boolean = false) {
  if (!LOG_REQUESTS && !DEBUG_MODE) return
  
  const prefix = isRetry ? '🔄 RETRY' : '🤖 AI REQUEST'
  console.log(`${prefix} [${getModelDisplayName(model)}]`)
  if (DEBUG_MODE) {
    console.log('Messages:', messages.map(m => ({ role: m.role, content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '') })))
  }
}

// Enhanced generation with multiple fallback layers
export async function generateWithFallback(
  messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  isComplex: boolean = false,
  customModel?: string
): Promise<{
  text: string
  model: string
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  fallback: boolean
  fineTuned: boolean
  attempts: number
}> {
  // Determine model hierarchy
  const models = customModel ? [customModel] : isComplex 
    ? [PRIMARY_OPENAI_MODEL, FALLBACK_OPENAI_MODEL, BACKUP_PRIMARY_MODEL, BACKUP_FALLBACK_MODEL]
    : [FALLBACK_OPENAI_MODEL, PRIMARY_OPENAI_MODEL, BACKUP_FALLBACK_MODEL, BACKUP_PRIMARY_MODEL]
  
  let lastError: any
  let attempts = 0

  for (let i = 0; i < models.length; i++) {
    const currentModel = models[i]
    const isRetry = i > 0
    attempts++
    
    try {
      logRequest(currentModel, messages, isRetry)
      
      const response = await openaiClient.chat.completions.create({
        model: currentModel,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        // Add specific settings for fine-tuned models
        ...(isFineTunedModel(currentModel) && {
          temperature: 0.8, // Fine-tuned models often work better with slightly higher temperature
          top_p: 0.95,
        })
      })

      const text = response.choices[0]?.message?.content || ''
      if (!text) {
        throw new Error('No content in OpenAI response')
      }

      const result = {
        text,
        model: currentModel,
        tokensUsed: response.usage ? {
          input: response.usage.prompt_tokens,
          output: response.usage.completion_tokens,
          total: response.usage.total_tokens
        } : undefined,
        fallback: i > 0,
        fineTuned: isFineTunedModel(currentModel),
        attempts
      }

      if (DEBUG_MODE || LOG_REQUESTS) {
        console.log(`✅ SUCCESS [${getModelDisplayName(currentModel)}] - ${result.tokensUsed?.total || 0} tokens`)
      }

      return result
    } catch (error) {
      const parsedError = parseOpenAIError(error, currentModel)
      
      if (DEBUG_MODE) {
        console.error(`❌ FAILED [${getModelDisplayName(currentModel)}]:`, parsedError.message)
      }
      
      // If it's a model-specific error and we're using a fine-tuned model, try backup
      const shouldTryNext = (
        parsedError.type === AIErrorType.MODEL_ERROR ||
        parsedError.type === AIErrorType.RATE_LIMIT ||
        parsedError.type === AIErrorType.NETWORK ||
        (error as any)?.status >= 500
      ) && i < models.length - 1
      
      if (!shouldTryNext) {
        throw parsedError
      }
      
      // Brief delay before retry
      if (i < models.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  // All models failed
  throw new AIError(
    `All models failed after ${attempts} attempts`,
    AIErrorType.UNKNOWN,
    { lastError, attempts, modelsAttempted: models }
  )
}

// Specialized functions for different AI tasks
export async function generateCreativeContent(
  messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
) {
  return generateWithFallback(messages, true) // Use primary (more powerful) model for creative tasks
}

export async function generateStructuredResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
) {
  return generateWithFallback(messages, false) // Use fallback (faster) model for structured tasks
}

export async function generateWithCustomModel(
  messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  model: string
) {
  return generateWithFallback(messages, false, model)
}

// Configuration info
export const clientConfig = {
  primaryModel: PRIMARY_OPENAI_MODEL,
  fallbackModel: FALLBACK_OPENAI_MODEL,
  backupPrimaryModel: BACKUP_PRIMARY_MODEL,
  backupFallbackModel: BACKUP_FALLBACK_MODEL,
  debugMode: DEBUG_MODE,
  logRequests: LOG_REQUESTS,
  available: true,
  fineTunedModels: {
    primary: isFineTunedModel(PRIMARY_OPENAI_MODEL),
    fallback: isFineTunedModel(FALLBACK_OPENAI_MODEL)
  },
  modelDisplayNames: {
    primary: getModelDisplayName(PRIMARY_OPENAI_MODEL),
    fallback: getModelDisplayName(FALLBACK_OPENAI_MODEL),
    backupPrimary: getModelDisplayName(BACKUP_PRIMARY_MODEL),
    backupFallback: getModelDisplayName(BACKUP_FALLBACK_MODEL)
  }
} 