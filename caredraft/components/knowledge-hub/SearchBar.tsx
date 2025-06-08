'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, Globe, X, Filter, ChevronDown, Mic, MicOff } from 'lucide-react'

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  useLibraryAI: boolean
  useInternetAI: boolean
  onLibraryAIChange: (enabled: boolean) => void
  onInternetAIChange: (enabled: boolean) => void
  onSearch: () => void
  isSearching?: boolean
  placeholder?: string
  className?: string
}

interface SuggestionItem {
  id: string
  text: string
  type: 'recent' | 'trending' | 'completion'
  category?: string
}

const mockSuggestions: SuggestionItem[] = [
  { id: '1', text: 'care home regulations', type: 'recent' },
  { id: '2', text: 'elderly care best practices', type: 'trending' },
  { id: '3', text: 'health and safety compliance', type: 'recent' },
  { id: '4', text: 'staff training requirements', type: 'completion' },
  { id: '5', text: 'CQC inspection preparation', type: 'trending' },
  { id: '6', text: 'medication management protocols', type: 'completion' },
]

export function SearchBar({
  query,
  onQueryChange,
  useLibraryAI,
  useInternetAI,
  onLibraryAIChange,
  onInternetAIChange,
  onSearch,
  isSearching = false,
  placeholder = "Search knowledge base, documents, or research online...",
  className = ""
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<SuggestionItem[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [isListening, setIsListening] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on query
  useEffect(() => {
    if (query.trim()) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions(mockSuggestions.slice(0, 4)) // Show recent/trending when no query
    }
    setSelectedSuggestionIndex(-1)
  }, [query])

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(filteredSuggestions[selectedSuggestionIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setIsFocused(false)
        inputRef.current?.blur()
        break
    }
  }

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionRefs.current[selectedSuggestionIndex]) {
      suggestionRefs.current[selectedSuggestionIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedSuggestionIndex])

  const handleFocus = () => {
    setIsFocused(true)
    setShowSuggestions(true)
  }

  const handleSearch = () => {
    if (query.trim()) {
      setShowSuggestions(false)
      setIsFocused(false)
      onSearch()
    }
  }

  const handleSuggestionSelect = (suggestion: SuggestionItem) => {
    onQueryChange(suggestion.text)
    setShowSuggestions(false)
    setIsFocused(false)
    // Auto-search after selection
    setTimeout(() => onSearch(), 100)
  }

  const clearSearch = () => {
    onQueryChange('')
    inputRef.current?.focus()
  }

  // Voice search simulation
  const toggleVoiceSearch = () => {
    setIsListening(!isListening)
    // Simulate voice input
    if (!isListening) {
      setTimeout(() => {
        onQueryChange('care home quality standards')
        setIsListening(false)
      }, 2000)
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent': return '🕐'
      case 'trending': return '📈'
      case 'completion': return '💡'
      default: return '🔍'
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main Search Container */}
      <div className={`relative bg-white rounded-xl border-2 transition-all duration-200 ${
        isFocused 
          ? 'border-brand-primary shadow-lg shadow-brand-primary/20' 
          : 'border-gray-200 hover:border-gray-300'
      }`}>
        
        {/* Search Input */}
        <div className="flex items-center p-4">
          <Search className={`w-5 h-5 mr-3 transition-colors ${
            isFocused ? 'text-brand-primary' : 'text-gray-400'
          }`} />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 text-gray-900 placeholder-gray-500 focus:outline-none text-lg"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          />

          {/* Voice Search Button */}
          <button
            onClick={toggleVoiceSearch}
            className={`mr-3 p-2 rounded-lg transition-colors ${
              isListening 
                ? 'bg-red-100 text-red-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={isListening ? 'Stop listening' : 'Voice search'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Clear Button */}
          {query && (
            <button
              onClick={clearSearch}
              className="mr-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              query.trim() && !isSearching
                ? 'bg-brand-primary text-white hover:bg-brand-primary-dark shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSearching ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </div>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* AI Source Toggles */}
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-open-sans)' }}>
              AI Search Sources:
            </span>
            <div className="flex items-center space-x-4">
              {/* Library AI Toggle */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLibraryAI}
                  onChange={(e) => onLibraryAIChange(e.target.checked)}
                  className="sr-only"
                />
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all ${
                  useLibraryAI 
                    ? 'bg-brand-primary-light border-brand-primary text-brand-primary-dark' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Library AI</span>
                </div>
              </label>

              {/* Internet AI Toggle */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useInternetAI}
                  onChange={(e) => onInternetAIChange(e.target.checked)}
                  className="sr-only"
                />
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all ${
                  useInternetAI 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Internet AI</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
              {query ? 'Matching suggestions' : 'Recent & trending searches'}
            </div>
            
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                                 ref={(el) => { suggestionRefs.current[index] = el }}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedSuggestionIndex === index 
                    ? 'bg-brand-primary-light text-brand-primary-dark' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="mr-3 text-lg">{getSuggestionIcon(suggestion.type)}</span>
                <span className="flex-1 text-sm text-gray-900">{suggestion.text}</span>
                <span className="text-xs text-gray-500 capitalize">{suggestion.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice Search Indicator */}
      {isListening && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg border border-red-200 text-sm">
          🎤 Listening... Speak your search query
        </div>
      )}
    </div>
  )
} 