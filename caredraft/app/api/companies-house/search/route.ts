import { NextRequest, NextResponse } from 'next/server'
import { companiesHouseService } from '@/lib/services/companies-house'
import { z } from 'zod'

const searchParamsSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters long'),
  items_per_page: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20')
})

export async function GET(request: NextRequest) {
  try {
    // Check rate limits
    const ip = getClientIP(request)
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validatedParams = searchParamsSchema.parse(params)
    
    // Check if Companies House service is available
    if (!companiesHouseService.isAvailable()) {
      return NextResponse.json(
        { 
          error: 'SERVICE_UNAVAILABLE',
          message: 'Companies House API is not configured. Please contact support.',
          items: []
        },
        { status: 503 }
      )
    }

    // Perform the search
    const results = await companiesHouseService.searchCompanies(
      validatedParams.q,
      Number(validatedParams.items_per_page)
    )

    // Return successful response
    return NextResponse.json({
      success: true,
      data: results,
      query: validatedParams.q
    })

  } catch (error) {
    console.error('Companies House search error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid search parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle Companies House API errors
    if (error instanceof Error && error.name === 'CompaniesHouseError') {
      const chError = error as any
      return NextResponse.json(
        {
          error: chError.error || 'API_ERROR',
          message: chError.message || 'Companies House API error',
          statusCode: chError.statusCode || 500
        },
        { status: chError.statusCode || 500 }
      )
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while searching companies'
      },
      { status: 500 }
    )
  }
}

// Rate limiting (simple in-memory implementation for development)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 30 // 30 requests per minute

  const current = rateLimit.get(ip)
  
  if (!current || now > current.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
} 