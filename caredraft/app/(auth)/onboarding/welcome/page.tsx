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
  Lock, 
  Search, 
  MapPin, 
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import CareDraftLogo from '@/components/ui/CareDraftLogo'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { 
  CompaniesHouseCompany, 
  formatCompanyName, 
  formatCompanyDescription 
} from '@/lib/services/companies-house'

// Validation schema
const signupSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  adminEmail: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  agreedToTerms: z.boolean().refine(val => val, 'You must agree to the terms and conditions'),
  agreedToPrivacy: z.boolean().refine(val => val, 'You must agree to the privacy policy'),
  marketingConsent: z.boolean().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type SignupFormData = z.infer<typeof signupSchema>

export default function OnboardingWelcomePage() {
  const router = useRouter()
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
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
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      companyName: companyBasicInfo.name || '',
      adminEmail: companyBasicInfo.adminEmail || '',
      password: '',
      confirmPassword: '',
      agreedToTerms: companyBasicInfo.agreedToTerms || false,
      agreedToPrivacy: companyBasicInfo.agreedToPrivacy || false,
      marketingConsent: companyBasicInfo.marketingConsent || false
    }
  })

  const watchedCompanyName = watch('companyName')

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

  // Form submission
  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true)
      clearError('submit')
      
      // Update onboarding store
      updateCompanyBasicInfo({
        name: data.companyName,
        adminEmail: data.adminEmail,
        password: data.password,
        confirmPassword: data.confirmPassword,
        agreedToTerms: data.agreedToTerms,
        agreedToPrivacy: data.agreedToPrivacy,
        marketingConsent: data.marketingConsent || false
      })

      // TODO: Create user account with Supabase
      // For now, just proceed to email verification
      
      // Navigate to email verification step
      nextStep()
      router.push('/onboarding/verify-email')
      
    } catch (error) {
      console.error('Signup error:', error)
      setError('submit', 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
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
              <CareDraftLogo className="h-12 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-brand-primary">
              Welcome to CareDraft
            </CardTitle>
            <CardDescription className="text-gray-600">
              Let's set up your account to get started with intelligent tender management
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
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
                          className="w-full px-4 py-3 text-left hover:bg-brand-light focus:bg-brand-light focus:outline-none border-b border-gray-100 last:border-b-0"
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

              {/* Admin Email */}
              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Admin Email Address
                </Label>
                <Input
                  {...register('adminEmail')}
                  type="email"
                  placeholder="admin@yourcompany.com"
                  className={formErrors.adminEmail ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand-primary'}
                  autoComplete="email"
                />
                {formErrors.adminEmail && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.adminEmail.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    className={`pr-10 ${formErrors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand-primary'}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className={`pr-10 ${formErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand-primary'}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    {...register('agreedToTerms')}
                    className="mt-1"
                  />
                  <div className="text-sm text-gray-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-brand-primary hover:underline" target="_blank">
                      Terms and Conditions
                    </Link>
                    {formErrors.agreedToTerms && (
                      <p className="text-red-600 text-xs mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {formErrors.agreedToTerms.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    {...register('agreedToPrivacy')}
                    className="mt-1"
                  />
                  <div className="text-sm text-gray-600">
                    I agree to the{' '}
                    <Link href="/privacy" className="text-brand-primary hover:underline" target="_blank">
                      Privacy Policy
                    </Link>
                    {formErrors.agreedToPrivacy && (
                      <p className="text-red-600 text-xs mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {formErrors.agreedToPrivacy.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    {...register('marketingConsent')}
                    className="mt-1"
                  />
                  <div className="text-sm text-gray-600">
                    I would like to receive updates about new features and tender opportunities
                    <span className="text-xs text-gray-500 block mt-1">(Optional)</span>
                  </div>
                </div>
              </div>

              {/* Data Security Notice */}
              <Alert className="bg-brand-light/50 border-brand-primary/30">
                <Shield className="h-4 w-4 text-brand-primary" />
                <AlertDescription className="text-sm text-gray-700">
                  <strong>Your data is secure:</strong> We use enterprise-grade encryption and never use your data to retrain LLMs without explicit consent.
                </AlertDescription>
              </Alert>

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
                disabled={isLoading}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-medium py-3 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-brand-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 