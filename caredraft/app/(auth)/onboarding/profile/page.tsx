'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Building2, 
  Users, 
  DollarSign, 
  Calendar,
  Award,
  Shield,
  CheckCircle,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  X,
  AlertCircle,
  Loader2,
  Quote
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Logo } from '@/components/ui/Logo'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

// Validation schema
const companyProfileSchema = z.object({
  // Company Overview
  sector: z.enum(['domiciliary', 'residential', 'supported_living', 'other'], {
    required_error: 'Please select your company sector'
  }),
  staffCount: z.number().min(1, 'Staff count must be at least 1'),
  annualTurnover: z.number().min(0, 'Annual turnover cannot be negative'),
  establishedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  
  // Core Accreditations
  accreditations: z.object({
    iso9001: z.boolean(),
    iso14001: z.boolean(),
    cqcRating: z.enum(['outstanding', 'good', 'requires_improvement', 'inadequate']).nullable().optional(),
    cyberEssentials: z.boolean(),
    cyberEssentialsPlus: z.boolean(),
    soc2: z.boolean(),
    other: z.array(z.string()).optional()
  }),
  
  // Awards
  awards: z.array(z.object({
    title: z.string().min(1, 'Award title is required'),
    year: z.number().min(1900).max(new Date().getFullYear()),
    description: z.string().optional()
  })).optional(),
  
  // Testimonials
  testimonials: z.array(z.object({
    clientName: z.string().min(1, 'Client name is required'),
    quote: z.string().min(10, 'Quote must be at least 10 characters'),
    position: z.string().optional(),
    company: z.string().optional()
  })).optional(),
  
  // About Us Content
  companyDescription: z.string().min(50, 'Company description must be at least 50 characters'),
  missionStatement: z.string().optional(),
  valuesStatement: z.string().optional()
})

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>

const sectorOptions = [
  { value: 'domiciliary', label: 'Domiciliary Care' },
  { value: 'residential', label: 'Residential Care' },
  { value: 'supported_living', label: 'Supported Living' },
  { value: 'other', label: 'Other Care Services' }
]

const cqcRatingOptions = [
  { value: 'outstanding', label: 'Outstanding', color: 'text-green-600' },
  { value: 'good', label: 'Good', color: 'text-brand-600' },
  { value: 'requires_improvement', label: 'Requires Improvement', color: 'text-yellow-600' },
  { value: 'inadequate', label: 'Inadequate', color: 'text-red-600' }
]

