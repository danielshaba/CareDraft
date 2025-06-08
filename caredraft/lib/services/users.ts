import { createClient } from '@/lib/supabase'

export interface UserSearchResult {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

export class UsersService {
  private supabase = createClient()

  /**
   * Search users by name or email for @mentions
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserSearchResult[]> {
    if (!query.trim()) return []

    try {
      const { data, error } = await this.supabase
        .from('auth.users')
        .select(`
          id,
          email,
          user_metadata
        `)
        .or(`email.ilike.%${query}%,user_metadata->>full_name.ilike.%${query}%`)
        .limit(limit)

      if (error) throw error

      return data.map((user: unknown) => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      }))
    } catch {
      console.error('Error searching users:', error)
      return []
    }
  }

  /**
   * Get user details by ID
   */
  async getUserById(userId: string): Promise<UserSearchResult | null> {
    try {
      const { data, error } = await this.supabase
        .from('auth.users')
        .select(`
          id,
          email,
          user_metadata
        `)
        .eq('id', userId)
        .single()

      if (error) throw error

      return {
        id: data.id,
        email: data.email,
        full_name: data.user_metadata?.full_name,
        avatar_url: data.user_metadata?.avatar_url
      }
    } catch {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  /**
   * Get multiple users by IDs
   */
  async getUsersByIds(userIds: string[]): Promise<UserSearchResult[]> {
    if (userIds.length === 0) return []

    try {
      const { data, error } = await this.supabase
        .from('auth.users')
        .select(`
          id,
          email,
          user_metadata
        `)
        .in('id', userIds)

      if (error) throw error

      return data.map((user: unknown) => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      }))
    } catch {
      console.error('Error getting users by IDs:', error)
      return []
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<UserSearchResult | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) return null

      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      }
    } catch {
      console.error('Error getting current user:', error)
      return null
    }
  }
} 