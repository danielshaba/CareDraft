'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { signupFormSchema, type SignupFormData } from '@/lib/auth.validation'
import { InlineLoader } from '@/components/LoadingSpinner'
import CareDraftLogo from '@/components/ui/CareDraftLogo'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const { signIn, loading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // For invitation flow
  const inviteToken = searchParams?.get('invite')
  const prefilledEmail = searchParams?.get('email')
  const prefilledOrgId = searchParams?.get('org')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    mode: 'onChange',
    defaultValues: {
      email: prefilledEmail || '',
      organizationId: prefilledOrgId || '',
      fullName: '',
      role: 'writer'
    }
  })

  const watchedEmail = watch('email', '')

  const onSubmit = async (data: SignupFormData) => {
    if (isSubmitting || authLoading) return

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      // For now, we'll just send a magic link like login
      // In a real implementation, you'd handle the organization creation/joining here
      const result = await signIn(data.email)

      if (result.error) {
        setSubmitError(result.error.message || 'An error occurred during sign up')
      } else {
        setSubmitSuccess(true)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show success state after magic link is sent
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary-light to-brand-primary-light/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
              We&apos;ve sent a magic link to <span className="font-medium text-brand-primary">{watchedEmail}</span>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Click the link in your email to complete your account setup. The link will expire in 1 hour.
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-brand-primary-light">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false)
                  setSubmitError(null)
                }}
                className="w-full flex justify-center py-2 px-4 border border-brand-primary-light rounded-md shadow-sm text-sm font-medium text-brand-primary-dark bg-white hover:bg-brand-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
              >
                Try a different email
              </button>
              
              <div className="text-center">
                <Link
                  href="/help"
                  className="text-sm text-brand-primary hover:text-brand-primary-dark transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-brand-primary-light to-brand-primary-light/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <CareDraftLogo size="lg" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-primary-dark mb-2">
            {inviteToken ? 'Join your team' : 'Create your account'}
          </h1>
          <p className="text-gray-600">
            {inviteToken 
              ? 'Complete your invitation to get started with CareDraft' 
              : 'Start creating winning care proposals today'
            }
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-brand-primary-light">
          {inviteToken && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    You&apos;ve been invited to join an organization. Complete the form below to activate your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="mt-1">
                <input
                  {...register('fullName')}
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm transition-colors ${
                    errors.fullName
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-brand-primary'
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>
            </div>

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
                  disabled={!!prefilledEmail}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm transition-colors ${
                    errors.email
                      ? 'border-red-300 bg-red-50'
                      : prefilledEmail
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-300 bg-white hover:border-brand-primary'
                  }`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {!inviteToken && (
              <div>
                <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700">
                  Organization setup
                </label>
                <div className="mt-1">
                  <select
                    {...register('organizationId')}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm transition-colors ${
                      errors.organizationId
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select an option</option>
                    <option value="new">Create new organization</option>
                    <option value="join">Join existing organization</option>
                  </select>
                  {errors.organizationId && (
                    <p className="mt-2 text-sm text-red-600">{errors.organizationId.message}</p>
                  )}
                </div>
                
                {!inviteToken && (
                  <p className="mt-2 text-sm text-gray-500">
                    Don&apos;t worry, you can change this later or invite team members after signup.
                  </p>
                )}
              </div>
            )}

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
                    ? 'bg-brand-primary hover:bg-brand-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary'
                    : 'bg-gray-400 cursor-not-allowed'
                } focus:outline-none`}
              >
                {isSubmitting || authLoading ? (
                  <>
                    <InlineLoader size="sm" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
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
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-brand-primary-light rounded-md shadow-sm text-sm font-medium text-brand-primary-dark bg-white hover:bg-brand-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-brand-primary hover:text-brand-primary-dark">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-primary hover:text-brand-primary-dark">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 