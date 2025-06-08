'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Folder, 
  FolderOpen,
  Save,
//  X,
  ChevronRight,
  ChevronDown,
  BarChart3,
//  Settings,
//  Copy,
//  Move,
//  Palette,
//  CheckCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  name: string
  description?: string
  color: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  answer_count: number
  created_at: string
  updated_at: string
  children?: Category[]
}

interface CategoryStats {
  total_categories: number
  total_answers: number
  most_used_category: {
    id: string
    name: string
    answer_count: number
  }
  recent_activity: {
    date: string
    category_name: string
    action: 'created' | 'updated' | 'deleted'
  }[]
}

interface CategoryManagerProps {
  className?: string
  onCategorySelect?: (categoryId: string) => void
  selectedCategoryId?: string
  mode?: 'management' | 'selection'
}

const PRESET_COLORS = [
  'blue-500',    // Blue
  'red-500',     // Red  
  'emerald-500', // Green
  'purple-500',  // Purple
  'amber-500',   // Yellow
  'cyan-500',    // Cyan
  'pink-500',    // Pink
  'lime-500',    // Lime
  'orange-500',  // Orange
  'gray-500'     // Gray
]

export default function CategoryManager({ 
  className = "", 
  onCategorySelect,
  selectedCategoryId,
  mode = 'management'
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<CategoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: PRESET_COLORS[0],
    parent_id: '',
    sort_order: 0
  })

  useEffect(() => {
    loadCategories()
    if (mode === 'management') {
      loadStats()
    }
  }, [mode])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/answers/categories?include_hierarchy=true')
      const result = await response.json()
      
      if (result.success) {
        setCategories(buildCategoryTree(result.data || []))
      }
    } catch {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/answers/categories/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch {
      console.error('Error loading stats:', error)
    }
  }

  const buildCategoryTree = (flatCategories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []

    // First pass: create map of all categories
    flatCategories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // Second pass: build tree structure
    flatCategories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!
      
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id)!
        parent.children!.push(categoryNode)
      } else {
        rootCategories.push(categoryNode)
      }
    })

    // Sort categories by sort_order
    const sortCategories = (cats: Category[]) => {
      cats.sort((a, b) => a.sort_order - b.sort_order)
      cats.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          sortCategories(cat.children)
        }
      })
    }

    sortCategories(rootCategories)
    return rootCategories
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: PRESET_COLORS[0],
      parent_id: '',
      sort_order: 0
    })
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/answers/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parent_id: formData.parent_id || null
        })
      })

      const result = await response.json()
      
      if (result.success) {
        loadCategories()
        setShowCreateForm(false)
        resetForm()
      }
    } catch {
      console.error('Error creating category:', error)
    }
  }

  const handleUpdateCategory = async (categoryId: string, updates: Partial<Category>) => {
    try {
      const response = await fetch(`/api/answers/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const result = await response.json()
      
      if (result.success) {
        loadCategories()
        setEditingCategory(null)
      }
    } catch {
      console.error('Error updating category:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/answers/categories/${categoryId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        loadCategories()
      }
    } catch {
      console.error('Error deleting category:', error)
    }
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className="select-none">
        {/* Category Item */}
        <div 
          className={`flex items-center space-x-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
            selectedCategoryId === category.id 
              ? 'bg-brand-primary bg-opacity-10 border-brand-primary' 
              : 'hover:bg-gray-50'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => {
            if (mode === 'selection' && onCategorySelect) {
              onCategorySelect(category.id)
            }
          }}
          draggable={mode === 'management'}
          onDragStart={() => setDraggedCategory(category.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (draggedCategory && draggedCategory !== category.id) {
              handleUpdateCategory(draggedCategory, { parent_id: category.id })
              setDraggedCategory(null)
            }
          }}
        >
          {/* Expand/Collapse */}
          {category.children && category.children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleCategoryExpansion(category.id)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedCategories.has(category.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Folder Icon */}
          <div 
            className="w-4 h-4 rounded-sm flex-shrink-0"
            style={{ backgroundColor: category.color }}
          >
            {category.children && category.children.length > 0 ? (
              expandedCategories.has(category.id) ? (
                <FolderOpen className="h-4 w-4 text-white" />
              ) : (
                <Folder className="h-4 w-4 text-white" />
              )
            ) : (
              <Folder className="h-4 w-4 text-white" />
            )}
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            {editingCategory === category.id ? (
              <input
                type="text"
                defaultValue={category.name}
                className="text-sm font-medium bg-transparent border-none outline-none"
                onBlur={(e) => {
                  handleUpdateCategory(category.id, { name: e.target.value })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateCategory(category.id, { name: e.currentTarget.value })
                  } else if (e.key === 'Escape') {
                    setEditingCategory(null)
                  }
                }}
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium text-gray-900 truncate">
                {category.name}
              </span>
            )}
          </div>

          {/* Answer Count Badge */}
          <Badge variant="secondary" className="text-xs">
            {category.answer_count}
          </Badge>

          {/* Actions */}
          {mode === 'management' && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingCategory(category.id)
                }}
                className="text-gray-400 hover:text-blue-600 p-1"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteCategory(category.id)
                }}
                className="text-gray-400 hover:text-red-600 p-1"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {category.children && 
         category.children.length > 0 && 
         expandedCategories.has(category.id) && 
         renderCategoryTree(category.children, level + 1)
        }
      </div>
    ))
  }

  const renderStatsPanel = () => {
    if (!stats || mode !== 'management') return null

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Category Statistics
        </h4>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-brand-primary">{stats.total_categories}</div>
            <div className="text-xs text-gray-600">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_answers}</div>
            <div className="text-xs text-gray-600">Total Answers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.most_used_category.answer_count}</div>
            <div className="text-xs text-gray-600">Most Used</div>
          </div>
        </div>
        
        {stats.most_used_category.name && (
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-500">
              Most popular: <strong>{stats.most_used_category.name}</strong>
            </span>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Stats Panel */}
      {renderStatsPanel()}

      {/* Create Category Form */}
      {showCreateForm && mode === 'management' && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Create New Category</h4>
          
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Category name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                required
              />
            </div>
            
            <div>
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs font-medium text-gray-700">Color:</span>
              <div className="flex space-x-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-6 h-6 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary-dark text-white"
              >
                <Save className="h-3 w-3 mr-1" />
                Create
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {mode === 'selection' ? 'Select Category' : 'Categories'}
          </h3>
          
          {mode === 'management' && (
            <Button
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-brand-primary hover:bg-brand-primary-dark text-white"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Category Tree */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No categories found</p>
              {mode === 'management' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-brand-primary hover:text-red-600 text-sm mt-1"
                >
                  Create your first category
                </button>
              )}
            </div>
          ) : (
            renderCategoryTree(categories)
          )}
        </div>
      </div>
    </div>
  )
} 