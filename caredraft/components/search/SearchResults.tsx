'use client'

import React from 'react'
import { ExternalLink, Calendar, User, Star, Building2, BookOpen, Globe, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchResult, SearchResponse, SearchType } from './SearchInterface'

interface SearchResultsProps {
  results: SearchResponse
  searchType: SearchType
  onResultClick?: (result: SearchResult) => void
  className?: string
}

export function SearchResults({ 
  results, 
  searchType: _searchType, 
  onResultClick,
  className = '' 
}: SearchResultsProps) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'webSearch':
        return Globe
      case 'researchPapers':
        return BookOpen
      case 'companyResearch':
        return Building2
      default:
        return Globe
    }
  }

  const formatCredibilityScore = (score?: number) => {
    if (!score) return null
    const percentage = Math.round(score * 100)
    const variant = percentage >= 80 ? 'default' : percentage >= 60 ? 'secondary' : 'outline'
    return (
      <Badge variant={variant} className="text-xs">
        <Star className="h-3 w-3 mr-1" />
        {percentage}% credible
      </Badge>
    )
  }

  const formatRelevanceScore = (score?: number) => {
    if (!score) return null
    const percentage = Math.round(score * 100)
    if (percentage < 20) return null
    
    return (
      <Badge variant="outline" className="text-xs">
        <TrendingUp className="h-3 w-3 mr-1" />
        {percentage}% relevant
      </Badge>
    )
  }

  const formatDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return url
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const renderResultCard = (result: SearchResult, _index: number) => {
    const SourceIcon = getSourceIcon(result.source)
    
    return (
      <Card 
        key={result.id} 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onResultClick?.(result)}
      >
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Header with title and source */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg leading-tight line-clamp-2 hover:text-primary">
                  {result.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <SourceIcon className="h-4 w-4" />
                  <span className="truncate">{formatDomain(result.url)}</span>
                  {result.metadata?.publishedDate && (
                    <>
                      <div className="w-px h-4 bg-gray-300" />
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(result.metadata.publishedDate)}</span>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(result.url, '_blank', 'noopener,noreferrer')
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {/* Snippet */}
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {result.snippet}
            </p>

            {/* Metadata and badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Author for research papers */}
              {result.metadata?.author && (
                <Badge variant="outline" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {result.metadata.author}
                </Badge>
              )}

              {/* Credibility score */}
              {formatCredibilityScore(result.metadata?.credibilityScore)}

              {/* Care industry relevance */}
              {formatRelevanceScore(result.metadata?.careIndustryRelevance)}

              {/* Content type */}
              {result.metadata?.type && (
                <Badge variant="secondary" className="text-xs">
                  {result.metadata.type.replace('_', ' ')}
                </Badge>
              )}

              {/* Search score */}
              <Badge variant="outline" className="text-xs ml-auto">
                Score: {Math.round(result.score * 100)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!results.results.length) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm">Try adjusting your search terms or filters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Search Results
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{results.totalResults} results</span>
              <div className="w-px h-4 bg-gray-300" />
              <span>Query: "{results.query}"</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Results list */}
      <div className="space-y-3">
        {results.results.map((result, index) => renderResultCard(result, index))}
      </div>
    </div>
  )
} 