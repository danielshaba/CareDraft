import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, maxResults = 5 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Valid search query is required' },
        { status: 400 }
      )
    }

    // Enhanced query for care sector competitors
    const competitorQuery = `${query} care sector UK businesses companies services`
    
    // Use multiple search strategies
    const [webResults, competitorResults] = await Promise.allSettled([
      searchWeb(competitorQuery, maxResults),
      findCompetitorsByCategory(query)
    ])

    const allCompetitors = [
      ...(webResults.status === 'fulfilled' ? webResults.value : []),
      ...(competitorResults.status === 'fulfilled' ? competitorResults.value : [])
    ]

    // Remove duplicates and format
    const uniqueCompetitors = removeDuplicates(allCompetitors)

    return NextResponse.json({
      success: true,
      competitors: uniqueCompetitors.slice(0, maxResults),
      query: query.trim()
    })

  } catch (error) {
    console.error('Competitor search error:', error)
    return NextResponse.json(
      { error: 'Internal server error during competitor search' },
      { status: 500 }
    )
  }
}

async function searchWeb(query: string, maxResults: number) {
  try {
    // Mock implementation - in production this would use real APIs
    const mockCompetitors = [
      {
        name: 'Four Seasons Health Care',
        url: 'https://www.fshc.co.uk',
        description: 'Leading UK provider of care home and specialist care services',
        category: 'Residential Care'
      },
      {
        name: 'Barchester Healthcare',
        url: 'https://www.barchester.com',
        description: 'Independent provider of care homes and specialist dementia care',
        category: 'Residential Care'
      },
      {
        name: 'HC-One',
        url: 'https://www.hc-one.co.uk',
        description: 'UKs largest provider of care homes',
        category: 'Residential Care'
      },
      {
        name: 'Care UK',
        url: 'https://www.careuk.com',
        description: 'Provider of health and social care services',
        category: 'Healthcare Services'
      },
      {
        name: 'Helping Hands',
        url: 'https://www.helpinghands.co.uk',
        description: 'Home care and live-in care services',
        category: 'Domiciliary Care'
      }
    ]

    // Filter based on query relevance
    return mockCompetitors.filter(comp => 
      comp.name.toLowerCase().includes(query.toLowerCase()) ||
      comp.description.toLowerCase().includes(query.toLowerCase()) ||
      comp.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, maxResults)

  } catch (error) {
    console.error('Web search failed:', error)
    return []
  }
}

async function findCompetitorsByCategory(query: string) {
  const categoryCompetitors: Record<string, any[]> = {
    'care homes': [
      {
        name: 'Sunrise Senior Living',
        url: 'https://www.sunrise-care.co.uk',
        description: 'Premium care homes and assisted living communities',
        category: 'Residential Care'
      },
      {
        name: 'Anchor Hanover Group',
        url: 'https://www.anchorhanover.org.uk',
        description: 'Housing and care services for older people',
        category: 'Housing & Care'
      }
    ],
    'domiciliary care': [
      {
        name: 'Bluebird Care',
        url: 'https://www.bluebirdcare.co.uk',
        description: 'Franchise network providing home care services',
        category: 'Domiciliary Care'
      },
      {
        name: 'Comfort Call',
        url: 'https://www.comfortcall.co.uk',
        description: 'Live-in care and home care services',
        category: 'Domiciliary Care'
      }
    ],
    'healthcare software': [
      {
        name: 'Person Centred Software',
        url: 'https://www.personcentredsoftware.com',
        description: 'Care planning and management software',
        category: 'Care Technology'
      },
      {
        name: 'Nourish Care',
        url: 'https://www.nourishcare.com',
        description: 'Care management and compliance software',
        category: 'Care Technology'
      }
    ]
  }

  const matchedCategories = Object.keys(categoryCompetitors).filter(category =>
    query.toLowerCase().includes(category)
  )

  const results: any[] = []
  matchedCategories.forEach(category => {
    results.push(...categoryCompetitors[category])
  })

  return results
}

function removeDuplicates(competitors: any[]): any[] {
  const seen = new Set<string>()
  return competitors.filter(competitor => {
    const domain = extractDomain(competitor.url)
    if (seen.has(domain)) {
      return false
    }
    seen.add(domain)
    return true
  })
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
} 