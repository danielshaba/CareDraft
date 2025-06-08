import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  Database, 
  ProposalStatus, 
  ProposalWorkflowSettings,
  ProposalStatusWorkflowData,
  NotificationType 
} from '@/lib/database.types'
import { ProposalWorkflowService } from './proposal-workflow'

/**
 * Configuration for deadline-based status transitions
 */
export interface DeadlineRule {
  id: string
  fromStatus: ProposalStatus
  toStatus: ProposalStatus
  deadlineHours: number
  notificationHours: number[] // Hours before deadline to send notifications
  autoTransition: boolean
  requiresApproval: boolean
  description: string
}

/**
 * Deadline check result for a proposal
 */
export interface DeadlineCheckResult {
  proposalId: string
  currentStatus: ProposalStatus
  statusChangedAt: string
  deadlineAt: string
  hoursRemaining: number
  shouldNotify: boolean
  shouldTransition: boolean
  applicableRule: DeadlineRule | null
  nextNotificationHours: number | null
}

/**
 * Batch processing result
 */
export interface DeadlineProcessingResult {
  processedAt: string
  proposalsChecked: number
  notificationsSent: number
  transitionsPerformed: number
  errors: Array<{
    proposalId: string
    error: string
    type: 'notification' | 'transition'
  }>
}

/**
 * Extended workflow settings that includes deadline rules
 */
interface ExtendedWorkflowSettings extends ProposalWorkflowSettings {
  deadline_rules?: string
}

/**
 * Default deadline rules for different status transitions
 */
const DEFAULT_DEADLINE_RULES: DeadlineRule[] = [
  {
    id: 'review-timeout',
    fromStatus: 'review',
    toStatus: 'draft',
    deadlineHours: 72, // 3 days for review
    notificationHours: [48, 24, 6], // Notify at 2 days, 1 day, 6 hours
    autoTransition: true,
    requiresApproval: false,
    description: 'Proposals in review for more than 3 days are returned to draft'
  },
  {
    id: 'submitted-archive',
    fromStatus: 'submitted',
    toStatus: 'archived',
    deadlineHours: 720, // 30 days after submission
    notificationHours: [168, 24], // Notify at 1 week, 1 day
    autoTransition: true,
    requiresApproval: false,
    description: 'Submitted proposals are archived after 30 days'
  },
  {
    id: 'draft-reminder',
    fromStatus: 'draft',
    toStatus: 'draft', // No status change, just notification
    deadlineHours: 168, // 1 week
    notificationHours: [168, 24], // Remind at 1 week, then daily
    autoTransition: false,
    requiresApproval: false,
    description: 'Remind about draft proposals older than 1 week'
  }
]

/**
 * Service for managing proposal deadlines and automatic status transitions
 */
export class ProposalDeadlineManager {
  private supabase
  private workflowService: ProposalWorkflowService

  constructor() {
    this.supabase = createServerComponentClient<Database>({ cookies })
    this.workflowService = new ProposalWorkflowService()
  }

  /**
   * Get deadline rules from database or defaults
   */
  async getDeadlineRules(): Promise<DeadlineRule[]> {
    try {
      // For now, we'll store deadline rules in a JSON column that we'll add later
      // Return defaults until migration is complete
      return DEFAULT_DEADLINE_RULES
    } catch {
      console.error('Error fetching deadline rules:', error)
      return DEFAULT_DEADLINE_RULES
    }
  }

  /**
   * Update deadline rules in database
   */
  async updateDeadlineRules(rules: DeadlineRule[]): Promise<boolean> {
    try {
      // TODO: Implement when deadline_rules column is added to proposal_workflow_settings
      console.log('Deadline rules update requested:', rules)
      return true
    } catch {
      console.error('Error updating deadline rules:', error)
      return false
    }
  }

