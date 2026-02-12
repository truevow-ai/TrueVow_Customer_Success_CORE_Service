import { createServerSupabase } from '@/lib/db/supabase'
import { Message, MessageInsert, MessageUpdate } from '@/types/database'

export class MessageRepository {
  /**
   * Get all messages for a ticket
   */
  static async findByTicket(ticketId: string): Promise<Message[]> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  }

  /**
   * Get message by ID
   */
  static async findById(messageId: string): Promise<Message | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .eq('message_id', messageId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Message
  }

  /**
   * Create a new message
   */
  static async create(message: MessageInsert): Promise<Message> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .insert(message)
      .select()
      .single()

    if (error) throw error
    return data as Message
  }

  /**
   * Update a message
   */
  static async update(messageId: string, updates: MessageUpdate): Promise<Message> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .update(updates)
      .eq('message_id', messageId)
      .select()
      .single()

    if (error) throw error
    return data as Message
  }

  /**
   * Delete a message
   */
  static async delete(messageId: string): Promise<void> {
    const supabase = createServerSupabase()
    const { error } = await supabase
      .from('cs_messages')
      .delete()
      .eq('message_id', messageId)

    if (error) throw error
  }

  /**
   * Get messages by sender
   */
  static async findBySender(senderId: string): Promise<Message[]> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .eq('sender_id', senderId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Message[]
  }

  /**
   * Get internal notes for a ticket
   */
  static async findInternalNotes(ticketId: string): Promise<Message[]> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('is_internal', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Message[]
  }

  /**
   * Get message thread (with replies)
   */
  static async getThread(messageId: string): Promise<Message[]> {
    const supabase = createServerSupabase()
    
    // First get the root message
    const rootMessage = await this.findById(messageId)
    if (!rootMessage) return []

    // Get all messages in reply to this message
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .or(`in_reply_to.eq.${messageId},message_id.eq.${messageId}`)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  }

  /**
   * Find message by external ID (e.g., email message ID)
   */
  static async findByExternalId(externalId: string): Promise<Message | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_messages')
      .select('*')
      .eq('metadata->>email_message_id', externalId)
      .or(`metadata->>messageId.eq.${externalId},metadata->>callId.eq.${externalId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Message | null
  }
}

