/**
 * Communication Templates Service
 * 
 * Manages communication templates (email, SMS, in-app) for onboarding sequences:
 * - Template CRUD operations
 * - Variable substitution
 * - Template rendering
 * - Template lookup by sequence/milestone
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface CommunicationTemplate {
  template_id: string
  template_key: string
  template_name: string
  description: string | null
  template_type: 'email' | 'sms' | 'in_app' | 'call_script'
  category: string | null
  sequence_template_key: string | null
  milestone_key: string | null
  subject: string | null
  body: string
  body_html: string | null
  variables: TemplateVariable[]
  trigger_type: 'milestone' | 'date_offset' | 'manual' | 'event' | null
  trigger_milestone_key: string | null
  trigger_days_offset: number | null
  trigger_event: string | null
  send_from_email: string | null
  send_from_name: string | null
  reply_to_email: string | null
  send_conditions: Record<string, any>
  is_active: boolean
  is_default: boolean
  tenant_id: string | null
  usage_count: number
  last_used_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TemplateVariable {
  name: string
  key: string
  required: boolean
  description: string
  default_value?: string
}

export interface TemplateRenderOptions {
  customer_name?: string
  csm_name?: string
  csm_email?: string
  csm_phone?: string
  call_date?: string
  call_time?: string
  timezone?: string
  meeting_link?: string
  login_link?: string
  phone_number?: string
  documentation_link?: string
  support_portal_link?: string
  support_phone?: string
  ticket_id?: string
  ticket_link?: string
  call_count?: number
  intake_count?: number
  ticket_count?: number
  [key: string]: any // Allow additional variables
}

export class CommunicationTemplatesService {
  /**
   * Get template by key
   */
  static async getTemplateByKey(templateKey: string, tenantId?: string): Promise<CommunicationTemplate | null> {
    const supabase = createServerSupabase()

    let query = supabase
      .from('cs_communication_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)

    // If tenant_id provided, prefer tenant-specific, otherwise get default (NULL tenant_id)
    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    } else {
      query = query.is('tenant_id', null)
    }

    const { data, error } = await query
      .order('tenant_id', { ascending: false, nullsFirst: false }) // Prefer tenant-specific over default
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return this.parseTemplate(data)
  }

  /**
   * Get templates by sequence template key
   */
  static async getTemplatesBySequence(
    sequenceTemplateKey: string,
    templateType?: 'email' | 'sms' | 'in_app' | 'call_script',
    tenantId?: string
  ): Promise<CommunicationTemplate[]> {
    const supabase = createServerSupabase()

    let query = supabase
      .from('cs_communication_templates')
      .select('*')
      .eq('sequence_template_key', sequenceTemplateKey)
      .eq('is_active', true)

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    } else {
      query = query.is('tenant_id', null)
    }

    const { data, error } = await query
      .order('tenant_id', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map(row => this.parseTemplate(row))
  }

  /**
   * Get templates by milestone key
   */
  static async getTemplatesByMilestone(
    milestoneKey: string,
    templateType?: 'email' | 'sms' | 'in_app' | 'call_script',
    tenantId?: string
  ): Promise<CommunicationTemplate[]> {
    const supabase = createServerSupabase()

    let query = supabase
      .from('cs_communication_templates')
      .select('*')
      .eq('milestone_key', milestoneKey)
      .eq('is_active', true)

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    } else {
      query = query.is('tenant_id', null)
    }

    const { data, error } = await query
      .order('tenant_id', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map(row => this.parseTemplate(row))
  }

  /**
   * Render template with variables
   */
  static renderTemplate(template: CommunicationTemplate, options: TemplateRenderOptions): {
    subject?: string
    body: string
    body_html?: string
  } {
    let subject = template.subject || undefined
    let body = template.body
    let body_html = template.body_html || undefined

    // Replace variables in subject
    if (subject) {
      subject = this.replaceVariables(subject, options)
    }

    // Replace variables in body
    body = this.replaceVariables(body, options)

    // Replace variables in HTML body
    if (body_html) {
      body_html = this.replaceVariables(body_html, options)
    }

    // Validate required variables
    const missingVariables = this.validateRequiredVariables(template, options)
    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables: ${missingVariables.join(', ')}`)
    }

    return {
      subject,
      body,
      body_html,
    }
  }

  /**
   * Replace variables in text
   */
  private static replaceVariables(text: string, options: TemplateRenderOptions): string {
    let result = text

    // Replace [Variable Name] format
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null) {
        const placeholder = `[${this.toTitleCase(key.replace(/_/g, ' '))}]`
        result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value))
      }
    }

    return result
  }

  /**
   * Convert snake_case to Title Case
   */
  private static toTitleCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Validate required variables
   */
  private static validateRequiredVariables(
    template: CommunicationTemplate,
    options: TemplateRenderOptions
  ): string[] {
    const missing: string[] = []

    for (const variable of template.variables) {
      if (variable.required) {
        const value = options[variable.key]
        if (value === undefined || value === null || value === '') {
          missing.push(variable.name)
        }
      }
    }

    return missing
  }

  /**
   * Create a new template
   */
  static async createTemplate(template: Partial<CommunicationTemplate>): Promise<CommunicationTemplate> {
    const supabase = createServerSupabase()

    const templateData = {
      template_key: template.template_key!,
      template_name: template.template_name!,
      description: template.description || null,
      template_type: template.template_type!,
      category: template.category || null,
      sequence_template_key: template.sequence_template_key || null,
      milestone_key: template.milestone_key || null,
      subject: template.subject || null,
      body: template.body!,
      body_html: template.body_html || null,
      variables: template.variables || [],
      trigger_type: template.trigger_type || null,
      trigger_milestone_key: template.trigger_milestone_key || null,
      trigger_days_offset: template.trigger_days_offset || null,
      trigger_event: template.trigger_event || null,
      send_from_email: template.send_from_email || null,
      send_from_name: template.send_from_name || null,
      reply_to_email: template.reply_to_email || null,
      send_conditions: template.send_conditions || {},
      is_active: template.is_active !== undefined ? template.is_active : true,
      is_default: template.is_default !== undefined ? template.is_default : false,
      tenant_id: template.tenant_id || null,
      created_by: template.created_by || null,
    }

    const { data, error } = await supabase
      .from('cs_communication_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`)
    }

    return this.parseTemplate(data)
  }

  /**
   * Update a template
   */
  static async updateTemplate(
    templateKey: string,
    updates: Partial<CommunicationTemplate>
  ): Promise<CommunicationTemplate> {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('cs_communication_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('template_key', templateKey)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`)
    }

    return this.parseTemplate(data)
  }

  /**
   * Delete a template (soft delete)
   */
  static async deleteTemplate(templateKey: string): Promise<void> {
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('cs_communication_templates')
      .update({ is_active: false })
      .eq('template_key', templateKey)

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`)
    }
  }

  /**
   * Parse template from database row
   */
  static parseTemplate(row: any): CommunicationTemplate {
    return {
      template_id: row.template_id,
      template_key: row.template_key,
      template_name: row.template_name,
      description: row.description,
      template_type: row.template_type,
      category: row.category,
      sequence_template_key: row.sequence_template_key,
      milestone_key: row.milestone_key,
      subject: row.subject,
      body: row.body,
      body_html: row.body_html,
      variables: row.variables || [],
      trigger_type: row.trigger_type,
      trigger_milestone_key: row.trigger_milestone_key,
      trigger_days_offset: row.trigger_days_offset,
      trigger_event: row.trigger_event,
      send_from_email: row.send_from_email,
      send_from_name: row.send_from_name,
      reply_to_email: row.reply_to_email,
      send_conditions: row.send_conditions || {},
      is_active: row.is_active,
      is_default: row.is_default,
      tenant_id: row.tenant_id,
      usage_count: row.usage_count || 0,
      last_used_at: row.last_used_at,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  }
}