  /**
   * Check deadline status for a specific proposal
   */
  async checkProposalDeadline(proposalId: string): Promise<DeadlineCheckResult | null> {
    try {
      // Get proposal current status and last status change
      const { data: statusHistory, error } = await this.supabase
        .from('proposal_status_history')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('changed_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !statusHistory) {
        console.error('Error fetching proposal status history:', error)
        return null
      }

      const rules = await this.getDeadlineRules()
      const applicableRule = rules.find(rule => rule.fromStatus === statusHistory.to_status)

      if (!applicableRule) {
        return null // No deadline rule for current status
      }

      const statusChangedAt = new Date(statusHistory.changed_at)
      const deadlineAt = new Date(statusChangedAt.getTime() + (applicableRule.deadlineHours * 60 * 60 * 1000))
      const now = new Date()
      const hoursRemaining = Math.max(0, (deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60))

      // Check if we should send notification
      const shouldNotify = applicableRule.notificationHours.some(hours => {
        const notificationTime = new Date(deadlineAt.getTime() - (hours * 60 * 60 * 1000))
        return now >= notificationTime && now < new Date(notificationTime.getTime() + (60 * 60 * 1000)) // 1 hour window
      })

      // Check if we should transition
      const shouldTransition = applicableRule.autoTransition && hoursRemaining <= 0

      // Get next notification hours
      const nextNotificationHours = applicableRule.notificationHours
        .filter(hours => hours < hoursRemaining)
        .sort((a, b) => b - a)[0] || null

      return {
        proposalId,
        currentStatus: statusHistory.to_status,
        statusChangedAt: statusHistory.changed_at,
        deadlineAt: deadlineAt.toISOString(),
        hoursRemaining,
        shouldNotify,
        shouldTransition,
        applicableRule,
        nextNotificationHours
      }
    } catch {
      console.error('Error checking proposal deadline:', error)
      return null
    }
  }

