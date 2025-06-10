import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// import { profileSchema } from '@/lib/validations/profile' // TODO: Use for comprehensive schema validation
import { rateLimit } from '@/lib/utils/rate-limit'

async function getAuthenticatedUser(_request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { user: null, error: 'Authentication required' }
  }

  return { user, error: null }
}

// POST /api/profile/validate - Validate profile field data
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - more generous for validation
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 500,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    const { fieldPath, value, fullProfile } = await request.json()

    if (!fieldPath) {
      return NextResponse.json(
        { error: 'Field path is required' },
        { status: 400 }
      )
    }

    // Simple validation approach - validate individual field rules
    const validationResult = await validateField(fieldPath, value, fullProfile)

    return NextResponse.json({
      success: true,
      field: fieldPath,
      value,
      validation: validationResult
    })

  } catch (error) {
    console.error('Error in POST /api/profile/validate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Simplified field validation function
async function validateField(fieldPath: string, value: any, _fullProfile?: any) {
  const errors: Array<{ field: string; message: string; code: string }> = []
  
  try {
    // Required field validation
    const requiredFields = [
      'personal.firstName',
      'personal.lastName', 
      'personal.email',
      'company.name',
      'company.address.line1'
    ]
    
    if (requiredFields.includes(fieldPath) && (!value || value.toString().trim() === '')) {
      errors.push({
        field: fieldPath,
        message: 'This field is required',
        code: 'required'
      })
    }

    // Email validation
    if (fieldPath === 'personal.email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors.push({
          field: fieldPath,
          message: 'Please enter a valid email address',
          code: 'invalid_email'
        })
      }
    }

    // Phone number validation
    if (fieldPath === 'personal.phone' && value) {
      // UK phone number validation (more flexible)
      const ukPhoneRegex = /^(\+44\s?|0)[1-9]\d{8,10}$/
      if (!ukPhoneRegex.test(value.replace(/\s/g, ''))) {
        errors.push({
          field: fieldPath,
          message: 'Please enter a valid UK phone number',
          code: 'invalid_phone'
        })
      }
    }

    // Company registration number validation
    if (fieldPath === 'company.registrationNumber' && value) {
      // UK company registration number validation
      if (!/^[A-Z0-9]{6,8}$/i.test(value)) {
        errors.push({
          field: fieldPath,
          message: 'Please enter a valid UK company registration number (6-8 characters)',
          code: 'invalid_registration'
        })
      }
    }

    // Website URL validation
    if (fieldPath === 'company.website' && value) {
      try {
        const url = value.startsWith('http') ? value : `https://${value}`
        new URL(url)
      } catch {
        errors.push({
          field: fieldPath,
          message: 'Please enter a valid website URL',
          code: 'invalid_url'
        })
      }
    }

    // Numeric field validations
    if (fieldPath === 'company.staffCount' && value !== null && value !== undefined) {
      const numValue = Number(value)
      if (isNaN(numValue) || numValue < 1) {
        errors.push({
          field: fieldPath,
          message: 'Staff count must be at least 1',
          code: 'invalid_number'
        })
      }
      if (numValue > 50000) {
        errors.push({
          field: fieldPath,
          message: 'Staff count seems unreasonably high',
          code: 'too_large'
        })
      }
    }

    if (fieldPath === 'company.annualTurnover' && value !== null && value !== undefined) {
      const numValue = Number(value)
      if (isNaN(numValue) || numValue < 0) {
        errors.push({
          field: fieldPath,
          message: 'Annual turnover must be a positive number',
          code: 'invalid_number'
        })
      }
    }

    if (fieldPath === 'company.establishedYear' && value !== null && value !== undefined) {
      const numValue = Number(value)
      const currentYear = new Date().getFullYear()
      if (isNaN(numValue) || numValue < 1800 || numValue > currentYear) {
        errors.push({
          field: fieldPath,
          message: `Established year must be between 1800 and ${currentYear}`,
          code: 'invalid_year'
        })
      }
    }

    // Text length validations
    if (value && typeof value === 'string') {
      if (fieldPath === 'personal.firstName' || fieldPath === 'personal.lastName') {
        if (value.length > 50) {
          errors.push({
            field: fieldPath,
            message: 'Name must be less than 50 characters',
            code: 'too_long'
          })
        }
      }
      
      if (fieldPath === 'company.name' && value.length > 100) {
        errors.push({
          field: fieldPath,
          message: 'Company name must be less than 100 characters',
          code: 'too_long'
        })
      }

      if (fieldPath === 'company.description' && value.length > 1000) {
        errors.push({
          field: fieldPath,
          message: 'Description must be less than 1000 characters',
          code: 'too_long'
        })
      }
    }

  } catch (error) {
    console.error('Error in field validation:', error)
    errors.push({
      field: fieldPath,
      message: 'Validation error occurred',
      code: 'validation_error'
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
} 