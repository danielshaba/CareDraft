'use client'

import React from 'react'
import { FileText, Clock, Target, TrendingUp } from 'lucide-react'

interface TenderContext {
  tenderName?: string
  tenderReference?: string
  issuingAuthority?: string
  submissionDeadline?: Date
  currentSection?: string
  wordLimit?: number
  currentWordCount?: number
  progress?: number
}

interface ContextPanelProps {
  context: TenderContext
}

export function ContextPanel({ context }: ContextPanelProps) {
  const progressPercentage = context.progress || 0
  const wordCountPercentage = context.wordLimit 
    ? Math.min((context.currentWordCount || 0) / context.wordLimit * 100, 100)
    : 0

  const formatDeadline = (deadline?: Date) => {
    if (!deadline) return 'Not set'
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `${diffDays} days remaining`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <FileText className="h-5 w-5 text-brand-primary mr-2" />
        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
          Tender Context
        </h3>
      </div>

      <div className="space-y-4">
        {/* Tender Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'var(--font-open-sans)' }}>
            Current Tender
          </h4>
          <div className="bg-gray-50 rounded-md p-3">
            <p className="font-medium text-gray-900 text-sm mb-1">
              {context.tenderName || 'No tender selected'}
            </p>
            {context.tenderReference && (
              <p className="text-xs text-gray-600 mb-1">
                Ref: {context.tenderReference}
              </p>
            )}
            {context.issuingAuthority && (
              <p className="text-xs text-gray-600">
                {context.issuingAuthority}
              </p>
            )}
          </div>
        </div>

        {/* Deadline Information */}
        {context.submissionDeadline && (
          <div>
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-gray-500 mr-1" />
              <h4 className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-open-sans)' }}>
                Deadline
              </h4>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-900">
                {context.submissionDeadline.toLocaleDateString('en-GB')}
              </p>
              <p className={`text-xs ${
                context.submissionDeadline.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                  ? 'text-red-600' 
                  : 'text-gray-600'
              }`}>
                {formatDeadline(context.submissionDeadline)}
              </p>
            </div>
          </div>
        )}

        {/* Current Section */}
        {context.currentSection && (
          <div>
            <div className="flex items-center mb-2">
              <Target className="h-4 w-4 text-gray-500 mr-1" />
              <h4 className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-open-sans)' }}>
                Current Section
              </h4>
            </div>
            <div className="bg-brand-primary-light rounded-md p-3 border border-brand-primary">
              <p className="text-sm font-medium text-brand-primary-dark">
                {context.currentSection}
              </p>
            </div>
          </div>
        )}

        {/* Word Count Progress */}
        {context.wordLimit && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-gray-500 mr-1" />
                <h4 className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-open-sans)' }}>
                  Word Count
                </h4>
              </div>
              <span className="text-xs text-gray-600">
                {context.currentWordCount || 0} / {context.wordLimit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  wordCountPercentage > 100 
                    ? 'bg-red-500' 
                    : wordCountPercentage > 80 
                    ? 'bg-yellow-500' 
                    : 'bg-brand-primary-light0'
                }`}
                style={{ width: `${Math.min(wordCountPercentage, 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${
              wordCountPercentage > 100 
                ? 'text-red-600' 
                : wordCountPercentage > 80 
                ? 'text-yellow-600' 
                : 'text-gray-600'
            }`}>
              {wordCountPercentage > 100 
                ? 'Exceeds word limit' 
                : wordCountPercentage > 80 
                ? 'Approaching limit' 
                : 'Within limit'
              }
            </p>
          </div>
        )}

        {/* Overall Progress */}
        {typeof context.progress === 'number' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-open-sans)' }}>
                Overall Progress
              </h4>
              <span className="text-xs text-gray-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 