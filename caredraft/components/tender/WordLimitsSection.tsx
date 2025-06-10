'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/form-input'
import { WordLimitSection } from '@/types/tender'

interface WordLimitsSectionProps {
  wordLimits: WordLimitSection[]
  onChange: (wordLimits: WordLimitSection[]) => void
  errors?: Record<string, string>
}

export function WordLimitsSection({ 
  wordLimits, 
  onChange, 
  errors = {} 
}: WordLimitsSectionProps) {
  
  // Generate unique ID for new sections
  const generateId = () => `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add new word limit section
  const addSection = () => {
    const newSection: WordLimitSection = {
      id: generateId(),
      sectionName: '',
      wordLimit: 500,
      description: '',
    }
    onChange([...wordLimits, newSection])
  }

  // Remove section by index
  const removeSection = (index: number) => {
    const updatedSections = wordLimits.filter((_, i) => i !== index)
    onChange(updatedSections)
  }

  // Update individual section
  const updateSection = (index: number, field: keyof WordLimitSection, value: string | number) => {
    const updatedSections = wordLimits.map((section, i) => {
      if (i === index) {
        return { ...section, [field]: value }
      }
      return section
    })
    onChange(updatedSections)
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
            Word Limits Configuration
          </h3>
          <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-open-sans)' }}>
            Configure word limits for different sections of your proposal
          </p>
        </div>
        
        {/* Add Section Button */}
        <button
          type="button"
          onClick={addSection}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </button>
      </div>

      {/* Word Limit Sections */}
      {wordLimits.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
            No word limit sections configured yet.
          </p>
          <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: 'var(--font-open-sans)' }}>
            Click "Add Section" to create your first word limit configuration.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {wordLimits.map((section, index) => (
            <div
              key={section.id}
              className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
            >
              {/* Section Header with Remove Button */}
              <div className="flex items-center justify-between">
                <h4 
                  className="text-md font-medium text-gray-800" 
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  Section {index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Remove section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Section Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section Name */}
                <Input
                  label="Section Name"
                  required
                  placeholder="e.g., Executive Summary, Service Delivery"
                  value={section.sectionName}
                  onChange={(e) => updateSection(index, 'sectionName', e.target.value)}
                  error={errors[`wordLimits.${index}.sectionName`]}
                />

                {/* Word Limit */}
                <Input
                  label="Word Limit"
                  type="number"
                  required
                  min={1}
                  max={10000}
                  placeholder="500"
                  value={section.wordLimit}
                  onChange={(e) => updateSection(index, 'wordLimit', parseInt(e.target.value) || 0)}
                  error={errors[`wordLimits.${index}.wordLimit`]}
                />
              </div>

              {/* Description */}
              <Textarea
                label="Description (Optional)"
                placeholder="Describe what should be included in this section..."
                rows={3}
                value={section.description || ''}
                onChange={(e) => updateSection(index, 'description', e.target.value)}
                error={errors[`wordLimits.${index}.description`]}
              />
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      {wordLimits.length > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-md p-3">
          <p className="text-sm text-brand-800" style={{ fontFamily: 'var(--font-open-sans)' }}>
            <strong>Tip:</strong> These word limits will be used when generating your proposal to ensure 
            each section meets the tender requirements. You can add as many sections as needed.
          </p>
        </div>
      )}
    </div>
  )
} 