import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType } from '@/lib/api-client'

// Request validation schema
const summarizeRequestSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters long'),
  context: z.string().optional(),
  length: z.enum(['brief', 'standard', 'detailed']).default('standard'),
  style: z.enum(['bullet', 'paragraph', 'structured']).default('paragraph'),
  focusOn: z.string().optional(),
  preserveKeyPoints: z.boolean().default(true),
  sector: z.enum(['care', 'health', 'social', 'public', 'general']).default('care'),
})

// Response type
interface SummarizeResponse {
  success: boolean
  summary: string
  originalText: string
  compressionRatio: number
  keyPoints: string[]
  style: string
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
    const validatedData = summarizeRequestSchema.parse(body)
    const { text, context, length, style, focusOn, preserveKeyPoints, sector } = validatedData

    // Create prompt based on parameters
    const lengthMap = {
      brief: '2-3 sentences',
      standard: '1-2 paragraphs', 
      detailed: '3-4 paragraphs'
    }

    const styleInstructions = {
      bullet: 'Format as clear bullet points',
      paragraph: 'Format as flowing paragraphs',
      structured: 'Format with clear headings and sections'
    }

    const prompt = `You are an expert content summarizer for ${sector} sector documentation. 

Please summarize the following text:
"${text}"

${context ? `Context: ${context}` : ''}

Requirements:
- Length: ${lengthMap[length]}
- Style: ${styleInstructions[style]}
- ${focusOn ? `Focus particularly on: ${focusOn}` : ''}
- ${preserveKeyPoints ? 'Preserve all key points and important details' : 'Focus on main themes only'}
- Use professional, clear language appropriate for ${sector} sector
- Maintain accuracy and factual integrity
- Ensure UK English spelling and terminology

Return ONLY a JSON object with this exact structure:
{
  "summary": "the summarized content here",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "compressionRatio": 0.65
}`

    // Call AI service
    const response = await generateWithFallback([
      { role: 'user', content: prompt }
    ], true)

    if (!response.text) {
      return NextResponse.json(
        { error: 'Failed to generate summary', details: 'No response text' },
        { status: 500 }
      )
    }

    // Parse response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(response.text)
    } catch (parseError) {
      // Fallback parsing
      const summaryMatch = response.text.match(/"summary":\s*"([^"]+)"/)
      if (summaryMatch) {
        parsedResponse = {
          summary: summaryMatch[1],
          keyPoints: ['Summary generated'],
          compressionRatio: 0.5
        }
      } else {
        parsedResponse = {
          summary: response.text.slice(0, 500) + '...',
          keyPoints: ['Summary generated'],
          compressionRatio: 0.5
        }
      }
    }

    const result: SummarizeResponse = {
      success: true,
      summary: parsedResponse.summary || response.text,
      originalText: text,
      compressionRatio: parsedResponse.compressionRatio || 0.5,
      keyPoints: parsedResponse.keyPoints || ['Summary generated'],
      style,
      model: response.model || 'claude-sonnet-4',
      fallback: !response.text.includes('"summary"'),
      tokensUsed: response.tokensUsed ? {
        input: response.tokensUsed.input || 0,
        output: response.tokensUsed.output || 0,
        total: response.tokensUsed.total || 0
      } : undefined
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Summarize endpoint error:', error)

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
    endpoint: 'AI Context Menu - Summarize',
    status: 'operational',
    supportedLengths: ['brief', 'standard', 'detailed'],
    supportedStyles: ['bullet', 'paragraph', 'structured'],
    supportedSectors: ['care', 'health', 'social', 'public', 'general']
  })
} 