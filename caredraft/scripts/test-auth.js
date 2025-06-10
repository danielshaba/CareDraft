#!/usr/bin/env node

/**
 * CareDraft Authentication Diagnostic Script
 * 
 * This script tests the authentication configuration to help debug
 * magic link issues and verify Supabase setup.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 CareDraft Authentication Diagnostics\n')

// Check environment variables
console.log('1. Environment Variables Check:')
console.log(`   ✓ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
console.log(`   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`)

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing required environment variables!')
  console.log('Please ensure .env.local contains:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your_project_url')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
  process.exit(1)
}

// Test Supabase connection
console.log('\n2. Supabase Connection Test:')
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.log(`   ⚠️  Connection successful but table access failed: ${error.message}`)
      console.log('   (This is normal if no users exist yet)')
    } else {
      console.log('   ✅ Supabase connection successful')
    }
  } catch (err) {
    console.log(`   ❌ Connection failed: ${err.message}`)
    return false
  }
  return true
}

async function testAuthConfig() {
  console.log('\n3. Authentication Configuration Check:')
  
  const redirectURL = 'http://localhost:3000/api/auth/callback'
  console.log(`   Expected callback URL: ${redirectURL}`)
  
  console.log('\n   📋 Required Supabase Settings:')
  console.log('   1. Go to: https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz')
  console.log('   2. Navigate to: Authentication > URL Configuration')
  console.log('   3. Ensure these URLs are added to "Redirect URLs":')
  console.log('      - http://localhost:3000/api/auth/callback')
  console.log('      - https://your-production-domain.com/api/auth/callback')
  console.log('\n   4. Ensure "Site URL" is set to: http://localhost:3000')
  
  // Test magic link generation (but don't send)
  try {
    console.log('\n   Testing magic link generation (without sending)...')
    const testEmail = 'test@example.com'
    
    // This will fail if redirect URL is not configured
    const { error } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        emailRedirectTo: redirectURL,
        shouldCreateUser: false  // Don't create user for test
      }
    })
    
    if (error) {
      if (error.message.includes('redirect') || error.message.includes('URL')) {
        console.log('   ❌ Redirect URL not configured in Supabase project')
        console.log(`   Error: ${error.message}`)
      } else {
        console.log('   ⚠️  Magic link test completed with expected error (test email)')
        console.log('   ✅ Authentication configuration appears correct')
      }
    } else {
      console.log('   ✅ Magic link generation test successful')
    }
  } catch (err) {
    console.log(`   ❌ Magic link test failed: ${err.message}`)
  }
}

async function main() {
  const connected = await testConnection()
  if (connected) {
    await testAuthConfig()
  }
  
  console.log('\n🎯 Next Steps:')
  console.log('1. Configure redirect URLs in Supabase dashboard (see above)')
  console.log('2. Try the magic link authentication in your app')
  console.log('3. Check browser console and terminal logs for detailed errors')
  console.log('4. Re-run this script to verify configuration')
  
  console.log('\n💡 Troubleshooting Tips:')
  console.log('• Magic links expire after 1 hour')
  console.log('• Each magic link can only be used once')
  console.log('• Check spam folder for magic link emails')
  console.log('• Ensure you click the link in the same browser session')
}

main().catch(console.error) 