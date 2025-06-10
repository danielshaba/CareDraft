import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType } from '@/lib/api-client'

// Request validation schema
const tenseChangeRequestSchema = z.object({
  text: z.string().min(5, 'Text must be at least 5 characters long'),
  context: z.string().optional(),
  targetTense: z.enum(['past', 'present', 'future', 'past_perfect', 'present_perfect', 'future_perfect']).default('present'),
  preserveMeaning: z.boolean().default(true),
  maintainVoice: z.boolean().default(true),
  formalTone: z.boolean().default(true),
})

// Response type
interface TenseChangeResponse {
  success: boolean
  convertedText: string
  originalText: string
  targetTense: string
  changes: Array<{
    original: string
    converted: string
    explanation: string
  }>
  model: string
  fallback: boolean
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = tenseChangeRequestSchema.parse(body)
    const { text, context, targetTense, preserveMeaning, maintainVoice, formalTone } = validatedData

    // Create tense description map
    const tenseDescriptions = {
      past: 'simple past tense (actions completed in the past)',
      present: 'simple present tense (current state or habitual actions)',
      future: 'simple future tense (actions that will happen)',
      past_perfect: 'past perfect tense (actions completed before another past action)',
      present_perfect: 'present perfect tense (actions completed with relevance to present)',
      future_perfect: 'future perfect tense (actions that will be completed by a future time)'
    }

    const prompt = `You are an expert in English grammar and tense conversion. Convert the following text to ${tenseDescriptions[targetTense]}.

Original text:
"${text}"

${context ? `Context: ${context}` : ''}

Requirements:
- Convert all verbs to ${tenseDescriptions[targetTense]}
- ${preserveMeaning ? 'Preserve exact meaning and intent' : 'Allow slight meaning adjustments if needed'}
- ${maintainVoice ? 'Maintain active/passive voice where appropriate' : 'Optimize voice for clarity'}
- ${formalTone ? 'Use formal, professional language' : 'Use natural, conversational language'}
- Ensure UK English grammar and spelling
- Maintain proper subject-verb agreement
- Keep the original sentence structure where possible

Return ONLY a JSON object with this exact structure:
{
  "convertedText": "the text converted to the target tense",
  "changes": [
    {
      "original": "original verb phrase",
      "converted": "converted verb phrase", 
      "explanation": "brief explanation of the change"
    }
  ]
}`

    // Call AI service
    const response = await generateWithFallback([
      { role: 'user', content: prompt }
    ], true)

    if (!response.text) {
      return NextResponse.json(
        { error: 'Failed to convert tense', details: 'No response text' },
        { status: 500 }
      )
    }

    // Parse response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(response.text)
    } catch (parseError) {
      // Fallback parsing
      const convertedMatch = response.text.match(/"convertedText":\s*"([^"]+)"/)
      if (convertedMatch) {
        parsedResponse = {
          convertedText: convertedMatch[1],
          changes: [{
            original: 'Various verbs',
            converted: 'Converted to ' + targetTense,
            explanation: 'Tense conversion applied'
          }]
        }
      } else {
        parsedResponse = {
          convertedText: response.text,
          changes: [{
            original: 'Text',
            converted: 'Converted text',
            explanation: 'Tense conversion attempted'
          }]
        }
      }
    }

    const result: TenseChangeResponse = {
      success: true,
      convertedText: parsedResponse.convertedText || response.text,
      originalText: text,
      targetTense,
      changes: parsedResponse.changes || [],
      model: response.model || 'claude-sonnet-4',
      fallback: !response.text.includes('"convertedText"'),
      tokensUsed: response.tokensUsed ? {
        input: response.tokensUsed.input || 0,
        output: response.tokensUsed.output || 0,
        total: response.tokensUsed.total || 0
      } : undefined
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Tense change endpoint error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof AIError) {
      const statusCode = error.type === AIErrorType.RATE_LIMIT ? 429 : 
                        error.type === AIErrorType.AUTHENTICATION ? 401 : 500
      
      return NextResponse.json(
        { error: error.message, type: error.type },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'AI Context Menu - Tense Change',
    status: 'operational',
    supportedTenses: ['past', 'present', 'future', 'past_perfect', 'present_perfect', 'future_perfect'],
    description: 'Intelligent tense conversion while preserving meaning and context'
  })
} 