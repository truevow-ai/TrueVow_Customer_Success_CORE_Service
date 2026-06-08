/**
 * CS CORE Agent Definitions
 * 
 * Defines the CSM (Client Success Manager) and 6 CAS-* (Customer Automation Specialist)
 * agents with complete JTBD layers, performance targets, and attribution metrics.
 * 
 * These agents are DETERMINISTIC workflow orchestrators (LLM-free).
 * FLS handles LLM inference.
 * 
 * Integration: Reports attribution events to Internal Ops (Port 3006)
 * 
 * Source: Internal Ops Agent Framework Spec
 */

import type { CSCoreAgentDefinition } from '@/libs/types/cas-agents'

// ============================================================
// CSM — Client Success Manager
// ============================================================
// Quadrant: top_right (high autonomy, high attribution)
// Execution: Deterministic — orchestrates post-onboarding sequences
// ============================================================

export const CSM_AGENT: CSCoreAgentDefinition = {
  agent_type: 'CSM',
  agent_name: 'Client Success Manager',
  autonomy_tier: 'LEVEL_1',
  rollout_phase: 'full_autonomous',
  approval_required_for: [],
  execution_mode: 'deterministic',
  
  attribution_metrics: {
    customer_retention_rate: 'Percent of assigned customers retained beyond renewal',
    health_score_avg: 'Average health score of assigned customers',
    nps_score: 'Net Promoter Score from assigned customers',
    time_to_first_value: 'Days from go-live to first value milestone',
    expansion_rate: 'Percent of customers with upsell/expansion',
  },
  
  jtbd_layers: [
    {
      layer: 'standard',
      job_statement: 'Orchestrate the 90-day post-onboarding sequence (Day 1, 3, 7, 14, 30, 60, 90 touchpoints) without missing a scheduled action',
      success_metric: 'sequence_completion_rate',
      target_value: 95,
      unit: 'percent',
    },
    {
      layer: 'customer_value',
      job_statement: 'Ensure each law firm customer achieves their first value milestone within 30 days of go-live',
      success_metric: 'time_to_first_value',
      target_value: 30,
      unit: 'days',
    },
    {
      layer: 'org_value',
      job_statement: 'Maximize ARR retention by preventing churn through proactive intervention on health score drops',
      success_metric: 'customer_retention_rate',
      target_value: 95,
      unit: 'percent',
    },
  ],
  
  jtbd_performance_targets: [
    {
      metric: 'time_to_first_value',
      target_value: 30,
      unit: 'days',
      jtbd_layer: 'customer_value',
      drift_threshold_pct: 20,
      improvement_action: 'update_playbook',
    },
    {
      metric: 'customer_retention_rate',
      target_value: 95,
      unit: 'percent',
      jtbd_layer: 'org_value',
      drift_threshold_pct: 5,
      improvement_action: 'escalate_human',
    },
    {
      metric: 'health_score_avg',
      target_value: 75,
      unit: 'score',
      jtbd_layer: 'standard',
      drift_threshold_pct: 15,
      improvement_action: 'review_data',
    },
  ],
  
  training_cycle: {
    review_cadence_hours: 24,
    attribution_floor: 6.0,
    graduation_threshold: 8.0,
    training_data_source: 'health_scores',
    rollback_on_regression: false,
  },
  
  quadrant_position: {
    autonomy_score: 8,
    attribution_score: 9,
    quadrant: 'top_right',
    target_quadrant: 'top_right',
  },
  
  // Expanded config (Internal Ops compatible)
  role_responsibilities: {
    primary_mission: 'Drive customer success and retention through proactive engagement',
    scope: [
      '90-day post-onboarding sequence orchestration',
      'Health score monitoring and intervention',
      'Churn risk identification and mitigation',
      'Customer transfer from COM onboarding',
      'Success milestone tracking',
    ],
    boundaries: [
      'No technical integration configuration (CAS territory)',
      'No billing disputes (escalate to Finance)',
      'No product development feedback (product team)',
    ],
    escalation_paths: {
      technical_issues: 'CAS-* appropriate specialist',
      billing_issues: 'Finance team',
      product_feedback: 'Product team via FLS',
      churn_risk: 'Senior CSM or Sales',
    },
  },
  brief_config: {
    personality: 'proactive, empathetic, data-driven',
    tone: 'professional yet warm',
    response_style: 'action-oriented with clear next steps',
    communication_cadence: 'weekly during first 90 days, monthly thereafter',
  },
  execution_config: {
    workflow_engine: 'deterministic',
    max_retries: 3,
    timeout_ms: 60000,
    fallback_action: 'escalate_human',
  },
  autonomy_actions: {
    fully_autonomous: [
      'calculate_health_score',
      'schedule_check_ins',
      'send_milestone_notifications',
      'update_customer_timeline',
      'log_customer_interactions',
      'generate_success_reports',
    ],
    requires_approval: [],
    human_only: [
      'override_churn_prediction',
      'modify_contract_terms',
      'approve_special_arrangements',
    ],
  },
  customer_outcome_metrics: [
    {
      metric: 'time_to_first_value',
      description: 'Days from go-live to first value milestone',
      target: 30,
      unit: 'days',
    },
    {
      metric: 'feature_adoption_rate',
      description: 'Percent of purchased features actively used',
      target: 80,
      unit: 'percent',
    },
    {
      metric: 'support_ticket_trend',
      description: 'Month-over-month change in support tickets',
      target: -10,
      unit: 'percent',
    },
  ],
  business_outcome_metrics: [
    {
      metric: 'customer_retention_rate',
      description: 'Percent of customers retained beyond renewal',
      target: 95,
      unit: 'percent',
    },
    {
      metric: 'net_revenue_retention',
      description: 'ARR retained including expansion',
      target: 110,
      unit: 'percent',
    },
    {
      metric: 'customer_health_avg',
      description: 'Average health score across portfolio',
      target: 80,
      unit: 'points',
    },
  ],
  service_stage: 'Post-sale',
  truevow_service: 'ALL',
  status: 'active',
}

