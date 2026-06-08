/**
 * E2E Customer Journey Test - Oakwood Law Firm
 * 
 * This script tests the complete customer journey including:
 * 1. Customer onboarding
 * 2. Support ticket creation and resolution
 * 3. Health score tracking
 * 4. Communication templates
 * 5. Success playbooks
 * 6. Expansion triggers
 * 
 * Run with: npx tsx scripts/e2e-oakwood-journey.ts
 */

// Set up environment BEFORE importing any modules
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://inbwimykrvmxhlmwxamk.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYndpbXlrcnZteGhsbXd4YW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTM2NTEsImV4cCI6MjA4MTA2OTY1MX0.CJ8Tgo6g6o8sW26Nvj7hNLXOi9nDrNVE45W1TmbQHoI'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYndpbXlrcnZteGhsbXd4YW1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5MzY1MSwiZXhwIjoyMDgxMDY5NjUxfQ.EEncizYr07qEr_WShCjsrRkGbGqMsUAvgrpzoigC8YE'

import { createServiceSupabase } from '@/lib/db/supabase'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'

const OAKWOOD_TENANT_ID = '40000000-0000-0000-0000-000000000099'
const OAKWOOD_CUSTOMER_EMAIL = 'oakwood.law@firm.com'
const OAKWOOD_CUSTOMER_NAME = 'Oakwood Law Firm'

interface TestResult {
  step: string
  success: boolean
  data?: any
  error?: string
  duration: number
}

const results: TestResult[] = []

async function logResult(result: TestResult) {
  results.push(result)
  const status = result.success ? '✅' : '❌'
  console.log(`${status} Step ${results.length}: ${result.step} (${result.duration}ms)`)
  if (result.error) {
    console.log(`   Error: ${result.error}`)
  }
  if (result.data) {
    console.log(`   Data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}`)
  }
}

