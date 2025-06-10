import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType, clientConfig } from '@/lib/api-client'

// Request validation schema
const grammarRequestSchema = z.object({
  text: z.string().min(5, 'Text must be at least 5 characters long'),
  context: z.string().optional(),
  level: z.enum(['light', 'standard', 'thorough']).default('standard'),
  preserveStyle: z.boolean().default(true),
  ukEnglish: z.boolean().default(true),
  formalTone: z.boolean().default(true),
})

// Response type
interface GrammarResponse {
  success: boolean
  correctedText: string
  originalText: string
  corrections: Array<{
    type: string
    description: string
    original: string
    corrected: string
  }>
  improvementSummary?: string
  model: string
  fallback: boolean
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  error?: string
}

// Grammar correction level prompts
const grammarPrompts = {
  'light': `Perform light grammar corrections focusing only on clear errors: spelling mistakes, obvious grammatical errors, and basic punctuation issues. Preserve original style and phrasing.`,
  
  'standard': `Perform standard grammar and style improvements: correct grammar, spelling, punctuation, improve sentence structure, enhance clarity, and fix awkward phrasing while maintaining the original voice.`,
  
  'thorough': `Perform comprehensive grammar and style enhancement: correct all grammatical issues, improve sentence structure, enhance clarity and flow, optimize word choice, ensure consistency, and refine professional presentation while preserving meaning and intent.`
}

// Main grammar correction function
async function performGrammarCorrection(
  text: string,
  context: string | undefined,
  level: keyof typeof grammarPrompts,
  preserveStyle: boolean,
  ukEnglish: boolean,
  formalTone: boolean
) {
  const contextSection = context ? `\nSurrounding Context: ${context}` : ''
  const styleSection = preserveStyle ? '\nIMPORTANT: Preserve the original writing style, voice, and tone.' : ''
  const languageSection = ukEnglish ? '\nUse UK English spelling, punctuation, and conventions.' : '\nUse standard English conventions.'
  const toneSection = formalTone ? '\nMaintain formal, professional tone suitable for business documentation.' : ''

  const systemPrompt = `You are an expert editor specializing in UK public sector and care sector documentation.

Grammar Task: ${grammarPrompts[level]}${contextSection}${styleSection}${languageSection}${toneSection}

Return a JSON object with this exact structure:
{
  "correctedText": "the corrected text here",
  "corrections": [
    {
      "type": "spelling|grammar|punctuation|style|clarity",
      "description": "brief description of the correction",
      "original": "original phrase",
      "corrected": "corrected phrase"
    }
  ],
  "improvementSummary": "brief summary of changes made"
}

Rules:
- Focus on UK care sector and public procurement terminology
- Maintain technical terms and industry-specific language
- Ensure corrections improve readability and professionalism
- Preserve the original meaning and intent
- Use UK English spelling (colour, realise, centre, etc.)
- Follow UK punctuation conventions
- List all significant corrections made
- Provide clear descriptions for each correction type
- If no corrections needed, return original text with empty corrections array`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Please correct the grammar and style of this text:\n\n"${text}"` }
  ]

  // Use complex=false for grammar corrections as they're more mechanical
  const response = await generateWithFallback(messages, false)

  // Parse JSON response
  try {
    const result = JSON.parse(response.text)
    if (!result.correctedText) {
      throw new Error('No correctedText in response')
    }
    return {
      correctedText: result.correctedText,
      corrections: result.corrections || [],
      improvementSummary: result.improvementSummary || 'Grammar checked',
      model: response.model,
      fallback: response.fallback,
      tokensUsed: response.tokensUsed
    }
  } catch (parseError) {
    // Fallback: try to extract content from response
    const correctedMatch = response.text.match(/"correctedText":\s*"([^"]+)"/)
    if (correctedMatch) {
      const correctedText = correctedMatch[1]
      return {
        correctedText,
        corrections: [{
          type: 'fallback',
          description: 'Text processed using fallback parsing',
          original: text.substring(0, 50) + '...',
          corrected: correctedText.substring(0, 50) + '...'
        }],
        improvementSummary: 'Processed using fallback method',
        model: response.model,
        fallback: response.fallback,
        tokensUsed: response.tokensUsed
      }
    }
    
    // Last resort: return original text
    return {
      correctedText: text,
      corrections: [],
      improvementSummary: 'No corrections could be applied',
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
    const validatedData = grammarRequestSchema.parse(body)
    const { text, context, level, preserveStyle, ukEnglish, formalTone } = validatedData

    // Perform grammar correction
    const { correctedText, corrections, improvementSummary, model, fallback, tokensUsed } = await performGrammarCorrection(
      text,
      context,
      level,
      preserveStyle,
      ukEnglish,
      formalTone
    )

    const response: GrammarResponse = {
      success: true,
      correctedText,
      originalText: text,
      corrections,
      improvementSummary,
      model,
      fallback,
      tokensUsed
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Grammar API error:', error)

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
    endpoint: 'grammar',
    model: {
      primary: clientConfig.primaryModel,
      fallback: clientConfig.fallbackModel
    },
    available: clientConfig.available,
    options: {
      levels: Object.keys(grammarPrompts),
      features: ['preserveStyle', 'ukEnglish', 'formalTone']
    }
  })
} 