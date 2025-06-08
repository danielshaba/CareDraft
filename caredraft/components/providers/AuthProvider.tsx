'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

// Types for our auth context
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password?: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// AuthProvider component
interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Create client once and memoize it to prevent rerenders
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // Get initial user - using getUser() instead of getSession() for security
    const getInitialAuth = async () => {
      try {
        // IMPORTANT: Only call getUser() once on mount - middleware handles session refresh
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Error getting user:', userError)
          setUser(null)
          setSession(null)
        } else if (user) {
          // User is authenticated, get the session for additional data
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) {
            console.error('Error getting session:', sessionError)
            // Still set the user even if session fails
            setUser(user)
            setSession(null)
          } else {
            setUser(user)
            setSession(session)
          }
        } else {
          // No user
          setUser(null)
          setSession(null)
        }
      } catch (err) {
        console.error('Error in getInitialAuth:', err)
        setUser(null)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialAuth()

    // IMPORTANT: Do NOT use onAuthStateChange listener in AuthProvider - causes infinite loops
    // The middleware handles session refresh automatically
  }, [])

  // Sign in function (supports both password and magic link)
  const signIn = async (email: string, password?: string) => {
    try {
      setLoading(true)
      if (password) {
        // Password-based sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        return { error }
      } else {
        // Magic link sign in
        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : 'http://localhost:3000/api/auth/callback'
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
          },
        })
        return { error }
      }
    } catch (err) {
      console.error('Error in signIn:', err)
      return { error: err as AuthError }
    } finally {
      setLoading(false)
    }
  }

  // Sign up function (supports both password and magic link)
  const signUp = async (email: string, password?: string) => {
    try {
      setLoading(true)
      if (password) {
        // Password-based sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        return { error }
      } else {
        // Magic link sign up (same as sign in for magic link)
        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : 'http://localhost:3000/api/auth/callback'
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
          },
        })
        return { error }
      }
    } catch (err) {
      console.error('Error in signUp:', err)
      return { error: err as AuthError }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : 'http://localhost:3000/auth/reset-password'
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      return { error }
    } catch (err) {
      console.error('Error in resetPassword:', err)
      return { error: err as AuthError }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 