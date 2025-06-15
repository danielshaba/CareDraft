// Global State Management - Store Integration
// Exports all Zustand stores and provides initialization utilities

export { useAuthStore } from './authStore'
export { useProposalStore } from './proposalStore'
export { useUIStore } from './uiStore'
export { useRealtimeStore } from './realtimeStore'

// Store initialization and hydration utilities
import { useAuthStore } from './authStore'
import { useProposalStore } from './proposalStore'
import { useUIStore } from './uiStore'
import { useRealtimeStore } from './realtimeStore'

/**
 * Initialize all stores with proper authentication and real-time setup
 * Call this on app startup after authentication is ready
 */
export const initializeStores = async () => {
  try {
    // Load UI preferences first
    useUIStore.getState().loadPreferences()
    
    // Check authentication state
    const authResult = await useAuthStore.getState().validateSession()
    
    if (authResult) {
      // User is authenticated, set up real-time connections
      const connected = await useRealtimeStore.getState().connect()
      
      if (connected) {
        // Set up proposal subscriptions for real-time collaboration
        setupProposalSubscriptions()
        
        // Set up user presence tracking
        setupUserPresenceSubscriptions()
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to initialize stores:', error)
    return { success: false, error }
  }
}

/**
 * Set up real-time subscriptions for proposal collaboration
 */
export const setupProposalSubscriptions = () => {
  const realtimeStore = useRealtimeStore.getState()
  const proposalStore = useProposalStore.getState()
  
  // Subscribe to proposal changes
  realtimeStore.subscribe(
    'proposals',
    '*',
    (payload: any) => {
      const { eventType, new: newRecord, old: _oldRecord } = payload
      
      // Handle proposal updates in real-time
      if (eventType === 'UPDATE' && newRecord) {
        // Check if this is the active proposal
        const activeProposal = proposalStore.activeProposal
        if (activeProposal && activeProposal.id === newRecord.id) {
          // Update active proposal with new data
          proposalStore.updateProposal(newRecord)
        }
      }
    }
  )
  
  // Subscribe to section changes
  realtimeStore.subscribe(
    'sections',
    '*',
    (payload: any) => {
      const { eventType, new: newRecord, old: _oldRecord } = payload
      
      // Handle section updates in real-time
      const activeProposal = proposalStore.activeProposal
      if (activeProposal) {
        switch (eventType) {
          case 'INSERT':
            if (newRecord && newRecord.proposal_id === activeProposal.id) {
              // Add new section to active proposal
              proposalStore.addSection(newRecord)
            }
            break
            
          case 'UPDATE':
            if (newRecord && newRecord.proposal_id === activeProposal.id) {
              // Update existing section
              proposalStore.updateSection(newRecord.id, newRecord)
            }
            break
            
          case 'DELETE':
            if (_oldRecord && _oldRecord.proposal_id === activeProposal.id) {
              // Remove deleted section
              proposalStore.deleteSection(_oldRecord.id)
            }
            break
        }
      }
    }
  )
}

/**
 * Set up user presence tracking subscriptions
 */
export const setupUserPresenceSubscriptions = () => {
  const realtimeStore = useRealtimeStore.getState()
  const authStore = useAuthStore.getState()
  const uiStore = useUIStore.getState()
  
  // Subscribe to user updates for collaborative features
  realtimeStore.subscribe(
    'users',
    'UPDATE',
    (payload: any) => {
      const { new: newRecord } = payload
      
      // Update current user data if it's our user
      if (newRecord && authStore.user && newRecord.id === authStore.user.id) {
        authStore.updateUser(newRecord)
      }
      
      // Show notification for user updates in active collaboration
      if (newRecord) {
        uiStore.addNotification({
          type: 'info' as any,
          title: 'User Updated',
          message: `${newRecord.full_name || newRecord.email} updated their profile`,
          priority: 2,
          isRead: false
        })
      }
    }
  )
}

/**
 * Clean up all store subscriptions and reset state
 * Call this on app shutdown or user logout
 */
export const cleanupStores = () => {
  try {
    // Disconnect real-time subscriptions
    useRealtimeStore.getState().disconnect()
    
    // Reset all stores to initial state
    useAuthStore.getState().reset()
    useProposalStore.getState().reset()
    useUIStore.getState().reset()
    useRealtimeStore.getState().reset()
    
    return { success: true }
  } catch (error) {
    console.error('Failed to cleanup stores:', error)
    return { success: false, error }
  }
}

/**
 * Hydrate stores with server data on app load
 * Merges persisted client state with fresh server data
 */
export const hydrateStores = async () => {
  try {
    // UI store preferences are loaded automatically via persistence
    
    // Validate and refresh authentication
    const authValid = await useAuthStore.getState().validateSession()
    
    if (authValid) {
      // Sync any pending operations
      await useRealtimeStore.getState().syncState()
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to hydrate stores:', error)
    return { success: false, error }
  }
}

/**
 * Get combined store state for debugging or testing
 */
export const getStoreState = () => ({
  auth: useAuthStore.getState(),
  proposal: useProposalStore.getState(),
  ui: useUIStore.getState(),
  realtime: useRealtimeStore.getState()
})

/**
 * Subscribe to store changes for debugging
 */
export const subscribeToStoreChanges = (callback: (storeName: string, state: unknown) => void) => {
  const unsubscribers = [
    useAuthStore.subscribe(state => callback('auth', state)),
    useProposalStore.subscribe(state => callback('proposal', state)),
    useUIStore.subscribe(state => callback('ui', state)),
    useRealtimeStore.subscribe(state => callback('realtime', state))
  ]
  
  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}

// Store selectors for common use cases
export const storeSelectors = {
  // Auth selectors
  isAuthenticated: () => useAuthStore.getState().isAuthenticated,
  currentUser: () => useAuthStore.getState().user,
  userPermissions: () => useAuthStore.getState().user?.permissions,
  
  // Proposal selectors
  activeProposal: () => useProposalStore.getState().activeProposal,
  proposalSections: () => useProposalStore.getState().sections,
  hasUnsavedChanges: () => useProposalStore.getState().hasUnsavedChanges,
  
  // UI selectors
  sidebarCollapsed: () => useUIStore.getState().sidebarCollapsed,
  notifications: () => useUIStore.getState().notifications,
  unreadCount: () => useUIStore.getState().unreadCount,
  currentTheme: () => useUIStore.getState().preferences.theme,
  
  // Realtime selectors
  isConnected: () => useRealtimeStore.getState().isConnected,
  connectionStatus: () => useRealtimeStore.getState().connectionStatus,
  activeSubscriptions: () => useRealtimeStore.getState().activeSubscriptions.length
}

// Export types for convenience
export type {
  AuthStore,
  ProposalStore,
  UIStore,
  RealtimeStore,
  AuthUser,
  ActiveProposal,
  NotificationItem,
  UserPreferences
} from '@/lib/types/store.types' 