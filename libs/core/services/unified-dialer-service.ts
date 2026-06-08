/**
 * Unified Dialer Service
 * 
 * Handles outbound calling for CSMs using Twilio.
 * Integrates with cs_call_logs for tracking and training.
 */

import { CallLogRepository, CallLogInsert } from '@/lib/repositories/call-logs'
import { SERVICE_URLS, DEFAULT_LIMITS, TIME_DURATIONS, getTwilioCallsUrl } from '@/lib/config/app-config'

export interface DialerPermission {
  user_id: string
  role: string
  department: string
  dialer_enabled: boolean
  permissions: {
    inbound?: boolean
    outbound?: boolean
    parallel_dialing?: boolean
    conference_rooms?: boolean
    call_coaching?: boolean
    recording?: boolean
    transcription?: boolean
  }
  number_assignment: 'individual' | 'pool'
  phone_number: string | null
}

export interface PhoneNumberPool {
  id: string
  department: string
  phone_number: string
  twilio_number_sid: string | null
  status: 'available' | 'reserved' | 'in_use' | 'maintenance'
  reserved_by: string | null
  reserved_until: string | null
}

export interface OutboundCallRequest {
  to_number: string
  customer_id?: string
  ticket_id?: string
  conversation_id?: string
  caller_id?: string // CSM's user ID
}

export interface OutboundCallResponse {
  success: boolean
  call_sid?: string
  log_id?: string
  from_number?: string
  error?: string
}

export class UnifiedDialerService {
  private static TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
  private static TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
  private static TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
  private static APP_URL = SERVICE_URLS.CS_SUPPORT_URL

