import { createClient } from './supabase'
import { getUserProfile } from './auth.utils'
import { UserProfile } from './auth.types'

export interface AuthSession {
  user: UserProfile | null
}

/**
 * Server-side authentication for API routes
 * Returns the authenticated user's session or null if unauthenticated
 */
export async function auth(): Promise<AuthSession> {
  try {
    const supabase = createClient()
    
    // Get the current user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null }
    }
    
    // Get the full user profile
    const userProfile = await getUserProfile(user.id)
    
    return { user: userProfile }
  } catch (error) {
    console.error('Error in auth():', error)
    return { user: null }
  }
} 