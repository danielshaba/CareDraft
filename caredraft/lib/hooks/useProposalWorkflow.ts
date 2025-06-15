'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  ProposalStatus, 
  ProposalStatusWorkflowData,
  ProposalWorkflowSettings
} from '@/lib/database.types'

export interface UseProposalWorkflowOptions {
  proposalId: string
  userId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseProposalWorkflowState {
  // Current state
  currentStatus: ProposalStatus | null
  statusHistory: ProposalStatusWorkflowData[]
  workflowSettings: ProposalWorkflowSettings | null
  availableTransitions: ProposalStatus[]
  
  // Loading states
  loading: boolean
  transitionLoading: boolean
  historyLoading: boolean
  settingsLoading: boolean
  
  // Permission states
  permissions: any | null
  canTransition: boolean
  
  // Error states
  error: string | null
  transitionError: string | null
}

export interface UseProposalWorkflowActions {
  // Core actions
  transitionStatus: (toStatus: ProposalStatus, comment?: string, reason?: string) => Promise<any>
  refreshHistory: () => Promise<void>
  refreshPermissions: () => Promise<void>
  refreshSettings: () => Promise<void>
  
  // Utility actions
  checkCanTransition: (toStatus: ProposalStatus) => Promise<boolean>
  clearErrors: () => void
  
  // Status checks
  isTransitionAllowed: (toStatus: ProposalStatus) => boolean
  requiresComment: (toStatus: ProposalStatus) => boolean
}

export default function useProposalWorkflow({
  proposalId,
  userId,
  autoRefresh = false,
  refreshInterval = 30000
}: UseProposalWorkflowOptions): [UseProposalWorkflowState, UseProposalWorkflowActions] {
  const [state, setState] = useState<UseProposalWorkflowState>({
    currentStatus: null,
    statusHistory: [],
    workflowSettings: null,
    availableTransitions: [],
    loading: false,
    transitionLoading: false,
    historyLoading: false,
    settingsLoading: false,
    permissions: null,
    canTransition: false,
    error: null,
    transitionError: null
  })

  // Stub implementations
  const refreshHistory = useCallback(async () => {
    console.log('Stub: refreshHistory called for proposal', proposalId)
  }, [proposalId])

  const refreshSettings = useCallback(async () => {
    console.log('Stub: refreshSettings called')
  }, [])

  const refreshPermissions = useCallback(async () => {
    console.log('Stub: refreshPermissions called for user', userId)
  }, [userId])

  const transitionStatus = useCallback(async (
    toStatus: ProposalStatus, 
    comment?: string, 
    reason?: string
  ) => {
    console.log('Stub: transitionStatus called', { toStatus, comment, reason })
    return { success: false, error: 'Stub implementation' }
  }, [])

  const checkCanTransition = useCallback(async (toStatus: ProposalStatus) => {
    console.log('Stub: checkCanTransition called', toStatus)
    return false
  }, [])

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, error: null, transitionError: null }))
  }, [])

  const isTransitionAllowed = useCallback((toStatus: ProposalStatus) => {
    console.log('Stub: isTransitionAllowed called', toStatus)
    return false
  }, [])

  const requiresComment = useCallback((toStatus: ProposalStatus) => {
    console.log('Stub: requiresComment called', toStatus)
    return false
  }, [])

  const actions: UseProposalWorkflowActions = {
    transitionStatus,
    refreshHistory,
    refreshPermissions,
    refreshSettings,
    checkCanTransition,
    clearErrors,
    isTransitionAllowed,
    requiresComment
  }

  // Auto-refresh effect (disabled in stub)
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      console.log('Stub: Auto-refresh would be enabled with interval', refreshInterval)
    }
  }, [autoRefresh, refreshInterval])

  return [state, actions]
} 