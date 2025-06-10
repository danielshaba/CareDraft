import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback } from '@/lib/api-client'
import { AIError } from '@/lib/errors'

const pureCompletionRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  completion_length: z.enum(['short', 'medium', 'long']).default('medium'),
  style_context: z.enum(['proposal', 'report', 'policy', 'correspondence', 'presentation']).default('proposal'),
  maintain_tone: z.boolean().default(true),
  target_words: z.number().min(10).max(1000).optional()
})

const pureCompletionResponseSchema = z.object({
  completed_text: z.string(),
  completion_added: z.string(),
  completion_length: z.number(),
  coherence_score: z.number().min(0).max(100),
  style_consistency: z.number().min(0).max(100),
  completion_type: z.string(),
  suggestions: z.array(z.string()).optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, completion_length, style_context, maintain_tone, target_words } = pureCompletionRequestSchema.parse(body)

    const lengthGuidelines = {
      short: target_words || 25,
      medium: target_words || 75,
      long: target_words || 200
    }

    const styleInstructions = {
      proposal: 'Professional proposal writing with persuasive elements and clear value propositions',
      report: 'Factual, analytical writing with evidence-based conclusions',
      policy: 'Formal policy language with compliance and regulatory awareness',
      correspondence: 'Professional business communication with appropriate formality',
      presentation: 'Clear, engaging content suitable for verbal presentation'
    }

    const prompt = `You are a professional writer specializing in UK care sector documentation and proposal completion.

TASK: Complete the provided text naturally and professionally, maintaining style and tone consistency.

INCOMPLETE TEXT:
"${text}"

COMPLETION REQUIREMENTS:
- Length: ${completion_length} (approximately ${lengthGuidelines[completion_length]} words)
- Style Context: ${style_context} - ${styleInstructions[style_context]}
- Maintain Tone: ${maintain_tone ? 'Yes - preserve the existing tone and style' : 'No - optimize for clarity and impact'}
- Care Sector Focus: Maintain UK care sector context and terminology

INSTRUCTIONS:
- Analyze the existing text to understand direction and intent
- Continue naturally from where the text ends
- Maintain consistent voice and style throughout
- Include relevant care sector terminology and concepts
- Ensure completion adds value and substance
- Avoid repetition of existing content
- Create logical flow and coherent structure

REQUIRED OUTPUT FORMAT (JSON):
{
  "completed_text": "The original text plus natural completion",
  "completion_added": "Only the new text that was added",
  "completion_length": number (word count of completion),
  "coherence_score": number (0-100, how well completion flows),
  "style_consistency": number (0-100, how well style is maintained),
  "completion_type": "Description of what type of completion was provided",
  "suggestions": ["Optional suggestions for further development"]
}

Focus on creating natural, valuable completions that enhance the original content.`

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
      
      // Fallback: Simple completion
      const fallbackCompletion = " This approach ensures comprehensive service delivery while maintaining the highest standards of care and compliance with regulatory requirements."
      
      parsedResponse = {
        completed_text: text + fallbackCompletion,
        completion_added: fallbackCompletion,
        completion_length: fallbackCompletion.split(' ').length,
        coherence_score: 70,
        style_consistency: 65,
        completion_type: 'basic_completion',
        suggestions: ['Completion may need manual review due to processing error']
      }
    }

    const validatedResponse = pureCompletionResponseSchema.parse(parsedResponse)

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
    console.error('Pure completion error:', error)

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
      { error: 'Internal server error', message: 'Failed to complete text' },
      { status: 500 }
    )
  }
} 