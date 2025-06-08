import { z } from 'zod'

/**
 * Authentication form validation schemas using Zod
 */

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email address is too long')
  .transform((email) => email.trim().toLowerCase())

// Full name validation schema
export const fullNameSchema = z
  .string()
  .min(1, 'Full name is required')
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes')
  .transform((name) => name.trim())

// Organization ID validation schema - for existing organizations
export const organizationIdSchema = z
  .string()
  .min(1, 'Organization ID is required')
  .uuid('Organization ID must be a valid UUID')

// Organization setup validation schema - for signup form
export const organizationSetupSchema = z
  .string()
  .min(1, 'Please select an organization option')
  .refine(
    (value) => value === 'new' || value === 'join' || z.string().uuid().safeParse(value).success,
    {
      message: 'Please select a valid organization option'
    }
  )

// User role validation schema
export const userRoleSchema = z
  .enum(['admin', 'manager', 'writer', 'viewer'] as const)
  .default('writer')

// Login form validation schema
export const loginFormSchema = z.object({
  email: emailSchema,
})

// Signup form validation schema
export const signupFormSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  organizationId: organizationSetupSchema,
  role: userRoleSchema.optional(),
})

// Password reset form validation schema
export const resetPasswordFormSchema = z.object({
  email: emailSchema,
})

// New user creation schema (for admin/manager use)
export const createUserSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  organizationId: organizationIdSchema,
  role: userRoleSchema,
})

// User profile update schema
export const updateUserProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  role: userRoleSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
)

// Organization creation schema (for future use)
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters')
    .transform((name) => name.trim()),
  domain: z
    .string()
    .optional()
    .refine(
      (domain) => {
        if (!domain) return true
        // Basic domain validation
        return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/.test(domain)
      },
      {
        message: 'Please enter a valid domain name'
      }
    ),
})

// Auth callback validation schema (for handling auth redirects)
export const authCallbackSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
})

/**
 * Type inference from schemas
 */
export type LoginFormData = z.infer<typeof loginFormSchema>
export type SignupFormData = z.infer<typeof signupFormSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>
export type CreateUserData = z.infer<typeof createUserSchema>
export type UpdateUserProfileData = z.infer<typeof updateUserProfileSchema>
export type CreateOrganizationData = z.infer<typeof createOrganizationSchema>
export type AuthCallbackData = z.infer<typeof authCallbackSchema>

/**
 * Validation helper functions
 */

// Validate email format
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  try {
    emailSchema.parse(email)
    return { isValid: true }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { isValid: false, error: err.errors[0]?.message }
    }
    return { isValid: false, error: 'Invalid email format' }
  }
}

// Validate full name format
export const validateFullName = (name: string): { isValid: boolean; error?: string } => {
  try {
    fullNameSchema.parse(name)
    return { isValid: true }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { isValid: false, error: err.errors[0]?.message }
    }
    return { isValid: false, error: 'Invalid name format' }
  }
}

// Validate organization ID format
export const validateOrganizationId = (id: string): { isValid: boolean; error?: string } => {
  try {
    organizationIdSchema.parse(id)
    return { isValid: true }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { isValid: false, error: err.errors[0]?.message }
    }
    return { isValid: false, error: 'Invalid organization ID format' }
  }
}

// Validate user role
export const validateUserRole = (role: string): { isValid: boolean; error?: string } => {
  try {
    userRoleSchema.parse(role)
    return { isValid: true }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { isValid: false, error: err.errors[0]?.message }
    }
    return { isValid: false, error: 'Invalid user role' }
  }
}

/**
 * Form error handling utilities
 */

// Extract field errors from Zod validation error
export const extractFieldErrors = (error: z.ZodError): Record<string, string> => {
  const fieldErrors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const field = err.path.join('.')
    if (!fieldErrors[field]) {
      fieldErrors[field] = err.message
    }
  })
  
  return fieldErrors
}

// Format validation errors for display
export const formatValidationErrors = (error: z.ZodError): string[] => {
  return error.errors.map((err) => err.message)
}

// Check if validation error is for specific field
export const hasFieldError = (error: z.ZodError, fieldName: string): boolean => {
  return error.errors.some((err) => err.path.includes(fieldName))
}

// Get error message for specific field
export const getFieldError = (error: z.ZodError, fieldName: string): string | undefined => {
  const fieldError = error.errors.find((err) => err.path.includes(fieldName))
  return fieldError?.message
}

/**
 * Real-time validation helpers for forms
 */

// Debounced email validation (for real-time feedback)
export const createEmailValidator = (debounceMs: number = 300) => {
  let timeoutId: NodeJS.Timeout
  
  return (email: string, callback: (result: { isValid: boolean; error?: string }) => void) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      callback(validateEmail(email))
    }, debounceMs)
  }
}

// Debounced full name validation
export const createFullNameValidator = (debounceMs: number = 300) => {
  let timeoutId: NodeJS.Timeout
  
  return (name: string, callback: (result: { isValid: boolean; error?: string }) => void) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      callback(validateFullName(name))
    }, debounceMs)
  }
}

/**
 * Custom validation rules
 */

// Check if email domain is allowed (for future domain restrictions)
export const createDomainValidator = (allowedDomains?: string[]) => {
  return z.string().refine(
    (email) => {
      if (!allowedDomains || allowedDomains.length === 0) return true
      
      const domain = email.split('@')[1]?.toLowerCase()
      return allowedDomains.some(allowedDomain => 
        domain === allowedDomain.toLowerCase() || 
        domain?.endsWith(`.${allowedDomain.toLowerCase()}`)
      )
    },
    {
      message: 'Email domain is not allowed for this organization'
    }
  )
}

// Validate password strength (for future password auth)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')

// Password confirmation schema
export const passwordConfirmationSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
) 