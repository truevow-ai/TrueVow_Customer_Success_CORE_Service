/**
 * API Route: Test Resend Email
 * POST /api/v1/test/resend-email
 * 
 * Sends a test email via EnhancedEmailService
 */

import { NextRequest, NextResponse } from 'next/server'
import { EnhancedEmailService } from '@/lib/services/enhanced-email-service'

export async function POST(request: NextRequest) {
  try {
    // Simple test endpoint - no auth required for testing
    // In production, add proper authentication

    const body = await request.json()
    const toEmail = body.to || 'yasha.afghan@gmail.com'

    console.log('Sending test email to:', toEmail)

    const result = await EnhancedEmailService.sendEmail({
      to: toEmail,
      subject: 'Test Email from CS Support - Resend Integration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            Test Email from CS Support
          </h1>
          <p style="color: #666; line-height: 1.6;">
            This is a test email to verify the Resend integration is working correctly.
          </p>
          <p style="color: #666; line-height: 1.6;">
            If you received this email, the integration is successful! ✅
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">Features tested:</p>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li>✅ Resend API integration</li>
              <li>✅ Enhanced Email Service</li>
              <li>✅ Compliance footer (should appear below)</li>
              <li>✅ UTM tracking (check link parameters)</li>
              <li>✅ Rate limiting</li>
              <li>✅ Unsubscribe token generation</li>
            </ul>
          </div>
          <p style="color: #666; line-height: 1.6;">
            You can <a href="https://intakely.xyz" style="color: #0066cc; text-decoration: none;">visit our website</a> to learn more.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This is an automated test email. Please ignore if you were not expecting it.
          </p>
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
- Rate limiting
- Unsubscribe token generation

Visit our website: https://intakely.xyz

This is an automated test email. Please ignore if you were not expecting it.
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result.id,
      providerId: result.providerId,
      to: toEmail,
    })
  } catch (error: any) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send test email',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}



