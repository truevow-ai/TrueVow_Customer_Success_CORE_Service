/**
 * Test Script for Unified Dialer Service
 * Tests outbound call functionality and call logging
 * 
 * Usage: npx tsx scripts/test-dialer.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

// Environment setup - use correct env var names from .env.local
const SUPABASE_URL = process.env.CUSTOMER_SUCCESS_CORE_PROJECT_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL || 
                      'https://inbwimykrvmxhlmwxamk.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.CUSTOMER_SUCCESS_CORE_DATABASE_SERVICE_ROLE_KEY || 
                              process.env.SUPABASE_SERVICE_ROLE_KEY || 
                              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYndpbXlrcnZteGhsbXd4YW1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5MzY1MSwiZXhwIjoyMDgxMDY5NjUxfQ.EEncizYr07qEr_WShCjsrRkGbGqMsUAvgrpzoigC8YE'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  duration: number
  message?: string
  error?: string
}

const results: TestResult[] = []

async function runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
  const start = Date.now()
  try {
    await testFn()
    return { name, status: 'PASS', duration: Date.now() - start }
  } catch (error) {
    return { 
      name, 
      status: 'FAIL', 
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Test 1: Check dialer_permissions table exists
async function testDialerPermissionsTable() {
  const { error } = await supabase
    .from('dialer_permissions')
    .select('user_id')
    .limit(1)
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Table check failed: ${error.message}`)
  }
}

// Test 2: Check phone_number_pools table exists
async function testPhoneNumberPoolsTable() {
  const { error } = await supabase
    .from('phone_number_pools')
    .select('id')
    .limit(1)
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Table check failed: ${error.message}`)
  }
}

// Test 3: Check cs_call_logs table exists
async function testCallLogsTable() {
  const { error } = await supabase
    .from('cs_call_logs')
    .select('log_id')
    .limit(1)
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Table check failed: ${error.message}`)
  }
}

// Test 4: Create a test call log entry
async function testCreateCallLog() {
  const testCallLog = {
    from_number: '+14155551234',
    to_number: '+14155556789',
    direction: 'outbound' as const,
    status: 'initiated' as const,
    call_id: `test_${Date.now()}`,
    metadata: {
      test: true,
      caller_id: 'test-user'
    }
  }

  const { data, error } = await supabase
    .from('cs_call_logs')
    .insert(testCallLog)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create call log: ${error.message}`)
  }

  // Clean up - delete the test record
  await supabase
    .from('cs_call_logs')
    .delete()
    .eq('log_id', data.log_id)

  console.log(`  ✓ Created and deleted test call log: ${data.log_id}`)
}

// Test 5: Update call log status
async function testUpdateCallLog() {
  // First create a test log
  const { data: created, error: createError } = await supabase
    .from('cs_call_logs')
    .insert({
      from_number: '+14155551234',
      to_number: '+14155556789',
      direction: 'outbound',
      status: 'initiated',
      call_id: `test_update_${Date.now()}`,
      metadata: { test: true }
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to create test log: ${createError.message}`)
  }

  // Update the status
  const { error: updateError } = await supabase
    .from('cs_call_logs')
    .update({
      status: 'completed',
      duration_seconds: 120,
      ended_at: new Date().toISOString()
    })
    .eq('log_id', created.log_id)

  if (updateError) {
    // Clean up
    await supabase.from('cs_call_logs').delete().eq('log_id', created.log_id)
    throw new Error(`Failed to update call log: ${updateError.message}`)
  }

  // Verify update
  const { data: updated, error: fetchError } = await supabase
    .from('cs_call_logs')
    .select('*')
    .eq('log_id', created.log_id)
    .single()

  if (fetchError || !updated) {
    throw new Error(`Failed to verify update`)
  }

  // Clean up
  await supabase.from('cs_call_logs').delete().eq('log_id', created.log_id)

  if (updated.status !== 'completed' || updated.duration_seconds !== 120) {
    throw new Error(`Update verification failed: status=${updated.status}, duration=${updated.duration_seconds}`)
  }

  console.log(`  ✓ Updated call log status to completed with 120s duration`)
}

// Test 6: Query call logs with filters
async function testQueryCallLogs() {
  // Create multiple test logs
  const testLogs = [
    { from_number: '+11111111111', to_number: '+22222222222', direction: 'inbound', status: 'completed', call_id: `test_q1_${Date.now()}` },
    { from_number: '+33333333333', to_number: '+44444444444', direction: 'outbound', status: 'completed', call_id: `test_q2_${Date.now()}` },
    { from_number: '+11111111111', to_number: '+55555555555', direction: 'inbound', status: 'failed', call_id: `test_q3_${Date.now()}` },
  ]

  for (const log of testLogs) {
    await supabase.from('cs_call_logs').insert({ ...log, metadata: { test: true } })
  }

  // Query inbound calls
  const { data: inbound, error: inboundError } = await supabase
    .from('cs_call_logs')
    .select('*')
    .eq('direction', 'inbound')
    .like('call_id', 'test_q%')

  if (inboundError) {
    throw new Error(`Query failed: ${inboundError.message}`)
  }

  // Clean up
  await supabase.from('cs_call_logs').delete().like('call_id', 'test_q%')

  if (!inbound || inbound.length < 2) {
    throw new Error(`Expected at least 2 inbound calls, got ${inbound?.length || 0}`)
  }

  console.log(`  ✓ Queried ${inbound.length} inbound calls`)
}

// Test 7: Test phone pool reservation (if table exists)
async function testPhonePoolReservation() {
  // Check if table has any records
  const { data: pools, error: poolError } = await supabase
    .from('phone_number_pools')
    .select('*')
    .limit(1)

  if (poolError || !pools || pools.length === 0) {
    console.log(`  ⊘ Phone pool table empty or not accessible - skipping`)
    return // Skip test
  }

  // Try to reserve a number
  const pool = pools[0]
  
  const { error: updateError } = await supabase
    .from('phone_number_pools')
    .update({
      status: 'reserved',
      reserved_by: 'test-user',
      reserved_until: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    })
    .eq('id', pool.id)

  if (updateError) {
    throw new Error(`Failed to reserve pool number: ${updateError.message}`)
  }

  // Release the number
  await supabase
    .from('phone_number_pools')
    .update({
      status: 'available',
      reserved_by: null,
      reserved_until: null
    })
    .eq('id', pool.id)

  console.log(`  ✓ Reserved and released pool number: ${pool.phone_number}`)
}

// Test 8: Get call statistics
async function testCallStatistics() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('cs_call_logs')
    .select('direction, status, duration_seconds')
    .gte('started_at', thirtyDaysAgo.toISOString())
    .lte('started_at', now.toISOString())

  if (error) {
    throw new Error(`Failed to get call statistics: ${error.message}`)
  }

  const calls = data || []
  const stats = {
    total: calls.length,
    inbound: calls.filter(c => c.direction === 'inbound').length,
    outbound: calls.filter(c => c.direction === 'outbound').length,
    completed: calls.filter(c => c.status === 'completed').length,
    failed: calls.filter(c => c.status === 'failed').length,
  }

  console.log(`  ✓ Call stats: ${stats.total} total, ${stats.inbound} inbound, ${stats.outbound} outbound, ${stats.completed} completed, ${stats.failed} failed`)
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 Unified Dialer Service Tests')
  console.log('=' .repeat(50))
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log('=' .repeat(50) + '\n')

  const tests = [
    { name: 'Dialer Permissions Table', fn: testDialerPermissionsTable },
    { name: 'Phone Number Pools Table', fn: testPhoneNumberPoolsTable },
    { name: 'Call Logs Table', fn: testCallLogsTable },
    { name: 'Create Call Log', fn: testCreateCallLog },
    { name: 'Update Call Log', fn: testUpdateCallLog },
    { name: 'Query Call Logs', fn: testQueryCallLogs },
    { name: 'Phone Pool Reservation', fn: testPhonePoolReservation },
    { name: 'Call Statistics', fn: testCallStatistics },
  ]

  for (const test of tests) {
    console.log(`\n📋 Running: ${test.name}`)
    const result = await runTest(test.name, test.fn)
    results.push(result)
    
    if (result.status === 'PASS') {
      console.log(`   ✅ PASS (${result.duration}ms)`)
    } else if (result.status === 'SKIP') {
      console.log(`   ⊘ SKIP: ${result.message}`)
    } else {
      console.log(`   ❌ FAIL: ${result.error}`)
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(50))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(50))
  
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length
  
  console.log(`Total:  ${results.length}`)
  console.log(`Passed: ${passed} ✅`)
  console.log(`Failed: ${failed} ❌`)
  console.log(`Skipped: ${skipped} ⊘`)
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed!')
    process.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

// Run tests
runAllTests().catch(err => {
  console.error('Test runner error:', err)
  process.exit(1)
})
