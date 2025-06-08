import { createClient } from '@/lib/supabase'
import { Database, NotificationType, Notification, NotificationInsert } from '@/lib/database.types'

export interface MentionTriggerData {
  mentionedUserId: string
  senderId: string
  proposalId: string
  sectionId?: string
  content: string
  commentId?: string
}

export interface DeadlineTriggerData {
  proposalId: string
  proposalTitle: string
  deadline: string
  ownerId: string
  hoursUntilDeadline: number
}

export interface ProposalUpdateTriggerData {
  proposalId: string
  proposalTitle: string
  updateType: 'status_change' | 'content_update' | 'assignment_change'
  updatedBy: string
  affectedUsers: string[]
  details: Record<string, unknown>
}

export interface ReviewRequestTriggerData {
  proposalId: string
  proposalTitle: string
  requestedBy: string
  reviewerId: string
  sectionId?: string
  deadline?: string
}

export interface ResearchSessionSharedTriggerData {
  sessionId: string
  sessionTitle: string
  sharerId: string
  sharedWithUserIds: string[]
  queryPreview?: string
}

export class NotificationTriggersService {
  private supabase = createClient()

  /**
   * Create a notification for @mentions in comments
   */
  async createMentionNotification(data: MentionTriggerData): Promise<Notification | null> {
    try {
      // Check if user has mention notifications enabled
      const { data: preferences } = await this.supabase
        .from('user_notification_preferences')
        .select('app_mentions, email_mentions')
        .eq('user_id', data.mentionedUserId)
        .single()

      if (!preferences?.app_mentions) {
        return null // User has disabled mention notifications
      }

      // Get sender details
      const { data: sender } = await this.supabase
        .from('users')
        .select('full_name, email')
        .eq('id', data.senderId)
        .single()

      // Get proposal details
      const { data: proposal } = await this.supabase
        .from('proposals')
        .select('title')
        .eq('id', data.proposalId)
        .single()

      const senderName = sender?.full_name || 'Someone'
      const proposalTitle = proposal?.title || 'a proposal'

      const notification: NotificationInsert = {
        user_id: data.mentionedUserId,
        type: 'mention',
        title: `${senderName} mentioned you`,
        content: {
          message: `${senderName} mentioned you in ${proposalTitle}`,
          preview: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
          sender: {
            id: data.senderId,
            name: senderName,
            email: sender?.email
          }
        },
        action_url: `/proposals/${data.proposalId}${data.sectionId ? `/sections/${data.sectionId}` : ''}${data.commentId ? `#comment-${data.commentId}` : ''}`,
        related_entity_type: 'comment',
        related_entity_id: data.commentId,
        sender_id: data.senderId,
        priority: 3
      }

      const { data: created, error } = await this.supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()

      if (error) throw error

      // Send email if enabled
      if (preferences.email_mentions) {
        await this.sendEmailNotification(created, data.mentionedUserId)
      }

      return created
    } catch {
      console.error('Error creating mention notification:', error)
      return null
    }
  }

  /**
   * Create deadline reminder notifications (24h and 1h before)
   */
  async createDeadlineNotification(data: DeadlineTriggerData): Promise<Notification | null> {
    try {
      // Check if user has deadline notifications enabled
      const { data: preferences } = await this.supabase
        .from('user_notification_preferences')
        .select('app_deadlines, email_deadlines')
        .eq('user_id', data.ownerId)
        .single()

      if (!preferences?.app_deadlines) {
        return null
      }

      const timeLabel = data.hoursUntilDeadline === 24 ? '24 hours' : '1 hour'
      const urgency = data.hoursUntilDeadline === 1 ? 'urgent' : 'important'

      const notification: NotificationInsert = {
        user_id: data.ownerId,
        type: 'deadline',
        title: `Deadline ${urgency}: ${timeLabel} remaining`,
        content: {
          message: `Your proposal "${data.proposalTitle}" is due in ${timeLabel}`,
          deadline: data.deadline,
          hoursRemaining: data.hoursUntilDeadline,
          urgency
        },
        action_url: `/proposals/${data.proposalId}`,
        related_entity_type: 'proposal',
        related_entity_id: data.proposalId,
        priority: data.hoursUntilDeadline === 1 ? 5 : 4,
        expires_at: data.deadline // Expire at the actual deadline
      }

      const { data: created, error } = await this.supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()

      if (error) throw error

      // Send email if enabled
      if (preferences.email_deadlines) {
        await this.sendEmailNotification(created, data.ownerId)
      }

      return created
    } catch {
      console.error('Error creating deadline notification:', error)
      return null
    }
  }

