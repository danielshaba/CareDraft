import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType } from '@/lib/api-client'

// Request validation schema
const caseStudyRequestSchema = z.object({
  text: z.string().min(5, 'Text must be at least 5 characters long'),
  context: z.string().optional(),
  sector: z.enum(['care', 'health', 'social', 'public', 'education', 'general']).default('care'),
  caseType: z.enum(['success', 'challenge', 'implementation', 'comparison', 'innovation']).default('success'),
  includeOutcomes: z.boolean().default(true),
  includeSource: z.boolean().default(true),
  detailLevel: z.enum(['brief', 'standard', 'comprehensive']).default('standard'),
})

// Response type
interface CaseStudyResponse {
  success: boolean
  caseStudy: string
  originalText: string
  caseType: string
  sector: string
  outcomes?: string
  source?: string
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
    const { text, context, sector, caseType, includeOutcomes, includeSource, detailLevel } = caseStudyRequestSchema.parse(body)

    // Build comprehensive prompt for case study generation
    const prompt = `
You are an expert in ${sector} sector case studies and examples. Add a relevant case study to support the following content.

CONTENT TO ENHANCE:
"${text}"

${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

REQUIREMENTS:
- Case Type: ${caseType}
- Sector Focus: ${sector}
- Detail Level: ${detailLevel}
- Include Outcomes: ${includeOutcomes}
- Include Source: ${includeSource}

GUIDELINES:
1. Choose a highly relevant case study that directly supports the content
2. Use real-world examples from the ${sector} sector when possible
3. Structure with clear setup, implementation, and outcomes
4. Include specific metrics, data, or results where appropriate
5. Maintain professional, authoritative tone
6. Reference credible sources (government reports, academic studies, industry data)
7. Keep UK context and terminology where relevant
8. Ensure the case study adds substantive value to the argument

${detailLevel === 'brief' ? 'Keep to 2-3 sentences maximum.' :
  detailLevel === 'standard' ? 'Provide 1-2 paragraphs with key details.' :
  'Provide comprehensive case study with full context, implementation details, and outcomes.'}

Respond with a JSON object containing:
{
  "caseStudy": "The complete case study text",
  "caseType": "${caseType}",
  "sector": "${sector}",
  "outcomes": "Key outcomes and results (if includeOutcomes is true)",
  "source": "Source reference (if includeSource is true)"
}
`

    const response = await generateWithFallback([
      { role: 'user', content: prompt }
    ], true)

    if (!response.text) {
      return NextResponse.json(
        { error: 'Failed to generate case study', details: 'No response text' },
        { status: 500 }
      )
    }

    // Parse AI response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(response.text)
    } catch (parseError) {
      // Fallback: try to extract content from response
      const caseStudyMatch = response.text.match(/"caseStudy":\s*"([^"]+)"/)
      if (caseStudyMatch) {
        parsedResponse = {
          caseStudy: caseStudyMatch[1],
          caseType,
          sector,
          outcomes: includeOutcomes ? 'Outcomes included in case study' : undefined,
          source: includeSource ? 'Source reference included' : undefined
        }
      } else {
        // Last resort: use the response text directly
        parsedResponse = {
          caseStudy: response.text.replace(/^.*?"caseStudy".*?:.*?"([^"]+)".*$/, '$1') || response.text,
          caseType,
          sector
        }
      }
    }

    const result: CaseStudyResponse = {
      success: true,
      caseStudy: parsedResponse.caseStudy || response.text,
      originalText: text,
      caseType: parsedResponse.caseType || caseType,
      sector: parsedResponse.sector || sector,
      outcomes: includeOutcomes ? parsedResponse.outcomes : undefined,
      source: includeSource ? parsedResponse.source : undefined,
      model: response.model || 'unknown',
      fallback: response.fallback || false,
      tokensUsed: response.tokensUsed
    }

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
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

    console.error('Unexpected error in case study endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'AI Context Menu - Case Study',
    status: 'operational',
    description: 'Adds relevant case studies and examples to support content',
    parameters: {
      text: 'Content to enhance with case study',
      context: 'Additional context (optional)',
      sector: 'Target sector (care, health, social, public, education, general)',
      caseType: 'Type of case study (success, challenge, implementation, comparison, innovation)',
      includeOutcomes: 'Include outcomes and results',
      includeSource: 'Include source references',
      detailLevel: 'Level of detail (brief, standard, comprehensive)'
    }
  })
} 