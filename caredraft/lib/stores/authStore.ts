import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createClient } from '@supabase/supabase-js'
import type { AuthStore, AuthUser, UserPermissions } from '@/lib/types/store.types'
import type { Database } from '@/lib/database.types'
import type { Session, User } from '@supabase/supabase-js'

// Create Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Default user permissions
const DEFAULT_PERMISSIONS: UserPermissions = {
  canCreateProposals: false,
  canEditProposals: false,
  canDeleteProposals: false,
  canManageUsers: false,
  canManageOrganization: false,
  canApproveProposals: false,
  canViewAnalytics: false,
  canManageSettings: false,
}

// Permission matrix based on user roles
const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  viewer: {
    canCreateProposals: false,
    canEditProposals: false,
    canDeleteProposals: false,
    canManageUsers: false,
    canManageOrganization: false,
    canApproveProposals: false,
    canViewAnalytics: false,
    canManageSettings: false,
  },
  writer: {
    canCreateProposals: true,
    canEditProposals: true,
    canDeleteProposals: false,
    canManageUsers: false,
    canManageOrganization: false,
    canApproveProposals: false,
    canViewAnalytics: false,
    canManageSettings: false,
  },
  manager: {
    canCreateProposals: true,
    canEditProposals: true,
    canDeleteProposals: true,
    canManageUsers: false,
    canManageOrganization: false,
    canApproveProposals: true,
    canViewAnalytics: true,
    canManageSettings: false,
  },
  admin: {
    canCreateProposals: true,
    canEditProposals: true,
    canDeleteProposals: true,
    canManageUsers: true,
    canManageOrganization: true,
    canApproveProposals: true,
    canViewAnalytics: true,
    canManageSettings: true,
  },
}

// Helper function to get permissions based on user role
const getPermissionsForRole = (role?: string): UserPermissions => {
  return ROLE_PERMISSIONS[role || 'viewer'] || DEFAULT_PERMISSIONS
}

// Helper function to create AuthUser from User and database user data
const createAuthUser = (user: User | null, dbUser?: unknown, session?: Session | null): AuthUser | null => {
  if (!user || !dbUser) return null

  return {
    ...dbUser,
    session,
    permissions: getPermissionsForRole(dbUser.role),
  }
}

