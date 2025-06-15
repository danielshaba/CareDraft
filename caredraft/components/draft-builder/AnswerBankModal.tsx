'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
//  Search, 
  Clipboard, 
  Star, 
//  Clock, 
  Copy,
  Eye
} from 'lucide-react'
import AdvancedSearchInterface from '../answer-bank/AdvancedSearchInterface'

interface AnswerBankModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (content: string) => void
}

interface Answer {
  id: string
  title: string
  content: string
  category?: {
    id: string
    name: string
    color?: string
  }
  usage_count: number
  average_rating: number
  created_at: string
  updated_at: string
  is_template: boolean
  tags?: string[]
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

export default function AnswerBankModal({ isOpen, onClose, onInsert }: AnswerBankModalProps) {
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy] = useState<'usage' | 'rating' | 'recent' | 'title'>('usage')
  const [previewAnswer, setPreviewAnswer] = useState<Answer | null>(null)

  // Load answers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAnswers()
    }
  }, [isOpen])

  // Search and filter when criteria change
  useEffect(() => {
    if (isOpen) {
      loadAnswers()
    }
  }, [searchTerm, selectedCategory, sortBy])

  const loadAnswers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category_id', selectedCategory)
      params.append('sort_by', sortBy)
      params.append('sort_order', sortBy === 'recent' ? 'desc' : 'desc')
      params.append('limit', '20')

      const response = await fetch(`/api/answers?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setAnswers(result.data.answers || [])
      } else {
        console.error('Failed to load answers:', result.error)
      }
    } catch (error) {
      console.error('Error loading answers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string, filters: SearchFilter) => {
    setSearchTerm(query)
    setLoading(true)
    
    try {
      const searchParams = new URLSearchParams()
      
      if (query) searchParams.append('query', query)
      if (filters.category_id) searchParams.append('category_id', filters.category_id)
      if (filters.tags && filters.tags.length > 0) {
        searchParams.append('tags', filters.tags.join(','))
      }
      if (filters.is_template !== undefined) {
        searchParams.append('is_template', String(filters.is_template))
      }
      if (filters.min_rating !== undefined) {
        searchParams.append('min_rating', String(filters.min_rating))
      }
      if (filters.sort_by) {
        searchParams.append('sort_by', filters.sort_by)
        searchParams.append('sort_order', filters.sort_order || 'desc')
      } else {
        searchParams.append('sort_by', sortBy === 'usage' ? 'usage_count' : sortBy)
        searchParams.append('sort_order', 'desc')
      }
      
      const response = await fetch(`/api/answers/search?${searchParams}`)
      const result = await response.json()
      
      if (result.success) {
        setAnswers(result.data.answers || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInsert = async (answer: Answer) => {
    // Track usage
    try {
      await fetch(`/api/answers/${answer.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: 'proposal_draft' })
      })
    } catch (error) {
      console.error('Error tracking usage:', error)
    }

    // Insert content
    onInsert(answer.content)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-brand-50 rounded-lg">
                <Clipboard className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Answer Bank</h3>
                <p className="text-sm text-gray-500">Insert saved content into your document</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Enhanced Search Interface */}
          <div className="px-6 py-4 border-b border-gray-200">
            <AdvancedSearchInterface
              onSearch={handleSearch}
              onClear={() => {
                setSearchTerm('')
                setSelectedCategory('')
                loadAnswers()
              }}
              placeholder="Search answers..."
              className="w-full"
              defaultQuery={searchTerm}
              defaultFilters={{
                category_id: selectedCategory || undefined,
                sort_by: sortBy === 'usage' ? 'usage_count' : sortBy,
                sort_order: 'desc'
              }}
              showAdvancedFilters={true}
            />
          </div>

          {/* Results */}
          <div className="flex h-96">
            {/* Answer List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
              ) : answers.length === 0 ? (
                <div className="text-center py-8">
                  <Clipboard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No answers found</h3>
                  <p className="text-sm text-gray-500">
                    {searchTerm || selectedCategory 
                      ? 'Try adjusting your search or filters'
                      : 'Get started by creating your first answer in the Answer Bank management interface'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {answers.map((answer) => (
                    <div
                      key={answer.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-brand-500 hover:bg-brand-50 transition-colors cursor-pointer"
                      onClick={() => setPreviewAnswer(answer)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {answer.title}
                            </h4>
                            {answer.is_template && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800">
                                Template
                              </span>
                            )}
                            {answer.category && (
                              <span 
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: answer.category.color ? `${answer.category.color}20` : '#f3f4f6',
                                  color: answer.category.color || '#6b7280'
                                }}
                              >
                                {answer.category.name}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {answer.content.length > 120 ? `${answer.content.substring(0, 120)}...` : answer.content}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Copy className="h-3 w-3" />
                              <span>{answer.usage_count} uses</span>
                            </div>
                            {answer.average_rating > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span>{answer.average_rating.toFixed(1)}</span>
                              </div>
                            )}
                            <span>Updated {formatDate(answer.updated_at)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewAnswer(answer)
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInsert(answer)
                            }}
                            className="px-3 py-1 bg-brand-500 text-white text-xs rounded hover:bg-brand-600 transition-colors"
                          >
                            Insert
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Pane */}
            {previewAnswer && (
              <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Preview</h4>
                  <button
                    onClick={() => setPreviewAnswer(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">{previewAnswer.title}</h5>
                    {previewAnswer.category && (
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium mb-3"
                        style={{
                          backgroundColor: previewAnswer.category.color ? `${previewAnswer.category.color}20` : '#f3f4f6',
                          color: previewAnswer.category.color || '#6b7280'
                        }}
                      >
                        {previewAnswer.category.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {previewAnswer.content}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{previewAnswer.usage_count} uses</span>
                      {previewAnswer.average_rating > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span>{previewAnswer.average_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleInsert(previewAnswer)}
                      className="w-full px-3 py-2 bg-brand-500 text-white text-sm rounded hover:bg-brand-600 transition-colors"
                    >
                      Insert into Document
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 