#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * Tests environment variables and connection to Supabase
 */

require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection\n');
  
  // Test 1: Environment Variables
  console.log('1️⃣ Checking Environment Variables:');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log(`   SUPABASE_URL: ${url ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_ANON_KEY: ${key ? '✅ Set' : '❌ Missing'}`);
  
  if (!url || !key) {
    console.log('\n❌ Missing required environment variables');
    console.log('Please run: node scripts/setup-supabase-config.js');
    process.exit(1);
  }
  
  // Test 2: URL Format Validation
  console.log('\n2️⃣ Validating Configuration:');
  const urlValid = url.startsWith('https://') && url.includes('.supabase.co');
  const keyValid = key.startsWith('eyJ');
  
  console.log(`   URL format: ${urlValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Key format: ${keyValid ? '✅ Valid' : '❌ Invalid'}`);
  
  if (!urlValid || !keyValid) {
    console.log('\n❌ Invalid configuration format');
    process.exit(1);
  }
  
  // Test 3: Basic Connection Test
  console.log('\n3️⃣ Testing Connection:');
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'authorization': `Bearer ${key}`,
        'content-type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('   Connection: ✅ Success');
    } else {
      console.log(`   Connection: ❌ Failed (${response.status})`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`   Connection: ❌ Failed`);
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // Test 4: Database Schema Test
  console.log('\n4️⃣ Testing Database Schema:');
  try {
    const response = await fetch(`${url}/rest/v1/users?select=count`, {
      headers: {
        'apikey': key,
        'authorization': `Bearer ${key}`,
        'content-type': 'application/json',
        'prefer': 'count=exact'
      }
    });
    
    if (response.ok) {
      console.log('   Users table: ✅ Accessible');
    } else {
      console.log('   Users table: ❌ Not accessible');
    }
    
    const orgResponse = await fetch(`${url}/rest/v1/organizations?select=count`, {
      headers: {
        'apikey': key,
        'authorization': `Bearer ${key}`,
        'content-type': 'application/json',
        'prefer': 'count=exact'
      }
    });
    
    if (orgResponse.ok) {
      console.log('   Organizations table: ✅ Accessible');
    } else {
      console.log('   Organizations table: ❌ Not accessible');
    }
    
  } catch (error) {
    console.log(`   Schema test: ❌ Failed`);
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 5: Project Info
  console.log('\n5️⃣ Project Information:');
  console.log('   Project ID: ptikiknjujllkazyeeaz');
  console.log('   Project Name: CareDraft');
  console.log('   Region: eu-west-2');
  console.log('   Database: PostgreSQL 17.4.1.037');
  
  console.log('\n✅ Supabase connection test completed successfully!');
  console.log('\n🔗 Useful Links:');
  console.log('   Dashboard: https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz');
  console.log('   Database: https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz/editor');
  console.log('   Auth: https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz/auth/users');
}

// Run the test
if (require.main === module) {
  testSupabaseConnection().catch(console.error);
}

module.exports = { testSupabaseConnection }; 