import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType, clientConfig } from '@/lib/api-client'

// Request validation schema
const brainstormRequestSchema = z.object({
  context: z.string().min(10, 'Context must be at least 10 characters long'),
  type: z.enum(['ideas', 'responses', 'solutions', 'improvements']),
  maxSuggestions: z.number().min(1).max(15).default(8),
  tenderDetails: z.object({
    title: z.string().optional(),
    sector: z.string().optional(),
    value: z.string().optional(),
  }).optional(),
})



// Response types
interface BrainstormSuggestion {
  suggestion: string
  relevance: number
  rationale: string
  type: string
}

interface BrainstormResponse {
  success: boolean
  suggestions: BrainstormSuggestion[]
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
  'ideas': `Generate creative ideas for strengthening a tender response. Focus on:
- Innovative approaches that demonstrate value
- Competitive advantages and differentiators  
- Partnership opportunities and collaborations
- Technology solutions and improvements
- Service delivery enhancements
- Risk mitigation strategies`,

  'responses': `Generate specific response ideas for addressing evaluation criteria. Focus on:
- Evidence-based responses with measurable outcomes
- Case studies and success stories
- Technical specifications and methodologies
- Quality assurance and compliance approaches
- Stakeholder engagement strategies
- Performance monitoring frameworks`,

  'solutions': `Generate practical solutions for tender challenges. Focus on:
- Implementation strategies and timelines
- Resource allocation and management
- Process improvements and efficiency gains
- Stakeholder communication plans
- Risk management and contingency planning
- Sustainability and environmental considerations`,

  'improvements': `Generate improvement suggestions for existing response content. Focus on:
- Strengthening weak areas in the response
- Adding missing elements or evidence
- Enhancing clarity and persuasiveness
- Improving structure and flow
- Addressing evaluator concerns
- Demonstrating additional value`
}

// Main brainstorming function
async function performBrainstorming(
  context: string, 
  type: keyof typeof typePrompts, 
  maxSuggestions: number,
  tenderDetails?: { title?: string; sector?: string; value?: string }
) {
  const tenderContext = tenderDetails ? 
    `\nTender Details:
- Title: ${tenderDetails.title || 'Not specified'}
- Sector: ${tenderDetails.sector || 'Not specified'}
- Value: ${tenderDetails.value || 'Not specified'}` : ''

  const systemPrompt = `You are an expert UK tender bid writer specializing in care sector procurement. 
${typePrompts[type]}

${tenderContext}

Return a JSON array of objects with this exact structure:
[
  {
    "suggestion": "specific actionable suggestion",
    "relevance": 85,
    "rationale": "explanation of why this suggestion is valuable",
    "type": "${type}"
  }
]

Rules:
- Generate up to ${maxSuggestions} relevant suggestions
- Relevance should be 1-100 (higher = more relevant to context)
- Focus on UK public sector procurement best practices
- Provide actionable, specific suggestions
- Ensure suggestions are appropriate for care sector tenders
- Return empty array if context is not relevant to tender writing`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Generate ${type} for this tender context:\n\n${context}` }
  ]

  // Use complex=true for brainstorming as it requires creative analysis
  const response = await generateWithFallback(messages, true)

  // Parse JSON response
  try {
    const results = JSON.parse(response.text)
    if (!Array.isArray(results)) {
      throw new Error('Response is not an array')
    }
    return {
      suggestions: results as BrainstormSuggestion[],
      model: response.model,
      fallback: response.fallback,
      tokensUsed: response.tokensUsed
    }
  } catch {
    // Fallback: try to extract JSON from response
    const jsonMatch = response.text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const results = JSON.parse(jsonMatch[0])
      return {
        suggestions: results as BrainstormSuggestion[],
        model: response.model,
        fallback: response.fallback,
        tokensUsed: response.tokensUsed
      }
    }
    throw new AIError('Invalid JSON response from AI model', AIErrorType.VALIDATION)
  }
}

// POST endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = brainstormRequestSchema.parse(body)
    const { context, type, maxSuggestions, tenderDetails } = validatedData

    // Perform brainstorming
    const { suggestions, model, fallback, tokensUsed } = await performBrainstorming(
      context, 
      type, 
      maxSuggestions,
      tenderDetails
    )

    const response: BrainstormResponse = {
      success: true,
      suggestions,
      model,
      fallback,
      tokensUsed
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Brainstorm API error:', error)

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
    endpoint: 'brainstorm',
    model: {
      primary: clientConfig.primaryModel,
      fallback: clientConfig.fallbackModel
    },
    available: clientConfig.available,
    types: Object.keys(typePrompts)
  })
} 