  /**
   * Check if user has dialer permissions
   */
  static async checkDialerPermission(userId: string): Promise<DialerPermission | null> {
    const { createServerSupabase } = await import('@/lib/db/supabase')
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('dialer_permissions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as DialerPermission
  }

  /**
   * Get available phone number for outbound call
   * Returns user's assigned number or a number from the pool
   */
  static async getAvailablePhoneNumber(userId: string, department: string = 'customer_success'): Promise<string | null> {
    const { createServerSupabase } = await import('@/lib/db/supabase')
    const supabase = await createServerSupabase()
    
    // First check if user has an individual number assigned
    const permission = await this.checkDialerPermission(userId)
    if (permission?.phone_number && permission.number_assignment === 'individual') {
      return permission.phone_number
    }

    // Otherwise, get a number from the pool
    const { data, error } = await supabase
      .from('phone_number_pools')
      .select('*')
      .eq('department', department)
      .eq('status', 'available')
      .limit(1)
      .single()

    if (error || !data) {
      // Fall back to default Twilio number
      return this.TWILIO_PHONE_NUMBER || null
    }

    // Reserve the number for configured duration
    await supabase
      .from('phone_number_pools')
      .update({
        status: 'reserved',
        reserved_by: userId,
        reserved_until: new Date(Date.now() + TIME_DURATIONS.PHONE_RESERVATION_MINUTES * 60 * 1000).toISOString(),
      })
      .eq('id', data.id)

    return (data as PhoneNumberPool).phone_number
  }

  /**
   * Release reserved phone number back to pool
   */
  static async releasePhoneNumber(poolId: string): Promise<void> {
    const { createServerSupabase } = await import('@/lib/db/supabase')
    const supabase = await createServerSupabase()
    
    await supabase
      .from('phone_number_pools')
      .update({
        status: 'available',
        reserved_by: null,
        reserved_until: null,
      })
      .eq('id', poolId)
  }

  /**
   * Initiate an outbound call from CSM to customer
   */
  static async initiateOutboundCall(request: OutboundCallRequest): Promise<OutboundCallResponse> {
    try {
      // Check permissions (skip in development mode)
      const isDevelopment = process.env.NODE_ENV !== 'production'
      
      if (request.caller_id && !isDevelopment) {
        const permission = await this.checkDialerPermission(request.caller_id)
        if (!permission || !permission.dialer_enabled) {
          return { success: false, error: 'Dialer not enabled for this user' }
        }
        if (!permission.permissions.outbound) {
          return { success: false, error: 'Outbound calling not permitted' }
        }
      }

      // In development mode, allow calls without permission check
      if (isDevelopment) {
        console.log('[Dialer] Development mode - skipping permission check')
      }

      // Get caller ID (from number)
      const fromNumber = request.caller_id 
        ? await this.getAvailablePhoneNumber(request.caller_id)
        : this.TWILIO_PHONE_NUMBER

      if (!fromNumber) {
        return { success: false, error: 'No available phone number for outbound call' }
      }

      // Create call log entry
      const callLog: CallLogInsert = {
        ticket_id: request.ticket_id || null,
        conversation_id: request.conversation_id || null,
        call_id: null, // Will be updated with Twilio SID
        from_number: fromNumber,
        to_number: request.to_number,
        direction: 'outbound',
        status: 'initiated',
        started_at: new Date().toISOString(),
        metadata: {
          caller_id: request.caller_id,
          customer_id: request.customer_id,
          call_type: 'twilio_outbound',
        },
      }

      const log = await CallLogRepository.create(callLog)

      // Initiate call via Twilio
      const callSid = await this.makeTwilioCall(
        fromNumber,
        request.to_number,
        request.caller_id,
        log.log_id
      )

      // Update call log with Twilio SID
      await CallLogRepository.update(log.log_id, { call_id: callSid })

      return {
        success: true,
        call_sid: callSid,
        log_id: log.log_id,
        from_number: fromNumber,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Make the actual Twilio call
   */
  private static async makeTwilioCall(
    from: string,
    to: string,
    callerId: string | undefined,
    logId: string
  ): Promise<string> {
    if (!this.TWILIO_ACCOUNT_SID || !this.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured')
    }

    const twilioUrl = getTwilioCallsUrl(this.TWILIO_ACCOUNT_SID!)
    
    // TwiML URL for call handling
    const twimlUrl = `${this.APP_URL}/api/v1/voice/outbound?log_id=${logId}&caller_id=${callerId || ''}`
    
    const formData = new URLSearchParams()
    formData.append('From', from)
    formData.append('To', to)
    formData.append('Url', twimlUrl)
    formData.append('Method', 'POST')
    formData.append('Record', 'true')
    formData.append('StatusCallback', `${this.APP_URL}/api/v1/voice/status?log_id=${logId}`)
    formData.append('StatusCallbackMethod', 'POST')
    formData.append('StatusCallbackEvent', 'initiated,ringing,answered,completed')

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${this.TWILIO_ACCOUNT_SID}:${this.TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initiate call')
    }

    return data.sid
  }

  /**
   * Update call status from Twilio webhook
   */
  static async updateCallStatusFromWebhook(
    callSid: string,
    status: string,
    duration?: number,
    recordingUrl?: string
  ): Promise<void> {
    const statusMap: Record<string, CallLogInsert['status']> = {
      'queued': 'initiated',
      'ringing': 'ringing',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'busy': 'busy',
      'failed': 'failed',
      'no-answer': 'no-answer',
      'canceled': 'canceled',
    }

    const mappedStatus = statusMap[status.toLowerCase()] || 'initiated'

    const updates: Record<string, any> = {
      status: mappedStatus,
    }

    if (duration) {
      updates.duration_seconds = parseInt(duration.toString())
    }

    if (recordingUrl) {
      updates.recording_url = recordingUrl
    }

    if (mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'busy' || mappedStatus === 'no-answer') {
      updates.ended_at = new Date().toISOString()
    }

    await CallLogRepository.updateByCallId(callSid, updates)
  }

  /**
   * Get call history for a CSM
   */
  static async getCSMCallHistory(userId: string, limit: number = DEFAULT_LIMITS.CALL_HISTORY_LIMIT): Promise<any[]> {
    // Get all outbound calls where this user was the caller
    const { createServerSupabase } = await import('@/lib/db/supabase')
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('*')
      .eq('direction', 'outbound')
      .contains('metadata', { caller_id: userId })
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  /**
   * Get call analytics for a CSM
   */
  static async getCSMCallAnalytics(userId: string, days: number = TIME_DURATIONS.DEFAULT_ANALYTICS_PERIOD_DAYS): Promise<{
    totalCalls: number
    totalDuration: number
    avgDuration: number
    completedCalls: number
    failedCalls: number
  }> {
    const { createServerSupabase } = await import('@/lib/db/supabase')
    const supabase = await createServerSupabase()
    
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('status, duration_seconds')
      .eq('direction', 'outbound')
      .contains('metadata', { caller_id: userId })
      .gte('started_at', dateFrom)

    if (error) throw error

    const calls = data || []
    const completedCalls = calls.filter(c => c.status === 'completed')
    const durations = completedCalls
      .filter(c => c.duration_seconds !== null)
      .map(c => c.duration_seconds as number)

    return {
      totalCalls: calls.length,
      totalDuration: durations.reduce((sum, d) => sum + d, 0),
      avgDuration: durations.length > 0 ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length) : 0,
      completedCalls: completedCalls.length,
      failedCalls: calls.filter(c => c.status === 'failed').length,
    }
  }
}
