'use client'

import React, { useState } from 'react'
import { 
  FileText, 
  ExternalLink, 
  Copy, 
  Bookmark, 
  Calendar,
  Building2,
  BookOpen,
  Gavel,
  TrendingUp,
  MoreVertical,
} from 'lucide-react'

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

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  query: string
  totalCount: number
  searchTime: number
  aiSummary?: string
  onCopyToDraft: (content: string, title: string) => void
  onSaveToAnswerBank: (result: SearchResult) => void
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  query,
  totalCount,
  searchTime,
  aiSummary,
  onCopyToDraft,
  onSaveToAnswerBank
}) => {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'copy' | 'save' | null>(null)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  // Categorize results
  const categorizedResults = {
    all: results,
    internal: results.filter(r => r.source === 'internal' || r.type === 'document' || r.type === 'policy' || r.type === 'template'),
    external: results.filter(r => r.type === 'web' || r.type === 'news' || r.source !== 'internal'),
    competitors: results.filter(r => r.type === 'news' && (r.metadata.tags.some(tag => tag.includes('competitor')) || r.title.toLowerCase().includes('competitor'))),
    policy: results.filter(r => r.type === 'regulatory' || r.type === 'compliance' || r.type === 'guidance' || r.metadata.tags.some(tag => ['policy', 'regulation', 'compliance', 'cqc'].includes(tag))),
    research: results.filter(r => r.type === 'research' || r.metadata.tags.some(tag => ['research', 'study', 'academic'].includes(tag)))
  }

  const tabs = [
    { id: 'all', label: 'All Results', count: categorizedResults.all.length, icon: FileText },
    { id: 'internal', label: 'Internal Docs', count: categorizedResults.internal.length, icon: BookOpen },
    { id: 'external', label: 'External Web', count: categorizedResults.external.length, icon: ExternalLink },
    { id: 'competitors', label: 'Competitor News', count: categorizedResults.competitors.length, icon: Building2 },
    { id: 'policy', label: 'Policy Updates', count: categorizedResults.policy.length, icon: Gavel },
    { id: 'research', label: 'Research Papers', count: categorizedResults.research.length, icon: TrendingUp }
  ]

  const currentResults = categorizedResults[activeTab as keyof typeof categorizedResults] || []

  const handleResultAction = (action: 'copy' | 'save', result: SearchResult) => {
    setActionType(action)
    setSelectedResult(result)
    setShowActionModal(true)
  }

  const executeAction = () => {
    if (!selectedResult || !actionType) return

    if (actionType === 'copy') {
      onCopyToDraft(selectedResult.content || selectedResult.excerpt, selectedResult.title)
    } else if (actionType === 'save') {
      onSaveToAnswerBank(selectedResult)
    }
    
    setShowActionModal(false)
    setActionType(null)
    setSelectedResult(null)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />
      case 'policy': case 'compliance': case 'regulatory': return <Gavel className="w-4 h-4" />
      case 'template': return <Copy className="w-4 h-4" />
      case 'research': return <TrendingUp className="w-4 h-4" />
      case 'news': return <ExternalLink className="w-4 h-4" />
      case 'web': case 'guidance': return <BookOpen className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-brand-100 text-brand-800'
      case 'policy': case 'compliance': case 'regulatory': return 'bg-red-100 text-red-800'
      case 'template': return 'bg-green-100 text-green-800'
      case 'research': return 'bg-purple-100 text-purple-800'
      case 'news': return 'bg-orange-100 text-orange-800'
      case 'web': case 'guidance': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex space-x-4 border-b border-gray-200">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="bg-gradient-to-r from-brand-primary-light to-orange-50 p-4 rounded-lg border border-brand-primary">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-brand-primary-dark">
            {totalCount} results found for "{query}"
          </h3>
          <span className="text-sm text-brand-primary">
            Search completed in {searchTime}ms
          </span>
        </div>
        {aiSummary && (
          <p className="text-sm text-brand-primary-dark leading-relaxed">
            {aiSummary}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id 
                      ? 'bg-brand-primary-light text-brand-primary' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {currentResults.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found in this category
            </h3>
            <p className="text-gray-500">
              Try adjusting your search terms or explore other categories.
            </p>
          </div>
        ) : (
          currentResults.map((result) => (
            <div
              key={result.id}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(result.type)}`}>
                      {getTypeIcon(result.type)}
                      <span className="capitalize">{result.type}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Relevance: {Math.round(result.relevanceScore * 100)}%
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-brand-primary cursor-pointer">
                    {result.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {result.excerpt}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(result.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-4 h-4" />
                      <span className="capitalize">{result.source}</span>
                    </div>
                    {result.metadata.wordCount && (
                      <span>{result.metadata.wordCount.toLocaleString()} words</span>
                    )}
                  </div>

                  {/* Tags */}
                  {result.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {result.metadata.tags.slice(0, 5).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      {result.metadata.tags.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                          +{result.metadata.tags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleResultAction('copy', result)}
                    className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary-light rounded-md transition-colors"
                    title="Copy to Draft"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleResultAction('save', result)}
                    className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary-light rounded-md transition-colors"
                    title="Save to Answer Bank"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary-light rounded-md transition-colors"
                      title="Visit Source"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary-light rounded-md transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {actionType === 'copy' ? 'Copy to Draft' : 'Save to Answer Bank'}
            </h3>
            <p className="text-gray-600 mb-6">
              {actionType === 'copy' 
                ? `Copy "${selectedResult.title}" content to your current draft?`
                : `Save "${selectedResult.title}" to your answer bank for future reference?`
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-dark transition-colors"
              >
                {actionType === 'copy' ? 'Copy' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchResults 