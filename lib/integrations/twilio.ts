/**
 * Twilio SMS and Call Integration
 * Handles SMS sending/receiving and call management via Twilio
 * Implements VoiceProvider interface for abstraction
 */

import type { VoiceProvider } from '@/lib/interfaces/voice-provider'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || ''
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || ''

export class TwilioClient implements VoiceProvider {
  private accountSid: string
  private authToken: string
  private phoneNumber: string
  private baseUrl: string

  constructor(
    accountSid: string = TWILIO_ACCOUNT_SID,
    authToken: string = TWILIO_AUTH_TOKEN,
    phoneNumber: string = TWILIO_PHONE_NUMBER
  ) {
    this.accountSid = accountSid
    this.authToken = authToken
    this.phoneNumber = phoneNumber
    this.baseUrl = `https://${accountSid}:${authToken}@api.twilio.com/2010-04-01/Accounts/${accountSid}`
  }

  /**
   * Send SMS via Twilio
   */
  async sendSMS(options: {
    to: string
    message: string
    from?: string
  }): Promise<{
    messageId: string
    status: 'sent' | 'delivered' | 'failed'
  }> {
    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio credentials not configured')
    }

    const formData = new URLSearchParams()
    formData.append('To', options.to)
    formData.append('From', options.from || this.phoneNumber)
    formData.append('Body', options.message)

    const response = await fetch(`${this.baseUrl}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Twilio API error: ${error.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      messageId: data.sid,
      status: data.status === 'sent' ? 'sent' : 'failed',
    }
  }

  /**
   * Make a phone call via Twilio
   */
  async makeCall(options: {
    to: string
    from?: string
    url?: string
    record?: boolean
  }): Promise<{ callId: string }> {
    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio credentials not configured')
    }

    const formData = new URLSearchParams()
    formData.append('To', options.to)
    formData.append('From', options.from || this.phoneNumber)
    if (options.url) {
      formData.append('Url', options.url)
    }
    if (options.record) {
      formData.append('Record', 'true')
    }

    const response = await fetch(`${this.baseUrl}/Calls.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Twilio API error: ${error.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      callId: data.sid,
    }
  }

  /**
   * Parse incoming SMS from Twilio webhook
   */
  parseIncomingSMS(webhookData: any): {
    from: string
    to: string
    message: string
    messageId: string
  } {
    return {
      from: webhookData.From || '',
      to: webhookData.To || '',
      message: webhookData.Body || '',
      messageId: webhookData.MessageSid || '',
    }
  }

  /**
   * Parse incoming call status from Twilio webhook
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
      callId: webhookData.CallSid || '',
      from: webhookData.From || '',
      to: webhookData.To || '',
      status: webhookData.CallStatus || '',
      duration: webhookData.CallDuration
        ? parseInt(webhookData.CallDuration)
        : undefined,
      recordingUrl: webhookData.RecordingUrl || undefined,
    }
  }

  /**
   * Send WhatsApp message via Twilio WhatsApp Business API
   */
  async sendWhatsApp(options: {
    to: string
    message: string
    from?: string
    mediaUrl?: string[]
  }): Promise<{
    messageId: string
    status: 'sent' | 'delivered' | 'failed'
  }> {
    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio credentials not configured')
    }

    const whatsappFrom = options.from || TWILIO_WHATSAPP_NUMBER || this.phoneNumber
    // Ensure WhatsApp number format (whatsapp:+1234567890)
    const formattedFrom = whatsappFrom.startsWith('whatsapp:') 
      ? whatsappFrom 
      : `whatsapp:${whatsappFrom.replace(/^\+/, '')}`
    const formattedTo = options.to.startsWith('whatsapp:')
      ? options.to
      : `whatsapp:${options.to.replace(/^\+/, '')}`

    const formData = new URLSearchParams()
    formData.append('To', formattedTo)
    formData.append('From', formattedFrom)
    formData.append('Body', options.message)

    // Add media URLs if provided
    if (options.mediaUrl && options.mediaUrl.length > 0) {
      options.mediaUrl.forEach((url, index) => {
        formData.append(`MediaUrl${index}`, url)
      })
    }

    const response = await fetch(`${this.baseUrl}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Twilio WhatsApp API error: ${error.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      messageId: data.sid,
      status: data.status === 'sent' || data.status === 'queued' ? 'sent' : 'failed',
    }
  }

  /**
   * Parse incoming WhatsApp message from Twilio webhook
   */
  parseIncomingWhatsApp(webhookData: any): {
    from: string
    to: string
    message: string
    messageId: string
    mediaUrl?: string[]
  } {
    const mediaUrls: string[] = []
    if (webhookData.NumMedia && parseInt(webhookData.NumMedia) > 0) {
      for (let i = 0; i < parseInt(webhookData.NumMedia); i++) {
        const mediaUrl = webhookData[`MediaUrl${i}`]
        if (mediaUrl) {
          mediaUrls.push(mediaUrl)
        }
      }
    }

    return {
      from: webhookData.From?.replace('whatsapp:', '') || '',
      to: webhookData.To?.replace('whatsapp:', '') || '',
      message: webhookData.Body || '',
      messageId: webhookData.MessageSid || '',
      mediaUrl: mediaUrls.length > 0 ? mediaUrls : undefined,
    }
  }
}

export const twilioClient = new TwilioClient()

