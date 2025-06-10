import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { profileDataService, ProfileData } from '@/lib/services/profile-data-service'

export interface MigrationResult {
  success: boolean
  migratedUsersCount: number
  failedUsers: string[]
  errors: string[]
}

export class ProfileMigrationService {
  private supabase: any

  constructor() {
    this.supabase = createClientComponentClient()
  }

  /**
   * Migrate all existing users to the new profile system
   */
  async migrateAllUsers(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedUsersCount: 0,
      failedUsers: [],
      errors: []
    }

    try {
      // Get all users who don't have a profile record yet
      const { data: usersWithoutProfiles, error } = await this.supabase
        .from('auth.users')
        .select(`
          id, 
          email, 
          user_metadata,
          created_at
        `)
        .not('id', 'in', `(
          SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL
        )`)

      if (error) {
        result.errors.push(`Error fetching users: ${error.message}`)
        result.success = false
        return result
      }

      // Migrate each user
      for (const user of usersWithoutProfiles || []) {
        try {
          const migrated = await this.migrateUser(user)
          if (migrated) {
            result.migratedUsersCount++
          } else {
            result.failedUsers.push(user.id)
          }
        } catch (error) {
          result.failedUsers.push(user.id)
          result.errors.push(`Error migrating user ${user.id}: ${error}`)
        }
      }

      // If any users failed, mark overall as failed
      if (result.failedUsers.length > 0) {
        result.success = false
      }

    } catch (error) {
      result.errors.push(`Migration failed: ${error}`)
      result.success = false
    }

