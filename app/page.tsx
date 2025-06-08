'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '../caredraft/lib/supabase'
import { useAuth } from '../caredraft/components/providers/MinimalAuthProvider'
import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  const { user, loading } = useAuth()
  // const user = null // Temporarily hardcode to test
  // const loading = false // Temporarily hardcode to test
  const [supabaseStatus, setSupabaseStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [envStatus, setEnvStatus] = useState<boolean>(false)

  useEffect(() => {
    // Test environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setEnvStatus(!!(url && key))

    // Test Supabase connection
    const testConnection = async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Supabase connection error:', error)
          setSupabaseStatus('error')
        } else {
          console.log('✅ Supabase connection successful')
          setSupabaseStatus('connected')
        }
      } catch (error) {
        console.error('❌ Supabase connection failed:', error)
        setSupabaseStatus('error')
      }
    }

    testConnection()
  }, [])

  const handleTestSignUp = async () => {
    const testEmail = 'test@caredraft.com'
    const testPassword = 'testpassword123'
    // const { error } = await signUp(testEmail, testPassword)
    if (error) {
      console.error('Sign up error:', error)
    } else {
      console.log('Sign up successful!')
    }
  }

  const handleTestSignIn = async () => {
    const testEmail = 'test@caredraft.com'
    const testPassword = 'testpassword123'
    // const { error } = await signIn(testEmail, testPassword)
    if (error) {
      console.error('Sign in error:', error)
    } else {
      console.log('Sign in successful!')
    }
  }

  const handleSignOut = async () => {
    // const { error } = await signOut()
    if (error) {
      console.error('Sign out error:', error)
    } else {
      console.log('Sign out successful!')
    }
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to <span className="text-brand-primary">CareDraft</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            AI-Powered Bid Writing for UK Care Providers. Transform your tender responses 
            with intelligent assistance and win more contracts.
          </p>
          
          {/* System Status */}
          <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">🔧 System Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center gap-2">
                <span>Environment Variables:</span>
                <span className={envStatus ? 'text-green-600' : 'text-red-600'}>
                  {envStatus ? '✅ Configured' : '❌ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>Supabase Connection:</span>
                <span className={
                  supabaseStatus === 'connected' ? 'text-green-600' : 
                  supabaseStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
                }>
                  {supabaseStatus === 'connected' ? '✅ Connected' : 
                   supabaseStatus === 'error' ? '❌ Error' : '⏳ Testing...'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>Auth Provider:</span>
                <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                  {loading ? '⏳ Loading...' : '✅ Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Authentication Status */}
          <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">🔐 Authentication Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center gap-2">
                <span>User Status:</span>
                <span className={user ? 'text-green-600' : 'text-slate-600'}>
                  {user ? `✅ Signed in as ${user.email}` : '👤 Not signed in'}
                </span>
              </div>
              {/* session && (
                <div className="flex items-center justify-center gap-2">
                  <span>Session:</span>
                  <span className="text-green-600">✅ Active</span>
                </div>
              ) */}
            </div>
            
            {/* Auth Controls */}
            <div className="mt-4 flex gap-2 justify-center">
              {!user ? (
                <>
                  <button
                    onClick={handleTestSignUp}
                    className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-primary-dark text-sm"
                    disabled={loading}
                  >
                    Test Sign Up
                  </button>
                  <button
                    onClick={handleTestSignIn}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    disabled={loading}
                  >
                    Test Sign In
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  disabled={loading}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div className="p-6 border border-slate-200 rounded-lg">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">📄 Extract</h3>
              <p className="text-slate-600">
                Automatically extract key requirements from tender documents
              </p>
            </div>
            <div className="p-6 border border-slate-200 rounded-lg">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">💡 Brainstorm</h3>
              <p className="text-slate-600">
                Generate tailored responses with AI-powered insights
              </p>
            </div>
            <div className="p-6 border border-slate-200 rounded-lg">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">✍️ Draft Builder</h3>
              <p className="text-slate-600">
                Professional rich-text editor for crafting winning bids
              </p>
            </div>
          </div>
          <div className="mt-12">
            <p className="text-sm text-slate-500">
              Next.js 15 + TypeScript + Tailwind CSS + Supabase + Auth
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Development Environment Ready ✅
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 