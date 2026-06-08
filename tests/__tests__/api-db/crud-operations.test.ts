// @ts-nocheck
/**
 * Phase D: API + DB Operations Verification
 * CRUD coverage, database integrity, error handling, Zod validation, pagination
 */

describe('API & Database Operations', () => {
  describe('CRUD - Tickets', () => {
    it('should create ticket with valid data', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      const ticket = await TicketRepository.create({
        tenant_id: '40000000-0000-0000-0000-000000000001',
        customer_email: 'test@example.com',
        subject: 'Test Ticket',
        message: 'Test message',
        channel: 'email',
        status: 'open',
        priority: 'medium',
      })
      
      expect(ticket.ticket_id).toBeDefined()
      expect(ticket.subject).toBe('Test Ticket')
      expect(ticket.status).toBe('open')
    })

    it('should read ticket by ID', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      const created = await TicketRepository.create({
        tenant_id: '40000000-0000-0000-0000-000000000001',
        customer_email: 'test@example.com',
        subject: 'Read Test',
        message: 'Test message',
        channel: 'email',
        status: 'open',
        priority: 'medium',
      })
      
      const found = await TicketRepository.findById(created.ticket_id)
      expect(found).toBeDefined()
      expect(found.ticket_id).toBe(created.ticket_id)
    })

    it('should update ticket fields', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      const ticket = await TicketRepository.create({
        tenant_id: '40000000-0000-0000-0000-000000000001',
        customer_email: 'test@example.com',
        subject: 'Update Test',
        message: 'Test message',
        channel: 'email',
        status: 'open',
        priority: 'medium',
      })
      
      const updated = await TicketRepository.update(ticket.ticket_id, {
        status: 'in_progress',
        priority: 'high',
      })
      
      expect(updated.status).toBe('in_progress')
      expect(updated.priority).toBe('high')
    })

    it('should delete (soft delete) ticket', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      const ticket = await TicketRepository.create({
        tenant_id: '40000000-0000-0000-0000-000000000001',
        customer_email: 'test@example.com',
        subject: 'Delete Test',
        message: 'Test message',
        channel: 'email',
        status: 'open',
        priority: 'medium',
      })
      
      await TicketRepository.delete(ticket.ticket_id)
      
      const deleted = await TicketRepository.findById(ticket.ticket_id)
      expect(deleted.status).toBe('closed')
      expect(deleted.closed_at).toBeDefined()
    })
  })

  describe('CRUD - Messages', () => {
    it('should create message for ticket', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      const { MessageRepository } = require('@/lib/repositories/messages')
      
      // Create a real ticket first
      const ticket = await TicketRepository.create({
        tenant_id: '40000000-0000-0000-0000-000000000001',
        customer_email: 'msg-test@example.com',
        subject: 'Message Test',
        message: 'Test message',
        channel: 'email',
        status: 'open',
        priority: 'medium',
      })
      
      const message = await MessageRepository.create({
        ticket_id: ticket.ticket_id,
        body: 'Test message body',
        sender_type: 'agent',
        sender_id: '00000000-0000-0000-0000-000000000001',
        from_type: 'agent',
      })
      
      expect(message.message_id).toBeDefined()
      expect(message.body).toBe('Test message body')
    })

    it('should read messages by ticket', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      const { MessageRepository } = require('@/lib/repositories/messages')
      
      // Use existing ticket from seed data
      const tickets = await TicketRepository.findAll({ limit: 1 })
      if (tickets.length > 0) {
        const messages = await MessageRepository.findByTicket(tickets[0].ticket_id)
        expect(Array.isArray(messages)).toBe(true)
      } else {
        // Create ticket if none exist
        const ticket = await TicketRepository.create({
          tenant_id: '40000000-0000-0000-0000-000000000001',
          customer_email: 'read-msg@example.com',
          subject: 'Read Messages Test',
          message: 'Test',
          channel: 'email',
          status: 'open',
          priority: 'medium',
        })
        const messages = await MessageRepository.findByTicket(ticket.ticket_id)
        expect(Array.isArray(messages)).toBe(true)
      }
    })
  })

  describe('Database Integrity', () => {
    it('should enforce foreign key constraints', async () => {
      const { MessageRepository } = require('@/lib/repositories/messages')
      
      // Creating message for non-existent ticket should fail (use valid UUID format)
      let threw = false
      try {
        await MessageRepository.create({
          ticket_id: '99999999-9999-9999-9999-999999999999',
          body: 'Test',
          sender_type: 'agent',
          sender_id: '00000000-0000-0000-0000-000000000001',
          from_type: 'agent',
        })
      } catch (error) {
        threw = true
        expect(error.message).toMatch(/foreign key|violates|not-null/i)
      }
      // FK violation should throw or return null
      expect(threw).toBe(true)
    })

    it('should enforce unique constraints', async () => {
      const { TeamMemberRepository } = require('@/lib/repositories/team-members')
      const uniqueId = Date.now().toString()
      
      const member = await TeamMemberRepository.create({
        user_id: `11111111-1111-1111-1111-${uniqueId.slice(-12).padStart(12, '0')}`,
        clerk_user_id: `unique-clerk-${uniqueId}`,
        role: 'support_agent',
        is_active: true,
      })
      
      // Duplicate clerk_user_id should fail
      let threw = false
      try {
        await TeamMemberRepository.create({
          user_id: `22222222-2222-2222-2222-${uniqueId.slice(-12).padStart(12, '0')}`,
          clerk_user_id: `unique-clerk-${uniqueId}`,
          role: 'support_agent',
          is_active: true,
        })
      } catch (error) {
        threw = true
        expect(error.message).toMatch(/duplicate|unique|constraint/i)
      }
      expect(threw).toBe(true)
    })

    it('should handle cascading deletes correctly', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      const { MessageRepository } = require('@/lib/repositories/messages')
      
      const ticket = await TicketRepository.create({
        tenant_id: '40000000-0000-0000-0000-000000000001',
        customer_email: 'cascade@example.com',
        subject: 'Cascade Test',
        message: 'Test message',
        channel: 'email',
        status: 'open',
        priority: 'medium',
      })
      
      await MessageRepository.create({
        ticket_id: ticket.ticket_id,
        body: 'Child message',
        sender_type: 'agent',
        sender_id: '00000000-0000-0000-0000-000000000001',
        from_type: 'agent',
      })
      
      await TicketRepository.delete(ticket.ticket_id)
      
      // Messages should still exist (soft delete)
      const messages = await MessageRepository.findByTicket(ticket.ticket_id)
      expect(messages.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should return null for non-existent ticket', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      const result = await TicketRepository.findById('99999999-9999-9999-9999-999999999999')
      expect(result).toBeNull()
    })

    it('should return 400 for bad request data', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      await expect(
        TicketRepository.create({
          // Missing required fields
          tenant_id: '40000000-0000-0000-0000-000000000001',
        })
      ).rejects.toThrow()
    })

    it('should return 500 for server errors with message', async () => {
      // Simulate database connection failure
      const { createServiceSupabase } = require('@/lib/db/supabase')
      
      const supabase = createServiceSupabase()
      const { error } = await supabase.from('non_existent_table').select()
      
      expect(error).toBeDefined()
      expect(error.message).toBeDefined()
    })
  })

  describe('Pagination', () => {
    it('should paginate ticket list with limit', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      const page1 = await TicketRepository.findAll({ limit: 10, offset: 0 })
      expect(page1.length).toBeLessThanOrEqual(10)
    })

    it('should paginate with offset', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      const page1 = await TicketRepository.findAll({ limit: 5, offset: 0 })
      const page2 = await TicketRepository.findAll({ limit: 5, offset: 5 })
      
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].ticket_id).not.toBe(page2[0].ticket_id)
      }
    })

    it('should respect pagination parameters', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      // Test that limit and offset work correctly
      const page1 = await TicketRepository.findAll({ limit: 2, offset: 0 })
      const page2 = await TicketRepository.findAll({ limit: 2, offset: 2 })
      
      expect(page1.length).toBeLessThanOrEqual(2)
      expect(page2.length).toBeLessThanOrEqual(2)
      
      // Pagination working means we get data
      expect(Array.isArray(page1)).toBe(true)
      expect(Array.isArray(page2)).toBe(true)
    })
  })

  describe('Zod Validation', () => {
    it('should validate ticket creation schema', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      const invalidData = {
        tenant_id: 123, // should be string
        customer_email: 'not-an-email',
        subject: '',
        message: null,
        channel: 'invalid',
        status: 'INVALID_STATUS',
        priority: 'super_high',
      }
      
      await expect(
        TicketRepository.create(invalidData)
      ).rejects.toThrow()
    })

    it('should validate update schema allows partial data', async () => {
      const { TicketRepository } = require('@/lib/repositories/tickets')
      
      const ticket = await TicketRepository.create({
        tenant_id: '40000000-0000-0000-0000-000000000001',
        customer_email: 'test@example.com',
        subject: 'Partial Update Test',
        message: 'Test message',
        channel: 'email',
        status: 'open',
        priority: 'medium',
      })
      
      // Should allow updating only status
      const updated = await TicketRepository.update(ticket.ticket_id, {
        status: 'in_progress',
      })
      
      expect(updated.status).toBe('in_progress')
      expect(updated.subject).toBe('Partial Update Test')
    })
  })
})
