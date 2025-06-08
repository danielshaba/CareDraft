import { createClient } from '@/lib/supabase'
import { 
  ProposalStatus, 
  UserRole, 
  ProposalStatusHistory,
  ProposalStatusHistoryInsert,
  ProposalWorkflowPermissions,
  ProposalWorkflowSettings,
  ProposalReviewerAssignments,
  ProposalReviewerAssignmentsInsert,
  ProposalStatusWorkflowData,
  Proposal,
  User
} from '@/lib/database.types'

export interface StatusTransitionRequest {
  proposalId: string
  fromStatus: ProposalStatus
  toStatus: ProposalStatus
  comment?: string
  transitionReason?: string
  userId?: string
}

export interface StatusTransitionResult {
  success: boolean
  error?: string
  statusHistory?: ProposalStatusHistory
  proposal?: Proposal
}

export interface WorkflowPermissionCheck {
  canTransition: boolean
  reason?: string
  requiredRole?: UserRole
}

export interface ReviewerAssignmentRequest {
  proposalId: string
  reviewerIds: string[]
  assignedBy: string
}

export interface ReviewDecisionRequest {
  proposalId: string
  reviewerId: string
  decision: 'approved' | 'rejected'
  comments?: string
}

export interface WorkflowSettings {
  organizationId: string
  autoArchiveAfterDays: number
  autoReviewReminderDays: number
  autoSubmitReminderDays: number
  requireCommentsOnRejection: boolean
  requireCommentsOnApproval: boolean
  allowSelfApproval: boolean
}

export class ProposalWorkflowService {
  private supabase = createClient()

  /**
   * Check if a user can transition a proposal from one status to another
   */
  async canUserTransitionStatus(
    proposalId: string, 
    fromStatus: ProposalStatus, 
    toStatus: ProposalStatus, 
    userId?: string
  ): Promise<WorkflowPermissionCheck> {
    try {
      const { data, error } = await this.supabase.rpc('can_user_transition_proposal_status', {
        p_proposal_id: proposalId,
        p_from_status: fromStatus,
        p_to_status: toStatus,
        p_user_id: userId
      })

      if (error) {
        console.error('Error checking transition permission:', error)
        return { canTransition: false, reason: 'Permission check failed' }
      }

      return { canTransition: data }
    } catch {
      console.error('Error in canUserTransitionStatus:', error)
      return { canTransition: false, reason: 'Permission check error' }
    }
  }

  /**
   * Transition a proposal status with validation and audit trail
   */
  async transitionProposalStatus(request: StatusTransitionRequest): Promise<StatusTransitionResult> {
    try {
      // First check if the user has permission
      const permissionCheck = await this.canUserTransitionStatus(
        request.proposalId,
        request.fromStatus,
        request.toStatus,
        request.userId
      )

      if (!permissionCheck.canTransition) {
        return {
          success: false,
          error: permissionCheck.reason || 'Insufficient permissions for this status transition'
        }
      }

      // Get workflow settings for validation
      const settings = await this.getWorkflowSettings(request.proposalId)
      
      // Validate required comments
      if (request.toStatus === 'draft' && request.fromStatus === 'review') {
        // This is a rejection
        if (settings?.require_comments_on_rejection && !request.comment?.trim()) {
          return {
            success: false,
            error: 'Comments are required when rejecting a proposal'
          }
        }
      }

      if (request.toStatus === 'submitted' && request.fromStatus === 'review') {
        // This is an approval
        if (settings?.require_comments_on_approval && !request.comment?.trim()) {
          return {
            success: false,
            error: 'Comments are required when approving a proposal'
          }
        }
      }

      // Begin transaction: Update proposal status
      const { data: proposal, error: proposalError } = await this.supabase
        .from('proposals')
        .update({ 
          status: request.toStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.proposalId)
        .select()
        .single()

      if (proposalError) {
        console.error('Error updating proposal status:', proposalError)
        return {
          success: false,
          error: 'Failed to update proposal status'
        }
      }

      // Create status history entry (trigger will handle this automatically, but we'll also add manual entry with comments)
      if (request.comment || request.transitionReason) {
        const historyData: ProposalStatusHistoryInsert = {
          proposal_id: request.proposalId,
          from_status: request.fromStatus,
          to_status: request.toStatus,
          changed_by: request.userId || proposal.owner_id,
          comment: request.comment,
          transition_reason: request.transitionReason,
          automatic: false
        }

        const { data: statusHistory, error: historyError } = await this.supabase
          .from('proposal_status_history')
          .insert(historyData)
          .select()
          .single()

        if (historyError) {
          console.error('Error creating status history:', historyError)
          // Don't fail the entire operation for history logging
        }

        return {
          success: true,
          proposal,
          statusHistory: statusHistory || undefined
        }
      }

      return {
        success: true,
        proposal
      }

    } catch {
      console.error('Error in transitionProposalStatus:', error)
      return {
        success: false,
        error: 'Unexpected error during status transition'
      }
    }
  }

  /**
   * Get the status workflow history for a proposal
   */
  async getProposalStatusHistory(proposalId: string): Promise<ProposalStatusWorkflowData[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_proposal_status_workflow', {
        p_proposal_id: proposalId
      })