// ============================================================
// CAS-GCalendar — Google Calendar Specialist
// ============================================================

export const CAS_GCALENDAR_AGENT: CSCoreAgentDefinition = {
  agent_type: 'CAS-GCalendar',
  agent_name: 'Google Calendar Specialist',
  autonomy_tier: 'LEVEL_2',
  rollout_phase: 'full_autonomous',
  approval_required_for: ['revoke_oauth', 'delete_calendar_events'],
  execution_mode: 'deterministic',
  
  attribution_metrics: {
    calendar_sync_uptime: 'Percent of time calendar sync is healthy',
    appointment_capture_rate: 'Percent of client appointments captured',
    integration_setup_time: 'Hours to configure integration',
  },
  
  jtbd_layers: [
    {
      layer: 'standard',
      job_statement: 'Configure Google Calendar OAuth and sync within 2 hours of request',
      success_metric: 'integration_setup_time',
      target_value: 2,
      unit: 'hours',
    },
    {
      layer: 'customer_value',
      job_statement: 'Sync lawyer\'s calendar with intake system so no appointment is missed',
      success_metric: 'appointment_capture_rate',
      target_value: 99,
      unit: 'percent',
    },
    {
      layer: 'org_value',
      job_statement: 'Maintain calendar integration health to reduce support tickets',
      success_metric: 'calendar_sync_uptime',
      target_value: 99.5,
      unit: 'percent',
    },
  ],
  
  jtbd_performance_targets: [
    {
      metric: 'calendar_sync_uptime',
      target_value: 99.5,
      unit: 'percent',
      jtbd_layer: 'org_value',
      drift_threshold_pct: 2,
      improvement_action: 'review_data',
    },
  ],
  
  training_cycle: {
    review_cadence_hours: 168, // Weekly
    attribution_floor: 5.0,
    graduation_threshold: 7.0,
    training_data_source: 'integration_health',
    rollback_on_regression: true,
  },
  
  quadrant_position: {
    autonomy_score: 6,
    attribution_score: 7,
    quadrant: 'top_right',
    target_quadrant: 'top_right',
  },
  
  // Expanded config (Internal Ops compatible)
  role_responsibilities: {
    primary_mission: 'Ensure flawless calendar synchronization for law firm operations',
    scope: [
      'OAuth token management for Google Calendar',
      'Bidirectional event sync',
      'Conflict detection and resolution',
      'Sync error recovery',
    ],
    boundaries: [
      'No access to calendar content beyond metadata needed for sync',
      'No modification of user preferences',
    ],
    escalation_paths: {
      oauth_failure: 'Human admin for re-authorization',
      persistent_sync_errors: 'Technical support via FLS',
    },
  },
  brief_config: {
    personality: 'reliable, precise, invisible',
    tone: 'minimal communication unless error',
    response_style: 'system notifications only',
  },
  execution_config: {
    workflow_engine: 'deterministic',
    max_retries: 5,
    timeout_ms: 30000,
    fallback_action: 'log_and_retry',
  },
  autonomy_actions: {
    fully_autonomous: [
      'sync_events',
      'refresh_oauth_token',
      'detect_conflicts',
      'log_sync_status',
      'health_check',
    ],
    requires_approval: [
      'disconnect_calendar',
      'delete_sync_history',
    ],
    human_only: [
      'reauthorize_oauth',
    ],
  },
  customer_outcome_metrics: [
    {
      metric: 'sync_success_rate',
      description: 'Percent of calendar events synced without error',
      target: 99.5,
      unit: 'percent',
    },
    {
      metric: 'sync_latency_p95',
      description: '95th percentile sync latency',
      target: 300,
      unit: 'seconds',
    },
  ],
  business_outcome_metrics: [
    {
      metric: 'calendar_integration_uptime',
      description: 'Percent of time calendar integration is healthy',
      target: 99.5,
      unit: 'percent',
    },
    {
      metric: 'missed_appointments_due_to_sync',
      description: 'Number of missed appointments due to sync failure',
      target: 0,
      unit: 'count',
    },
  ],
  is_external: true,
  oauth_provider: 'google',
  oauth_scope: 'https://www.googleapis.com/auth/calendar',
  service_stage: 'Post-sale',
  truevow_service: 'INTAKE',
  status: 'active',
}

