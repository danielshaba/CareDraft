/**
 * Exa AI MCP Tools Configuration
 * Manages configuration and settings for Exa AI MCP tools integration
 */

export interface ExaAIToolConfig {
  name: string
  enabled: boolean
  timeout: number
  retryAttempts: number
  retryDelay: number
  rateLimit: {
    requestsPerMinute: number
    requestsPerHour: number
  }
}

export interface ExaAIConfiguration {
  tools: {
    webSearch: ExaAIToolConfig
    researchPapers: ExaAIToolConfig
    companyResearch: ExaAIToolConfig
    crawling: ExaAIToolConfig
    competitorFinder: ExaAIToolConfig
    linkedinSearch: ExaAIToolConfig
    wikipediaSearch: ExaAIToolConfig
    githubSearch: ExaAIToolConfig
  }
  defaultTool: keyof ExaAIConfiguration['tools']
  fallbackEnabled: boolean
  caching: {
    enabled: boolean
    defaultTTL: number // seconds
    maxCacheSize: number
  }
  careIndustryOptimization: {
    enabled: boolean
    keywords: string[]
    priorityDomains: string[]
    excludeDomains: string[]
  }
}

/**
 * Default configuration for Exa AI tools
 */
const defaultToolConfig: ExaAIToolConfig = {
  name: '',
  enabled: true,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  rateLimit: {
    requestsPerMinute: 10,
    requestsPerHour: 100
  }
}

/**
 * Create Exa AI configuration based on environment
 */
function createExaAIConfiguration(): ExaAIConfiguration {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    tools: {
      webSearch: {
        ...defaultToolConfig,
        name: 'mcp_exa_web_search_exa',
        rateLimit: {
          requestsPerMinute: isDevelopment ? 20 : 10,
          requestsPerHour: isDevelopment ? 200 : 100
        }
      },
      researchPapers: {
        ...defaultToolConfig,
        name: 'mcp_exa_research_paper_search',
        timeout: 45000, // Research papers may take longer
        rateLimit: {
          requestsPerMinute: 5, // More conservative for research
          requestsPerHour: 50
        }
      },
      companyResearch: {
        ...defaultToolConfig,
        name: 'mcp_exa_company_research',
        timeout: 60000, // Company research can be comprehensive
        rateLimit: {
          requestsPerMinute: 3,
          requestsPerHour: 30
        }
      },
      crawling: {
        ...defaultToolConfig,
        name: 'mcp_exa_crawling',
        timeout: 45000,
        rateLimit: {
          requestsPerMinute: 5,
          requestsPerHour: 50
        }
      },
      competitorFinder: {
        ...defaultToolConfig,
        name: 'mcp_exa_competitor_finder',
        rateLimit: {
          requestsPerMinute: 3,
          requestsPerHour: 25
        }
      },
      linkedinSearch: {
        ...defaultToolConfig,
        name: 'mcp_exa_linkedin_search',
        rateLimit: {
          requestsPerMinute: 5,
          requestsPerHour: 40
        }
      },
      wikipediaSearch: {
        ...defaultToolConfig,
        name: 'mcp_exa_wikipedia_search_exa',
        rateLimit: {
          requestsPerMinute: 15,
          requestsPerHour: 150
        }
      },
      githubSearch: {
        ...defaultToolConfig,
        name: 'mcp_exa_github_search',
        rateLimit: {
          requestsPerMinute: 10,
          requestsPerHour: 100
        }
      }
    },
    defaultTool: 'webSearch',
    fallbackEnabled: true,
    caching: {
      enabled: !isDevelopment, // Disable caching in development for fresh results
      defaultTTL: isProduction ? 3600 : 1800, // 1 hour in prod, 30 min in staging
      maxCacheSize: isProduction ? 10000 : 1000
    },
    careIndustryOptimization: {
      enabled: true,
      keywords: [
        'healthcare', 'care', 'nursing', 'elderly care', 'disability support',
        'home care', 'residential care', 'domiciliary care', 'social care',
        'mental health', 'dementia care', 'palliative care', 'rehabilitation',
        'care standards', 'CQC', 'care quality', 'safeguarding', 'person-centered care',
        'care planning', 'risk assessment', 'medication management', 'care documentation',
        'care compliance', 'care regulations', 'care best practices', 'care training',
        'care workforce', 'care technology', 'assistive technology', 'telecare',
        'care innovation', 'care research', 'care policy', 'care funding'
      ],
      priorityDomains: [
        'nhs.uk', 'cqc.org.uk', 'nice.org.uk', 'gov.uk', 'skillsforcare.org.uk',
        'scie.org.uk', 'alzheimers.org.uk', 'mencap.org.uk', 'age-uk.org.uk',
        'carers.org', 'healthwatch.co.uk', 'rcn.org.uk', 'nursingtimes.net',
        'communitycare.co.uk', 'carehome.co.uk', 'homecare.co.uk'
      ],
      excludeDomains: [
        'spam-domain.com', 'low-quality-content.net'
        // Add domains to exclude from care industry searches
      ]
    }
  }
}

