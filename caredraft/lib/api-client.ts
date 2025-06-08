'use client'

import { OpenAI } from 'openai'
import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  PRIMARY_OPENAI_MODEL: z.string().min(1, 'Primary OpenAI model is required'),
  FALLBACK_OPENAI_MODEL: z.string().min(1, 'Fallback OpenAI model is required'),
})

// Validate environment variables
const env = envSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PRIMARY_OPENAI_MODEL: process.env.PRIMARY_OPENAI_MODEL,
  FALLBACK_OPENAI_MODEL: process.env.FALLBACK_OPENAI_MODEL,
})

// OpenAI client configuration
const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds
  maxRetries: 2,
})

// Model configuration
const PRIMARY_OPENAI_MODEL = env.PRIMARY_OPENAI_MODEL
const FALLBACK_OPENAI_MODEL = env.FALLBACK_OPENAI_MODEL

// Custom error types
export enum AIErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  CONTENT_POLICY = 'content_policy',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

export class AIError extends Error {
  type: AIErrorType
  retryAfter?: number
  originalError?: unknown

  constructor(message: string, type: AIErrorType, originalError?: unknown, retryAfter?: number) {
    super(message)
    this.name = 'AIError'
    this.type = type
    this.originalError = originalError
    this.retryAfter = retryAfter
  }
}

// Parse OpenAI errors
export function parseOpenAIError(error: unknown): AIError {
  if (error?.status === 401) {
    return new AIError('OpenAI authentication failed', AIErrorType.AUTHENTICATION, error)
  }
  
  if (error?.status === 429) {
    const retryAfter = error?.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) : undefined
    return new AIError('OpenAI rate limit exceeded', AIErrorType.RATE_LIMIT, error, retryAfter)
  }
  
  if (error?.status === 400 && error?.error?.type === 'invalid_request_error') {
    return new AIError('OpenAI validation error', AIErrorType.VALIDATION, error)
  }
  
  if (error?.status >= 500) {
    return new AIError('OpenAI server error', AIErrorType.NETWORK, error)
  }
  
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
    return new AIError('Network error connecting to OpenAI', AIErrorType.NETWORK, error)
  }
  
  return new AIError(
    error?.message || 'Unknown OpenAI error',
    AIErrorType.UNKNOWN,
    error
  )
}

// Generate with fallback function
export async function generateWithFallback(
  messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  isComplex: boolean = false
): Promise<{
  text: string
  model: string
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  fallback: boolean
}> {
  // Determine primary model based on complexity
  const primaryModel = isComplex ? PRIMARY_OPENAI_MODEL : FALLBACK_OPENAI_MODEL
  
  try {
    // First attempt with primary model
    const response = await openaiClient.chat.completions.create({
      model: primaryModel,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    })

    const text = response.choices[0]?.message?.content || ''
    if (!text) {
      throw new Error('No content in OpenAI response')
    }

    return {
      text,
      model: primaryModel,
      tokensUsed: response.usage ? {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
        total: response.usage.total_tokens
      } : undefined,
      fallback: false
    }
  } catch {
    console.error(`Primary model (${primaryModel}) failed:`, error)
    
    // Check if error is rate limit, timeout, or 5xx - these warrant fallback
    const parsedError = parseOpenAIError(error)
    const shouldFallback = [
      AIErrorType.RATE_LIMIT,
      AIErrorType.NETWORK,
    ].includes(parsedError.type) || (error as any)?.status >= 500

    if (!shouldFallback) {
      throw parsedError
    }

    // Only attempt fallback if we were using the primary model
    if (!isComplex) {
      throw parsedError // Already using fallback model, don't retry
    }

    try {
      console.log(`Attempting fallback to ${FALLBACK_OPENAI_MODEL}`)
      
      const fallbackResponse = await openaiClient.chat.completions.create({
        model: FALLBACK_OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      })

      const text = fallbackResponse.choices[0]?.message?.content || ''
      if (!text) {
        throw new Error('No content in fallback OpenAI response')
      }

      return {
        text,
        model: FALLBACK_OPENAI_MODEL,
        tokensUsed: fallbackResponse.usage ? {
          input: fallbackResponse.usage.prompt_tokens,
          output: fallbackResponse.usage.completion_tokens,
          total: fallbackResponse.usage.total_tokens
        } : undefined,
        fallback: true
      }
    } catch (fallbackError) {
      console.error(`Fallback model (${FALLBACK_OPENAI_MODEL}) also failed:`, fallbackError)
      
      // Both models failed
      throw new AIError(
        `Both primary (${primaryModel}) and fallback (${FALLBACK_OPENAI_MODEL}) models failed`,
        AIErrorType.UNKNOWN,
        { primary: error, fallback: fallbackError }
      )
    }
  }
}

// Configuration info
export const clientConfig = {
  primaryModel: PRIMARY_OPENAI_MODEL,
  fallbackModel: FALLBACK_OPENAI_MODEL,
  available: true
} 