// ============================================================
// CAS-Gmail — Gmail Integration Specialist
// ============================================================

export const CAS_GMAIL_AGENT: CSCoreAgentDefinition = {
  agent_type: 'CAS-Gmail',
  agent_name: 'Gmail Integration Specialist',
  autonomy_tier: 'LEVEL_1',
  rollout_phase: 'full_autonomous',
  approval_required_for: ['delete_email_history', 'modify_routing_rules'],
  execution_mode: 'deterministic',
  is_external: true,
  oauth_provider: 'google',
  oauth_scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
  
  attribution_metrics: {
    routing_accuracy: 'Percent of emails routed to correct queue',
    sync_latency: 'Average time from email receipt to queue assignment',
  },
  
  quadrant_position: {
    autonomy_score: 7,
    attribution_score: 6,
    quadrant: 'top_right',
    target_quadrant: 'top_right',
  },
  
  jtbd_layers: [
    {
      layer: 'standard',
      job_statement: 'Route every intake email to correct queue within 60 seconds',
      success_metric: 'sync_latency',
      target_value: 60,
      unit: 'seconds',
    },
    {
      layer: 'customer_value',
      job_statement: 'Ensure law firm staff never miss an intake email',
      success_metric: 'routing_accuracy',
      target_value: 98,
      unit: 'percent',
    },
    {
      layer: 'org_value',
      job_statement: 'Maximize intake-to-conversion by routing inquiries correctly',
      success_metric: 'routing_accuracy',
      target_value: 98,
      unit: 'percent',
    },
  ],
  
  jtbd_performance_targets: [
    {
      metric: 'routing_accuracy',
      target_value: 98,
      unit: 'percent',
      jtbd_layer: 'customer_value',
      drift_threshold_pct: 2,
      improvement_action: 'update_playbook',
    },
  ],
  
  training_cycle: {
    review_cadence_hours: 6,
    attribution_floor: 5.0,
    graduation_threshold: 7.5,
    training_data_source: 'integration_health',
    rollback_on_regression: false,
  },
  
  role_responsibilities: {
    primary_mission: 'Route intake emails to the correct queue for rapid response',
    scope: [
      'OAuth token management for Gmail',
      'Email parsing and classification',
      'Queue routing based on rules',
      'Email history logging',
    ],
    boundaries: [
      'No modification of email content',
      'No access to non-intake folders',
    ],
    escalation_paths: {
      oauth_failure: 'Human admin for re-authorization',
      routing_ambiguity: 'FLS for manual classification',
    },
  },
  
  brief_config: {
    personality: 'fast, accurate, rule-following',
    tone: 'minimal communication',
    response_style: 'routing confirmations only',
  },
  
  execution_config: {
    workflow_engine: 'deterministic',
    max_retries: 5,
    timeout_ms: 30000,
    fallback_action: 'log_and_retry',
  },
  
  autonomy_actions: {
    fully_autonomous: [
      'fetch_emails',
      'classify_email',
      'route_to_queue',
      'log_routing',
      'health_check',
    ],
    requires_approval: [
      'delete_email_history',
      'modify_routing_rules',
    ],
    human_only: [
      'reauthorize_oauth',
    ],
  },
  
  customer_outcome_metrics: [
    {
      metric: 'routing_accuracy',
      description: 'Percent of emails routed to correct queue',
      target: 98,
      unit: 'percent',
    },
  ],
  
  business_outcome_metrics: [
    {
      metric: 'intake_response_time',
      description: 'Average time from email receipt to queue assignment',
      target: 60,
      unit: 'seconds',
    },
  ],
  
  service_stage: 'Post-sale',
  truevow_service: 'INTAKE',
  status: 'active',
}

