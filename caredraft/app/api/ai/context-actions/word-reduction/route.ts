import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType } from '@/lib/api-client'

// Request validation schema
const wordReductionRequestSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters long'),
  context: z.string().optional(),
  reductionType: z.enum(['word_count', 'character_count', 'semantic']).default('word_count'),
  targetReduction: z.enum(['light', 'moderate', 'aggressive']).default('moderate'),
  preservePriority: z.enum(['meaning', 'facts', 'tone', 'structure']).default('meaning'),
  maintainClarity: z.boolean().default(true),
})

// Response type
interface WordReductionResponse {
  success: boolean
  reducedText: string
  originalText: string
  reductionStats: {
    originalWordCount: number
    reducedWordCount: number
    originalCharCount: number
    reducedCharCount: number
    reductionPercentage: number
  }
  removedElements: string[]
  preservedElements: string[]
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
    const validatedData = wordReductionRequestSchema.parse(body)
    const { text, context, reductionType, targetReduction, preservePriority, maintainClarity } = validatedData

    // Calculate original counts
    const originalWordCount = text.split(/\s+/).length
    const originalCharCount = text.length

    // Create reduction target descriptions
    const reductionTargets = {
      light: '10-20%',
      moderate: '25-40%', 
      aggressive: '45-60%'
    }

    const reductionInstructions = {
      word_count: 'Focus on reducing word count while maintaining readability',
      character_count: 'Focus on reducing character count, including shorter words and contractions',
      semantic: 'Focus on semantic compression, removing redundancy while preserving core meaning'
    }

    const priorityInstructions = {
      meaning: 'Preserve core meaning and message above all else',
      facts: 'Preserve all factual information and data points',
      tone: 'Preserve writing tone and style',
      structure: 'Preserve document structure and organization'
    }

    const prompt = `You are an expert editor specializing in content reduction and semantic compression.

Reduce the following text by approximately ${reductionTargets[targetReduction]}:

Original text:
"${text}"

${context ? `Context: ${context}` : ''}

Requirements:
- Reduction approach: ${reductionInstructions[reductionType]}
- Priority: ${priorityInstructions[preservePriority]}
- Target reduction: ${reductionTargets[targetReduction]}
- ${maintainClarity ? 'Maintain clarity and readability' : 'Prioritize brevity over clarity'}
- Use UK English spelling and grammar
- Remove redundancy, filler words, and unnecessary modifiers
- Combine related ideas where possible
- Keep essential information intact

Return ONLY a JSON object with this exact structure:
{
  "reducedText": "the reduced text here",
  "removedElements": ["redundant phrases", "filler words", "unnecessary modifiers"],
  "preservedElements": ["key facts", "important concepts", "core message"]
}`

    // Call AI service
    const response = await generateWithFallback([
      { role: 'user', content: prompt }
    ], true)

    if (!response.text) {
      return NextResponse.json(
        { error: 'Failed to reduce text', details: 'No response text' },
        { status: 500 }
      )
    }

    // Parse response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(response.text)
    } catch (parseError) {
      // Fallback parsing
      const reducedMatch = response.text.match(/"reducedText":\s*"([^"]+)"/)
      if (reducedMatch) {
        parsedResponse = {
          reducedText: reducedMatch[1],
          removedElements: ['Excess content'],
          preservedElements: ['Core content']
        }
      } else {
        // Simple reduction fallback
        const words = text.split(/\s+/)
        const targetLength = Math.floor(words.length * (targetReduction === 'light' ? 0.8 : targetReduction === 'moderate' ? 0.7 : 0.6))
        parsedResponse = {
          reducedText: words.slice(0, targetLength).join(' ') + '...',
          removedElements: ['Trailing content'],
          preservedElements: ['Beginning content']
        }
      }
    }

    // Calculate reduction stats
    const reducedWordCount = parsedResponse.reducedText.split(/\s+/).length
    const reducedCharCount = parsedResponse.reducedText.length
    const reductionPercentage = Math.round(((originalWordCount - reducedWordCount) / originalWordCount) * 100)

    const result: WordReductionResponse = {
      success: true,
      reducedText: parsedResponse.reducedText || response.text,
      originalText: text,
      reductionStats: {
        originalWordCount,
        reducedWordCount,
        originalCharCount,
        reducedCharCount,
        reductionPercentage
      },
      removedElements: parsedResponse.removedElements || [],
      preservedElements: parsedResponse.preservedElements || [],
      model: response.model || 'claude-sonnet-4',
      fallback: !response.text.includes('"reducedText"'),
      tokensUsed: response.tokensUsed ? {
        input: response.tokensUsed.input || 0,
        output: response.tokensUsed.output || 0,
        total: response.tokensUsed.total || 0
      } : undefined
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Word reduction endpoint error:', error)

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
    endpoint: 'AI Context Menu - Word Reduction',
    status: 'operational',
    supportedTypes: ['word_count', 'character_count', 'semantic'],
    supportedTargets: ['light', 'moderate', 'aggressive'],
    supportedPriorities: ['meaning', 'facts', 'tone', 'structure'],
    description: 'Intelligent text reduction with semantic compression'
  })
} 