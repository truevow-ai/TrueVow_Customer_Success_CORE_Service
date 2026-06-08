/**
 * WhatsApp Voice Integration Service
 * 
 * Handles WhatsApp messaging and voice call tracking via Twilio WhatsApp Business API.
 * Tracks calls for training purposes and customer success workflows.
 */

import { CallLogRepository, CallLogInsert, CallLog } from '@/lib/repositories/call-logs'
import { EXTERNAL_API_URLS, TWILIO_DEFAULTS, DEFAULT_LIMITS, getTwilioMessagesUrl } from '@/lib/config/app-config'

// WhatsApp message types
export interface WhatsAppMessage {
  from: string
  to: string
  body?: string
  mediaUrl?: string
  messageType: 'text' | 'voice' | 'image' | 'document' | 'video'
  messageId?: string
  timestamp?: string
}

export interface WhatsAppVoiceCall {
  from: string
  to: string
  callSid: string
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer' | 'canceled'
  duration?: number
  recordingUrl?: string
  transcription?: string
}

export interface WhatsAppWebhookPayload {
  MessageSid?: string
  From?: string
  To?: string
  Body?: string
  MediaUrl0?: string
  MediaContentType0?: string
  CallSid?: string
  CallStatus?: string
  CallDuration?: string
  RecordingUrl?: string
  TranscriptionText?: string
}

export class WhatsAppVoiceService {
  private static TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
  private static TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
  private static TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || TWILIO_DEFAULTS.DEFAULT_WHATSAPP_NUMBER

