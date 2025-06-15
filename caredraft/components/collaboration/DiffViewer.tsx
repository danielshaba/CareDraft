'use client'

import React, { useMemo } from 'react'
import { X, GitBranch, Clock, User } from 'lucide-react'
import { Version } from '@/types/collaboration'
import { formatRelativeTime, getUserDisplayName } from '@/types/collaboration'

interface DiffViewerProps {
  version1: Version
  version2?: Version
  onClose: () => void
  className?: string
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'modified'
  content: string
  lineNumber?: number
  oldLineNumber?: number
  newLineNumber?: number
}

export default function DiffViewer({
  version1,
  version2,
  onClose,
  className = ''
}: DiffViewerProps) {
  const diffLines = useMemo(() => {
    if (!version2) {
      // Show single version content
      return version1.content_snapshot.split('\n').map((line, index) => ({
        type: 'unchanged' as const,
        content: line,
        lineNumber: index + 1
      }))
    }

    // Compare two versions
    return generateDiff(version2.content_snapshot, version1.content_snapshot)
  }, [version1, version2])

  const stats = useMemo(() => {
    const added = diffLines.filter(line => line.type === 'added').length
    const removed = diffLines.filter(line => line.type === 'removed').length
    const modified = diffLines.filter(line => line.type === 'modified').length
    
    return { added, removed, modified }
  }, [diffLines])

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {version2 ? 'Version Comparison' : 'Version Details'}
            </h2>
            
            {version2 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                  -{stats.removed}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  +{stats.added}
                </span>
                {stats.modified > 0 && (
                  <span className="px-2 py-1 bg-brand-100 text-brand-700 rounded">
                    ~{stats.modified}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Version Info */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Version 1 (newer/current) */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  Version {version1.version_number}
                </span>
                {!version2 && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(version1.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{getUserDisplayName(version1.user || {})}</span>
                </div>
              </div>
            </div>

            {/* Version 2 (older) */}
            {version2 && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    Version {version2.version_number}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    Previous
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(version2.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{getUserDisplayName(version2.user || {})}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Change summaries */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {version1.change_summary && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Latest Changes:</div>
                <p className="text-sm text-gray-600">{version1.change_summary}</p>
              </div>
            )}
            {version2?.change_summary && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Previous Changes:</div>
                <p className="text-sm text-gray-600">{version2.change_summary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-auto">
          <div className="font-mono text-sm">
            {diffLines.map((line, index) => (
              <div
                key={index}
                className={`flex ${getDiffLineClassName(line.type)}`}
              >
                <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r border-gray-200 text-right">
                  {line.type === 'added'
                    ? line.newLineNumber
                    : line.type === 'removed'
                      ? line.oldLineNumber
                      : line.lineNumber || ''}
                </div>
                <div className="flex-1 px-3 py-1 whitespace-pre-wrap break-words">
                  {line.type === 'added' && <span className="text-green-600 mr-1">+</span>}
                  {line.type === 'removed' && <span className="text-red-600 mr-1">-</span>}
                  {line.type === 'modified' && <span className="text-brand-600 mr-1">~</span>}
                  {line.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              {version2 ? (
                <span>
                  Comparing Version {version2.version_number} → Version {version1.version_number}
                </span>
              ) : (
                <span>Viewing Version {version1.version_number}</span>
              )}
            </div>
            <div>
              {diffLines.length} line{diffLines.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to generate diff between two text strings
function generateDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const diffLines: DiffLine[] = []

  // Simple line-by-line diff algorithm
  let oldIndex = 0
  let newIndex = 0

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex]
    const newLine = newLines[newIndex]

    if (oldIndex >= oldLines.length) {
      // Only new lines remaining
      diffLines.push({
        type: 'added',
        content: newLine,
        newLineNumber: newIndex + 1
      })
      newIndex++
    } else if (newIndex >= newLines.length) {
      // Only old lines remaining
      diffLines.push({
        type: 'removed',
        content: oldLine,
        oldLineNumber: oldIndex + 1
      })
      oldIndex++
    } else if (oldLine === newLine) {
      // Lines are identical
      diffLines.push({
        type: 'unchanged',
        content: oldLine,
        lineNumber: newIndex + 1
      })
      oldIndex++
      newIndex++
    } else {
      // Lines are different - check if it's a modification or addition/deletion
      const nextOldLine = oldLines[oldIndex + 1]
      const nextNewLine = newLines[newIndex + 1]

      if (nextOldLine === newLine) {
        // Old line was deleted
        diffLines.push({
          type: 'removed',
          content: oldLine,
          oldLineNumber: oldIndex + 1
        })
        oldIndex++
      } else if (nextNewLine === oldLine) {
        // New line was added
        diffLines.push({
          type: 'added',
          content: newLine,
          newLineNumber: newIndex + 1
        })
        newIndex++
      } else {
        // Line was modified
        diffLines.push({
          type: 'removed',
          content: oldLine,
          oldLineNumber: oldIndex + 1
        })
        diffLines.push({
          type: 'added',
          content: newLine,
          newLineNumber: newIndex + 1
        })
        oldIndex++
        newIndex++
      }
    }
  }

  return diffLines
}

// Helper function to get CSS classes for diff line types
function getDiffLineClassName(type: DiffLine['type']): string {
  switch (type) {
    case 'added':
      return 'bg-green-50 border-l-4 border-green-400'
    case 'removed':
      return 'bg-red-50 border-l-4 border-red-400'
    case 'modified':
      return 'bg-brand-50 border-l-4 border-brand-400'
    case 'unchanged':
    default:
      return 'bg-white hover:bg-gray-50'
  }
} 