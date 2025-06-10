'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { loginFormSchema, type LoginFormData } from '@/lib/auth.validation'
import { InlineLoader } from '@/components/LoadingSpinner'
import CareDraftLogo from '@/components/ui/CareDraftLogo'

// Note: Metadata would normally be exported here, but this is a client component
// The metadata is handled by the layout or a parent server component

export default function LoginPage() {
  const { signIn, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onChange'
  })

  const watchedEmail = watch('email', '')

  // Check for URL error parameters on component mount
  useEffect(() => {
    const urlError = searchParams.get('error')
    const urlMessage = searchParams.get('message')
    
    if (urlError && urlMessage) {
      setSubmitError(decodeURIComponent(urlMessage))
      // Clear the URL parameters to prevent the error from persisting on reload
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting || authLoading) return

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const result = await signIn(data.email)

      if (result.error) {
        setSubmitError(result.error.message || 'An error occurred during sign in')
      } else {
        setSubmitSuccess(true)
        // Don&apos;t redirect immediately - user needs to check email
      }
    } catch (err) {
      console.error('Login error:', err)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show success state after magic link is sent
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <CareDraftLogo size="lg" />
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We&apos;ve sent a magic link to <span className="font-medium text-brand-500">{watchedEmail}</span>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Click the link in your email to sign in. The link will expire in 1 hour.
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-brand-50">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false)
                  setSubmitError(null)
                }}
                className="w-full flex justify-center py-2 px-4 border border-brand-50 rounded-md shadow-sm text-sm font-medium text-brand-600 bg-white hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
              >
                Try a different email
              </button>
              
              <div className="text-center">
                <Link
                  href="/help"
                  className="text-sm text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Didn&apos;t receive the email? Get help
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <CareDraftLogo size="lg" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your CareDraft account</p>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-brand-50">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm transition-colors ${
                    errors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-brand-500'
                  }`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={!isValid || isSubmitting || authLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                  isValid && !isSubmitting && !authLoading
                    ? 'bg-brand-500 hover:bg-brand-600 focus:ring-2 focus:ring-offset-2 focus:ring-brand-500'
                    : 'bg-gray-400 cursor-not-allowed'
                } focus:outline-none`}
              >
                {isSubmitting || authLoading ? (
                  <>
                    <InlineLoader size="sm" />
                    Sending magic link...
                  </>
                ) : (
                  'Send magic link'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to CareDraft?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/signup"
                className="w-full flex justify-center py-2 px-4 border border-brand-50 rounded-md shadow-sm text-sm font-medium text-brand-600 bg-white hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
              >
                Create an account
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/reset-password"
              className="text-sm text-brand-500 hover:text-brand-600 transition-colors"
            >
              Forgot your email or need help?
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-brand-500 hover:text-brand-600">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-500 hover:text-brand-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 