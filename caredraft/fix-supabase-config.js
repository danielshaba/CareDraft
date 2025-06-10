#!/usr/bin/env node

/**
 * Quick fix for Supabase configuration
 * This replaces the invalid placeholder URLs with temporary valid ones
 */

const fs = require('fs');
const path = require('path');

function fixSupabaseConfig() {
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    return;
  }

  let content = fs.readFileSync(envPath, 'utf8');
  
  // Replace the invalid Supabase URLs with temporary valid ones
  content = content.replace(
    'NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url',
    'NEXT_PUBLIC_SUPABASE_URL=https://temporary-placeholder.supabase.co'
  );
  
  content = content.replace(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=temporary-placeholder-key'
  );
  
  content = content.replace(
    'SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key',
    'SUPABASE_SERVICE_ROLE_KEY=temporary-placeholder-service-key'
  );

  fs.writeFileSync(envPath, content);
  
  console.log('✅ Fixed Supabase configuration with temporary values');
  console.log('🔧 Your AI features should now work!');
  console.log('⚠️  Note: You still need to set up a real Supabase project for full functionality');
  console.log('');
  console.log('Next steps:');
  console.log('1. Restart the dev server: npm run dev');
  console.log('2. Test AI features at: http://localhost:3000');
  console.log('3. Set up Supabase project later for authentication/database');
}

fixSupabaseConfig(); 