// Initial state
const initialState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  isSigningIn: false,
  isSigningOut: false,
  isSigningUp: false,
  error: null,
  lastError: null,
  sessionExpiresAt: null,
  refreshAttempts: 0,
  maxRefreshAttempts: 3,
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Auth operations
          signIn: async (email: string, password: string) => {
            set((state) => {
              state.isSigningIn = true
              state.error = null
            })

            try {
              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
              })

              if (error) {
                set((state) => {
                  state.isSigningIn = false
                  state.error = error.message
                  state.lastError = new Date()
                })
                return { success: false, error: error.message }
              }

              // Get user data from database
              if (data.user) {
                const { data: dbUser } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', data.user.id)
                  .single()

                const authUser = createAuthUser(data.user, dbUser, data.session)

                set((state) => {
                  state.user = authUser
                  state.session = data.session
                  state.isAuthenticated = true
                  state.isSigningIn = false
                  state.isLoading = false
                  state.error = null
                  state.sessionExpiresAt = data.session?.expires_at 
                    ? new Date(data.session.expires_at * 1000) 
                    : null
                })
              }

              return { success: true }
            } catch (error: unknown) {
              const errorMessage = error.message || 'An unexpected error occurred'
              set((state) => {
                state.isSigningIn = false
                state.error = errorMessage
                state.lastError = new Date()
              })
              return { success: false, error: errorMessage }
            }
          },

          signUp: async (email: string, password: string, userData?: unknown) => {
            set((state) => {
              state.isSigningUp = true
              state.error = null
            })

            try {
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: userData || {},
                },
              })

              if (error) {
                set((state) => {
                  state.isSigningUp = false
                  state.error = error.message
                  state.lastError = new Date()
                })
                return { success: false, error: error.message }
              }

              set((state) => {
                state.isSigningUp = false
              })

              return { success: true }
            } catch (error: unknown) {
              const errorMessage = error.message || 'An unexpected error occurred'
              set((state) => {
                state.isSigningUp = false
                state.error = errorMessage
                state.lastError = new Date()
              })
              return { success: false, error: errorMessage }
            }
          },

          signOut: async () => {
            set((state) => {
              state.isSigningOut = true
            })

            try {
              await supabase.auth.signOut()
              
              set((state) => {
                state.user = null
                state.session = null
                state.isAuthenticated = false
                state.isSigningOut = false
                state.isLoading = false
                state.error = null
                state.sessionExpiresAt = null
                state.refreshAttempts = 0
              })
            } catch (error: unknown) {
              set((state) => {
                state.isSigningOut = false
                state.error = error.message || 'Sign out failed'
                state.lastError = new Date()
              })
            }
          },

          // Session management
          refreshSession: async () => {
            const state = get()
            
            if (state.refreshAttempts >= state.maxRefreshAttempts) {
              return false
            }

            set((state) => {
              state.refreshAttempts += 1
            })

            try {
              const { data, error } = await supabase.auth.refreshSession()

              if (error || !data.session) {
                if (state.refreshAttempts >= state.maxRefreshAttempts) {
                  // Max attempts reached, sign out
                  get().signOut()
                }
                return false
              }

              // Update session
              set((state) => {
                state.session = data.session
                state.sessionExpiresAt = data.session?.expires_at 
                  ? new Date(data.session.expires_at * 1000) 
                  : null
                state.refreshAttempts = 0
              })

              return true
            } catch {
              return false
            }
          },

          validateSession: async () => {
            try {
              const { data, error } = await supabase.auth.getSession()

              if (error || !data.session) {
                set((state) => {
                  state.user = null
                  state.session = null
                  state.isAuthenticated = false
                  state.isLoading = false
                })
                return false
              }

              // Get current user data
              const { data: dbUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.session.user.id)
                .single()

              const authUser = createAuthUser(data.session.user, dbUser, data.session)

              set((state) => {
                state.user = authUser
                state.session = data.session
                state.isAuthenticated = true
                state.isLoading = false
                state.sessionExpiresAt = data.session?.expires_at 
                  ? new Date(data.session.expires_at * 1000) 
                  : null
              })

              return true
            } catch {
              set((state) => {
                state.user = null
                state.session = null
                state.isAuthenticated = false
                state.isLoading = false
              })
              return false
            }
          },

          setSession: (session: Session | null) => {
            set((state) => {
              state.session = session
              state.sessionExpiresAt = session?.expires_at 
                ? new Date(session.expires_at * 1000) 
                : null
            })
          },

          // User management
          updateUser: async (updates: unknown) => {
            const state = get()
            if (!state.user) return false

            try {
              const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', state.user.id)
                .select()
                .single()

              if (error) return false

              // Update user in store
              set((state) => {
                if (state.user && data) {
                  state.user = {
                    ...state.user,
                    ...data,
                    permissions: getPermissionsForRole(data.role),
                  }
                }
              })

              return true
            } catch {
              return false
            }
          },

          updatePermissions: (permissions: UserPermissions) => {
            set((state) => {
              if (state.user) {
                state.user.permissions = permissions
              }
            })
          },

          // State management
          setLoading: (loading: boolean) => {
            set((state) => {
              state.isLoading = loading
            })
          },

          setError: (error: string | null) => {
            set((state) => {
              state.error = error
              if (error) {
                state.lastError = new Date()
              }
            })
          },

          clearError: () => {
            set((state) => {
              state.error = null
            })
          },

          reset: () => {
            set(() => ({ ...initialState }))
          },
        }))
      ),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
)

// Initialize auth state on store creation
supabase.auth.onAuthStateChange(async (event, session) => {
  const store = useAuthStore.getState()

  switch (event) {
    case 'SIGNED_IN':
    case 'TOKEN_REFRESHED':
      if (session?.user) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const authUser = createAuthUser(session.user, dbUser, session)

        useAuthStore.setState({
          user: authUser,
          session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          sessionExpiresAt: session.expires_at 
            ? new Date(session.expires_at * 1000) 
            : null,
        })
      }
      break

    case 'SIGNED_OUT':
      useAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        sessionExpiresAt: null,
        refreshAttempts: 0,
      })
      break

    default:
      break
  }
})

// Auto session refresh
let refreshTimer: NodeJS.Timeout | null = null

useAuthStore.subscribe(
  (state) => state.sessionExpiresAt,
  (sessionExpiresAt) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }

    if (sessionExpiresAt) {
      const now = new Date()
      const expiresAt = new Date(sessionExpiresAt)
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      
      // Refresh 5 minutes before expiry
      const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000)

      refreshTimer = setTimeout(() => {
        useAuthStore.getState().refreshSession()
      }, refreshTime)
    }
  }
)

export default useAuthStore 