// ============================================================
// CAS-Phone — Phone Integration Specialist
// ============================================================

export const CAS_PHONE_AGENT: CSCoreAgentDefinition = {
  agent_type: 'CAS-Phone',
  agent_name: 'Phone Integration Specialist',
  autonomy_tier: 'LEVEL_1',
  rollout_phase: 'full_autonomous',
  approval_required_for: ['change_phone_number', 'disable_call_recording'],
  execution_mode: 'deterministic',
  is_external: true,
  api_key_provider: 'twilio', // TrueVow-held, not per-tenant
  
  attribution_metrics: {
    call_completion_rate: 'Percent of calls successfully connected',
    provisioning_time: 'Minutes to provision phone number',
    intake_call_capture: 'Percent of intake calls captured and routed',
  },
  
  quadrant_position: {
    autonomy_score: 5,
    attribution_score: 7,
    quadrant: 'top_right',
    target_quadrant: 'top_right',
  },
  
  jtbd_layers: [
    {
      layer: 'standard',
      job_statement: 'Provision phone numbers within 30 minutes with 99.9% uptime',
      success_metric: 'provisioning_time',
      target_value: 30,
      unit: 'minutes',
    },
    {
      layer: 'customer_value',
      job_statement: 'Ensure no law firm client call is dropped or misrouted',
      success_metric: 'call_completion_rate',
      target_value: 99.9,
      unit: 'percent',
    },
    {
      layer: 'org_value',
      job_statement: 'Capture every prospective client call - highest-value intake channel',
      success_metric: 'call_completion_rate',
      target_value: 99.9,
      unit: 'percent',
    },
  ],
  
  jtbd_performance_targets: [
    {
      metric: 'call_completion_rate',
      target_value: 99.9,
      unit: 'percent',
      jtbd_layer: 'customer_value',
      drift_threshold_pct: 0.1,
      improvement_action: 'escalate_human',
    },
  ],
  
  training_cycle: {
    review_cadence_hours: 6,
    attribution_floor: 5.0,
    graduation_threshold: 7.5,
    training_data_source: 'integration_health',
    rollback_on_regression: false,
  },
  
  role_responsibilities: {
    primary_mission: 'Ensure every client call reaches the right person',
    scope: [
      'Phone number provisioning from Twilio pool',
      'IVR configuration',
      'Call routing rules',
      'Voicemail transcription',
      'Call recording management',
    ],
    boundaries: [
      'No access to call content beyond metadata',
      'No modification of compliance-required recordings',
    ],
    escalation_paths: {
      provisioning_failure: 'Technical support',
      compliance_issue: 'Legal team',
    },
  },
  
  brief_config: {
    personality: 'reliable, compliant, available',
    tone: 'system notifications',
    response_style: 'provisioning confirmations',
  },
  
  execution_config: {
    workflow_engine: 'deterministic',
    max_retries: 3,
    timeout_ms: 15000,
    fallback_action: 'escalate_human',
  },
  
  autonomy_actions: {
    fully_autonomous: [
      'provision_number',
      'configure_ivr',
      'route_call',
      'transcribe_voicemail',
      'health_check',
    ],
    requires_approval: [
      'change_phone_number',
      'disable_call_recording',
    ],
    human_only: [
      'modify_compliance_settings',
    ],
  },
  
  customer_outcome_metrics: [
    {
      metric: 'call_completion_rate',
      description: 'Percent of calls successfully connected',
      target: 99.9,
      unit: 'percent',
    },
  ],
  
  business_outcome_metrics: [
    {
      metric: 'intake_call_capture',
      description: 'Percent of intake calls captured and routed',
      target: 99.9,
      unit: 'percent',
    },
  ],
  
  service_stage: 'Post-sale',
  truevow_service: 'INTAKE',
  status: 'active',
}