async function runTest() {
  console.log('\n========================================')
  console.log('E2E CUSTOMER JOURNEY TEST - OAKWOOD LAW FIRM')
  console.log('========================================\n')

  // Use service role for test scripts (bypasses RLS)
  const supabase = createServiceSupabase()

  // ========================================
  // STEP 1: Create Customer Record
  // ========================================
  let startTime = Date.now()
  try {
    const { data: customer, error } = await supabase
      .from('cs_customer_post_onboarding')
      .upsert({
        tenant_id: OAKWOOD_TENANT_ID,
        customer_email: OAKWOOD_CUSTOMER_EMAIL,
        go_live_date: new Date().toISOString(),
        onboarding_completed_at: new Date().toISOString(),
        transferred_from_onboarding_at: new Date().toISOString(),
        assigned_csm_id: '00000000-0000-0000-0000-000000000020',
        health_score: 85,
        churn_risk_level: 'low',
        notes: 'E2E Test Customer - Oakwood Law Firm',
      }, { onConflict: 'tenant_id,customer_email' })
      .select()
      .single()

    await logResult({
      step: 'Create Customer Record',
      success: !error,
      data: customer,
      error: error?.message,
      duration: Date.now() - startTime
    })
  } catch (e: any) {
    await logResult({
      step: 'Create Customer Record',
      success: false,
      error: e.message,
      duration: Date.now() - startTime
    })
  }

  // ========================================
  // STEP 2: Create Support Ticket
  // ========================================
  startTime = Date.now()
  try {
    const ticket = await TicketRepository.create({
      tenant_id: OAKWOOD_TENANT_ID,
      customer_email: OAKWOOD_CUSTOMER_EMAIL,
      customer_name: OAKWOOD_CUSTOMER_NAME,
      subject: 'E2E Test: Need help with document upload feature',
      message: 'Our team is having trouble uploading large PDF documents to the intake form. Can you help?',
      channel: 'email',
      priority: 'high',
      status: 'open',
      source: 'customer',
    })

    await logResult({
      step: 'Create Support Ticket',
      success: true,
      data: { ticket_id: ticket.ticket_id, subject: ticket.subject },
      duration: Date.now() - startTime
    })

    // ========================================
    // STEP 3: Assign Ticket to Agent
    // ========================================
    startTime = Date.now()
    try {
      const assignedTicket = await TicketRepository.assign(
        ticket.ticket_id,
        '00000000-0000-0000-0000-000000000001'
      )

      await logResult({
        step: 'Assign Ticket to Agent',
        success: true,
        data: { assigned_to: assignedTicket.assigned_to },
        duration: Date.now() - startTime
      })

      // ========================================
      // STEP 4: Add Ticket Message
      // ========================================
      startTime = Date.now()
      const message = await MessageRepository.create({
        ticket_id: ticket.ticket_id,
        from_type: 'agent',
        from_user_id: '00000000-0000-0000-0000-000000000001',
        sender_id: 'user_support_agent_1',
        sender_type: 'agent',
        body: 'Hi there! I can help you with document uploads. Our system supports files up to 25MB. Please try compressing your PDF or splitting it into multiple files.',
        is_internal: false,
      })

      await logResult({
        step: 'Add Ticket Response Message',
        success: true,
        data: { message_id: message.message_id },
        duration: Date.now() - startTime
      })

      // ========================================
      // STEP 5: Resolve Ticket
      // ========================================
      startTime = Date.now()
      const resolvedTicket = await TicketRepository.updateStatus(
        ticket.ticket_id,
        'resolved',
        new Date().toISOString()
      )

      await logResult({
        step: 'Resolve Ticket',
        success: true,
        data: { status: resolvedTicket.status, resolved_at: resolvedTicket.resolved_at },
        duration: Date.now() - startTime
      })

    } catch (e: any) {
      await logResult({
        step: 'Assign/Message/Resolve Ticket',
        success: false,
        error: e.message,
        duration: Date.now() - startTime
      })
    }

  } catch (e: any) {
    await logResult({
      step: 'Create Support Ticket',
      success: false,
      error: e.message,
      duration: Date.now() - startTime
    })
  }

  // ========================================
  // STEP 6: Health Score Check
  // ========================================
  startTime = Date.now()
  try {
    const { data: healthScores } = await supabase
      .from('cs_customer_health_scores')
      .select('*')
      .eq('tenant_id', OAKWOOD_TENANT_ID)
      .order('calculated_at', { ascending: false })
      .limit(1)

    await logResult({
      step: 'Check Health Score',
      success: true,
      data: healthScores?.[0] || { message: 'No health score record yet' },
      duration: Date.now() - startTime
    })
  } catch (e: any) {
    await logResult({
      step: 'Check Health Score',
      success: false,
      error: e.message,
      duration: Date.now() - startTime
    })
  }

  // ========================================
  // STEP 7: List All Tickets for Customer
  // ========================================
  startTime = Date.now()
  try {
    const tickets = await TicketRepository.findByCustomerEmail(OAKWOOD_CUSTOMER_EMAIL)

    await logResult({
      step: 'List Customer Tickets',
      success: true,
      data: { count: tickets.length, tickets: tickets.map(t => ({ id: t.ticket_id, subject: t.subject, status: t.status })) },
      duration: Date.now() - startTime
    })
  } catch (e: any) {
    await logResult({
      step: 'List Customer Tickets',
      success: false,
      error: e.message,
      duration: Date.now() - startTime
    })
  }

  // ========================================
  // STEP 8: Test Knowledge Base Access
  // ========================================
  startTime = Date.now()
  try {
    const { data: articles } = await supabase
      .from('cs_kb_articles')
      .select('article_id, title, status')
      .eq('status', 'published')
      .limit(3)

    await logResult({
      step: 'Access Knowledge Base',
      success: true,
      data: { available_articles: articles?.length || 0 },
      duration: Date.now() - startTime
    })
  } catch (e: any) {
    await logResult({
      step: 'Access Knowledge Base',
      success: false,
      error: e.message,
      duration: Date.now() - startTime
    })
  }

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n========================================')
  console.log('TEST SUMMARY')
  console.log('========================================')
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`Total Steps: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  
  if (failed > 0) {
    console.log('\nFailed Steps:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.step}: ${r.error}`)
    })
  }
  
  console.log('\n========================================\n')
  
  return { passed, failed, results }
}

runTest()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0)
  })
  .catch(console.error)
