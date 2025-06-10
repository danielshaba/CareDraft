import { z } from 'zod'

// Base validation schemas for address
export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required').max(100, 'Address line 1 must be less than 100 characters'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required').max(50, 'City must be less than 50 characters'),
  postcode: z.string()
    .min(1, 'Postcode is required')
    .regex(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i, 'Please enter a valid UK postcode'),
  country: z.string().min(1, 'Country is required').default('United Kingdom'),
})

// Personal information schema
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string()
    .optional()
    .refine((phone) => {
      if (!phone) return true
      // UK phone number validation
      const ukPhoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/
      return ukPhoneRegex.test(phone.replace(/\s/g, ''))
    }, 'Please enter a valid UK phone number'),
  jobTitle: z.string().optional().transform(val => val?.trim() || undefined),
  department: z.string().optional().transform(val => val?.trim() || undefined),
})

// Company information schema
export const companyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name must be less than 100 characters'),
  registrationNumber: z.string()
    .optional()
    .refine((num) => {
      if (!num) return true
      // UK company registration number format
      return /^[A-Z0-9]{6,8}$/i.test(num)
    }, 'Please enter a valid UK company registration number'),
  website: z.string()
    .optional()
    .refine((url) => {
      if (!url) return true
      try {
        new URL(url.startsWith('http') ? url : `https://${url}`)
        return true
      } catch {
        return false
      }
    }, 'Please enter a valid website URL'),
  address: addressSchema,
  sector: z.enum(['domiciliary', 'residential', 'supported_living', 'other'], {
    required_error: 'Please select a care sector'
  }),
  staffCount: z.number()
    .min(1, 'Staff count must be at least 1')
    .max(10000, 'Staff count seems unreasonably high'),
  annualTurnover: z.number()
    .min(0, 'Annual turnover must be positive')
    .max(1000000000, 'Annual turnover seems unreasonably high')
    .optional(),
  establishedYear: z.number()
    .min(1800, 'Established year must be after 1800')
    .max(new Date().getFullYear(), 'Established year cannot be in the future')
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform(val => val?.trim() || undefined),
})

// Accreditations schema
export const accreditationsSchema = z.object({
  iso9001: z.boolean().default(false),
  iso14001: z.boolean().default(false),
  cqcRating: z.enum(['outstanding', 'good', 'requires_improvement', 'inadequate'])
    .optional()
    .nullable(),
  cyberEssentials: z.boolean().default(false),
  cyberEssentialsPlus: z.boolean().default(false),
  soc2: z.boolean().default(false),
  other: z.array(z.string().max(100, 'Accreditation name must be less than 100 characters'))
    .default([])
    .transform(arr => arr.filter(item => item.trim().length > 0)),
})

// Awards schema
export const awardSchema = z.object({
  title: z.string().min(1, 'Award title is required').max(100, 'Award title must be less than 100 characters'),
  year: z.number()
    .min(1900, 'Award year must be after 1900')
    .max(new Date().getFullYear(), 'Award year cannot be in the future'),
  organization: z.string()
    .max(100, 'Organization name must be less than 100 characters')
    .optional()
    .transform(val => val?.trim() || undefined),
  description: z.string()
    .max(300, 'Description must be less than 300 characters')
    .optional()
    .transform(val => val?.trim() || undefined),
})

export const awardsSchema = z.array(awardSchema).default([])

// Account preferences schema
export const accountPreferencesSchema = z.object({
  language: z.enum(['en-GB', 'en-US']).default('en-GB'),
  timezone: z.string().default('Europe/London'),
  emailNotifications: z.object({
    tenderAlerts: z.boolean().default(true),
    weeklyDigest: z.boolean().default(true),
    systemUpdates: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
  }).default({}),
  dashboardPreferences: z.object({
    defaultView: z.enum(['grid', 'list']).default('grid'),
    itemsPerPage: z.number().min(5).max(100).default(10),
    showCompletedTasks: z.boolean().default(false),
  }).default({}),
})

// Complete profile schema
export const profileSchema = z.object({
  personal: personalInfoSchema,
  company: companyInfoSchema,
  accreditations: accreditationsSchema,
  awards: awardsSchema,
  preferences: accountPreferencesSchema,
})

// Partial profile update schema (for optimistic updates)
export const profileUpdateSchema = profileSchema.partial()

// Schema for profile sync conflicts
export const profileConflictSchema = z.object({
  field: z.string(),
  currentValue: z.any(),
  onboardingValue: z.any(),
  resolution: z.enum(['keep_current', 'use_onboarding', 'merge']),
})

export const profileConflictsSchema = z.array(profileConflictSchema)

// Type exports
export type ProfileData = z.infer<typeof profileSchema>
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>
export type ProfileConflict = z.infer<typeof profileConflictSchema>
export type ProfileConflicts = z.infer<typeof profileConflictsSchema>
export type PersonalInfo = z.infer<typeof personalInfoSchema>
export type CompanyInfo = z.infer<typeof companyInfoSchema>
export type Accreditations = z.infer<typeof accreditationsSchema>
export type Award = z.infer<typeof awardSchema>
export type Awards = z.infer<typeof awardsSchema>
export type AccountPreferences = z.infer<typeof accountPreferencesSchema>

// Helper functions for validation
export const validateProfile = (data: unknown): ProfileData => {
  return profileSchema.parse(data)
}

export const validateProfileUpdate = (data: unknown): ProfileUpdateData => {
  return profileUpdateSchema.parse(data)
}

export const validateConflicts = (data: unknown): ProfileConflicts => {
  return profileConflictsSchema.parse(data)
}

// Default profile data factory
export const createDefaultProfile = (): Partial<ProfileData> => ({
  personal: {
    firstName: '',
    lastName: '',
    email: '',
  },
  company: {
    name: '',
    address: {
      line1: '',
      city: '',
      postcode: '',
      country: 'United Kingdom',
    },
    sector: 'domiciliary',
    staffCount: 1,
  },
  accreditations: {
    iso9001: false,
    iso14001: false,
    cyberEssentials: false,
    cyberEssentialsPlus: false,
    soc2: false,
    other: [],
  },
  awards: [],
  preferences: {
    language: 'en-GB',
    timezone: 'Europe/London',
    emailNotifications: {
      tenderAlerts: true,
      weeklyDigest: true,
      systemUpdates: true,
      marketingEmails: false,
    },
    dashboardPreferences: {
      defaultView: 'grid',
      itemsPerPage: 10,
      showCompletedTasks: false,
    },
  },
}) 