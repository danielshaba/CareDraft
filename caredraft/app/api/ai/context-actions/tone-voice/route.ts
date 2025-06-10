import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback } from '@/lib/api-client'
import { AIError } from '@/lib/errors'

const toneVoiceRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  tone_style: z.enum(['professional', 'compassionate', 'confident', 'collaborative', 'innovative']).default('professional'),
  intensity: z.enum(['subtle', 'moderate', 'strong']).default('moderate'),
  preserve_meaning: z.boolean().default(true),
  target_audience: z.enum(['commissioners', 'service_users', 'stakeholders', 'colleagues']).optional()
})

const toneVoiceResponseSchema = z.object({
  styled_text: z.string(),
  tone_analysis: z.object({
    original_tone: z.string(),
    applied_tone: z.string(),
    consistency_score: z.number().min(0).max(100)
  }),
  changes_made: z.array(z.object({
    original: z.string(),
    modified: z.string(),
    reason: z.string()
  })),
  audience_alignment: z.number().min(0).max(100),
  suggestions: z.array(z.string()).optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, tone_style, intensity, preserve_meaning, target_audience } = toneVoiceRequestSchema.parse(body)

    const toneGuidelines = {
      professional: 'Formal, authoritative, evidence-based language with industry terminology',
      compassionate: 'Empathetic, person-centered language that demonstrates understanding and care',
      confident: 'Assertive, decisive language that instills trust and demonstrates capability',
      collaborative: 'Partnership-focused language emphasizing working together and shared goals',
      innovative: 'Forward-thinking, creative language highlighting modern approaches and solutions'
    }

    const intensityLevels = {
      subtle: 'Make gentle adjustments while maintaining original style',
      moderate: 'Apply clear tone changes while preserving readability',
      strong: 'Transform language significantly to embody the chosen tone'
    }

    const audienceGuidelines = target_audience ? {
      commissioners: 'Focus on value, compliance, outcomes, and return on investment',
      service_users: 'Use accessible, respectful language that empowers and includes',
      stakeholders: 'Balance technical detail with clear benefits and impact',
      colleagues: 'Use collaborative, professional language with shared understanding'
    }[target_audience] : ''

    const prompt = `You are CareDraft's brand voice specialist, expert in UK care sector communication and proposal writing.

TASK: Apply CareDraft's ${tone_style} tone of voice to the provided text while maintaining professional standards.

ORIGINAL TEXT:
"${text}"

BRAND VOICE APPLICATION:
- Tone Style: ${tone_style}
- Guidelines: ${toneGuidelines[tone_style]}
- Intensity: ${intensity} - ${intensityLevels[intensity]}
- Preserve Meaning: ${preserve_meaning ? 'Yes - maintain all original intent and information' : 'No - focus on tone over exact meaning'}
${target_audience ? `- Target Audience: ${target_audience} - ${audienceGuidelines}` : ''}

CAREDRAFT BRAND PRINCIPLES:
- Authentic care sector expertise
- Person-centered approach
- Evidence-based solutions
- Collaborative partnerships
- Innovation with purpose
- Regulatory compliance awareness

REQUIRED OUTPUT FORMAT (JSON):
{
  "styled_text": "Text with CareDraft tone of voice applied",
  "tone_analysis": {
    "original_tone": "Description of original tone",
    "applied_tone": "${tone_style}",
    "consistency_score": number (0-100, how consistently tone was applied)
  },
  "changes_made": [
    {
      "original": "Original phrase",
      "modified": "Modified phrase",
      "reason": "Why this change was made"
    }
  ],
  "audience_alignment": number (0-100, how well aligned for target audience),
  "suggestions": ["Optional suggestions for further refinement"]
}

Focus on creating authentic CareDraft voice that resonates with the care sector.`

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
      
      // Fallback: Minimal tone adjustment
      parsedResponse = {
        styled_text: text,
        tone_analysis: {
          original_tone: 'neutral',
          applied_tone: tone_style,
          consistency_score: 60
        },
        changes_made: [{
          original: text,
          modified: text,
          reason: 'Minimal changes due to parsing error'
        }],
        audience_alignment: 70,
        suggestions: ['Tone styling may need manual review due to processing error']
      }
    }

    const validatedResponse = toneVoiceResponseSchema.parse(parsedResponse)

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
    console.error('Tone of voice error:', error)

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
      { error: 'Internal server error', message: 'Failed to apply tone of voice' },
      { status: 500 }
    )
  }
} 