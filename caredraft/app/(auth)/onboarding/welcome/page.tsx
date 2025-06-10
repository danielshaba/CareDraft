'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Building2, 
  Mail, 
  Search, 
  MapPin, 
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  User
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import CareDraftLogo from '@/components/ui/CareDraftLogo'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase'
import { 
  CompaniesHouseCompany, 
  formatCompanyName, 
  formatCompanyDescription 
} from '@/lib/services/companies-house'

// Validation schema for profile setup
const profileSetupSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  agreedToTerms: z.boolean().refine(val => val, 'You must agree to the terms and conditions'),
  agreedToPrivacy: z.boolean().refine(val => val, 'You must agree to the privacy policy'),
  marketingConsent: z.boolean().optional()
})

type ProfileSetupFormData = z.infer<typeof profileSetupSchema>

export default function OnboardingWelcomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    companyBasicInfo, 
    updateCompanyBasicInfo, 
    nextStep, 
    setLoading, 
    isLoading,
    errors,
    setError,
    clearError 
  } = useOnboardingStore()

  // Company search state
  const [companyResults, setCompanyResults] = useState<CompaniesHouseCompany[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompaniesHouseCompany | null>(null)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  
  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
    watch,
    trigger
  } = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      companyName: companyBasicInfo.name || '',
      fullName: user?.email?.split('@')[0] || '',
      agreedToTerms: companyBasicInfo.agreedToTerms || false,
      agreedToPrivacy: companyBasicInfo.agreedToPrivacy || false,
      marketingConsent: companyBasicInfo.marketingConsent || false
    }
  })

  const watchedCompanyName = watch('companyName')

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.replace('/login')
    }
  }, [user, router])

  // Company search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (watchedCompanyName && watchedCompanyName.length >= 2 && watchedCompanyName !== selectedCompany?.title) {
      setSearchLoading(true)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/companies-house/search?q=${encodeURIComponent(watchedCompanyName)}`)
          const data = await response.json()
          
          if (data.success && data.data?.items) {
            setCompanyResults(data.data.items)
            setShowResults(true)
          } else {
            setCompanyResults([])
            setShowResults(false)
          }
        } catch (error) {
          console.error('Company search error:', error)
          setCompanyResults([])
          setShowResults(false)
        } finally {
          setSearchLoading(false)
        }
      }, 300)
    } else {
      setShowResults(false)
      setSearchLoading(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [watchedCompanyName, selectedCompany])

  // Handle company selection
  const handleCompanySelect = (company: CompaniesHouseCompany) => {
    setSelectedCompany(company)
    setValue('companyName', formatCompanyName(company))
    setShowResults(false)
    
    // Update onboarding store with company info
    updateCompanyBasicInfo({
      name: formatCompanyName(company),
      address: {
        line1: [company.address.premises, company.address.address_line_1].filter(Boolean).join(' ') || '',
        line2: company.address.address_line_2 || '',
        city: company.address.locality || '',
        postcode: company.address.postal_code || '',
        country: company.address.country || 'United Kingdom'
      }
    })
    
    trigger('companyName')
  }

  // Form submission - Update user profile with company information
  const onSubmit = async (data: ProfileSetupFormData) => {
    if (!user) {
      setError('submit', 'No authenticated user found')
      return
    }

    try {
      setIsCreatingProfile(true)
      clearError('submit')
      
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
        console.error('Error updating user profile:', userError)
        setError('submit', 'Failed to update profile. Please try again.')
        return
      }

      console.log('User profile updated successfully')
      
      // Navigate to dashboard since profile is set up
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Profile setup error:', error)
      setError('submit', 'Failed to set up profile. Please try again.')
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
              <CareDraftLogo className="h-12 w-auto" />
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
              {/* Company Name with Autocomplete */}
              <div className="space-y-2 relative">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Company Name
                </Label>
                <div className="relative">
                  <Input
                    {...register('companyName')}
                    ref={searchInputRef}
                    type="text"
                    placeholder="Start typing your company name..."
                    className={`pr-10 ${formErrors.companyName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand-primary'}`}
                    autoComplete="organization"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {!searchLoading && watchedCompanyName && (
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                {/* Company Search Results */}
                <AnimatePresence>
                  {showResults && companyResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                      {companyResults.slice(0, 8).map((company) => (
                        <button
                          key={company.company_number}
                          type="button"
                          onClick={() => handleCompanySelect(company)}
                          className="w-full px-4 py-3 text-left hover:bg-brand-secondary/10 focus:bg-brand-secondary/10 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 text-sm">
                            {formatCompanyName(company)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {company.address_snippet || 'Address not available'}
                          </div>
                          {company.description && (
                            <div className="text-xs text-brand-primary mt-1">
                              {formatCompanyDescription(company)}
                            </div>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {formErrors.companyName && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.companyName.message}
                  </p>
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
                  <Checkbox
                    {...register('agreedToTerms')}
                    id="agreedToTerms"
                    className="mt-1"
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
                  </Label>
                </div>
                {formErrors.agreedToTerms && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.agreedToTerms.message}
                  </p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    {...register('agreedToPrivacy')}
                    id="agreedToPrivacy"
                    className="mt-1"
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
                  </Label>
                </div>
                {formErrors.agreedToPrivacy && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.agreedToPrivacy.message}
                  </p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    {...register('marketingConsent')}
                    id="marketingConsent"
                    className="mt-1"
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
                disabled={isCreatingProfile}
                className="w-full bg-brand-primary hover:bg-brand-accent text-white py-3 text-base font-medium"
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