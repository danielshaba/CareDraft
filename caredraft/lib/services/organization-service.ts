import { createClient } from '@/lib/supabase'
import { 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError, 
  NotFoundError 
} from '@/lib/utils/errors'
import type { UserRole } from '@/lib/auth.types'
import type { Database } from '@/lib/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

// Organization interfaces
export interface OrganizationWithStats extends Organization {
  member_count?: number
  active_projects?: number
  total_proposals?: number
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website?: string
  industry?: string
  size?: string
  billing_email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  timezone?: string
  settings: OrganizationSettings
  subscription?: OrganizationSubscription
  created_at: string
  updated_at: string
  owner_id: string
}

export interface OrganizationSettings {
  branding: {
    primary_color?: string
    secondary_color?: string
    logo_url?: string
    favicon_url?: string
  }
  features: {
    research_sessions_enabled: boolean
    compliance_tracking_enabled: boolean
    advanced_analytics_enabled: boolean
    api_access_enabled: boolean
    sso_enabled: boolean
  }
  limits: {
    max_users: number
    max_proposals: number
    max_storage_gb: number
    max_api_calls_per_month: number
  }
  workflow: {
    require_approval_for_proposals: boolean
    auto_archive_after_days: number
    default_proposal_template_id?: string
  }
  notifications: {
    system_announcements: boolean
    feature_updates: boolean
    security_alerts: boolean
  }
}

export interface OrganizationSubscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'past_due' | 'canceled' | 'trialing'
  current_period_start: string
  current_period_end: string
  trial_end?: string
  billing_cycle: 'monthly' | 'annually'
}

export interface OrganizationMember {
  id: string
  user_id: string
  organization_id: string
  role: UserRole
  joined_at: string
  invited_by?: string
  status: 'active' | 'pending' | 'suspended'
  user: {
    id: string
    email: string
    full_name: string
  }
}

export interface CreateOrganizationRequest {
  name: string
  slug: string
  description?: string
  industry?: string
  size?: string
  billing_email?: string
  website?: string
  logo_url?: string
}

export interface UpdateOrganizationRequest {
  name?: string
  description?: string
  logo_url?: string
  website?: string
  industry?: string
  size?: string
  billing_email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  timezone?: string
}

export interface OrganizationStats {
  total_users: number
  active_users: number
  total_proposals: number
  active_proposals: number
  storage_used_gb: number
  api_calls_this_month: number
}

export class OrganizationService {
  private supabase = createClient()

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<OrganizationWithStats | null> {
    try {
      const { data: organization, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching organization:', error)
        return null
      }

      // Get additional stats
      const stats = await this.getOrganizationStats(id)
      
      return {
        ...organization,
        ...stats
      }
    } catch (error) {
      console.error('Error in getOrganization:', error)
      return null
    }
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string): Promise<{
    member_count: number
    active_projects: number
    total_proposals: number
  }> {
    try {
      // Get member count
      const { count: memberCount } = await this.supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      // Get active projects count (mock for now)
      const activeProjects = 0

      // Get total proposals count (mock for now)
      const totalProposals = 0

      return {
        member_count: memberCount || 0,
        active_projects: activeProjects,
        total_proposals: totalProposals
      }
    } catch (error) {
      console.error('Error getting organization stats:', error)
      return {
        member_count: 0,
        active_projects: 0,
        total_proposals: 0
      }
    }
  }

  /**
   * Create new organization
   */
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization | null> {
    try {
      const organizationData: OrganizationInsert = {
        name: data.name,
        description: data.description,
        website: data.website,
        industry: data.industry,
        size: data.size,
        logo_url: data.logo_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: organization, error } = await this.supabase
        .from('organizations')
        .insert(organizationData)
        .select()
        .single()

      if (error) {
        console.error('Error creating organization:', error)
        return null
      }

      return organization
    } catch (error) {
      console.error('Error in createOrganization:', error)
      return null
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(
    id: string, 
    data: UpdateOrganizationRequest
  ): Promise<Organization | null> {
    try {
      const updateData: OrganizationUpdate = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { data: organization, error } = await this.supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating organization:', error)
        return null
      }

      return organization
    } catch (error) {
      console.error('Error in updateOrganization:', error)
      return null
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting organization:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteOrganization:', error)
      return false
    }
  }

  /**
   * Get organizations for user
   */
  async getUserOrganizations(userId: string): Promise<OrganizationWithStats[]> {
    try {
      const { data: memberships, error } = await this.supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations (*)
        `)
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user organizations:', error)
        return []
      }

      const organizations: OrganizationWithStats[] = []
      
      for (const membership of memberships || []) {
        if (membership.organizations) {
          const stats = await this.getOrganizationStats(membership.organization_id)
          organizations.push({
            ...membership.organizations,
            ...stats
          })
        }
      }

      return organizations
    } catch (error) {
      console.error('Error in getUserOrganizations:', error)
      return []
    }
  }

  /**
   * Add user to organization
   */
  async addMember(
    organizationId: string, 
    userId: string, 
    role: 'admin' | 'member' = 'member'
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role,
          joined_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error adding organization member:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in addMember:', error)
      return false
    }
  }

  /**
   * Remove user from organization
   */
  async removeMember(organizationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error removing organization member:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in removeMember:', error)
      return false
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    organizationId: string, 
    userId: string, 
    role: 'admin' | 'member'
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('organization_members')
        .update({ role })
        .eq('organization_id', organizationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating member role:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateMemberRole:', error)
      return false
    }
  }

  /**
   * Get organization members
   */
  async getMembers(organizationId: string): Promise<Array<{
    user_id: string
    role: string
    joined_at: string
    user?: {
      email: string
      full_name?: string
    }
  }>> {
    try {
      const { data: members, error } = await this.supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          joined_at,
          profiles (
            email,
            full_name
          )
        `)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error fetching organization members:', error)
        return []
      }

      return members?.map(member => ({
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        user: member.profiles ? {
          email: member.profiles.email,
          full_name: member.profiles.full_name
        } : undefined
      })) || []
    } catch (error) {
      console.error('Error in getMembers:', error)
      return []
    }
  }

  /**
   * Check if user is member of organization
   */
  async isMember(organizationId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      if (error) {
        return false
      }

      return !!data
    } catch {
      return false
    }
  }

  /**
   * Check if user is admin of organization
   */
  async isAdmin(organizationId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      if (error) {
        return false
      }

      return data?.role === 'admin'
    } catch {
      return false
    }
  }
}

export const organizationService = new OrganizationService() 