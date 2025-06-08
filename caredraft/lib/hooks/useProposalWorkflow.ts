'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  ProposalStatus, 
  ProposalStatusWorkflowData,
  ProposalWorkflowSettings,
  Proposal
} from '@/lib/database.types'
import { 
  ProposalWorkflowService,
  StatusTransitionRequest,
  StatusTransitionResult,
  WorkflowPermissionCheck
} from '@/lib/services/proposal-workflow'

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
  permissions: WorkflowPermissionCheck | null
  canTransition: boolean
  
  // Error states
  error: string | null
  transitionError: string | null
}

export interface UseProposalWorkflowActions {
  // Core actions
  transitionStatus: (toStatus: ProposalStatus, comment?: string, reason?: string) => Promise<StatusTransitionResult>
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
}: UseProposalWorkflowOptions) {
  const [state, setState] = useState<UseProposalWorkflowState>({
    currentStatus: null,
    statusHistory: [],
    workflowSettings: null,
    availableTransitions: [],
    loading: true,
    transitionLoading: false,
    historyLoading: false,
    settingsLoading: false,
    permissions: null,
    canTransition: false,
    error: null,
    transitionError: null
  })

  const supabase = createClient()
  const workflowService = new ProposalWorkflowService()

  // Fetch current proposal status
  const fetchProposalStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('status')
        .eq('id', proposalId)
        .single()

      if (error) throw error
      
      setState(prev => ({
        ...prev,
        currentStatus: data.status,
        error: null
      }))
      
      return data.status
    } catch {
      console.error('Error fetching proposal status:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch proposal status'
      }))
      return null
    }
  }, [proposalId, supabase])

  // Refresh status history
  const refreshHistory = useCallback(async () => {
    setState(prev => ({ ...prev, historyLoading: true }))
    
    try {
      const history = await workflowService.getProposalStatusHistory(proposalId)
      setState(prev => ({
        ...prev,
        statusHistory: history,
        historyLoading: false,
        error: null
      }))
    } catch {
      console.error('Error fetching status history:', error)
      setState(prev => ({
        ...prev,
        historyLoading: false,
        error: 'Failed to fetch status history'
      }))
    }
  }, [proposalId])

  // Refresh workflow settings
  const refreshSettings = useCallback(async () => {
    setState(prev => ({ ...prev, settingsLoading: true }))
    
    try {
      const settings = await getWorkflowSettings()
      setState(prev => ({
        ...prev,
        workflowSettings: settings,
        settingsLoading: false,
        error: null
      }))
    } catch {
      console.error('Error fetching workflow settings:', error)
      setState(prev => ({
        ...prev,
        settingsLoading: false,
        error: 'Failed to fetch workflow settings'
      }))
    }
  }, [])

  // Refresh permissions and available transitions
  const refreshPermissions = useCallback(async () => {
    if (!state.currentStatus || !userId) return

    try {
      const [permissionCheck, transitions] = await Promise.all([
        canUserTransitionStatus(proposalId, state.currentStatus, userId),
        getAvailableTransitions(state.currentStatus, userId)
      ])

      setState(prev => ({
        ...prev,
        permissions: permissionCheck,
        canTransition: permissionCheck.canTransition,
        availableTransitions: transitions,
        error: null
      }))
    } catch {
      console.error('Error fetching permissions:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch permissions'
      }))
    }
  }, [proposalId, state.currentStatus, userId])

  // Transition status
  const transitionStatus = useCallback(async (
    toStatus: ProposalStatus, 
    comment?: string, 
    reason?: string
  ): Promise<StatusTransitionResult> => {
    if (!state.currentStatus) {
      return { success: false, error: 'No current status available' }
    }

    setState(prev => ({ ...prev, transitionLoading: true, transitionError: null }))

    try {
      const request: StatusTransitionRequest = {
        proposalId,
        fromStatus: state.currentStatus,
        toStatus,
        comment,
        transitionReason: reason,
        userId
      }

      const result = await transitionProposalStatus(request)
      
      if (result.success) {
        // Update current status
        setState(prev => ({
          ...prev,
          currentStatus: toStatus,
          transitionLoading: false
        }))
        
        // Refresh related data
        await Promise.all([
          refreshHistory(),
          refreshPermissions()
        ])
      } else {
        setState(prev => ({
          ...prev,
          transitionLoading: false,
          transitionError: result.error || 'Transition failed'
        }))
      }
      
      return result
    } catch {
      console.error('Error transitioning status:', error)
      const errorMessage = 'Failed to transition status'
      setState(prev => ({
        ...prev,
        transitionLoading: false,
        transitionError: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [proposalId, state.currentStatus, userId, refreshHistory, refreshPermissions])

  // Check if transition is allowed
  const isTransitionAllowed = useCallback((toStatus: ProposalStatus): boolean => {
    return state.availableTransitions.includes(toStatus)
  }, [state.availableTransitions])

  // Check if comment is required for transition
  const requiresComment = useCallback((toStatus: ProposalStatus): boolean => {
    if (!state.currentStatus || !state.workflowSettings) return false
    
    // Check if comments are required for specific transitions
    if (state.currentStatus === 'review' && toStatus === 'draft') {
      return state.workflowSettings.require_comments_on_rejection
    }
    
    if (state.currentStatus === 'review' && toStatus === 'submitted') {
      return state.workflowSettings.require_comments_on_approval
    }
    
    return false
  }, [state.currentStatus, state.workflowSettings])

  // Check if user can transition to specific status
  const checkCanTransition = useCallback(async (toStatus: ProposalStatus): Promise<boolean> => {
    if (!state.currentStatus || !userId) return false
    
    try {
      const result = await canUserTransitionStatus(proposalId, state.currentStatus, userId, toStatus)
      return result.canTransition
    } catch {
      console.error('Error checking transition permission:', error)
      return false
    }
  }, [proposalId, state.currentStatus, userId])

  // Clear errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      transitionError: null
    }))
  }, [])

  // Initial data loading
  useEffect(() => {
    const initializeData = async () => {
      setState(prev => ({ ...prev, loading: true }))
      
      try {
        // Fetch initial status
        const status = await fetchProposalStatus()
        
        // Fetch other data in parallel
        await Promise.all([
          refreshHistory(),
          refreshSettings(),
          status && userId ? refreshPermissions() : Promise.resolve()
        ])
      } catch {
        console.error('Error initializing workflow data:', error)
      } finally {
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    initializeData()
  }, [proposalId, userId]) // Only depend on proposalId and userId

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return

    const interval = setInterval(async () => {
      await Promise.all([
        fetchProposalStatus(),
        refreshHistory(),
        refreshPermissions()
      ])
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchProposalStatus, refreshHistory, refreshPermissions])

  // Re-fetch permissions when status changes
  useEffect(() => {
    if (state.currentStatus && userId) {
      refreshPermissions()
    }
  }, [state.currentStatus, userId, refreshPermissions])

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

  return [state, actions] as const
} 