      if (error) {
        console.error('Error getting proposal status workflow:', error)
        return []
      }

      return data || []
    } catch {
      console.error('Error in getProposalStatusHistory:', error)
      return []
    }
  }

  /**
   * Assign reviewers to a proposal
   */
  async assignReviewers(request: ReviewerAssignmentRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove existing incomplete assignments
      const { error: deleteError } = await this.supabase
        .from('proposal_reviewer_assignments')
        .delete()
        .eq('proposal_id', request.proposalId)
        .is('completed_at', null)

      if (deleteError) {
        console.error('Error removing existing assignments:', deleteError)
        return { success: false, error: 'Failed to update reviewer assignments' }
      }

      // Create new assignments
      const assignments: ProposalReviewerAssignmentsInsert[] = request.reviewerIds.map(reviewerId => ({
        proposal_id: request.proposalId,
        reviewer_id: reviewerId,
        assigned_by: request.assignedBy
      }))

      const { error: insertError } = await this.supabase
        .from('proposal_reviewer_assignments')
        .insert(assignments)

      if (insertError) {
        console.error('Error creating reviewer assignments:', insertError)
        return { success: false, error: 'Failed to assign reviewers' }
      }

      return { success: true }
    } catch {
      console.error('Error in assignReviewers:', error)
      return { success: false, error: 'Unexpected error assigning reviewers' }
    }
  }

  /**
   * Submit a review decision
   */
  async submitReviewDecision(request: ReviewDecisionRequest): Promise<StatusTransitionResult> {
    try {
      // Update the reviewer assignment
      const { error: assignmentError } = await this.supabase
        .from('proposal_reviewer_assignments')
        .update({
          completed_at: new Date().toISOString(),
          decision: request.decision === 'approved' ? 'submitted' : 'review',
          review_comments: request.comments
        })
        .eq('proposal_id', request.proposalId)
        .eq('reviewer_id', request.reviewerId)

      if (assignmentError) {
        console.error('Error updating reviewer assignment:', assignmentError)
        return { success: false, error: 'Failed to record review decision' }
      }

      // Check if all reviewers have completed their reviews
      const { data: assignments, error: checkError } = await this.supabase
        .from('proposal_reviewer_assignments')
        .select('decision')
        .eq('proposal_id', request.proposalId)
        .not('completed_at', 'is', null)

      if (checkError) {
        console.error('Error checking review completion:', checkError)
        return { success: false, error: 'Failed to check review status' }
      }

      // Get total number of assigned reviewers
      const { count: totalReviewers, error: countError } = await this.supabase
        .from('proposal_reviewer_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('proposal_id', request.proposalId)

      if (countError) {
        console.error('Error counting reviewers:', countError)
        return { success: false, error: 'Failed to check reviewer count' }
      }

      // If all reviewers have completed, determine final status
      if (assignments.length === totalReviewers) {
        const approvals = assignments.filter(a => a.decision === 'submitted').length
        const rejections = assignments.filter(a => a.decision === 'review').length

        // Get current proposal
        const { data: proposal, error: proposalError } = await this.supabase
          .from('proposals')
          .select('*')
          .eq('id', request.proposalId)
          .single()

        if (proposalError || !proposal) {
          return { success: false, error: 'Failed to get proposal details' }
        }

        let finalStatus: ProposalStatus
        if (rejections > 0) {
          // Any rejection sends back to draft
          finalStatus = 'draft'
        } else if (approvals === totalReviewers) {
          // All approved
          finalStatus = 'submitted'
        } else {
          // Still pending reviews
          return { success: true }
        }

        // Transition the proposal to final status
        return await this.transitionProposalStatus({
          proposalId: request.proposalId,
          fromStatus: proposal.status,
          toStatus: finalStatus,
          comment: `Review completed: ${approvals} approvals, ${rejections} rejections`,
          transitionReason: 'Automatic transition after review completion',
          userId: request.reviewerId
        })
      }

      return { success: true }
    } catch {
      console.error('Error in submitReviewDecision:', error)
      return { success: false, error: 'Unexpected error submitting review' }
    }
  }

  /**
   * Get workflow settings for an organization
   */
  async getWorkflowSettings(proposalId: string): Promise<ProposalWorkflowSettings | null> {
    try {
      // Get organization ID from proposal
      const { data: proposal, error: proposalError } = await this.supabase
        .from('proposals')
        .select(`
          owner_id,
          users!inner(organization_id)
        `)
        .eq('id', proposalId)
        .single()

      if (proposalError || !proposal) {
        console.error('Error getting proposal for settings:', proposalError)
        return null
      }

      const organizationId = (proposal.users as any).organization_id

      const { data, error } = await this.supabase
        .from('proposal_workflow_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (error) {
        console.error('Error getting workflow settings:', error)
        return null
      }

      return data
    } catch {
      console.error('Error in getWorkflowSettings:', error)
      return null
    }
  }

  /**
   * Update workflow settings for an organization
   */
  async updateWorkflowSettings(settings: Partial<WorkflowSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('proposal_workflow_settings')
        .upsert({
          organization_id: settings.organizationId!,
          auto_archive_after_days: settings.autoArchiveAfterDays,
          auto_review_reminder_days: settings.autoReviewReminderDays,
          auto_submit_reminder_days: settings.autoSubmitReminderDays,
          require_comments_on_rejection: settings.requireCommentsOnRejection,
          require_comments_on_approval: settings.requireCommentsOnApproval,
          allow_self_approval: settings.allowSelfApproval,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating workflow settings:', error)
        return { success: false, error: 'Failed to update workflow settings' }
      }

      return { success: true }
    } catch {
      console.error('Error in updateWorkflowSettings:', error)
      return { success: false, error: 'Unexpected error updating settings' }
    }
  }

  /**
   * Get available status transitions for a proposal based on user permissions
   */
  async getAvailableTransitions(proposalId: string, userId?: string): Promise<ProposalStatus[]> {
    try {
      // Get current proposal status
      const { data: proposal, error: proposalError } = await this.supabase
        .from('proposals')
        .select('status')
        .eq('id', proposalId)
        .single()

      if (proposalError || !proposal) {
        console.error('Error getting proposal:', proposalError)
        return []
      }

      const currentStatus = proposal.status
      const possibleStatuses: ProposalStatus[] = ['draft', 'review', 'submitted', 'archived']
      const availableTransitions: ProposalStatus[] = []

      // Check each possible transition
      for (const toStatus of possibleStatuses) {
        if (toStatus === currentStatus) continue

        const check = await this.canUserTransitionStatus(
          proposalId,
          currentStatus,
          toStatus,
          userId
        )

        if (check.canTransition) {
          availableTransitions.push(toStatus)
        }
      }

      return availableTransitions
    } catch {
      console.error('Error in getAvailableTransitions:', error)
      return []
    }
  }

  /**
   * Get pending reviewer assignments for a proposal
   */
  async getPendingReviewers(proposalId: string): Promise<ProposalReviewerAssignments[]> {
    try {
      const { data, error } = await this.supabase
        .from('proposal_reviewer_assignments')
        .select(`
          *,
          reviewer:users!reviewer_id(id, email, full_name),
          assigned_by_user:users!assigned_by(id, email, full_name)
        `)
        .eq('proposal_id', proposalId)
        .is('completed_at', null)

      if (error) {
        console.error('Error getting pending reviewers:', error)
        return []
      }

      return data || []
    } catch {
      console.error('Error in getPendingReviewers:', error)
      return []
    }
  }

  /**
   * Auto-archive expired proposals
   */
  async autoArchiveExpiredProposals(): Promise<{ archivedCount: number; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('auto_archive_expired_proposals')

      if (error) {
        console.error('Error auto-archiving proposals:', error)
        return { archivedCount: 0, error: 'Failed to auto-archive proposals' }
      }

      return { archivedCount: data || 0 }
    } catch {
      console.error('Error in autoArchiveExpiredProposals:', error)
      return { archivedCount: 0, error: 'Unexpected error during auto-archiving' }
    }
  }

  /**
   * Get proposals approaching deadline for reminders
   */
  async getProposalsForReminders(daysAhead: number = 7): Promise<unknown[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_proposals_approaching_deadline', {
        days_ahead: daysAhead
      })

      if (error) {
        console.error('Error getting proposals for reminders:', error)
        return []
      }

      return data || []
    } catch {
      console.error('Error in getProposalsForReminders:', error)
      return []
    }
  }

  /**
   * Check if a user is assigned as a reviewer for a proposal
   */
  async isUserAssignedReviewer(proposalId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('proposal_reviewer_assignments')
        .select('id')
        .eq('proposal_id', proposalId)
        .eq('reviewer_id', userId)
        .is('completed_at', null)
        .maybeSingle()

      if (error) {
        console.error('Error checking reviewer assignment:', error)
        return false
      }

      return !!data
    } catch {
      console.error('Error in isUserAssignedReviewer:', error)
      return false
    }
  }
} 