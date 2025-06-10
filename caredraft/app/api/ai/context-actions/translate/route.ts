import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback } from '@/lib/api-client'
import { AIError } from '@/lib/errors'

const translateRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  target_language: z.string().min(1, 'Target language is required'),
  preserve_formatting: z.boolean().default(true),
  care_sector_context: z.boolean().default(true),
  quality_level: z.enum(['basic', 'professional', 'certified']).default('professional')
})

const translateResponseSchema = z.object({
  translated_text: z.string(),
  source_language: z.string(),
  target_language: z.string(),
  confidence_score: z.number().min(0).max(100),
  formatting_preserved: z.boolean(),
  cultural_adaptations: z.array(z.object({
    original: z.string(),
    adapted: z.string(),
    reason: z.string()
  })).optional(),
  suggestions: z.array(z.string()).optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, target_language, preserve_formatting, care_sector_context, quality_level } = translateRequestSchema.parse(body)

    const qualityInstructions = {
      basic: 'Provide functional translation with basic accuracy',
      professional: 'Ensure high-quality professional translation with industry terminology',
      certified: 'Provide certified-level translation with perfect accuracy and cultural adaptation'
    }

    const prompt = `You are a professional translator specializing in UK care sector documentation and proposals.

TASK: Translate the provided text while maintaining professional standards and care sector context.

SOURCE TEXT:
"${text}"

TRANSLATION REQUIREMENTS:
- Target Language: ${target_language}
- Quality Level: ${quality_level} - ${qualityInstructions[quality_level]}
- Preserve Formatting: ${preserve_formatting ? 'Yes' : 'No'}
- Care Sector Context: ${care_sector_context ? 'Yes - maintain care industry terminology and compliance language' : 'No'}

INSTRUCTIONS:
- Maintain professional tone appropriate for care sector proposals
- Preserve technical terminology where culturally appropriate
- Adapt cultural references while maintaining meaning
- Ensure compliance and regulatory language is accurately translated
- Maintain proposal structure and persuasive elements
- Consider target audience cultural context

REQUIRED OUTPUT FORMAT (JSON):
{
  "translated_text": "The professionally translated text",
  "source_language": "Detected source language",
  "target_language": "${target_language}",
  "confidence_score": number (0-100, translation confidence),
  "formatting_preserved": boolean,
  "cultural_adaptations": [
    {
      "original": "Original phrase",
      "adapted": "Culturally adapted version",
      "reason": "Why adaptation was necessary"
    }
  ],
  "suggestions": ["Optional suggestions for improvement or context"]
}

Focus on creating accurate, culturally appropriate translations that maintain professional impact.`

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
      
      // Fallback: Return original text with warning
      parsedResponse = {
        translated_text: `[Translation to ${target_language} failed - original text preserved]: ${text}`,
        source_language: 'English',
        target_language: target_language,
        confidence_score: 30,
        formatting_preserved: true,
        cultural_adaptations: [],
        suggestions: ['Translation failed, please review manually or try again']
      }
    }

    const validatedResponse = translateResponseSchema.parse(parsedResponse)

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
    console.error('Translation error:', error)

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
      { error: 'Internal server error', message: 'Failed to translate text' },
      { status: 500 }
    )
  }
} 