// ============================================================
// CAS-Microsoft — Microsoft 365 Specialist
// ============================================================

export const CAS_MICROSOFT_AGENT: CSCoreAgentDefinition = {
  agent_type: 'CAS-Microsoft',
  agent_name: 'Microsoft 365 Specialist',
  autonomy_tier: 'LEVEL_1',
  rollout_phase: 'full_autonomous',
  approval_required_for: ['disconnect_tenant', 'modify_permissions'],
  execution_mode: 'deterministic',
  is_external: true,
  oauth_provider: 'microsoft',
  oauth_scope: 'openid profile email offline_access Calendars.ReadWrite Mail.ReadWrite',
  
  attribution_metrics: {
    graph_api_success_rate: 'Percent of Graph API calls that succeed',
    sync_latency: 'Average sync latency in seconds',
    enterprise_adoption: 'Percent of enterprise customers with active O365 sync',
  },
  
  quadrant_position: {
    autonomy_score: 5,
    attribution_score: 6,
    quadrant: 'top_right',
    target_quadrant: 'top_right',
  },
  
  jtbd_layers: [
    {
      layer: 'standard',
      job_statement: 'Maintain O365 integration with <5 min latency and 99% API success',
      success_metric: 'graph_api_success_rate',
      target_value: 99,
      unit: 'percent',
    },
    {
      layer: 'customer_value',
      job_statement: 'Enable Microsoft-heavy firms to work seamlessly with TrueVow',
      success_metric: 'sync_latency',
      target_value: 300,
      unit: 'seconds',
    },
    {
      layer: 'org_value',
      job_statement: 'Capture Microsoft-heavy law firm segment with flawless O365 integration',
      success_metric: 'graph_api_success_rate',
      target_value: 99,
      unit: 'percent',
    },
  ],
  
  jtbd_performance_targets: [
    {
      metric: 'graph_api_success_rate',
      target_value: 99,
      unit: 'percent',
      jtbd_layer: 'standard',
      drift_threshold_pct: 1,
      improvement_action: 'review_data',
    },
  ],
  
  training_cycle: {
    review_cadence_hours: 6,
    attribution_floor: 5.0,
    graduation_threshold: 7.5,
    training_data_source: 'integration_health',
    rollback_on_regression: false,
  },
  
  role_responsibilities: {
    primary_mission: 'Enable Microsoft 365 integration for enterprise law firms',
    scope: [
      'Microsoft Graph API integration',
      'Calendar and mail sync',
      'OAuth token management',
      'Multi-tenant configuration',
    ],
    boundaries: [
      'No access to SharePoint/OneDrive',
      'No modification of M365 admin settings',
    ],
    escalation_paths: {
      oauth_failure: 'Human admin for re-authorization',
      api_deprecation: 'Engineering team',
    },
  },
  
  brief_config: {
    personality: 'enterprise-grade, compliant, thorough',
    tone: 'minimal communication',
    response_style: 'sync status updates',
  },
  
  execution_config: {
    workflow_engine: 'deterministic',
    max_retries: 5,
    timeout_ms: 30000,
    fallback_action: 'log_and_retry',
  },
  
  autonomy_actions: {
    fully_autonomous: [
      'sync_calendar',
      'sync_mail',
      'refresh_token',
      'log_sync_status',
      'health_check',
    ],
    requires_approval: [
      'disconnect_tenant',
      'modify_permissions',
    ],
    human_only: [
      'reauthorize_oauth',
    ],
  },
  
  customer_outcome_metrics: [
    {
      metric: 'sync_success_rate',
      description: 'Percent of O365 syncs without error',
      target: 99,
      unit: 'percent',
    },
  ],
  
  business_outcome_metrics: [
    {
      metric: 'enterprise_adoption',
      description: 'Percent of enterprise customers with active O365 sync',
      target: 95,
      unit: 'percent',
    },
  ],
  
  service_stage: 'Post-sale',
  truevow_service: 'INTAKE',
  status: 'active',
}

