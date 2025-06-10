import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType, clientConfig } from '@/lib/api-client'

// Request validation schema
const expandRequestSchema = z.object({
  text: z.string().min(5, 'Text must be at least 5 characters long'),
  context: z.string().optional(),
  expandType: z.enum(['detailed', 'comprehensive', 'technical', 'examples']).default('detailed'),
  preserveTone: z.boolean().default(true),
  targetLength: z.enum(['moderate', 'substantial', 'comprehensive']).default('moderate'),
  focus: z.string().optional(),
})

// Response type
interface ExpandResponse {
  success: boolean
  expandedText: string
  originalText: string
  expansionRatio: number
  improvements?: string[]
  model: string
  fallback: boolean
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  error?: string
}

// Expansion type prompts
const expansionPrompts = {
  'detailed': `Add comprehensive detail and explanation while maintaining the original meaning and structure. Include relevant context, clarifications, and supporting information that enhances understanding.`,
  
  'comprehensive': `Provide thorough expansion with in-depth analysis, multiple perspectives, and comprehensive coverage of all relevant aspects. Include background context, implications, and detailed explanations.`,
  
  'technical': `Expand with technical depth, methodological details, specifications, and expert-level information. Include technical terminology, processes, and implementation details appropriate for professional audiences.`,
  
  'examples': `Enhance with concrete examples, case studies, practical applications, and real-world scenarios that illustrate the concepts. Include specific instances and demonstrative content.`
}

const lengthPrompts = {
  'moderate': 'Expand to approximately 150-250% of the original length. Focus on key enhancements.',
  'substantial': 'Expand to approximately 250-400% of the original length. Provide thorough detail.',
  'comprehensive': 'Expand to approximately 400-600% of the original length. Include extensive detail and context.'
}

// Main expansion function
async function performExpansion(
  text: string,
  context: string | undefined,
  expandType: keyof typeof expansionPrompts,
  preserveTone: boolean,
  targetLength: keyof typeof lengthPrompts,
  focus?: string
) {
  const contextSection = context ? `\nSurrounding Context: ${context}` : ''
  const focusSection = focus ? `\nSpecific Focus: ${focus}` : ''
  const toneSection = preserveTone ? '\nIMPORTANT: Preserve the original tone, style, and voice of the text.' : ''

  const systemPrompt = `You are an expert content developer specializing in UK tender and proposal writing for the care sector.

Expansion Task: ${expansionPrompts[expandType]}
Length Target: ${lengthPrompts[targetLength]}${contextSection}${focusSection}${toneSection}

Return a JSON object with this exact structure:
{
  "expandedText": "your expanded content here",
  "expansionRatio": 2.5,
  "improvements": ["improvement1", "improvement2"]
}

Rules:
- Maintain the original meaning and intent
- Use UK English spelling and terminology
- Focus on care sector and public procurement context
- Ensure expanded content is relevant and valuable
- Calculate accurate expansion ratio (new length / original length)
- List 2-3 key improvements made during expansion
- Preserve any technical terms or specific requirements mentioned
- Maintain professional, persuasive tone appropriate for tender documents`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Please expand this text:\n\n"${text}"` }
  ]

  // Use complex=true for expansions as they require creative analysis
  const response = await generateWithFallback(messages, true)

  // Parse JSON response
  try {
    const result = JSON.parse(response.text)
    if (!result.expandedText) {
      throw new Error('No expandedText in response')
    }
    return {
      expandedText: result.expandedText,
      expansionRatio: result.expansionRatio || 0,
      improvements: result.improvements || [],
      model: response.model,
      fallback: response.fallback,
      tokensUsed: response.tokensUsed
    }
  } catch (parseError) {
    // Fallback: try to extract content from response
    const textMatch = response.text.match(/"expandedText":\s*"([^"]+)"/)
    if (textMatch) {
      const expandedText = textMatch[1]
      return {
        expandedText,
        expansionRatio: expandedText.length / text.length,
        improvements: ['Content expanded using fallback parsing'],
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
    const validatedData = expandRequestSchema.parse(body)
    const { text, context, expandType, preserveTone, targetLength, focus } = validatedData

    // Perform expansion
    const { expandedText, expansionRatio, improvements, model, fallback, tokensUsed } = await performExpansion(
      text,
      context,
      expandType,
      preserveTone,
      targetLength,
      focus
    )

    const response: ExpandResponse = {
      success: true,
      expandedText,
      originalText: text,
      expansionRatio,
      improvements,
      model,
      fallback,
      tokensUsed
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Expand API error:', error)

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
    endpoint: 'expand',
    model: {
      primary: clientConfig.primaryModel,
      fallback: clientConfig.fallbackModel
    },
    available: clientConfig.available,
    options: {
      expandTypes: Object.keys(expansionPrompts),
      targetLengths: Object.keys(lengthPrompts)
    }
  })
} 