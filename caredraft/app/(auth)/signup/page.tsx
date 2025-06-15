'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { signupFormSchema, type SignupFormData } from '@/lib/auth.validation'
import { InlineLoader } from '@/components/LoadingSpinner'
import { Logo } from '@/components/ui/Logo'
import { useToastActions } from '@/lib/stores/toastStore'
import { formatAuthError } from '@/lib/auth.utils'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const { signIn, loading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const toast = useToastActions()

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

  // Add state for OTP step
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)

  const onSubmit = async (data: SignupFormData) => {
    if (isSubmitting || authLoading) return
    setIsSubmitting(true)
    setSubmitError(null)
    setOtpError(null)
    try {
      const result = await signIn(data.email)
      if (result.error) {
        setSubmitError(result.error.message || 'An error occurred during sign up')
        toast.error('Sign Up Error', result.error.message || 'An error occurred during sign up')
      } else {
        setOtpStep(true)
        setResendTimer(60)
        // Start resend timer
        const timer = setInterval(() => setResendTimer(t => t > 0 ? t - 1 : 0), 1000)
        setTimeout(() => clearInterval(timer), 60000)
        toast.success('OTP Sent', 'A 6-digit code was sent to your email.')
      }
    } catch (err) {
      setSubmitError('An unexpected error occurred. Please try again.')
      toast.error('Unexpected Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // OTP verification handler
  const handleOtpVerify = async () => {
    setOtpLoading(true)
    setOtpError(null)
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: watchedEmail, token: otp, type: 'email' })
      })
      const result = await response.json()
      if (!result.success) {
        let errorMsg = result.error?.code === 'too_many_requests'
          ? 'Too many attempts. Please wait before trying again.'
          : result.error?.code === 'user_not_found'
          ? 'No account found with this email address.'
          : formatAuthError(result.error || { code: '', message: result.error?.message })
        setOtpError(errorMsg)
        toast.error('OTP Verification Failed', errorMsg)
      } else {
        toast.success('Signup Successful', 'Your account has been created successfully.')
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setOtpError('An unexpected error occurred. Please try again.')
      toast.error('Unexpected Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Resend OTP handler
  const handleResendOtp = async () => {
    setSubmitError(null)
    setOtpError(null)
    setIsSubmitting(true)
    try {
      const result = await signIn(watchedEmail)
      if (result.error) {
        setSubmitError(result.error.message || 'Failed to resend OTP')
        toast.error('Resend OTP Failed', result.error.message || 'Failed to resend OTP')
      } else {
        setResendTimer(60)
        toast.success('OTP Resent', 'A new 6-digit code was sent to your email.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show success state after OTP is sent
  if (otpStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-8">
            <Logo size="lg" variant="full" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter the code</h2>
            <p className="text-gray-600 mb-6">
              We sent a 6-digit code to <span className="font-medium text-teal-500">{watchedEmail}</span>
            </p>
          </div>
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-teal-50">
            <div className="space-y-6">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm"
                placeholder="Enter 6-digit code"
                autoFocus
                disabled={otpLoading}
                aria-label="6-digit OTP code"
                aria-invalid={!!otpError}
                aria-describedby={otpError ? 'otp-error' : undefined}
                role="textbox"
                onPaste={e => {
                  const pasted = e.clipboardData.getData('Text').replace(/\D/g, '')
                  if (pasted.length === 6) setOtp(pasted)
                }}
              />
              {otpError && <p id="otp-error" className="text-sm text-red-600" role="alert">{formatAuthError({ code: otpError, message: otpError })}</p>}
              <button
                type="button"
                onClick={handleOtpVerify}
                disabled={otp.length !== 6 || otpLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all duration-200 ${otp.length === 6 && !otpLoading ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-400 cursor-not-allowed'} focus:outline-none`}
              >
                {otpLoading ? <><InlineLoader size="sm" /> Verifying...</> : 'Verify code'}
              </button>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isSubmitting}
                  className="text-sm text-teal-500 hover:text-teal-600 disabled:text-gray-400"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpStep(false); setOtp(''); setOtpError(null); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Change email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="full" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-600 mb-2">
            {inviteToken ? 'Join your team' : 'Create your account'}
          </h1>
          <p className="text-gray-600">
            {inviteToken 
              ? 'Complete your invitation to get started with CareDraft' 
              : 'Start creating winning care proposals today'
            }
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-teal-50">
          {inviteToken && (
            <div className="mb-6 bg-teal-50 border border-teal-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-teal-800">
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
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm transition-colors ${
                    errors.fullName
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-teal-500'
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
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm transition-colors ${
                    errors.email
                      ? 'border-red-300 bg-red-50'
                      : prefilledEmail
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-300 bg-white hover:border-teal-500'
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
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm transition-colors ${
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
                    ? 'bg-teal-500 hover:bg-teal-600 focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
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
                className="w-full flex justify-center py-2 px-4 border border-teal-50 rounded-md shadow-sm text-sm font-medium text-teal-600 bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-teal-500 hover:text-teal-600">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-teal-500 hover:text-teal-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 
