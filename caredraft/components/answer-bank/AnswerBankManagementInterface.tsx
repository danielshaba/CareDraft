'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  FileText, 
  Archive, 
  Star,
  MoreVertical,
  Edit3,
  Trash2,
  Tag,
  Clock,
  TrendingUp,
  BarChart3,
  Eye,
  Users
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AnswerBankWithStats, 
  AnswerBankCategory, 
  AnswerBankSearchParams,
  AnswerBankAnalytics
} from '@/lib/types/answer-bank.types'

interface AnswerBankManagementInterfaceState {
  answers: AnswerBankWithStats[]
  categories: AnswerBankCategory[]
  analytics: AnswerBankAnalytics | null
  searchParams: AnswerBankSearchParams
  viewMode: 'grid' | 'list'
  selectedAnswers: string[]
  isLoading: boolean
  showFilters: boolean
  totalCount: number
  currentPage: number
}

export function AnswerBankManagementInterface() {
  const [state, setState] = useState<AnswerBankManagementInterfaceState>({
    answers: [],
    categories: [],
    analytics: null,
    searchParams: {
      query: '',
      sort_by: 'updated_at',
      sort_order: 'desc',
      page: 1,
      per_page: 20
    },
    viewMode: 'grid',
    selectedAnswers: [],
    isLoading: false,
    showFilters: false,
    totalCount: 0,
    currentPage: 1
  })

  const [activeTab, setActiveTab] = useState<'library' | 'analytics' | 'categories'>('library')

  // Load initial data
  useEffect(() => {
    loadAnswers()
    loadCategories()
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchParams.query, state.searchParams.sort_by, state.searchParams.sort_order, state.searchParams.page, state.searchParams.per_page])

  const loadAnswers = async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const params = new URLSearchParams()
      Object.entries(state.searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/answers?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          answers: data.data || [],
          totalCount: data.total || 0,
          isLoading: false
        }))
      }
    } catch {
      console.error('Failed to load answers:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/answers/categories')
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({ ...prev, categories: data.data || [] }))
      }
    } catch {
      console.error('Failed to load categories:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/answers/analytics')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setState(prev => ({ ...prev, analytics: data.data }))
        }
      }
    } catch {
      console.error('Failed to load analytics:', error)
    }
  }

  const handleSearch = (query: string) => {
    setState(prev => ({
      ...prev,
      searchParams: { ...prev.searchParams, query, page: 1 }
    }))
  }

  const handleAnswerSelect = (answerId: string, selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedAnswers: selected 
        ? [...prev.selectedAnswers, answerId]
        : prev.selectedAnswers.filter(id => id !== answerId)
    }))
  }

  const handleBulkDelete = async () => {
    if (state.selectedAnswers.length === 0) return
    
    if (!confirm(`Delete ${state.selectedAnswers.length} selected answers?`)) return

    try {
      await Promise.all(
        state.selectedAnswers.map(id => 
          fetch(`/api/answers/${id}`, { method: 'DELETE' })
        )
      )
      
      setState(prev => ({ ...prev, selectedAnswers: [] }))
      loadAnswers()
    } catch {
      console.error('Failed to delete answers:', error)
    }
  }

  const handleEditAnswer = (answer: AnswerBankWithStats) => {
    // TODO: Open edit form
    console.log('Edit answer:', answer)
  }

  const getCategoryById = (categoryId: string) => {
    return state.categories.find(cat => cat.id === categoryId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const tabs = [
    { id: 'library' as const, label: 'Answer Library', icon: FileText, count: state.totalCount },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3, count: null },
    { id: 'categories' as const, label: 'Categories', icon: Tag, count: state.categories.length }
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
                <Archive className="h-8 w-8 text-brand-primary mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Answer Bank Management
                  </h1>
                  <p className="text-gray-600 mt-1" style={{ fontFamily: 'var(--font-open-sans)' }}>
                    Organize and manage your reusable content library
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                  variant="outline"
                  className={state.showFilters ? 'bg-brand-primary text-white' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                
                <div className="flex items-center border rounded-lg">
                  <Button
                    onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
                    variant={state.viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
                    variant={state.viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={() => console.log('Create new answer')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Answer
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search answers..."
                  value={state.searchParams.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
              
              {state.selectedAnswers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {state.selectedAnswers.length} selected
                  </span>
                  <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-brand-primary text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <Badge variant="secondary" className={isActive ? 'bg-white/20' : ''}>
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'library' && (
            <AnswerLibraryView 
              answers={state.answers}
              viewMode={state.viewMode}
              selectedAnswers={state.selectedAnswers}
              isLoading={state.isLoading}
              onAnswerSelect={handleAnswerSelect}
              onEditAnswer={handleEditAnswer}
              getCategoryById={getCategoryById}
              formatDate={formatDate}
            />
          )}
          
          {activeTab === 'analytics' && (
            <AnalyticsView analytics={state.analytics} />
          )}
          
          {activeTab === 'categories' && (
            <CategoriesView 
              categories={state.categories}
              onCategoriesChange={loadCategories}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Answer Library View Component
interface AnswerLibraryViewProps {
  answers: AnswerBankWithStats[]
  viewMode: 'grid' | 'list'
  selectedAnswers: string[]
  isLoading: boolean
  onAnswerSelect: (id: string, selected: boolean) => void
  onEditAnswer: (answer: AnswerBankWithStats) => void
  getCategoryById: (id: string) => AnswerBankCategory | undefined
  formatDate: (date: string) => string
}

function AnswerLibraryView({ 
  answers, 
  viewMode, 
  selectedAnswers, 
  isLoading,
  onAnswerSelect,
  onEditAnswer,
  getCategoryById,
  formatDate
}: AnswerLibraryViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  if (answers.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No answers found</h3>
        <p className="text-gray-600">Create your first answer to get started.</p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {answers.map((answer) => (
          <AnswerGridCard
            key={answer.id}
            answer={answer}
            isSelected={selectedAnswers.includes(answer.id)}
            onSelect={onAnswerSelect}
            onEdit={onEditAnswer}
            getCategoryById={getCategoryById}
            formatDate={formatDate}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {answers.map((answer) => (
        <AnswerListCard
          key={answer.id}
          answer={answer}
          isSelected={selectedAnswers.includes(answer.id)}
          onSelect={onAnswerSelect}
          onEdit={onEditAnswer}
          getCategoryById={getCategoryById}
          formatDate={formatDate}
        />
      ))}
    </div>
  )
}

// Answer Card Components
interface AnswerCardProps {
  answer: AnswerBankWithStats
  isSelected: boolean
  onSelect: (id: string, selected: boolean) => void
  onEdit: (answer: AnswerBankWithStats) => void
  getCategoryById: (id: string) => AnswerBankCategory | undefined
  formatDate: (date: string) => string
}

function AnswerGridCard({ answer, isSelected, onSelect, onEdit, getCategoryById, formatDate }: AnswerCardProps) {
  const category = answer.category_id ? getCategoryById(answer.category_id) : null

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-brand-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(answer.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 text-brand-primary rounded"
              />
              {answer.is_template && (
                <Badge variant="secondary">Template</Badge>
              )}
              {category && (
                <Badge style={{ backgroundColor: category.color + '20', color: category.color }}>
                  {category.name}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 line-clamp-2">{answer.title}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(answer)}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {answer.content.substring(0, 150)}...
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {answer.usage_count}
            </div>
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-1" />
              {answer.avg_rating.toFixed(1)}
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDate(answer.updated_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AnswerListCard({ answer, isSelected, onSelect, onEdit, getCategoryById, formatDate }: AnswerCardProps) {
  const category = answer.category_id ? getCategoryById(answer.category_id) : null

  return (
    <Card className={`transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-brand-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(answer.id, e.target.checked)}
            className="h-4 w-4 text-brand-primary rounded"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{answer.title}</h3>
              {answer.is_template && (
                <Badge variant="secondary" className="text-xs">Template</Badge>
              )}
              {category && (
                <Badge 
                  style={{ backgroundColor: category.color + '20', color: category.color }}
                  className="text-xs"
                >
                  {category.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{answer.content}</p>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {answer.usage_count}
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1" />
              {answer.avg_rating.toFixed(1)}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDate(answer.updated_at)}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={() => onEdit(answer)}>
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Analytics View Component
interface AnalyticsViewProps {
  analytics: AnswerBankAnalytics | null
}

function AnalyticsView({ analytics }: AnalyticsViewProps) {
  if (!analytics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Loading</h3>
              <p className="text-gray-600">Analytics data will appear here once available.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-brand-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Answers</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_answers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-brand-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_usage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-brand-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.avg_rating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-brand-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.most_used_categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Detailed analytics charts and insights will be implemented here.</p>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Most Used Categories</h4>
              <div className="space-y-2">
                {analytics.most_used_categories.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.category.name}</span>
                    <span className="text-sm font-medium">{item.usage_count} uses</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Categories View Component
interface CategoriesViewProps {
  categories: AnswerBankCategory[]
  onCategoriesChange: () => void
}

function CategoriesView({ categories }: CategoriesViewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Category Management</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories</h3>
              <p className="text-gray-600">Create your first category to organize answers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <span className="font-medium text-gray-900">{category.name}</span>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{category.sort_order}</Badge>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 