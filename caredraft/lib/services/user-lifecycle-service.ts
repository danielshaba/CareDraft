import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Temporary types until database types are generated
interface AuditLog {
  id: string
  action_type: string
  actor_id?: string
  actor_email?: string
  actor_role?: string
  target_user_id?: string
  target_user_email?: string
  organization_id?: string
  previous_values?: unknown
  new_values?: unknown
  metadata?: unknown
  ip_address?: string
  user_agent?: string
  session_id?: string
  created_at: string
  retention_until: string
}

interface CleanupConfig {
  id: string
  expired_invitations_days: number
  inactive_users_days: number
  audit_log_retention_days: number
  auto_cleanup_enabled: boolean
  last_cleanup_run?: string
  cleanup_schedule: string
  notify_before_cleanup: boolean
  notification_days_before: number
  created_at: string
  updated_at: string
}

// Types for user lifecycle management
export interface UserDeactivationData {
  userId: string
  reason?: string
  metadata?: Record<string, unknown>
}

export interface UserReactivationData {
  userId: string
  metadata?: Record<string, unknown>
}

export interface BulkRoleUpdateData {
  userIds: string[]
  newRole: 'admin' | 'manager' | 'writer' | 'viewer'
  metadata?: Record<string, unknown>
}

export interface BulkDeactivationData {
  userIds: string[]
  reason?: string
  metadata?: Record<string, unknown>
}

export interface AuditLogFilter {
  actionType?: string[]
  actorId?: string
  targetUserId?: string
  organizationId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface AuditLogEntry {
  id: string
  actionType: string
  actorId?: string
  actorEmail?: string
  actorRole?: string
  targetUserId?: string
  targetUserEmail?: string
  organizationId?: string
  previousValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  createdAt: string
  retentionUntil: string
}

export interface CleanupResult {
  cleanupType: string
  recordsAffected: number
  details: Record<string, unknown>
}

export interface UserDataExport {
  userId: string
  userData: Record<string, unknown>
  auditTrail: AuditLogEntry[]
  metadata: {
    exportedAt: string
    exportedBy: string
    format: 'json' | 'csv'
    includeAuditTrail: boolean
  }
}

export class UserLifecycleService {
  private supabase = createClientComponentClient()

  /**
   * Deactivate a user with audit logging
   */
  async deactivateUser(data: UserDeactivationData, actorId: string): Promise<boolean> {
    try {
      const { data: result, error } = await this.supabase.rpc('deactivate_user', {
        p_user_id: data.userId,
        p_actor_id: actorId,
        p_reason: data.reason || null,
        p_metadata: data.metadata || null
      })

      if (error) {
        console.error('Error deactivating user:', error)
        throw new Error(`Failed to deactivate user: ${error.message}`)
      }

      return result
    } catch {
      console.error('Error in deactivateUser:', error)
      throw error
    }
  }

  /**
   * Reactivate a user with audit logging
   */
  async reactivateUser(data: UserReactivationData, actorId: string): Promise<boolean> {
    try {
      const { data: result, error } = await this.supabase.rpc('reactivate_user', {
        p_user_id: data.userId,
        p_actor_id: actorId,
        p_metadata: data.metadata || null
      })

      if (error) {
        console.error('Error reactivating user:', error)
        throw new Error(`Failed to reactivate user: ${error.message}`)
      }

      return result
    } catch {
      console.error('Error in reactivateUser:', error)
      throw error
    }
  }

  /**
   * Bulk update user roles with audit logging
   */
  async bulkUpdateUserRoles(data: BulkRoleUpdateData, actorId: string): Promise<number> {
    try {
      const { data: result, error } = await this.supabase.rpc('bulk_update_user_roles', {
        p_user_ids: data.userIds,
        p_new_role: data.newRole,
        p_actor_id: actorId,
        p_metadata: data.metadata || null
      })

      if (error) {
        console.error('Error bulk updating user roles:', error)
        throw new Error(`Failed to bulk update user roles: ${error.message}`)
      }

      return result
    } catch {
      console.error('Error in bulkUpdateUserRoles:', error)
      throw error
    }
  }

