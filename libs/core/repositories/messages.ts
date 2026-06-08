import { createServerSupabase } from '@/lib/db/supabase'

// Message types
export interface SupportMessage {
  message_id: string
  ticket_id: string
  from_type: 'customer' | 'agent' | 'system'
  from_user_id: string | null
  sender_id: string | null
  sender_type: 'agent' | 'customer' | 'system'
  body: string
  is_internal: boolean
  attachments: any[]
  created_at: string
  in_reply_to: string | null
  references_header: string[] | null
  metadata: Record<string, any>
}

export interface MessageInsert {
  ticket_id: string
  from_type: 'customer' | 'agent' | 'system'
  from_user_id?: string
  sender_id?: string
  sender_type: 'agent' | 'customer' | 'system'
  body: string
  is_internal?: boolean
  attachments?: any[]
  in_reply_to?: string
  references_header?: string[]
  metadata?: Record<string, any>
}

export class MessageRepository {
  /**
   * Get all messages for a ticket
   */
  static async findByTicket(ticketId: string): Promise<SupportMessage[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as SupportMessage[]
  }

  /**
   * Get message by ID
   */
  static async findById(messageId: string): Promise<SupportMessage | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .eq('message_id', messageId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as SupportMessage
  }

  /**
   * Create a new message
   */
  static async create(message: MessageInsert): Promise<SupportMessage> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .insert(message)
      .select()
      .single()

    if (error) throw error
    return data as SupportMessage
  }

  /**
   * Delete a message
   */
  static async delete(messageId: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_messages')
      .delete()
      .eq('message_id', messageId)

    if (error) throw error
  }

  /**
   * Get messages by sender
   */
  static async findBySender(senderId: string): Promise<SupportMessage[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .eq('sender_id', senderId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as SupportMessage[]
  }

  /**
   * Get internal notes for a ticket
   */
  static async findInternalNotes(ticketId: string): Promise<SupportMessage[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('is_internal', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as SupportMessage[]
  }

  /**
   * Count messages for a ticket
   */
  static async countByTicket(ticketId: string): Promise<number> {
    const supabase = await createServerSupabase()
    const { count, error } = await supabase
      .from('cs_messages')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', ticketId)

    if (error) throw error
    return count || 0
  }
}
