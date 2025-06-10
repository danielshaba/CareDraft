import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Types for profile data mapping
export interface OnboardingData {
  // Basic company info from onboarding
  companyBasicInfo: {
    name: string
    address: {
      line1: string
      line2?: string
      city: string
      postcode: string
      country: string
    }
    adminEmail: string
  }
  
  // Company profile from onboarding
  companyProfile: {
    sector: 'domiciliary' | 'residential' | 'supported_living' | 'other'
    staffCount: number
    annualTurnover: number
    establishedYear?: number
    accreditations: {
      iso9001: boolean
      iso14001: boolean
      cqcRating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | null
      cyberEssentials: boolean
      cyberEssentialsPlus: boolean
      soc2: boolean
      other: string[]
    }
    awards: Array<{
      title: string
      year: number
      description?: string
    }>
    testimonials: Array<{
      clientName: string
      quote: string
      position?: string
      company?: string
    }>
    companyDescription: string
    missionStatement?: string
    valuesStatement?: string
  }
  
  // User metadata from auth
  userMetadata: {
    full_name?: string
    phone?: string
    job_title?: string
    location?: string
    bio?: string
  }
}

export interface ProfileData {
  // Personal information
  fullName: string
  email: string
  phone: string
  jobTitle: string
  location: string
  bio: string
  
  // Company information
  organization: string
  organizationAddress: string
  organizationSector: string
  organizationSize: number
  organizationTurnover: number
  organizationEstablished?: number
  organizationDescription: string
  organizationMission?: string
  organizationValues?: string
  
  // Accreditations and awards
  accreditations: Array<{
    type: string
    name: string
    status: string
    verified: boolean
  }>
  awards: Array<{
    title: string
    year: number
    description?: string
  }>
  testimonials: Array<{
    clientName: string
    quote: string
    position?: string
    company?: string
  }>
  
  // Profile settings
  emailNotifications: boolean
  publicProfile: boolean
  lastSyncedAt?: Date
  onboardingCompleted: boolean
}

export interface DataConflictResolution {
  field: string
  existingValue: any
  newValue: any
  resolution: 'keep_existing' | 'use_new' | 'merge' | 'manual_review'
  timestamp: Date
}

export class ProfileDataService {
  private supabase: any
  
  constructor() {
    this.supabase = createClientComponentClient()
  }

