/**
 * Research Papers Search API Route
 * Specialized endpoint for academic research paper searches
 */

import { NextResponse, NextRequest } from 'next/server'
import { ExaMCPService } from '@/lib/services/exa-mcp-service'
import { validateExaAIConfig } from '@/lib/config/exa-ai'

/**
 * POST /api/search/research
 * Search for academic research papers
 */
export async function GET(request: NextRequest) {
  try {
    // Check configuration
    const configValidation = validateExaAIConfig()
    if (!configValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Research search service unavailable',
          details: configValidation.errors
        },
        { status: 503 }
      )
    }
    
    const body = await request.json()
    
    // Validate request
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }
    
    if (body.query.length > 300) {
      return NextResponse.json(
        { error: 'Research query must be less than 300 characters' },
        { status: 400 }
      )
    }
    
    // Execute research search
    const searchService = ExaMCPService.createWithDefaults()
    const results = await searchService.searchResearchPapers(
      body.query,
      { numResults: body.maxResults || 10 }
    )
    
    // Add research-specific metadata
    const enhancedResults = {
      ...results,
      searchType: 'research',
      metadata: {
        totalPapers: results.totalResults,
        resultsCount: results.results.length
      }
    }
    
    return NextResponse.json(enhancedResults)
    
  } catch (error) {
    console.error('Research search API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Research search failed',
        message: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          'Service temporarily unavailable'
      },
      { status: 500 }
    )
  }
} 