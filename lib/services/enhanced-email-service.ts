/**
 * Enhanced Email Service
 * 
 * Production-grade email service with Resend integration:
 * - Rate limiting
 * - UTM tracking
 * - Compliance footer
 * - Unsubscribe token generation
 * - Audit logging
 */

import { resendClient } from '@/lib/integrations/resend'
import { EmailComplianceFooterService } from './email-compliance-footer'
import { EmailUTMTrackingService } from './email-utm-tracking'
import { EmailRateLimiterService } from './email-rate-limiter'
import { createServerSupabase } from '@/lib/db/supabase'
import crypto from 'crypto'

export interface EnhancedEmailOptions {
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
  // Personalization
  personalize?: boolean
  leadId?: string
  customerEmail?: string
  // UTM tracking
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  sequenceId?: string
  // Compliance
  unsubscribeToken?: string
  jurisdiction?: 'US' | 'EU' | 'CA' | 'UK' | 'AU' | 'GLOBAL'
  // Metadata
  metadata?: Record<string, string>
  tags?: Array<{ name: string; value: string }>
}

export interface EnhancedEmailResponse {
  emailId: string
  messageId: string
  status: 'sent' | 'delivered' | 'bounced' | 'failed'
  unsubscribeToken?: string
}

export class EnhancedEmailService {
  /**
   * Generate unsubscribe token
   */
  static generateUnsubscribeToken(email: string, leadId?: string): string {
    const data = `${email}:${leadId || 'none'}:${Date.now()}`
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Send enhanced email with all features
   */
  static async sendEmail(options: EnhancedEmailOptions): Promise<EnhancedEmailResponse> {
    if (!resendClient) {
      throw new Error('Resend client not configured. Please set RESEND_CS_SUPPORT_API_KEY in environment variables.')
    }

    // Extract domain from from email
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'support@truevow.com'
    const domain = fromEmail.split('@')[1] || 'truevow.com'

    // Check rate limit
    const rateLimit = await EmailRateLimiterService.checkRateLimit(domain)
    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds.`
      )
    }

    // Generate unsubscribe token if not provided
    const unsubscribeToken =
      options.unsubscribeToken ||
      this.generateUnsubscribeToken(
        Array.isArray(options.to) ? options.to[0] : options.to,
        options.leadId
      )

    // Process HTML content
    let html = options.html
    if (html) {
      // Add UTM tracking to all links
      html = EmailUTMTrackingService.addUTMToHTML(html, {
        source: options.utmSource || 'cs-support',
        medium: options.utmMedium || 'email',
        campaign: options.utmCampaign,
        term: options.utmTerm,
        content: options.utmContent,
        leadId: options.leadId,
        emailId: undefined, // Will be set after sending
        sequenceId: options.sequenceId,
      })

      // Add compliance footer
      html = EmailComplianceFooterService.appendToHTML(html, {
        unsubscribeToken,
        jurisdiction: options.jurisdiction,
      })
    }

    // Process text content
    let text = options.text
    if (text) {
      // Add compliance footer
      text = EmailComplianceFooterService.appendToText(text, {
        unsubscribeToken,
        jurisdiction: options.jurisdiction,
      })
    }

    // Personalize content if requested
    if (options.personalize && options.customerEmail) {
      html = html?.replace(/\{\{customer_name\}\}/g, options.customerEmail.split('@')[0])
      text = text?.replace(/\{\{customer_name\}\}/g, options.customerEmail.split('@')[0])
    }

    // Send email via Resend
    const response = await resendClient.sendEmail({
      to: options.to,
      subject: options.subject,
      html,
      text,
      replyTo: options.replyTo,
      inReplyTo: options.inReplyTo,
      references: options.references,
      attachments: options.attachments,
      tags: options.tags,
      metadata: {
        ...options.metadata,
        unsubscribe_token: unsubscribeToken,
        lead_id: options.leadId || '',
        sequence_id: options.sequenceId || '',
      },
    })

    // Record email send for rate limiting
    await EmailRateLimiterService.recordEmailSend(
      domain,
      response.messageId,
      Array.isArray(options.to) ? options.to[0] : options.to,
      options.subject
    )

    // Store unsubscribe token in database
    const supabase = createServerSupabase()
    await supabase.from('cs_email_unsubscribes').insert({
      token: unsubscribeToken,
      email: Array.isArray(options.to) ? options.to[0] : options.to,
      email_id: response.messageId,
      created_at: new Date().toISOString(),
    }).catch((error) => {
      // Ignore duplicate key errors
      if (error.code !== '23505') {
        console.error('Error storing unsubscribe token:', error)
      }
    })

    return {
      emailId: response.messageId,
      messageId: response.messageId,
      status: response.status,
      unsubscribeToken,
    }
  }
}
