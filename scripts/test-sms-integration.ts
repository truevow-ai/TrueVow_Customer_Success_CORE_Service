/**
 * Test SMS Integration with Twilio
 * 
 * Tests the SMS sending functionality in CommunicationSenderService
 * Requires:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 * - Test recipient phone number (TEST_SMS_TO_PHONE)
 */

import { CommunicationSenderService } from '../lib/services/communication-sender'

const TEST_TENANT_ID = process.env.TEST_TENANT_ID || '00000000-0000-0000-0000-000000000000'
const TEST_CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL || 'test@example.com'
const TEST_SMS_TO_PHONE = process.env.TEST_SMS_TO_PHONE || ''

async function testSMSSending() {
  console.log('🧪 Testing SMS Integration with Twilio\n')
  console.log('=' .repeat(80))

  // Check environment variables
  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach((varName) => console.error(`   - ${varName}`))
    console.error('\nPlease set these in your .env file')
    process.exit(1)
  }

  if (!TEST_SMS_TO_PHONE) {
    console.error('❌ TEST_SMS_TO_PHONE environment variable not set')
    console.error('   Set TEST_SMS_TO_PHONE to a valid phone number (E.164 format: +1234567890)')
    process.exit(1)
  }

  console.log('✅ Environment variables configured')
  console.log(`   From: ${process.env.TWILIO_PHONE_NUMBER}`)
  console.log(`   To: ${TEST_SMS_TO_PHONE}`)
  console.log()

  // Test 1: Send SMS with a simple template
  console.log('📱 Test 1: Send SMS with template')
  console.log('-'.repeat(80))

  try {
    const result = await CommunicationSenderService.sendSMS({
      templateKey: 'welcome_sms',
      to: TEST_SMS_TO_PHONE,
      variables: {
        customer_name: 'Test Customer',
        csm_name: 'Test CSM',
      },
      tenantId: TEST_TENANT_ID,
      customerEmail: TEST_CUSTOMER_EMAIL,
      metadata: {
        test: true,
        test_run: new Date().toISOString(),
      },
    })

    if (result.status === 'sent') {
      console.log('✅ SMS sent successfully!')
      console.log(`   Communication ID: ${result.communicationId}`)
      console.log(`   Message ID: ${result.messageId}`)
    } else if (result.status === 'pending') {
      console.log('⏳ SMS marked as pending')
      console.log(`   Communication ID: ${result.communicationId}`)
    } else {
      console.error('❌ SMS sending failed')
      console.error(`   Error: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Error sending SMS:')
    console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log()

  // Test 2: Send SMS with custom message (if template doesn't exist, test direct sending)
  console.log('📱 Test 2: Verify SMS template exists')
  console.log('-'.repeat(80))

  try {
    const { CommunicationTemplatesService } = await import('../lib/services/communication-templates')
    const template = await CommunicationTemplatesService.getTemplateByKey('welcome_sms', TEST_TENANT_ID)

    if (template) {
      console.log('✅ SMS template found:')
      console.log(`   Key: ${template.template_key}`)
      console.log(`   Name: ${template.template_name}`)
      console.log(`   Type: ${template.template_type}`)
      console.log(`   Body length: ${template.body.length} characters`)
    } else {
      console.log('⚠️  SMS template "welcome_sms" not found')
      console.log('   This is expected if templates haven\'t been seeded yet')
      console.log('   Run: database/seed_communication_templates.sql')
    }
  } catch (error) {
    console.error('❌ Error checking template:')
    console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log()

  // Test 3: Check Twilio client directly
  console.log('📱 Test 3: Test Twilio client directly')
  console.log('-'.repeat(80))

  try {
    const { twilioClient } = await import('../lib/integrations/twilio')
    
    const testMessage = `Test SMS from CS-Support Service - ${new Date().toISOString()}`
    const smsResult = await twilioClient.sendSMS({
      to: TEST_SMS_TO_PHONE,
      from: process.env.TWILIO_PHONE_NUMBER!,
      message: testMessage,
    })

    console.log('✅ Direct Twilio SMS sent successfully!')
    console.log(`   Message ID: ${smsResult.messageId}`)
    console.log(`   Status: ${smsResult.status}`)
  } catch (error) {
    console.error('❌ Error sending direct SMS:')
    console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.error('   Check your Twilio credentials and phone number format')
  }

  console.log()
  console.log('=' .repeat(80))
  console.log('✅ SMS Integration Test Complete')
  console.log()
  console.log('📝 Notes:')
  console.log('   - Verify SMS was received on the test phone number')
  console.log('   - Check Twilio console for delivery status')
  console.log('   - Check database for communication record')
}

// Run tests
testSMSSending().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
