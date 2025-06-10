'use client'

import React, { useState } from 'react'
import { Search, Filter, BookOpen, Globe, TrendingUp, FileText, Clock, Star, Settings } from 'lucide-react'
// SearchBar and SearchFilters components removed - functionality integrated inline
import SearchResults from '@/components/knowledge-hub/SearchResults'
import { KnowledgeSearchService } from '@/lib/services/knowledge-search'

interface SearchFiltersState {
  contentType: string
  dateRange: string
  source: string
  sortBy: string
}

interface SearchResult {
  id: string
  title: string
  content?: string
  excerpt: string
  type: 'document' | 'policy' | 'template' | 'research' | 'news' | 'compliance' | 'web' | 'regulatory' | 'guidance'
  source: string
  url?: string
  date: string
  relevanceScore: number
  metadata: {
    author?: string
    tags: string[]
    fileType?: string
    wordCount?: number
    lastModified?: string
    domain?: string
    hasImages?: boolean
    isNews?: boolean
    language?: string
    highlights?: string[]
  }
}

interface SearchState {
  query: string
  useLibraryAI: boolean
  useInternetAI: boolean
  filters: SearchFiltersState
  isSearching: boolean
  results: SearchResult[]
  totalCount: number
  searchTime: number
  aiSummary?: string
}

