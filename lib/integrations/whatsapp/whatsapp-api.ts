/**
 * WhatsApp Business API Client (Facebook)
 * 
 * Optional integration for WhatsApp Business API via Facebook Graph API.
 * Currently, the service uses Twilio WhatsApp Business API, but this client
 * provides an alternative if you want to use Facebook's WhatsApp Business API directly.
 * 
 * Note: This is optional. The unified messaging service uses Twilio by default.
 */

const WHATSAPP_BUSINESS_API_URL =
  process.env.WHATSAPP_BUSINESS_API_URL || 'https://graph.facebook.com/v18.0'
const WHATSAPP_BUSINESS_PHONE_NUMBER_ID = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID || ''
const WHATSAPP_BUSINESS_ACCESS_TOKEN = process.env.WHATSAPP_BUSINESS_ACCESS_TOKEN || ''
const WHATSAPP_BUSINESS_APP_ID = process.env.WHATSAPP_BUSINESS_APP_ID || ''
const WHATSAPP_BUSINESS_APP_SECRET = process.env.WHATSAPP_BUSINESS_APP_SECRET || ''
const WHATSAPP_WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || ''

export interface WhatsAppMessageOptions {
  to: string
  message: string
  templateName?: string
  templateParams?: Record<string, string>
  mediaUrl?: string[]
}

export interface WhatsAppMessageResult {
  messageId: string
  status: 'sent' | 'delivered' | 'failed'
}

export class WhatsAppBusinessAPIClient {
  private phoneNumberId: string
  private accessToken: string
  private apiUrl: string

  constructor(
    phoneNumberId: string = WHATSAPP_BUSINESS_PHONE_NUMBER_ID,
    accessToken: string = WHATSAPP_BUSINESS_ACCESS_TOKEN,
    apiUrl: string = WHATSAPP_BUSINESS_API_URL
  ) {
    this.phoneNumberId = phoneNumberId
    this.accessToken = accessToken
    this.apiUrl = apiUrl
  }

  /**
   * Send WhatsApp message via Facebook Graph API
   */
  async sendMessage(options: WhatsAppMessageOptions): Promise<WhatsAppMessageResult> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('WhatsApp Business API credentials not configured')
    }

    // Format phone number (E.164 format)
    const to = options.to.startsWith('+') ? options.to : `+${options.to}`

    // If using template, send template message
    if (options.templateName) {
      return this.sendTemplateMessage(to, options.templateName, options.templateParams || {})
    }

    // Send text message
    const response = await fetch(
      `${this.apiUrl}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            body: options.message,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp Business API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      messageId: data.messages[0]?.id || '',
      status: 'sent',
    }
  }

  /**
   * Send template message (for first contact)
   */
  private async sendTemplateMessage(
    to: string,
    templateName: string,
    templateParams: Record<string, string>
  ): Promise<WhatsAppMessageResult> {
    const response = await fetch(
      `${this.apiUrl}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en',
            },
            components: Object.keys(templateParams).length > 0
              ? [
                  {
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                      type: 'text',
                      text: value,
                    })),
                  },
                ]
              : undefined,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp Business API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      messageId: data.messages[0]?.id || '',
      status: 'sent',
    }
  }

  /**
   * Send media message (image, document, video)
   */
  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    mediaType: 'image' | 'document' | 'video' | 'audio'
  ): Promise<WhatsAppMessageResult> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('WhatsApp Business API credentials not configured')
    }

    const formattedTo = to.startsWith('+') ? to : `+${to}`

    const response = await fetch(
      `${this.apiUrl}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: mediaType,
          [mediaType]: {
            link: mediaUrl,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp Business API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      messageId: data.messages[0]?.id || '',
      status: 'sent',
    }
  }

  /**
   * Verify webhook (for WhatsApp webhook setup)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      return challenge
    }
    return null
  }

  /**
   * Parse incoming WhatsApp message from webhook
   */
  parseIncomingMessage(webhookData: any): {
    from: string
    to: string
    message: string
    messageId: string
    mediaUrl?: string[]
    timestamp: string
  } {
    const entry = webhookData.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    if (!message) {
      throw new Error('Invalid webhook data: no message found')
    }

    const mediaUrls: string[] = []
    if (message.type === 'image' || message.type === 'document' || message.type === 'video') {
      const media = message[message.type]
      if (media?.id) {
        // Media URL would need to be fetched separately using media ID
        // For now, store the media ID
        mediaUrls.push(media.id)
      }
    }

    return {
      from: message.from,
      to: value.metadata?.phone_number_id || '',
      message: message.text?.body || '',
      messageId: message.id,
      mediaUrl: mediaUrls.length > 0 ? mediaUrls : undefined,
      timestamp: message.timestamp,
    }
  }
}

// Export singleton instance
export const whatsappBusinessAPIClient = new WhatsAppBusinessAPIClient()
