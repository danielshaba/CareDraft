import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import ProfileForm from '@/components/forms/ProfileForm'
import { ProfileDataService } from '@/lib/services/ProfileDataService'
import { createClient } from '@/lib/supabase/client'

// Mock the services
jest.mock('@/lib/services/ProfileDataService')
jest.mock('@/lib/supabase/client')
jest.mock('@/hooks/useProfile')
jest.mock('@/hooks/useProfileSync')
jest.mock('@/hooks/useProfileValidation')

// Mock the hooks
const mockUseProfile = jest.fn()
const mockUseProfileSync = jest.fn()
const mockUseProfileValidation = jest.fn()

// Setup mock implementations
beforeEach(() => {
  jest.clearAllMocks()
  
  // Default mock implementations
  mockUseProfile.mockReturnValue({
    profile: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+44 7123 456789',
      organization: 'Test Company',
      website: 'https://example.com',
      address: '123 Test Street, London, UK',
      bio: 'Test bio',
      experience: '5 years',
      specializations: ['Healthcare', 'Technology'],
      qualifications: ['MBA', 'BSc'],
      languages: ['English', 'Spanish']
    },
    isLoading: false,
    error: null,
    updateProfile: jest.fn(),
    refreshProfile: jest.fn()
  })

  mockUseProfileSync.mockReturnValue({
    syncStatus: 'idle',
    syncFromOnboarding: jest.fn(),
    conflicts: [],
    resolveConflict: jest.fn(),
    lastSyncedAt: null,
    availableOnboardingData: {
      personal: { firstName: 'John', lastName: 'Doe' },
      company: { name: 'Test Company' },
      contact: { email: 'john@example.com' }
    }
  })

  mockUseProfileValidation.mockReturnValue({
    validate: jest.fn().mockResolvedValue({ isValid: true, errors: {} }),
    validateField: jest.fn().mockResolvedValue({ isValid: true, error: null }),
    getCompletionPercentage: jest.fn().mockReturnValue(85),
    isValidating: false,
    validationErrors: {}
  })
})

