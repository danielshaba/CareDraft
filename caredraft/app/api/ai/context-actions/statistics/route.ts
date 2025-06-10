import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWithFallback, AIError, AIErrorType, clientConfig } from '@/lib/api-client'

// Request validation schema
const statisticsRequestSchema = z.object({
  text: z.string().min(5, 'Text must be at least 5 characters long'),
  context: z.string().optional(),
  sector: z.enum(['care', 'health', 'social', 'public', 'general']).default('care'),
  sourcePreference: z.enum(['government', 'academic', 'industry', 'mixed']).default('government'),
  statisticType: z.enum(['performance', 'demographic', 'financial', 'trend', 'comparison']).default('performance'),
  includeSource: z.boolean().default(true),
  timeframe: z.enum(['current', 'historical', 'projected', 'mixed']).default('current'),
})

// Response type
interface StatisticsResponse {
  success: boolean
  enhancedText: string
  originalText: string
  statistics: Array<{
    value: string
    description: string
    source: string
    year?: string
    relevance: 'high' | 'medium' | 'low'
  }>
  integrationNotes?: string
  model: string
  fallback: boolean
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  error?: string
}

// Sector-specific prompts
const sectorPrompts = {
  'care': `Focus on UK care sector statistics including residential care, domiciliary care, nursing homes, care quality ratings, workforce data, and regulatory compliance metrics. Use CQC data, ONS statistics, and government reports.`,
  'health': `Include NHS performance data, health outcomes, clinical indicators, patient satisfaction scores, waiting times, and public health statistics from UK health authorities.`,
  'social': `Incorporate social care statistics, local authority data, demographic trends, social outcomes, community indicators, and social services performance metrics.`,
  'public': `Use public sector performance data, government spending, efficiency metrics, citizen satisfaction, and public service delivery statistics from UK authorities.`,
  'general': `Include relevant UK statistics from appropriate government sources, industry reports, and recognized statistical authorities.`
}

const sourcePrompts = {
  'government': `Prioritize official UK government statistics from ONS, CQC, NHS Digital, local authorities, and government departments. Ensure data credibility and official status.`,
  'academic': `Include peer-reviewed research findings, university studies, and academic publications from recognized UK institutions and research bodies.`,
  'industry': `Use industry reports, professional body statistics, trade association data, and sector-specific performance benchmarks from credible sources.`,
  'mixed': `Combine government data, academic research, and industry insights to provide comprehensive statistical context from multiple authoritative sources.`
}

const statisticTypePrompts = {
  'performance': `Focus on performance metrics, efficiency indicators, quality scores, outcomes data, and comparative performance statistics.`,
  'demographic': `Include population data, demographic breakdowns, user profiles, geographic distributions, and demographic trend statistics.`,
  'financial': `Provide financial statistics, cost data, budget allocations, spending patterns, economic impact figures, and financial performance metrics.`,
  'trend': `Present trend analysis, year-on-year changes, growth patterns, forecast data, and temporal statistical developments.`,
  'comparison': `Include comparative data, benchmarking statistics, sector comparisons, regional variations, and performance contrasts.`
}

