'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Logo } from '@/components/ui/Logo'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

export default function VerifyEmailPage() {
  const router = useRouter()
  const { 
    companyBasicInfo, 
    emailVerificationSent,
    emailVerified,
    setEmailVerificationSent,
    setEmailVerified,
    nextStep,
    previousStep,
    isLoading,
    setLoading,
    errors,
    setError,
    clearError
  } = useOnboardingStore()

  const [resendCooldown, setResendCooldown] = useState(0)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'sent' | 'verified' | 'error'>('pending')

  // Auto-redirect if already verified
  useEffect(() => {
    if (emailVerified) {
      nextStep()
      router.push('/onboarding/profile')
    }
  }, [emailVerified, nextStep, router])

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [resendCooldown])

  // Initial email send
  useEffect(() => {
    if (!emailVerificationSent && companyBasicInfo.adminEmail) {
      sendVerificationEmail()
    }
  }, [])

  const sendVerificationEmail = async () => {
    if (!companyBasicInfo.adminEmail) {
      setError('email', 'No email address found. Please go back and complete the signup form.')
      return
    }

    try {
      setLoading(true)
      clearError('email')
      
      // TODO: Implement actual email sending with Supabase
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setEmailVerificationSent(true)
      setVerificationStatus('sent')
      setResendCooldown(60) // 60 second cooldown
      
    } catch (error) {
      console.error('Failed to send verification email:', error)
      setError('email', 'Failed to send verification email. Please try again.')
      setVerificationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return
    
    await sendVerificationEmail()
  }

  const handleBackToSignup = () => {
    previousStep()
    router.push('/onboarding/welcome')
  }

  const handleSkipForNow = () => {
    // Allow users to skip verification for development/demo purposes
    setEmailVerified(true)
    nextStep()
    router.push('/onboarding/profile')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light via-white to-brand-light flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Logo size="lg" variant="full" />
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-brand-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-brand-primary">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              We've sent a verification link to{' '}
              <span className="font-medium text-brand-primary">
                {companyBasicInfo.adminEmail}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {verificationStatus === 'sent' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verification Email Sent!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please check your inbox and click the verification link to continue.
                </p>
                <p className="text-xs text-gray-500">
                  Don't forget to check your spam or junk folder if you don't see the email.
                </p>
              </motion.div>
            )}

            {verificationStatus === 'error' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {errors.email || 'Failed to send verification email. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {verificationStatus === 'verified' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email Verified Successfully!
                </h3>
                <p className="text-sm text-gray-600">
                  Redirecting you to complete your profile...
                </p>
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Resend Email Button */}
              <Button
                onClick={handleResendEmail}
                disabled={isLoading || resendCooldown > 0}
                variant="outline"
                className="w-full border-brand-primary text-brand-primary hover:bg-brand-light"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {resendCooldown > 0 
                  ? `Resend in ${resendCooldown}s` 
                  : isLoading 
                    ? 'Sending...' 
                    : 'Resend Verification Email'
                }
              </Button>

              {/* Back to Signup */}
              <Button
                onClick={handleBackToSignup}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Signup
              </Button>

              {/* Skip for Development (remove in production) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleSkipForNow}
                    variant="ghost"
                    className="w-full text-xs text-gray-500 hover:text-gray-700"
                  >
                    Skip verification (dev only)
                  </Button>
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Having trouble?{' '}
                <button className="text-brand-primary hover:underline">
                  Contact support
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

