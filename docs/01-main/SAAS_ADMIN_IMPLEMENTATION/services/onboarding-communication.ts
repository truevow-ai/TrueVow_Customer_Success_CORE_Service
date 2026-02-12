/**
 * Onboarding Communication Service
 * 
 * Handles communication tracking during onboarding.
 * Logs email, SMS, and call communications to cs_onboarding_communications table.
 * 
 * @module lib/services/onboarding-communication
 */

import { createServerSupabase } from '@/lib/db/supabase'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CommunicationLog {
  communication_id: string
  onboarding_progress_id: string
  milestone_id: string | null
  tenant_id: string
  customer_email: string
  template_key: string | null
  communication_type: 'email' | 'sms' | 'call' | 'in_app'
  direction: 'outbound' | 'inbound'
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'failed' | 'completed'
  subject: string | null
  body: string | null
  template_id: string | null
  email_message_id: string | null
  sms_message_id: string | null
  call_sid: string | null
  call_duration_seconds: number | null
  call_recording_url: string | null
  scheduled_at: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
  completed_at: string | null
  response_data: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface LogEmailOptions {
  onboarding_progress_id: string
  milestone_id?: string
  tenant_id: string
  customer_email: string
  template_key?: string
  subject: string
  body: string
  template_id?: string
  email_message_id?: string
  scheduled_at?: string
  metadata?: Record<string, any>
}

export interface LogSMSOptions {
  onboarding_progress_id: string
  milestone_id?: string
  tenant_id: string
  customer_email: string
  template_key?: string
  body: string
  template_id?: string
  sms_message_id?: string
  scheduled_at?: string
  metadata?: Record<string, any>
}

export interface LogCallOptions {
  onboarding_progress_id: string
  milestone_id?: string
  tenant_id: string
  customer_email: string
  template_key?: string
  call_script_id?: string
  call_sid?: string
  call_duration_seconds?: number
  call_recording_url?: string
  scheduled_at?: string
  metadata?: Record<string, any>
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class OnboardingCommunicationService {
  private static supabase = createServerSupabase()

  /**
   * Log email communication
   * 
   * @param options - Email logging options
   * @returns Communication log record
   */
  static async logEmail(options: LogEmailOptions): Promise<CommunicationLog> {
    const { data, error } = await this.supabase
      .from('cs_onboarding_communications')
      .insert({
        onboarding_progress_id: options.onboarding_progress_id,
        milestone_id: options.milestone_id || null,
        tenant_id: options.tenant_id,
        customer_email: options.customer_email,
        template_key: options.template_key || null,
        communication_type: 'email',
        direction: 'outbound',
        status: 'pending',
        subject: options.subject,
        body: options.body,
        template_id: options.template_id || null,
        email_message_id: options.email_message_id || null,
        scheduled_at: options.scheduled_at || null,
        metadata: options.metadata || {},
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to log email: ${error.message}`)
    }

    return data as CommunicationLog
  }

  /**
   * Log SMS communication
   * 
   * @param options - SMS logging options
   * @returns Communication log record
   */
  static async logSMS(options: LogSMSOptions): Promise<CommunicationLog> {
    const { data, error } = await this.supabase
      .from('cs_onboarding_communications')
      .insert({
        onboarding_progress_id: options.onboarding_progress_id,
        milestone_id: options.milestone_id || null,
        tenant_id: options.tenant_id,
        customer_email: options.customer_email,
        template_key: options.template_key || null,
        communication_type: 'sms',
        direction: 'outbound',
        status: 'pending',
        body: options.body,
        template_id: options.template_id || null,
        sms_message_id: options.sms_message_id || null,
        scheduled_at: options.scheduled_at || null,
        metadata: options.metadata || {},
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to log SMS: ${error.message}`)
    }

    return data as CommunicationLog
  }

  /**
   * Log call communication
   * 
   * @param options - Call logging options
   * @returns Communication log record
   */
  static async logCall(options: LogCallOptions): Promise<CommunicationLog> {
    const { data, error } = await this.supabase
      .from('cs_onboarding_communications')
      .insert({
        onboarding_progress_id: options.onboarding_progress_id,
        milestone_id: options.milestone_id || null,
        tenant_id: options.tenant_id,
        customer_email: options.customer_email,
        template_key: options.template_key || null,
        communication_type: 'call',
        direction: 'outbound',
        status: 'pending',
        template_id: options.call_script_id || null,
        call_sid: options.call_sid || null,
        call_duration_seconds: options.call_duration_seconds || null,
        call_recording_url: options.call_recording_url || null,
        scheduled_at: options.scheduled_at || null,
        metadata: options.metadata || {},
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to log call: ${error.message}`)
    }

    return data as CommunicationLog
  }

  /**
   * Update communication status
   * 
   * @param communicationId - Communication ID
   * @param status - New status
   * @param updateData - Additional update data
   * @returns Updated communication log
   */
  static async updateStatus(
    communicationId: string,
    status: CommunicationLog['status'],
    updateData?: Partial<CommunicationLog>
  ): Promise<CommunicationLog> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Set timestamp based on status
    if (status === 'sent' && !updateData?.sent_at) {
      updates.sent_at = new Date().toISOString()
    } else if (status === 'delivered' && !updateData?.delivered_at) {
      updates.delivered_at = new Date().toISOString()
    } else if (status === 'opened' && !updateData?.opened_at) {
      updates.opened_at = new Date().toISOString()
    } else if (status === 'clicked' && !updateData?.clicked_at) {
      updates.clicked_at = new Date().toISOString()
    } else if (status === 'replied' && !updateData?.replied_at) {
      updates.replied_at = new Date().toISOString()
    } else if (status === 'completed' && !updateData?.completed_at) {
      updates.completed_at = new Date().toISOString()
    }

    if (updateData) {
      Object.assign(updates, updateData)
    }

    const { data, error } = await this.supabase
      .from('cs_onboarding_communications')
      .update(updates)
      .eq('communication_id', communicationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update communication status: ${error.message}`)
    }

    return data as CommunicationLog
  }

  /**
   * Get communication history for a customer
   * 
   * @param progressId - Onboarding progress ID
   * @param filters - Optional filters
   * @returns Array of communication logs
   */
  static async getCommunicationHistory(
    progressId: string,
    filters?: {
      communication_type?: CommunicationLog['communication_type']
      direction?: CommunicationLog['direction']
      status?: CommunicationLog['status']
    }
  ): Promise<CommunicationLog[]> {
    let query = this.supabase
      .from('cs_onboarding_communications')
      .select('*')
      .eq('onboarding_progress_id', progressId)
      .order('created_at', { ascending: false })

    if (filters?.communication_type) {
      query = query.eq('communication_type', filters.communication_type)
    }

    if (filters?.direction) {
      query = query.eq('direction', filters.direction)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get communication history: ${error.message}`)
    }

    return (data || []) as CommunicationLog[]
  }
}
