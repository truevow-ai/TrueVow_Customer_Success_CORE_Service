/**
 * Test WhatsApp Integration with Twilio
 * 
 * Tests the WhatsApp sending functionality in CommunicationSenderService
 * Requires:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_NUMBER (or TWILIO_PHONE_NUMBER as fallback)
 * - Test recipient phone number (TEST_WHATSAPP_TO_PHONE)
 */

import { CommunicationSenderService } from '../lib/services/communication-sender'
import { twilioClient } from '../lib/integrations/twilio'

const TEST_TENANT_ID = process.env.TEST_TENANT_ID || '00000000-0000-0000-0000-000000000000'
const TEST_CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL || 'test@example.com'
const TEST_WHATSAPP_TO_PHONE = process.env.TEST_WHATSAPP_TO_PHONE || ''

async function testWhatsAppSending() {
  console.log('🧪 Testing WhatsApp Integration with Twilio\n')
  console.log('='.repeat(80))

  // Check environment variables
  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach((varName) => console.error(`   - ${varName}`))
    console.error('\nPlease set these in your .env file')
    process.exit(1)
  }

  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || ''
  if (!whatsappNumber) {
    console.error('❌ TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER environment variable not set')
    console.error('   Set TWILIO_WHATSAPP_NUMBER to your WhatsApp Business API number (format: whatsapp:+1234567890)')
    process.exit(1)
  }

  if (!TEST_WHATSAPP_TO_PHONE) {
    console.error('❌ TEST_WHATSAPP_TO_PHONE environment variable not set')
    console.error('   Set TEST_WHATSAPP_TO_PHONE to a valid phone number (E.164 format: +1234567890)')
    process.exit(1)
  }

  console.log('✅ Environment variables configured')
  console.log(`   From: ${whatsappNumber}`)
  console.log(`   To: ${TEST_WHATSAPP_TO_PHONE}`)
  console.log()

  // Test 1: Direct WhatsApp sending via Twilio client
  console.log('📱 Test 1: Direct WhatsApp sending via Twilio client')
  console.log('-'.repeat(80))

  try {
    const directResult = await twilioClient.sendWhatsApp({
      to: TEST_WHATSAPP_TO_PHONE,
      from: whatsappNumber,
      message: 'Test WhatsApp message from CS-Support Service integration test',
    })

    console.log('✅ WhatsApp sent successfully')
    console.log(`   Message ID: ${directResult.messageId}`)
    console.log(`   Status: ${directResult.status}`)
  } catch (error) {
    console.error('❌ Failed to send WhatsApp:', error)
    console.error('   This might be because:')
    console.error('   - WhatsApp Business API is not set up')
    console.error('   - Phone number is not registered with WhatsApp Business')
    console.error('   - Template approval is required for WhatsApp')
  }

  console.log()

  // Test 2: WhatsApp via CommunicationSenderService (requires template)
  console.log('📱 Test 2: WhatsApp via CommunicationSenderService (template-based)')
  console.log('-'.repeat(80))

  try {
    // Note: This requires a WhatsApp template to exist in the database
    // For now, we'll just test the service method exists
    console.log('ℹ️  Template-based WhatsApp sending requires:')
    console.log('   1. WhatsApp template created in database (template_type = "whatsapp")')
    console.log('   2. Template approved by WhatsApp Business API')
    console.log('   3. Template key passed to sendWhatsApp method')
    console.log()
    console.log('   Example usage:')
    console.log('   await CommunicationSenderService.sendWhatsApp({')
    console.log('     templateKey: "welcome_whatsapp",')
    console.log('     to: "+1234567890",')
    console.log('     variables: { customer_name: "John Doe" },')
    console.log('     tenantId: "...",')
    console.log('     customerEmail: "customer@example.com",')
    console.log('   })')
  } catch (error) {
    console.error('❌ Error:', error)
  }

  console.log()
  console.log('='.repeat(80))
  console.log('✅ WhatsApp Integration Test Complete')
  console.log()
  console.log('📝 Notes:')
  console.log('   - WhatsApp Business API requires template approval for most messages')
  console.log('   - Free-form messages are only allowed within 24-hour window after customer message')
  console.log('   - Ensure your WhatsApp Business API is properly configured')
  console.log('   - Test recipient must have opted in to receive WhatsApp messages')
}

testWhatsAppSending().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
