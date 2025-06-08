import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject = 'CareDraft Test Email' } = body

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Email recipient required' },
        { status: 400 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      return NextResponse.json(
        { success: false, error: 'Resend API key not configured' },
        { status: 500 }
      )
    }

    // Test email payload for Resend API
    const emailPayload = {
      from: 'CareDraft <noreply@caredraft.com>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E57373;">🎉 CareDraft Email Test Successful!</h2>
          <p>This is a test email from your CareDraft application to verify that the Resend integration is working correctly.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Test Details:</h3>
            <ul>
              <li><strong>Provider:</strong> Resend API</li>
              <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>API Integration:</strong> ✅ Working</li>
              <li><strong>Email Service:</strong> ✅ Operational</li>
            </ul>
          </div>

          <p>Your document export system is now ready to send:</p>
          <ul>
            <li>📄 PDF documents</li>
            <li>📝 DOCX documents</li>
            <li>📧 Professional email notifications</li>
            <li>🔗 Secure download links</li>
          </ul>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            This email was sent from CareDraft - Proposal Management System
          </p>
        </div>
      `
    }

    console.log('Testing email delivery with Resend API...')
    
    // Send via Resend API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    const result = await response.json()
    console.log('Resend API response:', result)

    const success = response.ok && result.id

    return NextResponse.json({
      success: success,
      data: {
        messageId: result.id,
        provider: 'Resend',
        status: success ? 'sent' : 'failed',
        recipientCount: 1,
        apiResponse: result
      },
      error: success ? undefined : result.message || 'Failed to send email',
      message: success 
        ? 'Test email sent successfully! Check your inbox.' 
        : `Email delivery failed: ${result.message || 'Unknown error'}`
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to send test email'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'CareDraft Email Test Endpoint',
    instructions: 'Send POST request with { "to": "your-email@example.com" } to test email delivery',
    methods: ['POST'],
    requiredFields: ['to'],
    optionalFields: ['subject']
  })
} 