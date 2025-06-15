import { useState, useCallback, useMemo } from 'react'
import { 
  ProfileData as ValidationProfileData,
  validateProfile,
  validateProfileUpdate
} from '@/lib/validations/profile'

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export interface UseValidationOptions {
  validateOnChange?: boolean
  showWarnings?: boolean
  customValidators?: Array<(data: any) => ValidationError[]>
}

export function useProfileValidation(options: UseValidationOptions = {}) {
  const {
    showWarnings = true,
    customValidators = []
  } = options

  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  })

  // Convert Zod errors to our ValidationError format
  const convertZodErrors = useCallback((zodError: any): ValidationError[] => {
    if (!zodError?.errors) return []
    
    return zodError.errors.map((error: any) => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code
    }))
  }, [])

  // Validate complete profile
  const validateCompleteProfile = useCallback((data: any): ValidationResult => {
    try {
      validateProfile(data as ValidationProfileData)
      
      // Run custom validators
      const customErrors = customValidators.flatMap(validator => validator(data))
      
      return {
        isValid: customErrors.length === 0,
        errors: customErrors.filter(e => !e.code?.includes('warning')),
        warnings: showWarnings ? customErrors.filter(e => e.code?.includes('warning')) : []
      }
    } catch (error: any) {
      const errors = convertZodErrors(error)
      const customErrors = customValidators.flatMap(validator => validator(data))
      
      return {
        isValid: false,
        errors: [...errors, ...customErrors.filter(e => !e.code?.includes('warning'))],
        warnings: showWarnings ? customErrors.filter(e => e.code?.includes('warning')) : []
      }
    }
  }, [convertZodErrors, customValidators, showWarnings])

  // Validate profile update
  const validateUpdate = useCallback((data: any): ValidationResult => {
    try {
      validateProfileUpdate(data)
      
      // Run custom validators
      const customErrors = customValidators.flatMap(validator => validator(data))
      
      return {
        isValid: customErrors.length === 0,
        errors: customErrors.filter(e => !e.code?.includes('warning')),
        warnings: showWarnings ? customErrors.filter(e => e.code?.includes('warning')) : []
      }
    } catch (error: any) {
      const errors = convertZodErrors(error)
      const customErrors = customValidators.flatMap(validator => validator(data))
      
      return {
        isValid: false,
        errors: [...errors, ...customErrors.filter(e => !e.code?.includes('warning'))],
        warnings: showWarnings ? customErrors.filter(e => e.code?.includes('warning')) : []
      }
    }
  }, [convertZodErrors, customValidators, showWarnings])

  // Validate specific field
  const validateField = useCallback((fieldPath: string, value: any, context?: any): ValidationError[] => {
    try {
      // Create a minimal object with just this field for validation
      const testData = context || {}
      const pathParts = fieldPath.split('.')
      
      // Set the value at the correct path
      let current = testData
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) current[pathParts[i]] = {}
        current = current[pathParts[i]]
      }
      current[pathParts[pathParts.length - 1]] = value

      // Validate the update
      const result = validateUpdate(testData)
      
      // Return only errors for this specific field
      return result.errors.filter(error => error.field.startsWith(fieldPath))
    } catch (error) {
      return [{
        field: fieldPath,
        message: 'Validation failed for this field',
        code: 'validation_error'
      }]
    }
  }, [validateUpdate])

  // Set validation results
  const setValidation = useCallback((result: ValidationResult) => {
    setValidationState(result)
  }, [])

  // Clear validation errors
  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: [],
      warnings: []
    })
  }, [])

  // Clear specific field errors
  const clearFieldErrors = useCallback((fieldPath: string) => {
    setValidationState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => !error.field.startsWith(fieldPath)),
      warnings: prev.warnings.filter(warning => !warning.field.startsWith(fieldPath)),
      isValid: prev.errors.filter(error => !error.field.startsWith(fieldPath)).length === 0
    }))
  }, [])

  // Get errors for specific field
  const getFieldErrors = useCallback((fieldPath: string): ValidationError[] => {
    return validationState.errors.filter(error => error.field.startsWith(fieldPath))
  }, [validationState.errors])

  // Get warnings for specific field
  const getFieldWarnings = useCallback((fieldPath: string): ValidationError[] => {
    return validationState.warnings.filter(warning => warning.field.startsWith(fieldPath))
  }, [validationState.warnings])

  // Check if specific field has errors
  const hasFieldErrors = useCallback((fieldPath: string): boolean => {
    return getFieldErrors(fieldPath).length > 0
  }, [getFieldErrors])

  // Get completion percentage
  const getCompletionPercentage = useCallback((data: any): number => {
    if (!data) return 0

    const requiredFields = [
      'personal.firstName', 'personal.lastName', 'personal.email',
      'company.name', 'company.address.line1', 'company.sector'
    ]
    
    const completedFields = requiredFields.filter(fieldPath => {
      const pathParts = fieldPath.split('.')
      let current = data
      
      for (const part of pathParts) {
        if (!current || !current[part]) return false
        current = current[part]
      }
      
      return current && current.toString().trim().length > 0
    })

    return Math.round((completedFields.length / requiredFields.length) * 100)
  }, [])

  // Memoized validation status
  const validationSummary = useMemo(() => ({
    hasErrors: validationState.errors.length > 0,
    hasWarnings: validationState.warnings.length > 0,
    errorCount: validationState.errors.length,
    warningCount: validationState.warnings.length,
    isValid: validationState.isValid
  }), [validationState])

  return {
    // State
    validation: validationState,
    validationSummary,

    // Actions
    validateCompleteProfile,
    validateUpdate,
    validateField,
    setValidation,
    clearValidation,
    clearFieldErrors,
    getFieldErrors,
    getFieldWarnings,
    hasFieldErrors,
    getCompletionPercentage
  }
} 