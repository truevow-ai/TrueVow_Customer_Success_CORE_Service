/**
 * Enhanced Email Service
 * 
 * Handles email sending via Resend with tracking and analytics
 * Integrates with cs_email_sends table for delivery tracking
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { Resend } from 'resend'
import { EmailTemplates } from './email-templates'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_CS_SUPPORT_API_KEY)

export interface EmailSendOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  fromName?: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}

export interface EmailSendResult {
  id: string
  success: boolean
  error?: string
  providerId?: string
}

export class EnhancedEmailService {
  /**
   * Send email via Resend with tracking
   */
  static async sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
    const supabase = await createServerSupabase()
    
    try {
      // Create email record first
      const { data: emailRecord, error: insertError } = await supabase
        .from('cs_email_sends')
        .insert({
          recipient_email: Array.isArray(options.to) ? options.to[0] : options.to,
          subject: options.subject,
          body_html: options.html,
          body_text: options.text,
          status: 'sending',
          sent_at: new Date().toISOString(),
          provider: 'resend'
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create email record: ${insertError.message}`)
      }

      // Send via Resend
      const response = await resend.emails.send({
        from: `${options.fromName || process.env.RESEND_FROM_NAME || 'TrueVow Support'} <${options.from || process.env.RESEND_FROM_EMAIL || 'support@intakely.xyz'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html || '',
        text: options.text || '',
        reply_to: options.replyTo,
        tags: options.tags
      })

      if (response.error) {
        // Update record with failure
        await supabase
          .from('cs_email_sends')
          .update({
            status: 'failed',
            error_message: response.error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', emailRecord.id)

        return {
          id: emailRecord.id,
          success: false,
          error: response.error.message
        }
      }

      // Update record with success
      await supabase
        .from('cs_email_sends')
        .update({
          status: 'sent',
          provider_message_id: response.data?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailRecord.id)

      return {
        id: emailRecord.id,
        success: true,
        providerId: response.data?.id
      }

    } catch (error: any) {
      // Log error in database
      await supabase
        .from('cs_email_sends')
        .insert({
          recipient_email: Array.isArray(options.to) ? options.to[0] : options.to,
          subject: options.subject,
          body_html: options.html,
          body_text: options.text,
          status: 'failed',
          error_message: error.message,
          sent_at: new Date().toISOString(),
          provider: 'resend'
        })

      return {
        id: 'error-' + Date.now(),
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get email send status
   */
  static async getEmailStatus(emailId: string): Promise<any> {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cs_email_sends')
      .select('*')
      .eq('id', emailId)
      .single()

    if (error) {
      throw new Error(`Failed to get email status: ${error.message}`)
    }

    return data
  }

  /**
   * Send templated email
   */
  static async sendTemplatedEmail(
    templateName: keyof typeof EmailTemplates,
    variables: Record<string, string | number | boolean | null | undefined>,
    options: Omit<EmailSendOptions, 'html' | 'text'>
  ): Promise<EmailSendResult> {
    // Generate HTML from template
    const html = EmailTemplates[templateName](variables)
    
    // Generate plain text version (simple conversion)
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    return this.sendEmail({
      ...options,
      html,
      text
    })
  }

  /**
   * Send welcome email to new customers
   */
  static async sendWelcomeEmail(
    customerEmail: string,
    variables: Record<string, string | number | boolean | null | undefined>
  ): Promise<EmailSendResult> {
    return this.sendTemplatedEmail('welcome', variables, {
      to: customerEmail,
      subject: `Welcome to ${variables.company_name || 'TrueVow'}!`
    })
  }

  /**
   * Send onboarding reminder email
   */
  static async sendOnboardingReminder(
    customerEmail: string,
    variables: Record<string, string | number | boolean | null | undefined>
  ): Promise<EmailSendResult> {
    return this.sendTemplatedEmail('onboardingReminder', variables, {
      to: customerEmail,
      subject: 'Action Required: Complete Your Onboarding'
    })
  }

  /**
   * Send health score alert email
   */
  static async sendHealthScoreAlert(
    customerEmail: string,
    variables: Record<string, string | number | boolean | null | undefined>
  ): Promise<EmailSendResult> {
    return this.sendTemplatedEmail('healthScoreAlert', variables, {
      to: customerEmail,
      subject: 'Important: Account Health Update Required'
    })
  }

  /**
   * Send training invitation email
   */
  static async sendTrainingInvitation(
    customerEmail: string,
    variables: Record<string, string | number | boolean | null | undefined>
  ): Promise<EmailSendResult> {
    return this.sendTemplatedEmail('trainingInvitation', variables, {
      to: customerEmail,
      subject: `Invitation: ${variables.training_topic} Training Session`
    })
  }

  /**
   * Send escalation notification email
   */
  static async sendEscalationNotification(
    customerEmail: string,
    variables: Record<string, string | number | boolean | null | undefined>
  ): Promise<EmailSendResult> {
    return this.sendTemplatedEmail('escalationNotification', variables, {
      to: customerEmail,
      subject: `Update: Ticket #${variables.ticket_id} Escalated`
    })
  }

  /**
   * Send renewal reminder email
   */
  static async sendRenewalReminder(
    customerEmail: string,
    variables: Record<string, string | number | boolean | null | undefined>
  ): Promise<EmailSendResult> {
    return this.sendTemplatedEmail('renewalReminder', variables, {
      to: customerEmail,
      subject: 'Subscription Renewal Reminder'
    })
  }

  /**
   * Get email statistics
   */
  static async getEmailStats(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<any> {
    const supabase = await createServerSupabase()
    
    const startDate = new Date()
    if (timeframe === '24h') {
      startDate.setDate(startDate.getDate() - 1)
    } else if (timeframe === '7d') {
      startDate.setDate(startDate.getDate() - 7)
    } else {
      startDate.setDate(startDate.getDate() - 30)
    }

    const { data, error } = await supabase
      .from('cs_email_sends')
      .select('status')
      .gte('sent_at', startDate.toISOString())

    if (error) {
      throw new Error(`Failed to get email stats: ${error.message}`)
    }

    const stats = {
      total: data.length,
      sent: data.filter(e => e.status === 'sent').length,
      failed: data.filter(e => e.status === 'failed').length,
      pending: data.filter(e => e.status === 'sending').length
    }

    return stats
  }
}