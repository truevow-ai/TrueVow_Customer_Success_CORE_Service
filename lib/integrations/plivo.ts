/**
 * Plivo SMS and Call Integration
 * Alternative voice/SMS provider implementation
 * Implements VoiceProvider interface for abstraction
 */

import type { VoiceProvider } from '@/lib/interfaces/voice-provider'

const PLIVO_AUTH_ID = process.env.PLIVO_AUTH_ID || ''
const PLIVO_AUTH_TOKEN = process.env.PLIVO_AUTH_TOKEN || ''
const PLIVO_PHONE_NUMBER = process.env.PLIVO_PHONE_NUMBER || ''

export class PlivoClient implements VoiceProvider {
  private authId: string
  private authToken: string
  private phoneNumber: string
  private baseUrl: string

  constructor(
    authId: string = PLIVO_AUTH_ID,
    authToken: string = PLIVO_AUTH_TOKEN,
    phoneNumber: string = PLIVO_PHONE_NUMBER
  ) {
    this.authId = authId
    this.authToken = authToken
    this.phoneNumber = phoneNumber
    this.baseUrl = `https://api.plivo.com/v1/Account/${authId}`
  }

  /**
   * Send SMS via Plivo
   */
  async sendSMS(options: {
    to: string
    message: string
    from?: string
  }): Promise<{
    messageId: string
    status: 'sent' | 'delivered' | 'failed'
  }> {
    if (!this.authId || !this.authToken) {
      throw new Error('Plivo credentials not configured')
    }

    const credentials = Buffer.from(`${this.authId}:${this.authToken}`).toString('base64')

    const response = await fetch(`${this.baseUrl}/Message/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        src: options.from || this.phoneNumber,
        dst: options.to,
        text: options.message,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Plivo API error: ${error.error || response.statusText}`)
    }

    const data = await response.json()

    return {
      messageId: data.message_uuid?.[0] || '',
      status: 'sent', // Plivo doesn't provide immediate status
    }
  }

  /**
   * Make a phone call via Plivo
   */
  async makeCall(options: {
    to: string
    from?: string
    url?: string
    record?: boolean
  }): Promise<{ callId: string }> {
    if (!this.authId || !this.authToken) {
      throw new Error('Plivo credentials not configured')
    }

    const credentials = Buffer.from(`${this.authId}:${this.authToken}`).toString('base64')

    const response = await fetch(`${this.baseUrl}/Call/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || this.phoneNumber,
        to: options.to,
        answer_url: options.url || '',
        record: options.record || false,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Plivo API error: ${error.error || response.statusText}`)
    }

    const data = await response.json()

    return {
      callId: data.request_uuid || '',
    }
  }

  /**
   * Parse incoming SMS from Plivo webhook
   */
  parseIncomingSMS(webhookData: any): {
    from: string
    to: string
    message: string
    messageId: string
  } {
    return {
      from: webhookData.From || webhookData.from || '',
      to: webhookData.To || webhookData.to || '',
      message: webhookData.Text || webhookData.text || webhookData.Body || webhookData.body || '',
      messageId: webhookData.MessageUUID || webhookData.message_uuid || '',
    }
  }

  /**
   * Parse incoming call status from Plivo webhook
   */
  parseCallStatus(webhookData: any): {
    callId: string
    from: string
    to: string
    status: string
    duration?: number
    recordingUrl?: string
  } {
    return {
      callId: webhookData.CallUUID || webhookData.call_uuid || '',
      from: webhookData.From || webhookData.from || '',
      to: webhookData.To || webhookData.to || '',
      status: webhookData.CallStatus || webhookData.call_status || '',
      duration: webhookData.CallDuration
        ? parseInt(webhookData.CallDuration || webhookData.call_duration)
        : undefined,
      recordingUrl: webhookData.RecordingUrl || webhookData.recording_url || undefined,
    }
  }
}

export const plivoClient = new PlivoClient()
