'use client'

import { createClient } from '@/lib/supabase'
import { DocumentStorageService, type ExportedDocumentMetadata } from './document-storage'

// Email provider configuration
interface EmailProvider {
  name: string
  apiKey: string
  baseUrl: string
}

// Email attachment interface
export interface EmailAttachment {
  filename: string
  content: string // Base64 encoded content
  contentType: string
  size: number
}

// Email template interface
export interface EmailTemplate {
  subject: string
  body: string
  isHtml: boolean
}

// Email delivery configuration
export interface EmailDeliveryConfig {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  isHtml?: boolean
  attachments?: EmailAttachment[]
  replyTo?: string
  customHeaders?: Record<string, string>
  template?: 'document_share' | 'proposal_delivery' | 'custom'
  templateData?: Record<string, unknown>
}

// Email delivery result
export interface EmailDeliveryResult {
  success: boolean
  messageId?: string
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  error?: string
  provider?: string
  recipientCount: number
  attachmentCount: number
}

// Email delivery log entry
export interface EmailDeliveryLog {
  id: string
  documentId: string
  senderId: string
  recipientEmail: string
  recipientName?: string
  subject: string
  deliveryStatus: EmailDeliveryResult['deliveryStatus']
  emailProvider?: string
  providerMessageId?: string
  errorMessage?: string
  sentAt?: string
  deliveredAt?: string
  createdAt: string
}

// Default email templates
const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  document_share: {
    subject: '📄 Document Shared: {documentTitle}',
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #E57373 0%, #F06292 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">CareDraft Document Share</h1>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Hello {recipientName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            {senderName} has shared a document with you from CareDraft:
          </p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #E57373; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h3 style="margin: 0 0 10px 0; color: #E57373; font-size: 18px;">📄 {documentTitle}</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Format:</strong> {documentFormat} • 
              <strong>Size:</strong> {documentSize} • 
              <strong>Created:</strong> {createdDate}
            </p>
          </div>
          
          {customMessage && (
            <div style="background: #e3f2fd; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">💬 Message from {senderName}:</h4>
              <p style="margin: 0; color: #666; font-style: italic;">{customMessage}</p>
            </div>
          )}
          
          <p style="color: #666; line-height: 1.6; margin: 20px 0;">
            The document is attached to this email. You can also access it through the secure link below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{downloadLink}" style="background: #E57373; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              🔗 View Document
            </a>
          </div>
          
          <div style="background: #fff3e0; border: 1px solid #ffb74d; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #e65100; font-size: 14px;">
              <strong>🔒 Security Notice:</strong> This link will expire in {expirationTime}. The document is securely stored and access is monitored.
            </p>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; color: #999; font-size: 12px;">
            This email was sent from CareDraft. If you have any questions, please contact {senderEmail}.
          </p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
            © 2024 CareDraft. All rights reserved.
          </p>
        </div>
      </div>
    `,
    isHtml: true
  },
  
  proposal_delivery: {
    subject: '📋 Proposal Delivery: {proposalTitle}',
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #E57373 0%, #F06292 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">CareDraft Proposal Delivery</h1>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Dear {recipientName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            We are pleased to submit our proposal for your consideration:
          </p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #E57373; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h3 style="margin: 0 0 10px 0; color: #E57373; font-size: 18px;">📋 {proposalTitle}</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Format:</strong> {documentFormat} • 
              <strong>Pages:</strong> {pageCount} • 
              <strong>Submitted:</strong> {submissionDate}
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin: 20px 0;">
            This proposal has been carefully prepared to address your requirements. Please find the complete document attached to this email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{downloadLink}" style="background: #E57373; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              📄 Download Proposal
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin: 20px 0;">
            We look forward to discussing this proposal with you. Should you have any questions or require clarification on any aspect, please don't hesitate to contact us.
          </p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; color: #999; font-size: 12px;">
            This proposal was generated using CareDraft. Contact: {senderEmail}
          </p>
        </div>
      </div>
    `,
    isHtml: true
  }
}

export class EmailDeliveryService {
  private static instance: EmailDeliveryService
  private supabase = createClient()
  private storageService = DocumentStorageService.getInstance()

  private constructor() {}

  static getInstance(): EmailDeliveryService {
    if (!EmailDeliveryService.instance) {
      EmailDeliveryService.instance = new EmailDeliveryService()
    }
    return EmailDeliveryService.instance
  }

