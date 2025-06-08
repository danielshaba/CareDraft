'use client'

import React, { useState } from 'react'
import { Filter, ChevronDown, ChevronUp, Calendar, FileText, Globe2, Building, Users, X } from 'lucide-react'

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
  resultsCount?: number
  className?: string
}

interface FilterOption {
  value: string
  label: string
  count?: number
  color?: string
}

const contentTypeOptions: FilterOption[] = [
  { value: 'all', label: 'All Content', count: 1247 },
  { value: 'documents', label: 'Documents', count: 542, color: 'blue' },
  { value: 'policies', label: 'Policies & Procedures', count: 89, color: 'green' },
  { value: 'templates', label: 'Templates', count: 156, color: 'purple' },
  { value: 'research', label: 'Research Papers', count: 234, color: 'orange' },
  { value: 'news', label: 'News & Updates', count: 178, color: 'red' },
  { value: 'compliance', label: 'Compliance Guides', count: 48, color: 'yellow' },
]

const dateRangeOptions: FilterOption[] = [
  { value: 'all', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
  { value: 'quarter', label: 'Past 3 months' },
  { value: 'year', label: 'Past year' },
  { value: 'custom', label: 'Custom range...' },
]

const sourceOptions: FilterOption[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'internal', label: 'Internal Library' },
  { value: 'cqc', label: 'CQC Guidelines' },
  { value: 'nhs', label: 'NHS Resources' },
  { value: 'gov', label: 'Government Publications' },
  { value: 'academic', label: 'Academic Research' },
  { value: 'industry', label: 'Industry Reports' },
]

const sortOptions: FilterOption[] = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'date', label: 'Most Recent' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'type', label: 'Content Type' },
]

const fileTypeOptions: FilterOption[] = [
  { value: 'all', label: 'All File Types' },
  { value: 'pdf', label: 'PDF Documents' },
  { value: 'doc', label: 'Word Documents' },
  { value: 'xls', label: 'Spreadsheets' },
  { value: 'ppt', label: 'Presentations' },
  { value: 'txt', label: 'Text Files' },
]

const popularTags = [
  'care-standards', 'health-safety', 'staff-training', 'medication-management',
  'quality-assurance', 'infection-control', 'mental-health', 'dementia-care',
  'safeguarding', 'dignity-respect', 'person-centered', 'compliance'
]

export function SearchFilters({
  filters,
  onFiltersChange,
  resultsCount,
  className = ""
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')

  const updateFilter = (key: string, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const addTag = (tag: string) => {
    const currentTags = filters.tags || []
    if (!currentTags.includes(tag)) {
      updateFilter('tags', [...currentTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    const currentTags = filters.tags || []
    updateFilter('tags', currentTags.filter(t => t !== tag))
  }

  const clearAllFilters = () => {
    onFiltersChange({
      contentType: 'all',
      dateRange: 'all',
      source: 'all',
      sortBy: 'relevance',
      tags: [],
      fileType: 'all',
      language: 'all'
    })
    setShowCustomDate(false)
    setCustomDateFrom('')
    setCustomDateTo('')
  }

  const hasActiveFilters = () => {
    return filters.contentType !== 'all' ||
           filters.dateRange !== 'all' ||
           filters.source !== 'all' ||
           filters.sortBy !== 'relevance' ||
           (filters.tags && filters.tags.length > 0) ||
           (filters.fileType && filters.fileType !== 'all')
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.contentType !== 'all') count++
    if (filters.dateRange !== 'all') count++
    if (filters.source !== 'all') count++
    if (filters.sortBy !== 'relevance') count++
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length
    if (filters.fileType && filters.fileType !== 'all') count++
    return count
  }

  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomDate(true)
    } else {
      setShowCustomDate(false)
      updateFilter('dateRange', value)
    }
  }

  const applyCustomDateRange = () => {
    if (customDateFrom && customDateTo) {
      updateFilter('dateRange', `${customDateFrom}|${customDateTo}`)
      setShowCustomDate(false)
    }
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