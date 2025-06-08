import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, query, focusAreas = ['trends', 'insights', 'recommendations'] } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required for analysis' },
        { status: 400 }
      )
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query context is required for analysis' },
        { status: 400 }
      )
    }

    // Create analysis prompt based on focus areas
    const analysisPrompt = createAnalysisPrompt(content, query, focusAreas)

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: analysisPrompt
        }
      ]
    })

    const analysisText = response.content[0].type === 'text' ? response.content[0].text : ''
    const analysis = parseAnalysisResponse(analysisText, focusAreas)

    return NextResponse.json({
      success: true,
      analysis,
      query: query.trim()
    })

  } catch (error) {
    console.error('Content analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error during content analysis' },
      { status: 500 }
    )
  }
}

function createAnalysisPrompt(content: string, query: string, focusAreas: string[]): string {
  const focusAreasText = focusAreas.join(', ')
  
  return `As an expert in healthcare and care sector analysis, please analyze the following content in the context of the query: "${query}".

Focus your analysis on: ${focusAreasText}

Content to analyze:
${content}

Please provide your analysis in the following structured format:

TRENDS:
- [List key trends identified in the content]

INSIGHTS:
- [List key insights and important findings]

RECOMMENDATIONS:
- [List actionable recommendations based on the analysis]

Keep each point concise and actionable. Focus specifically on aspects relevant to the care sector and the original query context.`
}

function parseAnalysisResponse(analysisText: string, focusAreas: string[]): {
  trends: string[]
  insights: string[]
  recommendations: string[]
} {
  const analysis = {
    trends: [] as string[],
    insights: [] as string[],
    recommendations: [] as string[]
  }

  try {
    // Parse trends
    const trendsMatch = analysisText.match(/TRENDS:(.*?)(?=INSIGHTS:|RECOMMENDATIONS:|$)/s)
    if (trendsMatch) {
      analysis.trends = parseBulletPoints(trendsMatch[1])
    }

    // Parse insights
    const insightsMatch = analysisText.match(/INSIGHTS:(.*?)(?=RECOMMENDATIONS:|$)/s)
    if (insightsMatch) {
      analysis.insights = parseBulletPoints(insightsMatch[1])
    }

    // Parse recommendations
    const recommendationsMatch = analysisText.match(/RECOMMENDATIONS:(.*?)$/s)
    if (recommendationsMatch) {
      analysis.recommendations = parseBulletPoints(recommendationsMatch[1])
    }

    // Fallback: if structured parsing fails, extract any bullet points
    if (analysis.trends.length === 0 && analysis.insights.length === 0 && analysis.recommendations.length === 0) {
      const allPoints = parseBulletPoints(analysisText)
      
      // Distribute points across categories based on keywords
      allPoints.forEach(point => {
        const lowerPoint = point.toLowerCase()
        if (lowerPoint.includes('trend') || lowerPoint.includes('emerging') || lowerPoint.includes('growing')) {
          analysis.trends.push(point)
        } else if (lowerPoint.includes('recommend') || lowerPoint.includes('should') || lowerPoint.includes('suggest')) {
          analysis.recommendations.push(point)
        } else {
          analysis.insights.push(point)
        }
      })
    }

  } catch (error) {
    console.error('Error parsing analysis response:', error)
    // Provide fallback analysis
    analysis.insights.push('Analysis completed but formatting may be incomplete')
  }

  return analysis
}

function parseBulletPoints(text: string): string[] {
  const points = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^[-*•]\s*/, '')) // Remove bullet point markers
    .filter(line => line.length > 10) // Filter out very short lines
    .slice(0, 5) // Limit to 5 points per category

  return points
} 