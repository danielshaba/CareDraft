'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Edit3,
  Check,
  X,
  Copy,
  FileText,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getExtractionCategory } from '@/lib/extraction-categories'
import { useDraftStore } from '@/lib/stores/draft-store'
import { toast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

interface ExtractionResult {
  id: string | number
  content: string
  confidence?: number
  sourceText?: string
  category: string
  [key: string]: unknown
}

interface ExtractionResultsPanelProps {
  results: Record<string, ExtractionResult[]>
  selectedDocumentName?: string
  className?: string
}

interface EditingState {
  [key: string]: {
    isEditing: boolean
    editedContent: string
  }
}

export function ExtractionResultsPanel({ results, selectedDocumentName = 'Unknown Document', className }: ExtractionResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('')
  const [editingState, setEditingState] = useState<EditingState>({})
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const { addToDraft } = useDraftStore()
  const { user } = useAuth()

  // Filter categories that have results and set initial active tab
  const categoriesWithResults = Object.entries(results).filter(([_, items]) => items.length > 0)
  
  // Set initial active tab if not set
  if (!activeTab && categoriesWithResults.length > 0) {
    setActiveTab(categoriesWithResults[0][0])
  }

  if (categoriesWithResults.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-gray-500">
          <p className="text-sm">No extraction results yet.</p>
          <p className="text-xs text-gray-400 mt-1">Upload a document to get started.</p>
        </div>
      </Card>
    )
  }

  const getConfidenceIcon = (confidence?: number) => {
    if (!confidence) return <AlertCircle className="h-3 w-3" />
    if (confidence >= 0.8) return <CheckCircle2 className="h-3 w-3" />
    if (confidence >= 0.6) return <AlertCircle className="h-3 w-3" />
    return <XCircle className="h-3 w-3" />
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-500'
  }

  const renderConfidenceScore = (confidence?: number) => {
    if (!confidence) return null
    
    return (
      <div className={cn('flex items-center gap-1 text-xs', getConfidenceColor(confidence))}>
        {getConfidenceIcon(confidence)}
        <span>{Math.round(confidence * 100)}%</span>
      </div>
    )
  }

  const handleEdit = (itemId: string, currentContent: string) => {
    setEditingState(prev => ({
      ...prev,
      [itemId]: {
        isEditing: true,
        editedContent: currentContent
      }
    }))
  }

  const handleSaveEdit = (itemId: string) => {
    const editState = editingState[itemId]
    if (!editState) return

    // Here you could save the edited content to your backend
    console.log('Saving edited content:', editState.editedContent)
    
    setEditingState(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isEditing: false
      }
    }))
    
    toast.success('Content updated', 'Your changes have been saved.')
  }

  const handleCancelEdit = (itemId: string) => {
    setEditingState(prev => {
      const newState = { ...prev }
      delete newState[itemId]
      return newState
    })
  }

  const handleContentChange = (itemId: string, newContent: string) => {
    setEditingState(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        editedContent: newContent
      }
    }))
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard', 'Content has been copied to your clipboard.')
    } catch (error) {
      console.error('Failed to copy content:', error)
      toast.error('Copy failed', 'Unable to copy content to clipboard.')
    }
  }

  const handleCopyToDraft = (item: ExtractionResult) => {
    try {
      const category = getExtractionCategory(item.category)
      const content = editingState[`${item.category}-${item.id}`]?.editedContent || item.content
      
      const draftItem = addToDraft(
        content,
        item.category,
        category?.label || 'Unknown Category'
      )
      
      toast.success(
        'Added to draft',
        `Content added to your draft. Total items: ${draftItem ? '1' : '0'}`
      )
    } catch (error) {
      console.error('Failed to add to draft:', error)
      toast.error('Failed to add to draft', 'Unable to add content to your draft.')
    }
  }

  const handleSaveToBank = (item: ExtractionResult) => {
    try {
      // Here you would save to content bank
      // For now, we'll just show a success message
      const bankItem = {
        content: item.content,
        category: item.category,
        source: selectedDocumentName,
        confidence: item.confidence,
        createdAt: new Date().toISOString()
      }
      
      console.log('Saved to content bank:', bankItem)
    } catch (error) {
      console.error('Failed to save to content bank:', error)
      toast.error('Failed to save to bank', 'Unable to save content to your content bank.')
    }
  }

  const renderResultItem = (item: ExtractionResult) => {
    const itemId = `${item.category}-${item.id}`
    const isEditing = editingState[itemId]?.isEditing || false
    const editedContent = editingState[itemId]?.editedContent || ''
    const isExpanded = expandedItems.has(itemId)
    const displayContent = isEditing ? editedContent : item.content

    return (
      <div key={item.id} className="border rounded-lg p-4 space-y-3 bg-white hover:shadow-sm transition-shadow overflow-hidden max-w-full">
        {/* Header with confidence score */}
        <div className="flex items-start justify-between gap-3 overflow-hidden">
          <div className="flex-1 min-w-0 max-w-full overflow-hidden">
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => handleContentChange(itemId, e.target.value)}
                className="w-full p-2 border rounded-md text-sm resize-none min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 force-text-wrap"
                placeholder="Edit the extracted content..."
                autoFocus
              />
            ) : (
              <div className="max-w-full overflow-hidden">
                <p className="text-sm text-gray-800 leading-relaxed force-text-wrap">
                  {item.content}
                </p>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            {renderConfidenceScore(item.confidence)}
          </div>
        </div>

        {/* Source text section (expandable) */}
        {item.sourceText && (
          <div className="border-t pt-3">
            <button
              onClick={() => toggleExpanded(itemId)}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 transition-colors overflow-hidden max-w-full"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 flex-shrink-0" />}
              <span className="truncate max-w-full overflow-hidden force-text-wrap">
                Source: {item.sourceText}
              </span>
            </button>
            
            {isExpanded && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 border overflow-hidden">
                <p className="font-medium mb-1">Source Reference:</p>
                <p className="force-text-wrap">
                  {item.sourceText}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={() => handleSaveEdit(itemId)}
                  className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelEdit(itemId)}
                  className="h-7 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(itemId, item.content)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(item.content)}
                  className="h-7 px-2 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleCopyToDraft(item)}
              className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-3 w-3 mr-1" />
              Copy to Draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSaveToBank(item)}
              className="h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50"
            >
              <Database className="h-3 w-3 mr-1" />
              Save to Bank
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('mt-6 border-t pt-6', className)}>
      <h3 className="text-sm font-medium text-gray-900 mb-4">
        Extraction Results
      </h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-auto p-1 bg-gray-100">
          {categoriesWithResults.map(([categoryId, items]) => {
            const category = getExtractionCategory(categoryId)
            if (!category) return null
            
            const Icon = category.icon
            
            return (
              <TabsTrigger 
                key={categoryId} 
                value={categoryId}
                className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <Icon className={cn('h-4 w-4', category.color.icon)} />
                <span className="text-xs font-medium truncate">
                  {category.label}
                </span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {items.length}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categoriesWithResults.map(([categoryId, items]) => {
          const category = getExtractionCategory(categoryId)
          if (!category) return null

          return (
            <TabsContent key={categoryId} value={categoryId} className="mt-4">
              <div className="space-y-4 overflow-hidden">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <category.icon className={cn('h-4 w-4', category.color.icon)} />
                  <span>{category.description}</span>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 overflow-x-hidden">
                  {items.map(renderResultItem)}
                </div>
                
                {items.length > 0 && (
                  <div className="text-xs text-gray-500 text-center pt-3 border-t bg-gray-50 rounded-lg p-2">
                    <p>Showing {items.length} extracted {items.length === 1 ? 'item' : 'items'}</p>
                    <p className="mt-1">Click "Copy to Draft" to add to your tender response or "Save to Bank" for reuse</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
} 