export default function OnboardingProfilePage() {
  const router = useRouter()
  
  // Add error boundary for onboarding store
  let onboardingStoreData
  try {
    onboardingStoreData = useOnboardingStore()
  } catch (error) {
    console.error('Error accessing onboarding store:', error)
    // Fallback to basic navigation
    router.replace('/onboarding/welcome')
    return <div>Loading...</div>
  }
  
  const { 
    companyProfile, 
    updateCompanyProfile, 
    nextStep, 
    previousStep,
    setLoading, 
    isLoading,
    errors,
    setError,
    clearError 
  } = onboardingStoreData

  const [otherAccreditations, setOtherAccreditations] = useState<string[]>(companyProfile?.accreditations?.other || [])
  const [newAccreditation, setNewAccreditation] = useState('')

  // Form setup with simplified validation mode
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isValid },
    control,
    setValue
  } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      sector: companyProfile?.sector || 'domiciliary',
      staffCount: companyProfile?.staffCount || 1,
      annualTurnover: companyProfile?.annualTurnover || 0,
      establishedYear: companyProfile?.establishedYear || undefined,
      accreditations: {
        iso9001: companyProfile?.accreditations?.iso9001 || false,
        iso14001: companyProfile?.accreditations?.iso14001 || false,
        cqcRating: companyProfile?.accreditations?.cqcRating || null,
        cyberEssentials: companyProfile?.accreditations?.cyberEssentials || false,
        cyberEssentialsPlus: companyProfile?.accreditations?.cyberEssentialsPlus || false,
        soc2: companyProfile?.accreditations?.soc2 || false,
        other: companyProfile?.accreditations?.other || []
      },
      awards: companyProfile?.awards || [],
      testimonials: companyProfile?.testimonials || [],
      companyDescription: companyProfile?.companyDescription || '',
      missionStatement: companyProfile?.missionStatement || '',
      valuesStatement: companyProfile?.valuesStatement || ''
    }
  })

  const { fields: awardFields, append: appendAward, remove: removeAward } = useFieldArray({
    control,
    name: 'awards'
  })

  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } = useFieldArray({
    control,
    name: 'testimonials'
  })

  // Add other accreditation
  const handleAddOtherAccreditation = () => {
    if (newAccreditation.trim() && !otherAccreditations.includes(newAccreditation.trim())) {
      const updated = [...otherAccreditations, newAccreditation.trim()]
      setOtherAccreditations(updated)
      setValue('accreditations.other', updated)
      setNewAccreditation('')
    }
  }

  // Remove other accreditation
  const handleRemoveOtherAccreditation = (index: number) => {
    const updated = otherAccreditations.filter((_, i) => i !== index)
    setOtherAccreditations(updated)
    setValue('accreditations.other', updated)
  }

  // Form submission
  const onSubmit = async (data: CompanyProfileFormData) => {
    try {
      setLoading(true)
      clearError('submit')
      
      console.log('Form submission started with data:', data)
      
      // Update onboarding store
      updateCompanyProfile({
        sector: data.sector,
        staffCount: data.staffCount,
        annualTurnover: data.annualTurnover,
        establishedYear: data.establishedYear,
        accreditations: {
          ...data.accreditations,
          cqcRating: data.accreditations.cqcRating || null,
          other: otherAccreditations
        },
        awards: data.awards || [],
        testimonials: data.testimonials || [],
        companyDescription: data.companyDescription,
        missionStatement: data.missionStatement,
        valuesStatement: data.valuesStatement
      })

      console.log('Onboarding store updated successfully')

      // TODO: Save to database

      // Navigation with comprehensive error handling
      try {
        console.log('Attempting navigation to knowledge page')
        
        // Update onboarding step first
        console.log('Calling nextStep() to update onboarding progress')
      nextStep()
        console.log('Onboarding step updated successfully')
        
        // Try router.push first
        console.log('Using router.push for navigation')
        router.push('/onboarding/knowledge')
        
        // Don't await - let it navigate naturally
        console.log('Navigation initiated successfully')
        
      } catch (navError) {
        console.error('Navigation error details:', navError)
        console.error('Error name:', (navError as Error)?.name)
        console.error('Error message:', (navError as Error)?.message)
        console.error('Error stack:', (navError as Error)?.stack)
        
        // Try alternative navigation methods
        try {
          console.log('Trying router.replace as fallback')
          router.replace('/onboarding/knowledge')
        } catch (replaceError) {
          console.error('Router.replace also failed:', replaceError)
          console.log('Using window.location.href as final fallback')
          if (typeof window !== 'undefined') {
            window.location.href = '/onboarding/knowledge'
          }
        }
      }
      
    } catch (error) {
      console.error('Profile update error:', error)
      console.error('Error details:', {
        name: (error as Error)?.name,
        message: (error as Error)?.message,
        stack: (error as Error)?.stack
      })
      setError('submit', 'Failed to save company profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToVerification = () => {
    previousStep()
    router.push('/onboarding/verify-email')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light via-white to-brand-light py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <Logo size="lg" variant="full" />
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-brand-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-brand-primary">
                Company Profile
              </CardTitle>
              <CardDescription className="text-gray-600">
                Tell us about your organization to personalize your CareDraft experience
              </CardDescription>
              
              {/* Progress Indicator */}
              <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-1 bg-teal-600"></div>
                  <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    2
                  </div>
                  <div className="w-8 h-1 bg-gray-300"></div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-sm font-medium">
                    3
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Company Overview Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-brand-primary" />
                    <h3 className="text-lg font-semibold text-gray-900">Company Overview</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sector */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Care Sector</Label>
                      <Controller
                        name="sector"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary care sector" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                        )}
                      />
                      {formErrors.sector && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {formErrors.sector.message}
                        </p>
                      )}
                    </div>

                    {/* Established Year */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Year Established (Optional)
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g., 2010"
                        min="1800"
                        max={new Date().getFullYear()}
                        {...register('establishedYear', { valueAsNumber: true })}
                      />
                      {formErrors.establishedYear && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {formErrors.establishedYear.message}
                        </p>
                      )}
                    </div>

                    {/* Staff Count */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        <Users className="w-4 h-4 inline mr-2" />
                        Number of Staff
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g., 25"
                        min="1"
                        {...register('staffCount', { valueAsNumber: true })}
                      />
                      {formErrors.staffCount && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {formErrors.staffCount.message}
                        </p>
                      )}
                    </div>

                    {/* Annual Turnover */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Annual Turnover (£)
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g., 500000"
                        min="0"
                        {...register('annualTurnover', { valueAsNumber: true })}
                      />
                      {formErrors.annualTurnover && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {formErrors.annualTurnover.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Accreditations Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-brand-primary" />
                    <h3 className="text-lg font-semibold text-gray-900">Accreditations & Certifications</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ISO Certifications */}
                    <div className="space-y-3">
                      <Controller
                        name="accreditations.iso9001"
                        control={control}
                        render={({ field }) => (
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                              checked={field.value}
                              onChange={field.onChange}
                        />
                        <Label className="text-sm font-medium">ISO 9001 (Quality Management)</Label>
                      </div>
                        )}
                      />
                      
                      <Controller
                        name="accreditations.iso14001"
                        control={control}
                        render={({ field }) => (
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                              checked={field.value}
                              onChange={field.onChange}
                        />
                        <Label className="text-sm font-medium">ISO 14001 (Environmental Management)</Label>
                      </div>
                        )}
                      />
                    </div>

                    {/* Cyber Security */}
                    <div className="space-y-3">
                      <Controller
                        name="accreditations.cyberEssentials"
                        control={control}
                        render={({ field }) => (
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                              checked={field.value}
                              onChange={field.onChange}
                        />
                        <Label className="text-sm font-medium">Cyber Essentials</Label>
                      </div>
                        )}
                      />
                      
                      <Controller
                        name="accreditations.cyberEssentialsPlus"
                        control={control}
                        render={({ field }) => (
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                              checked={field.value}
                              onChange={field.onChange}
                        />
                        <Label className="text-sm font-medium">Cyber Essentials Plus</Label>
                      </div>
                        )}
                      />
                    </div>

                    {/* SOC2 */}
                    <Controller
                      name="accreditations.soc2"
                      control={control}
                      render={({ field }) => (
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                            checked={field.value}
                            onChange={field.onChange}
                      />
                      <Label className="text-sm font-medium">SOC 2 Compliance</Label>
                    </div>
                      )}
                    />

                    {/* CQC Rating */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">CQC Rating (if applicable)</Label>
                      <Controller
                        name="accreditations.cqcRating"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select CQC rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {cqcRatingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={option.color}>{option.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                        )}
                      />
                    </div>
                  </div>

                  {/* Other Accreditations */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Other Accreditations</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newAccreditation}
                        onChange={(e) => setNewAccreditation(e.target.value)}
                        placeholder="Add another accreditation..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddOtherAccreditation()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddOtherAccreditation}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {otherAccreditations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {otherAccreditations.map((accreditation, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{accreditation}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOtherAccreditation(index)}
                              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Company Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">About Your Organization</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Company Description *
                    </Label>
                    <Textarea
                      placeholder="Describe your company's services, approach, and what makes you unique..."
                      rows={4}
                      className="resize-none"
                      {...register('companyDescription')}
                    />
                    <p className="text-xs text-gray-500">
                      This will be used to create your "About Us" content for tenders.
                    </p>
                    {formErrors.companyDescription && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.companyDescription.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Mission Statement (Optional)
                      </Label>
                      <Textarea
                        placeholder="Your organization's mission and purpose..."
                        rows={3}
                        className="resize-none"
                        {...register('missionStatement')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Values Statement (Optional)
                      </Label>
                      <Textarea
                        placeholder="Your core values and principles..."
                        rows={3}
                        className="resize-none"
                        {...register('valuesStatement')}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Awards Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-brand-primary" />
                      <h3 className="text-lg font-semibold text-gray-900">Awards & Recognition</h3>
                    </div>
                    <Button
                      type="button"
                      onClick={() => appendAward({ title: '', year: new Date().getFullYear(), description: '' })}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Award
                    </Button>
                  </div>

                  <AnimatePresence>
                    {awardFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-gray-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900">Award {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => removeAward(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-sm">Award Title *</Label>
                            <Input
                              placeholder="e.g., Best Care Provider 2023"
                              {...register(`awards.${index}.title`)}
                            />
                            {formErrors.awards?.[index]?.title && (
                              <p className="text-xs text-red-600">{formErrors.awards[index]?.title?.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-sm">Year *</Label>
                            <Input
                              type="number"
                              min="1900"
                              max={new Date().getFullYear()}
                              placeholder="2023"
                              {...register(`awards.${index}.year`, { valueAsNumber: true })}
                            />
                            {formErrors.awards?.[index]?.year && (
                              <p className="text-xs text-red-600">{formErrors.awards[index]?.year?.message}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-sm">Description</Label>
                          <Textarea
                            placeholder="Brief description of the award..."
                            rows={2}
                            className="resize-none"
                            {...register(`awards.${index}.description`)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Separator />

                {/* Testimonials Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Quote className="w-5 h-5 text-brand-primary" />
                      <h3 className="text-lg font-semibold text-gray-900">Client Testimonials</h3>
                    </div>
                    <Button
                      type="button"
                      onClick={() => appendTestimonial({ clientName: '', quote: '', position: '', company: '' })}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Testimonial
                    </Button>
                  </div>

                  <AnimatePresence>
                    {testimonialFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-gray-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900">Testimonial {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => removeTestimonial(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-sm">Quote *</Label>
                          <Textarea
                            placeholder="The testimonial quote..."
                            rows={3}
                            className="resize-none"
                            {...register(`testimonials.${index}.quote`)}
                          />
                          {formErrors.testimonials?.[index]?.quote && (
                            <p className="text-xs text-red-600">{formErrors.testimonials[index]?.quote?.message}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-sm">Client Name *</Label>
                            <Input
                              placeholder="e.g., Sarah Johnson"
                              {...register(`testimonials.${index}.clientName`)}
                            />
                            {formErrors.testimonials?.[index]?.clientName && (
                              <p className="text-xs text-red-600">{formErrors.testimonials[index]?.clientName?.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-sm">Position</Label>
                            <Input
                              placeholder="e.g., Care Manager"
                              {...register(`testimonials.${index}.position`)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-sm">Company/Organization</Label>
                          <Input
                            placeholder="e.g., NHS Trust"
                            {...register(`testimonials.${index}.company`)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
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

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={handleBackToVerification}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Email Verification
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isLoading || !isValid}
                    className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Saving Profile...' : 'Complete Setup'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
