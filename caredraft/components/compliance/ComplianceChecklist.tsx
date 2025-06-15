'use client'

import React, { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, Trash2, RefreshCw, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingButton } from '@/components/ui/loading-button'
import { useToast } from '@/components/ui/toast'

import { complianceExtractionService } from '@/lib/services/compliance-extraction'
import { ComplianceItem } from '@/lib/database.types'

interface ComplianceChecklistProps {
  proposalId: string
  extractedText?: string
  sourceDocumentId?: string
  onStatsUpdate?: (stats: {
    total: number
    completed: number
    completionPercentage: number
  }) => void
  className?: string
}

interface ComplianceStats {
  total: number
  completed: number
  completionPercentage: number
}

export function ComplianceChecklist({
  proposalId,
  extractedText,
  sourceDocumentId,
  onStatsUpdate,
  className = ''
}: ComplianceChecklistProps) {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [newRequirement, setNewRequirement] = useState('')
  const [isAddingManual, setIsAddingManual] = useState(false)
  const [hasAutoItems, setHasAutoItems] = useState(false)

  const toast = useToast()

  // Load existing compliance items
  const loadItems = async () => {
    setIsLoading(true)
    try {
      const result = await complianceExtractionService.getComplianceItems(proposalId)
      setItems(result)
      
      const hasAuto = result.some(item => item.source_type === 'auto')
      setHasAutoItems(hasAuto)
      
      // Update statistics
      if (onStatsUpdate) {
        const stats: ComplianceStats = {
          total: result.length,
          completed: result.filter(item => item.completed).length,
          completionPercentage: result.length > 0 ? Math.round((result.filter(item => item.completed).length / result.length) * 100) : 0
        }
        onStatsUpdate(stats)
      }
    } catch (error) {
      toast.error('Failed to load compliance items', String(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Extract compliance from text
  const handleExtractFromText = async () => {
    if (!extractedText) {
      toast.error('No text available', 'Please provide extracted text to analyze')
      return
    }

    setIsExtracting(true)
    try {
             const result = await complianceExtractionService.extractAndPopulateCompliance(
         proposalId,
         extractedText,
         undefined,
         sourceDocumentId,
         true // replace existing auto items
       )
       
       toast.success(
         'Compliance items extracted',
         `Successfully extracted ${result.itemsCreated} compliance requirements`
       )
      
      await loadItems() // Reload to get fresh data
    } catch (error) {
      toast.error('Failed to extract compliance items', String(error))
    } finally {
      setIsExtracting(false)
    }
  }

  // Add manual requirement
  const handleAddManual = async () => {
    if (!newRequirement.trim()) return

    setIsLoading(true)
    try {
      await complianceExtractionService.addManualItem(
        proposalId,
        newRequirement.trim()
      )
      
      setNewRequirement('')
      setIsAddingManual(false)
      await loadItems()
      
      toast.success('Requirement added', 'Manual compliance requirement has been added')
    } catch (error) {
      toast.error('Failed to add requirement', String(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle completion status
  const handleToggleCompletion = async (item: ComplianceItem) => {
    setIsLoading(true)
    try {
      await complianceExtractionService.updateComplianceItem(item.id, {
        completed: !item.completed
      })
      
      await loadItems()
      
      const status = !item.completed ? 'completed' : 'pending'
      toast.success('Status updated', `Requirement marked as ${status}`)
    } catch (error) {
      toast.error('Failed to update status', String(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Delete item
  const handleDeleteItem = async (item: ComplianceItem) => {
    setIsLoading(true)
    try {
      await complianceExtractionService.deleteComplianceItem(item.id)
      await loadItems()
      
      toast.success('Requirement removed', 'Compliance requirement has been deleted')
    } catch (error) {
      toast.error('Failed to delete requirement', String(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Load items on mount
  useEffect(() => {
    loadItems()
  }, [proposalId])

  if (isLoading && items.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading compliance checklist...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Compliance Checklist</h3>
            <p className="text-sm text-gray-600">
              Track compliance requirements for this proposal
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {extractedText && (
              <LoadingButton
                onClick={handleExtractFromText}
                isLoading={isExtracting}
                loadingText="Extracting..."
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                {hasAutoItems ? 'Re-extract' : 'Extract Requirements'}
              </LoadingButton>
            )}
            
            <Button
              onClick={() => setIsAddingManual(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Manual
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {items.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">{items.filter(item => item.completed).length}</span>
              <span className="text-gray-600"> of </span>
              <span className="font-medium">{items.length}</span>
              <span className="text-gray-600"> completed</span>
            </div>
            <div className="text-sm text-gray-600">
              ({Math.round((items.filter(item => item.completed).length / items.length) * 100)}%)
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {items.filter(item => item.source_type === 'auto').length} auto
              </Badge>
              <Badge variant="outline">
                {items.filter(item => item.source_type === 'manual').length} manual
              </Badge>
            </div>
          </div>
        )}

        {/* Add manual requirement form */}
        {isAddingManual && (
          <Card className="p-4 border-dashed">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Compliance Requirement
                </label>
                <textarea
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Enter a compliance requirement..."
                  className="w-full p-3 border rounded-md resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <LoadingButton
                  onClick={handleAddManual}
                  isLoading={isLoading}
                  disabled={!newRequirement.trim()}
                  size="sm"
                >
                  Add Requirement
                </LoadingButton>
                <Button
                  onClick={() => {
                    setIsAddingManual(false)
                    setNewRequirement('')
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Compliance Items List */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No compliance requirements yet
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {extractedText 
                  ? 'Extract requirements from your document or add them manually'
                  : 'Add compliance requirements manually'
                }
              </p>
              <div className="flex items-center justify-center gap-2">
                {extractedText && (
                  <LoadingButton
                    onClick={handleExtractFromText}
                    isLoading={isExtracting}
                    variant="outline"
                    size="sm"
                  >
                    Extract from Document
                  </LoadingButton>
                )}
                <Button
                  onClick={() => setIsAddingManual(true)}
                  size="sm"
                >
                  Add Manual Requirement
                </Button>
              </div>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleCompletion(item)}
                    className="mt-1 flex-shrink-0"
                    disabled={isLoading}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {item.requirement}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant={item.source_type === 'auto' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {item.source_type === 'auto' ? 'AI Extracted' : 'Manual'}
                      </Badge>
                      
                      {item.confidence_score && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(item.confidence_score * 100)}% confidence
                        </Badge>
                      )}
                      
                      {item.source_page && (
                        <Badge variant="outline" className="text-xs">
                          Page {item.source_page}
                        </Badge>
                      )}
                    </div>
                    
                    {item.notes && (
                      <p className="text-xs text-gray-600 mt-2">
                        <strong>Notes:</strong> {item.notes}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="flex-shrink-0 text-red-600 hover:text-red-700 p-1"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}

export default ComplianceChecklist 