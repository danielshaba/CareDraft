'use client'

import React, { useState } from 'react'
import { Save, Clock, AlertCircle, CheckCircle, History, GitBranch } from 'lucide-react'
import { Version } from '@/types/collaboration'
import { formatRelativeTime } from '@/types/collaboration'
import VersionHistory from './VersionHistory'
import DiffViewer from './DiffViewer'

interface VersionControlPanelProps {
  sectionId: string
  currentContent: string
  isSaving?: boolean
  lastSaved?: Date | null
  saveError?: string | null
  hasUnsavedChanges?: boolean
  onSaveNow?: () => Promise<void>
  onRestoreVersion?: (version: Version) => void
  className?: string
}

export default function VersionControlPanel({
  sectionId,
  currentContent,
  isSaving = false,
  lastSaved,
  saveError,
  hasUnsavedChanges = false,
  onSaveNow,
  onRestoreVersion,
  className = ''
}: VersionControlPanelProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [diffVersion1, setDiffVersion1] = useState<Version | null>(null)
  const [diffVersion2, setDiffVersion2] = useState<Version | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  const handleViewDiff = (version1: Version, version2?: Version) => {
    setDiffVersion1(version1)
    setDiffVersion2(version2 || null)
    setShowDiff(true)
  }

  const handleCloseDiff = () => {
    setShowDiff(false)
    setDiffVersion1(null)
    setDiffVersion2(null)
  }

  const handleRestoreVersion = (version: Version) => {
    onRestoreVersion?.(version)
    setShowHistory(false)
  }

  const getSaveStatusIcon = () => {
    if (isSaving) {
      return <Clock className="h-4 w-4 text-brand-500 animate-spin" />
    } else if (saveError) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    } else if (hasUnsavedChanges) {
      return <Save className="h-4 w-4 text-orange-500" />
    } else {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getSaveStatusText = () => {
    if (isSaving) {
      return 'Saving...'
    } else if (saveError) {
      return `Save failed: ${saveError}`
    } else if (hasUnsavedChanges) {
      return 'Unsaved changes'
    } else if (lastSaved) {
      return `Saved ${formatRelativeTime(lastSaved.toISOString())}`
    } else {
      return 'No changes'
    }
  }

  const getSaveStatusColor = () => {
    if (isSaving) {
      return 'text-brand-600'
    } else if (saveError) {
      return 'text-red-600'
    } else if (hasUnsavedChanges) {
      return 'text-orange-600'
    } else {
      return 'text-green-600'
    }
  }

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <GitBranch className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Version Control</h3>
          </div>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-brand-primary-dark bg-brand-primary-light border border-brand-primary rounded-md hover:bg-brand-primary-light transition-colors"
          >
            <History className="h-4 w-4 mr-1" />
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>

        {/* Save Status */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getSaveStatusIcon()}
              <span className={`text-sm font-medium ${getSaveStatusColor()}`}>
                {getSaveStatusText()}
              </span>
            </div>
            
            {(hasUnsavedChanges || saveError) && onSaveNow && (
              <button
                onClick={onSaveNow}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Now
              </button>
            )}
          </div>

          {saveError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                {saveError}
              </p>
            </div>
          )}
        </div>

        {/* Auto-save Info */}
        <div className="p-4">
          <div className="text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Auto-save: Every 30 seconds</span>
              </div>
              <div className="flex items-center space-x-1">
                <GitBranch className="h-3 w-3" />
                <span>Versions are created automatically</span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              Changes are automatically saved and versioned. You can view version history, 
              compare changes, and restore previous versions at any time.
            </div>
          </div>
        </div>

        {/* Version History */}
        {showHistory && (
          <div className="border-t border-gray-200">
            <VersionHistory
              sectionId={sectionId}
              currentContent={currentContent}
              onRestoreVersion={handleRestoreVersion}
              onViewDiff={handleViewDiff}
              className="max-h-96 overflow-y-auto"
            />
          </div>
        )}
      </div>

      {/* Diff Viewer Modal */}
      {showDiff && diffVersion1 && (
        <DiffViewer
          version1={diffVersion1}
          version2={diffVersion2 || undefined}
          onClose={handleCloseDiff}
        />
      )}
    </>
  )
} 