// Simple Node.js script to test Resend email delivery
const fs = require('fs')

const loadEnvVar = (key) => {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8')
    const lines = envContent.split('\n')
    const line = lines.find(l => l.startsWith(`${key}=`))
    return line ? line.split('=')[1] : null
  } catch (error) {
    return null
  }
}

const testResendEmail = async () => {
  const resendApiKey = loadEnvVar('RESEND_API_KEY')
  
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found in environment')
    return
  }

  // Get email from command line argument or use default
  const testEmail = process.argv[2] || 'danielshaba@example.com'  // Replace with your email

  console.log('🔧 Testing Resend integration...')
  console.log('📧 API Key configured:', resendApiKey.substring(0, 10) + '...')
  console.log('📬 Sending test email to:', testEmail)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'CareDraft <noreply@notifications.caredraft.co.uk>',
        to: [testEmail],
        subject: '🎉 CareDraft Resend Integration Test - SUCCESS!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E57373;">🎉 CareDraft Email Test Successful!</h2>
            <p>Congratulations! Your Resend integration is working correctly.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>✅ Integration Status:</h3>
              <ul>
                <li><strong>Provider:</strong> Resend API</li>
                <li><strong>API Key:</strong> ✅ Valid & Authenticated</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Status:</strong> 🟢 Fully Operational</li>
              </ul>
            </div>

            <h3>🚀 What's Ready:</h3>
            <ul>
              <li>📄 PDF document exports with email delivery</li>
              <li>📝 DOCX document exports with email delivery</li>
              <li>📧 Professional email templates</li>
              <li>🔗 Secure document sharing</li>
            </ul>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666;">
              This email was sent from CareDraft - Proposal Management System<br>
              Document Export & Email Delivery System Test
            </p>
          </div>
        `
      })
    })

    const result = await response.json()
    
    if (response.ok && result.id) {
      console.log('✅ EMAIL SENT SUCCESSFULLY!')
      console.log('📧 Message ID:', result.id)
      console.log('📨 Check your inbox:', testEmail)
      console.log('🎉 Resend integration is fully working!')
    } else {
      console.log('❌ Email sending failed')
      console.log('📄 Response:', result)
    }

  } catch (error) {
    console.error('💥 Error testing email:', error.message)
  }
}

console.log('📧 CareDraft Resend Email Integration Test')
console.log('Usage: node test-resend.js [your-email@domain.com]')
console.log('')

// Run the test
testResendEmail() 