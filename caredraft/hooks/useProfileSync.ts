import { useState, useCallback, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  profileDataService, 
  ProfileData,
  DataConflictResolution
} from '@/lib/services/profile-data-service'

export interface SyncState {
  syncing: boolean
  lastSync: Date | null
  conflicts: DataConflictResolution[] | null
  error: Error | null
  autoSyncEnabled: boolean
}

export interface UseSyncOptions {
  autoSyncInterval?: number // in milliseconds
  enableAutoSync?: boolean
  onSyncComplete?: (data: ProfileData) => void
  onConflicts?: (conflicts: DataConflictResolution[]) => void
}

export function useProfileSync(options: UseSyncOptions = {}) {
  const {
    autoSyncInterval = 600000, // 10 minutes
    enableAutoSync = false,
    onSyncComplete,
    onConflicts
  } = options

  const supabase = createClientComponentClient()
  const [state, setState] = useState<SyncState>({
    syncing: false,
    lastSync: null,
    conflicts: null,
    error: null,
    autoSyncEnabled: enableAutoSync
  })

  // Manual sync function
  const syncNow = useCallback(async (): Promise<{
    success: boolean
    data?: ProfileData
    conflicts?: DataConflictResolution[]
  }> => {
    try {
      setState(prev => ({ ...prev, syncing: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const result = await profileDataService.syncOnboardingToProfile(user.id)
      
      setState(prev => ({
        ...prev,
        syncing: false,
        lastSync: new Date(),
        conflicts: result.conflicts || null
      }))

      if (result.conflicts && result.conflicts.length > 0) {
        onConflicts?.(result.conflicts)
        return {
          success: false,
          conflicts: result.conflicts
        }
      }

      if (result.profileData) {
        onSyncComplete?.(result.profileData)
        return {
          success: true,
          data: result.profileData
        }
      }

      return { success: true }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Sync failed')
      setState(prev => ({
        ...prev,
        syncing: false,
        error: errorObj
      }))
      return { success: false }
    }
  }, [supabase, onSyncComplete, onConflicts])

  // Check if sync is needed
  const checkSyncNeeded = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // Check if onboarding data exists and is newer than profile
      const onboardingData = await profileDataService.fetchOnboardingData(user.id)
      if (!onboardingData) return false

      const existingProfile = await profileDataService.getExistingProfileData(user.id)
      if (!existingProfile) return true

      // Simple check - could be enhanced with timestamps
      return existingProfile.lastSyncedAt ? 
        (Date.now() - existingProfile.lastSyncedAt.getTime()) > autoSyncInterval :
        true

    } catch (error) {
      console.error('Error checking sync status:', error)
      return false
    }
  }, [supabase, autoSyncInterval])

  // Toggle auto sync
  const toggleAutoSync = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoSyncEnabled: enabled }))
  }, [])

  // Clear conflicts
  const clearConflicts = useCallback(() => {
    setState(prev => ({ ...prev, conflicts: null }))
  }, [])

  // Clear errors
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Auto sync effect
  useEffect(() => {
    if (!state.autoSyncEnabled) return

    const interval = setInterval(async () => {
      const needsSync = await checkSyncNeeded()
      if (needsSync && !state.syncing) {
        await syncNow()
      }
    }, autoSyncInterval)

    return () => clearInterval(interval)
  }, [state.autoSyncEnabled, state.syncing, autoSyncInterval, checkSyncNeeded, syncNow])

  return {
    ...state,
    syncNow,
    checkSyncNeeded,
    toggleAutoSync,
    clearConflicts,
    clearError
  }
} 