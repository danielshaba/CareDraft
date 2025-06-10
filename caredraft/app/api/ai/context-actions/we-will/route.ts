import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback } from '@/lib/api-client'
import { AIError } from '@/lib/errors'

const weWillRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  commitment_level: z.enum(['strong', 'confident', 'measured']).default('confident'),
  include_timeline: z.boolean().default(false),
  focus_area: z.enum(['delivery', 'quality', 'innovation', 'compliance', 'collaboration']).optional()
})

const weWillResponseSchema = z.object({
  converted_text: z.string(),
  action_statements: z.array(z.object({
    original: z.string(),
    converted: z.string(),
    commitment_type: z.string()
  })),
  commitment_strength: z.number().min(0).max(100),
  actionability_score: z.number().min(0).max(100),
  suggestions: z.array(z.string()).optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, commitment_level, include_timeline, focus_area } = weWillRequestSchema.parse(body)

    const commitmentInstructions = {
      strong: 'Use definitive language with strong commitment words like "will deliver", "guarantee", "ensure"',
      confident: 'Use confident but measured language like "will provide", "commit to", "deliver"',
      measured: 'Use careful language like "will work to", "aim to", "strive to"'
    }

    const focusInstructions = focus_area ? {
      delivery: 'Focus on delivery commitments and service provision',
      quality: 'Emphasize quality assurance and standards',
      innovation: 'Highlight innovative approaches and solutions',
      compliance: 'Stress regulatory compliance and governance',
      collaboration: 'Focus on partnership and collaborative working'
    }[focus_area] : ''

    const prompt = `You are a professional proposal writer specializing in UK care sector bid writing and commitment statements.

TASK: Convert the provided text into action-oriented "We Will" statements that demonstrate clear commitments and deliverables.

INPUT TEXT:
"${text}"

CONVERSION REQUIREMENTS:
- Commitment Level: ${commitment_level}
- ${commitmentInstructions[commitment_level]}
- Include Timeline: ${include_timeline ? 'Yes - add appropriate timeframes where relevant' : 'No'}
${focus_area ? `- Focus Area: ${focus_area} - ${focusInstructions}` : ''}

INSTRUCTIONS:
- Transform passive descriptions into active commitment statements
- Use "We will..." structure where appropriate
- Maintain UK care sector professional tone
- Ensure commitments are realistic and achievable
- Include specific, measurable outcomes where possible
- Preserve compliance and regulatory context
- Make statements compelling but not overpromising

REQUIRED OUTPUT FORMAT (JSON):
{
  "converted_text": "The full text converted to action-oriented 'We Will' statements",
  "action_statements": [
    {
      "original": "Original passive statement",
      "converted": "We will [action-oriented version]",
      "commitment_type": "Type of commitment (delivery/quality/timeline/etc.)"
    }
  ],
  "commitment_strength": number (0-100, how strong the commitments are),
  "actionability_score": number (0-100, how actionable the statements are),
  "suggestions": ["Optional suggestions for strengthening commitments"]
}

Focus on creating compelling, professional commitment statements that win bids.`

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
      
      // Fallback: Basic "We will" conversion
      const basicConversion = text.replace(/\b(we\s+)?(provide|offer|deliver|ensure|maintain)/gi, 'We will $2')
      parsedResponse = {
        converted_text: basicConversion,
        action_statements: [{
          original: text,
          converted: basicConversion,
          commitment_type: 'general'
        }],
        commitment_strength: 70,
        actionability_score: 65,
        suggestions: ['Text was converted but may need manual review for better commitment statements']
      }
    }

    const validatedResponse = weWillResponseSchema.parse(parsedResponse)

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
    console.error('We Will conversion error:', error)

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
      { error: 'Internal server error', message: 'Failed to convert to We Will statements' },
      { status: 500 }
    )
  }
} 