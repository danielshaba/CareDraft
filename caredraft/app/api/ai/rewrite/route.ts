import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType, clientConfig } from '@/lib/api-client'

// Request validation schema
const rewriteRequestSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters long'),
  style: z.enum(['professional', 'persuasive', 'technical', 'concise', 'formal']).default('professional'),
  focus: z.enum(['clarity', 'impact', 'compliance', 'competitiveness', 'structure']).default('clarity'),
  length: z.enum(['shorter', 'same', 'longer']).default('same'),
  targetAudience: z.string().optional(),
  requirements: z.string().optional(),
})

// Response types
interface RewriteResponse {
  success: boolean
  rewrittenText: string
  improvements: string[]
  model: string
  fallback: boolean
  originalWordCount: number
  newWordCount: number
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  error?: string
}

// Style and focus prompts
const stylePrompts = {
  professional: 'Use formal business language appropriate for UK public sector communications. Maintain professional tone throughout.',
  persuasive: 'Emphasize value propositions, benefits, and competitive advantages. Use compelling language to strengthen the case.',
  technical: 'Focus on technical accuracy, specifications, and detailed methodologies. Use precise terminology.',
  concise: 'Eliminate redundancy and unnecessary words. Make every sentence count while preserving meaning.',
  formal: 'Use highly formal language suitable for official government documents and legal contexts.'
}

const focusPrompts = {
  clarity: 'Improve readability, eliminate ambiguity, and enhance logical flow. Make complex concepts easier to understand.',
  impact: 'Strengthen key messages, highlight achievements, and emphasize unique value propositions.',
  compliance: 'Ensure language meets tender requirements, addresses evaluation criteria, and demonstrates compliance.',
  competitiveness: 'Highlight competitive advantages, differentiators, and why this proposal should win.',
  structure: 'Improve organization, logical flow, and ensure proper progression of ideas.'
}

const lengthPrompts = {
  shorter: 'Reduce length by 20-30% while preserving all key information and maintaining clarity.',
  same: 'Maintain approximately the same length while improving quality and effectiveness.',
  longer: 'Expand by 20-30% with additional detail, examples, and supporting information where appropriate.'
}

// Main rewrite function
async function performRewrite(
  text: string,
  style: keyof typeof stylePrompts,
  focus: keyof typeof focusPrompts,
  length: keyof typeof lengthPrompts,
  targetAudience?: string,
  requirements?: string
) {
  const audienceContext = targetAudience ? `\nTarget Audience: ${targetAudience}` : ''
  const requirementsContext = requirements ? `\nSpecific Requirements: ${requirements}` : ''

  const systemPrompt = `You are an expert UK tender bid writer specializing in improving proposal content.

Writing Style: ${stylePrompts[style]}
Primary Focus: ${focusPrompts[focus]}
Length Adjustment: ${lengthPrompts[length]}${audienceContext}${requirementsContext}

Return a JSON object with this exact structure:
{
  "rewrittenText": "the improved version of the text",
  "improvements": [
    "specific improvement made (e.g., clarified technical terminology)",
    "another improvement made (e.g., strengthened value proposition)"
  ]
}

Rules:
- Rewrite the text according to the specified style, focus, and length requirements
- Preserve all factual information and key messages
- List 3-5 specific improvements made in the improvements array
- Ensure rewritten text is appropriate for UK public sector tenders
- Focus on care sector terminology and best practices where relevant
- Maintain professional standards throughout`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Please rewrite this text:\n\n${text}` }
  ]

  // Use complex=true for rewriting as it requires sophisticated language processing
  const response = await generateWithFallback(messages, true)

  // Parse JSON response
  try {
    const result = JSON.parse(response.text)
    if (!result.rewrittenText || !Array.isArray(result.improvements)) {
      throw new Error('Invalid response structure')
    }
    return {
      rewrittenText: result.rewrittenText,
      improvements: result.improvements,
      model: response.model,
      fallback: response.fallback,
      tokensUsed: response.tokensUsed
    }
  } catch {
    // Fallback: try to extract JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        rewrittenText: result.rewrittenText,
        improvements: result.improvements || [],
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
    const validatedData = rewriteRequestSchema.parse(body)
    const { text, style, focus, length, targetAudience, requirements } = validatedData

    // Calculate original word count
    const originalWordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length

    // Perform rewrite
    const { rewrittenText, improvements, model, fallback, tokensUsed } = await performRewrite(
      text,
      style,
      focus,
      length,
      targetAudience,
      requirements
    )

    // Calculate new word count
    const newWordCount = rewrittenText.split(/\s+/).filter((word: string) => word.length > 0).length

    const response: RewriteResponse = {
      success: true,
      rewrittenText,
      improvements,
      model,
      fallback,
      originalWordCount,
      newWordCount,
      tokensUsed
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Rewrite API error:', error)

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
    endpoint: 'rewrite',
    model: {
      primary: clientConfig.primaryModel,
      fallback: clientConfig.fallbackModel
    },
    available: clientConfig.available,
    options: {
      styles: Object.keys(stylePrompts),
      focuses: Object.keys(focusPrompts),
      lengths: Object.keys(lengthPrompts)
    }
  })
} 