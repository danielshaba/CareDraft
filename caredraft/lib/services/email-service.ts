import { Resend } from 'resend'
import { Notification, UserNotificationPreferences } from '@/lib/database.types'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface NotificationEmailData {
  userName: string
  notification: Notification
  actionUrl?: string
  unsubscribeUrl: string
}

export class EmailService {
  private readonly fromEmail = 'notifications@notifications.caredraft.co.uk'
  private readonly baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://caredraft.co.uk'

  /**
   * Send a notification email
   */
  async sendNotificationEmail(
    to: string,
    data: NotificationEmailData,
    preferences: UserNotificationPreferences
  ): Promise<boolean> {
    try {
      // Check if user has email notifications enabled for this type
      if (!this.isEmailEnabledForType(data.notification.type, preferences)) {
        return false
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        // TODO: Queue for later sending
        console.log('Email queued due to quiet hours')
        return false
      }

      const template = this.generateEmailTemplate(data)
      
      const result = await resend.emails.send({
        from: this.fromEmail,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'X-Notification-Type': data.notification.type,
          'X-Notification-ID': data.notification.id,
        },
      })

      return !!result.data?.id
    } catch {
      console.error('Error sending notification email:', error)
      return false
    }
  }

  /**
   * Send a digest email with multiple notifications
   */
  async sendDigestEmail(
    to: string,
    userName: string,
    notifications: Notification[],
    unsubscribeUrl: string
  ): Promise<boolean> {
    try {
      const template = this.generateDigestTemplate({
        userName,
        notifications,
        unsubscribeUrl
      })

      const result = await resend.emails.send({
        from: this.fromEmail,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'X-Email-Type': 'digest',
          'X-Notification-Count': notifications.length.toString(),
        },
      })

      return !!result.data?.id
    } catch {
      console.error('Error sending digest email:', error)
      return false
    }
  }

  /**
   * Check if email notifications are enabled for a specific notification type
   */
  private isEmailEnabledForType(
    type: Notification['type'],
    preferences: UserNotificationPreferences
  ): boolean {
    switch (type) {
      case 'mention':
        return preferences.email_mentions
      case 'deadline':
        return preferences.email_deadlines
      case 'proposal_update':
        return preferences.email_proposal_updates
      case 'review_request':
        return preferences.email_review_requests
      case 'system_announcement':
        return preferences.email_system_announcements
      case 'team_invitation':
        return preferences.email_team_invitations
      case 'document_shared':
        return preferences.email_document_shared
      default:
        return false
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  private isInQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false
    }

    const now = new Date()
    const userTimezone = preferences.timezone || 'UTC'
    
    // Convert current time to user's timezone
    const userTime = new Intl.DateTimeFormat('en', {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now)

    const currentTime = userTime.replace(':', '')
    const quietStart = preferences.quiet_hours_start.replace(':', '')
    const quietEnd = preferences.quiet_hours_end.replace(':', '')

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (quietStart > quietEnd) {
      return currentTime >= quietStart || currentTime <= quietEnd
    }

    // Normal quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= quietStart && currentTime <= quietEnd
  }

  /**
   * Generate email template for individual notification
   */
  private generateEmailTemplate(data: NotificationEmailData): EmailTemplate {
    const { notification, userName, actionUrl, unsubscribeUrl } = data
    const content = notification.content as any

    const subject = this.getEmailSubject(notification)
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .header { background: linear-gradient(135deg, #E57373 0%, #EF5350 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { background: white; padding: 30px 20px; }
            .notification-card { background: #f8f9fa; border-left: 4px solid #E57373; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .action-button { background: #E57373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
            .priority-urgent { border-left-color: #dc3545; }
            .priority-high { border-left-color: #fd7e14; }
            .priority-medium { border-left-color: #E57373; }
            .priority-low { border-left-color: #20c997; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CareDraft</h1>
              <p>You have a new notification</p>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              
              <div class="notification-card priority-${this.getPriorityClass(notification.priority)}">
                <h3>${notification.title}</h3>
                <p>${content.message || notification.title}</p>
                
                ${content.preview ? `<p><em>"${content.preview}"</em></p>` : ''}
                
                ${content.deadline ? `<p><strong>Deadline:</strong> ${new Date(content.deadline).toLocaleDateString()}</p>` : ''}
                
                ${content.sender ? `<p><strong>From:</strong> ${content.sender.name}</p>` : ''}
              </div>
              
              ${actionUrl ? `<a href="${actionUrl}" class="action-button">View Details</a>` : ''}
              
              <p>This notification was sent because you have email notifications enabled in your CareDraft settings.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CareDraft. All rights reserved.</p>
              <p>
                <a href="${unsubscribeUrl}">Manage notification preferences</a> | 
                <a href="${this.baseUrl}/support">Contact Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
CareDraft Notification

Hello ${userName},

${notification.title}
${content.message || notification.title}

${content.preview ? `"${content.preview}"` : ''}
${content.deadline ? `Deadline: ${new Date(content.deadline).toLocaleDateString()}` : ''}
${content.sender ? `From: ${content.sender.name}` : ''}

${actionUrl ? `View details: ${actionUrl}` : ''}

Manage your notification preferences: ${unsubscribeUrl}

© ${new Date().getFullYear()} CareDraft. All rights reserved.
    `.trim()

    return { subject, html, text }
  }

  /**
   * Generate email template for digest notifications
   */
  private generateDigestTemplate(data: {
    userName: string
    notifications: Notification[]
    unsubscribeUrl: string
  }): EmailTemplate {
    const { userName, notifications, unsubscribeUrl } = data
    const count = notifications.length
    
    const subject = `CareDraft: ${count} new notification${count > 1 ? 's' : ''}`
    
    const notificationItems = notifications.map(notification => {
      const content = notification.content as any
      return `
        <div class="notification-item priority-${this.getPriorityClass(notification.priority)}">
          <h4>${notification.title}</h4>
          <p>${content.message || notification.title}</p>
          ${notification.action_url ? `<a href="${notification.action_url}">View →</a>` : ''}
        </div>
      `
    }).join('')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .header { background: linear-gradient(135deg, #E57373 0%, #EF5350 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { background: white; padding: 30px 20px; }
            .notification-item { background: #f8f9fa; border-left: 4px solid #E57373; padding: 15px; margin: 15px 0; border-radius: 6px; }
            .notification-item h4 { margin: 0 0 10px 0; color: #333; }
            .notification-item p { margin: 0 0 10px 0; color: #666; }
            .notification-item a { color: #E57373; text-decoration: none; font-weight: 500; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
            .priority-urgent { border-left-color: #dc3545; }
            .priority-high { border-left-color: #fd7e14; }
            .priority-medium { border-left-color: #E57373; }
            .priority-low { border-left-color: #20c997; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CareDraft</h1>
              <p>Your notification digest</p>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>You have ${count} new notification${count > 1 ? 's' : ''} waiting for you:</p>
              
              ${notificationItems}
              
              <p style="margin-top: 30px;">
                <a href="${this.baseUrl}/notifications" style="background: #E57373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View All Notifications</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CareDraft. All rights reserved.</p>
              <p>
                <a href="${unsubscribeUrl}">Manage notification preferences</a> | 
                <a href="${this.baseUrl}/support">Contact Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
CareDraft Notification Digest

Hello ${userName},

You have ${count} new notification${count > 1 ? 's' : ''}:

${notifications.map(n => {
  const content = n.content as any
  return `• ${n.title}\n  ${content.message || n.title}${n.action_url ? `\n  View: ${n.action_url}` : ''}`
}).join('\n\n')}

View all notifications: ${this.baseUrl}/notifications
Manage preferences: ${unsubscribeUrl}

© ${new Date().getFullYear()} CareDraft. All rights reserved.
    `.trim()

    return { subject, html, text }
  }

  /**
   * Get email subject for notification type
   */
  private getEmailSubject(notification: Notification): string {
    const content = notification.content as any
    
    switch (notification.type) {
      case 'mention':
        return `${content.sender?.name || 'Someone'} mentioned you in CareDraft`
      case 'deadline':
        return `Deadline reminder: ${content.urgency === 'urgent' ? 'Due soon!' : 'Coming up'}`
      case 'proposal_update':
        return `Proposal updated: ${notification.title}`
      case 'review_request':
        return `Review requested: ${notification.title}`
      case 'system_announcement':
        return `CareDraft: ${notification.title}`
      default:
        return `CareDraft: ${notification.title}`
    }
  }

  /**
   * Get CSS class for notification priority
   */
  private getPriorityClass(priority: number): string {
    if (priority >= 5) return 'urgent'
    if (priority >= 4) return 'high'
    if (priority >= 2) return 'medium'
    return 'low'
  }

  /**
   * Generate unsubscribe URL for user
   */
  generateUnsubscribeUrl(userId: string): string {
    return `${this.baseUrl}/settings/notifications?user=${userId}`
  }
}

// Export singleton instance
export const emailService = new EmailService() 