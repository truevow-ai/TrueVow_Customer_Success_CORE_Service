export interface Database {
  public: {
    Tables: {
      cs_tickets: {
        Row: {
          ticket_id: string
          tenant_id: string | null
          customer_id: string | null
          customer_email: string
          customer_name: string | null
          subject: string
          message: string | null
          channel: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
          status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          stage: 'pre-sale' | 'post-sale' | 'converted' | null
          source: 'lead' | 'customer' | 'internal'
          truevow_service: 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL' | null
          service_stage: 'Pre-sale' | 'Post-sale' | 'Retention' | null
          service_adoption_status: 'intake_only' | 'intake_settle' | 'intake_settle_draft' | 'complete_suite' | 'founding_member' | null
          practice_area: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
          closed_at: string | null
          sla_first_response_target: string | null
          sla_resolution_target: string | null
          tags: string[] | null
          metadata: Record<string, any>
        }
        Insert: {
          ticket_id?: string
          tenant_id?: string | null
          customer_id?: string | null
          customer_email: string
          customer_name?: string | null
          subject: string
          message?: string | null
          channel: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
          status?: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          stage?: 'pre-sale' | 'post-sale' | 'converted' | null
          source?: 'lead' | 'customer' | 'internal'
          truevow_service?: 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL' | null
          service_stage?: 'Pre-sale' | 'Post-sale' | 'Retention' | null
          service_adoption_status?: 'intake_only' | 'intake_settle' | 'intake_settle_draft' | 'complete_suite' | 'founding_member' | null
          practice_area?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          closed_at?: string | null
          sla_first_response_target?: string | null
          sla_resolution_target?: string | null
          tags?: string[] | null
          metadata?: Record<string, any>
        }
        Update: {
          ticket_id?: string
          tenant_id?: string | null
          customer_id?: string | null
          customer_email?: string
          customer_name?: string | null
          subject?: string
          message?: string | null
          channel?: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
          status?: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          stage?: 'pre-sale' | 'post-sale' | 'converted' | null
          source?: 'lead' | 'customer' | 'internal'
          truevow_service?: 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL' | null
          service_stage?: 'Pre-sale' | 'Post-sale' | 'Retention' | null
          service_adoption_status?: 'intake_only' | 'intake_settle' | 'intake_settle_draft' | 'complete_suite' | 'founding_member' | null
          practice_area?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          closed_at?: string | null
          sla_first_response_target?: string | null
          sla_resolution_target?: string | null
          tags?: string[] | null
          metadata?: Record<string, any>
        }
      }
      cs_messages: {
        Row: {
          message_id: string
          ticket_id: string
          from_type: 'customer' | 'agent' | 'system'
          from_user_id: string | null
          sender_id: string
          sender_type: 'agent' | 'customer' | 'system'
          body: string
          is_internal: boolean
          attachments: Record<string, any>
          created_at: string
          in_reply_to: string | null
          references_header: string[] | null
          metadata: Record<string, any>
        }
        Insert: {
          message_id?: string
          ticket_id: string
          from_type: 'customer' | 'agent' | 'system'
          from_user_id?: string | null
          sender_id: string
          sender_type: 'agent' | 'customer' | 'system'
          body: string
          is_internal?: boolean
          attachments?: Record<string, any>
          created_at?: string
          in_reply_to?: string | null
          references_header?: string[] | null
          metadata?: Record<string, any>
        }
        Update: {
          message_id?: string
          ticket_id?: string
          from_type?: 'customer' | 'agent' | 'system'
          from_user_id?: string | null
          sender_id?: string
          sender_type?: 'agent' | 'customer' | 'system'
          body?: string
          is_internal?: boolean
          attachments?: Record<string, any>
          created_at?: string
          in_reply_to?: string | null
          references_header?: string[] | null
          metadata?: Record<string, any>
        }
      }
      cs_conversations: {
        Row: {
          conversation_id: string
          tenant_id: string
          customer_id: string | null
          customer_email: string
          customer_name: string | null
          channel: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
          status: 'active' | 'archived' | 'closed'
          ticket_id: string | null
          first_message_at: string
          last_message_at: string
          message_count: number
          unread_count: number
          assigned_to: string | null
          tags: string[] | null
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          conversation_id?: string
          tenant_id: string
          customer_id?: string | null
          customer_email: string
          customer_name?: string | null
          channel: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
          status?: 'active' | 'archived' | 'closed'
          ticket_id?: string | null
          first_message_at?: string
          last_message_at?: string
          message_count?: number
          unread_count?: number
          assigned_to?: string | null
          tags?: string[] | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          tenant_id?: string
          customer_id?: string | null
          customer_email?: string
          customer_name?: string | null
          channel?: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
          status?: 'active' | 'archived' | 'closed'
          ticket_id?: string | null
          first_message_at?: string
          last_message_at?: string
          message_count?: number
          unread_count?: number
          assigned_to?: string | null
          tags?: string[] | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      cs_llm_agents: {
        Row: {
          agent_id: string
          agent_name: string
          agent_type: 'customer_support' | 'customer_success' | 'solutions_engineer' | 'escalation_monitoring' | 'knowledge_base' | 'customer_health' | 'ticket_quality'
          status: 'active' | 'inactive' | 'testing' | 'maintenance' | null
          is_active: boolean
          service_stage: 'Pre-sale' | 'Post-sale' | 'Retention' | null
          truevow_service: 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL' | null
          role_responsibilities: Record<string, any> | null
          brief_config: Record<string, any>
          knowledge_base: Record<string, any> | null
          llm_config: Record<string, any>
          performance_metrics: Record<string, any> | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          agent_id?: string
          agent_name: string
          agent_type: 'customer_support' | 'customer_success' | 'solutions_engineer' | 'escalation_monitoring' | 'knowledge_base' | 'customer_health' | 'ticket_quality'
          status?: 'active' | 'inactive' | 'testing' | 'maintenance' | null
          is_active?: boolean
          service_stage?: 'Pre-sale' | 'Post-sale' | 'Retention' | null
          truevow_service?: 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL' | null
          role_responsibilities?: Record<string, any> | null
          brief_config: Record<string, any>
          knowledge_base?: Record<string, any> | null
          llm_config: Record<string, any>
          performance_metrics?: Record<string, any> | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          agent_id?: string
          agent_name?: string
          agent_type?: 'customer_support' | 'customer_success' | 'solutions_engineer' | 'escalation_monitoring' | 'knowledge_base' | 'customer_health' | 'ticket_quality'
          status?: 'active' | 'inactive' | 'testing' | 'maintenance' | null
          is_active?: boolean
          service_stage?: 'Pre-sale' | 'Post-sale' | 'Retention' | null
          truevow_service?: 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL' | null
          role_responsibilities?: Record<string, any> | null
          brief_config?: Record<string, any>
          knowledge_base?: Record<string, any> | null
          llm_config?: Record<string, any>
          performance_metrics?: Record<string, any> | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      // Additional tables: cs_sms_logs, cs_call_logs, cs_kb_tags, cs_kb_article_tags, 
      // cs_kb_article_views, cs_sla_tracking, cs_ticket_quality_scores, cs_customer_success_metrics,
      // cs_customer_onboarding_progress, cs_customer_churn_risk, cs_agent_executions, cs_agent_feedback,
      // cs_agent_training_data, cs_agent_state, cs_agent_orchestration, cs_agent_circuit_breakers,
      // cs_agent_dlq, cs_agent_rate_limits, cs_agent_cost_tracking, cs_agent_monitoring,
      // cs_integrations, cs_webhooks, cs_api_keys
      // Full type definitions will be added as needed
    }
  }
}

export type Ticket = Database['public']['Tables']['cs_tickets']['Row']
export type TicketInsert = Database['public']['Tables']['cs_tickets']['Insert']
export type TicketUpdate = Database['public']['Tables']['cs_tickets']['Update']

export type Message = Database['public']['Tables']['cs_messages']['Row']
export type MessageInsert = Database['public']['Tables']['cs_messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['cs_messages']['Update']