    return result
  }

  /**
   * Migrate a single user to the new profile system
   */
  async migrateUser(user: any): Promise<boolean> {
    try {
      // Check if user already has a profile
      const existingProfile = await profileDataService.getExistingProfileData(user.id)
      if (existingProfile) {
        console.log(`User ${user.id} already has a profile, skipping`)
        return true
      }

      // Extract available data from user metadata and auth
      const basicUserData = {
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        job_title: user.user_metadata?.job_title || user.user_metadata?.role || '',
        location: user.user_metadata?.location || '',
        bio: user.user_metadata?.bio || '',
        organization: user.user_metadata?.organization || user.user_metadata?.company || ''
      }

      // Use the profile service migration utility
      return await profileDataService.migrateExistingUser(user.id, basicUserData)

    } catch (error) {
      console.error(`Error migrating user ${user.id}:`, error)
      return false
    }
  }

  /**
   * Migrate users who completed onboarding but don't have synced profiles
   */
  async syncOnboardingUsers(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedUsersCount: 0,
      failedUsers: [],
      errors: []
    }

    try {
      // Get users who completed onboarding but haven't synced their profiles
      const { data: onboardingUsers, error } = await this.supabase
        .from('onboarding_progress')
        .select(`
          user_id,
          completed_at,
          company_basic_info,
          company_profile
        `)
        .not('completed_at', 'is', null)
        .not('user_id', 'in', `(
          SELECT user_id FROM user_profiles 
          WHERE onboarding_completed = true 
          AND user_id IS NOT NULL
        )`)

      if (error) {
        result.errors.push(`Error fetching onboarding users: ${error.message}`)
        result.success = false
        return result
      }

      // Sync each user's onboarding data
      for (const onboardingUser of onboardingUsers || []) {
        try {
          const syncResult = await profileDataService.syncOnboardingToProfile(onboardingUser.user_id)
          if (syncResult.success) {
            result.migratedUsersCount++
          } else {
            result.failedUsers.push(onboardingUser.user_id)
          }
        } catch (error) {
          result.failedUsers.push(onboardingUser.user_id)
          result.errors.push(`Error syncing user ${onboardingUser.user_id}: ${error}`)
        }
      }

      if (result.failedUsers.length > 0) {
        result.success = false
      }

    } catch (error) {
      result.errors.push(`Onboarding sync failed: ${error}`)
      result.success = false
    }

    return result
  }

  /**
   * Get migration status for the system
   */
  async getMigrationStatus(): Promise<{
    totalUsers: number
    usersWithProfiles: number
    usersWithoutProfiles: number
    onboardingCompletedUsers: number
    pendingMigrations: number
  }> {
    try {
      // Get total user count
      const { count: totalUsers } = await this.supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true })

      // Get users with profiles
      const { count: usersWithProfiles } = await this.supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Get users with completed onboarding
      const { count: onboardingCompletedUsers } = await this.supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('onboarding_completed', true)

      // Get users who completed onboarding but don't have synced profiles
      const { count: pendingMigrations } = await this.supabase
        .from('onboarding_progress')
        .select('*', { count: 'exact', head: true })
        .not('completed_at', 'is', null)
        .not('user_id', 'in', `(
          SELECT user_id FROM user_profiles 
          WHERE onboarding_completed = true 
          AND user_id IS NOT NULL
        )`)

      return {
        totalUsers: totalUsers || 0,
        usersWithProfiles: usersWithProfiles || 0,
        usersWithoutProfiles: (totalUsers || 0) - (usersWithProfiles || 0),
        onboardingCompletedUsers: onboardingCompletedUsers || 0,
        pendingMigrations: pendingMigrations || 0
      }

    } catch (error) {
      console.error('Error getting migration status:', error)
      return {
        totalUsers: 0,
        usersWithProfiles: 0,
        usersWithoutProfiles: 0,
        onboardingCompletedUsers: 0,
        pendingMigrations: 0
      }
    }
  }

  /**
   * Force sync a specific user's onboarding data to profile
   */
  async forceSyncUser(userId: string): Promise<{
    success: boolean
    conflicts: any[]
    profileData?: ProfileData
    error?: string
  }> {
    try {
      const result = await profileDataService.syncOnboardingToProfile(userId)
      return result
    } catch (error) {
      return {
        success: false,
        conflicts: [],
        error: `Error syncing user ${userId}: ${error}`
      }
    }
  }

  /**
   * Rollback migration for a specific user (delete profile and keep original data)
   */
  async rollbackUserMigration(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error(`Error rolling back user ${userId}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error in rollbackUserMigration for ${userId}:`, error)
      return false
    }
  }

  /**
   * Validate migrated data integrity
   */
  async validateMigratedData(): Promise<{
    isValid: boolean
    issues: string[]
    checkedProfiles: number
  }> {
    const result = {
      isValid: true,
      issues: [] as string[],
      checkedProfiles: 0
    }

    try {
      // Get all profiles to validate
      const { data: profiles, error } = await this.supabase
        .from('user_profiles')
        .select('*')

      if (error) {
        result.issues.push(`Error fetching profiles for validation: ${error.message}`)
        result.isValid = false
        return result
      }

      for (const profile of profiles || []) {
        result.checkedProfiles++

        // Validate required fields
        if (!profile.email) {
          result.issues.push(`Profile ${profile.user_id} missing email`)
          result.isValid = false
        }

        if (!profile.full_name) {
          result.issues.push(`Profile ${profile.user_id} missing full name`)
        }

        // Validate data types
        if (profile.organization_size && typeof profile.organization_size !== 'number') {
          result.issues.push(`Profile ${profile.user_id} has invalid organization_size type`)
          result.isValid = false
        }

        if (profile.organization_turnover && typeof profile.organization_turnover !== 'number') {
          result.issues.push(`Profile ${profile.user_id} has invalid organization_turnover type`)
          result.isValid = false
        }

        // Validate JSON fields
        try {
          if (profile.accreditations && typeof profile.accreditations === 'string') {
            JSON.parse(profile.accreditations)
          }
          if (profile.awards && typeof profile.awards === 'string') {
            JSON.parse(profile.awards)
          }
          if (profile.testimonials && typeof profile.testimonials === 'string') {
            JSON.parse(profile.testimonials)
          }
        } catch (_jsonError) {
          result.issues.push(`Profile ${profile.user_id} has invalid JSON data`)
          result.isValid = false
        }
      }

    } catch (error) {
      result.issues.push(`Validation failed: ${error}`)
      result.isValid = false
    }

    return result
  }
}

// Export singleton instance
export const profileMigrationService = new ProfileMigrationService() 