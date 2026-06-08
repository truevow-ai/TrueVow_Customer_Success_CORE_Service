/**
 * Communication Sender Service
 * 
 * Unified service for sending communications (email, SMS, calls)
 * Used by post-onboarding flows and other automated communication triggers
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { resendClient } from '@/lib/integrations/resend'

export interface SendCommunicationRequest {
  templateKey: string
  to: string
  variables?: Record<string, any>
  tenantId: string
  customerEmail: string
  metadata?: Record<string, any>
  type?: 'email' | 'sms' | 'call'
}

export interface SendCommunicationResult {
  success: boolean
  messageId?: string
  error?: string
}

export class CommunicationSenderService {
  /**
   * Send a communication using the appropriate channel
   */
  static async sendCommunication(request: SendCommunicationRequest): Promise<SendCommunicationResult> {
    const { templateKey, to, variables, tenantId, customerEmail, metadata, type = 'email' } = request

    try {
      // Route to appropriate sender based on type
      switch (type) {
        case 'email':
          return await this.sendEmail(templateKey, to, variables, tenantId, customerEmail, metadata)
        case 'sms':
          return await this.sendSms(templateKey, to, variables, tenantId, customerEmail, metadata)
        case 'call':
          return await this.logCall(templateKey, to, variables, tenantId, customerEmail, metadata)
        default:
          return { success: false, error: `Unknown communication type: ${type}` }
      }
    } catch (error) {
      console.error('Communication send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send an email
   */
  private static async sendEmail(
    templateKey: string,
    to: string,
    variables?: Record<string, any>,
    tenantId?: string,
    customerEmail?: string,
    metadata?: Record<string, any>
  ): Promise<SendCommunicationResult> {
    const supabase = await createServerSupabase()

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('cs_communication_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('channel', 'email')
      .single()

    if (templateError || !template) {
      // Use a basic template if not found
      console.warn(`Email template not found: ${templateKey}, using default`)
    }

    // Build email content
    const subject = this.interpolateVariables(template?.subject || `Check-in: ${templateKey}`, variables)
    const htmlContent = this.interpolateVariables(template?.body_html || template?.body_text || '', variables)
    const textContent = template?.body_text ? this.interpolateVariables(template.body_text, variables) : undefined

    // Get from email from environment or template
    const fromEmail = template?.from_address || process.env.EMAIL_FROM_ADDRESS || 'noreply@truevow.com'

    try {
      // Send via Resend
      const result = await resendClient.sendEmail({
        from: fromEmail,
        to,
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'template_key', value: templateKey },
          { name: 'tenant_id', value: tenantId || 'unknown' },
        ],
      })

      // Log the email send
      await supabase.from('cs_email_sends').insert({
        email_id: result.id,
        to_email: to,
        from_email: fromEmail,
        subject,
        template_id: template?.template_id,
        status: 'sent',
        metadata: {
          template_key: templateKey,
          tenant_id: tenantId,
          customer_email: customerEmail,
          ...metadata,
        },
      })

      return { success: true, messageId: result.id }
    } catch (error) {
      // Log failed send
      await supabase.from('cs_email_sends').insert({
        to_email: to,
        from_email: fromEmail,
        subject,
        template_id: template?.template_id,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          template_key: templateKey,
          tenant_id: tenantId,
          customer_email: customerEmail,
          ...metadata,
        },
      })

      throw error
    }
  }

  /**
   * Send an SMS
   */
  private static async sendSms(
    templateKey: string,
    to: string,
    variables?: Record<string, any>,
    tenantId?: string,
    customerEmail?: string,
    metadata?: Record<string, any>
  ): Promise<SendCommunicationResult> {
    const supabase = await createServerSupabase()

    // Get SMS template
    const { data: template, error: templateError } = await supabase
      .from('cs_communication_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('channel', 'sms')
      .single()

    if (templateError || !template) {
      console.warn(`SMS template not found: ${templateKey}`)
    }

    // Build SMS content
    const message = this.interpolateVariables(template?.body_text || templateKey, variables)

    // Get Twilio credentials from environment
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
      console.warn('Twilio credentials not configured, logging SMS only')
      
      // Log as pending
      await supabase.from('cs_sms_logs').insert({
        to_number: to,
        from_number: twilioFromNumber || 'unknown',
        message,
        status: 'pending',
        metadata: {
          template_key: templateKey,
          tenant_id: tenantId,
          customer_email: customerEmail,
          ...metadata,
        },
      })

      return { success: false, error: 'SMS not configured' }
    }

    try {
      // Send via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
      const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')
      
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioFromNumber,
          To: to,
          Body: message,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Twilio error')
      }

      // Log the SMS send
      await supabase.from('cs_sms_logs').insert({
        sms_id: result.sid,
        to_number: to,
        from_number: twilioFromNumber,
        message,
        status: 'sent',
        metadata: {
          template_key: templateKey,
          tenant_id: tenantId,
          customer_email: customerEmail,
          ...metadata,
        },
      })

      return { success: true, messageId: result.sid }
    } catch (error) {
      // Log failed send
      await supabase.from('cs_sms_logs').insert({
        to_number: to,
        from_number: twilioFromNumber || 'unknown',
        message,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          template_key: templateKey,
          tenant_id: tenantId,
          customer_email: customerEmail,
          ...metadata,
        },
      })

      throw error
    }
  }

  /**
   * Log a call (actual calling handled by unified-dialer-service)
   */
  private static async logCall(
    templateKey: string,
    to: string,
    variables?: Record<string, any>,
    tenantId?: string,
    customerEmail?: string,
    metadata?: Record<string, any>
  ): Promise<SendCommunicationResult> {
    const supabase = await createServerSupabase()

    // Create a call log entry for tracking purposes
    const { data: callLog, error } = await supabase
      .from('cs_call_logs')
      .insert({
        to_number: to,
        from_number: process.env.TWILIO_PHONE_NUMBER || 'unknown',
        direction: 'outbound',
        status: 'initiated',
        metadata: {
          template_key: templateKey,
          tenant_id: tenantId,
          customer_email: customerEmail,
          variables,
          ...metadata,
        },
      })
      .select('log_id')
      .single()

    if (error) {
      throw error
    }

    return { success: true, messageId: callLog.log_id }
  }

  /**
   * Interpolate variables into a template string
   */
  private static interpolateVariables(template: string, variables?: Record<string, any>): string {
    if (!variables) return template

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match
    })
  }
}
