'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
//  Calendar,
//  Star,
  Tag,
//  User,
  Folder,
//  Clock,
//  TrendingUp,
  BookOpen
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AutocompleteSuggestion {
  type: 'title' | 'category' | 'tag'
  value: string
  label: string
  count?: number
  relevance: number
  metadata?: Record<string, unknown>
}

interface SearchFilter {
  category_id?: string
  tags?: string[]
  is_template?: boolean
  is_public?: boolean
  min_rating?: number
  created_after?: string
  created_before?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

interface AdvancedSearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilter) => void
  onClear: () => void
  placeholder?: string
  className?: string
  defaultQuery?: string
  defaultFilters?: SearchFilter
  showAdvancedFilters?: boolean
}

export default function AdvancedSearchInterface({
  onSearch,
  onClear,
  placeholder = "Search answers...",
  className = "",
  defaultQuery = "",
  defaultFilters = {},
  showAdvancedFilters = true
}: AdvancedSearchInterfaceProps) {
  const [query, setQuery] = useState(defaultQuery)
  const [filters, setFilters] = useState<SearchFilter>(defaultFilters)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [, setIsLoading] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Debounced autocomplete function
  const debouncedAutocomplete = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/answers/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          limit: 8,
          include_categories: true,
          include_tags: true,
          include_titles: true
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setSuggestions(result.data.suggestions || [])
        setShowSuggestions(true)
      }
    } catch {
      console.error('Autocomplete error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setQuery(value)
    setSelectedSuggestionIndex(-1)
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      debouncedAutocomplete(value)
    }, 300)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          applySuggestion(suggestions[selectedSuggestionIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  // Apply suggestion to search
  const applySuggestion = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.type === 'title') {
      setQuery(suggestion.value)
      handleSearch(suggestion.value)
    } else if (suggestion.type === 'category') {
      setFilters(prev => ({ ...prev, category_id: suggestion.value }))
      handleSearch(query, { ...filters, category_id: suggestion.value })
    } else if (suggestion.type === 'tag') {
      const currentTags = filters.tags || []
      if (!currentTags.includes(suggestion.value)) {
        const newTags = [...currentTags, suggestion.value]
        setFilters(prev => ({ ...prev, tags: newTags }))
        handleSearch(query, { ...filters, tags: newTags })
      }
    }
    
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
  }

  // Perform search
  const handleSearch = (searchQuery?: string, searchFilters?: SearchFilter) => {
    const finalQuery = searchQuery !== undefined ? searchQuery : query
    const finalFilters = searchFilters !== undefined ? searchFilters : filters
    
    onSearch(finalQuery, finalFilters)
    setShowSuggestions(false)
  }

  // Clear search and filters
  const handleClear = () => {
    setQuery('')
    setFilters({})
    setSuggestions([])
    setShowSuggestions(false)
    onClear()
    searchInputRef.current?.focus()
  }

  // Update filter
  const updateFilter = (key: keyof SearchFilter, value: unknown) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    handleSearch(query, newFilters)
  }

  // Remove tag filter
  const removeTagFilter = (tagToRemove: string) => {
    const newTags = (filters.tags || []).filter(tag => tag !== tagToRemove)
    updateFilter('tags', newTags.length > 0 ? newTags : undefined)
  }

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get filter count for badge
  const getFilterCount = () => {
    let count = 0
    if (filters.category_id) count++
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length
    if (filters.is_template !== undefined) count++
    if (filters.is_public !== undefined) count++
    if (filters.min_rating !== undefined) count++
    if (filters.created_after) count++
    if (filters.created_before) count++
    return count
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'title': return <BookOpen className="h-4 w-4" />
      case 'category': return <Folder className="h-4 w-4" />
      case 'tag': return <Tag className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
          />
          
          {/* Search Actions */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {showAdvancedFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-6 px-2 text-xs ${showFilters ? 'bg-brand-primary text-white' : 'hover:bg-gray-100'}`}
              >
                <Filter className="h-3 w-3 mr-1" />
                {getFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {getFilterCount()}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.value}`}
                className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  index === selectedSuggestionIndex 
                    ? 'bg-brand-primary bg-opacity-10 border-brand-primary' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => applySuggestion(suggestion)}
              >
                <div className="flex items-center space-x-2">
                  <div className="text-gray-400">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {suggestion.label}
                  </span>
                  {suggestion.count && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.count}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && showFilters && (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          {/* Active Filters */}
          {getFilterCount() > 0 && (
            <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
              {filters.category_id && (
                <Badge 
                  variant="secondary" 
                  className="bg-brand-primary bg-opacity-10 text-brand-primary border-brand-primary"
                >
                  📁 {filters.category_id}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('category_id', undefined)}
                  />
                </Badge>
              )}
              
              {filters.tags?.map(tag => (
                <Badge 
                  key={tag}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  🏷️ {tag}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => removeTagFilter(tag)}
                  />
                </Badge>
              ))}
              
              {filters.is_template !== undefined && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                  Template: {filters.is_template ? 'Yes' : 'No'}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('is_template', undefined)}
                  />
                </Badge>
              )}
              
              {filters.min_rating && (
                <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  ⭐ {filters.min_rating}+ rating
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('min_rating', undefined)}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category_id || ''}
                onChange={(e) => updateFilter('category_id', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
              >
                <option value="">All Categories</option>
                <option value="Technical">Technical</option>
                <option value="Compliance">Compliance</option>
                <option value="Social Value">Social Value</option>
                <option value="Commercial">Commercial</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <select
                value={filters.min_rating || ''}
                onChange={(e) => updateFilter('min_rating', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
              >
                <option value="">Any Rating</option>
                <option value="1">⭐ 1+ Stars</option>
                <option value="2">⭐ 2+ Stars</option>
                <option value="3">⭐ 3+ Stars</option>
                <option value="4">⭐ 4+ Stars</option>
                <option value="5">⭐ 5 Stars</option>
              </select>
            </div>

            {/* Template Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.is_template !== undefined ? (filters.is_template ? 'true' : 'false') : ''}
                onChange={(e) => updateFilter('is_template', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
              >
                <option value="">All Types</option>
                <option value="true">Templates Only</option>
                <option value="false">Regular Answers</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({})
                onSearch(query, {})
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Hide Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 