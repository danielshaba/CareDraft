'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, User, FileText } from 'lucide-react'
import { SectionStatus } from '@/types/database'

interface AddSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (sectionData: {
    title: string
    description?: string
    wordCountLimit?: number
    status?: SectionStatus
    ownerId?: string
    dueDate?: string
  }) => void
  parentSectionId?: string
  parentSectionTitle?: string
}

export default function AddSectionModal({
  isOpen,
  onClose,
  onSubmit,
  parentSectionId,
  parentSectionTitle
}: AddSectionModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    wordCountLimit: '',
    status: 'not_started' as SectionStatus,
    ownerId: '',
    dueDate: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        wordCountLimit: '',
        status: 'not_started',
        ownerId: '',
        dueDate: ''
      })
      setErrors({})
    }
  }, [isOpen])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Section title is required'
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be 255 characters or less'
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less'
    }

    if (formData.wordCountLimit) {
      const limit = parseInt(formData.wordCountLimit)
      if (isNaN(limit) || limit < 0) {
        newErrors.wordCountLimit = 'Word count limit must be a positive number'
      } else if (limit > 10000) {
        newErrors.wordCountLimit = 'Word count limit cannot exceed 10,000'
      }
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const submitData: unknown = {
      title: formData.title.trim(),
      status: formData.status
    }

    if (formData.description.trim()) {
      submitData.description = formData.description.trim()
    }

    if (formData.wordCountLimit) {
      submitData.wordCountLimit = parseInt(formData.wordCountLimit)
    }

    if (formData.ownerId) {
      submitData.ownerId = formData.ownerId
    }

    if (formData.dueDate) {
      submitData.dueDate = formData.dueDate
    }

    onSubmit(submitData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {parentSectionId ? 'Add Subsection' : 'Add Section'}
              </h3>
              {parentSectionTitle && (
                <p className="text-sm text-gray-500 mt-1">
                  Under: {parentSectionTitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary
                  ${errors.title ? 'border-red-300' : 'border-gray-300'}
                `}
                placeholder="Enter section title"
                maxLength={255}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none
                  ${errors.description ? 'border-red-300' : 'border-gray-300'}
                `}
                placeholder="Optional description"
                rows={3}
                maxLength={1000}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Word Count Limit */}
            <div>
              <label htmlFor="wordCountLimit" className="block text-sm font-medium text-gray-700 mb-1">
                Word Count Limit
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="wordCountLimit"
                  type="number"
                  value={formData.wordCountLimit}
                  onChange={(e) => handleInputChange('wordCountLimit', e.target.value)}
                  className={`
                    w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary
                    ${errors.wordCountLimit ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="0 (no limit)"
                  min="0"
                  max="10000"
                />
              </div>
              {errors.wordCountLimit && (
                <p className="text-sm text-red-600 mt-1">{errors.wordCountLimit}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className={`
                    w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary
                    ${errors.dueDate ? 'border-red-300' : 'border-gray-300'}
                  `}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.dueDate && (
                <p className="text-sm text-red-600 mt-1">{errors.dueDate}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-dark transition-colors"
              >
                {parentSectionId ? 'Add Subsection' : 'Add Section'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 