import { z } from 'zod'
import { ServiceType as _ServiceType, UK_COUNCILS } from '@/types/tender'

// Word Limit Section Schema
const _wordLimitSectionSchema = z.object({
  id: z.string(),
  sectionName: z.string().min(1, 'Section name is required').max(100, 'Section name must be 100 characters or less'),
  wordLimit: z.number().min(1, 'Word limit must be at least 1').max(10000, 'Word limit cannot exceed 10,000 words'),
  description: z.string().optional(),
})

// Validation schema for tender details form
export const tenderDetailsSchema = z.object({
  tenderName: z
    .string()
    .min(1, 'Tender name is required')
    .min(3, 'Tender name must be at least 3 characters')
    .max(200, 'Tender name must be less than 200 characters'),
    
  tenderReference: z
    .string()
    .min(1, 'Tender reference is required')
    .max(50, 'Tender reference must be less than 50 characters'),
    
  issuingAuthority: z
    .string()
    .min(1, 'Issuing authority is required')
    .refine(
      (value) => UK_COUNCILS.includes(value as any),
      'Please select a valid UK council'
    ),
    
  releaseDate: z
    .string()
    .min(1, 'Release date is required')
    .refine((date) => {
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    }, 'Please enter a valid date'),
    
  submissionDeadline: z
    .string()
    .min(1, 'Submission deadline is required')
    .refine((date) => {
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    }, 'Please enter a valid date'),
    
  estimatedContractValue: z
    .number()
    .min(0, 'Contract value must be positive')
    .max(1000000000, 'Contract value seems unreasonably high')
    .optional()
    .nullable(),
    
  contractDuration: z.object({
    value: z
      .number()
      .min(1, 'Duration must be at least 1')
      .max(50, 'Duration cannot exceed 50'),
    unit: z.enum(['months', 'years'], {
      required_error: 'Please select duration unit'
    })
  }),
  
  serviceType: z.enum([
    'residential',
    'domiciliary', 
    'nursing',
    'respite',
    'day_care',
    'supported_living',
    'other'
  ] as const, {
    required_error: 'Please select a service type'
  })
}).refine(
  (data) => {
    // Ensure submission deadline is after release date
    const releaseDate = new Date(data.releaseDate)
    const submissionDate = new Date(data.submissionDeadline)
    return submissionDate > releaseDate
  },
  {
    message: 'Submission deadline must be after release date',
    path: ['submissionDeadline']
  }
)

export type TenderDetailsFormData = z.infer<typeof tenderDetailsSchema>

// Helper function to format currency for display
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return ''
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Helper function to parse currency input
export function parseCurrency(value: string): number | null {
  if (!value || value.trim() === '') {
    return null
  }
  
  // Remove currency symbols and commas
  const cleanValue = value.replace(/[£,$\s]/g, '')
  const numericValue = parseFloat(cleanValue)
  
  return isNaN(numericValue) ? null : numericValue
}

// Helper function to format date for input
export function formatDateForInput(date: Date | null): string {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

// Helper function to parse date from input
export function parseDateFromInput(dateString: string): Date | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
} 