describe('ProfileForm Component', () => {
  describe('Rendering', () => {
    it('renders the profile form with all sections', async () => {
      render(<ProfileForm />)
      
      // Check for main sections
      expect(screen.getByText('Personal Information')).toBeInTheDocument()
      expect(screen.getByText('Company Information')).toBeInTheDocument()
      expect(screen.getByText('Contact Information')).toBeInTheDocument()
      expect(screen.getByText('Professional Information')).toBeInTheDocument()
    })

    it('displays profile data when loaded', async () => {
      render(<ProfileForm />)
      
      // Check if profile data is displayed
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
      })
    })

    it('shows loading state when profile is loading', async () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
        updateProfile: jest.fn(),
        refreshProfile: jest.fn()
      })

      render(<ProfileForm />)
      
      expect(screen.getByTestId('profile-loading')).toBeInTheDocument()
      expect(screen.getByText('Loading your profile...')).toBeInTheDocument()
    })

    it('shows error state when there is an error', async () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: new Error('Failed to load profile'),
        updateProfile: jest.fn(),
        refreshProfile: jest.fn()
      })

      render(<ProfileForm />)
      
      expect(screen.getByText('Error loading profile')).toBeInTheDocument()
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument()
    })
  })

  describe('Auto-population Features', () => {
    it('shows auto-population indicators for pre-filled fields', async () => {
      render(<ProfileForm />)
      
      // Look for sparkle icons and auto-filled badges
      await waitFor(() => {
        expect(screen.getAllByText('Auto-filled').length).toBeGreaterThan(0)
        expect(screen.getAllByTestId('field-indicator').length).toBeGreaterThan(0)
      })
    })

    it('triggers onboarding data sync when button is clicked', async () => {
      const mockSyncFromOnboarding = jest.fn()
      mockUseProfileSync.mockReturnValue({
        ...mockUseProfileSync(),
        syncFromOnboarding: mockSyncFromOnboarding
      })

      render(<ProfileForm />)
      
      const syncButton = screen.getByText('Sync from Onboarding')
      fireEvent.click(syncButton)
      
      expect(mockSyncFromOnboarding).toHaveBeenCalled()
    })

    it('shows completion percentage', async () => {
      render(<ProfileForm />)
      
      await waitFor(() => {
        expect(screen.getByText('85% Complete')).toBeInTheDocument()
      })
    })
  })

  describe('Form Editing', () => {
    it('allows editing fields inline', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)
      
      // Find an editable field and click edit
      const editButton = screen.getAllByText('Edit')[0]
      await user.click(editButton)
      
      // Field should now be in edit mode
      await waitFor(() => {
        expect(screen.getByTestId('edit-mode-input')).toBeInTheDocument()
      })
    })

    it('saves changes when save button is clicked', async () => {
      const user = userEvent.setup()
      const mockUpdateProfile = jest.fn().mockResolvedValue({})
      mockUseProfile.mockReturnValue({
        ...mockUseProfile(),
        updateProfile: mockUpdateProfile
      })

      render(<ProfileForm />)
      
      // Enter edit mode
      const editButton = screen.getAllByText('Edit')[0]
      await user.click(editButton)
      
      // Make changes
      const input = screen.getByTestId('edit-mode-input')
      await user.clear(input)
      await user.type(input, 'Updated Name')
      
      // Save changes
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Updated Name'
          })
        )
      })
    })

    it('cancels changes when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)
      
      // Enter edit mode
      const editButton = screen.getAllByText('Edit')[0]
      await user.click(editButton)
      
      // Make changes
      const input = screen.getByTestId('edit-mode-input')
      await user.clear(input)
      await user.type(input, 'Updated Name')
      
      // Cancel changes
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      // Should return to display mode with original value
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('Validation', () => {
    it('shows validation errors for invalid fields', async () => {
      const user = userEvent.setup()
      mockUseProfileValidation.mockReturnValue({
        ...mockUseProfileValidation(),
        validateField: jest.fn().mockResolvedValue({
          isValid: false,
          error: 'Invalid email format'
        }),
        validationErrors: {
          email: 'Invalid email format'
        }
      })

      render(<ProfileForm />)
      
      // Enter edit mode for email field
      const editButton = screen.getAllByText('Edit')[1] // Assuming email is second field
      await user.click(editButton)
      
      // Enter invalid email
      const input = screen.getByTestId('edit-mode-input')
      await user.clear(input)
      await user.type(input, 'invalid-email')
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument()
      })
    })

    it('prevents saving when there are validation errors', async () => {
      const user = userEvent.setup()
      const mockUpdateProfile = jest.fn()
      mockUseProfile.mockReturnValue({
        ...mockUseProfile(),
        updateProfile: mockUpdateProfile
      })
      
      mockUseProfileValidation.mockReturnValue({
        ...mockUseProfileValidation(),
        validateField: jest.fn().mockResolvedValue({
          isValid: false,
          error: 'Invalid email format'
        })
      })

      render(<ProfileForm />)
      
      // Enter edit mode
      const editButton = screen.getAllByText('Edit')[0]
      await user.click(editButton)
      
      // Try to save with validation error
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)
      
      // Should not call update
      expect(mockUpdateProfile).not.toHaveBeenCalled()
    })
  })

  describe('Conflict Resolution', () => {
    it('shows conflict indicators when data conflicts exist', async () => {
      mockUseProfileSync.mockReturnValue({
        ...mockUseProfileSync(),
        conflicts: [{
          field: 'email',
          profileValue: 'john@profile.com',
          onboardingValue: 'john@onboarding.com',
          source: 'onboarding'
        }]
      })

      render(<ProfileForm />)
      
      await waitFor(() => {
        expect(screen.getByText('Data Conflict')).toBeInTheDocument()
        expect(screen.getByText('Resolve')).toBeInTheDocument()
      })
    })

    it('allows resolving conflicts', async () => {
      const user = userEvent.setup()
      const mockResolveConflict = jest.fn()
      
      mockUseProfileSync.mockReturnValue({
        ...mockUseProfileSync(),
        conflicts: [{
          field: 'email',
          profileValue: 'john@profile.com',
          onboardingValue: 'john@onboarding.com',
          source: 'onboarding'
        }],
        resolveConflict: mockResolveConflict
      })

      render(<ProfileForm />)
      
      // Click resolve conflict
      const resolveButton = screen.getByText('Resolve')
      await user.click(resolveButton)
      
      // Should show conflict resolution options
      await waitFor(() => {
        expect(screen.getByText('Keep Profile Value')).toBeInTheDocument()
        expect(screen.getByText('Use Onboarding Value')).toBeInTheDocument()
      })
      
      // Choose option
      const keepProfileButton = screen.getByText('Keep Profile Value')
      await user.click(keepProfileButton)
      
      expect(mockResolveConflict).toHaveBeenCalledWith('email', 'profile')
    })
  })

  describe('Auto-save Functionality', () => {
    it('auto-saves changes after debounce period', async () => {
      const user = userEvent.setup()
      const mockUpdateProfile = jest.fn().mockResolvedValue({})
      mockUseProfile.mockReturnValue({
        ...mockUseProfile(),
        updateProfile: mockUpdateProfile
      })

      render(<ProfileForm />)
      
      // Enter edit mode
      const editButton = screen.getAllByText('Edit')[0]
      await user.click(editButton)
      
      // Make changes
      const input = screen.getByTestId('edit-mode-input')
      await user.clear(input)
      await user.type(input, 'Updated Name')
      
      // Wait for debounce period (1000ms)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100))
      })
      
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Updated Name'
        })
      )
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<ProfileForm />)
      
      // Check for proper accessibility attributes
      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)
      
      // Tab through form elements
      await user.tab()
      expect(document.activeElement).toHaveAttribute('type', 'text')
      
      await user.tab()
      expect(document.activeElement).toHaveAttribute('type', 'email')
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()
      const mockUpdateProfile = jest.fn().mockRejectedValue(new Error('API Error'))
      mockUseProfile.mockReturnValue({
        ...mockUseProfile(),
        updateProfile: mockUpdateProfile
      })

      render(<ProfileForm />)
      
      // Enter edit mode and try to save
      const editButton = screen.getAllByText('Edit')[0]
      await user.click(editButton)
      
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
      })
    })

    it('retries failed operations', async () => {
      const user = userEvent.setup()
      const mockUpdateProfile = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({})
      
      mockUseProfile.mockReturnValue({
        ...mockUseProfile(),
        updateProfile: mockUpdateProfile
      })

      render(<ProfileForm />)
      
      // Enter edit mode and try to save (will fail first time)
      const editButton = screen.getAllByText('Edit')[0]
      await user.click(editButton)
      
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)
      
      // Should show retry button
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
      
      // Click retry
      const retryButton = screen.getByText('Retry')
      await user.click(retryButton)
      
      // Should succeed on retry
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledTimes(2)
      })
    })
  })
})

describe('ProfileForm Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks for integration tests
    jest.clearAllMocks()
  })

  it('completes full profile update workflow', async () => {
    const user = userEvent.setup()
    
    // Mock successful API calls
    const mockClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null
        })
      }
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockClient)
    
    const mockUpdateProfile = jest.fn().mockResolvedValue({
      data: { success: true },
      error: null
    })
    
    ;(ProfileDataService.updateProfile as jest.Mock).mockImplementation(mockUpdateProfile)
    
    render(<ProfileForm />)
    
    // Complete workflow: load -> edit -> validate -> save
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    })
    
    // Edit field
    const editButton = screen.getAllByText('Edit')[0]
    await user.click(editButton)
    
    const input = screen.getByTestId('edit-mode-input')
    await user.clear(input)
    await user.type(input, 'John Updated Doe')
    
    // Save
    const saveButton = screen.getByText('Save')
    await user.click(saveButton)
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Updated Doe')).toBeInTheDocument()
    })
  })
}) 