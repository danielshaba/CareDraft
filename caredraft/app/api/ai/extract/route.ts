import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType, clientConfig } from '@/lib/api-client'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limiter'

// Request validation schema
const extractRequestSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters long'),
  category: z.enum([
    'commissioners-priorities',
    'compliance-requirements', 
    'dates-timelines',
    'social-value-criteria',
    'tupe-requirements',
    'evaluation-criteria'
  ]),
  documentName: z.string().optional(),
  maxResults: z.number().min(1).max(20).default(10),
})

// Response types
interface ExtractionResult {
  content: string
  confidence: number
  sourceText: string
  category: string
}

interface ExtractResponse {
  success: boolean
  results: ExtractionResult[]
  model: string
  fallback: boolean
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  error?: string
}

// Category-specific prompts
const categoryPrompts = {
  'commissioners-priorities': `Extract information about commissioner priorities, strategic goals, and value requirements. Look for:
- Strategic objectives and priorities
- Value for money requirements
- Partnership and collaboration needs
- Quality standards and expectations
- Innovation requirements
- Sustainability goals`,

  'compliance-requirements': `Extract mandatory compliance requirements and regulations. Look for:
- Legal and regulatory requirements
- Quality standards (CQC, ISO, etc.)
- DBS/background check requirements
- Insurance and liability requirements
- Data protection and GDPR compliance
- Health and safety regulations`,

  'dates-timelines': `Extract all important dates and timelines. Look for:
- Tender submission deadlines
- Service commencement dates
- Contract duration and terms
- Key milestone dates
- Review and renewal dates
- Clarification deadlines`,

  'social-value-criteria': `Extract social value requirements and criteria. Look for:
- Local SME and VCSE spending targets
- Employment and training opportunities
- Environmental sustainability requirements
- Community benefit requirements
- Local supply chain preferences
- Carbon reduction targets`,

  'tupe-requirements': `Extract TUPE (Transfer of Undertakings) related information. Look for:
- Staff transfer requirements
- Pension arrangements
- Employee consultation requirements
- Terms and conditions protection
- Staff information requirements
- Due diligence obligations`,

  'evaluation-criteria': `Extract evaluation and scoring criteria. Look for:
- Technical quality weighting
- Commercial/price evaluation
- Social value scoring
- Compliance assessment criteria
- Award criteria and methodology
- Quality thresholds`
}

// Main extraction function
async function performExtraction(text: string, category: keyof typeof categoryPrompts, maxResults: number) {
  const systemPrompt = `You are an expert at analyzing UK tender documents and extracting specific information. 
${categoryPrompts[category]}

Return a JSON array of objects with this exact structure:
[
  {
    "content": "extracted information",
    "confidence": 85,
    "sourceText": "relevant source text from document",
    "category": "${category}"
  }
]

Rules:
- Extract up to ${maxResults} relevant items
- Confidence should be 1-100 (higher = more certain)
- Include exact source text where information was found
- Only include items directly relevant to ${category.replace('-', ' ')}
- Return empty array if no relevant information found`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Extract ${category.replace('-', ' ')} from this tender document:\n\n${text}` }
  ]

  // Use complex=true for extraction as it requires detailed analysis
  const response = await generateWithFallback(messages, true)

  // Parse JSON response
  try {
    const results = JSON.parse(response.text)
    if (!Array.isArray(results)) {
      throw new Error('Response is not an array')
    }
    return { 
      results: results as ExtractionResult[], 
      model: response.model, 
      fallback: response.fallback,
      tokensUsed: response.tokensUsed 
    }
  } catch {
    // Fallback: try to extract JSON from response
    const jsonMatch = response.text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const results = JSON.parse(jsonMatch[0])
      return { 
        results: results as ExtractionResult[], 
        model: response.model, 
        fallback: response.fallback,
        tokensUsed: response.tokensUsed 
      }
    }
    throw new AIError('Invalid JSON response from AI model', AIErrorType.VALIDATION)
  }
}

// POST endpoint with rate limiting
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = extractRequestSchema.parse(body)
    const { text, category, maxResults } = validatedData

    // Perform extraction
    const { results, model, fallback, tokensUsed } = await performExtraction(text, category, maxResults)

    const response: ExtractResponse = {
      success: true,
      results,
      model,
      fallback,
      tokensUsed
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Extract API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    if (error instanceof AIError) {
      let statusCode = 500
      if (error.type === AIErrorType.AUTHENTICATION) statusCode = 401
      if (error.type === AIErrorType.RATE_LIMIT) statusCode = 429
      if (error.type === AIErrorType.VALIDATION) statusCode = 400

      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          type: error.type
        },
        { 
          status: statusCode,
          headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : {}
        }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Apply rate limiting to POST endpoint
export const POST = withRateLimit(handlePOST, rateLimitConfigs.extract)

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: 'extract',
    model: {
      primary: clientConfig.primaryModel,
      fallback: clientConfig.fallbackModel
    },
    available: clientConfig.available,
    categories: Object.keys(categoryPrompts)
  })
} 