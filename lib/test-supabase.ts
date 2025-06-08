// Test file to verify Supabase client configuration
import { createClient } from './supabase'

export async function testSupabaseConnection() {
  try {
    const supabase = createClient()
    
    // Test connection by checking auth status
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    console.log('Session data:', data)
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    return false
  }
}

// Test environment variables
export function testEnvironmentVariables() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Environment Variables:')
  console.log('SUPABASE_URL:', url ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_ANON_KEY:', key ? '✅ Set' : '❌ Missing')
  
  return !!(url && key)
} 