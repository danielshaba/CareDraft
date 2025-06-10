'use client'

import React from 'react'
import { Settings, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { SearchFiltersState, SearchType } from './SearchInterface'

interface SearchFiltersProps {
  filters: SearchFiltersState
  onFiltersChange: (filters: SearchFiltersState) => void
  searchType: SearchType
  className?: string
}

export function SearchFilters({ 
  filters, 
  onFiltersChange, 
  searchType,
  className = '' 
}: SearchFiltersProps) {
  const handleFilterChange = (key: keyof SearchFiltersState, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      maxResults: 10,
      careIndustryFocus: true,
      sortBy: 'relevance',
      minCredibility: 0.5
    })
  }

  const getMaxResultsOptions = () => {
    switch (searchType) {
      case 'research':
        return [5, 10, 15, 20]
      case 'company':
        return [3, 5, 10, 15]
      default:
        return [5, 10, 20, 30, 50]
    }
  }

  const getSortOptions = () => {
    const baseOptions = [
      { value: 'relevance', label: 'Relevance' },
      { value: 'credibility', label: 'Credibility Score' }
    ]

    if (searchType === 'research') {
      baseOptions.push({ value: 'date', label: 'Publication Date' })
    }

    return baseOptions
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Search Filters
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium block">Maximum Results</label>
          <select
            value={filters.maxResults.toString()}
            onChange={(e) => handleFilterChange('maxResults', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {getMaxResultsOptions().map((option) => (
              <option key={option} value={option.toString()}>
                {option} results
              </option>
            ))}
          </select>
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-3">
          <label className="text-sm font-medium block">Sort Results By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {getSortOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Minimum Credibility</label>
            <span className="text-xs text-gray-500">
              {Math.round(filters.minCredibility * 100)}%
            </span>
          </div>
          <Slider
            value={[filters.minCredibility]}
            onValueChange={(value: number[]) => handleFilterChange('minCredibility', value[0])}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
          />
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium">Care Industry Focus</label>
              <p className="text-xs text-gray-500">
                Optimize search for care industry content
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.careIndustryFocus}
                onChange={(e) => handleFilterChange('careIndustryFocus', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 