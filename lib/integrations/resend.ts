/**
 * Resend Email Integration
 * Handles email sending via Resend
 */

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_CS_SUPPORT_API_KEY || process.env.RESEND_API_KEY || ''
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'support@truevow.com'
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'TrueVow Support'

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  inReplyTo?: string
  references?: string[]
  attachments?: Array<{
    content: string | Buffer
    filename: string
    type?: string
  }>
  tags?: Array<{ name: string; value: string }>
  metadata?: Record<string, string>
}

interface ResendResponse {
  messageId: string
  status: 'sent' | 'delivered' | 'bounced' | 'failed'
}

export class ResendClient {
  private client: Resend
  private fromEmail: string
  private fromName: string

  constructor(
    apiKey: string = RESEND_API_KEY,
    fromEmail: string = RESEND_FROM_EMAIL,
    fromName: string = RESEND_FROM_NAME
  ) {
    if (!apiKey) {
      throw new Error('Resend API key not configured')
    }
    this.client = new Resend(apiKey)
    this.fromEmail = fromEmail
    this.fromName = fromName
  }

  /**
   * Send an email via Resend
   */
  async sendEmail(options: SendEmailOptions): Promise<ResendResponse> {
    if (!RESEND_API_KEY) {
      throw new Error('Resend API key not configured')
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to]

    const payload: any = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: recipients,
      subject: options.subject,
      ...(options.html && { html: options.html }),
      ...(options.text && { text: options.text }),
      ...(options.replyTo && { reply_to: [options.replyTo] }),
      ...(options.attachments && {
        attachments: options.attachments.map((att) => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
        })),
      }),
      ...(options.tags && { tags: options.tags }),
      ...(options.metadata && { metadata: options.metadata }),
    }

    // Add headers for threading
    if (options.inReplyTo || options.references) {
      payload.headers = {}
      if (options.inReplyTo) {
        payload.headers['In-Reply-To'] = options.inReplyTo
      }
      if (options.references && options.references.length > 0) {
        payload.headers['References'] = options.references.join(' ')
      }
    }

    try {
      const { data, error } = await this.client.emails.send(payload)

      if (error) {
        throw new Error(`Resend API error: ${JSON.stringify(error)}`)
      }

      if (!data || !data.id) {
        throw new Error('Resend API returned no message ID')
      }

      return {
        messageId: data.id,
        status: 'sent',
      }
    } catch (error: any) {
      throw new Error(`Failed to send email via Resend: ${error.message}`)
    }
  }

  /**
   * Verify webhook signature
   * Resend uses HMAC-SHA256 with the signing secret
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    if (!signature || !secret) {
      return false
    }

    try {
      const crypto = require('crypto')
      
      // Remove 'whsec_' prefix if present
      const cleanSecret = secret.replace('whsec_', '')
      
      // Create HMAC
      const hmac = crypto.createHmac('sha256', cleanSecret)
      hmac.update(payload)
      const expectedSignature = hmac.digest('hex')
      
      // Compare signatures (Resend sends signature in header)
      const providedSignature = signature.replace('whsec_', '').trim()
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      )
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }
}

export const resendClient = RESEND_API_KEY ? new ResendClient() : null
