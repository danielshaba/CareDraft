'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Building2, 
  Mail, 
  ArrowRight,
  AlertCircle,
  User,
  Loader2
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Logo } from '@/components/ui/Logo'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase'


// Validation schema for profile setup
const profileSetupSchema = z.object({
  companyName: z.string().min(1, 'Required').refine(val => val.trim().length >= 2, 'Must be 2+ characters'),
  fullName: z.string().min(1, 'Required').refine(val => val.trim().length >= 2, 'Must be 2+ characters'), 
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
  agreedToPrivacy: z.boolean().refine(val => val === true, 'You must agree to the privacy policy'),
  marketingConsent: z.boolean().optional()
})

type ProfileSetupFormData = z.infer<typeof profileSetupSchema>

export default function OnboardingWelcomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    updateCompanyBasicInfo, 
    isLoading, 
    errors, 
    setError, 
    clearError 
  } = useOnboardingStore()

  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  




  // Form setup with simple validation
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting },
    watch
  } = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      companyName: '',
      fullName: '',
      agreedToTerms: false,
      agreedToPrivacy: false,
      marketingConsent: false
    }
  })

  // Watch form values for manual validation
  const companyName = watch('companyName')
  const fullName = watch('fullName')
  const agreedToTerms = watch('agreedToTerms')
  const agreedToPrivacy = watch('agreedToPrivacy')

  // Manual validation for button state
  const isFormValid = 
    companyName && companyName.trim().length >= 2 &&
    fullName && fullName.trim().length >= 2 &&
    agreedToTerms === true &&
    agreedToPrivacy === true

  const isButtonDisabled = !isFormValid || isSubmitting || isCreatingProfile || isLoading

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.replace('/login')
    }
  }, [user, router])



  // Form submission - Update user profile with company information
  const onSubmit = async (data: ProfileSetupFormData) => {
    if (!user) {
      setError('submit', 'No authenticated user found')
      return
    }

    try {
      setIsCreatingProfile(true)
      clearError('submit')
      
      console.log('Submitting form with data:', data)
      
      const supabase = createClient()
      
      // Update onboarding store
      updateCompanyBasicInfo({
        name: data.companyName,
        adminEmail: user.email || '',
        agreedToTerms: data.agreedToTerms,
        agreedToPrivacy: data.agreedToPrivacy,
        marketingConsent: data.marketingConsent || false
      })

      // Update the existing user profile with the full name and company info
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: data.fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (userError) {
        console.error('Error updating user:', userError)
        setError('submit', 'Failed to update profile. Please try again.')
        return
      }

      // Navigate to next step
      router.push('/onboarding/profile')
    } catch (error) {
      console.error('Form submission error:', error)
      setError('submit', 'An unexpected error occurred. Please try again.')
    } finally {
      setIsCreatingProfile(false)
    }
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary via-white to-brand-secondary/50 flex items-center justify-center p-4">
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
            <CardTitle className="text-2xl font-bold text-brand-primary">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-gray-600">
              Welcome! Let's set up your CareDraft account to get started
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Display authenticated user email */}
            <div className="bg-brand-secondary/20 p-3 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                Authenticated as: <span className="font-medium ml-1">{user.email}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Company Name
                </Label>
                  <Input
                    {...register('companyName')}
                    type="text"
                  placeholder="Enter your company name"
                  className={formErrors.companyName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand-primary'}
                    autoComplete="organization"
                  />
                {formErrors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.companyName.message}</p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </Label>
                <Input
                  {...register('fullName')}
                  type="text"
                  placeholder="Enter your full name"
                  className={formErrors.fullName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand-primary'}
                  autoComplete="name"
                />
                {formErrors.fullName && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.fullName.message}
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    {...register('agreedToTerms')}
                    className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  />
                  <Label htmlFor="agreedToTerms" className="text-sm text-gray-700 leading-5">
                    I agree to the{' '}
                    <Link 
                      href="/terms" 
                      className="text-brand-primary hover:text-brand-accent underline"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link 
                      href="/conditions" 
                      className="text-brand-primary hover:text-brand-accent underline"
                      target="_blank"
                    >
                      Conditions of Use
                    </Link>
                  </Label>
                </div>
                {formErrors.agreedToTerms && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.agreedToTerms.message}</p>
                )}

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreedToPrivacy"
                    {...register('agreedToPrivacy')}
                    className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  />
                  <Label htmlFor="agreedToPrivacy" className="text-sm text-gray-700 leading-5">
                    I agree to the{' '}
                    <Link 
                      href="/privacy" 
                      className="text-brand-primary hover:text-brand-accent underline"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                    {' '}and consent to the collection and processing of my personal data
                  </Label>
                </div>
                {formErrors.agreedToPrivacy && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.agreedToPrivacy.message}</p>
                )}

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="marketingConsent"
                    {...register('marketingConsent')}
                    className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  />
                  <Label htmlFor="marketingConsent" className="text-sm text-gray-700 leading-5">
                    I would like to receive product updates and marketing communications
                  </Label>
                </div>
              </div>





              {/* Error Display */}
              {errors.submit && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {errors.submit}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full bg-brand-primary hover:bg-brand-accent text-white py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingProfile ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Setting up your account...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 
