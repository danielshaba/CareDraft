/**
 * Company Research API Route
 * Specialized endpoint for company information searches
 */

import { NextResponse, NextRequest } from 'next/server'
import { ExaMCPService } from '@/lib/services/exa-mcp-service'
import { validateExaAIConfig } from '@/lib/config/exa-ai'

/**
 * POST /api/search/company
 * Search for company information
 */
export async function GET(request: NextRequest) {
  try {
    // Check configuration
    const configValidation = validateExaAIConfig()
    if (!configValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Company search service unavailable',
          details: configValidation.errors
        },
        { status: 503 }
      )
    }
    
    const body = await request.json()
    
    // Validate request
    if (!body.companyName || typeof body.companyName !== 'string') {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }
    
    if (body.companyName.length > 200) {
      return NextResponse.json(
        { error: 'Company name must be less than 200 characters' },
        { status: 400 }
      )
    }
    
    // Execute company search
    const searchService = ExaMCPService.createWithDefaults()
    const results = await searchService.searchCompanyInfo(body.companyName)
    
    // Add company-specific metadata
    const enhancedResults = {
      ...results,
      searchType: 'company',
      companyName: body.companyName,
      metadata: {
        totalSources: results.totalResults,
        officialSources: results.results.filter(r => 
          r.metadata?.domain?.includes('gov.uk') || 
          r.metadata?.domain?.includes('companieshouse.gov.uk') ||
          r.metadata?.domain?.includes('cqc.org.uk')
        ).length,
        sources: [...new Set(results.results.map(r => r.metadata?.domain).filter(Boolean))]
      }
    }
    
    return NextResponse.json(enhancedResults)
    
  } catch (error) {
    console.error('Company search API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Company search failed',
        message: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          'Service temporarily unavailable'
      },
      { status: 500 }
    )
  }
} 