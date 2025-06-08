import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
interface RateLimitConfig {
  interval: number  // Time window in milliseconds
  uniqueTokenPerInterval: number  // Max requests per interval
}

// In-memory store for rate limiting (in production, use Redis)
class InMemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  get(key: string): { count: number; resetTime: number } | undefined {
    return this.store.get(key)
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value)
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }
}

const store = new InMemoryStore()

// Clean up store every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000)

// Rate limiter configurations for different endpoints
export const rateLimitConfigs = {
  // AI endpoints have stricter limits due to cost
  ai: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 requests per minute
  },
  // More generous limits for non-AI endpoints
  general: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 60, // 60 requests per minute
  },
  // Even stricter for expensive operations
  extract: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 5, // 5 requests per minute
  }
}

// Get client identifier
function getClientId(request: NextRequest): string {
  // Try to get user ID from auth header
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    // Extract user ID from JWT token (simplified)
    try {
      const token = authHeader.replace('Bearer ', '')
      // In a real app, decode JWT and extract user ID
      return `user:${token.slice(0, 10)}` // Use first 10 chars as identifier
    } catch {
      // Fall through to IP-based limiting
    }
  }

  // Fall back to IP-based limiting using headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  // Try different header sources for IP address
  let clientIp = 'unknown'
  if (forwarded) {
    clientIp = forwarded.split(',')[0].trim()
  } else if (realIp) {
    clientIp = realIp
  } else if (cfConnectingIp) {
    clientIp = cfConnectingIp
  }
  
  return `ip:${clientIp}`
}

// Rate limiter function
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.ai
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}> {
  const clientId = getClientId(request)
  const now = Date.now()
  
  // Get current state for this client
  let clientState = store.get(clientId)
  
  // Initialize or reset if interval has passed
  if (!clientState || clientState.resetTime <= now) {
    clientState = {
      count: 0,
      resetTime: now + config.interval
    }
  }
  
  // Check if limit exceeded
  if (clientState.count >= config.uniqueTokenPerInterval) {
    const retryAfter = Math.ceil((clientState.resetTime - now) / 1000)
    return {
      success: false,
      limit: config.uniqueTokenPerInterval,
      remaining: 0,
      reset: clientState.resetTime,
      retryAfter
    }
  }
  
  // Increment counter and store
  clientState.count++
  store.set(clientId, clientState)
  
  return {
    success: true,
    limit: config.uniqueTokenPerInterval,
    remaining: config.uniqueTokenPerInterval - clientState.count,
    reset: clientState.resetTime
  }
}

// Middleware wrapper for API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Apply rate limiting
    const result = await rateLimit(request, config)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': result.retryAfter!.toString()
          }
        }
      )
    }
    
    // Call the original handler
    const response = await handler(request)
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.reset.toString())
    
    return response
  }
}

// Usage statistics tracking
interface UsageStats {
  totalRequests: number
  successfulRequests: number
  rateLimitedRequests: number
  errorRequests: number
  lastReset: number
}

const usageStats: UsageStats = {
  totalRequests: 0,
  successfulRequests: 0,
  rateLimitedRequests: 0,
  errorRequests: 0,
  lastReset: Date.now()
}

export function trackUsage(success: boolean, rateLimited: boolean = false) {
  usageStats.totalRequests++
  
  if (rateLimited) {
    usageStats.rateLimitedRequests++
  } else if (success) {
    usageStats.successfulRequests++
  } else {
    usageStats.errorRequests++
  }
}

export function getUsageStats(): UsageStats {
  return { ...usageStats }
}

export function resetUsageStats() {
  usageStats.totalRequests = 0
  usageStats.successfulRequests = 0
  usageStats.rateLimitedRequests = 0
  usageStats.errorRequests = 0
  usageStats.lastReset = Date.now()
} 