/**
 * Voice Provider Interface
 * Abstraction layer for different voice/SMS providers (Twilio, Plivo, etc.)
 */

export interface VoiceProvider {
  /**
   * Send SMS
   */
  sendSMS(options: {
    to: string
    message: string
    from?: string
  }): Promise<{
    messageId: string
    status: 'sent' | 'delivered' | 'failed'
  }>

  /**
   * Make a phone call
   */
  makeCall(options: {
    to: string
    from?: string
    url?: string
    record?: boolean
  }): Promise<{
    callId: string
  }>

  /**
   * Parse incoming SMS from webhook
   */
  parseIncomingSMS(webhookData: any): {
    from: string
    to: string
    message: string
    messageId: string
  }

  /**
   * Parse incoming call status from webhook
   */
  parseCallStatus(webhookData: any): {
    callId: string
    from: string
    to: string
    status: string
    duration?: number
    recordingUrl?: string
  }
}
