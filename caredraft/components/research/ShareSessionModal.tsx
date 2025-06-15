'use client'

import React, { useState, useEffect } from 'react'
import { X, Share2, Mail, User, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { useResearchSessionStore } from '@/lib/stores/researchSessionStore'
import { researchSessionService } from '@/lib/services/research-sessions'

interface ShareSessionModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string | null
}

interface ShareableUser {
  id: string
  email: string
  full_name?: string
}

export function ShareSessionModal({
  isOpen,
  onClose,
  sessionId
}: ShareSessionModalProps) {
  const [shareableUsers, setShareableUsers] = useState<ShareableUser[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [currentlyShared, setCurrentlyShared] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    sessions, 
    shareSession, 
    removeSharing, 
    isLoading: isStoreLoading 
  } = useResearchSessionStore()

  const currentSession = sessionId ? sessions.find(s => s.id === sessionId) : null
  const isLoading = isStoreLoading || isLoadingUsers

  // Load shareable users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadShareableUsers()
      loadCurrentSharing()
    }
  }, [isOpen, sessionId])

  const loadShareableUsers = async () => {
    if (!sessionId) return
    
    setIsLoadingUsers(true)
    setError(null)
    
    try {
      const users = await researchSessionService.getShareableUsers()
      setShareableUsers(users)
    } catch (err) {
      console.error('Failed to load shareable users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const loadCurrentSharing = () => {
    if (!currentSession) return
    
    try {
      const sharedWith = currentSession.shared_with as string[] | null
      setCurrentlyShared(sharedWith || [])
    } catch (err) {
      console.error('Failed to parse shared_with data:', err)
      setCurrentlyShared([])
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleShareWithSelected = async () => {
    if (!sessionId || selectedUserIds.length === 0) return
    
    try {
      await shareSession(sessionId, selectedUserIds)
      setSelectedUserIds([])
      loadCurrentSharing()
    } catch (err) {
      console.error('Failed to share session:', err)
      setError(err instanceof Error ? err.message : 'Failed to share session')
    }
  }

  const handleRemoveSharing = async (userIds: string[]) => {
    if (!sessionId) return
    
    try {
      await removeSharing(sessionId, userIds)
      loadCurrentSharing()
    } catch (err) {
      console.error('Failed to remove sharing:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove sharing')
    }
  }

  const handleEmailInvite = () => {
    if (!emailInput.trim()) return
    
    // For now, just show an alert - email invitations would need backend support
    alert(`Email invitation would be sent to: ${emailInput}`)
    setEmailInput('')
  }

  const handleClose = () => {
    if (!isLoading) {
      setSelectedUserIds([])
      setEmailInput('')
      setError(null)
      onClose()
    }
  }

  const getSharedUsers = () => {
    return shareableUsers.filter(user => currentlyShared.includes(user.id))
  }

  const getAvailableUsers = () => {
    return shareableUsers.filter(user => !currentlyShared.includes(user.id))
  }

  if (!isOpen || !sessionId) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Research Session
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
        
        <CardContent className="overflow-y-auto space-y-6">
          {/* Session Info */}
          {currentSession && (
            <div className="bg-muted p-3 rounded-md">
              <h3 className="font-medium text-sm mb-1">{currentSession.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {currentSession.query}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Currently Shared Users */}
          <div>
            <h4 className="font-medium text-sm mb-3">Currently Shared With</h4>
            {isLoadingUsers ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : getSharedUsers().length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                This session is not shared with anyone yet
              </p>
            ) : (
              <div className="space-y-2">
                {getSharedUsers().map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.full_name || user.email}</p>
                        {user.full_name && (
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSharing([user.id])}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Users */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Share with Team Members</h4>
              {selectedUserIds.length > 0 && (
                <LoadingButton
                  size="sm"
                  onClick={handleShareWithSelected}
                  isLoading={isLoading}
                  loadingText="Sharing..."
                  className="gap-2"
                >
                  <Share2 className="h-3 w-3" />
                  Share with {selectedUserIds.length}
                </LoadingButton>
              )}
            </div>

            {isLoadingUsers ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : getAvailableUsers().length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                All team members already have access to this session
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {getAvailableUsers().map((user) => (
                  <div 
                    key={user.id}
                    className={`flex items-center gap-3 p-2 border rounded-md cursor-pointer transition-colors ${
                      selectedUserIds.includes(user.id) 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="rounded"
                    />
                    <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.full_name || user.email}</p>
                      {user.full_name && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Invitation */}
          <div>
            <h4 className="font-medium text-sm mb-3">Invite by Email</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isLoading}
                type="email"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleEmailInvite}
                disabled={isLoading || !emailInput.trim()}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Invite
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Email invitations are not yet implemented in this demo
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 