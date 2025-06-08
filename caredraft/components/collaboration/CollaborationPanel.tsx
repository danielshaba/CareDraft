'use client'

import React, { useState, useRef } from 'react'
import { MessageSquare, Clock, Users,  ChevronDown, ChevronUp } from 'lucide-react'
import { CommentSystem } from './CommentSystem'
import { VersionHistory } from './VersionHistory'
import { UserPresenceIndicator } from './UserPresenceIndicator'
import { NotificationBell } from './NotificationBell'
import { useComments } from '@/hooks/useComments'
import { useUserPresence } from '@/hooks/useUserPresence'

interface CollaborationPanelProps {
  sectionId: string
  editorRef: React.RefObject<HTMLElement>
  className?: string
}

type CollaborationTab = 'comments' | 'versions' | 'presence'

export function CollaborationPanel({ 
  sectionId, 
  editorRef, 
  className = '' 
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<CollaborationTab>('comments')
  const [isExpanded, setIsExpanded] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  const { comments } = useComments(sectionId)
  const { presences, loading: presenceLoading } = useUserPresence(sectionId)

  const unresolvedCommentsCount = comments.filter(c => !c.is_resolved).length
  const totalCommentsCount = comments.length
  const activeUsersCount = presences.filter(p => p.is_active).length

  const tabs = [
    {
      id: 'comments' as const,
      label: 'Comments',
      icon: MessageSquare,
      count: unresolvedCommentsCount,
      totalCount: totalCommentsCount
    },
    {
      id: 'versions' as const,
      label: 'History',
      icon: Clock,
      count: null
    },
    {
      id: 'presence' as const,
      label: 'Users',
      icon: Users,
      count: activeUsersCount
    }
  ]

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900">Collaboration</h3>
          <UserPresenceIndicator presences={presences} />
        </div>
        
        <div className="flex items-center space-x-2">
          <NotificationBell />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-primary text-brand-primary bg-red-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-brand-primary text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.id === 'comments' && tab.totalCount && tab.totalCount > (tab.count || 0) && (
                  <span className="text-xs text-gray-400">
                    /{tab.totalCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="h-96 overflow-hidden" ref={panelRef}>
            {activeTab === 'comments' && (
              <div className="h-full">
                <CommentSystem
                  sectionId={sectionId}
                  editorRef={editorRef}
                  className="h-full"
                />
              </div>
            )}

            {activeTab === 'versions' && (
              <div className="h-full overflow-y-auto">
                <VersionHistory
                  sectionId={sectionId}
                  className="p-4"
                />
              </div>
            )}

            {activeTab === 'presence' && (
              <div className="h-full overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Active Users</h4>
                    {presenceLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary" />
                      </div>
                    ) : presences.length > 0 ? (
                      <UserPresenceIndicator 
                        presences={presences} 
                        showDetails={true}
                        className="space-y-2"
                      />
                    ) : (
                      <p className="text-gray-500 text-sm">No other users are currently active</p>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Collaboration Tips</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 mt-0.5 text-brand-primary" />
                        <span>Select text to add comments or @mention team members</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 mt-0.5 text-brand-primary" />
                        <span>View document history and compare versions</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Users className="w-4 h-4 mt-0.5 text-brand-primary" />
                        <span>See who&apos;s currently editing in real-time</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
} 