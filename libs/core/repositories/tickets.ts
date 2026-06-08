import { createServerSupabase, createServiceSupabase } from '@/lib/db/supabase'
import { Ticket, TicketInsert, TicketUpdate } from '@/libs/types/database'
import { ticketSchema } from '@/lib/utils/validation'

export class TicketRepository {
  /**
   * Get all tickets with optional filters
   */
  static async findAll(filters?: {
    tenantId?: string
    assignedTo?: string
    status?: string
    priority?: string
    stage?: string
    source?: string
    limit?: number
    offset?: number
  }) {
    const supabase = await createServerSupabase()
    let query = supabase.from('cs_tickets').select('*')

    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId)
    }
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters?.stage) {
      query = query.eq('stage', filters.stage)
    }
    if (filters?.source) {
      query = query.eq('source', filters.source)
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Ticket[]
  }

  /**
   * Get ticket by ID
   */
  static async findById(ticketId: string): Promise<Ticket | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Ticket
  }

  /**
   * Create a new ticket
   */
  static async create(ticket: TicketInsert): Promise<Ticket> {
    // Validate input with Zod schema
    const validated = ticketSchema.parse(ticket)
    
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_tickets')
      .insert(validated)
      .select()
      .single()

    if (error) throw error
    return data as Ticket
  }

  /**
   * Update a ticket
   */
  static async update(ticketId: string, updates: TicketUpdate): Promise<Ticket> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('ticket_id', ticketId)
      .select()
      .single()

    if (error) throw error
    return data as Ticket
  }

  /**
   * Delete a ticket (soft delete by setting status to closed)
   */
  static async delete(ticketId: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_tickets')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('ticket_id', ticketId)

    if (error) throw error
  }

  /**
   * Assign ticket to user
   */
  static async assign(ticketId: string, userId: string): Promise<Ticket> {
    return this.update(ticketId, { assigned_to: userId })
  }

  /**
   * Update ticket status
   */
  static async updateStatus(
    ticketId: string,
    status: Ticket['status'],
    resolvedAt?: string
  ): Promise<Ticket> {
    // Get current ticket to check if status is changing to resolved/closed
    const currentTicket = await this.findById(ticketId)
    const wasResolved = currentTicket?.status === 'resolved' || currentTicket?.status === 'closed'
    
    const updates: TicketUpdate = { status }
    if (status === 'resolved' && resolvedAt) {
      updates.resolved_at = resolvedAt
    }
    if (status === 'closed') {
      updates.closed_at = new Date().toISOString()
    }
    
    const updatedTicket = await this.update(ticketId, updates)
    
    // Trigger survey processing if ticket was just resolved/closed
    if (!wasResolved && (status === 'resolved' || status === 'closed')) {
      // Fire and forget - don't block ticket update
      this.triggerSurveyProcessing(ticketId).catch(err => {
        console.error('Failed to trigger survey processing:', err)
      })
    }
    
    return updatedTicket
  }

  /**
   * Trigger survey processing (async, non-blocking)
   */
  private static async triggerSurveyProcessing(ticketId: string): Promise<void> {
    try {
      // Dynamic import to avoid circular dependency
      const { CSATNPSSurveyService } = await import('@/lib/services/csat-nps-survey')
      await CSATNPSSurveyService.processTicketResolution(ticketId)
    } catch (error) {
      // Log but don't throw - survey processing failure shouldn't block ticket updates
      console.error('Survey processing error:', error)
    }
  }

  /**
   * Update ticket priority
   */
  static async updatePriority(
    ticketId: string,
    priority: Ticket['priority']
  ): Promise<Ticket> {
    return this.update(ticketId, { priority })
  }

  /**
   * Get tickets by subject (for email threading)
   */
  static async findBySubject(subject: string): Promise<Ticket[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_tickets')
      .select('*')
      .ilike('subject', `%${subject}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Ticket[]
  }

  /**
   * Get tickets by customer email
   */
  static async findByCustomerEmail(email: string): Promise<Ticket[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_tickets')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Ticket[]
  }

  /**
   * Get tickets by tenant
   */
  static async findByTenant(tenantId: string): Promise<Ticket[]> {
    return this.findAll({ tenantId })
  }

  /**
   * Get tickets assigned to user
   */
  static async findByAssignee(userId: string): Promise<Ticket[]> {
    return this.findAll({ assignedTo: userId })
  }

  /**
   * Get pre-sale tickets (for Sales team)
   */
  static async findPreSaleTickets(): Promise<Ticket[]> {
    return this.findAll({ stage: 'pre-sale' })
  }

  /**
   * Count tickets by status
   */
  static async countByStatus(status: Ticket['status']): Promise<number> {
    const supabase = await createServerSupabase()
    const { count, error } = await supabase
      .from('cs_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    if (error) throw error
    return count || 0
  }
}

