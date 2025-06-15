'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string) => Promise<{ error: { message: string } | null }>
  signUp: (email: string) => Promise<{ error: { message: string } | null }>
  signOut: () => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Memoize the supabase client to prevent recreating it
  const supabase = useMemo(() => createClient(), [])
  
  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user) {
          setUser(user)
          const { data: { session } } = await supabase.auth.getSession()
          setSession(session)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, [supabase])
  
  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) {
        return { error: { message: error.message } }
      }
      return { error: null }
    } catch (error) {
      console.error('Error in signIn:', error)
      return { error: { message: 'An unexpected error occurred' } }
    }
  }
  
  // Sign up function (OTP only)
  const signUp = async (email: string) => {
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, type: 'email' })
      })
      const result = await response.json()
      if (!result.success) {
        return { error: { message: result.error?.message || 'Failed to send OTP', code: undefined, status: undefined } }
      }
      return { error: null }
    } catch (error) {
      console.error('Error in signUp:', error)
      return { error: { message: 'An unexpected error occurred' } }
    }
  }
  
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { error: error.message }
      }
      setUser(null)
      setSession(null)
      return { error: null }
    } catch (error) {
      console.error('Error in signOut:', error)
      return { error: 'An unexpected error occurred' }
    }
  }
  
  // Reset password function (OTP only)
  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, type: 'email' })
      })
      const result = await response.json()
      if (!result.success) {
        return { error: result.error?.message || 'Failed to send OTP for password reset' }
      }
      return { error: null }
    } catch (error) {
      console.error('Error in resetPassword:', error)
      return { error: 'An unexpected error occurred' }
    }
  }
  
  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useUser() {
  const { user } = useAuth()
  return user
} 