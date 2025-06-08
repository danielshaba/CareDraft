'use client'

import React, { useState, useCallback } from 'react'
import { Search, Filter, Loader2, AlertCircle, BookOpen, Building2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SearchResults } from './SearchResults'
import { SearchFilters } from './SearchFilters'

export type SearchType = 'web' | 'research' | 'company'

export interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  score: number
  source: string
  timestamp: Date
  metadata?: {
    domain?: string
    credibilityScore?: number
    careIndustryRelevance?: number
    publishedDate?: string
    author?: string
    type?: string
  }
}

export interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  searchTime: number
  query: string
  tool: string
  metadata: {
    careOptimized: boolean
    resultsFiltered: number
    credibilityScored: boolean
  }
}

export interface SearchFiltersState {
  maxResults: number
  careIndustryFocus: boolean
  sortBy: 'relevance' | 'date' | 'credibility'
  minCredibility: number
}

interface SearchInterfaceProps {
  onSearchComplete?: (results: SearchResponse) => void
  defaultSearchType?: SearchType
  className?: string
}

export function SearchInterface({ 
  onSearchComplete, 
  defaultSearchType = 'web',
  className = '' 
}: SearchInterfaceProps) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>(defaultSearchType)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFiltersState>({
    maxResults: 10,
    careIndustryFocus: true,
    sortBy: 'relevance',
    minCredibility: 0.5
  })

  const searchTypeConfig = {
    web: {
      icon: Globe,
      label: 'Web Search',
      description: 'Search the web for care industry information',
      placeholder: 'Search for care industry information...'
    },
    research: {
      icon: BookOpen,
      label: 'Research Papers',
      description: 'Find academic research and studies',
      placeholder: 'Search for research papers and studies...'
    },
    company: {
      icon: Building2,
      label: 'Company Research',
      description: 'Research care providers and organizations',
      placeholder: 'Enter company or organization name...'
    }
  }

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const searchEndpoint = searchType === 'research' 
        ? '/api/search/research'
        : searchType === 'company'
        ? '/api/search/company'
        : '/api/search'

      const requestBody = searchType === 'company' 
        ? { companyName: query, maxResults: filters.maxResults }
        : { 
            query, 
            type: searchType,
            maxResults: filters.maxResults,
            careIndustryFocus: filters.careIndustryFocus
          }

      const response = await fetch(searchEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Search failed: ${response.status}`)
      }

      const searchResults: SearchResponse = await response.json()
      
      // Apply client-side filtering
      let filteredResults = searchResults.results
      
      if (filters.minCredibility > 0) {
        filteredResults = filteredResults.filter(result => 
          (result.metadata?.credibilityScore || 0) >= filters.minCredibility
        )
      }

      // Apply sorting
      if (filters.sortBy === 'credibility') {
        filteredResults.sort((a, b) => 
          (b.metadata?.credibilityScore || 0) - (a.metadata?.credibilityScore || 0)
        )
      } else if (filters.sortBy === 'date') {
        filteredResults.sort((a, b) => {
          const dateA = a.metadata?.publishedDate ? new Date(a.metadata.publishedDate) : new Date(0)
          const dateB = b.metadata?.publishedDate ? new Date(b.metadata.publishedDate) : new Date(0)
          return dateB.getTime() - dateA.getTime()
        })
      }

      const finalResults = {
        ...searchResults,
        results: filteredResults,
        totalResults: filteredResults.length
      }

      setResults(finalResults)
      onSearchComplete?.(finalResults)

    } catch {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [query, searchType, filters, onSearchComplete])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch()
    }
  }

  const currentConfig = searchTypeConfig[searchType]
  const IconComponent = currentConfig.icon

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            External Research & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Type Tabs */}
          <Tabs value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
            <TabsList className="grid w-full grid-cols-3">
              {Object.entries(searchTypeConfig).map(([type, config]) => {
                const Icon = config.icon
                return (
                  <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {Object.entries(searchTypeConfig).map(([type, config]) => (
              <TabsContent key={type} value={type} className="mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                  
                  {/* Search Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={config.placeholder}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    <Button 
                      onClick={() => setShowFilters(!showFilters)}
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={handleSearch}
                      disabled={isLoading || !query.trim()}
                      className="min-w-[100px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Search Filters */}
          {showFilters && (
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              searchType={searchType}
            />
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {results && (
        <SearchResults 
          results={results}
          searchType={searchType}
          onResultClick={(result) => {
            // Open result in new tab
            window.open(result.url, '_blank', 'noopener,noreferrer')
          }}
        />
      )}

      {/* Search Stats */}
      {results && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{results.totalResults} results</Badge>
                <span>in {results.searchTime}ms</span>
              </div>
              {results.metadata.careOptimized && (
                <Badge variant="outline">Care Industry Optimized</Badge>
              )}
              {results.metadata.credibilityScored && (
                <Badge variant="outline">Credibility Scored</Badge>
              )}
              <span>Tool: {results.tool}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 