/**
 * Supabase Configuration Helper
 * Generated with latest configuration from MCP tools
 */

export const SUPABASE_CONFIG = {
  // Project Details (from MCP tools)
  PROJECT_ID: 'ptikiknjujllkazyeeaz',
  PROJECT_NAME: 'CareDraft',
  ORGANIZATION_ID: 'ahjvowezlvygljzfzyao',
  REGION: 'eu-west-2',
  
  // Connection Details
  URL: 'https://ptikiknjujllkazyeeaz.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aWtpa25qdWpsbGthenllZWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTQ0MjEsImV4cCI6MjA2NDUzMDQyMX0.XwGS6--1PImPoDQIBQimq62qK1sLND5vY6Cr7qaZuTE',
  
  // Database
  DB_HOST: 'db.ptikiknjujllkazyeeaz.supabase.co',
  DB_VERSION: '17.4.1.037',
  
  // Environment Variables Required
  ENV_VARS: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://ptikiknjujllkazyeeaz.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aWtpa25qdWpsbGthenllZWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTQ0MjEsImV4cCI6MjA2NDUzMDQyMX0.XwGS6--1PImPoDQIBQimq62qK1sLND5vY6Cr7qaZuTE',
    // Note: Service role key should be configured separately for admin operations
  }
} as const;

/**
 * Environment Variable Validation
 */
export function validateSupabaseEnv(): { isValid: boolean; missingVars: string[]; errors: string[] } {
  const missingVars: string[] = [];
  const errors: string[] = [];
  
  // Check required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      // Validate format
      if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (!value.startsWith('https://') || !value.includes('.supabase.co')) {
          errors.push(`${varName} has invalid format. Expected: https://your-project.supabase.co`);
        }
      }
      
      if (varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        if (!value.startsWith('eyJ')) {
          errors.push(`${varName} has invalid format. Expected JWT token starting with 'eyJ'`);
        }
      }
    }
  }
  
  return {
    isValid: missingVars.length === 0 && errors.length === 0,
    missingVars,
    errors
  };
}

/**
 * Get environment configuration status
 */
export function getConfigStatus() {
  const validation = validateSupabaseEnv();
  
  return {
    ...validation,
    currentUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
    currentKeySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    projectId: SUPABASE_CONFIG.PROJECT_ID,
    projectName: SUPABASE_CONFIG.PROJECT_NAME,
    region: SUPABASE_CONFIG.REGION
  };
}

/**
 * Generate .env.local content
 */
export function generateEnvLocalContent(): string {
  return `# CareDraft Environment Variables
# Generated from Supabase MCP configuration

# Supabase Configuration (CareDraft Project)
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_CONFIG.URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.ANON_KEY}
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
PRIMARY_OPENAI_MODEL=gpt-4.1-mini
FALLBACK_OPENAI_MODEL=gpt-4.1-nano

# External Search APIs
SERPER_API_KEY=your_serper_api_key
TAVILY_API_KEY=your_tavily_api_key

# Email Service Configuration
RESEND_API_KEY=your_resend_api_key

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Project Details (Reference)
# Project ID: ${SUPABASE_CONFIG.PROJECT_ID}
# Organization ID: ${SUPABASE_CONFIG.ORGANIZATION_ID}
# Region: ${SUPABASE_CONFIG.REGION}
# Database: ${SUPABASE_CONFIG.DB_HOST}
`;
}

/**
 * Display setup instructions
 */
export function getSetupInstructions(): string {
  return `
🔧 Supabase Configuration Setup Instructions

Your Supabase project is already configured and active:
  ✅ Project: ${SUPABASE_CONFIG.PROJECT_NAME}
  ✅ Region: ${SUPABASE_CONFIG.REGION}
  ✅ Status: ACTIVE_HEALTHY
  ✅ Database: PostgreSQL ${SUPABASE_CONFIG.DB_VERSION}

To complete setup:

1. Create .env.local file in your project root:
   Copy the content from the generateEnvLocalContent() function

2. Required environment variables are pre-configured:
   - NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_CONFIG.URL}
   - NEXT_PUBLIC_SUPABASE_ANON_KEY: [Configured]

3. Optional: Add service role key for admin operations:
   - Get it from: https://supabase.com/dashboard/project/${SUPABASE_CONFIG.PROJECT_ID}/settings/api

4. Add other API keys as needed:
   - OpenAI API key for AI features
   - Resend API key for email notifications
   - Search API keys for research features

5. Test the connection:
   Run the test script: npm run test:supabase

🔗 Useful Links:
  - Dashboard: https://supabase.com/dashboard/project/${SUPABASE_CONFIG.PROJECT_ID}
  - Database: https://supabase.com/dashboard/project/${SUPABASE_CONFIG.PROJECT_ID}/editor
  - Auth: https://supabase.com/dashboard/project/${SUPABASE_CONFIG.PROJECT_ID}/auth/users
  - API Keys: https://supabase.com/dashboard/project/${SUPABASE_CONFIG.PROJECT_ID}/settings/api
`;
} 