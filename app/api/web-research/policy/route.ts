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

    // Search for policy updates from authoritative sources
    const policyUpdates = await searchPolicyUpdates(query, maxResults)

    return NextResponse.json({
      success: true,
      policies: policyUpdates,
      query: query.trim()
    })

  } catch (error) {
    console.error('Policy search error:', error)
    return NextResponse.json(
      { error: 'Internal server error during policy search' },
      { status: 500 }
    )
  }
}

async function searchPolicyUpdates(query: string, maxResults: number) {
  try {
    // Mock implementation with realistic policy updates
    const mockPolicyUpdates = [
      {
        title: 'CQC Inspection Framework Updates 2024',
        source: 'Care Quality Commission',
        url: 'https://www.cqc.org.uk/guidance-providers/regulations-enforcement/inspection-framework-updates',
        publishedAt: '2024-03-15T00:00:00Z',
        summary: 'Updated inspection criteria focusing on person-centered care and digital transformation in care settings.',
        category: 'Regulation'
      },
      {
        title: 'Adult Social Care Workforce Development Strategy',
        source: 'Department of Health and Social Care',
        url: 'https://www.gov.uk/government/publications/adult-social-care-workforce-strategy',
        publishedAt: '2024-02-28T00:00:00Z',
        summary: 'New government strategy to address workforce challenges and improve career pathways in social care.',
        category: 'Workforce'
      },
      {
        title: 'Medication Administration Guidelines Update',
        source: 'Skills for Care',
        url: 'https://www.skillsforcare.org.uk/medication-guidelines-update',
        publishedAt: '2024-02-10T00:00:00Z',
        summary: 'Updated guidance on safe medication administration practices in care homes and domiciliary settings.',
        category: 'Clinical Practice'
      },
      {
        title: 'Digital Technology in Care Settings Standards',
        source: 'Social Care Institute for Excellence',
        url: 'https://www.scie.org.uk/digital-technology-standards',
        publishedAt: '2024-01-20T00:00:00Z',
        summary: 'New standards for implementing and evaluating digital technologies in care environments.',
        category: 'Technology'
      },
      {
        title: 'Infection Prevention and Control Updates',
        source: 'NHS England',
        url: 'https://www.england.nhs.uk/infection-prevention-control-updates',
        publishedAt: '2024-01-15T00:00:00Z',
        summary: 'Updated IPC guidelines following lessons learned from the pandemic response.',
        category: 'Health & Safety'
      },
      {
        title: 'Care Home Financial Sustainability Framework',
        source: 'Care England',
        url: 'https://www.careengland.org.uk/financial-sustainability-framework',
        publishedAt: '2024-01-05T00:00:00Z',
        summary: 'New framework to support care home financial planning and sustainability.',
        category: 'Business'
      }
    ]

    // Filter based on query relevance
    const relevantUpdates = mockPolicyUpdates.filter(policy =>
      policy.title.toLowerCase().includes(query.toLowerCase()) ||
      policy.summary.toLowerCase().includes(query.toLowerCase()) ||
      policy.category.toLowerCase().includes(query.toLowerCase()) ||
      policy.source.toLowerCase().includes(query.toLowerCase())
    )

    // Sort by date (most recent first)
    return relevantUpdates
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, maxResults)

  } catch (error) {
    console.error('Policy search failed:', error)
    return []
  }
} 