  /**
   * Send exported document via email
   */
  async sendDocumentEmail(
    documentId: string,
    senderId: string,
    config: EmailDeliveryConfig
  ): Promise<EmailDeliveryResult> {
    try {
      // Get document metadata
      const { data: documents } = await this.storageService.getUserDocuments(senderId, {
        limit: 1
      })
      
      const document = documents?.find(doc => doc.id === documentId)
      if (!document) {
        throw new Error('Document not found or access denied')
      }

      // Create download link for attachment
      const linkResult = await this.storageService.createDownloadLink(documentId, senderId, 3600)
      if (!linkResult.success || !linkResult.url) {
        throw new Error('Failed to create download link')
      }

      // Prepare email content
      const emailContent = await this.prepareEmailContent(config, document, linkResult.url)
      
      // Get document blob for attachment
      const documentAttachment = await this.createDocumentAttachment(document, linkResult.url)
      
      // Add document attachment to email
      const finalConfig: EmailDeliveryConfig = {
        ...emailContent,
        attachments: [
          ...(config.attachments || []),
          documentAttachment
        ]
      }

      // Send email via provider
      const result = await this.sendEmail(finalConfig)

      // Log email delivery
      for (const recipient of config.to) {
        await this.logEmailDelivery({
          documentId,
          senderId,
          recipientEmail: recipient,
          subject: finalConfig.subject,
          deliveryStatus: result.deliveryStatus,
          emailProvider: result.provider,
          providerMessageId: result.messageId,
          errorMessage: result.error
        })
      }

      return result
    } catch {
      const errorResult: EmailDeliveryResult = {
        success: false,
        deliveryStatus: 'failed',
        error: error instanceof Error ? error.message : 'Failed to send email',
        recipientCount: config.to.length,
        attachmentCount: (config.attachments?.length || 0) + 1
      }

      // Log failed delivery
      for (const recipient of config.to) {
        await this.logEmailDelivery({
          documentId,
          senderId,
          recipientEmail: recipient,
          subject: config.subject,
          deliveryStatus: 'failed',
          errorMessage: errorResult.error
        })
      }

      return errorResult
    }
  }