export default function KnowledgeHubPage() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    useLibraryAI: true,
    useInternetAI: false,
    filters: {
      contentType: 'all',
      dateRange: 'all',
      source: 'all',
      sortBy: 'relevance'
    },
    isSearching: false,
    results: [],
    totalCount: 0,
    searchTime: 0,
    aiSummary: undefined
  })

  const [activeTab, setActiveTab] = useState<'internal' | 'external' | 'competitor' | 'policy'>('internal')
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = async () => {
    if (!searchState.query.trim()) return
    
    setSearchState(prev => ({ ...prev, isSearching: true }))
    
    try {
      const searchService = KnowledgeSearchService.getInstance()
      const searchQuery = {
        query: searchState.query,
        useLibraryAI: searchState.useLibraryAI,
        useInternetAI: searchState.useInternetAI,
        filters: searchState.filters
      }
      
      const response = await searchService.search(searchQuery)
      
      setSearchState(prev => ({
        ...prev,
        results: response.results,
        totalCount: response.totalCount,
        searchTime: response.searchTime,
        aiSummary: response.aiSummary,
        isSearching: false
      }))
      
    } catch (error) {
      console.error('Search error:', error)
      setSearchState(prev => ({ ...prev, isSearching: false }))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCopyToDraft = (content: string, title: string) => {
    // TODO: Integrate with draft builder
    console.log('Copying to draft:', { title, content })
    // For now, copy to clipboard
    navigator.clipboard.writeText(`# ${title}\n\n${content}`)
    alert('Content copied to clipboard!')
  }

  const handleSaveToAnswerBank = (result: SearchResult) => {
    // TODO: Integrate with answer bank system
    console.log('Saving to answer bank:', result)
    alert('Saved to answer bank!')
  }

  // Calculate tab counts based on search results
  const getTabCounts = () => {
    const internal = searchState.results.filter(r => r.source === 'internal' || ['document', 'policy', 'template'].includes(r.type)).length
    const external = searchState.results.filter(r => r.type === 'web' || r.type === 'news' || r.source !== 'internal').length
    const competitor = searchState.results.filter(r => r.type === 'news' && (r.metadata.tags.some(tag => tag.includes('competitor')) || r.title.toLowerCase().includes('competitor'))).length
    const policy = searchState.results.filter(r => ['regulatory', 'compliance', 'guidance'].includes(r.type) || r.metadata.tags.some(tag => ['policy', 'regulation', 'compliance', 'cqc'].includes(tag))).length
    
    return { internal, external, competitor, policy }
  }

  const tabCounts = getTabCounts()

  const contentTypeOptions = [
    { value: 'all', label: 'All Content' },
    { value: 'documents', label: 'Documents' },
    { value: 'templates', label: 'Templates' },
    { value: 'examples', label: 'Examples' },
    { value: 'guidelines', label: 'Guidelines' }
  ]

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ]

  const sourceOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'internal', label: 'Internal Library' },
    { value: 'gov-uk', label: 'GOV.UK' },
    { value: 'contracts-finder', label: 'Contracts Finder' },
    { value: 'industry-news', label: 'Industry News' }
  ]

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Date' },
    { value: 'popularity', label: 'Popularity' },
    { value: 'alphabetical', label: 'Alphabetical' }
  ]

  const tabs = [
    { id: 'internal' as const, label: 'Internal Docs', icon: BookOpen, count: tabCounts.internal },
    { id: 'external' as const, label: 'External Web', icon: Globe, count: tabCounts.external },
    { id: 'competitor' as const, label: 'Competitor News', icon: TrendingUp, count: tabCounts.competitor },
    { id: 'policy' as const, label: 'Policy Updates', icon: FileText, count: tabCounts.policy }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Search className="h-8 w-8 text-[brand-primary] mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Knowledge Hub
                  </h1>
                  <p className="text-gray-600 mt-1" style={{ fontFamily: 'var(--font-open-sans)' }}>
                    Search internal documents and external sources for research and insights
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-[brand-primary] text-white border-[brand-primary]' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchState.query}
                  onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  placeholder="Search for documents, templates, policies, or ask a question..."
                  className="block w-full pl-10 pr-12 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-primary] focus:border-[brand-primary] text-lg"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchState.query.trim() || searchState.isSearching}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <div className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchState.query.trim() && !searchState.isSearching
                      ? 'bg-brand-primary text-white hover:bg-brand-primary-dark'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}>
                    {searchState.isSearching ? 'Searching...' : 'Search'}
                  </div>
                </button>
              </div>

              {/* AI Source Toggles */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchState.useLibraryAI}
                    onChange={(e) => setSearchState(prev => ({ 
                      ...prev, 
                      useLibraryAI: e.target.checked 
                    }))}
                    className="w-4 h-4 text-[brand-primary] border-gray-300 rounded focus:ring-[brand-primary]"
                  />
                  <BookOpen className="w-4 h-4 text-[brand-primary]" />
                  <span className="text-sm font-medium text-gray-700">Use Library AI</span>
                  <span className="text-xs text-gray-500">(RAG-powered internal search)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchState.useInternetAI}
                    onChange={(e) => setSearchState(prev => ({ 
                      ...prev, 
                      useInternetAI: e.target.checked 
                    }))}
                    className="w-4 h-4 text-[brand-primary] border-gray-300 rounded focus:ring-[brand-primary]"
                  />
                  <Globe className="w-4 h-4 text-[brand-primary]" />
                  <span className="text-sm font-medium text-gray-700">Use Internet AI</span>
                  <span className="text-xs text-gray-500">(External research)</span>
                </label>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content Type
                      </label>
                      <select
                        value={searchState.filters.contentType}
                        onChange={(e) => setSearchState(prev => ({
                          ...prev,
                          filters: { ...prev.filters, contentType: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[brand-primary] focus:border-[brand-primary]"
                      >
                        {contentTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <select
                        value={searchState.filters.dateRange}
                        onChange={(e) => setSearchState(prev => ({
                          ...prev,
                          filters: { ...prev.filters, dateRange: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[brand-primary] focus:border-[brand-primary]"
                      >
                        {dateRangeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source
                      </label>
                      <select
                        value={searchState.filters.source}
                        onChange={(e) => setSearchState(prev => ({
                          ...prev,
                          filters: { ...prev.filters, source: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[brand-primary] focus:border-[brand-primary]"
                      >
                        {sourceOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort By
                      </label>
                      <select
                        value={searchState.filters.sortBy}
                        onChange={(e) => setSearchState(prev => ({
                          ...prev,
                          filters: { ...prev.filters, sortBy: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[brand-primary] focus:border-[brand-primary]"
                      >
                        {sortOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Search History */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-[brand-primary]" />
                    Recent Searches
                  </h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Placeholder for search history */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 text-center py-8">
                    No recent searches
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 flex items-center mb-3">
                    <Star className="w-4 h-4 mr-2 text-[brand-primary]" />
                    Saved Queries
                  </h4>
                  <div className="text-sm text-gray-500 text-center py-4">
                    No saved queries
                  </div>
                </div>
              </div>
            </div>

            {/* Main Results Area */}
            <div className="lg:col-span-3">
              {/* Results Tabs */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-[brand-primary] text-[brand-primary] bg-red-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                          <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                            activeTab === tab.id 
                              ? 'bg-[brand-primary] text-white' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Results Content */}
                <div className="p-6">
                  {searchState.query && (searchState.results.length > 0 || searchState.isSearching) ? (
                    <SearchResults
                      results={searchState.results}
                      isLoading={searchState.isSearching}
                      query={searchState.query}
                      totalCount={searchState.totalCount}
                      searchTime={searchState.searchTime}
                      aiSummary={searchState.aiSummary}
                      onCopyToDraft={handleCopyToDraft}
                      onSaveToAnswerBank={handleSaveToAnswerBank}
                    />
                  ) : searchState.query && !searchState.isSearching ? (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No results found for &quot;{searchState.query}&quot;</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Try adjusting your search terms or filters
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">Start searching to find relevant content</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Use the search bar above to find documents, templates, and insights
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 