  /**
   * Create proposal update notifications
   */
  async createProposalUpdateNotification(data: ProposalUpdateTriggerData): Promise<Notification[]> {
    const notifications: Notification[] = []

    try {
      // Get updater details
      const { data: updater } = await this.supabase
        .from('users')
        .select('full_name, email')
        .eq('id', data.updatedBy)
        .single()

      const updaterName = updater?.full_name || 'Someone'

      // Create notifications for each affected user
      for (const userId of data.affectedUsers) {
        // Skip creating notification for the person who made the update
        if (userId === data.updatedBy) continue

        // Check if user has proposal update notifications enabled
        const { data: preferences } = await this.supabase
          .from('user_notification_preferences')
          .select('app_proposal_updates, email_proposal_updates')
          .eq('user_id', userId)
          .single()

        if (!preferences?.app_proposal_updates) {
          continue
        }

        let title = ''
        let message = ''

        switch (data.updateType) {
          case 'status_change':
            title = `Proposal status updated`
            message = `${updaterName} changed the status of "${data.proposalTitle}" to ${data.details.newStatus}`
            break
          case 'content_update':
            title = `Proposal content updated`
            message = `${updaterName} made changes to "${data.proposalTitle}"`
            break
          case 'assignment_change':
            title = `New assignment in proposal`
            message = `${updaterName} assigned you to work on "${data.proposalTitle}"`
            break
        }

        const notification: NotificationInsert = {
          user_id: userId,
          type: 'proposal_update',
          title,
          content: {
            message,
            updateType: data.updateType,
            details: data.details,
            updater: {
              id: data.updatedBy,
              name: updaterName,
              email: updater?.email
            }
          },
          action_url: `/proposals/${data.proposalId}`,
          related_entity_type: 'proposal',
          related_entity_id: data.proposalId,
          sender_id: data.updatedBy,
          priority: data.updateType === 'assignment_change' ? 4 : 2
        }

        const { data: created, error } = await this.supabase
          .from('notifications')
          .insert(notification)
          .select()
          .single()

        if (error) {
          console.error('Error creating proposal update notification:', error)
          continue
        }

        notifications.push(created)

        // Send email if enabled
        if (preferences.email_proposal_updates) {
          await this.sendEmailNotification(created, userId)
        }
      }

      return notifications
    } catch {
      console.error('Error creating proposal update notifications:', error)
      return notifications
    }
  }

  /**
   * Create review request notifications
   */
  async createReviewRequestNotification(data: ReviewRequestTriggerData): Promise<Notification | null> {
    try {
      // Check if reviewer has review request notifications enabled
      const { data: preferences } = await this.supabase
        .from('user_notification_preferences')
        .select('app_review_requests, email_review_requests')
        .eq('user_id', data.reviewerId)
        .single()

      if (!preferences?.app_review_requests) {
        return null
      }

      // Get requester details
      const { data: requester } = await this.supabase
        .from('users')
        .select('full_name, email')
        .eq('id', data.requestedBy)
        .single()

      const requesterName = requester?.full_name || 'Someone'

      const notification: NotificationInsert = {
        user_id: data.reviewerId,
        type: 'review_request',
        title: `Review requested`,
        content: {
          message: `${requesterName} requested your review of "${data.proposalTitle}"`,
          deadline: data.deadline,
          requester: {
            id: data.requestedBy,
            name: requesterName,
            email: requester?.email
          }
        },
        action_url: `/proposals/${data.proposalId}${data.sectionId ? `/sections/${data.sectionId}` : ''}?review=true`,
        related_entity_type: data.sectionId ? 'section' : 'proposal',
        related_entity_id: data.sectionId || data.proposalId,
        sender_id: data.requestedBy,
        priority: 4,
        expires_at: data.deadline
      }

      const { data: created, error } = await this.supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()

      if (error) throw error

      // Send email if enabled
      if (preferences.email_review_requests) {
        await this.sendEmailNotification(created, data.reviewerId)
      }

      return created
    } catch {
      console.error('Error creating review request notification:', error)
      return null
    }
  }

