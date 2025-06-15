'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { loginFormSchema, type LoginFormData } from '@/lib/auth.validation'
import { InlineLoader } from '@/components/LoadingSpinner'
import { Logo } from '@/components/ui/Logo'
import { useToastActions } from '@/lib/stores/toastStore'
import { formatAuthError } from '@/lib/auth.utils'

// Note: Metadata would normally be exported here, but this is a client component
// The metadata is handled by the layout or a parent server component

export default function LoginPage() {
  const { signIn, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const toast = useToastActions()

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
    setOtpError(null)
    try {
      const result = await signIn(data.email)
      if (result.error) {
        setSubmitError(result.error.message || 'An error occurred during sign in')
        toast.error('Sign In Error', result.error.message || 'An error occurred during sign in')
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
        toast.success('Login Successful', 'You have been logged in successfully.')
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
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" variant="full" />
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter the code</h2>
            <p className="text-gray-600 mb-6">
              We sent a 6-digit code to <span className="font-medium text-teal-500">{watchedEmail}</span>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Enter the code to sign in. The code will expire in 10 minutes.
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-teal-50">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false)
                  setSubmitError(null)
                }}
                className="w-full flex justify-center py-2 px-4 border border-teal-50 rounded-md shadow-sm text-sm font-medium text-teal-600 bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                Try a different email
              </button>
              
              <div className="text-center">
                <Link
                  href="/help"
                  className="text-sm text-teal-500 hover:text-teal-600 transition-colors"
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
            <p className="text-sm text-gray-500 mb-8">
              Enter the code to sign in. The code will expire in 10 minutes.
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
          <h1 className="text-3xl font-bold text-teal-600 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your CareDraft account</p>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-teal-50">
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
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm transition-colors ${
                    errors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-teal-500'
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
                    ? 'bg-teal-500 hover:bg-teal-600 focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                    : 'bg-gray-400 cursor-not-allowed'
                } focus:outline-none`}
              >
                {isSubmitting || authLoading ? (
                  <>
                    <InlineLoader size="sm" />
                    Sending code...
                  </>
                ) : (
                  'Send code'
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
                className="w-full flex justify-center py-2 px-4 border border-teal-50 rounded-md shadow-sm text-sm font-medium text-teal-600 bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                Create an account
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/reset-password"
              className="text-sm text-teal-500 hover:text-teal-600 transition-colors"
            >
              Forgot your email or need help?
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
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
