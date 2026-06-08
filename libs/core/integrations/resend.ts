/**
 * Resend Email Integration Client
 * 
 * Provides email sending and webhook verification for Resend
 */

import crypto from 'crypto'
import { EXTERNAL_API_URLS } from '@/lib/config/app-config'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_API_URL = EXTERNAL_API_URLS.RESEND_API_URL

export interface ResendEmailOptions {
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  reply_to?: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  headers?: Record<string, string>
  tags?: Array<{ name: string; value: string }>
}

export interface ResendEmailResponse {
  id: string
  from: string
  to: string[]
  created_at: string
}

export interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained' | 'email.unsubscribed'
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject?: string
    clicked_link?: string
    bounce_reason?: string
    complain_reason?: string
    timestamp: string
  }
}

export class ResendClient {
  private apiKey: string
  private apiUrl: string

  constructor(apiKey: string = RESEND_API_KEY, apiUrl: string = RESEND_API_URL) {
    this.apiKey = apiKey
    this.apiUrl = apiUrl
  }

  /**
   * Send an email via Resend
   */
  async sendEmail(options: ResendEmailOptions): Promise<ResendEmailResponse> {
    if (!this.apiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const response = await fetch(`${this.apiUrl}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }

    return response.json()
  }

  /**
   * Get email by ID
   */
  async getEmail(emailId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const response = await fetch(`${this.apiUrl}/emails/${emailId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }

    return response.json()
  }

  /**
   * Verify webhook signature
   * Uses HMAC-SHA256 to verify the signature
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    if (!secret || !signature) {
      return false
    }

    try {
      // Resend uses HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64')

      // Use timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  /**
   * Parse webhook event
   */
  static parseWebhookEvent(payload: string): ResendWebhookEvent {
    return JSON.parse(payload) as ResendWebhookEvent
  }
}

// Export singleton instance
export const resendClient = new ResendClient()
