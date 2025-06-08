import { createClient } from '@/lib/supabase'
import { EmailService } from './email-service'
import type { Database } from '@/lib/database.types'
import type { UserRole } from '@/lib/auth.types'

type InvitationRow = Database['public']['Tables']['user_invitations']['Row']
type InvitationInsert = Database['public']['Tables']['user_invitations']['Insert']
type InvitationUpdate = Database['public']['Tables']['user_invitations']['Update']

export interface CreateInvitationRequest {
  email: string
  role: UserRole
  message?: string
  customExpiryDays?: number
}

export interface InvitationDetails {
  id: string
  email: string
  role: UserRole
  status: string
  message?: string
  inviterName: string
  organizationName: string
  expiresAt: string
  createdAt: string
  sentAt?: string
  acceptedAt?: string
}

export interface InvitationListItem extends InvitationDetails {
  invitedBy: string
  canResend: boolean
  canCancel: boolean
  daysUntilExpiry: number
}

export interface InvitationStats {
  total: number
  pending: number
  accepted: number
  expired: number
  cancelled: number
}

export class InvitationService {
  private supabase = createClient()
  private emailService = new EmailService()

  /**
   * Create and send a new user invitation
   */
  async createInvitation(request: CreateInvitationRequest, inviterId: string): Promise<{
    success: boolean
    invitation?: InvitationDetails
    error?: string
  }> {
    try {
      // Get inviter and organization details
      const { data: inviter, error: inviterError } = await this.supabase
        .from('users')
        .select('full_name, organization_id, organizations(name)')
        .eq('id', inviterId)
        .single()

      if (inviterError || !inviter) {
        return { success: false, error: 'Inviter not found' }
      }

      // Check if invitation already exists for this email/organization
      const { data: existingInvitation } = await this.supabase
        .from('user_invitations')
        .select('id, status')
        .eq('email', request.email)
        .eq('organization_id', inviter.organization_id)
        .in('status', ['pending', 'resent'])
        .single()

      if (existingInvitation) {
        return { 
          success: false, 
          error: 'An active invitation already exists for this email address' 
        }
      }

      // Check if user is already a member
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', request.email)
        .eq('organization_id', inviter.organization_id)
        .single()

      if (existingUser) {
        return { 
          success: false, 
          error: 'User is already a member of this organization' 
        }
      }

      // Calculate expiry date
      const expiryDays = request.customExpiryDays || 7
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)

      // Create invitation record
      const insertData: InvitationInsert = {
        email: request.email,
        role: request.role,
        organization_id: inviter.organization_id,
        invited_by: inviterId,
        message: request.message,
        expires_at: expiresAt.toISOString()
      }

      const { data: invitation, error: insertError } = await this.supabase
        .from('user_invitations')
        .insert(insertData)
        .select(`
          id,
          email,
          role,
          status,
          message,
          expires_at,
          created_at,
          invitation_token
        `)
        .single()

      if (insertError || !invitation) {
        return { success: false, error: 'Failed to create invitation' }
      }

      // Send invitation email
      const emailSent = await this.sendInvitationEmail(
        invitation.id,
        invitation.email,
        invitation.role,
        invitation.invitation_token,
        inviter.full_name || 'A team member',
        (inviter.organizations as any)?.name || 'the team',
        request.message,
        expiresAt
      )

      if (emailSent) {
        // Update sent_at timestamp
        await this.supabase
          .from('user_invitations')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', invitation.id)
      }

      return {
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          message: invitation.message || undefined,
          inviterName: inviter.full_name || 'Team Member',
          organizationName: (inviter.organizations as any)?.name || 'Organization',
          expiresAt: invitation.expires_at,
          createdAt: invitation.created_at,
          sentAt: emailSent ? new Date().toISOString() : undefined
        }
      }
    } catch {
      console.error('Error creating invitation:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create invitation' 
      }
    }
  }

  /**
   * Get invitations for an organization
   */
  async getInvitations(organizationId: string, status?: string): Promise<{
    success: boolean
    invitations?: InvitationListItem[]
    stats?: InvitationStats
    error?: string
  }> {
    try {
      let query = this.supabase
        .from('user_invitations')
        .select(`
          id,
          email,
          role,
          status,
          message,
          expires_at,
          created_at,
          sent_at,
          accepted_at,
          invited_by,
          users!invited_by(full_name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: invitations, error } = await query

      if (error) {
        return { success: false, error: error.message }
      }

      // Get stats for all invitations
      const { data: allInvitations } = await this.supabase
        .from('user_invitations')
        .select('status')
        .eq('organization_id', organizationId)

      const stats: InvitationStats = {
        total: allInvitations?.length || 0,
        pending: allInvitations?.filter(i => i.status === 'pending').length || 0,
        accepted: allInvitations?.filter(i => i.status === 'accepted').length || 0,
        expired: allInvitations?.filter(i => i.status === 'expired').length || 0,
        cancelled: allInvitations?.filter(i => i.status === 'cancelled').length || 0
      }

      const formattedInvitations: InvitationListItem[] = (invitations || []).map(inv => {
        const expiresAt = new Date(inv.expires_at)
        const now = new Date()
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          id: inv.id,
          email: inv.email,
          role: inv.role as UserRole,
          status: inv.status,
          message: inv.message || undefined,
          inviterName: (inv.users as any)?.full_name || 'Unknown',
          organizationName: '', // This would need a join to get org name
          expiresAt: inv.expires_at,
          createdAt: inv.created_at,
          sentAt: inv.sent_at || undefined,
          acceptedAt: inv.accepted_at || undefined,
          invitedBy: inv.invited_by,
          canResend: ['pending', 'expired'].includes(inv.status) && daysUntilExpiry > 0,
          canCancel: ['pending', 'resent'].includes(inv.status),
          daysUntilExpiry: Math.max(0, daysUntilExpiry)
        }
      })

      return {
        success: true,
        invitations: formattedInvitations,
        stats
      }
    } catch {
      console.error('Error getting invitations:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get invitations' 
      }
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Get invitation details
      const { data: invitation, error: getError } = await this.supabase
        .from('user_invitations')
        .select(`
          id,
          email,
          role,
          status,
          message,
          organization_id,
          invitation_token,
          users!invited_by(full_name),
          organizations(name)
        `)
        .eq('id', invitationId)
        .single()

      if (getError || !invitation) {
        return { success: false, error: 'Invitation not found' }
      }

      if (!['pending', 'expired'].includes(invitation.status)) {
        return { success: false, error: 'Invitation cannot be resent' }
      }

      // Extend expiry and update status
      const newExpiryDate = new Date()
      newExpiryDate.setDate(newExpiryDate.getDate() + 7)

      const { error: updateError } = await this.supabase
        .from('user_invitations')
        .update({
          status: 'resent',
          expires_at: newExpiryDate.toISOString(),
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (updateError) {
        return { success: false, error: 'Failed to update invitation' }
      }

      // Send email again
      await this.sendInvitationEmail(
        invitation.id,
        invitation.email,
        invitation.role as UserRole,
        invitation.invitation_token,
        (invitation.users as any)?.full_name || 'A team member',
        (invitation.organizations as any)?.name || 'the team',
        invitation.message,
        newExpiryDate,
        true // isResend
      )

      return { success: true }
    } catch {
      console.error('Error resending invitation:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to resend invitation' 
      }
    }
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await this.supabase
        .from('user_invitations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch {
      console.error('Error cancelling invitation:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel invitation' 
      }
    }
  }

  /**
   * Accept an invitation using token
   */
  async acceptInvitation(token: string, userId: string): Promise<{
    success: boolean
    organizationId?: string
    role?: UserRole
    error?: string
  }> {
    try {
      // Use the database function for acceptance
      const { data, error } = await this.supabase
        .rpc('accept_invitation', {
          p_invitation_token: token,
          p_user_id: userId
        })

      if (error) {
        return { success: false, error: error.message }
      }

      const result = data as { success: boolean; organization_id?: string; role?: string; error?: string }
      
      if (!result.success) {
        return { success: false, error: result.error }
      }

      return {
        success: true,
        organizationId: result.organization_id,
        role: result.role as UserRole
      }
    } catch {
      console.error('Error accepting invitation:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to accept invitation' 
      }
    }
  }

  /**
   * Get invitation by token for display purposes
   */
  async getInvitationByToken(token: string): Promise<{
    success: boolean
    invitation?: {
      email: string
      role: UserRole
      organizationName: string
      inviterName: string
      expiresAt: string
      message?: string
      isExpired: boolean
    }
    error?: string
  }> {
    try {
      const { data: invitation, error } = await this.supabase
        .from('user_invitations')
        .select(`
          email,
          role,
          message,
          expires_at,
          status,
          users!invited_by(full_name),
          organizations(name)
        `)
        .eq('invitation_token', token)
        .single()

      if (error || !invitation) {
        return { success: false, error: 'Invitation not found' }
      }

      const now = new Date()
      const expiresAt = new Date(invitation.expires_at)
      const isExpired = now > expiresAt || invitation.status === 'expired'

      return {
        success: true,
        invitation: {
          email: invitation.email,
          role: invitation.role as UserRole,
          organizationName: (invitation.organizations as any)?.name || 'Organization',
          inviterName: (invitation.users as any)?.full_name || 'Team Member',
          expiresAt: invitation.expires_at,
          message: invitation.message || undefined,
          isExpired
        }
      }
    } catch {
      console.error('Error getting invitation by token:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get invitation' 
      }
    }
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(
    invitationId: string,
    email: string,
    role: UserRole,
    token: string,
    inviterName: string,
    organizationName: string,
    message?: string | null,
    expiresAt?: Date,
    isResend: boolean = false
  ): Promise<boolean> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://caredraft.co.uk'
      const acceptUrl = `${baseUrl}/auth/signup?invite=${token}&email=${encodeURIComponent(email)}`
      
      const subject = isResend 
        ? `[REMINDER] Join ${organizationName} on CareDraft`
        : `Join ${organizationName} on CareDraft`

      const emailHtml = this.generateInvitationEmailTemplate({
        inviterName,
        organizationName,
        email,
        role,
        acceptUrl,
        message: message || undefined,
        expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isResend
      })

      const emailPayload = {
        from: 'CareDraft <noreply@notifications.caredraft.co.uk>',
        to: [email],
        subject,
        html: emailHtml,
        headers: {
          'X-Invitation-ID': invitationId,
          'X-Invitation-Token': token,
          'X-Email-Type': isResend ? 'resend' : 'invitation'
        }
      }

      // Log the email attempt
      await this.supabase
        .from('invitation_email_logs')
        .insert({
          invitation_id: invitationId,
          email_type: isResend ? 'resend' : 'invitation',
          recipient_email: email,
          subject: subject,
          delivery_status: 'pending'
        })

      // Send via Resend API
      const resendApiKey = process.env.RESEND_API_KEY
      if (!resendApiKey) {
        console.warn('Resend API key not configured')
        return false
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      })

      const result = await response.json()

      // Update email log with result
      await this.supabase
        .from('invitation_email_logs')
        .update({
          provider_message_id: result.id,
          delivery_status: response.ok ? 'sent' : 'failed',
          provider_response: result,
          error_message: response.ok ? undefined : result.message,
          sent_at: new Date().toISOString()
        })
        .eq('invitation_id', invitationId)
        .eq('email_type', isResend ? 'resend' : 'invitation')

      return response.ok
    } catch {
      console.error('Error sending invitation email:', error)
      return false
    }
  }

  /**
   * Generate invitation email template
   */
  private generateInvitationEmailTemplate(data: {
    inviterName: string
    organizationName: string
    email: string
    role: UserRole
    acceptUrl: string
    message?: string
    expiresAt: Date
    isResend: boolean
  }): string {
    const roleDisplayName = {
      admin: 'Administrator',
      manager: 'Manager', 
      writer: 'Writer',
      viewer: 'Viewer'
    }[data.role] || 'Team Member'

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join ${data.organizationName} on CareDraft</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">
            ${data.isResend ? '🔄 Invitation Reminder' : '🎉 You\'re Invited!'}
          </h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">
            Join ${data.organizationName} on CareDraft
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi there! 👋
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> as a <strong>${roleDisplayName}</strong> on CareDraft - the platform for creating winning care proposals.
          </p>
          
          ${data.message ? `
          <div style="background: #e0f2fe; border-left: 4px solid #0288d1; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-style: italic; color: #0277bd;">
              "${data.message}"
            </p>
          </div>
          ` : ''}
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #059669;">What you can do as a ${roleDisplayName}:</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${data.role === 'admin' ? `
                <li>Full administrative access to all features</li>
                <li>Manage users and organization settings</li>
                <li>Create, edit, and manage all proposals</li>
                <li>Access all collaboration tools</li>
              ` : data.role === 'manager' ? `
                <li>Create and manage proposals</li>
                <li>Collaborate with team members</li>
                <li>Review and approve content</li>
                <li>Access analytics and reporting</li>
              ` : data.role === 'writer' ? `
                <li>Create and edit proposals</li>
                <li>Collaborate on content creation</li>
                <li>Access research and answer bank</li>
                <li>Participate in team discussions</li>
              ` : `
                <li>View and comment on proposals</li>
                <li>Access shared content and resources</li>
                <li>Participate in collaborative reviews</li>
                <li>Stay updated on project progress</li>
              `}
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.acceptUrl}" 
               style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Accept Invitation & Join Team
            </a>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              ⏰ <strong>This invitation expires on ${data.expiresAt.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</strong>
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
            ${data.acceptUrl}
          </p>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Questions? Reply to this email or contact your team administrator.
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              This invitation was sent by CareDraft on behalf of ${data.organizationName}<br>
              If you weren't expecting this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

export const invitationService = new InvitationService() 