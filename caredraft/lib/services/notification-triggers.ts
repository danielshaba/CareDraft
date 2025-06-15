/**
 * Notification Triggers Service (Stub Implementation)
 * This is a placeholder until the notification triggers functionality is fully implemented
 */

import type { NotificationInsert } from '@/lib/database.types'

export interface MentionTriggerData {
  mentionedUserId: string
  mentionerUserId: string
  mentionerName: string
  entityType: 'proposal' | 'section' | 'comment'
  entityId: string
  entityTitle: string
  mentionContext: string
}

export interface DeadlineTriggerData {
  userId: string
  entityType: 'proposal' | 'section'
  entityId: string
  entityTitle: string
  deadline: string
  daysUntilDeadline: number
}

export interface ProposalUpdateTriggerData {
  proposalId: string
  proposalTitle: string
  updateType: 'status_change' | 'content_update' | 'assignment_change'
  updaterUserId: string
  updaterName: string
  affectedUserIds: string[]
  details: Record<string, unknown>
}

export interface ReviewRequestTriggerData {
  proposalId: string
  proposalTitle: string
  reviewerUserId: string
  requesterUserId: string
  requesterName: string
  dueDate?: string
  message?: string
}

export interface SystemAnnouncementTriggerData {
  title: string
  message: string
  targetUserIds?: string[]
  targetRoles?: string[]
  priority: number
  expiresAt?: string
}

export interface TeamInvitationTriggerData {
  invitedUserId: string
  inviterUserId: string
  inviterName: string
  organizationName: string
  role: string
  message?: string
}

export interface DocumentSharedTriggerData {
  documentId: string
  documentTitle: string
  sharedWithUserId: string
  sharedByUserId: string
  sharedByName: string
  accessLevel: 'view' | 'edit' | 'admin'
  message?: string
}

export class NotificationTriggersService {
  private static instance: NotificationTriggersService

  static getInstance(): NotificationTriggersService {
    if (!NotificationTriggersService.instance) {
      NotificationTriggersService.instance = new NotificationTriggersService()
    }
    return NotificationTriggersService.instance
  }

  /**
   * Trigger mention notification (stub implementation)
   */
  async triggerMentionNotification(_data: MentionTriggerData): Promise<void> {
    console.log('Stub: triggerMentionNotification called')
  }

  /**
   * Trigger deadline notification (stub implementation)
   */
  async triggerDeadlineNotification(_data: DeadlineTriggerData): Promise<void> {
    console.log('Stub: triggerDeadlineNotification called')
  }

  /**
   * Trigger proposal update notification (stub implementation)
   */
  async triggerProposalUpdateNotification(_data: ProposalUpdateTriggerData): Promise<void> {
    console.log('Stub: triggerProposalUpdateNotification called')
  }

  /**
   * Trigger review request notification (stub implementation)
   */
  async triggerReviewRequestNotification(_data: ReviewRequestTriggerData): Promise<void> {
    console.log('Stub: triggerReviewRequestNotification called')
  }

  /**
   * Trigger system announcement notification (stub implementation)
   */
  async triggerSystemAnnouncementNotification(_data: SystemAnnouncementTriggerData): Promise<void> {
    console.log('Stub: triggerSystemAnnouncementNotification called')
  }

  /**
   * Trigger team invitation notification (stub implementation)
   */
  async triggerTeamInvitationNotification(_data: TeamInvitationTriggerData): Promise<void> {
    console.log('Stub: triggerTeamInvitationNotification called')
  }

  /**
   * Trigger document shared notification (stub implementation)
   */
  async triggerDocumentSharedNotification(_data: DocumentSharedTriggerData): Promise<void> {
    console.log('Stub: triggerDocumentSharedNotification called')
  }

  /**
   * Check and send deadline reminders (stub implementation)
   */
  async checkAndSendDeadlineReminders(): Promise<void> {
    console.log('Stub: checkAndSendDeadlineReminders called')
  }

  /**
   * Batch create notifications (stub implementation)
   */
  async batchCreateNotifications(_notifications: NotificationInsert[]): Promise<void> {
    console.log('Stub: batchCreateNotifications called')
  }

  /**
   * Create mention notification (stub implementation)
   */
  async createMentionNotification(_data: any): Promise<any> {
    console.log('Stub: createMentionNotification called')
    return { id: 'stub-notification-id', success: true }
  }

  /**
   * Create deadline notification (stub implementation)
   */
  async createDeadlineNotification(_data: any): Promise<any> {
    console.log('Stub: createDeadlineNotification called')
    return { id: 'stub-notification-id', success: true }
  }

  /**
   * Create proposal update notification (stub implementation)
   */
  async createProposalUpdateNotification(_data: any): Promise<any[]> {
    console.log('Stub: createProposalUpdateNotification called')
    return [{ id: 'stub-notification-id', success: true }]
  }

  /**
   * Create review request notification (stub implementation)
   */
  async createReviewRequestNotification(_data: any): Promise<any> {
    console.log('Stub: createReviewRequestNotification called')
    return { id: 'stub-notification-id', success: true }
  }

  /**
   * Create system announcement notification (stub implementation)
   */
  async createSystemAnnouncementNotification(
    _title: string,
    _message: string,
    _userIds: string[],
    _priority: number,
    _expiresAt: string
  ): Promise<any[]> {
    console.log('Stub: createSystemAnnouncementNotification called')
    return [{ id: 'stub-notification-id', success: true }]
  }

  /**
   * Create research session shared notification (stub implementation)
   */
  async createResearchSessionSharedNotification(_data: any): Promise<any> {
    console.log('Stub: createResearchSessionSharedNotification called')
    return { id: 'stub-notification-id', success: true }
  }
}

export const notificationTriggers = NotificationTriggersService.getInstance() 