'use client'

import React, { useState } from 'react'
import { X, Save, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { useResearchSessionStore } from '@/lib/stores/researchSessionStore'

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    title?: string
    query?: string
    results?: unknown[]
  }
}

export function CreateSessionModal({
  isOpen,
  onClose,
  initialData
}: CreateSessionModalProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    query: initialData?.query || '',
    description: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { createSession, isLoading } = useResearchSessionStore()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters'
    }
    
    if (!formData.query.trim()) {
      newErrors.query = 'Query is required'
    } else if (formData.query.length > 2000) {
      newErrors.query = 'Query must be less than 2000 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const sessionData = {
        title: formData.title.trim(),
        query: formData.query.trim(),
        results: initialData?.results || [],
        session_metadata: {
          description: formData.description.trim(),
          created_from: 'manual',
          initial_query: formData.query.trim()
        }
      }

      await createSession(sessionData)
      
      // Reset form and close modal
      setFormData({ title: '', query: '', description: '' })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ title: '', query: '', description: '' })
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Research Session
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Session Title *
              </label>
              <Input
                placeholder="Enter a descriptive title for your research session"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={errors.title ? 'border-destructive' : ''}
                disabled={isLoading}
                maxLength={200}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Query Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Research Query *
              </label>
              <textarea
                placeholder="Enter your research question or search query..."
                value={formData.query}
                onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
                className={`w-full min-h-[120px] p-3 border rounded-md resize-y ${
                  errors.query ? 'border-destructive' : 'border-input'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
                maxLength={2000}
              />
              {errors.query && (
                <p className="text-sm text-destructive mt-1">{errors.query}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formData.query.length}/2000 characters
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                placeholder="Add any additional context or notes about this research session..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full min-h-[80px] p-3 border rounded-md resize-y ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'border-input'
                }`}
                disabled={isLoading}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Initial Results Info */}
            {initialData?.results && initialData.results.length > 0 && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-1">Initial Results</p>
                <p className="text-xs text-muted-foreground">
                  This session will be created with {initialData.results.length} existing research results.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Creating..."
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Create Session
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 