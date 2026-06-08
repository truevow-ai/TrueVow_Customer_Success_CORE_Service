/**
 * Database Seed Script for CS-Support Service
 * Run with: npx tsx scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Helper to generate UUIDs
function uuid(index: number, prefix: string = ''): string {
  const padded = index.toString().padStart(12, '0')
  return `${prefix}${padded.slice(0, 4)}-${padded.slice(0, 4)}-${padded.slice(0, 4)}-${padded.slice(0, 4)}-${padded.slice(0, 12)}`
}

// Seed data generators
const generateTeamMembers = () => [
  {
    user_id: uuid(1, 'tm'),
    clerk_user_id: 'user_support_agent_1',
    role: 'support_agent',
    is_active: true,
    timezone: 'America/New_York',
    work_schedule: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
    skills: ['technical_support', 'billing', 'product_knowledge'],
    max_tickets: 10,
  },
  {
    user_id: uuid(2, 'tm'),
    clerk_user_id: 'user_support_agent_2',
    role: 'support_agent',
    is_active: true,
    timezone: 'America/Los_Angeles',
    work_schedule: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
    skills: ['technical_support', 'api_integration'],
    max_tickets: 10,
  },
  {
    user_id: uuid(3, 'tm'),
    clerk_user_id: 'user_csm_1',
    role: 'csm',
    is_active: true,
    timezone: 'America/Chicago',
    work_schedule: { start: '08:00', end: '16:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
    skills: ['account_management', 'onboarding'],
    max_tickets: 5,
  },
]

const generateTickets = () => {
  const statuses = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']
  const priorities = ['low', 'medium', 'high', 'urgent']
  const channels = ['email', 'chat', 'phone', 'form']
  const tickets = []

  // Generate 50 tickets with various statuses and dates
  for (let i = 1; i <= 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const channel = channels[Math.floor(Math.random() * channels.length)]
    
    tickets.push({
      ticket_id: uuid(i, 'tk'),
      tenant_id: uuid(Math.ceil(i / 10), 'tn'),
      customer_id: uuid(i, 'cu'),
      customer_email: `customer${i}@example.com`,
      customer_name: `Customer ${i}`,
      subject: `Support Request #${i}`,
      message: `This is a sample support ticket message for ticket #${i}`,
      channel,
      status,
      priority,
      stage: 'post-sale',
      source: 'customer',
      assigned_to: uuid((i % 3) + 1, 'tm'),
      created_by: uuid(i, 'cu'),
      created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      resolved_at: status === 'resolved' || status === 'closed' 
        ? new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000).toISOString()
        : null,
    })
  }

  return tickets
}

const generateConversations = () => {
  const conversations = []
  
  for (let i = 1; i <= 30; i++) {
    const daysAgo = Math.floor(Math.random() * 14)
    conversations.push({
      conversation_id: uuid(i, 'cv'),
      tenant_id: uuid(Math.ceil(i / 6), 'tn'),
      customer_id: uuid(i, 'cu'),
      channel: ['email', 'chat', 'whatsapp'][i % 3],
      status: ['active', 'resolved', 'pending'][i % 3],
      assigned_to: uuid((i % 3) + 1, 'tm'),
      created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { source: 'dashboard', priority: ['low', 'medium', 'high'][i % 3] },
    })
  }

  return conversations
}

const generateMessages = () => {
  const messages = []
  
  for (let i = 1; i <= 100; i++) {
    const hoursAgo = Math.floor(Math.random() * 48)
    const isFromCustomer = i % 2 === 0
    
    messages.push({
      message_id: uuid(i, 'mg'),
      conversation_id: uuid(Math.ceil(i / 4), 'cv'),
      ticket_id: uuid(Math.ceil(i / 3), 'tk'),
      from_type: isFromCustomer ? 'customer' : 'agent',
      sender_id: isFromCustomer ? uuid(Math.ceil(i / 3), 'cu') : uuid((i % 3) + 1, 'tm'),
      sender_type: isFromCustomer ? 'customer' : 'agent',
      body: `Message ${i}: ${isFromCustomer ? 'Customer inquiry' : 'Agent response'} about their issue`,
      is_internal: !isFromCustomer && i % 5 === 0,
      created_at: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
    })
  }

  return messages
}

const generateCallLogs = () => {
  const callLogs = []
  const outcomes = ['resolved', 'follow_up_needed', 'escalated', 'no_answer', 'voicemail']
  const callTypes = ['inbound', 'outbound', 'support', 'checkin', 'onboarding']
  
  for (let i = 1; i <= 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    callLogs.push({
      log_id: uuid(i, 'cl'),
      tenant_id: uuid(Math.ceil(i / 4), 'tn'),
      user_id: uuid((i % 3) + 1, 'tm'),
      customer_id: uuid(i, 'cu'),
      customer_email: `customer${i}@example.com`,
      phone_number: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      call_type: callTypes[i % callTypes.length],
      direction: i % 2 === 0 ? 'inbound' : 'outbound',
      duration_seconds: Math.floor(Math.random() * 3600) + 60,
      outcome: outcomes[i % outcomes.length],
      notes: `Call notes for call #${i}`,
      twilio_call_sid: `CA${uuid(i).replace(/-/g, '')}`,
      created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return callLogs
}

const generateHealthScores = () => {
  const scores = []
  const levels = ['healthy', 'at_risk', 'critical']
  
  for (let i = 1; i <= 10; i++) {
    const score = Math.floor(Math.random() * 100)
    let level: string
    if (score >= 70) level = 'healthy'
    else if (score >= 40) level = 'at_risk'
    else level = 'critical'

    scores.push({
      health_id: uuid(i, 'hs'),
      tenant_id: uuid(i, 'tn'),
      health_score: score,
      health_level: level,
      factors: {
        usage: Math.floor(Math.random() * 30),
        support_tickets: Math.floor(Math.random() * 25),
        nps: Math.floor(Math.random() * 25),
        payment: Math.floor(Math.random() * 15),
        engagement: Math.floor(Math.random() * 10),
      },
      previous_score: Math.floor(Math.random() * 100),
      trend: score > 50 ? 'improving' : 'declining',
      calculated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return scores
}

const generateSLAPolicies = () => [
  {
    name: 'Low Priority SLA',
    description: 'Standard SLA for low priority tickets',
    priority: 'low',
    first_response_time: '4 hours',
    resolution_time: '48 hours',
    is_active: true,
  },
  {
    name: 'Medium Priority SLA',
    description: 'Standard SLA for medium priority tickets',
    priority: 'medium',
    first_response_time: '2 hours',
    resolution_time: '24 hours',
    is_active: true,
  },
  {
    name: 'High Priority SLA',
    description: 'Standard SLA for high priority tickets',
    priority: 'high',
    first_response_time: '1 hour',
    resolution_time: '12 hours',
    is_active: true,
  },
  {
    name: 'Urgent Priority SLA',
    description: 'Standard SLA for urgent priority tickets',
    priority: 'urgent',
    first_response_time: '30 minutes',
    resolution_time: '4 hours',
    is_active: true,
  },
]

// Main seed function
async function seed() {
  console.log('🌱 Starting database seed...')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)

  try {
    // Seed team members
    console.log('👥 Seeding team members...')
    const teamMembers = generateTeamMembers()
    const { error: teamError } = await supabase.from('cs_team_members').upsert(teamMembers, { onConflict: 'user_id' })
    if (teamError) console.error('Team members error:', teamError)
    else console.log(`✅ Inserted ${teamMembers.length} team members`)

    // Seed SLA policies
    console.log('📋 Seeding SLA policies...')
    const slaPolicies = generateSLAPolicies()
    const { error: slaError } = await supabase.from('cs_sla_policies').upsert(slaPolicies, { onConflict: 'name' })
    if (slaError) console.error('SLA policies error:', slaError)
    else console.log(`✅ Inserted ${slaPolicies.length} SLA policies`)

    // Seed tickets
    console.log('🎫 Seeding tickets...')
    const tickets = generateTickets()
    const { error: ticketsError } = await supabase.from('cs_tickets').upsert(tickets, { onConflict: 'ticket_id' })
    if (ticketsError) console.error('Tickets error:', ticketsError)
    else console.log(`✅ Inserted ${tickets.length} tickets`)

    // Seed conversations
    console.log('💬 Seeding conversations...')
    const conversations = generateConversations()
    const { error: convError } = await supabase.from('cs_conversations').upsert(conversations, { onConflict: 'conversation_id' })
    if (convError) console.error('Conversations error:', convError)
    else console.log(`✅ Inserted ${conversations.length} conversations`)

    // Seed messages
    console.log('📝 Seeding messages...')
    const messages = generateMessages()
    const { error: msgError } = await supabase.from('cs_messages').upsert(messages, { onConflict: 'message_id' })
    if (msgError) console.error('Messages error:', msgError)
    else console.log(`✅ Inserted ${messages.length} messages`)

    // Seed call logs
    console.log('📞 Seeding call logs...')
    const callLogs = generateCallLogs()
    const { error: callError } = await supabase.from('cs_call_logs').upsert(callLogs, { onConflict: 'log_id' })
    if (callError) console.error('Call logs error:', callError)
    else console.log(`✅ Inserted ${callLogs.length} call logs`)

    // Seed health scores
    console.log('❤️ Seeding health scores...')
    const healthScores = generateHealthScores()
    const { error: healthError } = await supabase.from('cs_customer_health_scores').upsert(healthScores, { onConflict: 'health_id' })
    if (healthError) console.error('Health scores error:', healthError)
    else console.log(`✅ Inserted ${healthScores.length} health scores`)

    console.log('\n🎉 Database seed completed!')
    console.log('\n📊 Summary:')
    console.log(`  - ${teamMembers.length} team members`)
    console.log(`  - ${slaPolicies.length} SLA policies`)
    console.log(`  - ${tickets.length} tickets`)
    console.log(`  - ${conversations.length} conversations`)
    console.log(`  - ${messages.length} messages`)
    console.log(`  - ${callLogs.length} call logs`)
    console.log(`  - ${healthScores.length} health scores`)

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

// Run seed
seed()
