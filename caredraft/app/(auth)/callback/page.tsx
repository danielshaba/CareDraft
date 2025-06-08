'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FullscreenLoader, CenteredLoader } from '@/components/LoadingSpinner'
import Link from 'next/link'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        
        // Get the code from URL params
        const code = searchParams?.get('code')
        const errorParam = searchParams?.get('error')
        const errorDescription = searchParams?.get('error_description')
        
        // Handle error states from URL
        if (errorParam) {
          setError(errorDescription || 'Authentication failed. Please try again.')
          setLoading(false)
          return
        }

        // If no code, something went wrong
        if (!code) {
          setError('No authentication code found. Please try signing in again.')
          setLoading(false)
          return
        }

        // Exchange the code for a session
        const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (authError) {
          console.error('Auth callback error:', authError)
          setError('Failed to verify authentication. Please try signing in again.')
          setLoading(false)
          return
        }

        if (data.session) {
          setSuccess(true)
          setLoading(false)
          
          // Get redirect destination
          const redirectTo = searchParams?.get('redirectTo') || '/dashboard'
          
          // Small delay to show success state
          setTimeout(() => {
            router.push(redirectTo)
          }, 1500)
        } else {
          setError('Authentication session could not be established. Please try again.')
          setLoading(false)
        }
      } catch (callbackError) {
        console.error('Callback handling error:', callbackError)
        setError('An unexpected error occurred during authentication.')
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  // Show loading state
  if (loading) {
    return <FullscreenLoader message="Verifying your authentication..." />
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CareDraft!</h2>
            <p className="text-gray-600 mb-6">
              Your authentication was successful. You&apos;re being redirected to your dashboard.
            </p>
            <div className="inline-flex items-center">
              <CenteredLoader message="Redirecting..." className="min-h-0" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-8">
            {error || 'We encountered an issue while signing you in.'}
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Try signing in again
            </Link>
            
            <Link
              href="/signup"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Create new account
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/help"
              className="text-sm text-red-600 hover:text-red-500 transition-colors"
            >
              Contact support for help
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 