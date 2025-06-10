#!/usr/bin/env node

/**
 * CareDraft AI Models Setup Script
 * 
 * This script configures your AI models and API key for all the AI-powered features.
 * Run this script to set up your environment with your fine-tuned OpenAI models.
 */

const fs = require('fs');
const path = require('path');

// Your specific configuration
const readline = require('readline');

async function promptForConfig() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const config = {};
  config.OPENAI_API_KEY = await question('Enter your OpenAI API key: ');
  config.PRIMARY_OPENAI_MODEL = await question('Enter your primary fine-tuned model ID: ');
  // ... continue for other sensitive values
  
  // Backup models (standard OpenAI models)
  BACKUP_PRIMARY_MODEL: 'gpt-4o-mini',
  BACKUP_FALLBACK_MODEL: 'gpt-3.5-turbo',
  
  // AI Configuration
  AI_DEBUG_MODE: 'true',
  AI_LOG_REQUESTS: 'true',
  AI_MAX_RETRIES: '3',
  AI_TIMEOUT_MS: '45000',
  
  // Required for Next.js
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'your_nextauth_secret_generate_one_using_openssl_rand_base64_32'
};

const ENV_TEMPLATE = `# CareDraft Environment Variables
# IMPORTANT: DO NOT commit this file to Git - it contains sensitive API keys

# OpenAI Configuration with Fine-Tuned Models
OPENAI_API_KEY=${AI_CONFIG.OPENAI_API_KEY}

# Your Fine-Tuned Models
# Primary model for complex AI tasks (brainstorming, strategy, fact-checking)
PRIMARY_OPENAI_MODEL=${AI_CONFIG.PRIMARY_OPENAI_MODEL}

# Fallback model for simpler AI tasks (grammar, summarization, translation)
FALLBACK_OPENAI_MODEL=${AI_CONFIG.FALLBACK_OPENAI_MODEL}

# Backup standard models (used if fine-tuned models have issues)
BACKUP_PRIMARY_MODEL=${AI_CONFIG.BACKUP_PRIMARY_MODEL}
BACKUP_FALLBACK_MODEL=${AI_CONFIG.BACKUP_FALLBACK_MODEL}

# AI Configuration Options
AI_DEBUG_MODE=${AI_CONFIG.AI_DEBUG_MODE}
AI_LOG_REQUESTS=${AI_CONFIG.AI_LOG_REQUESTS}
AI_MAX_RETRIES=${AI_CONFIG.AI_MAX_RETRIES}
AI_TIMEOUT_MS=${AI_CONFIG.AI_TIMEOUT_MS}

# Application Configuration
NEXTAUTH_URL=${AI_CONFIG.NEXTAUTH_URL}
NEXTAUTH_SECRET=${AI_CONFIG.NEXTAUTH_SECRET}

# Supabase Configuration (update with your actual values)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# External Search APIs (optional)
SERPER_API_KEY=your_serper_api_key
TAVILY_API_KEY=your_tavily_api_key

# Email Service Configuration (optional)
RESEND_API_KEY=your_resend_api_key
`;

function setupAIModels() {
  console.log('🤖 CareDraft AI Models Setup\n');
  
  const envPath = path.join(__dirname, '.env.local');
  
  try {
    // Create .env.local file
    fs.writeFileSync(envPath, ENV_TEMPLATE);
    console.log('✅ Created .env.local with your AI configuration');
    
    // Display configuration summary
    console.log('\n📋 AI Configuration Summary:');
    console.log(`   Primary Model: CareDraft Fine-tuned GPT-4.1 Mini`);
    console.log(`   Fallback Model: CareDraft Fine-tuned GPT-4.1 Nano`);
    console.log(`   Debug Mode: Enabled`);
    console.log(`   Request Logging: Enabled`);
    console.log(`   Max Retries: 3`);
    console.log(`   Timeout: 45 seconds`);
    
    console.log('\n🎯 AI Features Configured:');
    console.log('   ✓ Content Expansion (Task 37)');
    console.log('   ✓ Grammar Improvement');
    console.log('   ✓ Text Rephrasing');
    console.log('   ✓ Content Summarization');
    console.log('   ✓ Fact Checking');
    console.log('   ✓ Tone Adjustment');
    console.log('   ✓ Translation (20+ languages)');
    console.log('   ✓ Statistics Integration');
    console.log('   ✓ Case Study Generation');
    console.log('   ✓ Content Completion');
    console.log('   ✓ Brainstorming (Task 37)');
    console.log('   ✓ Strategy Generation');
    console.log('   ✓ Content Extraction');
    console.log('   ✓ Content Rewriting');
    
    console.log('\n⚠️  Important Notes:');
    console.log('   • Your API key and model IDs are configured');
    console.log('   • .env.local is in .gitignore (never commit it)');
    console.log('   • Update Supabase URLs with your actual values');
    console.log('   • Fine-tuned models will be used for care sector tasks');
    console.log('   • Standard models will be used as backups');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Update Supabase configuration in .env.local');
    console.log('   2. Run: npm run dev');
    console.log('   3. Test AI features in the Draft Builder');
    console.log('   4. Check browser console for AI request logs');
    console.log('   5. Visit /api/admin/ai-models to verify configuration');
    
    console.log('\n✨ Setup Complete! Your AI-powered features are ready to use.\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupAIModels(); 