  /**
   * Fetch onboarding data for a user from various sources
   */
  async fetchOnboardingData(userId: string): Promise<OnboardingData | null> {
    try {
      // Fetch from onboarding_progress table
      const { data: onboardingData, error: onboardingError } = await this.supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (onboardingError && onboardingError.code !== 'PGRST116') {
        console.error('Error fetching onboarding data:', onboardingError)
        return null
      }

      // Fetch user metadata from auth
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError) {
        console.error('Error fetching user:', userError)
        return null
      }

      // Fetch organization data if exists
      const { data: orgData, error: orgError } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('admin_user_id', userId)
        .single()

      if (orgError && orgError.code !== 'PGRST116') {
        console.error('Error fetching organization data:', orgError)
      }

      // Map the data to our standardized format
      return this.mapOnboardingData(onboardingData, user, orgData)
    } catch (error) {
      console.error('Error in fetchOnboardingData:', error)
      return null
    }
  }

  /**
   * Map raw data to standardized onboarding format
   */
  private mapOnboardingData(onboardingData: any, user: any, orgData: any): OnboardingData {
    const companyBasicInfo = onboardingData?.company_basic_info || orgData || {}
    const companyProfile = onboardingData?.company_profile || {}
    
    return {
      companyBasicInfo: {
        name: companyBasicInfo.name || orgData?.name || '',
        address: {
          line1: companyBasicInfo.address?.line1 || orgData?.address_line1 || '',
          line2: companyBasicInfo.address?.line2 || orgData?.address_line2 || '',
          city: companyBasicInfo.address?.city || orgData?.city || '',
          postcode: companyBasicInfo.address?.postcode || orgData?.postcode || '',
          country: companyBasicInfo.address?.country || orgData?.country || 'United Kingdom'
        },
        adminEmail: companyBasicInfo.adminEmail || user?.email || ''
      },
      companyProfile: {
        sector: companyProfile.sector || orgData?.sector || 'other',
        staffCount: companyProfile.staffCount || orgData?.staff_count || 1,
        annualTurnover: companyProfile.annualTurnover || orgData?.annual_turnover || 0,
        establishedYear: companyProfile.establishedYear || orgData?.established_year,
        accreditations: {
          iso9001: companyProfile.accreditations?.iso9001 || false,
          iso14001: companyProfile.accreditations?.iso14001 || false,
          cqcRating: companyProfile.accreditations?.cqcRating || null,
          cyberEssentials: companyProfile.accreditations?.cyberEssentials || false,
          cyberEssentialsPlus: companyProfile.accreditations?.cyberEssentialsPlus || false,
          soc2: companyProfile.accreditations?.soc2 || false,
          other: companyProfile.accreditations?.other || []
        },
        awards: companyProfile.awards || orgData?.awards || [],
        testimonials: companyProfile.testimonials || orgData?.testimonials || [],
        companyDescription: companyProfile.companyDescription || orgData?.description || '',
        missionStatement: companyProfile.missionStatement || orgData?.mission || '',
        valuesStatement: companyProfile.valuesStatement || orgData?.values || ''
      },
      userMetadata: {
        full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
        phone: user?.user_metadata?.phone || '',
        job_title: user?.user_metadata?.job_title || user?.user_metadata?.role || '',
        location: user?.user_metadata?.location || '',
        bio: user?.user_metadata?.bio || ''
      }
    }
  }

  /**
   * Convert onboarding data to profile format
   */
  mapToProfileData(onboardingData: OnboardingData): ProfileData {
    const { companyBasicInfo, companyProfile, userMetadata } = onboardingData

    // Format address
    const addressParts = [
      companyBasicInfo.address.line1,
      companyBasicInfo.address.line2,
      companyBasicInfo.address.city,
      companyBasicInfo.address.postcode,
      companyBasicInfo.address.country
    ].filter(Boolean)
    const organizationAddress = addressParts.join(', ')

    // Map accreditations to standardized format
    const accreditations = []
    if (companyProfile.accreditations.iso9001) {
      accreditations.push({
        type: 'quality',
        name: 'ISO 9001',
        status: 'active',
        verified: true
      })
    }
    if (companyProfile.accreditations.iso14001) {
      accreditations.push({
        type: 'environmental',
        name: 'ISO 14001',
        status: 'active',
        verified: true
      })
    }
    if (companyProfile.accreditations.cqcRating) {
      accreditations.push({
        type: 'regulation',
        name: `CQC Rating: ${companyProfile.accreditations.cqcRating}`,
        status: 'active',
        verified: true
      })
    }
    if (companyProfile.accreditations.cyberEssentials) {
      accreditations.push({
        type: 'security',
        name: 'Cyber Essentials',
        status: 'active',
        verified: true
      })
    }
    if (companyProfile.accreditations.cyberEssentialsPlus) {
      accreditations.push({
        type: 'security',
        name: 'Cyber Essentials Plus',
        status: 'active',
        verified: true
      })
    }
    if (companyProfile.accreditations.soc2) {
      accreditations.push({
        type: 'security',
        name: 'SOC 2',
        status: 'active',
        verified: true
      })
    }
    // Add other accreditations
    companyProfile.accreditations.other.forEach(acc => {
      accreditations.push({
        type: 'other',
        name: acc,
        status: 'active',
        verified: false
      })
    })

    return {
      // Personal information
      fullName: userMetadata.full_name || '',
      email: companyBasicInfo.adminEmail,
      phone: userMetadata.phone || '',
      jobTitle: userMetadata.job_title || '',
      location: userMetadata.location || companyBasicInfo.address.city || '',
      bio: userMetadata.bio || '',
      
      // Company information
      organization: companyBasicInfo.name,
      organizationAddress,
      organizationSector: this.formatSector(companyProfile.sector),
      organizationSize: companyProfile.staffCount,
      organizationTurnover: companyProfile.annualTurnover,
      organizationEstablished: companyProfile.establishedYear,
      organizationDescription: companyProfile.companyDescription,
      organizationMission: companyProfile.missionStatement,
      organizationValues: companyProfile.valuesStatement,
      
      // Accreditations and awards
      accreditations,
      awards: companyProfile.awards,
      testimonials: companyProfile.testimonials,
      
      // Profile settings
      emailNotifications: true, // Default
      publicProfile: false, // Default
      lastSyncedAt: new Date(),
      onboardingCompleted: true
    }
  }

  /**
   * Get existing profile data from user_profiles table
   */
  async getExistingProfileData(userId: string): Promise<ProfileData | null> {
    try {
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching existing profile:', error)
        return null
      }

      return profile ? this.mapDatabaseProfileToProfileData(profile) : null
    } catch (error) {
      console.error('Error in getExistingProfileData:', error)
      return null
    }
  }

  /**
   * Map database profile to ProfileData format
   */
  private mapDatabaseProfileToProfileData(dbProfile: any): ProfileData {
    return {
      fullName: dbProfile.full_name || '',
      email: dbProfile.email || '',
      phone: dbProfile.phone || '',
      jobTitle: dbProfile.job_title || '',
      location: dbProfile.location || '',
      bio: dbProfile.bio || '',
      organization: dbProfile.organization || '',
      organizationAddress: dbProfile.organization_address || '',
      organizationSector: dbProfile.organization_sector || '',
      organizationSize: dbProfile.organization_size || 1,
      organizationTurnover: dbProfile.organization_turnover || 0,
      organizationEstablished: dbProfile.organization_established,
      organizationDescription: dbProfile.organization_description || '',
      organizationMission: dbProfile.organization_mission || '',
      organizationValues: dbProfile.organization_values || '',
      accreditations: dbProfile.accreditations || [],
      awards: dbProfile.awards || [],
      testimonials: dbProfile.testimonials || [],
      emailNotifications: dbProfile.email_notifications ?? true,
      publicProfile: dbProfile.public_profile ?? false,
      lastSyncedAt: dbProfile.last_synced_at ? new Date(dbProfile.last_synced_at) : undefined,
      onboardingCompleted: dbProfile.onboarding_completed ?? false
    }
  }

  /**
   * Detect conflicts between existing and new data
   */
  detectConflicts(existingData: ProfileData, newData: ProfileData): DataConflictResolution[] {
    const conflicts: DataConflictResolution[] = []
    const timestamp = new Date()

    // Check each field for conflicts
    const fieldsToCheck = [
      'fullName', 'phone', 'jobTitle', 'location', 'bio',
      'organization', 'organizationAddress', 'organizationSector',
      'organizationSize', 'organizationTurnover', 'organizationDescription'
    ]

    fieldsToCheck.forEach(field => {
      const existingValue = existingData[field as keyof ProfileData]
      const newValue = newData[field as keyof ProfileData]

      if (existingValue && newValue && existingValue !== newValue) {
        // Determine resolution strategy
        let resolution: DataConflictResolution['resolution'] = 'manual_review'
        
        // Auto-resolve certain conflicts
        if (field === 'organizationSize' || field === 'organizationTurnover') {
          // For numeric fields, use the larger value
          resolution = Number(newValue) > Number(existingValue) ? 'use_new' : 'keep_existing'
        } else if (field === 'organizationDescription' && String(newValue).length > String(existingValue).length) {
          // For descriptions, prefer the longer one
          resolution = 'use_new'
        } else if (!existingValue || String(existingValue).trim() === '') {
          // If existing is empty, use new
          resolution = 'use_new'
        } else if (!newValue || String(newValue).trim() === '') {
          // If new is empty, keep existing
          resolution = 'keep_existing'
        }

        conflicts.push({
          field,
          existingValue,
          newValue,
          resolution,
          timestamp
        })
      }
    })

    return conflicts
  }

  /**
   * Merge data resolving conflicts based on resolution strategy
   */
  mergeData(existingData: ProfileData, newData: ProfileData, conflicts: DataConflictResolution[]): ProfileData {
    const merged = { ...existingData }

    // Apply non-conflicting new data
    Object.keys(newData).forEach(key => {
      const field = key as keyof ProfileData
      if (!conflicts.find(c => c.field === field)) {
        if (newData[field] !== undefined && newData[field] !== null && newData[field] !== '') {
          merged[field] = newData[field] as any
        }
      }
    })

    // Apply conflict resolutions
    conflicts.forEach(conflict => {
      const field = conflict.field as keyof ProfileData
      switch (conflict.resolution) {
        case 'use_new':
          merged[field] = conflict.newValue as any
          break
        case 'keep_existing':
          // Already has existing value
          break
        case 'merge':
          // For arrays, merge them
          if (Array.isArray(conflict.existingValue) && Array.isArray(conflict.newValue)) {
            merged[field] = [...conflict.existingValue, ...conflict.newValue] as any
          }
          break
        case 'manual_review':
          // Keep existing for manual review, but flag it
          console.warn(`Manual review required for field: ${field}`)
          break
      }
    })

    // Update sync timestamp
    merged.lastSyncedAt = new Date()
    merged.onboardingCompleted = true

    return merged
  }

  /**
   * Save merged profile data to database
   */
  async saveProfileData(userId: string, profileData: ProfileData): Promise<boolean> {
    try {
      const dbData = this.mapProfileDataToDatabase(profileData)
      
      const { error } = await this.supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          ...dbData,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving profile data:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveProfileData:', error)
      return false
    }
  }

  /**
   * Map ProfileData to database format
   */
  private mapProfileDataToDatabase(profileData: ProfileData) {
    return {
      full_name: profileData.fullName,
      email: profileData.email,
      phone: profileData.phone,
      job_title: profileData.jobTitle,
      location: profileData.location,
      bio: profileData.bio,
      organization: profileData.organization,
      organization_address: profileData.organizationAddress,
      organization_sector: profileData.organizationSector,
      organization_size: profileData.organizationSize,
      organization_turnover: profileData.organizationTurnover,
      organization_established: profileData.organizationEstablished,
      organization_description: profileData.organizationDescription,
      organization_mission: profileData.organizationMission,
      organization_values: profileData.organizationValues,
      accreditations: profileData.accreditations,
      awards: profileData.awards,
      testimonials: profileData.testimonials,
      email_notifications: profileData.emailNotifications,
      public_profile: profileData.publicProfile,
      last_synced_at: profileData.lastSyncedAt?.toISOString(),
      onboarding_completed: profileData.onboardingCompleted
    }
  }

  /**
   * Main method to sync onboarding data to profile
   */
  async syncOnboardingToProfile(userId: string): Promise<{
    success: boolean
    conflicts: DataConflictResolution[]
    profileData?: ProfileData
  }> {
    try {
      // Fetch onboarding data
      const onboardingData = await this.fetchOnboardingData(userId)
      if (!onboardingData) {
        return { success: false, conflicts: [] }
      }

      // Convert to profile format
      const newProfileData = this.mapToProfileData(onboardingData)

      // Get existing profile data
      const existingProfileData = await this.getExistingProfileData(userId)

      let finalProfileData: ProfileData
      let conflicts: DataConflictResolution[] = []

      if (existingProfileData) {
        // Detect and resolve conflicts
        conflicts = this.detectConflicts(existingProfileData, newProfileData)
        finalProfileData = this.mergeData(existingProfileData, newProfileData, conflicts)
      } else {
        // No existing data, use new data as-is
        finalProfileData = newProfileData
      }

      // Save to database
      const saved = await this.saveProfileData(userId, finalProfileData)

      return {
        success: saved,
        conflicts,
        profileData: saved ? finalProfileData : undefined
      }
    } catch (error) {
      console.error('Error in syncOnboardingToProfile:', error)
      return { success: false, conflicts: [] }
    }
  }

  /**
   * Utility method to format sector for display
   */
  private formatSector(sector: string): string {
    const sectorMap: Record<string, string> = {
      'domiciliary': 'Domiciliary Care',
      'residential': 'Residential Care', 
      'supported_living': 'Supported Living',
      'other': 'Other Care Services'
    }
    return sectorMap[sector] || sector
  }

  /**
   * Migration utility for existing users without onboarding data
   */
  async migrateExistingUser(userId: string, basicUserData: any): Promise<boolean> {
    try {
      // Create basic profile from available user data
      const basicProfile: ProfileData = {
        fullName: basicUserData.full_name || '',
        email: basicUserData.email || '',
        phone: basicUserData.phone || '',
        jobTitle: basicUserData.job_title || '',
        location: basicUserData.location || '',
        bio: basicUserData.bio || '',
        organization: basicUserData.organization || '',
        organizationAddress: '',
        organizationSector: '',
        organizationSize: 1,
        organizationTurnover: 0,
        organizationDescription: '',
        accreditations: [],
        awards: [],
        testimonials: [],
        emailNotifications: true,
        publicProfile: false,
        lastSyncedAt: new Date(),
        onboardingCompleted: false
      }

      return await this.saveProfileData(userId, basicProfile)
    } catch (error) {
      console.error('Error in migrateExistingUser:', error)
      return false
    }
  }
}

// Export singleton instance
export const profileDataService = new ProfileDataService() 