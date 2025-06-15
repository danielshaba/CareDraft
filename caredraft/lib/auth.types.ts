import { Database } from './database.types'

// Re-export database types for convenience
export type { Database } from './database.types'

// User types from database
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type UserRole = Database['public']['Enums']['user_role']

// Supabase Auth types
export interface AuthUser {
  id: string
  email?: string
  email_confirmed_at?: string
  created_at?: string
  updated_at?: string
  last_sign_in_at?: string
  app_metadata?: {
    provider?: string
    providers?: string[]
  }
  user_metadata?: {
    [key: string]: unknown
  }
}

// Extended user profile combining Supabase Auth + our Users table
export interface UserProfile extends User {
  auth_id: string // Supabase auth.users.id
  email_confirmed?: boolean
  last_sign_in_at?: string
}

// Authentication state
export interface AuthState {
  user: UserProfile | null
  session: unknown | null // Supabase session
  loading: boolean
  initialized: boolean
}

// Authentication context type
export interface AuthContextType extends AuthState {
  signIn: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  refreshUser: () => Promise<void>
}

// Authentication error types
export interface AuthError {
  message: string
  code?: string
  status?: number
}

// Password reset response
export interface PasswordResetResponse {
  success: boolean
  error?: AuthError
  message?: string
}

// Role hierarchy for permissions (from lowest to highest)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  writer: 2,
  manager: 3,
  admin: 4,
} as const

// Permission types
export type Permission = 
  | 'view_proposals'
  | 'create_proposals'
  | 'edit_proposals'
  | 'delete_proposals'
  | 'manage_users'
  | 'manage_organization'
  | 'view_answer_bank'
  | 'edit_answer_bank'
  | 'view_research'
  | 'create_research'

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  viewer: [
    'view_proposals',
    'view_answer_bank',
    'view_research',
  ],
  writer: [
    'view_proposals',
    'create_proposals',
    'edit_proposals',
    'view_answer_bank',
    'edit_answer_bank',
    'view_research',
    'create_research',
  ],
  manager: [
    'view_proposals',
    'create_proposals',
    'edit_proposals',
    'delete_proposals',
    'view_answer_bank',
    'edit_answer_bank',
    'view_research',
    'create_research',
    'manage_users',
  ],
  admin: [
    'view_proposals',
    'create_proposals',
    'edit_proposals',
    'delete_proposals',
    'manage_users',
    'manage_organization',
    'view_answer_bank',
    'edit_answer_bank',
    'view_research',
    'create_research',
  ],
} as const

// Organization context for multi-tenant features
export interface OrganizationContext {
  id: string
  name?: string
  domain?: string
  settings?: {
    [key: string]: unknown
  }
}

// Authentication form types
export interface LoginFormData {
  email: string
}

export interface SignupFormData {
  email: string
  fullName: string
  organizationId: string
  role?: UserRole
}

export interface ResetPasswordFormData {
  email: string
}

// Form validation schemas (for use with zod)
export interface AuthFormErrors {
  email?: string
  fullName?: string
  organizationId?: string
  general?: string
}

// Route protection types
export interface RouteProtectionConfig {
  requireAuth: boolean
  allowedRoles?: UserRole[]
  requiredPermissions?: Permission[]
  redirectTo?: string
}

// Authentication event types
export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

export interface AuthEventData {
  event: AuthEvent
  session: unknown | null
  user: UserProfile | null
  timestamp: Date
}

// Authentication configuration
export interface AuthConfig {
  passwordAuth: {
    enabled: boolean
    minLength: number
    requireSpecialChars: boolean
  }
  session: {
    persistSession: boolean
    autoRefreshToken: boolean
  }
}

// Default auth configuration
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  passwordAuth: {
    enabled: false, // OTP only
    minLength: 8,
    requireSpecialChars: true,
  },
  session: {
    persistSession: true,
    autoRefreshToken: true,
  },
} as const

// Type guards
export const isUserProfile = (user: unknown): user is UserProfile => {
  return !!user && typeof user === 'object' && 'id' in user && typeof (user as any).id === 'string' && 'email' in user && typeof (user as any).email === 'string'
}

export const hasRole = (user: UserProfile | null, role: UserRole): boolean => {
  if (!user) return false
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role]
}

export const hasPermission = (user: UserProfile | null, permission: Permission): boolean => {
  if (!user) return false
  return ROLE_PERMISSIONS[user.role].includes(permission)
}

export const isSameOrganization = (user1: UserProfile | null, user2: UserProfile | null): boolean => {
  if (!user1 || !user2) return false
  return user1.organization_id === user2.organization_id
} 