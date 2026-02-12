// @ts-nocheck
/**
 * Test Utilities and Helpers
 * Common functions for testing
 */

const { createServerSupabase } = require('@/lib/db/supabase')

/**
 * Create a test ticket
 */
async function createTestTicket(data) {
  const supabase = createServerSupabase()
  const { data: ticket, error } = await supabase
    .from('cs_tickets')
    .insert({
      tenant_id: 'test-tenant-id',
      customer_email: 'test@example.com',
      subject: 'Test Ticket',
      message: 'Test message',
      channel: 'email',
      status: 'open',
      priority: 'medium',
      ...data,
    })
    .select()
    .single()

  if (error) throw error
  return ticket
}

/**
 * Create a test team member
 */
async function createTestTeamMember(data) {
  const supabase = createServerSupabase()
  const { data: member, error } = await supabase
    .from('cs_team_members')
    .insert({
      user_id: 'test-user-id',
      clerk_user_id: 'test-clerk-id',
      role: 'support_agent',
      is_active: true,
      ...data,
    })
    .select()
    .single()

  if (error) throw error
  return member
}

/**
 * Clean up test data
 */
async function cleanupTestData(tenantId = 'test-tenant-id') {
  const supabase = createServerSupabase()

  // Delete in reverse order of dependencies
  await supabase.from('cs_tickets').delete().eq('tenant_id', tenantId)
  await supabase.from('cs_team_members').delete().eq('user_id', 'test-user-id')
}

/**
 * Mock Supabase client
 */
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
}

/**
 * Mock auth
 */
const mockAuth = {
  userId: 'test-user-123',
  sessionId: 'test-session-123',
  orgId: 'test-org-123',
}

describe('test-helpers', () => {
  it('exports mockSupabaseClient with from', () => {
    expect(mockSupabaseClient.from).toBeDefined()
  })
})

module.exports = {
  createTestTicket,
  createTestTeamMember,
  cleanupTestData,
  mockSupabaseClient,
  mockAuth,
}
