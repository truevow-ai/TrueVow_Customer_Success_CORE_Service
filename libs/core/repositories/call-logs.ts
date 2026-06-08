import { createServerSupabase } from '@/lib/db/supabase'

// Call Log types matching the cs_call_logs table schema
export interface CallLog {
  log_id: string
  ticket_id: string | null
  conversation_id: string | null
  call_id: string | null // External call ID (Twilio call SID, WhatsApp call ID)
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
  transcription_provider: string | null // 'deepgram', 'twilio', 'whatsapp'
  cost: number | null
  error_code: string | null
  error_message: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface CallLogInsert {
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
}

export interface CallLogUpdate {
  call_id?: string | null
  status?: CallLog['status']
  duration_seconds?: number | null
  answered_at?: string | null
  ended_at?: string | null
  recording_url?: string | null
  transcription_text?: string | null
  transcription_status?: CallLog['transcription_status']
  transcription_provider?: string | null
  cost?: number | null
  error_code?: string | null
  error_message?: string | null
  metadata?: Record<string, any>
}

export interface CallLogFilters {
  ticket_id?: string
  conversation_id?: string
  from_number?: string
  to_number?: string
  direction?: 'inbound' | 'outbound'
  status?: CallLog['status']
  date_from?: string
  date_to?: string
}

export class CallLogRepository {
  /**
   * Find call log by ID
   */
  static async findById(logId: string): Promise<CallLog | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('*')
      .eq('log_id', logId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as CallLog
  }

  /**
   * Find call log by external call ID (Twilio SID, WhatsApp ID)
   */
  static async findByCallId(callId: string): Promise<CallLog | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('*')
      .eq('call_id', callId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as CallLog
  }

  /**
   * Get all call logs with optional filters
   */
  static async findAll(filters?: CallLogFilters, limit = 50, offset = 0): Promise<CallLog[]> {
    const supabase = await createServerSupabase()
    let query = supabase
      .from('cs_call_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filters?.ticket_id) {
      query = query.eq('ticket_id', filters.ticket_id)
    }
    if (filters?.conversation_id) {
      query = query.eq('conversation_id', filters.conversation_id)
    }
    if (filters?.from_number) {
      query = query.eq('from_number', filters.from_number)
    }
    if (filters?.to_number) {
      query = query.eq('to_number', filters.to_number)
    }
    if (filters?.direction) {
      query = query.eq('direction', filters.direction)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.date_from) {
      query = query.gte('started_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('started_at', filters.date_to)
    }

    const { data, error } = await query
    if (error) throw error
    return data as CallLog[]
  }

  /**
   * Get call logs for a specific ticket
   */
  static async findByTicket(ticketId: string): Promise<CallLog[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data as CallLog[]
  }

  /**
   * Get call logs for a specific conversation
   */
  static async findByConversation(conversationId: string): Promise<CallLog[]> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data as CallLog[]
  }

  /**
   * Create a new call log entry
   */
  static async create(callLog: CallLogInsert): Promise<CallLog> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .insert({
        ...callLog,
        started_at: callLog.started_at || new Date().toISOString(),
        metadata: callLog.metadata || {},
      })
      .select()
      .single()

    if (error) throw error
    return data as CallLog
  }

  /**
   * Update a call log
   */
  static async update(logId: string, updates: CallLogUpdate): Promise<CallLog> {
    const supabase = await createServerSupabase()
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
   * Update call status by external call ID
   */
  static async updateByCallId(callId: string, updates: CallLogUpdate): Promise<CallLog | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_call_logs')
      .update(updates)
      .eq('call_id', callId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as CallLog
  }

  /**
   * Mark call as in progress (answered)
   */
  static async markAnswered(logId: string): Promise<CallLog> {
    return this.update(logId, {
      status: 'in-progress',
      answered_at: new Date().toISOString(),
    })
  }

  /**
   * Mark call as completed
   */
  static async markCompleted(logId: string, durationSeconds: number, recordingUrl?: string): Promise<CallLog> {
    return this.update(logId, {
      status: 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      recording_url: recordingUrl || null,
    })
  }

  /**
   * Mark call as failed
   */
  static async markFailed(logId: string, errorCode?: string, errorMessage?: string): Promise<CallLog> {
    return this.update(logId, {
      status: 'failed',
      ended_at: new Date().toISOString(),
      error_code: errorCode || null,
      error_message: errorMessage || null,
    })
  }

  /**
   * Update transcription
   */
  static async updateTranscription(
    logId: string,
    transcriptionText: string,
    provider: string
  ): Promise<CallLog> {
    return this.update(logId, {
      transcription_text: transcriptionText,
      transcription_status: 'completed',
      transcription_provider: provider,
    })
  }

  /**
   * Get call statistics for a date range
   */
  static async getStats(dateFrom: string, dateTo: string): Promise<{
    totalCalls: number
    inboundCalls: number
    outboundCalls: number
    completedCalls: number
    failedCalls: number
    avgDuration: number
    totalDuration: number
  }> {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('direction, status, duration_seconds')
      .gte('started_at', dateFrom)
      .lte('started_at', dateTo)

    if (error) throw error

    const calls = data as Pick<CallLog, 'direction' | 'status' | 'duration_seconds'>[]
    
    const stats = {
      totalCalls: calls.length,
      inboundCalls: calls.filter(c => c.direction === 'inbound').length,
      outboundCalls: calls.filter(c => c.direction === 'outbound').length,
      completedCalls: calls.filter(c => c.status === 'completed').length,
      failedCalls: calls.filter(c => c.status === 'failed').length,
      avgDuration: 0,
      totalDuration: 0,
    }

    const durations = calls
      .filter(c => c.duration_seconds !== null)
      .map(c => c.duration_seconds as number)

    if (durations.length > 0) {
      stats.totalDuration = durations.reduce((sum, d) => sum + d, 0)
      stats.avgDuration = Math.round(stats.totalDuration / durations.length)
    }

    return stats
  }

  /**
   * Delete a call log
   */
  static async delete(logId: string): Promise<void> {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('cs_call_logs')
      .delete()
      .eq('log_id', logId)

    if (error) throw error
  }

  /**
   * Count calls for a ticket
   */
  static async countByTicket(ticketId: string): Promise<number> {
    const supabase = await createServerSupabase()
    const { count, error } = await supabase
      .from('cs_call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', ticketId)

    if (error) throw error
    return count || 0
  }
}
