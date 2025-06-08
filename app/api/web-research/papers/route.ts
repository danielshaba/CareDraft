import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, maxResults = 10 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Valid search query is required' },
        { status: 400 }
      )
    }

    // Search for academic papers
    const researchPapers = await searchResearchPapers(query, maxResults)

    return NextResponse.json({
      success: true,
      papers: researchPapers,
      query: query.trim()
    })

  } catch (error) {
    console.error('Research paper search error:', error)
    return NextResponse.json(
      { error: 'Internal server error during research paper search' },
      { status: 500 }
    )
  }
}

async function searchResearchPapers(query: string, maxResults: number) {
  try {
    // Mock implementation with realistic research papers
    const mockResearchPapers = [
      {
        title: 'Digital transformation in elderly care: A systematic review of care management systems',
        authors: ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emma Williams'],
        journal: 'Journal of Medical Internet Research',
        publishedAt: '2024-02-15T00:00:00Z',
        url: 'https://www.jmir.org/2024/2/e12345',
        abstract: 'This systematic review examines the impact of digital care management systems on quality of care, staff efficiency, and resident outcomes in elderly care settings. The study analyzes 45 research papers published between 2020-2024.',
        keywords: ['digital transformation', 'elderly care', 'care management', 'technology adoption', 'healthcare outcomes']
      },
      {
        title: 'Workforce retention strategies in residential care: Evidence from UK care homes',
        authors: ['Dr. James Thompson', 'Dr. Lisa Parker', 'Prof. David Brown'],
        journal: 'Health & Social Care in the Community',
        publishedAt: '2024-01-28T00:00:00Z',
        url: 'https://onlinelibrary.wiley.com/journal/13652524',
        abstract: 'This longitudinal study investigates effective workforce retention strategies in UK residential care facilities, examining factors that contribute to staff satisfaction and reduced turnover rates.',
        keywords: ['workforce retention', 'residential care', 'staff satisfaction', 'care quality', 'human resources']
      },
      {
        title: 'Person-centered care planning: Implementation barriers and facilitators in care homes',
        authors: ['Dr. Rachel Green', 'Prof. Andrew Smith', 'Dr. Helen Davis'],
        journal: 'International Journal of Nursing Studies',
        publishedAt: '2024-01-10T00:00:00Z',
        url: 'https://www.journalofnursingstudies.com',
        abstract: 'A mixed-methods study exploring the challenges and success factors in implementing person-centered care planning approaches across 20 UK care homes.',
        keywords: ['person-centered care', 'care planning', 'care homes', 'implementation science', 'nursing practice']
      },
      {
        title: 'Cost-effectiveness of preventive care interventions in community settings',
        authors: ['Prof. Margaret Wilson', 'Dr. Paul Roberts', 'Dr. Sophie Taylor'],
        journal: 'Health Economics',
        publishedAt: '2023-12-20T00:00:00Z',
        url: 'https://onlinelibrary.wiley.com/journal/10991050',
        abstract: 'Economic evaluation of preventive care interventions delivered in community settings, analyzing cost per quality-adjusted life year and healthcare utilization impacts.',
        keywords: ['cost-effectiveness', 'preventive care', 'community health', 'health economics', 'intervention evaluation']
      },
      {
        title: 'AI-assisted medication management in care settings: Safety and efficacy outcomes',
        authors: ['Dr. Robert Clark', 'Prof. Jennifer Lee', 'Dr. Mark Anderson'],
        journal: 'Journal of the American Medical Informatics Association',
        publishedAt: '2023-11-15T00:00:00Z',
        url: 'https://academic.oup.com/jamia',
        abstract: 'Randomized controlled trial evaluating AI-assisted medication management systems in care facilities, measuring safety outcomes, medication errors, and staff workflow efficiency.',
        keywords: ['artificial intelligence', 'medication management', 'patient safety', 'care technology', 'healthcare informatics']
      },
      {
        title: 'Family engagement in care planning: A qualitative study of experiences and preferences',
        authors: ['Dr. Catherine White', 'Prof. Steven Harris', 'Dr. Amanda Lewis'],
        journal: 'The Gerontologist',
        publishedAt: '2023-10-30T00:00:00Z',
        url: 'https://academic.oup.com/gerontologist',
        abstract: 'Qualitative exploration of family members experiences and preferences regarding involvement in care planning for elderly relatives in residential and community settings.',
        keywords: ['family engagement', 'care planning', 'qualitative research', 'gerontology', 'family-centered care']
      }
    ]

    // Filter based on query relevance
    const relevantPapers = mockResearchPapers.filter(paper =>
      paper.title.toLowerCase().includes(query.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
      paper.keywords.some(keyword => 
        keyword.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(keyword.toLowerCase())
      ) ||
      paper.authors.some(author => 
        author.toLowerCase().includes(query.toLowerCase())
      )
    )

    // Sort by publication date (most recent first)
    return relevantPapers
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, maxResults)

  } catch (error) {
    console.error('Research paper search failed:', error)
    return []
  }
} 