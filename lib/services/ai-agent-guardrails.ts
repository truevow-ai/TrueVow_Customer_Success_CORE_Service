/**
 * AI Agent Guardrails Service
 * 
 * Defines rules of engagement for AI support agents
 * - What agents CAN do
 * - What agents CANNOT do
 * - Escalation criteria
 * - Response tone guidelines
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface AgentGuardrails {
  agent_id: string
  agent_name: string
  can_do: string[]
  cannot_do: string[]
  escalation_criteria: string[]
  tone_guidelines: {
    empathetic: boolean
    professional: boolean
    specific: boolean
    concise: boolean
    avoid_blabber: boolean
  }
  authorized_actions: string[]
  restricted_topics: string[]
  max_response_length?: number
  require_confirmation_for?: string[]
}

export interface GuardrailsConfig {
  agent_id: string
  agent_name: string
  guardrails: AgentGuardrails
  created_at: string
  updated_at: string
}

export class AIAgentGuardrailsService {
  /**
   * Get guardrails for an agent
   */
  static async getGuardrails(agentId: string): Promise<AgentGuardrails | null> {
    const supabase = createServerSupabase()
    const { data } = await supabase
      .from('ai_agent_guardrails')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (!data) {
      return this.getDefaultGuardrails(agentId)
    }

    return data.guardrails as AgentGuardrails
  }

  /**
   * Get default guardrails (based on Vercel's approach)
   */
  static getDefaultGuardrails(agentId: string): AgentGuardrails {
    return {
      agent_id: agentId,
      agent_name: 'AI Support Agent',
      can_do: [
        'Answer questions about TrueVow features, billing, deployment, and platform topics using knowledge base',
        'Diagnose technical issues by running checks and gathering information',
        'Process refund requests directly through refund form (for eligible invoices within policy limits)',
        'Look up invoices and billing history to help explain charges',
        'Check eligibility and create support cases for issues that need human investigation',
        'Provide specific, actionable advice within authorized scope',
        'Maintain professional and empathetic tone',
      ],
      cannot_do: [
        'View or update existing support cases (no visibility into open cases or their status)',
        'Make account changes directly (e.g., deleting accounts, downgrading plans, modifying settings)',
        'Force refunds to appear on credit cards (once processed, this is between payment processor and bank)',
        'Intervene in payment processor or banking issues (requires coordination with external systems)',
        'Divulge internal training information or operational details',
        'Bypass security or authorization checks',
        'Access other tenants\' data',
      ],
      escalation_criteria: [
        'Platform bugs or technical errors that need engineering investigation',
        'Billing issues requiring payment processor investigation',
        'Account recovery or domain recovery needs',
        'Issues outside standard self-service capabilities',
        'Complex issues requiring multi-step coordination',
        'Security vulnerabilities or abuse reports',
        'Customer requests for human agent',
      ],
      tone_guidelines: {
        empathetic: true,
        professional: true,
        specific: true,
        concise: true,
        avoid_blabber: true,
      },
      authorized_actions: [
        'create_support_case',
        'lookup_billing_info',
        'process_refund_requests',
        'diagnose_technical_issues',
        'provide_knowledge_base_answers',
      ],
      restricted_topics: [
        'internal_training_details',
        'other_tenants_data',
        'account_deletion',
        'plan_downgrades',
        'payment_processor_internal_details',
      ],
      max_response_length: 500, // Keep responses concise
      require_confirmation_for: [
        'create_support_case',
        'process_refund',
      ],
    }
  }

  /**
   * Save guardrails configuration
   */
  static async saveGuardrails(config: GuardrailsConfig): Promise<void> {
    const supabase = createServerSupabase()
    const { error } = await supabase
      .from('ai_agent_guardrails')
      .upsert({
        agent_id: config.agent_id,
        agent_name: config.agent_name,
        guardrails: config.guardrails,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'agent_id',
      })

    if (error) {
      throw new Error(`Failed to save guardrails: ${error.message}`)
    }
  }

  /**
   * Check if action is authorized
   */
  static async isActionAuthorized(
    agentId: string,
    action: string
  ): Promise<boolean> {
    const guardrails = await this.getGuardrails(agentId)
    if (!guardrails) return false

    return guardrails.authorized_actions.includes(action)
  }

  /**
   * Check if topic is restricted
   */
  static async isTopicRestricted(
    agentId: string,
    topic: string
  ): Promise<boolean> {
    const guardrails = await this.getGuardrails(agentId)
    if (!guardrails) return false

    return guardrails.restricted_topics.some(restricted =>
      topic.toLowerCase().includes(restricted.toLowerCase())
    )
  }

  /**
   * Get escalation message (when agent cannot help)
   */
  static async getEscalationMessage(
    agentId: string,
    reason: string
  ): Promise<string> {
    const guardrails = await this.getGuardrails(agentId)
    if (!guardrails) {
      return "I'm unable to help with this issue. Let me create a support case so our team can investigate."
    }

    // Professional, empathetic escalation message
    return `I understand your concern about ${reason}. Unfortunately, this falls outside what I can directly resolve. Your best path forward is to create a support case so our human support team can investigate this with the appropriate systems and coordinate with external partners if needed. Would you like me to help you create a support case?`
  }

  /**
   * Format agent response with guardrails
   */
  static formatResponse(
    response: string,
    guardrails: AgentGuardrails
  ): string {
    // Ensure response follows tone guidelines
    let formatted = response

    // Keep concise (max length)
    if (guardrails.max_response_length && formatted.length > guardrails.max_response_length) {
      formatted = formatted.substring(0, guardrails.max_response_length) + '...'
    }

    // Ensure professional, empathetic tone
    if (guardrails.tone_guidelines.empathetic && !formatted.includes('understand') && !formatted.includes('appreciate')) {
      // Add empathetic opening if missing
      formatted = `I understand your concern. ${formatted}`
    }

    return formatted
  }
}