// Main statistics integration function
async function addStatistics(
  text: string,
  context: string | undefined,
  sector: keyof typeof sectorPrompts,
  sourcePreference: keyof typeof sourcePrompts,
  statisticType: keyof typeof statisticTypePrompts,
  includeSource: boolean,
  timeframe: string
) {
  const contextSection = context ? `\nSurrounding Context: ${context}` : ''
  const sourceSection = includeSource ? '\nIMPORTANT: Include specific source citations for all statistics provided.' : ''
  const timeframeSection = timeframe !== 'mixed' ? `\nTimeframe Focus: Prioritize ${timeframe} data where available.` : ''

  const systemPrompt = `You are an expert data analyst specializing in UK public sector and care sector statistics.

Sector Focus: ${sectorPrompts[sector]}
Source Requirements: ${sourcePrompts[sourcePreference]}
Statistic Type: ${statisticTypePrompts[statisticType]}${contextSection}${sourceSection}${timeframeSection}

Return a JSON object with this exact structure:
{
  "enhancedText": "original text enhanced with relevant statistics seamlessly integrated",
  "statistics": [
    {
      "value": "specific statistic or percentage",
      "description": "clear explanation of what this statistic represents",
      "source": "specific source with year if available",
      "year": "2023",
      "relevance": "high|medium|low"
    }
  ],
  "integrationNotes": "brief explanation of how statistics enhance the content"
}

Rules:
- Use only credible UK sources and current data where possible
- Integrate statistics naturally into the text flow
- Ensure statistics directly support and enhance the original content
- Provide specific numerical data rather than vague references
- Include 2-4 highly relevant statistics maximum
- Maintain professional tone and accurate presentation
- Format percentages and numbers clearly (e.g., "42%", "£2.3 million")
- Ensure all statistics are factually accurate and contextually appropriate
- Focus on UK care sector data for tender relevance
- Include source attribution as required`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Please enhance this text with relevant statistics:\n\n"${text}"` }
  ]

  // Use complex=true for statistics as they require research and analysis
  const response = await generateWithFallback(messages, true)

  // Parse JSON response
  try {
    const result = JSON.parse(response.text)
    if (!result.enhancedText) {
      throw new Error('No enhancedText in response')
    }
    return {
      enhancedText: result.enhancedText,
      statistics: result.statistics || [],
      integrationNotes: result.integrationNotes || 'Statistics integrated',
      model: response.model,
      fallback: response.fallback,
      tokensUsed: response.tokensUsed
    }
  } catch (parseError) {
    // Fallback: try to extract content from response
    const enhancedMatch = response.text.match(/"enhancedText":\s*"([^"]+)"/)
    if (enhancedMatch) {
      const enhancedText = enhancedMatch[1]
      return {
        enhancedText,
        statistics: [{
          value: 'Statistics added',
          description: 'Relevant statistics have been integrated using fallback parsing',
          source: 'AI Processing',
          relevance: 'medium' as const
        }],
        integrationNotes: 'Processed using fallback method',
        model: response.model,
        fallback: response.fallback,
        tokensUsed: response.tokensUsed
      }
    }
    
    // Last resort: return enhanced version of original text
    return {
      enhancedText: `${text} [Statistical data and relevant performance metrics would enhance this content based on current UK care sector trends and government reporting.]`,
      statistics: [{
        value: 'Data integration required',
        description: 'Statistical enhancement placeholder due to processing limitations',
        source: 'System Note',
        relevance: 'low' as const
      }],
      integrationNotes: 'Fallback enhancement applied',
      model: response.model,
      fallback: response.fallback,
      tokensUsed: response.tokensUsed
    }
  }
}

// POST endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = statisticsRequestSchema.parse(body)
    const { text, context, sector, sourcePreference, statisticType, includeSource, timeframe } = validatedData

    // Add statistics
    const { enhancedText, statistics, integrationNotes, model, fallback, tokensUsed } = await addStatistics(
      text,
      context,
      sector,
      sourcePreference,
      statisticType,
      includeSource,
      timeframe
    )

    const response: StatisticsResponse = {
      success: true,
      enhancedText,
      originalText: text,
      statistics,
      integrationNotes,
      model,
      fallback,
      tokensUsed
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Statistics API error:', error)

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

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: 'statistics',
    model: {
      primary: clientConfig.primaryModel,
      fallback: clientConfig.fallbackModel
    },
    available: clientConfig.available,
    options: {
      sectors: Object.keys(sectorPrompts),
      sources: Object.keys(sourcePrompts),
      statisticTypes: Object.keys(statisticTypePrompts),
      timeframes: ['current', 'historical', 'projected', 'mixed']
    }
  })
} 