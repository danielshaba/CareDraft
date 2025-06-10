'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TenderDetails, SERVICE_TYPE_OPTIONS, UK_COUNCILS, DEFAULT_TENDER_DETAILS, EvaluationCriteria, WordLimitSection } from '@/types/tender'
import { tenderDetailsSchema, TenderDetailsFormData, formatDateForInput, parseDateFromInput, parseCurrency } from '@/lib/validations/tender'
import { Input, Select, CurrencyInput, DateInput } from '@/components/ui/form-input'
import { EvaluationCriteriaSliders } from './EvaluationCriteriaSliders'
import { WordLimitsSection } from './WordLimitsSection'
import { Save, FileText, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface TenderDetailsFormProps {
  initialData?: Partial<TenderDetails>
  onSubmit?: (data: TenderDetails) => void
  onSave?: (data: Partial<TenderDetails>) => void
  isLoading?: boolean
}

export function TenderDetailsForm({
  initialData,
  onSubmit,
  onSave,
  isLoading = false
}: TenderDetailsFormProps) {
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  // State for evaluation criteria (not part of the basic form validation)
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriteria>(
    initialData?.evaluationCriteria || DEFAULT_TENDER_DETAILS.evaluationCriteria!
  )

  // State for word limits (not part of the basic form validation)
  const [wordLimits, setWordLimits] = useState<WordLimitSection[]>(
    initialData?.wordLimits || DEFAULT_TENDER_DETAILS.wordLimits!
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isValid }
  } = useForm<TenderDetailsFormData>({
    resolver: zodResolver(tenderDetailsSchema),
    defaultValues: {
      tenderName: initialData?.tenderName || DEFAULT_TENDER_DETAILS.tenderName,
      tenderReference: initialData?.tenderReference || DEFAULT_TENDER_DETAILS.tenderReference,
      issuingAuthority: initialData?.issuingAuthority || DEFAULT_TENDER_DETAILS.issuingAuthority,
      releaseDate: formatDateForInput(initialData?.releaseDate || null),
      submissionDeadline: formatDateForInput(initialData?.submissionDeadline || null),
      estimatedContractValue: initialData?.estimatedContractValue || null,
      contractDuration: initialData?.contractDuration || DEFAULT_TENDER_DETAILS.contractDuration,
      serviceType: initialData?.serviceType || DEFAULT_TENDER_DETAILS.serviceType,
      wordLimits: initialData?.wordLimits || DEFAULT_TENDER_DETAILS.wordLimits || [],
    },
    mode: 'onChange'
  })

  // Watch form values for auto-save functionality
  const watchedValues = watch()

  // Check if evaluation criteria is valid (totals 100%)
  const evaluationTotal = evaluationCriteria.quality + evaluationCriteria.price + evaluationCriteria.socialValue + evaluationCriteria.experience
  const isEvaluationValid = evaluationTotal === 100
  
  // Check if word limits are valid (at least one section with valid data)
  const isWordLimitsValid = wordLimits.length === 0 || wordLimits.every(section => 
    section.sectionName.trim().length > 0 && 
    section.wordLimit > 0 && 
    section.wordLimit <= 10000
  )
  
  // Comprehensive form validation
  const isFormCompletelyValid = isValid && isEvaluationValid && isWordLimitsValid

  // Validate word limits function
  const validateWordLimits = () => {
    const errors: string[] = []
    
    wordLimits.forEach((section, index) => {
      if (!section.sectionName.trim()) {
        errors.push(`Section ${index + 1}: Section name is required`)
      }
      if (section.sectionName.length > 100) {
        errors.push(`Section ${index + 1}: Section name must be 100 characters or less`)
      }
      if (section.wordLimit < 1) {
        errors.push(`Section ${index + 1}: Word limit must be at least 1`)
      }
      if (section.wordLimit > 10000) {
        errors.push(`Section ${index + 1}: Word limit cannot exceed 10,000`)
      }
    })
    
    return errors
  }

  // Handle form submission with comprehensive validation
  const onFormSubmit = async (data: TenderDetailsFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Additional validation for word limits
      const wordLimitErrors = validateWordLimits()
      
      if (wordLimitErrors.length > 0) {
        setSubmitError(`Word Limit Errors: ${wordLimitErrors.join(', ')}`)
        return
      }

      if (!isEvaluationValid) {
        setSubmitError('Evaluation criteria must total exactly 100%')
        return
      }

      const formattedData: TenderDetails = {
        ...data,
        releaseDate: parseDateFromInput(data.releaseDate),
        submissionDeadline: parseDateFromInput(data.submissionDeadline),
        estimatedContractValue: data.estimatedContractValue ?? null,
        evaluationCriteria: evaluationCriteria,
        wordLimits: wordLimits,
      }
      
      await onSubmit?.(formattedData)
      
    } catch {
      console.error('Form submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while submitting the form')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle draft save with enhanced data
  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const formattedData: Partial<TenderDetails> = {
        ...watchedValues,
        releaseDate: parseDateFromInput(watchedValues.releaseDate),
        submissionDeadline: parseDateFromInput(watchedValues.submissionDeadline),
        evaluationCriteria: evaluationCriteria,
        wordLimits: wordLimits,
      }
      
      await onSave?.(formattedData)
      setSaveStatus('saved')
      
      // Clear saved status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
      
    } catch {
      console.error('Draft save error:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save functionality
  React.useEffect(() => {
    if (!isDirty) return

    const autoSaveTimer = setTimeout(() => {
      handleSave()
    }, 5000) // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [watchedValues, evaluationCriteria, wordLimits, isDirty])

  // Navigation guard for unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Prepare options for dropdowns
  const councilOptions = UK_COUNCILS.map(council => ({
    value: council,
    label: council
  }))

  const durationUnitOptions = [
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' }
  ]

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Form Header */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-h3">
            Basic Tender Information
          </h2>
          <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
            Enter the essential details about this tender opportunity
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tender Name */}
          <div className="md:col-span-2">
            <Input
              label="Tender Name"
              placeholder="Enter the full tender name"
              required
              error={errors.tenderName?.message}
              {...register('tenderName')}
            />
          </div>

          {/* Tender Reference */}
          <div>
            <Input
              label="Tender Reference/ID"
              placeholder="e.g., TEN-2024-001"
              required
              error={errors.tenderReference?.message}
              {...register('tenderReference')}
            />
          </div>

          {/* Issuing Authority */}
          <div>
            <Select
              label="Issuing Authority"
              placeholder="Select a UK council"
              required
              options={councilOptions}
              error={errors.issuingAuthority?.message}
              {...register('issuingAuthority')}
            />
          </div>

          {/* Release Date */}
          <div>
            <DateInput
              label="Release Date"
              required
              error={errors.releaseDate?.message}
              {...register('releaseDate')}
            />
          </div>

          {/* Submission Deadline */}
          <div>
            <DateInput
              label="Submission Deadline"
              required
              error={errors.submissionDeadline?.message}
              {...register('submissionDeadline')}
            />
          </div>

          {/* Estimated Contract Value */}
          <div>
            <CurrencyInput
              label="Estimated Contract Value"
              placeholder="0.00"
              description="Optional - enter the estimated total contract value"
              error={errors.estimatedContractValue?.message}
              {...register('estimatedContractValue', {
                setValueAs: (value) => parseCurrency(value)
              })}
            />
          </div>

          {/* Service Type */}
          <div>
            <Select
              label="Service Type"
              placeholder="Select service type"
              required
              options={SERVICE_TYPE_OPTIONS}
              error={errors.serviceType?.message}
              {...register('serviceType')}
            />
          </div>
        </div>

        {/* Contract Duration Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            Contract Duration
          </h3>
          
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <Input
                label="Duration"
                type="number"
                min="1"
                max="50"
                placeholder="1"
                required
                error={errors.contractDuration?.value?.message}
                {...register('contractDuration.value', {
                  setValueAs: (value) => value ? parseInt(value, 10) : 1
                })}
              />
            </div>
            
            <div>
              <Select
                label="Unit"
                required
                options={durationUnitOptions}
                error={errors.contractDuration?.unit?.message}
                {...register('contractDuration.unit')}
              />
            </div>
          </div>
        </div>

        {/* Evaluation Criteria Section */}
        <div className="border-t border-gray-200 pt-6">
          <EvaluationCriteriaSliders
            value={evaluationCriteria}
            onChange={setEvaluationCriteria}
            disabled={isLoading}
            error={!isEvaluationValid ? 'Evaluation criteria must total exactly 100%' : undefined}
          />
        </div>

        {/* Word Limits Section */}
        <div className="border-t border-gray-200 pt-6">
          <WordLimitsSection
            wordLimits={wordLimits}
            onChange={setWordLimits}
            errors={{}}
          />
        </div>

        {/* Compliance Tracking Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            Compliance Tracking
          </h3>
          <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'var(--font-open-sans)' }}>
            Track and manage compliance requirements for your proposal using AI-powered extraction and manual entry.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-brand-500 mr-2" />
                <div>
                  <p className="font-medium text-gray-900">Compliance Checklist</p>
                  <p className="text-sm text-gray-600">
                    AI-powered compliance requirement extraction and tracking
                  </p>
                </div>
              </div>
              
              <Link
                href={`/tender-details/compliance?proposalId=${encodeURIComponent('temp-proposal-id')}&tenderName=${encodeURIComponent(watchedValues.tenderName || '')}&organizationName=${encodeURIComponent(watchedValues.issuingAuthority || '')}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Manage Compliance
              </Link>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isLoading || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Draft'}
            </button>
            
            {/* Save Status Indicator */}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center text-sm text-green-600">
                ✓ Draft saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center text-sm text-red-600">
                ✗ Save failed
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!isFormCompletelyValid || isLoading || isSubmitting}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Submitting...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 