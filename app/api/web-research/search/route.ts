import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/utils/rate-limit'

// Rate limiting for web search (10 requests per minute per IP)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const identifier = request.ip ?? 'anonymous'
    const { success } = await limiter.check(identifier, 10)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { query, maxResults = 10, type = 'web' } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid search query is required' },
        { status: 400 }
      )
    }

    // Use Exa AI for powerful web search
    const searchResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query.trim(),
        numResults: Math.min(maxResults, 20),
        type: 'neural',
        useAutoprompt: true,
        contents: {
          text: true,
          highlights: true,
          summary: true
        },
        livecrawl: 'always',
        includedomains: [
          'cqc.org.uk',
          'gov.uk',
          'england.nhs.uk',
          'scie.org.uk',
          'skillsforcare.org.uk',
          'careengland.org.uk',
          'bbc.co.uk',
          'guardian.co.uk',
          'telegraph.co.uk'
        ]
      })
    })

    if (!searchResponse.ok) {
      console.error('Exa search failed:', await searchResponse.text())
      return NextResponse.json(
        { error: 'External search service unavailable' },
        { status: 503 }
      )
    }

    const searchData = await searchResponse.json()
    
    // Format results for our application
    const formattedResults = (searchData.results || []).map((result: any, index: number) => ({
      id: `exa-${index}`,
      title: result.title || 'Untitled',
      url: result.url || '',
      snippet: result.text || result.summary || '',
      source: extractDomain(result.url || ''),
      type: 'web',
      publishedAt: result.publishedDate || new Date().toISOString(),
      relevanceScore: result.score || 0.8,
      metadata: {
        domain: extractDomain(result.url || ''),
        wordCount: (result.text || '').split(' ').length,
        hasImages: false,
        isNews: isNewsSource(result.url || ''),
        language: 'en',
        highlights: result.highlights || []
      }
    }))

    return NextResponse.json({
      success: true,
      results: formattedResults,
      totalResults: searchData.results?.length || 0,
      query: query.trim()
    })

  } catch (error) {
    console.error('Web search error:', error)
    return NextResponse.json(
      { error: 'Internal server error during web search' },
      { status: 500 }
    )
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function isNewsSource(url: string): boolean {
  const newsIndicators = ['news', 'bbc', 'guardian', 'telegraph', 'times', 'independent', 'reuters', 'ap']
  const domain = extractDomain(url).toLowerCase()
  return newsIndicators.some(indicator => domain.includes(indicator))
} 