// ============================================================
// CAS-Stripe — Stripe Payment Specialist
// ============================================================

export const CAS_STRIPE_AGENT: CSCoreAgentDefinition = {
  agent_type: 'CAS-Stripe',
  agent_name: 'Stripe Payment Specialist',
  autonomy_tier: 'LEVEL_2', // Higher gate - payments are irreversible
  rollout_phase: 'strategic',
  approval_required_for: ['process_refund', 'change_payout_account', 'modify_fee_structure'],
  execution_mode: 'deterministic',
  is_external: true,
  oauth_provider: 'stripe', // Stripe Connect
  oauth_scope: 'read_write',
  
  attribution_metrics: {
    payment_success_rate: 'Percent of payments processed successfully',
    payout_on_time_rate: 'Percent of payouts delivered on time',
    reconciliation_accuracy: 'Percent of transactions reconciled accurately',
  },
  
  quadrant_position: {
    autonomy_score: 4,
    attribution_score: 8,
    quadrant: 'top_right',
    target_quadrant: 'top_right',
  },
  
  jtbd_layers: [
    {
      layer: 'standard',
      job_statement: 'Process every payment within 3 seconds and reconcile daily with 100% accuracy',
      success_metric: 'payment_success_rate',
      target_value: 99.5,
      unit: 'percent',
    },
    {
      layer: 'customer_value',
      job_statement: 'Enable firms to collect client payments reliably and receive funds on time',
      success_metric: 'payout_on_time_rate',
      target_value: 100,
      unit: 'percent',
    },
    {
      layer: 'org_value',
      job_statement: 'Directly enable revenue collection - every failed payment is lost ARR',
      success_metric: 'payment_success_rate',
      target_value: 99.5,
      unit: 'percent',
    },
  ],
  
  jtbd_performance_targets: [
    {
      metric: 'payment_success_rate',
      target_value: 99.5,
      unit: 'percent',
      jtbd_layer: 'org_value',
      drift_threshold_pct: 0.5,
      improvement_action: 'escalate_human',
    },
    {
      metric: 'reconciliation_accuracy',
      target_value: 100,
      unit: 'percent',
      jtbd_layer: 'standard',
      drift_threshold_pct: 0,
      improvement_action: 'escalate_human',
    },
  ],
  
  training_cycle: {
    review_cadence_hours: 6, // Frequent review due to financial sensitivity
    attribution_floor: 6.0,
    graduation_threshold: 8.5,
    training_data_source: 'integration_health',
    rollback_on_regression: true,
  },
  
  role_responsibilities: {
    primary_mission: 'Enable reliable payment collection for law firms',
    scope: [
      'Stripe Connect integration',
      'Payment processing',
      'Payout management',
      'Daily reconciliation',
      'Failed payment recovery',
    ],
    boundaries: [
      'No modification of fee structures without approval',
      'No refunds without human approval',
      'No access to customer PII beyond payment metadata',
    ],
    escalation_paths: {
      payment_failure: 'Finance team',
      reconciliation_error: 'Finance + Engineering',
      compliance_issue: 'Legal team',
    },
  },
  
  brief_config: {
    personality: 'precise, cautious, auditable',
    tone: 'formal and careful',
    response_style: 'detailed with audit trail',
  },
  
  execution_config: {
    workflow_engine: 'deterministic',
    max_retries: 2, // Limited retries for payment operations
    timeout_ms: 20000,
    fallback_action: 'escalate_human',
  },
  
  autonomy_actions: {
    fully_autonomous: [
      'process_payment',
      'reconcile_daily',
      'verify_webhook',
      'log_transaction',
      'health_check',
    ],
    requires_approval: [
      'process_refund',
      'change_payout_account',
      'modify_fee_structure',
    ],
    human_only: [
      'resolve_dispute',
      'modify_compliance_settings',
    ],
  },
  
  customer_outcome_metrics: [
    {
      metric: 'payment_success_rate',
      description: 'Percent of payments processed without error',
      target: 99.5,
      unit: 'percent',
    },
    {
      metric: 'payout_on_time_rate',
      description: 'Percent of payouts delivered on schedule',
      target: 100,
      unit: 'percent',
    },
  ],
  
  business_outcome_metrics: [
    {
      metric: 'reconciliation_accuracy',
      description: 'Percent of transactions reconciled accurately',
      target: 100,
      unit: 'percent',
    },
    {
      metric: 'revenue_lost_to_payment_failures',
      description: 'ARR lost due to payment processing failures',
      target: 0,
      unit: 'dollars',
    },
  ],
  
  service_stage: 'Post-sale',
  truevow_service: 'SETTLE',
  status: 'active',
}

