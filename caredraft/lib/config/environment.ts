/**
 * Environment Configuration Management
 * Handles environment-specific settings and validation
 */

export type Environment = 'development' | 'staging' | 'production' | 'test'

export interface EnvironmentConfig {
  environment: Environment
  isDevelopment: boolean
  isProduction: boolean
  isTest: boolean
  apiUrl: string
  enableLogging: boolean
  enableDebug: boolean
  enableCaching: boolean
  cacheSettings: {
    defaultTTL: number // seconds
    maxCacheSize: number // number of entries
  }
  rateLimiting: {
    enabled: boolean
    windowMs: number // milliseconds
    maxRequests: number
  }
}

/**
 * Get current environment from NODE_ENV
 */
function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV?.toLowerCase() || 'development'
  
  switch (env) {
    case 'production':
    case 'prod':
      return 'production'
    case 'staging':
    case 'stage':
      return 'staging'
    case 'test':
    case 'testing':
      return 'test'
    default:
      return 'development'
  }
}

/**
 * Create environment-specific configuration
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const environment = getCurrentEnvironment()
  const isDevelopment = environment === 'development'
  const isProduction = environment === 'production'
  const isTest = environment === 'test'
  
  // Base configuration
  const baseConfig: EnvironmentConfig = {
    environment,
    isDevelopment,
    isProduction,
    isTest,
    apiUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    enableLogging: true,
    enableDebug: isDevelopment,
    enableCaching: true,
    cacheSettings: {
      defaultTTL: 300, // 5 minutes
      maxCacheSize: 1000
    },
    rateLimiting: {
      enabled: true,
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100
    }
  }
  
  // Environment-specific overrides
  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        enableDebug: false,
        enableLogging: true,
        cacheSettings: {
          defaultTTL: 900, // 15 minutes
          maxCacheSize: 5000
        },
        rateLimiting: {
          enabled: true,
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 50 // More restrictive in production
        }
      }
      
    case 'staging':
      return {
        ...baseConfig,
        enableDebug: false,
        enableLogging: true,
        cacheSettings: {
          defaultTTL: 600, // 10 minutes
          maxCacheSize: 2000
        },
        rateLimiting: {
          enabled: true,
          windowMs: 60 * 1000,
          maxRequests: 75
        }
      }
      
    case 'test':
      return {
        ...baseConfig,
        enableDebug: false,
        enableLogging: false,
        enableCaching: false, // Disable caching in tests for predictability
        rateLimiting: {
          enabled: false, // Disable rate limiting in tests
          windowMs: 60 * 1000,
          maxRequests: 1000
        }
      }
      
    default: // development
      return {
        ...baseConfig,
        enableDebug: true,
        enableLogging: true,
        cacheSettings: {
          defaultTTL: 60, // 1 minute for faster development
          maxCacheSize: 100
        },
        rateLimiting: {
          enabled: false, // Disable rate limiting in development
          windowMs: 60 * 1000,
          maxRequests: 1000
        }
      }
  }
}

/**
 * Get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return createEnvironmentConfig()
}

/**
 * Environment validation
 */
export function validateRequiredEnvironmentVariables(): { isValid: boolean; missing: string[] } {
  const required = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ]
  
  // Add environment-specific requirements
  const environment = getCurrentEnvironment()
  if (environment === 'production') {
    required.push(
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  
  const missing = required.filter(key => !process.env[key])
  
  return {
    isValid: missing.length === 0,
    missing
  }
}

/**
 * Development helper to log environment status
 */
export function logEnvironmentStatus() {
  if (process.env.NODE_ENV === 'production') return // Don't log in production
  
  const config = getEnvironmentConfig()
  const validation = validateRequiredEnvironmentVariables()
  
  console.log('🌍 Environment Configuration:')
  console.log(`  Environment: ${config.environment}`)
  console.log(`  Debug Mode: ${config.enableDebug}`)
  console.log(`  Caching: ${config.enableCaching}`)
  console.log(`  Rate Limiting: ${config.rateLimiting.enabled}`)
  
  if (!validation.isValid) {
    console.warn('⚠️  Missing environment variables:', validation.missing)
  } else {
    console.log('✅ All required environment variables are set')
  }
}

/**
 * Get safe environment info for client-side display
 */
export function getClientSafeEnvironmentInfo() {
  const config = getEnvironmentConfig()
  
  return {
    environment: config.environment,
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction,
    enableDebug: config.enableDebug
  }
} 