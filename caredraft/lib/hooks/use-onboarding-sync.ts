import { useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

/**
 * Custom hook to sync onboarding store with database
 * Automatically loads user's onboarding status and provides methods for step completion
 */
export function useOnboardingSync() {
  const { user } = useAuth()
  const { 
    syncWithDatabase, 
    markStepCompletedInDatabase, 
    loadCompletionStatus,
    completedSteps,
    currentStep,
    isLoading
  } = useOnboardingStore()

  // Load onboarding status when user changes
  useEffect(() => {
    if (user?.id) {
      loadCompletionStatus(user.id)
    }
  }, [user?.id, loadCompletionStatus])

  // Method to complete a step in both store and database
  const completeStep = useCallback(async (stepNumber: number): Promise<boolean> => {
    if (!user?.id) {
      console.error('Cannot complete step: no user authenticated')
      return false
    }

    try {
      const success = await markStepCompletedInDatabase(user.id, stepNumber)
      if (success) {
        console.log(`Successfully completed onboarding step ${stepNumber}`)
        return true
      } else {
        console.error(`Failed to complete onboarding step ${stepNumber}`)
        return false
      }
    } catch (error) {
      console.error('Error completing onboarding step:', error)
      return false
    }
  }, [user?.id, markStepCompletedInDatabase])

  // Method to sync with database manually
  const forceSync = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      console.error('Cannot sync: no user authenticated')
      return
    }

    try {
      await syncWithDatabase(user.id)
      console.log('Onboarding status synced with database')
    } catch (error) {
      console.error('Error syncing onboarding status:', error)
    }
  }, [user?.id, syncWithDatabase])

  // Check if a specific step is completed
  const isStepCompleted = useCallback((stepNumber: number): boolean => {
    return completedSteps.includes(stepNumber)
  }, [completedSteps])

  // Get overall completion status
  const isOnboardingComplete = useCallback((): boolean => {
    return completedSteps.length >= 6
  }, [completedSteps])

  // Get next incomplete step
  const getNextStep = useCallback((): number => {
    for (let step = 1; step <= 6; step++) {
      if (!completedSteps.includes(step)) {
        return step
      }
    }
    return 0 // All steps completed
  }, [completedSteps])

  return {
    // Status
    completedSteps,
    currentStep,
    isLoading,
    isAuthenticated: !!user,
    
    // Computed status
    isStepCompleted,
    isOnboardingComplete: isOnboardingComplete(),
    nextStep: getNextStep(),
    
    // Actions
    completeStep,
    forceSync
  }
}

/**
 * Hook specifically for onboarding pages to handle step completion
 */
export function useOnboardingStep(stepNumber: number) {
  const {
    completeStep,
    isStepCompleted,
    isOnboardingComplete,
    isLoading
  } = useOnboardingSync()

  const isCurrentStepCompleted = isStepCompleted(stepNumber)

  // Method to mark current step as completed
  const markCurrentStepCompleted = useCallback(async (): Promise<boolean> => {
    return await completeStep(stepNumber)
  }, [completeStep, stepNumber])

  return {
    isCompleted: isCurrentStepCompleted,
    isOnboardingComplete,
    isLoading,
    markCompleted: markCurrentStepCompleted
  }
} 