/**
 * Get Exa AI configuration
 */
export function getExaAIConfig(): ExaAIConfiguration {
  return createExaAIConfiguration()
}

/**
 * Get configuration for a specific tool
 */
export function getToolConfig(toolName: keyof ExaAIConfiguration['tools']): ExaAIToolConfig {
  const config = getExaAIConfig()
  return config.tools[toolName]
}

/**
 * Check if a tool is available and enabled
 */
export function isToolAvailable(toolName: keyof ExaAIConfiguration['tools']): boolean {
  const config = getToolConfig(toolName)
  return config.enabled
}

/**
 * Get available tools list
 */
export function getAvailableTools(): Array<keyof ExaAIConfiguration['tools']> {
  const config = getExaAIConfig()
  return Object.keys(config.tools).filter(tool => 
    config.tools[tool as keyof ExaAIConfiguration['tools']].enabled
  ) as Array<keyof ExaAIConfiguration['tools']>
}

/**
 * Validate Exa AI configuration
 */
export function validateExaAIConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const config = getExaAIConfig()
  
  // Check if at least one tool is enabled
  const enabledTools = getAvailableTools()
  if (enabledTools.length === 0) {
    errors.push('No Exa AI tools are enabled')
  }
  
  // Validate tool configurations
  Object.entries(config.tools).forEach(([toolName, toolConfig]) => {
    if (toolConfig.enabled) {
      if (!toolConfig.name) {
        errors.push(`Tool ${toolName} is missing name configuration`)
      }
      
      if (toolConfig.timeout <= 0) {
        errors.push(`Tool ${toolName} has invalid timeout configuration`)
      }
      
      if (toolConfig.rateLimit.requestsPerMinute <= 0) {
        errors.push(`Tool ${toolName} has invalid rate limit configuration`)
      }
    }
  })
  
  // Validate caching configuration
  if (config.caching.enabled && config.caching.defaultTTL <= 0) {
    errors.push('Invalid cache TTL configuration')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get configuration status for debugging
 */
export function getConfigurationStatus() {
  const config = getExaAIConfig()
  const validation = validateExaAIConfig()
  const availableTools = getAvailableTools()
  
  return {
    isConfigured: validation.isValid,
    availableTools,
    toolCount: availableTools.length,
    fallbackEnabled: config.fallbackEnabled,
    cachingEnabled: config.caching.enabled,
    careOptimizationEnabled: config.careIndustryOptimization.enabled,
    errors: validation.errors,
    environment: process.env.NODE_ENV || 'development'
  }
}

/**
 * Get care industry optimized search parameters
 */
export function getCareIndustrySearchParams() {
  const config = getExaAIConfig()
  
  if (!config.careIndustryOptimization.enabled) {
    return null
  }
  
  return {
    keywords: config.careIndustryOptimization.keywords,
    priorityDomains: config.careIndustryOptimization.priorityDomains,
    excludeDomains: config.careIndustryOptimization.excludeDomains
  }
}

/**
 * Development helper to log configuration status
 */
export function logExaAIStatus() {
  if (process.env.NODE_ENV === 'production') return
  
  const status = getConfigurationStatus()
  
  console.log('🔍 Exa AI Configuration:')
  console.log(`  Available Tools: ${status.toolCount}`)
  console.log(`  Tools: ${status.availableTools.join(', ')}`)
  console.log(`  Fallback: ${status.fallbackEnabled}`)
  console.log(`  Caching: ${status.cachingEnabled}`)
  console.log(`  Care Optimization: ${status.careOptimizationEnabled}`)
  
  if (status.errors.length > 0) {
    console.warn('⚠️  Configuration errors:', status.errors)
  } else {
    console.log('✅ Exa AI configuration is valid')
  }
} 