  /**
   * Send deadline notification
   */
  async sendDeadlineNotification(
    proposalId: string, 
    recipientUserId: string, 
    checkResult: DeadlineCheckResult
  ): Promise<boolean> {
    try {
      const { data: proposal } = await this.supabase
        .from('proposals')
        .select('title, owner_id')
        .eq('id', proposalId)
        .single()

      if (!proposal) return false

      const isOverdue = checkResult.hoursRemaining <= 0
      const timeDescription = isOverdue 
        ? `overdue by ${Math.abs(checkResult.hoursRemaining).toFixed(1)} hours`
        : `${checkResult.hoursRemaining.toFixed(1)} hours remaining`

      // Use existing notification types
      const notificationType: NotificationType = isOverdue ? 'deadline' : 'deadline'
      const priority = isOverdue ? 5 : 3 // High for overdue, medium for upcoming

      const { error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: recipientUserId,
          type: notificationType,
          priority,
          title: isOverdue 
            ? `Proposal "${proposal.title}" is overdue`
            : `Proposal "${proposal.title}" deadline approaching`,
          content: {
            message: `Proposal in ${checkResult.currentStatus} status - ${timeDescription}. ${checkResult.applicableRule?.description || ''}`,
            proposalId,
            currentStatus: checkResult.currentStatus,
            deadlineAt: checkResult.deadlineAt,
            hoursRemaining: checkResult.hoursRemaining,
            ruleId: checkResult.applicableRule?.id
          },
          related_entity_type: 'proposal',
          related_entity_id: proposalId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      return !error
    } catch {
      console.error('Error sending deadline notification:', error)
      return false
    }
  }

  /**
   * Perform automatic status transition
   */
  async performAutomaticTransition(
    proposalId: string, 
    checkResult: DeadlineCheckResult
  ): Promise<boolean> {
    try {
      if (!checkResult.applicableRule?.autoTransition || !checkResult.shouldTransition) {
        return false
      }

      const systemUserId = '00000000-0000-0000-0000-000000000000' // System user ID

      const transitionResult = await this.workflowService.transitionProposalStatus({
        proposalId,
        fromStatus: checkResult.currentStatus,
        toStatus: checkResult.applicableRule.toStatus,
        userId: systemUserId,
        comment: `Automatic transition: ${checkResult.applicableRule.description}`,
        transitionReason: 'deadline_exceeded'
      })

      if (transitionResult.success) {
        // Send notification about automatic transition
        const { data: proposal } = await this.supabase
          .from('proposals')
          .select('owner_id, title')
          .eq('id', proposalId)
          .single()

        if (proposal) {
          await this.supabase
            .from('notifications')
            .insert({
              user_id: proposal.owner_id,
              type: 'proposal_update',
              priority: 3,
              title: `Proposal "${proposal.title}" status automatically updated`,
              content: {
                message: `Status changed from ${checkResult.currentStatus} to ${checkResult.applicableRule.toStatus} due to deadline. ${checkResult.applicableRule.description}`,
                proposalId,
                fromStatus: checkResult.currentStatus,
                toStatus: checkResult.applicableRule.toStatus,
                automatic: true,
                ruleId: checkResult.applicableRule.id
              },
              related_entity_type: 'proposal',
              related_entity_id: proposalId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        }
      }

      return transitionResult.success
    } catch {
      console.error('Error performing automatic transition:', error)
      return false
    }
  }

  /**
   * Process all proposals for deadline checks and actions
   */
  async processAllProposalDeadlines(): Promise<DeadlineProcessingResult> {
    const startTime = new Date()
    const result: DeadlineProcessingResult = {
      processedAt: startTime.toISOString(),
      proposalsChecked: 0,
      notificationsSent: 0,
      transitionsPerformed: 0,
      errors: []
    }

    try {
      // Get all active proposals (not archived)
      const { data: proposals, error } = await this.supabase
        .from('proposals')
        .select('id, owner_id')
        .neq('status', 'archived')

      if (error || !proposals) {
        result.errors.push({
          proposalId: 'all',
          error: 'Failed to fetch proposals',
          type: 'notification'
        })
        return result
      }

      result.proposalsChecked = proposals.length

      // Process each proposal
      for (const proposal of proposals) {
        try {
          const checkResult = await this.checkProposalDeadline(proposal.id)
          
          if (!checkResult) continue

          // Send notification if needed
          if (checkResult.shouldNotify) {
            const notificationSent = await this.sendDeadlineNotification(
              proposal.id,
              proposal.owner_id,
              checkResult
            )

            if (notificationSent) {
              result.notificationsSent++
            } else {
              result.errors.push({
                proposalId: proposal.id,
                error: 'Failed to send notification',
                type: 'notification'
              })
            }
          }

          // Perform transition if needed
          if (checkResult.shouldTransition) {
            const transitionSuccess = await this.performAutomaticTransition(
              proposal.id,
              checkResult
            )

            if (transitionSuccess) {
              result.transitionsPerformed++
            } else {
              result.errors.push({
                proposalId: proposal.id,
                error: 'Failed to perform automatic transition',
                type: 'transition'
              })
            }
          }
        } catch {
          result.errors.push({
            proposalId: proposal.id,
            error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'notification'
          })
        }
      }

      // TODO: Log processing results when workflow logs table is added
      console.log('Deadline processing result:', result)

      return result
    } catch {
      console.error('Error processing proposal deadlines:', error)
      result.errors.push({
        proposalId: 'all',
        error: `Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'notification'
      })
      return result
    }
  }

  /**
   * Get upcoming deadlines for dashboard/reports
   */
  async getUpcomingDeadlines(hoursAhead: number = 168): Promise<DeadlineCheckResult[]> {
    try {
      const { data: proposals } = await this.supabase
        .from('proposals')
        .select('id')
        .neq('status', 'archived')

      if (!proposals) return []

      const results: DeadlineCheckResult[] = []

      for (const proposal of proposals) {
        const checkResult = await this.checkProposalDeadline(proposal.id)
        if (checkResult && checkResult.hoursRemaining <= hoursAhead) {
          results.push(checkResult)
        }
      }

      return results.sort((a, b) => a.hoursRemaining - b.hoursRemaining)
    } catch {
      console.error('Error getting upcoming deadlines:', error)
      return []
    }
  }
}

// Export singleton instance
export const proposalDeadlineManager = new ProposalDeadlineManager()

// Export for use in API routes and background jobs
export default ProposalDeadlineManager 