  /**
   * Send a WhatsApp message
   */
  static async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.TWILIO_ACCOUNT_SID || !this.TWILIO_AUTH_TOKEN) {
        return { success: false, error: 'Twilio credentials not configured' }
      }

      const twilioUrl = getTwilioMessagesUrl(this.TWILIO_ACCOUNT_SID!)
      
      const formData = new URLSearchParams()
      formData.append('From', `whatsapp:${this.TWILIO_WHATSAPP_NUMBER}`)
      formData.append('To', `whatsapp:${message.to}`)
      
      if (message.body) {
        formData.append('Body', message.body)
      }
      if (message.mediaUrl) {
        formData.append('MediaUrl', message.mediaUrl)
      }

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
        return { success: false, error: data.message || 'Failed to send message' }
      }

      return { success: true, messageId: data.sid }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Send a WhatsApp voice note (audio file)
   */
  static async sendVoiceNote(to: string, audioUrl: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      from: this.TWILIO_WHATSAPP_NUMBER,
      to,
      mediaUrl: audioUrl,
      messageType: 'voice',
    })
  }

  /**
   * Log an incoming WhatsApp voice call
   */
  static async logIncomingVoiceCall(
    call: WhatsAppVoiceCall,
    ticketId?: string,
    conversationId?: string
  ): Promise<CallLog> {
    const callLog: CallLogInsert = {
      ticket_id: ticketId || null,
      conversation_id: conversationId || null,
      call_id: call.callSid,
      from_number: call.from.replace('whatsapp:', ''),
      to_number: call.to.replace('whatsapp:', ''),
      direction: 'inbound',
      status: call.status,
      duration_seconds: call.duration || null,
      recording_url: call.recordingUrl || null,
      transcription_text: call.transcription || null,
      transcription_status: call.transcription ? 'completed' : null,
      transcription_provider: call.transcription ? 'twilio' : null,
      started_at: new Date().toISOString(),
      metadata: {
        channel: 'whatsapp',
        call_type: 'voice',
      },
    }

    return CallLogRepository.create(callLog)
  }

  /**
   * Log an outgoing WhatsApp voice call (CSM initiated)
   */
  static async logOutgoingVoiceCall(
    from: string,
    to: string,
    ticketId?: string,
    conversationId?: string
  ): Promise<CallLog> {
    const callLog: CallLogInsert = {
      ticket_id: ticketId || null,
      conversation_id: conversationId || null,
      call_id: `wa_out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from_number: from.replace('whatsapp:', ''),
      to_number: to.replace('whatsapp:', ''),
      direction: 'outbound',
      status: 'initiated',
      started_at: new Date().toISOString(),
      metadata: {
        channel: 'whatsapp',
        call_type: 'voice',
        initiated_by: 'csm',
      },
    }

    return CallLogRepository.create(callLog)
  }

  /**
   * Update call status from webhook
   */
  static async updateCallStatus(
    callSid: string,
    status: WhatsAppVoiceCall['status'],
    duration?: number,
    recordingUrl?: string
  ): Promise<CallLog | null> {
    const updates: Record<string, any> = { status }
    
    if (duration !== undefined) {
      updates.duration_seconds = duration
      updates.ended_at = new Date().toISOString()
    }
    if (recordingUrl) {
      updates.recording_url = recordingUrl
    }

    return CallLogRepository.updateByCallId(callSid, updates)
  }

  /**
   * Process WhatsApp webhook payload
   */
  static async processWebhook(payload: WhatsAppWebhookPayload): Promise<{
    type: 'message' | 'voice_call' | 'unknown'
    processed: boolean
    data?: any
    error?: string
  }> {
    try {
      // Voice call webhook
      if (payload.CallSid) {
        const existingLog = await CallLogRepository.findByCallId(payload.CallSid)
        
        if (existingLog) {
          // Update existing call log
          await this.updateCallStatus(
            payload.CallSid,
            this.mapTwilioCallStatus(payload.CallStatus || ''),
            payload.CallDuration ? parseInt(payload.CallDuration) : undefined,
            payload.RecordingUrl
          )

          // Add transcription if provided
          if (payload.TranscriptionText) {
            await CallLogRepository.updateTranscription(
              existingLog.log_id,
              payload.TranscriptionText,
              'twilio'
            )
          }

          return { type: 'voice_call', processed: true, data: { logId: existingLog.log_id, updated: true } }
        }

        // New voice call
        const callLog = await this.logIncomingVoiceCall({
          from: payload.From || '',
          to: payload.To || '',
          callSid: payload.CallSid,
          status: this.mapTwilioCallStatus(payload.CallStatus || 'initiated'),
          duration: payload.CallDuration ? parseInt(payload.CallDuration) : undefined,
          recordingUrl: payload.RecordingUrl,
          transcription: payload.TranscriptionText,
        })

        return { type: 'voice_call', processed: true, data: { logId: callLog.log_id } }
      }

      // Message webhook (text or voice note)
      if (payload.MessageSid) {
        const isVoiceNote = payload.MediaContentType0?.startsWith('audio/')
        
        const messageData = {
          messageId: payload.MessageSid,
          from: payload.From?.replace('whatsapp:', ''),
          to: payload.To?.replace('whatsapp:', ''),
          body: payload.Body,
          mediaUrl: payload.MediaUrl0,
          messageType: isVoiceNote ? 'voice' : 'text',
        }

        return { type: 'message', processed: true, data: messageData }
      }

      return { type: 'unknown', processed: false, error: 'Unrecognized webhook payload' }
    } catch (error) {
      return {
        type: 'unknown',
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Map Twilio call status to our status
   */
  private static mapTwilioCallStatus(twilioStatus: string): WhatsAppVoiceCall['status'] {
    const statusMap: Record<string, WhatsAppVoiceCall['status']> = {
      'queued': 'initiated',
      'ringing': 'ringing',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'busy': 'busy',
      'failed': 'failed',
      'no-answer': 'no-answer',
      'canceled': 'canceled',
      'initiated': 'initiated',
    }
    return statusMap[twilioStatus] || 'initiated'
  }

  /**
   * Get call history for a phone number
   */
  static async getCallHistory(phoneNumber: string, limit: number = DEFAULT_LIMITS.CALL_HISTORY_LIMIT): Promise<CallLog[]> {
    const cleanNumber = phoneNumber.replace('whatsapp:', '').replace(/\D/g, '')
    
    // Get both inbound and outbound calls for this number
    const [inbound, outbound] = await Promise.all([
      CallLogRepository.findAll({ from_number: cleanNumber }, limit / 2),
      CallLogRepository.findAll({ to_number: cleanNumber }, limit / 2),
    ])

    // Merge and sort by date
    const allCalls = [...inbound, ...outbound]
      .sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime())
      .slice(0, limit)

    return allCalls
  }

  /**
   * Get all calls that need transcription
   */
  static async getCallsNeedingTranscription(): Promise<CallLog[]> {
    const { createServerSupabase } = await import('@/lib/db/supabase')
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cs_call_logs')
      .select('*')
      .not('recording_url', 'is', null)
      .is('transcription_text', null)
      .eq('transcription_status', 'pending')

    if (error) throw error
    return data as CallLog[]
  }

  /**
   * Request transcription for a call recording
   */
  static async requestTranscription(logId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const callLog = await CallLogRepository.findById(logId)
      
      if (!callLog) {
        return { success: false, error: 'Call log not found' }
      }

      if (!callLog.recording_url) {
        return { success: false, error: 'No recording URL available' }
      }

      // Update status to processing
      await CallLogRepository.update(logId, { transcription_status: 'processing' })

      // In production, you would call a transcription service here
      // For now, we'll mark it as pending (actual transcription would be done by a worker)
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get call statistics for CSM dashboard
   */
  static async getCallStats(
    dateFrom: string,
    dateTo: string,
    agentId?: string
  ): Promise<{
    totalCalls: number
    inboundCalls: number
    outboundCalls: number
    avgDuration: number
    totalTalkTime: number
    completedRate: number
  }> {
    const stats = await CallLogRepository.getStats(dateFrom, dateTo)
    
    const completedRate = stats.totalCalls > 0 
      ? Math.round((stats.completedCalls / stats.totalCalls) * 100) 
      : 0

    return {
      totalCalls: stats.totalCalls,
      inboundCalls: stats.inboundCalls,
      outboundCalls: stats.outboundCalls,
      avgDuration: stats.avgDuration,
      totalTalkTime: stats.totalDuration,
      completedRate,
    }
  }
}
