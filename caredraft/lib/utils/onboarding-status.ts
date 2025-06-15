// Stub implementation for onboarding status utility
// This file provides placeholder functionality until the database schema is properly set up

export interface OnboardingStep {
  id: number
  title: string
  description: string
  isCompleted: boolean
  isRequired: boolean
  order: number
}

export interface OnboardingStatus {
  isCompleted: boolean
  completedSteps: number[]
  totalSteps: number
  completedCount: number
  nextStep: OnboardingStep | null
  progress: number // 0-100
}

// Default onboarding steps
const DEFAULT_STEPS: Omit<OnboardingStep, 'isCompleted'>[] = [
  {
    id: 1,
    title: 'Welcome',
    description: 'Get started with CareDraft',
    isRequired: true,
    order: 1
  },
  {
    id: 2,
    title: 'Profile Setup',
    description: 'Complete your profile information',
    isRequired: true,
    order: 2
  },
  {
    id: 3,
    title: 'First Proposal',
    description: 'Create your first proposal',
    isRequired: false,
    order: 3
  }
]

export async function getOnboardingStatus(_userId: string): Promise<OnboardingStatus> {
  // Stub implementation - returns default incomplete status
  const steps: OnboardingStep[] = DEFAULT_STEPS.map(step => ({
    ...step,
    isCompleted: false
  }))

  return {
    isCompleted: false,
    completedSteps: [],
    totalSteps: steps.length,
    completedCount: 0,
    nextStep: steps[0] || null,
    progress: 0
  }
}

export async function updateOnboardingStep(_userId: string, _stepId: number): Promise<boolean> {
  // Stub implementation - always returns success
  return true
}

export async function completeOnboarding(_userId: string): Promise<boolean> {
  // Stub implementation - always returns success
  return true
}

export function getOnboardingSteps(): OnboardingStep[] {
  // Return default steps as incomplete
  return DEFAULT_STEPS.map(step => ({
    ...step,
    isCompleted: false
  }))
}

export function calculateProgress(completedSteps: number[], totalSteps: number): number {
  if (totalSteps === 0) return 100
  return Math.round((completedSteps.length / totalSteps) * 100)
}

export function getNextStep(steps: OnboardingStep[]): OnboardingStep | null {
  return steps.find(step => !step.isCompleted) || null
}

// Additional exports expected by onboarding store
export async function markOnboardingStepCompleted(_userId: string, _stepId: number): Promise<boolean> {
  // Stub implementation - always returns success
  return true
}

export async function checkOnboardingStatus(_userId: string): Promise<OnboardingStatus> {
  // Alias for getOnboardingStatus
  return getOnboardingStatus(_userId)
} 