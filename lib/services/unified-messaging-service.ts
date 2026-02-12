/**
 * Unified Messaging Service
 * 
 * Provides a single interface for sending SMS and WhatsApp messages.
 * Can be used by both Sales CRM and CS-Support services.
 * 
 * Features:
 * - Unified interface for SMS and WhatsApp
 * - Automatic channel selection
 * - Rich media support (WhatsApp)
 * - Message tracking in employee_messages table
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { twilioClient } from '@/lib/integrations/twilio'

export type MessageChannel = 'sms' | 'whatsapp'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
export type MessageDirection = 'inbound' | 'outbound'
export type ServiceType = 'sales_crm' | 'cs_support'

export interface SendMessageOptions {
  to: string
  body: string
  channel?: MessageChannel // If not provided, will auto-select
  hasWhatsApp?: boolean // Whether contact has WhatsApp
  contactPreference?: MessageChannel // Contact's preferred channel
  mediaUrls?: string[] // For WhatsApp: images, documents, videos
  templateName?: string // For WhatsApp: template name (if using templates)
  templateParams?: Record<string, string> // For WhatsApp: template parameters
  userId?: string // Clerk user ID of sender
  leadId?: string // Associated lead ID (Sales CRM)
  contactId?: string // Associated contact ID
  ticketId?: string // Associated ticket ID (CS-Support)
  serviceType?: ServiceType // Which service is sending
  metadata?: Record<string, any> // Additional metadata
}

export interface SendMessageResult {
  messageId: string // Internal message ID (UUID)
  externalMessageId: string // Twilio SID or WhatsApp message ID
  channel: MessageChannel
  status: MessageStatus
  error?: string
}

export interface SelectChannelOptions {
  phoneNumber: string
  hasWhatsApp?: boolean
  contactPreference?: MessageChannel
  requiresMedia?: boolean // If true, prefer WhatsApp
  messageLength?: number // If > 1600, prefer WhatsApp
}

/**
 * Unified Messaging Service
 */
export class UnifiedMessagingService {
  /**
   * Select the best channel for a message
   */
  static async selectChannel(options: SelectChannelOptions): Promise<MessageChannel> {
    // If contact has a preference, use it
    if (options.contactPreference) {
      return options.contactPreference
    }

    // If message requires media, use WhatsApp
    if (options.requiresMedia) {
      return 'whatsapp'
    }

    // If message is long (> 1600 chars), prefer WhatsApp
    if (options.messageLength && options.messageLength > 1600) {
      return 'whatsapp'
    }

    // If contact has WhatsApp, prefer WhatsApp
    if (options.hasWhatsApp) {
      return 'whatsapp'
    }

    // Default to SMS
    return 'sms'
  }

  /**
   * Send a message (SMS or WhatsApp)
   */
  static async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const supabase = createServerSupabase()

    // Auto-select channel if not provided
    let channel = options.channel
    if (!channel) {
      channel = await this.selectChannel({
        phoneNumber: options.to,
        hasWhatsApp: options.hasWhatsApp,
        contactPreference: options.contactPreference,
        requiresMedia: options.mediaUrls && options.mediaUrls.length > 0,
        messageLength: options.body.length,
      })
    }

    // Validate message length
    if (channel === 'sms' && options.body.length > 1600) {
      throw new Error('SMS message exceeds 1600 character limit. Use WhatsApp for longer messages.')
    }
    if (channel === 'whatsapp' && options.body.length > 4096) {
      throw new Error('WhatsApp message exceeds 4096 character limit.')
    }

