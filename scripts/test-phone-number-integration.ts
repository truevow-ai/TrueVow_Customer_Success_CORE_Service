/**
 * Test Phone Number Integration with Sales CRM Service
 * 
 * Tests the integration between CS-Support and Sales CRM phone number service
 */

import { salesServiceClient } from '../lib/integrations/sales-client'

async function testPhoneNumberIntegration() {
  console.log('🧪 Testing Phone Number Integration\n')

  // Test 1: Get individual phone number for direct call
  console.log('Test 1: Get individual phone number for direct call')
  try {
    const testUserId = 'user_test_123' // Replace with actual test user ID
    const result = await salesServiceClient.getPhoneNumber({
      user_id: testUserId,
      call_type: 'direct_call',
      service: 'cs_support',
    })
    console.log('✅ Success:', result)
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
    console.log('   (This is expected if Sales CRM service is not running or user does not exist)')
  }

  console.log('\n')

  // Test 2: Get pool number for parallel dialing
  console.log('Test 2: Get pool number for parallel dialing')
  try {
    const testUserId = 'user_test_123'
    const result = await salesServiceClient.getPhoneNumber({
      user_id: testUserId,
      call_type: 'parallel_dialing',
      service: 'cs_support',
      campaign_id: 'support_campaign',
    })
    console.log('✅ Success:', result)
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
    console.log('   (This is expected if Sales CRM service is not running or pool not configured)')
  }

  console.log('\n')

  // Test 3: Update phone number
  console.log('Test 3: Update phone number (will fail if user does not exist)')
  try {
    const testUserId = 'user_test_123'
    const result = await salesServiceClient.updatePhoneNumber(
      testUserId,
      '+1-234-567-8900',
      'PN1234567890',
      'twilio'
    )
    console.log('✅ Success:', result)
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
    console.log('   (This is expected if Sales CRM service is not running or user does not exist)')
  }

  console.log('\n')
  console.log('📝 Note: These tests require:')
  console.log('   1. Sales CRM service running on configured URL')
  console.log('   2. Valid API key in environment variables')
  console.log('   3. Test user ID that exists in Sales CRM service')
  console.log('   4. Phone number assignment system configured in Sales CRM')
}

// Run tests
testPhoneNumberIntegration().catch(console.error)
