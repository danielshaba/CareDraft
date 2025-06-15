'use client'

import React, { useState } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'

interface SearchFiltersProps {
  filters: {
    contentType: string
    dateRange: string
    source: string
    sortBy: string
    tags?: string[]
    fileType?: string
    language?: string
  }
  onFiltersChange: (filters: unknown) => void
  className?: string
}















export function SearchFilters({
  filters,
  onFiltersChange,
  className = ""
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: string, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Search Filters</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <select
              value={filters.contentType}
              onChange={(e) => updateFilter('contentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            >
              <option value="all">All Content</option>
              <option value="documents">Documents</option>
              <option value="policies">Policies & Procedures</option>
              <option value="templates">Templates</option>
              <option value="research">Research Papers</option>
              <option value="news">News & Updates</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            >
              <option value="relevance">Most Relevant</option>
              <option value="date">Most Recent</option>
              <option value="popularity">Most Popular</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {isExpanded && (
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => updateFilter('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                >
                  <option value="all">Any time</option>
                  <option value="today">Today</option>
                  <option value="week">Past week</option>
                  <option value="month">Past month</option>
                  <option value="quarter">Past 3 months</option>
                  <option value="year">Past year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => updateFilter('source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                >
                  <option value="all">All Sources</option>
                  <option value="internal">Internal Library</option>
                  <option value="cqc">CQC Guidelines</option>
                  <option value="nhs">NHS Resources</option>
                  <option value="gov">Government Publications</option>
                  <option value="academic">Academic Research</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 