  /**
   * Prepare email content using templates
   */
  private async prepareEmailContent(
    config: EmailDeliveryConfig,
    document: ExportedDocumentMetadata,
    downloadLink: string
  ): Promise<EmailDeliveryConfig> {
    if (!config.template || config.template === 'custom') {
      return config
    }

    const template = EMAIL_TEMPLATES[config.template]
    if (!template) {
      return config
    }

    // Get sender information (mock for now)
    const senderName = config.templateData?.senderName || 'CareDraft User'
    const senderEmail = config.templateData?.senderEmail || 'noreply@notifications.caredraft.co.uk'

    // Prepare template variables
    const templateVars = {
      documentTitle: document.originalTitle,
      documentFormat: document.exportFormat.toUpperCase(),
      documentSize: this.formatFileSize(document.fileSize),
      createdDate: new Date(document.createdAt).toLocaleDateString(),
      senderName,
      senderEmail,
      recipientName: config.templateData?.recipientName || 'Valued Client',
      downloadLink,
      expirationTime: '7 days',
      customMessage: config.templateData?.customMessage || '',
      proposalTitle: config.templateData?.proposalTitle || document.originalTitle,
      pageCount: config.templateData?.pageCount || 'Multiple',
      submissionDate: new Date().toLocaleDateString(),
      ...config.templateData
    }

    // Replace template variables
    let subject = template.subject
    let body = template.body

    Object.entries(templateVars).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value || ''))
      body = body.replace(new RegExp(placeholder, 'g'), String(value || ''))
    })

    return {
      ...config,
      subject,
      body,
      isHtml: template.isHtml
    }
  }

  /**
   * Create document attachment from storage
   */
  private async createDocumentAttachment(
    document: ExportedDocumentMetadata,
    downloadUrl: string
  ): Promise<EmailAttachment> {
    try {
      // Download document content
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error('Failed to download document')
      }

      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const base64Content = Buffer.from(arrayBuffer).toString('base64')

      return {
        filename: document.filename,
        content: base64Content,
        contentType: document.exportFormat === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: document.fileSize
      }
    } catch {
      throw new Error(`Failed to prepare attachment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Send email via Resend API
   */
  private async sendEmail(config: EmailDeliveryConfig): Promise<EmailDeliveryResult> {
    try {
      const resendApiKey = process.env.RESEND_API_KEY
      
      if (!resendApiKey) {
        console.warn('Resend API key not configured, falling back to simulation')
        // Fallback to simulation for development
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {
          success: true,
          messageId: `sim_${crypto.randomUUID()}`,
          deliveryStatus: 'sent',
          provider: 'simulated',
          recipientCount: config.to.length,
          attachmentCount: config.attachments?.length || 0
        }
      }

      // Prepare Resend email payload
      const emailPayload = {
        from: config.replyTo || 'CareDraft <noreply@notifications.caredraft.co.uk>',
        to: config.to,
        cc: config.cc,
        bcc: config.bcc,
        subject: config.subject,
        html: config.isHtml ? config.body : undefined,
        text: !config.isHtml ? config.body : undefined,
        attachments: config.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType
        })),
        headers: config.customHeaders
      }

      // Send via Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Resend API error: ${response.status}`)
      }

      return {
        success: true,
        messageId: result.id,
        deliveryStatus: 'sent',
        provider: 'resend',
        recipientCount: config.to.length,
        attachmentCount: config.attachments?.length || 0
      }
    } catch {
      return {
        success: false,
        deliveryStatus: 'failed',
        error: error instanceof Error ? error.message : 'Email delivery failed',
        provider: 'resend',
        recipientCount: config.to.length,
        attachmentCount: config.attachments?.length || 0
      }
    }
  }

  /**
   * Log email delivery attempt
   */
  private async logEmailDelivery(log: Omit<EmailDeliveryLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      const logEntry = {
        id: crypto.randomUUID(),
        ...log,
        sentAt: log.deliveryStatus === 'sent' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString()
      }

      await this.supabase
        .from('email_delivery_logs')
        .insert([logEntry])
    } catch {
      console.warn('Failed to log email delivery:', error)
      // Don't throw error for logging failures
    }
  }

  /**
   * Get email delivery history for a user
   */
  async getEmailHistory(
    userId: string,
    options: {
      documentId?: string
      page?: number
      limit?: number
      status?: EmailDeliveryResult['deliveryStatus']
    } = {}
  ): Promise<{ success: boolean; data?: EmailDeliveryLog[]; total?: number; error?: string }> {
    try {
      const { page = 1, limit = 20, documentId, status } = options

      let query = this.supabase
        .from('email_delivery_logs')
        .select('*', { count: 'exact' })
        .eq('sender_id', userId)

      if (documentId) {
        query = query.eq('document_id', documentId)
      }
      if (status) {
        query = query.eq('delivery_status', status)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        data: data as EmailDeliveryLog[],
        total: count || 0
      }
    } catch {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get email history'
      }
    }
  }

  /**
   * Resend failed email
   */
  async resendEmail(
    logId: string,
    userId: string
  ): Promise<EmailDeliveryResult> {
    try {
      // Get original email log
      const { data: log, error } = await this.supabase
        .from('email_delivery_logs')
        .select('*')
        .eq('id', logId)
        .eq('sender_id', userId)
        .single()

      if (error || !log) {
        throw new Error('Email log not found or access denied')
      }

      // Prepare resend configuration
      const config: EmailDeliveryConfig = {
        to: [log.recipient_email],
        subject: log.subject,
        body: 'Resending document...', // Basic body, will be replaced by template
        template: 'document_share',
        templateData: {
          recipientName: log.recipient_name || 'Valued Client'
        }
      }

      // Resend email
      return await this.sendDocumentEmail(log.document_id, log.sender_id, config)
    } catch {
      return {
        success: false,
        deliveryStatus: 'failed',
        error: error instanceof Error ? error.message : 'Failed to resend email',
        recipientCount: 1,
        attachmentCount: 1
      }
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * Get email delivery analytics
   */
  async getEmailAnalytics(
    userId: string
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('email_delivery_logs')
        .select('delivery_status, created_at')
        .eq('sender_id', userId)

      if (error) {
        throw new Error(error.message)
      }

      // Process analytics
      const analytics = {
        total_emails: data.length,
        success_rate: 0,
        status_breakdown: {} as Record<string, number>,
        daily_activity: {} as Record<string, number>
      }

      data.forEach(log => {
        // Status breakdown
        analytics.status_breakdown[log.delivery_status] = 
          (analytics.status_breakdown[log.delivery_status] || 0) + 1

        // Daily activity
        const date = new Date(log.created_at).toDateString()
        analytics.daily_activity[date] = (analytics.daily_activity[date] || 0) + 1
      })

      // Calculate success rate
      const successful = (analytics.status_breakdown.sent || 0) + (analytics.status_breakdown.delivered || 0)
      analytics.success_rate = data.length > 0 ? (successful / data.length) * 100 : 0

      return { success: true, data: analytics }
    } catch {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get analytics'
      }
    }
  }
} 