  /**
   * Bulk deactivate users
   */
  async bulkDeactivateUsers(data: BulkDeactivationData, actorId: string): Promise<number> {
    try {
      let successCount = 0
      const errors: string[] = []

      // Process each user individually for better error handling
      for (const userId of data.userIds) {
        try {
          await this.deactivateUser({
            userId,
            reason: data.reason,
            metadata: {
              ...data.metadata,
              bulkOperation: true,
              totalUsers: data.userIds.length
            }
          }, actorId)
          successCount++
        } catch {
          console.error(`Error deactivating user ${userId}:`, error)
          errors.push(`${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Log bulk operation summary
      await this.logAuditEvent({
        actionType: 'bulk_deactivation',
        actorId,
        metadata: {
          totalUsers: data.userIds.length,
          successCount,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors : undefined,
          reason: data.reason,
          ...data.metadata
        }
      })

      if (errors.length > 0) {
        throw new Error(`Bulk deactivation completed with errors. ${successCount}/${data.userIds.length} users deactivated. Errors: ${errors.join('; ')}`)
      }

      return successCount
    } catch {
      console.error('Error in bulkDeactivateUsers:', error)
      throw error
    }
  }

  /**
   * Log an audit event
   */
  async logAuditEvent(data: {
    actionType: string
    actorId?: string
    targetUserId?: string
    organizationId?: string
    previousValues?: Record<string, unknown>
    newValues?: Record<string, unknown>
    metadata?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
    sessionId?: string
  }): Promise<string> {
    try {
      const { data: result, error } = await this.supabase.rpc('log_audit_event', {
        p_action_type: data.actionType,
        p_actor_id: data.actorId || null,
        p_target_user_id: data.targetUserId || null,
        p_organization_id: data.organizationId || null,
        p_previous_values: data.previousValues || null,
        p_new_values: data.newValues || null,
        p_metadata: data.metadata || null,
        p_ip_address: data.ipAddress || null,
        p_user_agent: data.userAgent || null,
        p_session_id: data.sessionId || null
      })

      if (error) {
        console.error('Error logging audit event:', error)
        throw new Error(`Failed to log audit event: ${error.message}`)
      }

      return result
    } catch {
      console.error('Error in logAuditEvent:', error)
      throw error
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filter.actionType && filter.actionType.length > 0) {
        query = query.in('action_type', filter.actionType)
      }

      if (filter.actorId) {
        query = query.eq('actor_id', filter.actorId)
      }

      if (filter.targetUserId) {
        query = query.eq('target_user_id', filter.targetUserId)
      }

      if (filter.organizationId) {
        query = query.eq('organization_id', filter.organizationId)
      }

      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate.toISOString())
      }

      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate.toISOString())
      }

      if (filter.limit) {
        query = query.limit(filter.limit)
      }

      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching audit logs:', error)
        throw new Error(`Failed to fetch audit logs: ${error.message}`)
      }

      return (data || []).map((log: unknown) => ({
        id: log.id,
        actionType: log.action_type,
        actorId: log.actor_id,
        actorEmail: log.actor_email,
        actorRole: log.actor_role,
        targetUserId: log.target_user_id,
        targetUserEmail: log.target_user_email,
        organizationId: log.organization_id,
        previousValues: log.previous_values,
        newValues: log.new_values,
        metadata: log.metadata,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        sessionId: log.session_id,
        createdAt: log.created_at,
        retentionUntil: log.retention_until
      }))
    } catch {
      console.error('Error in getAuditLogs:', error)
      throw error
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(organizationId?: string): Promise<{
    totalLogs: number
    actionTypeCounts: Record<string, number>
    recentActivity: AuditLogEntry[]
    topActors: Array<{ actorEmail: string; count: number }>
  }> {
    try {
      // Get total count and action type distribution
      let query = this.supabase
        .from('audit_logs')
        .select('action_type, actor_email')

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data: allLogs, error } = await query

      if (error) {
        console.error('Error fetching audit log stats:', error)
        throw new Error(`Failed to fetch audit log stats: ${error.message}`)
      }

      const logs = allLogs || []
      const totalLogs = logs.length

      // Count action types
      const actionTypeCounts: Record<string, number> = {}
      const actorCounts: Record<string, number> = {}

      logs.forEach((log: unknown) => {
        actionTypeCounts[log.action_type] = (actionTypeCounts[log.action_type] || 0) + 1
        if (log.actor_email) {
          actorCounts[log.actor_email] = (actorCounts[log.actor_email] || 0) + 1
        }
      })

      // Get top actors
      const topActors = Object.entries(actorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([actorEmail, count]) => ({ actorEmail, count }))

      // Get recent activity
      const recentActivity = await this.getAuditLogs({
        organizationId,
        limit: 10
      })

      return {
        totalLogs,
        actionTypeCounts,
        recentActivity,
        topActors
      }
    } catch {
      console.error('Error in getAuditLogStats:', error)
      throw error
    }
  }

  /**
   * Export user data for compliance
   */
  async exportUserData(
    userId: string, 
    actorId: string,
    options: {
      format: 'json' | 'csv'
      includeAuditTrail: boolean
    } = { format: 'json', includeAuditTrail: true }
  ): Promise<UserDataExport> {
    try {
      // Get user data
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
        throw new Error(`Failed to fetch user data: ${userError.message}`)
      }

      // Get audit trail if requested
      let auditTrail: AuditLogEntry[] = []
      if (options.includeAuditTrail) {
        auditTrail = await this.getAuditLogs({
          targetUserId: userId,
          limit: 1000 // Reasonable limit for export
        })
      }

      // Log the export action
      await this.logAuditEvent({
        actionType: 'data_export',
        actorId,
        targetUserId: userId,
        metadata: {
          format: options.format,
          includeAuditTrail: options.includeAuditTrail,
          auditRecordCount: auditTrail.length
        }
      })

      return {
        userId,
        userData,
        auditTrail,
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: actorId,
          format: options.format,
          includeAuditTrail: options.includeAuditTrail
        }
      }
    } catch {
      console.error('Error in exportUserData:', error)
      throw error
    }
  }

  /**
   * Run automated cleanup
   */
  async runAutomatedCleanup(): Promise<CleanupResult[]> {
    try {
      const { data, error } = await this.supabase.rpc('automated_cleanup')

      if (error) {
        console.error('Error running automated cleanup:', error)
        throw new Error(`Failed to run automated cleanup: ${error.message}`)
      }

      return data || []
    } catch {
      console.error('Error in runAutomatedCleanup:', error)
      throw error
    }
  }

  /**
   * Get cleanup configuration
   */
  async getCleanupConfig(): Promise<CleanupConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from('cleanup_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching cleanup config:', error)
        throw new Error(`Failed to fetch cleanup config: ${error.message}`)
      }

      return data
    } catch {
      console.error('Error in getCleanupConfig:', error)
      throw error
    }
  }

  /**
   * Update cleanup configuration
   */
  async updateCleanupConfig(config: Partial<CleanupConfig>): Promise<CleanupConfig> {
    try {
      const { data, error } = await this.supabase
        .from('cleanup_config')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id!)
        .select()
        .single()

      if (error) {
        console.error('Error updating cleanup config:', error)
        throw new Error(`Failed to update cleanup config: ${error.message}`)
      }

      return data
    } catch {
      console.error('Error in updateCleanupConfig:', error)
      throw error
    }
  }

  /**
   * Get deactivated users for review
   */
  async getDeactivatedUsers(organizationId?: string): Promise<unknown[]> {
    try {
      let query = this.supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          deactivated_at,
          deactivated_by,
          deactivation_reason,
          created_at
        `)
        .eq('is_active', false)
        .order('deactivated_at', { ascending: false })

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching deactivated users:', error)
        throw new Error(`Failed to fetch deactivated users: ${error.message}`)
      }

      return data || []
    } catch {
      console.error('Error in getDeactivatedUsers:', error)
      throw error
    }
  }
} 