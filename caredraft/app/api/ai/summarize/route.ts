import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType, clientConfig } from '@/lib/api-client'

// Request validation schema
const summarizeRequestSchema = z.object({
  text: z.string().min(50, 'Text must be at least 50 characters long'),
  type: z.enum(['executive', 'detailed', 'bullet-points', 'key-facts', 'action-items']).default('executive'),
  length: z.enum(['brief', 'medium', 'comprehensive']).default('medium'),
  targetAudience: z.string().optional(),
  focus: z.string().optional(),
})

// Response types
interface SummaryMetadata {
  originalWordCount: number
  summaryWordCount: number
  compressionRatio: number
  readingTime: number
  keyTopics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  urgency: 'low' | 'medium' | 'high'
}

interface SummarizeResponse {
  success: boolean
  summary: string
  metadata: SummaryMetadata
  model: string
  fallback: boolean
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  error?: string
}

// Type-specific prompts
const typePrompts = {
  'executive': `Create an executive summary focusing on strategic implications, key decisions needed, and high-level outcomes. Target senior stakeholders who need to understand the big picture and make informed decisions.`,
  
  'detailed': `Create a comprehensive summary that preserves important context, technical details, and nuanced information. Suitable for managers and specialists who need thorough understanding.`,
  
  'bullet-points': `Create a structured bullet-point summary with clear headings and easy-to-scan information. Focus on actionable items and key facts.`,
  
  'key-facts': `Extract and summarize the most critical facts, figures, dates, requirements, and decision points. Focus on objective information that drives action.`,
  
  'action-items': `Identify and summarize specific actions required, deadlines, responsibilities, and next steps. Focus on what needs to be done and when.`
}

const lengthPrompts = {
  'brief': 'Keep summary concise (100-200 words). Focus only on the most essential points.',
  'medium': 'Provide balanced summary (200-400 words). Include key details while maintaining readability.',
  'comprehensive': 'Create thorough summary (400-600 words). Include important context and supporting details.'
}

// Main summarize function
async function performSummarization(
  text: string,
  type: keyof typeof typePrompts,
  length: keyof typeof lengthPrompts,
  targetAudience?: string,
  focus?: string
) {
  const audienceContext = targetAudience ? `\nTarget Audience: ${targetAudience}` : ''
  const focusContext = focus ? `\nSpecific Focus: ${focus}` : ''

  const systemPrompt = `You are an expert document analyzer specializing in UK tender and procurement documents.

Summary Type: ${typePrompts[type]}
Length Requirement: ${lengthPrompts[length]}${audienceContext}${focusContext}

Return a JSON object with this exact structure:
{
  "summary": "your summary text here",
  "metadata": {
    "originalWordCount": 500,
    "summaryWordCount": 150,
    "compressionRatio": 3.33,
    "readingTime": 2,
    "keyTopics": ["topic1", "topic2", "topic3"],
    "sentiment": "positive",
    "urgency": "medium"
  }
}

Rules:
- Create summary according to specified type and length requirements
- Calculate accurate word counts and compression ratio
- Estimate reading time in minutes (assume 200 words per minute)
- Identify 3-5 key topics from the content
- Assess overall sentiment: positive, neutral, or negative
- Determine urgency level: low, medium, or high
- Focus on UK public sector and care sector context where relevant
- Ensure summary serves the specified audience effectively`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Please summarize this text:\n\n${text}` }
  ]

  // Use complex=false for simple summaries, true for comprehensive ones
  const isComplex = type === 'detailed' || length === 'comprehensive'
  const response = await generateWithFallback(messages, isComplex)

  // Parse JSON response
  try {
    const result = JSON.parse(response.text)
    if (!result.summary || !result.metadata) {
      throw new Error('Invalid response structure')
    }
    return {
      summary: result.summary,
      metadata: result.metadata as SummaryMetadata,
      model: response.model,
      fallback: response.fallback,
      tokensUsed: response.tokensUsed
    }
  } catch (error) {
    console.error('Summarize API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    if (error instanceof AIError) {
      let statusCode = 500
      if (error.type === AIErrorType.AUTHENTICATION) statusCode = 401
      if (error.type === AIErrorType.RATE_LIMIT) statusCode = 429
      if (error.type === AIErrorType.VALIDATION) statusCode = 400

      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          type: error.type
        },
        { 
          status: statusCode,
          headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : {}
        }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// POST endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = summarizeRequestSchema.parse(body)
    const { text, type, length, targetAudience, focus } = validatedData

    // Perform summarization
    const result = await performSummarization(
      text,
      type,
      length,
      targetAudience,
      focus
    )
    
    // Check if result is an error response
    if (result instanceof NextResponse) {
      return result
    }

    const response: SummarizeResponse = {
      success: true,
      summary: result.summary,
      metadata: result.metadata,
      model: result.model,
      fallback: result.fallback,
      tokensUsed: result.tokensUsed
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Summarize API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    if (error instanceof AIError) {
      let statusCode = 500
      if (error.type === AIErrorType.AUTHENTICATION) statusCode = 401
      if (error.type === AIErrorType.RATE_LIMIT) statusCode = 429
      if (error.type === AIErrorType.VALIDATION) statusCode = 400

      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          type: error.type
        },
        { 
          status: statusCode,
          headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : {}
        }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: 'summarize',
    model: {
      primary: clientConfig.primaryModel,
      fallback: clientConfig.fallbackModel
    },
    available: clientConfig.available,
    options: {
      types: Object.keys(typePrompts),
      lengths: Object.keys(lengthPrompts)
    }
  })
} 