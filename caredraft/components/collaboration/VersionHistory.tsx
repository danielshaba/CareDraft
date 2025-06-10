'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, Clock, User, RotateCcw, Eye, GitBranch, Diff } from 'lucide-react'
import { Version } from '@/types/collaboration'
import { VersionsService } from '@/lib/services/collaboration'
import { formatRelativeTime, formatDateTime } from '@/types/collaboration'

interface VersionHistoryProps {
  sectionId: string
  currentContent?: string
  onRestoreVersion?: (version: Version) => void
  onViewDiff?: (version: Version, compareWith?: Version) => void
  className?: string
}

export default function VersionHistory({
  sectionId,
  // currentContent,
  onRestoreVersion,
  onViewDiff,
  className = ''
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadVersions()
  }, [sectionId])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const versionsData = await VersionsService.getVersionsBySection(sectionId)
      setVersions(versionsData)
    } catch {
      console.error('Error loading versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      } else if (prev.length < 2) {
        return [...prev, versionId]
      } else {
        // Replace the oldest selection
        return [prev[1], versionId]
      }
    })
  }

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      const version1 = versions.find(v => v.id === selectedVersions[0])
      const version2 = versions.find(v => v.id === selectedVersions[1])
      if (version1 && version2) {
        onViewDiff?.(version1, version2)
      }
    }
  }

  const toggleVersionExpansion = (versionId: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(versionId)) {
        newSet.delete(versionId)
      } else {
        newSet.add(versionId)
      }
      return newSet
    })
  }

  const renderVersionItem = (version: Version, index: number) => {
    const isSelected = selectedVersions.includes(version.id)
    const isExpanded = expandedVersions.has(version.id)
    const isLatest = index === 0

    return (
      <div
        key={version.id}
        className={`border rounded-lg p-3 transition-colors ${
          isSelected 
            ? 'border-brand-primary bg-brand-primary-light' 
            : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleVersionSelect(version.id)}
              className="mt-1 h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <GitBranch className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    Version {version.version_number}
                  </span>
                  {isLatest && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Latest
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(version.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{version.user?.user_metadata?.full_name || version.user?.email || 'Unknown'}</span>
                </div>
              </div>

              {version.change_summary && (
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {version.change_summary}
                </p>
              )}

              {isExpanded && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <div className="font-medium mb-1">Full timestamp:</div>
                  <div>{formatDateTime(version.created_at)}</div>
                  {version.content_snapshot && (
                    <div className="mt-2">
                      <div className="font-medium mb-1">Content preview:</div>
                      <div className="max-h-20 overflow-y-auto">
                        {version.content_snapshot.substring(0, 200)}
                        {version.content_snapshot.length > 200 && '...'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => toggleVersionExpansion(version.id)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {onViewDiff && (
              <button
                onClick={() => onViewDiff(version)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="View changes"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}

            {onRestoreVersion && !isLatest && (
              <button
                onClick={() => onRestoreVersion(version)}
                className="p-1 text-gray-400 hover:text-brand-primary transition-colors"
                title="Restore this version"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
        
        {selectedVersions.length === 2 && (
          <button
            onClick={handleCompareVersions}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-brand-primary-dark bg-brand-primary-light border border-brand-primary rounded-md hover:bg-brand-primary-light transition-colors"
          >
            <Diff className="h-4 w-4 mr-1" />
            Compare Selected
          </button>
        )}
      </div>

      {selectedVersions.length > 0 && (
        <div className="mb-3 p-2 bg-brand-50 border border-brand-200 rounded-md">
          <p className="text-sm text-brand-700">
            {selectedVersions.length === 1 
              ? '1 version selected. Select another to compare.'
              : '2 versions selected. Click "Compare Selected" to view differences.'
            }
          </p>
        </div>
      )}

      <div className="space-y-3">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No version history available</p>
          </div>
        ) : (
          versions.map((version, index) => renderVersionItem(version, index))
        )}
      </div>

      {versions.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          {versions.length} version{versions.length !== 1 ? 's' : ''} total
        </div>
      )}
    </div>
  )
} 