  /**
   * Create research session shared notifications
   */
  async createResearchSessionSharedNotification(data: ResearchSessionSharedTriggerData): Promise<Notification[]> {
    const notifications: Notification[] = []

    try {
      // Get sharer details
      const { data: sharer } = await this.supabase
        .from('users')
        .select('full_name, email')
        .eq('id', data.sharerId)
        .single()

      const sharerName = sharer?.full_name || 'Someone'

      // Create notifications for each shared user
      for (const userId of data.sharedWithUserIds) {
        // Skip creating notification for the person who shared
        if (userId === data.sharerId) continue

        // Check if user has research session shared notifications enabled
        // TODO: Uncomment after database migration is run
        // const { data: preferences } = await this.supabase
        //   .from('user_notification_preferences')
        //   .select('app_research_session_shared, email_research_session_shared')
        //   .eq('user_id', userId)
        //   .single()

        // if (!preferences?.app_research_session_shared) {
        //   continue
        // }

        // For now, assume notifications are enabled
        const preferences = { app_research_session_shared: true, email_research_session_shared: false }

        // Create the notification directly (temporary until migration is run)
        const notification: NotificationInsert = {
          user_id: userId,
          type: 'research_session_shared' as NotificationType,
          title: `${sharerName} shared a research session with you`,
          content: {
            session_title: data.sessionTitle,
            sharer_name: sharerName,
            session_id: data.sessionId,
            access_level: 'view',
            query_preview: data.queryPreview
          },
          action_url: `/dashboard/research-sessions/${data.sessionId}`,
          related_entity_type: 'research_session',
          related_entity_id: data.sessionId,
          sender_id: data.sharerId,
          priority: 2
        }

        const { data: created, error } = await this.supabase
          .from('notifications')
          .insert(notification)
          .select()
          .single()

        if (error) {
          console.error('Error creating research session shared notification:', error)
          continue
        }

        if (created) {
          notifications.push(created)

          // Send email if enabled
          if (preferences.email_research_session_shared) {
            await this.sendEmailNotification(created, userId)
          }
        }
      }

      return notifications
    } catch {
      console.error('Error creating research session shared notifications:', error)
      return notifications
    }
  }

  /**
   * Create system announcement notifications
   */
  async createSystemAnnouncementNotification(
    title: string,
    content: string,
    userIds: string[],
    priority: number = 2,
    expiresAt?: string
  ): Promise<Notification[]> {
    const notifications: Notification[] = []

    try {
      for (const userId of userIds) {
        // Check if user has system announcement notifications enabled
        const { data: preferences } = await this.supabase
          .from('user_notification_preferences')
          .select('app_system_announcements, email_system_announcements')
          .eq('user_id', userId)
          .single()

        if (!preferences?.app_system_announcements) {
          continue
        }

        const notification: NotificationInsert = {
          user_id: userId,
          type: 'system_announcement',
          title,
          content: {
            message: content,
            isSystemMessage: true
          },
          priority,
          expires_at: expiresAt
        }

        const { data: created, error } = await this.supabase
          .from('notifications')
          .insert(notification)
          .select()
          .single()

        if (error) {
          console.error('Error creating system announcement notification:', error)
          continue
        }

        notifications.push(created)

        // Send email if enabled
        if (preferences.email_system_announcements) {
          await this.sendEmailNotification(created, userId)
        }
      }

      return notifications
    } catch {
      console.error('Error creating system announcement notifications:', error)
      return notifications
    }
  }

  /**
   * Check for upcoming deadlines and create reminder notifications
   */
  async checkAndCreateDeadlineReminders(): Promise<void> {
    try {
      // Get proposals approaching deadlines
      const { data: proposals, error } = await this.supabase
        .rpc('get_proposals_approaching_deadline', { days_ahead: 1 })

      if (error) throw error

      for (const proposal of proposals || []) {
        const hoursRemaining = Math.floor(proposal.days_remaining * 24)

        // Create 24-hour reminder
        if (hoursRemaining <= 24 && hoursRemaining > 23) {
          await this.createDeadlineNotification({
            proposalId: proposal.proposal_id,
            proposalTitle: proposal.title,
            deadline: proposal.deadline,
            ownerId: proposal.owner_email, // Note: This should be owner_id, may need DB function update
            hoursUntilDeadline: 24
          })
        }

        // Create 1-hour reminder
        if (hoursRemaining <= 1 && hoursRemaining > 0) {
          await this.createDeadlineNotification({
            proposalId: proposal.proposal_id,
            proposalTitle: proposal.title,
            deadline: proposal.deadline,
            ownerId: proposal.owner_email, // Note: This should be owner_id, may need DB function update
            hoursUntilDeadline: 1
          })
        }
      }
    } catch {
      console.error('Error checking deadline reminders:', error)
    }
  }

  /**
   * Send email notification using email service
   */
  private async sendEmailNotification(notification: Notification, userId: string): Promise<void> {
    try {
      // Get user details and preferences
      const [userResult, preferencesResult] = await Promise.all([
        this.supabase
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single(),
        this.supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single()
      ])

      const user = userResult.data
      const preferences = preferencesResult.data

      if (!user?.email || !preferences) {
        console.error('Missing user data or preferences for email notification:', userId)
        return
      }

      // Import email service dynamically to avoid circular dependencies
      const { emailService } = await import('./email-service')
      
      await emailService.sendNotificationEmail(
        user.email,
        {
          userName: user.full_name,
          notification,
          actionUrl: notification.action_url || undefined,
          unsubscribeUrl: emailService.generateUnsubscribeUrl(userId)
        },
        preferences
      )
    } catch {
      console.error('Error sending email notification:', error)
    }
  }
}

// Export singleton instance
export const notificationTriggers = new NotificationTriggersService() 