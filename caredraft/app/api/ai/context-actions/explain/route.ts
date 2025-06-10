import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType, clientConfig } from '@/lib/api-client'

// Request validation schema
const explainRequestSchema = z.object({
  text: z.string().min(5, 'Text must be at least 5 characters long'),
  context: z.string().optional(),
  explanationType: z.enum(['how', 'why', 'what', 'when', 'where']).default('how'),
  includeSteps: z.boolean().default(true),
  detail: z.enum(['brief', 'standard', 'comprehensive']).default('standard'),
  targetAudience: z.enum(['technical', 'management', 'general']).default('general'),
})

// Response type
interface ExplainResponse {
  success: boolean
  explanation: string
  originalText: string
  explanationType: string
  keyPoints?: string[]
  practicalTips?: string[]
  model: string
  fallback: boolean
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  error?: string
}

// Explanation type prompts
const explanationPrompts = {
  'how': `Provide a clear, step-by-step explanation of how this works or how to implement this. Focus on methodology, process, and practical implementation steps. Include specific actions and procedures.`,
  
  'why': `Explain the reasoning, rationale, and benefits behind this approach. Focus on the underlying logic, advantages, and importance. Address the value proposition and justification.`,
  
  'what': `Define and clarify what this means, what it involves, and what it encompasses. Provide clear definitions, scope, and comprehensive understanding of the concept.`,
  
  'when': `Explain the timing, circumstances, and conditions when this applies or should be implemented. Include triggers, schedules, and temporal considerations.`,
  
  'where': `Describe the contexts, situations, or environments where this is applicable, relevant, or should be used. Include scope of application and situational factors.`
}

const detailPrompts = {
  'brief': 'Provide a concise explanation focusing on key points only (100-150 words).',
  'standard': 'Provide a balanced explanation with sufficient detail for understanding (150-300 words).',
  'comprehensive': 'Provide thorough explanation with extensive detail and context (300-500 words).'
}

const audiencePrompts = {
  'technical': 'Use technical terminology and assume expert knowledge. Include specific details and methodological precision.',
  'management': 'Focus on strategic implications, outcomes, and business impact. Use professional language suitable for decision-makers.',
  'general': 'Use clear, accessible language suitable for general audiences. Avoid excessive jargon and explain technical terms.'
}

// Main explanation function
async function performExplanation(
  text: string,
  context: string | undefined,
  explanationType: keyof typeof explanationPrompts,
  includeSteps: boolean,
  detail: keyof typeof detailPrompts,
  targetAudience: keyof typeof audiencePrompts
) {
  const contextSection = context ? `\nSurrounding Context: ${context}` : ''
  const stepsSection = includeSteps && explanationType === 'how' ? 
    '\nIMPORTANT: Structure your explanation with clear, numbered steps when applicable.' : ''

  const systemPrompt = `You are an expert consultant specializing in UK public sector procurement and care sector operations.

Explanation Task: ${explanationPrompts[explanationType]}
Detail Level: ${detailPrompts[detail]}
Target Audience: ${audiencePrompts[targetAudience]}${contextSection}${stepsSection}

Return a JSON object with this exact structure:
{
  "explanation": "your detailed explanation here",
  "keyPoints": ["point1", "point2", "point3"],
  "practicalTips": ["tip1", "tip2"]
}

Rules:
- Focus on UK care sector and public procurement context
- Use UK English spelling and terminology
- Provide actionable, practical information
- Include relevant regulatory or compliance considerations
- Ensure explanations are accurate and evidence-based
- Structure content clearly with logical flow
- Include 3-5 key points that summarize the explanation
- Provide 2-3 practical tips or recommendations when applicable
- Maintain professional tone appropriate for tender documentation`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Please explain ${explanationType} for this content:\n\n"${text}"` }
  ]

  // Use complex=true for explanations as they require analytical thinking
  const response = await generateWithFallback(messages, true)

  // Parse JSON response
  try {
    const result = JSON.parse(response.text)
    if (!result.explanation) {
      throw new Error('No explanation in response')
    }
    return {
      explanation: result.explanation,
      keyPoints: result.keyPoints || [],
      practicalTips: result.practicalTips || [],
      model: response.model,
      fallback: response.fallback,
      tokensUsed: response.tokensUsed
    }
  } catch (parseError) {
    // Fallback: try to extract content from response
    const explanationMatch = response.text.match(/"explanation":\s*"([^"]+)"/)
    if (explanationMatch) {
      const explanation = explanationMatch[1]
      return {
        explanation,
        keyPoints: ['Explanation provided using fallback parsing'],
        practicalTips: [],
        model: response.model,
        fallback: response.fallback,
        tokensUsed: response.tokensUsed
      }
    }
    
    // Last resort: use the raw response as explanation
    return {
      explanation: response.text,
      keyPoints: ['Raw AI response used as explanation'],
      practicalTips: [],
      model: response.model,
      fallback: response.fallback,
      tokensUsed: response.tokensUsed
    }
  }
}

// POST endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = explainRequestSchema.parse(body)
    const { text, context, explanationType, includeSteps, detail, targetAudience } = validatedData

    // Perform explanation
    const { explanation, keyPoints, practicalTips, model, fallback, tokensUsed } = await performExplanation(
      text,
      context,
      explanationType,
      includeSteps,
      detail,
      targetAudience
    )

    const response: ExplainResponse = {
      success: true,
      explanation,
      originalText: text,
      explanationType,
      keyPoints,
      practicalTips,
      model,
      fallback,
      tokensUsed
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Explain API error:', error)

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
    endpoint: 'explain',
    model: {
      primary: clientConfig.primaryModel,
      fallback: clientConfig.fallbackModel
    },
    available: clientConfig.available,
    options: {
      explanationTypes: Object.keys(explanationPrompts),
      detailLevels: Object.keys(detailPrompts),
      audiences: Object.keys(audiencePrompts)
    }
  })
} 