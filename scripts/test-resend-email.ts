/**
 * Test Resend Email Integration
 * 
 * Sends a test email via EnhancedEmailService
 */

import { EnhancedEmailService } from '../lib/services/enhanced-email-service'

async function testEmail() {
  try {
    console.log('Sending test email via Resend...')
    
    const result = await EnhancedEmailService.sendEmail({
      to: 'yasha.afghan@gmail.com',
      subject: 'Test Email from CS Support - Resend Integration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Test Email from CS Support</h1>
          <p>This is a test email to verify the Resend integration is working correctly.</p>
          <p>If you received this email, the integration is successful! ✅</p>
          <p><strong>Features tested:</strong></p>
          <ul>
            <li>✅ Resend API integration</li>
            <li>✅ Enhanced Email Service</li>
            <li>✅ Compliance footer (should appear below)</li>
            <li>✅ UTM tracking (check link parameters)</li>
          </ul>
          <p>You can <a href="https://intakely.xyz">visit our website</a> to learn more.</p>
        </div>
      `,
      text: `
Test Email from CS Support

This is a test email to verify the Resend integration is working correctly.

If you received this email, the integration is successful!

Features tested:
- Resend API integration
- Enhanced Email Service
- Compliance footer
- UTM tracking

Visit our website: https://intakely.xyz
      `,
      utmSource: 'cs-support',
      utmMedium: 'email',
      utmCampaign: 'test-integration',
      jurisdiction: 'US',
    })

    console.log('✅ Email sent successfully!')
    console.log('Email ID:', result.emailId)
    console.log('Message ID:', result.messageId)
    console.log('Status:', result.status)
    console.log('Unsubscribe Token:', result.unsubscribeToken)
    console.log('\n📧 Check your inbox at yasha.afghan@gmail.com')
    
  } catch (error: any) {
    console.error('❌ Error sending email:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the test
testEmail()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
