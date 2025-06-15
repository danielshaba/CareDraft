/**
 * Rate Limiting Utility
 * Reusable rate limiting functionality for API routes
 */

import { NextRequest } from 'next/server'
import { getEnvironmentConfig } from '../config/environment'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  limit: number
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// In-memory store for development (use Redis in production)
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  
  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    return this.store.get(key) || null
  }
  
  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value)
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
  
  async clear(): Promise<void> {
    this.store.clear()
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Global store instance
const store = new MemoryStore()

// Cleanup expired entries every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000)

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `rate_limit_${ip}`
}

/**
 * User-based key generator (requires authentication)
 */
export function userKeyGenerator(userId: string): string {
  return `rate_limit_user_${userId}`
}

/**
 * Endpoint-specific key generator
 */
export function endpointKeyGenerator(request: NextRequest, endpoint: string): string {
  const baseKey = defaultKeyGenerator(request)
  return `${baseKey}_${endpoint}`
}

/**
 * Main rate limiting function
 */
export async function rateLimit(
  request: NextRequest,
  config?: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
  const envConfig = getEnvironmentConfig()
  
  // Use environment config as defaults
  const finalConfig: RateLimitConfig = {
    windowMs: envConfig.rateLimiting.windowMs,
    maxRequests: envConfig.rateLimiting.maxRequests,
    keyGenerator: defaultKeyGenerator,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    ...config
  }
  
  // If rate limiting is disabled, allow all requests
  if (!envConfig.rateLimiting.enabled) {
    return {
      allowed: true,
      remaining: finalConfig.maxRequests,
      resetTime: Date.now() + finalConfig.windowMs,
      limit: finalConfig.maxRequests
    }
  }
  
  const key = finalConfig.keyGenerator!(request)
  const now = Date.now()
  
  // Get current rate limit data
  const current = await store.get(key)
  
  // Reset if window has expired or no data exists
  if (!current || now > current.resetTime) {
    const newEntry = { count: 1, resetTime: now + finalConfig.windowMs }
    await store.set(key, newEntry)
    
    return {
      allowed: true,
      remaining: finalConfig.maxRequests - 1,
      resetTime: newEntry.resetTime,
      limit: finalConfig.maxRequests
    }
  }
  
  // Check if limit exceeded
  if (current.count >= finalConfig.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
      limit: finalConfig.maxRequests
    }
  }
  
  // Increment count
  current.count++
  await store.set(key, current)
  
  return {
    allowed: true,
    remaining: finalConfig.maxRequests - current.count,
    resetTime: current.resetTime,
    limit: finalConfig.maxRequests
  }
}

/**
 * Rate limit middleware for search endpoints
 */
export async function rateLimitSearch(request: NextRequest): Promise<RateLimitResult> {
  return rateLimit(request, {
    maxRequests: 20, // More restrictive for search
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => endpointKeyGenerator(req, 'search')
  })
}

/**
 * Rate limit middleware for research endpoints
 */
export async function rateLimitResearch(request: NextRequest): Promise<RateLimitResult> {
  return rateLimit(request, {
    maxRequests: 10, // Even more restrictive for research
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => endpointKeyGenerator(req, 'research')
  })
}

/**
 * Rate limit middleware for company research endpoints
 */
export async function rateLimitCompany(request: NextRequest): Promise<RateLimitResult> {
  return rateLimit(request, {
    maxRequests: 5, // Most restrictive for company research
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => endpointKeyGenerator(req, 'company')
  })
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    'X-RateLimit-Reset-Date': new Date(result.resetTime).toISOString()
  }
}

/**
 * Rate limit error response helper
 */
export function createRateLimitErrorResponse(result: RateLimitResult) {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
  
  return {
    error: 'Rate limit exceeded',
    message: `Too many requests. Try again in ${retryAfter} seconds.`,
    retryAfter,
    limit: result.limit,
    resetTime: result.resetTime
  }
}

/**
 * Get rate limit status for a key
 */
export async function getRateLimitStatus(key: string): Promise<{
  count: number
  remaining: number
  resetTime: number
  limit: number
} | null> {
  const current = await store.get(key)
  if (!current) return null
  
  const envConfig = getEnvironmentConfig()
  const limit = envConfig.rateLimiting.maxRequests
  
  return {
    count: current.count,
    remaining: Math.max(0, limit - current.count),
    resetTime: current.resetTime,
    limit
  }
}

/**
 * Clear rate limit for a key (admin function)
 */
export async function clearRateLimit(key: string): Promise<void> {
  await store.delete(key)
}

/**
 * Clear all rate limits (admin function)
 */
export async function clearAllRateLimits(): Promise<void> {
  await store.clear()
} 