// ============================================================
// CAS-Draft — Internal Draft Service Specialist
// ============================================================
// INTERNAL SERVICE - Not external OAuth
// Handles document template sync with TrueVow DRAFT service
// ============================================================

export const CAS_DRAFT_AGENT: CSCoreAgentDefinition = {
  agent_type: 'CAS-Draft',
  agent_name: 'Draft Service Specialist',
  autonomy_tier: 'LEVEL_2',
  rollout_phase: 'full_autonomous',
  approval_required_for: ['modify_document_templates', 'change_template_mappings'],
  execution_mode: 'deterministic',
  
  attribution_metrics: {
    document_generation_success: 'Percent of document generation requests that succeed',
    template_sync_accuracy: 'Percent of templates correctly synced',
    integration_uptime: 'Percent of time DRAFT service integration is healthy',
  },
  
  jtbd_layers: [
    {
      layer: 'standard',
      job_statement: 'Sync document templates with DRAFT service within 1 hour of tenant setup',
      success_metric: 'template_sync_time',
      target_value: 1,
      unit: 'hours',
    },
    {
      layer: 'customer_value',
      job_statement: 'Enable automated document generation for the law firm',
      success_metric: 'document_generation_success',
      target_value: 99,
      unit: 'percent',
    },
    {
      layer: 'org_value',
      job_statement: 'Maintain DRAFT integration health to support document workflows',
      success_metric: 'integration_uptime',
      target_value: 99.5,
      unit: 'percent',
    },
  ],
  
  jtbd_performance_targets: [
    {
      metric: 'document_generation_success',
      target_value: 99,
      unit: 'percent',
      jtbd_layer: 'customer_value',
      drift_threshold_pct: 3,
      improvement_action: 'review_data',
    },
  ],
  
  training_cycle: {
    review_cadence_hours: 168, // Weekly
    attribution_floor: 4.5,
    graduation_threshold: 6.5,
    training_data_source: 'integration_health',
    rollback_on_regression: true,
  },
  
  quadrant_position: {
    autonomy_score: 7, // Higher autonomy - internal service, less risk
    attribution_score: 6,
    quadrant: 'top_right',
    target_quadrant: 'top_right',
  },
  
  // Expanded config (Internal Ops compatible)
  role_responsibilities: {
    primary_mission: 'Ensure reliable document generation via internal Draft Service',
    scope: [
      'Template sync with Draft Service',
      'Document generation orchestration',
      'Draft API health monitoring',
    ],
    boundaries: [
      'No modification of document templates without approval',
      'No direct customer data access',
    ],
    escalation_paths: {
      template_errors: 'Product team',
      generation_failures: 'Technical support via FLS',
    },
  },
  brief_config: {
    personality: 'technical, thorough, reliable',
    tone: 'professional',
    response_style: 'concise status updates',
  },
  execution_config: {
    workflow_engine: 'deterministic',
    max_retries: 3,
    timeout_ms: 45000,
    fallback_action: 'log_and_retry',
  },
  autonomy_actions: {
    fully_autonomous: [
      'health_check',
      'template_sync',
      'cache_refresh',
      'log_generation_status',
    ],
    requires_approval: [
      'template_modification',
      'api_credential_change',
    ],
    human_only: [
      'new_template_creation',
      'template_deletion',
    ],
  },
  customer_outcome_metrics: [
    {
      metric: 'document_generation_success_rate',
      description: 'Percent of document generation requests that succeed',
      target: 99.5,
      unit: 'percent',
    },
    {
      metric: 'template_sync_accuracy',
      description: 'Percent of templates correctly synced',
      target: 100,
      unit: 'percent',
    },
  ],
  business_outcome_metrics: [
    {
      metric: 'draft_integration_uptime',
      description: 'Percent of time Draft service integration is healthy',
      target: 99.5,
      unit: 'percent',
    },
    {
      metric: 'failed_generations_per_week',
      description: 'Number of failed document generations per week',
      target: 0,
      unit: 'count',
    },
  ],
  is_external: false,
  oauth_provider: 'internal',
  service_stage: 'Post-sale',
  truevow_service: 'DRAFT',
  status: 'active',
}

// ============================================================
// Agent Registry
// ============================================================

export const CS_CORE_AGENT_DEFINITIONS: Record<string, CSCoreAgentDefinition> = {
  CSM: CSM_AGENT,
  'CAS-GCalendar': CAS_GCALENDAR_AGENT,
  'CAS-Gmail': CAS_GMAIL_AGENT,
  'CAS-Phone': CAS_PHONE_AGENT,
  'CAS-Microsoft': CAS_MICROSOFT_AGENT,
  'CAS-Stripe': CAS_STRIPE_AGENT,
  'CAS-Draft': CAS_DRAFT_AGENT,
}

/**
 * Get agent definition by type
 */
export function getAgentDefinition(agentType: string): CSCoreAgentDefinition | undefined {
  return CS_CORE_AGENT_DEFINITIONS[agentType]
}

/**
 * Get all CAS agent types
 */
export function getCASAgentTypes(): string[] {
  return Object.keys(CS_CORE_AGENT_DEFINITIONS).filter(key => key.startsWith('CAS-'))
}
