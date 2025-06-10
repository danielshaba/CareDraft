import { useState, useCallback, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useCachedData } from './useCache'
import { useLoadingState } from './useLoadingState'
import { 
  profileDataService, 
  ProfileData,
  DataConflictResolution
} from '@/lib/services/profile-data-service'
import { 
  ProfileData as ValidationProfileData,
  ProfileUpdateData, 
  ProfileConflicts,
  validateProfile,
  validateProfileUpdate,
  createDefaultProfile
} from '@/lib/validations/profile'

export interface UseProfileOptions {
  autoSync?: boolean
  enableOptimisticUpdates?: boolean
  cacheTtl?: number
  debounceMs?: number
}

export interface ProfileState {
  data: ProfileData | null
  loading: boolean
  saving: boolean
  syncing: boolean
  error: Error | null
  conflicts: DataConflictResolution[] | null
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  isFromOnboarding: boolean
}

export interface ProfileActions {
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>
  saveProfile: (data?: ProfileData) => Promise<void>
  syncWithOnboarding: () => Promise<void>
  resolveConflicts: (conflicts: DataConflictResolution[]) => Promise<void>
  resetToOnboarding: () => Promise<void>
  refresh: () => Promise<void>
  clearErrors: () => void
  discardChanges: () => void
}

export function useProfile(options: UseProfileOptions = {}): ProfileState & ProfileActions {
  const {
    autoSync = true,
    enableOptimisticUpdates = true,
    cacheTtl = 300000, // 5 minutes
    debounceMs = 1000
  } = options

  const supabase = createClientComponentClient()
  const [state, setState] = useState<Omit<ProfileState, 'loading'>>({
    data: null,
    saving: false,
    syncing: false,
    error: null,
    conflicts: null,
    hasUnsavedChanges: false,
    lastSaved: null,
    isFromOnboarding: false
  })

  const { isLoading: dataLoading, setLoading } = useLoadingState()
  const debounceRef = useRef<NodeJS.Timeout>()
  const originalDataRef = useRef<ProfileData | null>(null)

  // Fetch profile data with caching
  const fetchProfile = useCallback(async (): Promise<ProfileData | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Try to get existing profile data
      const existingProfile = await profileDataService.getExistingProfileData(user.id)
      
      if (existingProfile) {
        originalDataRef.current = existingProfile
        setState(prev => ({ ...prev, isFromOnboarding: false }))
        return existingProfile
      }

      // If no profile exists, try to get from onboarding
      if (autoSync) {
        const onboardingData = await profileDataService.fetchOnboardingData(user.id)
        if (onboardingData) {
          const mappedProfile = profileDataService.mapToProfileData(onboardingData)
          originalDataRef.current = mappedProfile
          setState(prev => ({ ...prev, isFromOnboarding: true }))
          return mappedProfile
        }
      }

      // Return null if no data available
      return null

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Failed to fetch profile')
      }))
      return null
    }
  }, [supabase, autoSync])

  // Use cached data for profile
  const { 
    data: profileData, 
    loading, 
    error: fetchError,
    refresh: refreshCache
  } = useCachedData<ProfileData | null>(
    'profile-data',
    fetchProfile,
    { ttl: cacheTtl }
  )

  // Update state when cached data changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      data: profileData,
      error: fetchError || prev.error
    }))
  }, [profileData, fetchError])

  // Debounced save function
  const debouncedSave = useCallback((data: ProfileData) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setState(prev => ({ ...prev, saving: true, error: null }))

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Save profile using the service
        const success = await profileDataService.saveProfileData(user.id, data)
        
        if (!success) {
          throw new Error('Failed to save profile')
        }

        originalDataRef.current = data
        setState(prev => ({
          ...prev,
          saving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
          isFromOnboarding: false
        }))

        // Refresh cache
        await refreshCache()

      } catch (error) {
        setState(prev => ({
          ...prev,
          saving: false,
          error: error instanceof Error ? error : new Error('Failed to save profile')
        }))
      }
    }, debounceMs)
  }, [supabase, debounceMs, refreshCache])

  // Update profile with optimistic updates
  const updateProfile = useCallback(async (updates: Partial<ProfileData>) => {
    try {
      if (!state.data) return

      // Apply optimistic update
      const updatedProfile = { ...state.data, ...updates } as ProfileData
      
      if (enableOptimisticUpdates) {
        setState(prev => ({
          ...prev,
          data: updatedProfile,
          hasUnsavedChanges: true,
          error: null
        }))
      }

      // Trigger debounced save
      debouncedSave(updatedProfile)

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Invalid profile data')
      }))
      
      // Revert optimistic update on error
      if (enableOptimisticUpdates && originalDataRef.current) {
        setState(prev => ({ ...prev, data: originalDataRef.current }))
      }
    }
  }, [state.data, enableOptimisticUpdates, debouncedSave])

  // Save profile immediately
  const saveProfile = useCallback(async (data?: ProfileData) => {
    try {
      setState(prev => ({ ...prev, saving: true, error: null }))

      const profileToSave = data || state.data
      if (!profileToSave) throw new Error('No profile data to save')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const success = await profileDataService.saveProfileData(user.id, profileToSave)
      
      if (!success) {
        throw new Error('Failed to save profile')
      }

      originalDataRef.current = profileToSave
      setState(prev => ({
        ...prev,
        saving: false,
        data: profileToSave,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        isFromOnboarding: false
      }))

      await refreshCache()

    } catch (error) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error : new Error('Failed to save profile')
      }))
    }
  }, [state.data, supabase, refreshCache])

  // Sync with onboarding data
  const syncWithOnboarding = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, syncing: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Use the service's sync method
      const result = await profileDataService.syncOnboardingToProfile(user.id)
      
      if (!result.success) {
        throw new Error('Failed to sync with onboarding')
      }

      if (result.conflicts && result.conflicts.length > 0) {
        setState(prev => ({
          ...prev,
          syncing: false,
          conflicts: result.conflicts
        }))
        return
      }

      // No conflicts, apply the sync
      if (result.profileData) {
        setState(prev => ({
          ...prev,
          syncing: false,
          data: result.profileData!,
          hasUnsavedChanges: false,
          isFromOnboarding: true
        }))
      }

      await refreshCache()

    } catch (error) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error instanceof Error ? error : new Error('Failed to sync with onboarding')
      }))
    }
  }, [supabase, refreshCache])

  // Resolve conflicts
  const resolveConflicts = useCallback(async (conflicts: DataConflictResolution[]) => {
    try {
      if (!state.data) throw new Error('No profile data available')

      setState(prev => ({ ...prev, saving: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get fresh onboarding data
      const onboardingData = await profileDataService.fetchOnboardingData(user.id)
      if (!onboardingData) throw new Error('No onboarding data found')

      const mappedProfile = profileDataService.mapToProfileData(onboardingData)

      // Apply conflict resolutions
      const resolvedProfile = profileDataService.mergeData(
        state.data,
        mappedProfile,
        conflicts
      )

      setState(prev => ({
        ...prev,
        saving: false,
        data: resolvedProfile,
        conflicts: null,
        hasUnsavedChanges: true,
        isFromOnboarding: true
      }))

      // Save the resolved profile
      await saveProfile(resolvedProfile)

    } catch (error) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error : new Error('Failed to resolve conflicts')
      }))
    }
  }, [state.data, supabase, saveProfile])

  // Reset to onboarding data
  const resetToOnboarding = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, syncing: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const onboardingData = await profileDataService.fetchOnboardingData(user.id)
      if (!onboardingData) throw new Error('No onboarding data found')

      const mappedProfile = profileDataService.mapToProfileData(onboardingData)

      setState(prev => ({
        ...prev,
        syncing: false,
        data: mappedProfile,
        conflicts: null,
        hasUnsavedChanges: true,
        isFromOnboarding: true
      }))

      await saveProfile(mappedProfile)

    } catch (error) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error instanceof Error ? error : new Error('Failed to reset to onboarding')
      }))
    }
  }, [supabase, saveProfile])

  // Clear errors
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Discard changes
  const discardChanges = useCallback(() => {
    if (originalDataRef.current) {
      setState(prev => ({
        ...prev,
        data: originalDataRef.current,
        hasUnsavedChanges: false,
        error: null
      }))
    }
  }, [])

  // Refresh profile data
  const refresh = useCallback(async () => {
    await refreshCache()
  }, [refreshCache])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    // State
    data: state.data,
    loading: loading,
    saving: state.saving,
    syncing: state.syncing,
    error: state.error,
    conflicts: state.conflicts,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSaved: state.lastSaved,
    isFromOnboarding: state.isFromOnboarding,

    // Actions
    updateProfile,
    saveProfile,
    syncWithOnboarding,
    resolveConflicts,
    resetToOnboarding,
    refresh,
    clearErrors,
    discardChanges
  }
} 