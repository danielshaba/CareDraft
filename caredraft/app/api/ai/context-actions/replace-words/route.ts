import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback } from '@/lib/api-client'
import { AIError } from '@/lib/errors'

const replaceWordsRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  replacement_style: z.enum(['direct', 'contextual', 'enhanced']).default('contextual'),
  care_sector_focus: z.boolean().default(true),
  preserve_meaning: z.boolean().default(true),
  custom_banned_words: z.array(z.string()).optional()
})

const replaceWordsResponseSchema = z.object({
  cleaned_text: z.string(),
  replacements_made: z.array(z.object({
    original: z.string(),
    replacement: z.string(),
    reason: z.string(),
    position: z.number()
  })),
  banned_words_found: z.number(),
  compliance_score: z.number().min(0).max(100),
  suggestions: z.array(z.string()).optional()
})

// Standard care sector banned/problematic words
const DEFAULT_BANNED_WORDS = [
  'cheap', 'cheapest', 'basic', 'minimal', 'standard',
  'users', 'clients', 'patients', 'inmates', 'residents',
  'suffer', 'suffering', 'victim', 'burden', 'problem',
  'difficult', 'challenging behaviour', 'non-compliant',
  'wheelchair bound', 'disabled person', 'suffers from',
  'normal', 'abnormal', 'retarded', 'handicapped',
  'should', 'must', 'need to', 'have to', 'required',
  'can\'t', 'won\'t', 'impossible', 'never', 'always'
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, replacement_style, care_sector_focus, preserve_meaning, custom_banned_words } = replaceWordsRequestSchema.parse(body)

    const bannedWords = custom_banned_words ? [...DEFAULT_BANNED_WORDS, ...custom_banned_words] : DEFAULT_BANNED_WORDS
    
    const styleInstructions = {
      direct: 'Replace banned words with direct, professional alternatives',
      contextual: 'Replace words considering context and maintaining natural flow',
      enhanced: 'Replace words with enhanced, positive alternatives that add value'
    }

    const prompt = `You are a professional editor specializing in UK care sector language compliance and person-centered communication.

TASK: Identify and replace inappropriate, banned, or problematic words with suitable alternatives.

ORIGINAL TEXT:
"${text}"

BANNED WORDS TO IDENTIFY AND REPLACE:
${bannedWords.map(word => `- "${word}"`).join('\n')}

REPLACEMENT REQUIREMENTS:
- Style: ${replacement_style} - ${styleInstructions[replacement_style]}
- Care Sector Focus: ${care_sector_focus ? 'Yes - use person-centered, dignity-focused language' : 'No'}
- Preserve Meaning: ${preserve_meaning ? 'Yes - maintain original intent' : 'No - prioritize positive language'}

CARE SECTOR GUIDELINES:
- Use person-first language ("person with dementia" not "dementia sufferer")
- Avoid deficit-focused language
- Use empowering, dignified terminology
- Replace negative words with positive alternatives
- Ensure compliance with equality and dignity standards
- Maintain professional tone suitable for proposals

REQUIRED OUTPUT FORMAT (JSON):
{
  "cleaned_text": "Text with all banned words replaced",
  "replacements_made": [
    {
      "original": "Original banned word/phrase",
      "replacement": "Replacement word/phrase",
      "reason": "Why this replacement was chosen",
      "position": number (character position in original text)
    }
  ],
  "banned_words_found": number (total count of banned words found),
  "compliance_score": number (0-100, how compliant the final text is),
  "suggestions": ["Optional suggestions for further improvements"]
}

Focus on creating dignified, person-centered language that enhances proposal quality.`

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
      
      // Fallback: Basic word replacement
      let cleanedText = text
      const replacementsMade: Array<{original: string, replacement: string, reason: string, position: number}> = []
      
      bannedWords.forEach((word, index) => {
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        if (regex.test(cleanedText)) {
          const replacement = word === 'cheap' ? 'cost-effective' : 
                            word === 'users' ? 'people we support' :
                            word === 'clients' ? 'service users' :
                            word === 'difficult' ? 'complex' : 'appropriate alternative'
          
          cleanedText = cleanedText.replace(regex, replacement)
          replacementsMade.push({
            original: word,
            replacement: replacement,
            reason: 'Basic replacement due to processing error',
            position: index * 10
          })
        }
      })
      
      parsedResponse = {
        cleaned_text: cleanedText,
        replacements_made: replacementsMade,
        banned_words_found: replacementsMade.length,
        compliance_score: 80,
        suggestions: ['Word replacement may need manual review due to processing error']
      }
    }

    const validatedResponse = replaceWordsResponseSchema.parse(parsedResponse)

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
    console.error('Replace words error:', error)

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
      { error: 'Internal server error', message: 'Failed to replace banned words' },
      { status: 500 }
    )
  }
} 