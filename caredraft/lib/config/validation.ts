/**
 * Configuration Validation Utilities
 * Tests and validates API configurations and environment setup
 */

import { getSearchAPIConfig, validateEnvironment, getConfigurationStatus } from './search-apis'
import { getEnvironmentConfig, validateRequiredEnvironmentVariables } from './environment'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  details: {
    environment: {
      isValid: boolean
      missing: string[]
      current: string
    }
    searchAPIs: {
      isValid: boolean
      availableProviders: Array<'serper' | 'tavily'>
      hasMultipleProviders: boolean
      errors: string[]
    }
  }
}

/**
 * Comprehensive configuration validation
 */
export async function validateConfiguration(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validate environment variables
  const envValidation = validateRequiredEnvironmentVariables()
  const envConfig = getEnvironmentConfig()
  
  // Validate search APIs
  const searchValidation = validateEnvironment()
  const searchStatus = getConfigurationStatus()
  
  // Collect errors
  if (!envValidation.isValid) {
    errors.push(...envValidation.missing.map(key => `Missing required environment variable: ${key}`))
  }
  
  if (!searchValidation.isValid) {
    errors.push(...searchValidation.errors)
  }
  
  // Collect warnings
  if (searchStatus.availableProviders.length === 1) {
    warnings.push('Only one search provider is configured. Consider adding a backup provider for better reliability.')
  }
  
  if (envConfig.isDevelopment && !envConfig.rateLimiting.enabled) {
    warnings.push('Rate limiting is disabled in development. Enable it for production-like testing.')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    details: {
      environment: {
        isValid: envValidation.isValid,
        missing: envValidation.missing,
        current: envConfig.environment
      },
      searchAPIs: {
        isValid: searchValidation.isValid,
        availableProviders: searchStatus.availableProviders,
        hasMultipleProviders: searchStatus.hasMultipleProviders,
        errors: searchValidation.errors
      }
    }
  }
}

/**
 * Test API connectivity (mock implementation)
 */
export async function testAPIConnectivity(): Promise<{
  serper: { available: boolean; error?: string }
  tavily: { available: boolean; error?: string }
}> {
  const results = {
    serper: { available: false, error: undefined as string | undefined },
    tavily: { available: false, error: undefined as string | undefined }
  }
  
  try {
    const config = getSearchAPIConfig()
    
    // Test Serper if available
    if (config.serper.apiKey) {
      try {
        // Mock test - in real implementation, this would make a test API call
        // const response = await fetch(`${config.serper.baseUrl}/search`, {
        //   method: 'POST',
        //   headers: { 'X-API-KEY': config.serper.apiKey },
        //   body: JSON.stringify({ q: 'test' })
        // })
        results.serper.available = true
      } catch {
        results.serper.error = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      results.serper.error = 'API key not configured'
    }
    
    // Test Tavily if available
    if (config.tavily.apiKey) {
      try {
        // Mock test - in real implementation, this would make a test API call
        results.tavily.available = true
      } catch {
        results.tavily.error = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      results.tavily.error = 'API key not configured'
    }
    
  } catch {
    const errorMessage = error instanceof Error ? error.message : 'Configuration error'
    results.serper.error = errorMessage
    results.tavily.error = errorMessage
  }
  
  return results
}

/**
 * Generate configuration report for debugging
 */
export function generateConfigurationReport() {
  const envConfig = getEnvironmentConfig()
  const searchStatus = getConfigurationStatus()
  
  return {
    timestamp: new Date().toISOString(),
    environment: {
      name: envConfig.environment,
      isDevelopment: envConfig.isDevelopment,
      isProduction: envConfig.isProduction,
      debugging: envConfig.enableDebug,
      caching: envConfig.enableCaching,
      rateLimiting: envConfig.rateLimiting.enabled
    },
    searchAPIs: {
      configured: searchStatus.isConfigured,
      providers: searchStatus.availableProviders,
      fallback: searchStatus.fallbackEnabled,
      errors: searchStatus.errors
    },
    nextSteps: generateNextSteps(searchStatus, envConfig)
  }
}

/**
 * Generate actionable next steps based on configuration status
 */
function generateNextSteps(searchStatus: unknown, envConfig: unknown): string[] {
  const steps: string[] = []
  
  if (!searchStatus.isConfigured) {
    steps.push('Set up at least one search API key (SERPER_API_KEY or TAVILY_API_KEY) in your environment variables')
  }
  
  if (searchStatus.availableProviders.length === 1) {
    steps.push('Consider adding a second search provider for fallback functionality')
  }
  
  if (envConfig.isDevelopment && !process.env.OPENAI_API_KEY) {
    steps.push('Add OPENAI_API_KEY for LLM-powered result summarization')
  }
  
  if (envConfig.isProduction && !envConfig.rateLimiting.enabled) {
    steps.push('Enable rate limiting for production deployment')
  }
  
  return steps
}

/**
 * Quick health check for API endpoints
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  details: {
    configuration: boolean
    searchAPIs: boolean
    environment: boolean
  }
}> {
  const validation = await validateConfiguration()
  const connectivity = await testAPIConnectivity()
  
  const configHealthy = validation.isValid
  const searchHealthy = validation.details.searchAPIs.isValid && 
    (connectivity.serper.available || connectivity.tavily.available)
  const envHealthy = validation.details.environment.isValid
  
  let status: 'healthy' | 'degraded' | 'unhealthy'
  
  if (configHealthy && searchHealthy && envHealthy) {
    status = 'healthy'
  } else if (searchHealthy || (configHealthy && envHealthy)) {
    status = 'degraded'
  } else {
    status = 'unhealthy'
  }
  
  return {
    status,
    details: {
      configuration: configHealthy,
      searchAPIs: searchHealthy,
      environment: envHealthy
    }
  }
} 