    // Create message record in database (status: pending)
    const { data: messageRecord, error: dbError } = await supabase
      .from('employee_messages')
      .insert({
        channel,
        sender_id: options.userId || null,
        recipient_phone: options.to,
        message_text: options.body,
        media_urls: options.mediaUrls || [],
        message_status: 'pending',
        direction: 'outbound',
        lead_id: options.leadId || null,
        contact_id: options.contactId || null,
        ticket_id: options.ticketId || null,
        service_type: options.serviceType || null,
        metadata: {
          ...options.metadata,
          templateName: options.templateName,
          templateParams: options.templateParams,
        },
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Failed to create message record: ${dbError.message}`)
    }

    try {
      // Send message via appropriate channel
      let externalMessageId: string
      let status: MessageStatus

      if (channel === 'sms') {
        const smsResult = await twilioClient.sendSMS({
          to: options.to,
          message: options.body,
        })
        externalMessageId = smsResult.messageId
        status = smsResult.status === 'sent' ? 'sent' : 'failed'
      } else {
        // WhatsApp
        const whatsappResult = await twilioClient.sendWhatsApp({
          to: options.to,
          message: options.body,
          mediaUrl: options.mediaUrls,
        })
        externalMessageId = whatsappResult.messageId
        status = whatsappResult.status === 'sent' ? 'sent' : 'failed'
      }

      // Update message record with external ID and status
      const { error: updateError } = await supabase
        .from('employee_messages')
        .update({
          external_message_id: externalMessageId,
          message_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('message_id', messageRecord.message_id)

      if (updateError) {
        console.error('Failed to update message record:', updateError)
        // Don't throw - message was sent, just tracking failed
      }

      return {
        messageId: messageRecord.message_id,
        externalMessageId,
        channel,
        status,
      }
    } catch (error: any) {
      // Update message record with error
      const errorMessage = error.message || 'Unknown error'
      await supabase
        .from('employee_messages')
        .update({
          message_status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('message_id', messageRecord.message_id)

      throw new Error(`Failed to send ${channel} message: ${errorMessage}`)
    }
  }

  /**
   * Get message by ID
   */
  static async getMessage(messageId: string) {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('employee_messages')
      .select('*')
      .eq('message_id', messageId)
      .single()

    if (error) {
      throw new Error(`Failed to get message: ${error.message}`)
    }

    return data
  }

  /**
   * Get messages for a contact/phone number
   */
  static async getMessagesByPhone(
    phoneNumber: string,
    channel?: MessageChannel,
    limit: number = 50
  ) {
    const supabase = createServerSupabase()
    let query = supabase
      .from('employee_messages')
      .select('*')
      .eq('recipient_phone', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update message status (for webhooks)
   */
  static async updateMessageStatus(
    externalMessageId: string,
    status: MessageStatus,
    readAt?: string
  ) {
    const supabase = createServerSupabase()
    const updateData: any = {
      message_status: status,
      updated_at: new Date().toISOString(),
    }

    if (readAt && status === 'read') {
      updateData.read_at = readAt
    }

    const { error } = await supabase
      .from('employee_messages')
      .update(updateData)
      .eq('external_message_id', externalMessageId)

    if (error) {
      throw new Error(`Failed to update message status: ${error.message}`)
    }
  }

  /**
   * Create inbound message record (for webhooks)
   */
  static async createInboundMessage(options: {
    from: string
    to: string
    body: string
    channel: MessageChannel
    externalMessageId: string
    mediaUrls?: string[]
    leadId?: string
    contactId?: string
    ticketId?: string
    serviceType?: ServiceType
    metadata?: Record<string, any>
  }) {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('employee_messages')
      .insert({
        channel: options.channel,
        sender_id: null, // Inbound messages don't have sender_id
        recipient_phone: options.to,
        message_text: options.body,
        media_urls: options.mediaUrls || [],
        message_status: 'delivered', // Inbound messages are already delivered
        direction: 'inbound',
        external_message_id: options.externalMessageId,
        lead_id: options.leadId || null,
        contact_id: options.contactId || null,
        ticket_id: options.ticketId || null,
        service_type: options.serviceType || null,
        metadata: options.metadata || {},
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create inbound message: ${error.message}`)
    }

    return data
  }
}

/**
 * Get unified messaging service instance
 * (Singleton pattern for consistency)
 */
export function getUnifiedMessagingService(): UnifiedMessagingService {
  return UnifiedMessagingService
}
