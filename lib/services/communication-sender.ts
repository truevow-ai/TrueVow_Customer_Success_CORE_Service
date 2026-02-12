/**
 * Communication Sender Service
 * 
 * Sends communications (email, SMS) using templates:
 * - Renders templates with variables
 * - Sends via Resend (email) or Twilio (SMS)
 * - Tracks sent communications in database
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { CommunicationTemplatesService, TemplateRenderOptions } from './communication-templates'
import { EnhancedEmailService } from './enhanced-email-service'
import { resendClient } from '@/lib/integrations/resend'
import { salesServiceClient } from '@/lib/integrations/sales-client'
import { twilioClient } from '@/lib/integrations/twilio'
import { UnifiedMessagingService } from './unified-messaging-service'

export interface SendCommunicationOptions {
  templateKey: string
  to: string | string[]
  variables: TemplateRenderOptions
  tenantId: string
  customerEmail: string
  scheduledAt?: string
  metadata?: Record<string, any>
}

export interface SendCommunicationResult {
  communicationId: string
  status: 'sent' | 'pending' | 'failed'
  messageId?: string
  error?: string
}

export class CommunicationSenderService {
  /**
   * Send email using template
   */
  static async sendEmail(options: SendCommunicationOptions): Promise<SendCommunicationResult> {
    const supabase = createServerSupabase()

    try {
      // Get template
      const template = await CommunicationTemplatesService.getTemplateByKey(
        options.templateKey,
        options.tenantId
      )

      if (!template) {
        throw new Error(`Template ${options.templateKey} not found`)
      }

      if (template.template_type !== 'email') {
        throw new Error(`Template ${options.templateKey} is not an email template`)
      }

      // Render template
      const rendered = CommunicationTemplatesService.renderTemplate(template, options.variables)

      // Note: Email record will be created by EnhancedEmailService in cs_email_sends table
      // We'll track it via the email_id returned from the send operation

      // Send email via Resend
      try {
        const emailResponse = await EnhancedEmailService.sendEmail({
          to: options.to,
          subject: rendered.subject || template.subject || 'TrueVow Update',
          html: template.body_html ? CommunicationTemplatesService.renderTemplate(template, options.variables).body_html : undefined,
          text: rendered.body,
          replyTo: template.reply_to_email || undefined,
          metadata: {
            ...options.metadata,
            template_key: template.template_key,
          },
          tags: [
            { name: 'template_key', value: template.template_key },
            { name: 'category', value: template.category || 'general' },
          ],
        })

        // Email record is already created in cs_email_sends by EnhancedEmailService
        // Update it with additional metadata if needed
        if (emailResponse.emailId) {
          await supabase
            .from('cs_email_sends')
            .update({
              metadata: {
                ...options.metadata,
                template_key: template.template_key,
                customer_email: options.customerEmail,
                tenant_id: options.tenantId,
              },
            })
            .eq('email_id', emailResponse.emailId)
        }

        // Update template usage count
        await supabase
          .from('cs_communication_templates')
          .update({
            usage_count: template.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('template_key', template.template_key)

        return {
          communicationId: emailResponse.emailId || '',
          status: 'sent',
          messageId: emailResponse.messageId,
        }
      } catch (sendError) {
        // EnhancedEmailService handles error logging in cs_email_sends
        throw sendError
      }
    } catch (error) {
      return {
        communicationId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send SMS using template
   */
  static async sendSMS(options: SendCommunicationOptions): Promise<SendCommunicationResult> {
    const supabase = createServerSupabase()

    try {
      // Get template
      const template = await CommunicationTemplatesService.getTemplateByKey(
        options.templateKey,
        options.tenantId
      )

      if (!template) {
        throw new Error(`Template ${options.templateKey} not found`)
      }

      if (template.template_type !== 'sms') {
        throw new Error(`Template ${options.templateKey} is not an SMS template`)
      }

      // Render template
      const rendered = CommunicationTemplatesService.renderTemplate(template, options.variables)

      // Validate SMS length (1600 characters max)
      if (rendered.body.length > 1600) {
        throw new Error(`SMS body exceeds 1600 character limit (${rendered.body.length} characters)`)
      }

      // SMS record will be created by UnifiedMessagingService in cs_sms_logs table

      // Get phone number from Sales CRM service for SMS sending
      let fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER || ''
      
      if (!fromPhoneNumber) {
        throw new Error('TWILIO_PHONE_NUMBER environment variable is not configured')
      }
      
      // Try to get CSM's phone number if available in metadata
      if (options.metadata?.csm_user_id) {
        try {
          const phoneResult = await salesServiceClient.getPhoneNumber({
            user_id: options.metadata.csm_user_id,
            call_type: 'direct_call',
            service: 'cs_support',
          })
          if (phoneResult?.phone_number) {
            fromPhoneNumber = phoneResult.phone_number
          }
        } catch (error) {
          console.warn(`Failed to get phone number from Sales CRM for SMS:`, error)
          // Continue with default Twilio number
        }
      }

      // Validate recipient phone number
      const toPhoneNumber = Array.isArray(options.to) ? options.to[0] : options.to
      if (!toPhoneNumber) {
        throw new Error('Recipient phone number is required')
      }

      // Send SMS via Unified Messaging Service
      try {
        const unifiedResult = await UnifiedMessagingService.sendMessage({
          to: toPhoneNumber,
          body: rendered.body,
          channel: 'sms',
          userId: options.metadata?.csm_user_id || undefined,
          contactId: options.metadata?.contact_id || undefined,
          ticketId: options.metadata?.ticket_id || undefined,
          serviceType: 'cs_support',
          metadata: {
            ...options.metadata,
            template_key: template.template_key,
            from_phone_number: fromPhoneNumber,
          },
        })

        // SMS record is already created in cs_sms_logs by UnifiedMessagingService
        // Update it with additional metadata if needed
        if (unifiedResult.messageId) {
          await supabase
            .from('cs_sms_logs')
            .update({
              metadata: {
                ...options.metadata,
                template_key: template.template_key,
                customer_email: options.customerEmail,
                tenant_id: options.tenantId,
                from_phone_number: fromPhoneNumber,
                to_phone_number: toPhoneNumber,
                unified_message_id: unifiedResult.messageId,
              },
            })
            .eq('sms_id', unifiedResult.externalMessageId)
        }

        // Update template usage count
        await supabase
          .from('cs_communication_templates')
          .update({
            usage_count: template.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('template_key', template.template_key)

        return {
          communicationId: communication.communication_id,
          status: unifiedResult.status === 'sent' ? 'sent' : 'failed',
          messageId: unifiedResult.externalMessageId,
        }
      } catch (sendError) {
        // UnifiedMessagingService handles error logging in cs_sms_logs
        throw sendError
      }
    } catch (error) {
      return {
        communicationId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send WhatsApp using template
   */
  static async sendWhatsApp(options: SendCommunicationOptions): Promise<SendCommunicationResult> {
    const supabase = createServerSupabase()

    try {
      // Get template
      const template = await CommunicationTemplatesService.getTemplateByKey(
        options.templateKey,
        options.tenantId
      )

      if (!template) {
        throw new Error(`Template ${options.templateKey} not found`)
      }

      if (template.template_type !== 'whatsapp') {
        throw new Error(`Template ${options.templateKey} is not a WhatsApp template`)
      }

      // Render template
      const rendered = CommunicationTemplatesService.renderTemplate(template, options.variables)

      // Validate WhatsApp message length (4096 characters max)
      if (rendered.body.length > 4096) {
        throw new Error(`WhatsApp body exceeds 4096 character limit (${rendered.body.length} characters)`)
      }

      // WhatsApp record will be created by UnifiedMessagingService in cs_sms_logs table (WhatsApp uses SMS infrastructure)

      // Get WhatsApp number from environment or Sales CRM service
      let fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || ''
      
      if (!fromWhatsAppNumber) {
        throw new Error('TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER environment variable is not configured')
      }
      
      // Try to get CSM's phone number if available in metadata
      if (options.metadata?.csm_user_id) {
        try {
          const phoneResult = await salesServiceClient.getPhoneNumber({
            user_id: options.metadata.csm_user_id,
            call_type: 'direct_call',
            service: 'cs_support',
          })
          if (phoneResult?.phone_number) {
            fromWhatsAppNumber = phoneResult.phone_number
          }
        } catch (error) {
          console.warn(`Failed to get phone number from Sales CRM for WhatsApp:`, error)
          // Continue with default WhatsApp number
        }
      }

      // Validate recipient phone number
      const toPhoneNumber = Array.isArray(options.to) ? options.to[0] : options.to
      if (!toPhoneNumber) {
        throw new Error('Recipient phone number is required')
      }

      // Send WhatsApp via Unified Messaging Service
      try {
        const unifiedResult = await UnifiedMessagingService.sendMessage({
          to: toPhoneNumber,
          body: rendered.body,
          channel: 'whatsapp',
          mediaUrls: options.metadata?.mediaUrls as string[] | undefined,
          userId: options.metadata?.csm_user_id || undefined,
          contactId: options.metadata?.contact_id || undefined,
          ticketId: options.metadata?.ticket_id || undefined,
          serviceType: 'cs_support',
          metadata: {
            ...options.metadata,
            template_key: template.template_key,
            from_whatsapp_number: fromWhatsAppNumber,
          },
        })

        // WhatsApp record is already created in cs_sms_logs by UnifiedMessagingService
        // Update it with additional metadata if needed
        if (unifiedResult.messageId) {
          await supabase
            .from('cs_sms_logs')
            .update({
              metadata: {
                ...options.metadata,
                template_key: template.template_key,
                customer_email: options.customerEmail,
                tenant_id: options.tenantId,
                from_whatsapp_number: fromWhatsAppNumber,
                to_whatsapp_number: toPhoneNumber,
                channel: 'whatsapp',
                unified_message_id: unifiedResult.messageId,
              },
            })
            .eq('sms_id', unifiedResult.externalMessageId)
        }

        // Update template usage count
        await supabase
          .from('cs_communication_templates')
          .update({
            usage_count: template.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('template_key', template.template_key)

        return {
          communicationId: communication.communication_id,
          status: unifiedResult.status === 'sent' ? 'sent' : 'failed',
          messageId: unifiedResult.externalMessageId,
        }
      } catch (sendError) {
        // UnifiedMessagingService handles error logging in cs_sms_logs
        throw sendError
      }
    } catch (error) {
      return {
        communicationId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send communication (auto-detects type from template)
   */
  static async sendCommunication(options: SendCommunicationOptions): Promise<SendCommunicationResult> {
    const template = await CommunicationTemplatesService.getTemplateByKey(
      options.templateKey,
      options.tenantId
    )

    if (!template) {
      return {
        communicationId: '',
        status: 'failed',
        error: `Template ${options.templateKey} not found`,
      }
    }

    switch (template.template_type) {
      case 'email':
        return this.sendEmail(options)
      case 'sms':
        return this.sendSMS(options)
      case 'whatsapp':
        return this.sendWhatsApp(options)
      case 'in_app':
        // In-app messages are handled by the frontend/AI agent
        return {
          communicationId: '',
          status: 'pending',
          error: 'In-app messages are handled by the frontend',
        }
      default:
        return {
          communicationId: '',
          status: 'failed',
          error: `Unsupported template type: ${template.template_type}`,
        }
    }
  }
}
