import { createServerSupabase } from '@/lib/db/supabase'

// Activity Feed types matching cs_team_activity_feed table
export interface ActivityFeedItem {
  activity_id: string
  ticket_id: string | null
  user_id: string
  activity_type: 
    | 'ticket_created'
    | 'ticket_assigned'
    | 'ticket_resolved'
    | 'ticket_closed'
    | 'ticket_reopened'
    | 'message_sent'
    | 'status_changed'
    | 'priority_changed'
    | 'sla_breached'
    | 'sla_warning'
    | 'escalated'
    | 'tag_added'
    | 'tag_removed'
    | 'note_added'
  description: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface ActivityFeedInsert {
  ticket_id?: string | null
  user_id: string
  activity_type: ActivityFeedItem['activity_type']
  description?: string | null
  metadata?: Record<string, any>
}

export class ActivityFeedRepository {
  /**
   * Find activity by ID
   */
  static async findById(activityId: string): Promise<ActivityFeedItem | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_activity_feed')
      .select('*')
      .eq('activity_id', activityId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as ActivityFeedItem
  }

  /**
   * Get all activity for a ticket
   */
  static async findByTicket(ticketId: string, limit = 50): Promise<ActivityFeedItem[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_activity_feed')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as ActivityFeedItem[]
  }

  /**
   * Get all activity for a user
   */
  static async findByUser(userId: string, limit = 50): Promise<ActivityFeedItem[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_activity_feed')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as ActivityFeedItem[]
  }

  /**
   * Get recent activity across all tickets
   */
  static async getRecent(limit = 100): Promise<ActivityFeedItem[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as ActivityFeedItem[]
  }

  /**
   * Get activity by type
   */
  static async findByType(
    activityType: ActivityFeedItem['activity_type'],
    limit = 50
  ): Promise<ActivityFeedItem[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_activity_feed')
      .select('*')
      .eq('activity_type', activityType)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as ActivityFeedItem[]
  }

  /**
   * Create a new activity entry
   */
  static async create(activity: ActivityFeedInsert): Promise<ActivityFeedItem> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_team_activity_feed')
      .insert({
        ...activity,
        metadata: activity.metadata || {},
      })
      .select()
      .single()

    if (error) throw error
    return data as ActivityFeedItem
  }

  /**
   * Log ticket activity (helper method)
   */
  static async logTicketActivity(
    ticketId: string,
    userId: string,
    activityType: ActivityFeedItem['activity_type'],
    description?: string,
    metadata?: Record<string, any>
  ): Promise<ActivityFeedItem> {
    return this.create({
      ticket_id: ticketId,
      user_id: userId,
      activity_type: activityType,
      description,
      metadata,
    })
  }

  /**
   * Delete activity
   */
  static async delete(activityId: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_team_activity_feed')
      .delete()
      .eq('activity_id', activityId)

    if (error) throw error
  }

  /**
   * Delete all activity for a ticket
   */
  static async deleteByTicket(ticketId: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_team_activity_feed')
      .delete()
      .eq('ticket_id', ticketId)

    if (error) throw error
  }
}
