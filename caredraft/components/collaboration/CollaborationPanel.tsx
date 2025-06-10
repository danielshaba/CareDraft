'use client'

import React, { useState } from 'react'
import { MessageSquare, Clock, Users,  ChevronDown, ChevronUp } from 'lucide-react'

interface CollaborationPanelProps {
  sectionId: string
  className?: string
}

export function CollaborationPanel({ sectionId, className = '' }: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'versions' | 'presence'>('comments')
  const [isExpanded, setIsExpanded] = useState(false)

  // Mock unread counts
  const unreadComments = 3

  const tabs = [
    {
      id: 'comments' as const,
      label: 'Comments',
      icon: MessageSquare,
      count: unreadComments
    },
    {
      id: 'versions' as const,
      label: 'History',
      icon: Clock,
      count: 0
    },
    {
      id: 'presence' as const,
      label: 'Users',
      icon: Users,
      count: 0
    }
  ]

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {/* Tab Navigation */}
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-primary text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                        isActive ? 'bg-white text-brand-primary' : 'bg-red-100 text-red-800'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {activeTab === 'comments' && (
            <div className="min-h-96 text-center py-8 text-gray-500">
              Comments feature coming soon for section: {sectionId}
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="min-h-96 text-center py-8 text-gray-500">
              Version history feature coming soon for section: {sectionId}
            </div>
          )}

          {activeTab === 'presence' && (
            <div className="min-h-96 text-center py-8 text-gray-500">
              User presence feature coming soon for section: {sectionId}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 