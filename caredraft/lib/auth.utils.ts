import { createClient } from './supabase'
import { 
  UserProfile, 
  AuthError, 
  PasswordResetResponse,
  UserRole,
  Permission,
  hasRole,
  hasPermission,
  isSameOrganization
} from './auth.types'

/**
 * Authentication utility functions
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim().toLowerCase())
}

// Normalize email for consistency
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase()
}

// Generate organization ID for new users (UUID v4 format)
export const generateOrganizationId = (): string => {
  return crypto.randomUUID()
}

/**
 * Authentication operations
 */

// Send OTP code for sign in
export const sendOtpCode = async (identifier: string, type: 'email' | 'phone'): Promise<{ success: boolean; error?: AuthError; message?: string }> => {
  try {
    const supabase = createClient()
    let result
    if (type === 'email') {
      if (!isValidEmail(identifier)) {
        return {
          success: false,
          error: { message: 'Please enter a valid email address', code: 'invalid_email' }
        }
      }
      result = await supabase.auth.signInWithOtp({ email: normalizeEmail(identifier) })
    } else {
      // phone
      result = await supabase.auth.signInWithOtp({ phone: identifier })
    }
    if (result.error) {
      return { success: false, error: { message: result.error.message, code: result.error.name, status: result.error.status } }
    }
    return { success: true, message: 'OTP sent successfully.' }
  } catch {
    return { success: false, error: { message: 'An unexpected error occurred. Please try again.', code: 'unexpected_error' } }
  }
}

// Verify OTP code for sign in
export const verifyOtpCode = async (identifier: string, token: string, type: 'email' | 'phone'): Promise<{ success: boolean; error?: AuthError; message?: string; session?: unknown }> => {
  try {
    const supabase = createClient()
    let result
    if (type === 'email') {
      result = await supabase.auth.verifyOtp({ email: normalizeEmail(identifier), token, type: 'email' })
    } else {
      result = await supabase.auth.verifyOtp({ phone: identifier, token, type: 'sms' })
    }
    if (result.error) {
      return { success: false, error: { message: result.error.message, code: result.error.name, status: result.error.status } }
    }
    return { success: true, message: 'OTP verified successfully.', session: result.data.session }
  } catch {
    return { success: false, error: { message: 'An unexpected error occurred. Please try again.', code: 'unexpected_error' } }
  }
}

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<PasswordResetResponse> => {
  try {
    const normalizedEmail = normalizeEmail(email)
    
    if (!isValidEmail(normalizedEmail)) {
      return {
        success: false,
        error: {
          message: 'Please enter a valid email address',
          code: 'invalid_email'
        }
      }
    }

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
          status: error.status
        }
      }
    }

    return {
      success: true,
      message: 'Check your email for password reset instructions.'
    }
  } catch {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred. Please try again.',
        code: 'unexpected_error'
      }
    }
  }
}

// Sign out user
export const signOut = async (): Promise<{ error?: AuthError }> => {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        error: {
          message: error.message,
          code: error.name,
          status: error.status
        }
      }
    }

    return {}
  } catch {
    return {
      error: {
        message: 'An unexpected error occurred during sign out.',
        code: 'unexpected_error'
      }
    }
  }
}

/**
 * User profile operations
 */

// Get user profile by auth ID
export const getUserProfile = async (authUserId: string): Promise<UserProfile | null> => {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    if (!data) {
      return null
    }

    return {
      ...data,
      auth_id: authUserId,
      email_confirmed: true // If we got here, email is confirmed
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

// Create user profile after successful auth
export const createUserProfile = async (
  authUserId: string,
  email: string,
  fullName: string,
  organizationId: string,
  role: UserRole = 'writer'
): Promise<UserProfile | null> => {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: normalizeEmail(email),
        full_name: fullName.trim(),
        organization_id: organizationId,
        role: role
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }

    return {
      ...data,
      auth_id: authUserId,
      email_confirmed: true
    }
  } catch (error) {
    console.error('Error in createUserProfile:', error)
    return null
  }
}

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'role'>>
): Promise<UserProfile | null> => {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }

    return {
      ...data,
      auth_id: userId,
      email_confirmed: true
    }
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return null
  }
}

/**
 * Permission checking utilities
 */

// Check if user has specific role
export const userHasRole = (user: UserProfile | null, requiredRole: UserRole): boolean => {
  return hasRole(user, requiredRole)
}

// Check if user has specific permission
export const userHasPermission = (user: UserProfile | null, permission: Permission): boolean => {
  return hasPermission(user, permission)
}

// Check if user can access resource in organization
export const userCanAccessOrganization = (
  user: UserProfile | null, 
  resourceOrganizationId: string
): boolean => {
  if (!user) return false
  return user.organization_id === resourceOrganizationId
}

// Check if user can manage another user
export const userCanManageUser = (
  currentUser: UserProfile | null,
  targetUser: UserProfile | null
): boolean => {
  if (!currentUser || !targetUser) return false
  
  // Must be in same organization
  if (!isSameOrganization(currentUser, targetUser)) return false
  
  // Must have manager or admin role
  if (!hasRole(currentUser, 'manager')) return false
  
  // Admins can manage anyone in their org
  if (hasRole(currentUser, 'admin')) return true
  
  // Managers can manage writers and viewers, but not other managers or admins
  return hasRole(targetUser, 'writer') && !hasRole(targetUser, 'manager')
}

/**
 * Error handling utilities
 */

// Format auth error for display
export const formatAuthError = (error: AuthError): string => {
  switch (error.code) {
    case 'invalid_email':
      return 'Please enter a valid email address.'
    case 'email_not_confirmed':
      return 'Please check your email and click the confirmation link.'
    case 'invalid_credentials':
      return 'Invalid email or password.'
    case 'too_many_requests':
      return 'Too many requests. Please wait a moment before trying again.'
    case 'user_not_found':
      return 'No account found with this email address.'
    case 'signup_disabled':
      return 'New signups are currently disabled.'
    default:
      return error.message || 'An unexpected error occurred.'
  }
}

// Check if error indicates user should be redirected to signup
export const shouldRedirectToSignup = (error: AuthError): boolean => {
  return error.code === 'user_not_found'
}

/**
 * Session utilities
 */

// Check if session is expired
export const isSessionExpired = (session: unknown): boolean => {
  if (!session || typeof session !== 'object' || !('expires_at' in session)) return true
  const expiresAt = (session as any).expires_at
  if (typeof expiresAt !== 'number') return true
  return new Date(expiresAt * 1000) < new Date()
}

// Get time until session expires (in minutes)
export const getSessionTimeRemaining = (session: unknown): number => {
  if (!session || typeof session !== 'object' || !('expires_at' in session)) return 0
  const expiresAt = (session as any).expires_at
  if (typeof expiresAt !== 'number') return 0
  const expiresAtDate = new Date(expiresAt * 1000)
  const now = new Date()
  const diffMs = expiresAtDate.getTime() - now.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60)))
}

/**
 * Development utilities
 */

// Mock user for development/testing
export const createMockUser = (
  overrides: Partial<UserProfile> = {}
): UserProfile => {
  return {
    id: 'mock-user-id',
    auth_id: 'mock-auth-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'writer',
    organization_id: 'mock-org-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed: true,
    ...overrides
  }
} 