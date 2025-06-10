import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback } from '@/lib/api-client'
import { AIError } from '@/lib/errors'

const incorporateRequestSchema = z.object({
  original_text: z.string().min(1, 'Original text is required'),
  content_to_incorporate: z.string().min(1, 'Content to incorporate is required'),
  incorporation_style: z.enum(['seamless', 'explicit', 'additive']).default('seamless'),
  maintain_flow: z.boolean().default(true),
  preserve_tone: z.boolean().default(true)
})

const incorporateResponseSchema = z.object({
  incorporated_text: z.string(),
  integration_points: z.array(z.object({
    original_position: z.number(),
    incorporated_content: z.string(),
    reason: z.string()
  })),
  tone_consistency: z.number().min(0).max(100),
  flow_score: z.number().min(0).max(100),
  suggestions: z.array(z.string()).optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { original_text, content_to_incorporate, incorporation_style, maintain_flow, preserve_tone } = incorporateRequestSchema.parse(body)

    const styleInstructions = {
      seamless: 'Merge the content naturally without obvious seams, maintaining narrative flow',
      explicit: 'Clearly mark where new content begins and ends while keeping readability',
      additive: 'Add new content as supporting information or examples'
    }

    const prompt = `You are a professional content editor specializing in seamless content integration for UK care sector proposals.

TASK: Incorporate additional content into the original text while maintaining quality and coherence.

ORIGINAL TEXT:
"${original_text}"

CONTENT TO INCORPORATE:
"${content_to_incorporate}"

INTEGRATION STYLE: ${incorporation_style}
- ${styleInstructions[incorporation_style]}

REQUIREMENTS:
- Maintain flow: ${maintain_flow ? 'Yes' : 'No'}
- Preserve tone: ${preserve_tone ? 'Yes' : 'No'}
- Focus on UK care sector context and terminology
- Ensure all incorporated content adds value
- Maintain professional proposal writing standards
- Preserve compliance and regulatory accuracy

REQUIRED OUTPUT FORMAT (JSON):
{
  "incorporated_text": "The complete text with seamlessly integrated content",
  "integration_points": [
    {
      "original_position": number (character position where content was integrated),
      "incorporated_content": "The specific content that was added here",
      "reason": "Why this content was placed at this position"
    }
  ],
  "tone_consistency": number (0-100, how well the tone was maintained),
  "flow_score": number (0-100, how natural the integration feels),
  "suggestions": ["Optional suggestions for further improvement"]
}

Focus on creating natural, high-quality integration that enhances the original content.`

    const aiResponse = await generateWithFallback([
      { role: 'user', content: prompt }
    ], true)

    // Parse AI response
    let parsedResponse
    try {
      const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      parsedResponse = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.warn('Failed to parse AI response, creating fallback:', parseError)
      
      // Fallback: Simple concatenation with basic structure
      parsedResponse = {
        incorporated_text: `${original_text}\n\n${content_to_incorporate}`,
        integration_points: [{
          original_position: original_text.length,
          incorporated_content: content_to_incorporate,
          reason: 'Added as additional content due to parsing error'
        }],
        tone_consistency: 75,
        flow_score: 60,
        suggestions: ['Content was added but may need manual review for better integration']
      }
    }

    const validatedResponse = incorporateResponseSchema.parse(parsedResponse)

    return NextResponse.json({
      success: true,
      data: validatedResponse,
      metadata: {
        model_used: aiResponse.model,
        processing_time_ms: Date.now(),
        tokens_used: aiResponse.tokensUsed,
        fallback_used: aiResponse.fallback
      }
    })

  } catch (error) {
    console.error('Incorporate content error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof AIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to incorporate content' },
      { status: 500 }
    )
  }
} 