'use client'

import React, { useState } from 'react'
import { ResearchSession } from '@/lib/database.types'
import { useResearchSessionStore } from '@/lib/stores/researchSessionStore'
import { ResearchSessionSidebar } from './ResearchSessionSidebar'
import { CreateSessionModal } from './CreateSessionModal'
import { ShareSessionModal } from './ShareSessionModal'
import { ResearchSessionViewer } from './ResearchSessionViewer'

interface ResearchSessionManagerProps {
  className?: string
  onSessionSelect?: (session: ResearchSession | null) => void
  initialSessionId?: string
  showViewer?: boolean
}

export function ResearchSessionManager({
  className = '',
  onSessionSelect,
  initialSessionId,
  showViewer = true
}: ResearchSessionManagerProps) {
  const [selectedSession, setSelectedSession] = useState<ResearchSession | null>(null)
  
  const {
    showCreateModal,
    showShareModal,
    shareSessionId,
    setShowCreateModal,
    setShowShareModal
  } = useResearchSessionStore()

  const handleSessionSelect = (session: ResearchSession) => {
    setSelectedSession(session)
    onSessionSelect?.(session)
  }

  const handleCloseModals = () => {
    setShowCreateModal(false)
    setShowShareModal(false)
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Sidebar */}
      <ResearchSessionSidebar
        onSessionSelect={handleSessionSelect}
        selectedSessionId={selectedSession?.id || initialSessionId}
      />
      
      {/* Main Content */}
      {showViewer && (
        <div className="flex-1">
          {selectedSession ? (
            <ResearchSessionViewer 
              session={selectedSession}
              onClose={() => setSelectedSession(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <div className="mb-4 text-6xl text-muted-foreground/50">📚</div>
                <h3 className="text-lg font-medium mb-2">No Session Selected</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Select a research session from the sidebar to view its details and results, 
                  or create a new session to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
      />
      
      <ShareSessionModal
        isOpen={showShareModal}
        onClose={handleCloseModals}
        sessionId={shareSessionId}
      />
    </div>
  )
}

// Export individual components for use elsewhere
export { ResearchSessionSidebar } from './ResearchSessionSidebar'
export { CreateSessionModal } from './CreateSessionModal'
export { ShareSessionModal } from './ShareSessionModal' 