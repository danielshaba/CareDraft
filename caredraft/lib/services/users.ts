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
  async searchUsers(_query: string, _limit: number = 10): Promise<UserSearchResult[]> {
    return []
  }

  /**
   * Get user details by ID
   */
  async getUserById(_userId: string): Promise<UserSearchResult | null> {
    return null
  }

  /**
   * Get multiple users by IDs
   */
  async getUsersByIds(_userIds: string[]): Promise<UserSearchResult[]> {
    return []
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
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }
}

export const usersService = new UsersService()
export default usersService 