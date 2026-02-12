import { createServerSupabase } from '@/lib/db/supabase'

export interface SMSLog {
  log_id: string
  ticket_id: string | null
  message_id: string | null
  conversation_id: string | null
  sms_id: string | null
  from_number: string
  to_number: string
  body: string | null
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'received'
  direction: 'inbound' | 'outbound'
  sent_at: string | null
  delivered_at: string | null
  received_at: string | null
  error_code: string | null
  error_message: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface SMSLogInsert {
  log_id?: string
  ticket_id?: string | null
  message_id?: string | null
  conversation_id?: string | null
  sms_id?: string | null
  from_number: string
  to_number: string
  body?: string | null
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'received'
  direction: 'inbound' | 'outbound'
  sent_at?: string | null
  delivered_at?: string | null
  received_at?: string | null
  error_code?: string | null
  error_message?: string | null
  metadata?: Record<string, any>
  created_at?: string
}

export interface SMSLogUpdate {
  log_id?: string
  ticket_id?: string | null
  message_id?: string | null
  conversation_id?: string | null
  sms_id?: string | null
  from_number?: string
  to_number?: string
  body?: string | null
  status?: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'received'
  direction?: 'inbound' | 'outbound'
  sent_at?: string | null
  delivered_at?: string | null
  received_at?: string | null
  error_code?: string | null
  error_message?: string | null
  metadata?: Record<string, any>
  created_at?: string
}

export class SMSLogRepository {
  /**
   * Get all SMS logs with optional filters
   */
  static async findAll(filters?: {
    ticketId?: string
    messageId?: string
    conversationId?: string
    status?: SMSLog['status']
    direction?: SMSLog['direction']
    phoneNumber?: string
    limit?: number
    offset?: number
  }): Promise<SMSLog[]> {
    const supabase = createServerSupabase()
    let query = supabase.from('cs_sms_logs').select('*')

    if (filters?.ticketId) {
      query = query.eq('ticket_id', filters.ticketId)
    }
    if (filters?.messageId) {
      query = query.eq('message_id', filters.messageId)
    }
    if (filters?.conversationId) {
      query = query.eq('conversation_id', filters.conversationId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.direction) {
      query = query.eq('direction', filters.direction)
    }
    if (filters?.phoneNumber) {
      query = query.or(`from_number.eq.${filters.phoneNumber},to_number.eq.${filters.phoneNumber}`)
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
    return data as SMSLog[]
  }

  /**
   * Get SMS log by ID
   */
  static async findById(logId: string): Promise<SMSLog | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_sms_logs')
      .select('*')
      .eq('log_id', logId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as SMSLog
  }

  /**
   * Get SMS log by external SMS ID
   */
  static async findBySMSId(smsId: string): Promise<SMSLog | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_sms_logs')
      .select('*')
      .eq('sms_id', smsId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as SMSLog
  }

  /**
   * Create a new SMS log
   */
  static async create(smsLog: SMSLogInsert): Promise<SMSLog> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_sms_logs')
      .insert(smsLog)
      .select()
      .single()

    if (error) throw error
    return data as SMSLog
  }

  /**
   * Update an SMS log
   */
  static async update(logId: string, updates: SMSLogUpdate): Promise<SMSLog> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_sms_logs')
      .update(updates)
      .eq('log_id', logId)
      .select()
      .single()

    if (error) throw error
    return data as SMSLog
  }

  /**
   * Update SMS status
   */
  static async updateStatus(
    logId: string,
    status: SMSLog['status'],
    timestamp?: string
  ): Promise<SMSLog> {
    const updates: SMSLogUpdate = { status }
    const now = new Date().toISOString()

    if (status === 'sent' && !timestamp) {
      updates.sent_at = now
    } else if (status === 'delivered' && !timestamp) {
      updates.delivered_at = now
    } else if (status === 'received' && !timestamp) {
      updates.received_at = now
    }

    if (timestamp) {
      if (status === 'sent') updates.sent_at = timestamp
      if (status === 'delivered') updates.delivered_at = timestamp
      if (status === 'received') updates.received_at = timestamp
    }

    return this.update(logId, updates)
  }

  /**
   * Mark SMS as failed
   */
  static async markFailed(
    logId: string,
    errorCode: string,
    errorMessage: string
  ): Promise<SMSLog> {
    return this.update(logId, {
      status: 'failed',
      error_code: errorCode,
      error_message: errorMessage,
    })
  }

  /**
   * Get SMS logs for a ticket
   */
  static async findByTicket(ticketId: string): Promise<SMSLog[]> {
    return this.findAll({ ticketId })
  }

  /**
   * Get SMS logs for a conversation
   */
  static async findByConversation(conversationId: string): Promise<SMSLog[]> {
    return this.findAll({ conversationId })
  }

  /**
   * Get inbound SMS logs
   */
  static async findInbound(limit?: number): Promise<SMSLog[]> {
    return this.findAll({ direction: 'inbound', limit })
  }

  /**
   * Get outbound SMS logs
   */
  static async findOutbound(limit?: number): Promise<SMSLog[]> {
    return this.findAll({ direction: 'outbound', limit })
  }

  /**
   * Get failed SMS logs
   */
  static async findFailed(limit?: number): Promise<SMSLog[]> {
    return this.findAll({ status: 'failed', limit })
  }
}
