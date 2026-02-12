import { createServerSupabase } from '@/lib/db/supabase'

export interface Activity {
  activity_id: string
  ticket_id: string | null
  user_id: string
  activity_type: string
  description: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface ActivityInsert {
  ticket_id?: string | null
  user_id: string
  activity_type: string
  description?: string | null
  metadata?: Record<string, any>
}

export class ActivityFeedRepository {
  /**
   * Get all activities with optional filters
   */
  static async findAll(filters?: {
    ticketId?: string
    userId?: string
    activityType?: string
    limit?: number
    offset?: number
  }): Promise<Activity[]> {
    const supabase = createServerSupabase()
    let query = supabase.from('support_team_activity_feed').select('*')

    if (filters?.ticketId) {
      query = query.eq('ticket_id', filters.ticketId)
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters?.activityType) {
      query = query.eq('activity_type', filters.activityType)
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Activity[]
  }

  /**
   * Get activities for a ticket
   */
  static async findByTicket(ticketId: string): Promise<Activity[]> {
    return this.findAll({ ticketId })
  }

  /**
   * Get activities for a user
   */
  static async findByUser(userId: string): Promise<Activity[]> {
    return this.findAll({ userId })
  }

  /**
   * Create a new activity
   */
  static async create(activity: ActivityInsert): Promise<Activity> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_activity_feed')
      .insert({
        ...activity,
        metadata: activity.metadata || {},
      })
      .select()
      .single()

    if (error) throw error
    return data as Activity
  }

  /**
   * Log ticket created activity
   */
  static async logTicketCreated(ticketId: string, userId: string, metadata?: Record<string, any>): Promise<Activity> {
    return this.create({
      ticket_id: ticketId,
      user_id: userId,
      activity_type: 'ticket_created',
      description: 'Ticket created',
      metadata,
    })
  }

  /**
   * Log ticket assigned activity
   */
  static async logTicketAssigned(ticketId: string, userId: string, assignedTo: string, metadata?: Record<string, any>): Promise<Activity> {
    return this.create({
      ticket_id: ticketId,
      user_id: userId,
      activity_type: 'ticket_assigned',
      description: `Ticket assigned to user ${assignedTo}`,
      metadata: { assigned_to: assignedTo, ...metadata },
    })
  }

  /**
   * Log ticket resolved activity
   */
  static async logTicketResolved(ticketId: string, userId: string, metadata?: Record<string, any>): Promise<Activity> {
    return this.create({
      ticket_id: ticketId,
      user_id: userId,
      activity_type: 'ticket_resolved',
      description: 'Ticket resolved',
      metadata,
    })
  }

  /**
   * Log message sent activity
   */
  static async logMessageSent(ticketId: string, userId: string, metadata?: Record<string, any>): Promise<Activity> {
    return this.create({
      ticket_id: ticketId,
      user_id: userId,
      activity_type: 'message_sent',
      description: 'Message sent',
      metadata,
    })
  }

  /**
   * Log SLA breach activity
   */
  static async logSLABreach(ticketId: string, userId: string, metadata?: Record<string, any>): Promise<Activity> {
    return this.create({
      ticket_id: ticketId,
      user_id: userId,
      activity_type: 'sla_breached',
      description: 'SLA breach detected',
      metadata,
    })
  }
}

