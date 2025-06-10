'use client'

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Types for onboarding data
export interface CompanyBasicInfo {
  name: string
  address: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
  adminEmail: string
  password: string
  confirmPassword: string
  agreedToTerms: boolean
  agreedToPrivacy: boolean
  marketingConsent: boolean
}

export interface CompanyProfile {
  // Company Overview
  sector: 'domiciliary' | 'residential' | 'supported_living' | 'other'
  staffCount: number
  annualTurnover: number
  establishedYear?: number
  
  // Core Accreditations
  accreditations: {
    iso9001: boolean
    iso14001: boolean
    cqcRating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | null
    cyberEssentials: boolean
    cyberEssentialsPlus: boolean
    soc2: boolean
    other: string[]
  }
  
  // Awards & Testimonials
  awards: {
    title: string
    year: number
    description?: string
    logoFile?: File
  }[]
  
  testimonials: {
    clientName: string
    quote: string
    position?: string
    company?: string
  }[]
  
  // About Us content
  companyDescription: string
  missionStatement?: string
  valuesStatement?: string
}

// Tutorial progress tracking
export interface TutorialStep {
  id: string
  title: string
  description: string
  completed: boolean
  startedAt?: Date
  completedAt?: Date
}

export interface TutorialProgress {
  currentStepIndex: number
  steps: TutorialStep[]
  isCompleted: boolean
  lastPlayedAt?: Date
  totalCompletionTime?: number // in milliseconds
}

export interface OnboardingState {
  // Current step
  currentStep: number
  completedSteps: number[]
  
  // Form data
  companyBasicInfo: Partial<CompanyBasicInfo>
  companyProfile: Partial<CompanyProfile>
  
  // Tutorial progress
  tutorialProgress: TutorialProgress
  
  // UI State
  isLoading: boolean
  errors: Record<string, string>
  
  // Email verification
  emailVerificationSent: boolean
  emailVerified: boolean
  verificationToken?: string
}

export interface OnboardingActions {
  // Navigation
  setCurrentStep: (step: number) => void
  markStepCompleted: (step: number) => void
  setCompletedSteps: (steps: number[]) => void
  nextStep: () => void
  previousStep: () => void
  
  // Company Basic Info
  updateCompanyBasicInfo: (data: Partial<CompanyBasicInfo>) => void
  clearCompanyBasicInfo: () => void
  
  // Company Profile
  updateCompanyProfile: (data: Partial<CompanyProfile>) => void
  addAward: (award: CompanyProfile['awards'][0]) => void
  removeAward: (index: number) => void
  addTestimonial: (testimonial: CompanyProfile['testimonials'][0]) => void
  removeTestimonial: (index: number) => void
  
  // UI State Management
  setLoading: (loading: boolean) => void
  setError: (field: string, error: string) => void
  clearError: (field: string) => void
  clearAllErrors: () => void
  
  // Email Verification
  setEmailVerificationSent: (sent: boolean) => void
  setEmailVerified: (verified: boolean) => void
  setVerificationToken: (token: string) => void
  
  // Tutorial Progress
  startTutorialStep: (stepId: string) => void
  completeTutorialStep: (stepId: string) => void
  resetTutorial: () => void
  setTutorialProgress: (progress: Partial<TutorialProgress>) => void
  
  // Reset
  resetOnboarding: () => void
}

export type OnboardingStore = OnboardingState & OnboardingActions

const initialTutorialSteps: TutorialStep[] = [
  {
    id: 'tender-details',
    title: 'Set Up Tender Details',
    description: 'Configure basic tender information and evaluation criteria',
    completed: false
  },
  {
    id: 'extract-demo',
    title: 'Extract Document Information',
    description: 'Learn how to upload and analyze tender documents',
    completed: false
  },
  {
    id: 'brainstorm-ideas',
    title: 'Generate Response Ideas',
    description: 'Use AI to brainstorm content for your proposal',
    completed: false
  },
  {
    id: 'draft-builder',
    title: 'Build Your Response',
    description: 'Create and edit your tender response with collaborative tools',
    completed: false
  },
  {
    id: 'knowledge-research',
    title: 'Research Supporting Information',
    description: 'Use the Knowledge Hub to find relevant company information',
    completed: false
  },
  {
    id: 'export-submission',
    title: 'Export and Submit',
    description: 'Learn how to export your final proposal for submission',
    completed: false
  }
]

