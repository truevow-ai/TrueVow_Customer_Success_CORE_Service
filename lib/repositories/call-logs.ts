import { createServerSupabase } from '@/lib/db/supabase'

export interface CallLog {
  log_id: string
  ticket_id: string | null
  conversation_id: string | null
  call_id: string | null
  from_number: string
  to_number: string
  direction: 'inbound' | 'outbound'
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled'
  duration_seconds: number | null
  started_at: string | null
  answered_at: string | null
  ended_at: string | null
  recording_url: string | null
  transcription_text: string | null
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed' | null
  transcription_provider: string | null
  cost: number | null
  error_code: string | null
  error_message: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface CallLogInsert {
  log_id?: string
  ticket_id?: string | null
  conversation_id?: string | null
  call_id?: string | null
  from_number: string
  to_number: string
  direction: 'inbound' | 'outbound'
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled'
  duration_seconds?: number | null
  started_at?: string | null
  answered_at?: string | null
  ended_at?: string | null
  recording_url?: string | null
  transcription_text?: string | null
  transcription_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
  transcription_provider?: string | null
  cost?: number | null
  error_code?: string | null
  error_message?: string | null
  metadata?: Record<string, any>
  created_at?: string
}

export interface CallLogUpdate {
  log_id?: string
  ticket_id?: string | null
  conversation_id?: string | null
  call_id?: string | null
  from_number?: string
  to_number?: string
  direction?: 'inbound' | 'outbound'
  status?: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled'
  duration_seconds?: number | null
  started_at?: string | null
  answered_at?: string | null
  ended_at?: string | null
  recording_url?: string | null
  transcription_text?: string | null
  transcription_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
  transcription_provider?: string | null
  cost?: number | null
  error_code?: string | null
  error_message?: string | null
  metadata?: Record<string, any>
  created_at?: string
}

export class CallLogRepository {
  /**
   * Get all call logs with optional filters
   */
  static async findAll(filters?: {
    ticketId?: string
    conversationId?: string
    status?: CallLog['status']
    direction?: CallLog['direction']
    phoneNumber?: string
    transcriptionStatus?: CallLog['transcription_status']
    limit?: number
    offset?: number
  }): Promise<CallLog[]> {
    const supabase = createServerSupabase()
    let query = supabase.from('cs_call_logs').select('*')

    if (filters?.ticketId) {
      query = query.eq('ticket_id', filters.ticketId)
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
    if (filters?.transcriptionStatus) {
      query = query.eq('transcription_status', filters.transcriptionStatus)
    }

    query = query.order('started_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as CallLog[]
  }

  /**
   * Get call log by ID
   */
  static async findById(logId: string): Promise<CallLog | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('*')
      .eq('log_id', logId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as CallLog
  }

  /**
   * Get call log by external call ID
   */
  static async findByCallId(callId: string): Promise<CallLog | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('*')
      .eq('call_id', callId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as CallLog
  }

  /**
   * Create a new call log
   */
  static async create(callLog: CallLogInsert): Promise<CallLog> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .insert(callLog)
      .select()
      .single()

    if (error) throw error
    return data as CallLog
  }

  /**
   * Update a call log
   */
  static async update(logId: string, updates: CallLogUpdate): Promise<CallLog> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .update(updates)
      .eq('log_id', logId)
      .select()
      .single()

    if (error) throw error
    return data as CallLog
  }

  /**
   * Update call status
   */
  static async updateStatus(
    logId: string,
    status: CallLog['status'],
    timestamp?: string
  ): Promise<CallLog> {
    const updates: CallLogUpdate = { status }
    const now = new Date().toISOString()

    if (status === 'in-progress' && !timestamp) {
      updates.answered_at = now
    } else if (status === 'completed' && !timestamp) {
      updates.ended_at = now
    }

    if (timestamp) {
      if (status === 'in-progress') updates.answered_at = timestamp
      if (status === 'completed') updates.ended_at = timestamp
    }

    return this.update(logId, updates)
  }

  /**
   * Update call transcription
   */
  static async updateTranscription(
    logId: string,
    transcriptionText: string,
    provider: string,
    status: CallLog['transcription_status'] = 'completed'
  ): Promise<CallLog> {
    return this.update(logId, {
      transcription_text: transcriptionText,
      transcription_provider: provider,
      transcription_status: status,
    })
  }

  /**
   * Mark transcription as failed
   */
  static async markTranscriptionFailed(
    logId: string,
    errorMessage?: string
  ): Promise<CallLog> {
    return this.update(logId, {
      transcription_status: 'failed',
      error_message: errorMessage || null,
    })
  }

  /**
   * Update call recording URL
   */
  static async updateRecordingUrl(
    logId: string,
    recordingUrl: string
  ): Promise<CallLog> {
    return this.update(logId, { recording_url: recordingUrl })
  }

  /**
   * Calculate and update call duration
   */
  static async updateDuration(logId: string): Promise<CallLog> {
    const call = await this.findById(logId)
    if (!call) {
      throw new Error('Call log not found')
    }

    if (call.started_at && call.ended_at) {
      const start = new Date(call.started_at).getTime()
      const end = new Date(call.ended_at).getTime()
      const durationSeconds = Math.floor((end - start) / 1000)

      return this.update(logId, { duration_seconds: durationSeconds })
    }

    return call
  }

  /**
   * Get call logs for a ticket
   */
  static async findByTicket(ticketId: string): Promise<CallLog[]> {
    return this.findAll({ ticketId })
  }

  /**
   * Get call logs for a conversation
   */
  static async findByConversation(conversationId: string): Promise<CallLog[]> {
    return this.findAll({ conversationId })
  }

  /**
   * Get completed calls
   */
  static async findCompleted(limit?: number): Promise<CallLog[]> {
    return this.findAll({ status: 'completed', limit })
  }

  /**
   * Get calls pending transcription
   */
  static async findPendingTranscription(limit?: number): Promise<CallLog[]> {
    return this.findAll({ transcriptionStatus: 'pending', limit })
  }

  /**
   * Get failed calls
   */
  static async findFailed(limit?: number): Promise<CallLog[]> {
    return this.findAll({ status: 'failed', limit })
  }
}