const initialState: OnboardingState = {
  currentStep: 1,
  completedSteps: [],
  
  companyBasicInfo: {
    name: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      postcode: '',
      country: 'United Kingdom'
    },
    adminEmail: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
    agreedToPrivacy: false,
    marketingConsent: false
  },
  
  companyProfile: {
    sector: 'domiciliary',
    staffCount: 0,
    annualTurnover: 0,
    accreditations: {
      iso9001: false,
      iso14001: false,
      cqcRating: null,
      cyberEssentials: false,
      cyberEssentialsPlus: false,
      soc2: false,
      other: []
    },
    awards: [],
    testimonials: [],
    companyDescription: '',
    missionStatement: '',
    valuesStatement: ''
  },
  
  tutorialProgress: {
    currentStepIndex: 0,
    steps: initialTutorialSteps,
    isCompleted: false
  },
  
  isLoading: false,
  errors: {},
  emailVerificationSent: false,
  emailVerified: false
}

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // Navigation
        setCurrentStep: (step: number) => 
          set((state) => {
            state.currentStep = step
          }),
          
        markStepCompleted: (step: number) =>
          set((state) => {
            if (!state.completedSteps.includes(step)) {
              state.completedSteps.push(step)
            }
          }),
          
        setCompletedSteps: (steps: number[]) =>
          set((state) => {
            state.completedSteps = steps
          }),
          
        nextStep: () =>
          set((state) => {
            const currentStep = state.currentStep
            state.currentStep = Math.min(currentStep + 1, 6) // Max 6 steps
            if (!state.completedSteps.includes(currentStep)) {
              state.completedSteps.push(currentStep)
            }
          }),
          
        previousStep: () =>
          set((state) => {
            state.currentStep = Math.max(state.currentStep - 1, 1)
          }),
        
        // Company Basic Info
        updateCompanyBasicInfo: (data: Partial<CompanyBasicInfo>) =>
          set((state) => {
            Object.assign(state.companyBasicInfo, data)
          }),
          
        clearCompanyBasicInfo: () =>
          set((state) => {
            state.companyBasicInfo = { ...initialState.companyBasicInfo }
          }),
        
        // Company Profile
        updateCompanyProfile: (data: Partial<CompanyProfile>) =>
          set((state) => {
            Object.assign(state.companyProfile, data)
          }),
          
        addAward: (award: CompanyProfile['awards'][0]) =>
          set((state) => {
            state.companyProfile.awards = state.companyProfile.awards || []
            state.companyProfile.awards.push(award)
          }),
          
        removeAward: (index: number) =>
          set((state) => {
            if (state.companyProfile.awards) {
              state.companyProfile.awards.splice(index, 1)
            }
          }),
          
        addTestimonial: (testimonial: CompanyProfile['testimonials'][0]) =>
          set((state) => {
            state.companyProfile.testimonials = state.companyProfile.testimonials || []
            state.companyProfile.testimonials.push(testimonial)
          }),
          
        removeTestimonial: (index: number) =>
          set((state) => {
            if (state.companyProfile.testimonials) {
              state.companyProfile.testimonials.splice(index, 1)
            }
          }),
        
        // UI State Management
        setLoading: (loading: boolean) =>
          set((state) => {
            state.isLoading = loading
          }),
          
        setError: (field: string, error: string) =>
          set((state) => {
            state.errors[field] = error
          }),
          
        clearError: (field: string) =>
          set((state) => {
            delete state.errors[field]
          }),
          
        clearAllErrors: () =>
          set((state) => {
            state.errors = {}
          }),
        
        // Email Verification
        setEmailVerificationSent: (sent: boolean) =>
          set((state) => {
            state.emailVerificationSent = sent
          }),
          
        setEmailVerified: (verified: boolean) =>
          set((state) => {
            state.emailVerified = verified
          }),
          
        setVerificationToken: (token: string) =>
          set((state) => {
            state.verificationToken = token
          }),
        
        // Tutorial Progress
        startTutorialStep: (stepId: string) =>
          set((state) => {
            const stepIndex = state.tutorialProgress.steps.findIndex(s => s.id === stepId)
            if (stepIndex !== -1) {
              state.tutorialProgress.currentStepIndex = stepIndex
              state.tutorialProgress.steps[stepIndex].startedAt = new Date()
              state.tutorialProgress.lastPlayedAt = new Date()
            }
          }),
          
        completeTutorialStep: (stepId: string) =>
          set((state) => {
            const stepIndex = state.tutorialProgress.steps.findIndex(s => s.id === stepId)
            if (stepIndex !== -1) {
              state.tutorialProgress.steps[stepIndex].completed = true
              state.tutorialProgress.steps[stepIndex].completedAt = new Date()
              
              // Check if all steps are completed
              const allCompleted = state.tutorialProgress.steps.every(s => s.completed)
              if (allCompleted) {
                state.tutorialProgress.isCompleted = true
              }
              
              // Move to next step if available
              if (stepIndex < state.tutorialProgress.steps.length - 1) {
                state.tutorialProgress.currentStepIndex = stepIndex + 1
              }
            }
          }),
          
        resetTutorial: () =>
          set((state) => {
            state.tutorialProgress = {
              currentStepIndex: 0,
              steps: initialTutorialSteps.map(step => ({ ...step, completed: false, startedAt: undefined, completedAt: undefined })),
              isCompleted: false
            }
          }),
          
        setTutorialProgress: (progress: Partial<TutorialProgress>) =>
          set((state) => {
            Object.assign(state.tutorialProgress, progress)
          }),
        
        // Reset
        resetOnboarding: () =>
          set((state) => {
            Object.assign(state, initialState)
          })
      })),
      {
        name: 'caredraft-onboarding',
        version: 1,
        partialize: (state) => ({
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
          companyBasicInfo: state.companyBasicInfo,
          companyProfile: state.companyProfile,
          tutorialProgress: state.tutorialProgress,
          emailVerificationSent: state.emailVerificationSent,
          emailVerified: state.emailVerified
        })
      }
    ),
    {
      name: 'onboarding-store'
    }
  )
) 