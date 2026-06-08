/**
 * Service Configuration
 * 
 * CS CORE Service Identity and Module Definitions
 * Used for Service Registry registration on startup
 * 
 * This file registers EVERYTHING CS CORE has built so other services
 * can discover and integrate with all capabilities.
 */

// ============================================================
// SERVICE IDENTITY
// ============================================================

export const SERVICE_NAME = process.env.SERVICE_NAME || 'cs-core'
export const SERVICE_PORT = parseInt(process.env.SERVICE_PORT || '3061')
export const SERVICE_TYPE = process.env.SERVICE_TYPE || 'customer_success'

// ============================================================
// SERVICE CONFIGURATION
// ============================================================

export function getServiceConfig() {
  const host = process.env.SERVICE_HOST || 
               process.env.CUSTOMER_SUCCESS_CORE_SERVICE_URL || 
               `http://localhost:${SERVICE_PORT}`
  
  return {
    service_name: SERVICE_NAME,
    service_type: SERVICE_TYPE,
    service_url: host,
    port: SERVICE_PORT,
    version: '1.0.0',
    health_endpoint: '/api/v1/service/health',
    agents: [
      'CSM',           // Client Success Manager (JTBD orchestrator)
      'CAS-GCalendar', // Google Calendar Specialist
      'CAS-Gmail',     // Gmail Integration Specialist
      'CAS-Phone',     // Phone Integration Specialist (Twilio)
      'CAS-Microsoft', // Microsoft 365 Specialist
      'CAS-Stripe',    // Stripe Payment Specialist
      'CAS-Draft',     // Draft Service Specialist
    ],
    capabilities: [
      // Core CSM Capabilities
      'customer-success-management',
      'customer-health-scoring',
      'churn-risk-detection',
      'renewal-tracking',
      'expansion-opportunity-detection',
      
      // CAS Integration Capabilities
      'cas-integration-orchestration',
      'oauth-integration-management',
      'integration-troubleshooting',
      
      // Communication Capabilities
      'unified-inbox',
      'email-campaigns',
      'sms-messaging',
      'voice-calls',
      'whatsapp-messaging',
      
      // Workflow Capabilities
      'playbook-execution',
      'workflow-automation',
      'onboarding-sequences',
      'post-onboarding-flows',
      
      // Analytics & Reporting
      'usage-analytics',
      'trend-analysis',
      'agent-analytics',
      'report-generation',
      
      // Knowledge & Support
      'knowledge-base',
      'faq-management',
      'ticket-management',
      'survey-management',
      
      // Training
      'training-program-management',
      'enrollment-tracking',
      
      // Attribution
      'attribution-reporting',
      'agent-execution-logging',
    ],
  }
}

// ============================================================
// MODULE DEFINITIONS - All CS CORE Capabilities
// ============================================================

export const SERVICE_MODULES = [
  // ========== CSM - Client Success Manager ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'csm',
    module_version: '1.0.0',
    description: 'Client Success Manager - orchestrates all customer success activities',
    endpoints: [
      { path: '/api/v1/customers/transfer', method: 'POST', description: 'Receive customer from SaaS Admin' },
      { path: '/api/v1/customers/profile', method: 'GET', description: 'Get customer profile' },
      { path: '/api/v1/customers/subscriptions', method: 'GET', description: 'Get customer subscriptions' },
      { path: '/api/v1/customers/:customerId/journey', method: 'GET', description: 'Get customer journey' },
    ],
    events_published: [
      { event_name: 'customer.transferred', description: 'Customer transferred from SaaS Admin' },
      { event_name: 'customer.profile_updated', description: 'Customer profile was updated' },
    ],
    events_consumed: [
      { event_name: 'lead.converted', source_service: 'saas_admin' },
      { event_name: 'tenant.created', source_service: 'saas_admin' },
    ],
  },

  // ========== Health Scoring Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'health_scoring',
    module_version: '1.0.0',
    description: 'Customer health scoring and churn risk detection',
    endpoints: [
      { path: '/api/v1/health/scores', method: 'GET', description: 'Get all health scores' },
      { path: '/api/v1/health/score', method: 'GET', description: 'Get specific health score' },
      { path: '/api/v1/health/calculate', method: 'POST', description: 'Calculate health score' },
      { path: '/api/v1/health/history', method: 'GET', description: 'Get health score history' },
      { path: '/api/v1/health/signals', method: 'GET', description: 'Get health signals' },
      { path: '/api/v1/health/alerts', method: 'GET', description: 'Get health alerts' },
    ],
    events_published: [
      { event_name: 'health_score.changed', description: 'Customer health score changed' },
      { event_name: 'health_score.critical', description: 'Health score dropped to critical' },
      { event_name: 'churn_risk.detected', description: 'Churn risk detected for customer' },
      { event_name: 'health_alert.created', description: 'New health alert created' },
    ],
    events_consumed: [
      { event_name: 'usage.event', source_service: 'tenant_app' },
      { event_name: 'subscription.cancelled', source_service: 'billing' },
    ],
  },

  // ========== Renewal Management Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'renewal_management',
    module_version: '1.0.0',
    description: 'Renewal tracking, forecasting, and campaign management',
    endpoints: [
      { path: '/api/v1/renewal/summary', method: 'GET', description: 'Get renewal summary' },
      { path: '/api/v1/renewal/at-risk', method: 'GET', description: 'Get at-risk renewals' },
      { path: '/api/v1/renewal/forecast', method: 'GET', description: 'Get renewal forecast' },
      { path: '/api/v1/renewal/tracking', method: 'GET', description: 'Get renewal tracking' },
      { path: '/api/v1/renewal/customer', method: 'GET', description: 'Get customer renewal info' },
      { path: '/api/v1/renewal/:id', method: 'GET', description: 'Get specific renewal' },
      { path: '/api/v1/renewal/risk/calculate', method: 'POST', description: 'Calculate renewal risk' },
      { path: '/api/v1/renewal/campaign/start', method: 'POST', description: 'Start renewal campaign' },
      { path: '/api/v1/renewal/campaign/step', method: 'POST', description: 'Execute campaign step' },
    ],
    events_published: [
      { event_name: 'renewal.approaching', description: 'Renewal date approaching' },
      { event_name: 'renewal.at_risk', description: 'Renewal at risk' },
      { event_name: 'renewal.campaign_started', description: 'Renewal campaign started' },
      { event_name: 'renewal.completed', description: 'Renewal completed' },
    ],
    events_consumed: [
      { event_name: 'subscription.renewed', source_service: 'billing' },
      { event_name: 'subscription.expiring', source_service: 'billing' },
    ],
  },

  // ========== Expansion Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'expansion',
    module_version: '1.0.0',
    description: 'Expansion opportunity detection and upsell tracking',
    endpoints: [
      { path: '/api/v1/expansion/summary', method: 'GET', description: 'Get expansion summary' },
      { path: '/api/v1/expansion/opportunities', method: 'GET', description: 'Get expansion opportunities' },
      { path: '/api/v1/expansion/spikes', method: 'GET', description: 'Get usage spikes' },
      { path: '/api/v1/expansion/triggers/evaluate', method: 'POST', description: 'Evaluate expansion triggers' },
    ],
    events_published: [
      { event_name: 'expansion.opportunity_detected', description: 'Expansion opportunity detected' },
      { event_name: 'expansion.spike_detected', description: 'Usage spike detected' },
    ],
    events_consumed: [
      { event_name: 'usage.spike', source_service: 'tenant_app' },
    ],
  },

  // ========== CAS Integrations Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'cas_integrations',
    module_version: '1.0.0',
    description: 'CAS Integration orchestration for external OAuth services',
    endpoints: [
      { path: '/api/v1/integrations/:type/configure', method: 'POST', description: 'Configure integration' },
      { path: '/api/v1/integrations/:type/troubleshoot', method: 'POST', description: 'Troubleshoot integration' },
      { path: '/api/v1/integrations/health', method: 'GET', description: 'Get integration health' },
      { path: '/api/v1/integrations/status', method: 'GET', description: 'Get integration status' },
      { path: '/api/v1/integrations/errors', method: 'GET', description: 'Get integration errors' },
    ],
    events_published: [
      { event_name: 'integration.configured', description: 'Integration configured for tenant' },
      { event_name: 'integration.failed', description: 'Integration failure detected' },
      { event_name: 'integration.health_check', description: 'Integration health check completed' },
    ],
    events_consumed: [
      { event_name: 'oauth.completed', source_service: 'saas_admin' },
      { event_name: 'integration.troubleshoot_request', source_service: 'fls' },
    ],
  },

  // ========== Playbooks Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'playbooks',
    module_version: '1.0.0',
    description: 'Customer success playbook execution and automation',
    endpoints: [
      { path: '/api/v1/playbooks', method: 'GET', description: 'List playbooks' },
      { path: '/api/v1/playbooks', method: 'POST', description: 'Create playbook' },
      { path: '/api/v1/playbooks/:id', method: 'GET', description: 'Get playbook details' },
      { path: '/api/v1/playbooks/:id/execute', method: 'POST', description: 'Execute playbook' },
      { path: '/api/v1/playbooks/:id/stats', method: 'GET', description: 'Get playbook stats' },
      { path: '/api/v1/playbooks/executions', method: 'GET', description: 'List playbook executions' },
      { path: '/api/v1/playbooks/executions/:id/outcome', method: 'POST', description: 'Record execution outcome' },
    ],
    events_published: [
      { event_name: 'playbook.started', description: 'Playbook execution started' },
      { event_name: 'playbook.completed', description: 'Playbook execution completed' },
      { event_name: 'playbook.failed', description: 'Playbook execution failed' },
    ],
    events_consumed: [
      { event_name: 'trigger.playbook', source_service: 'internal_ops' },
      { event_name: 'health_score.critical', source_service: 'cs_core' },
    ],
  },

  // ========== Workflows Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'workflows',
    module_version: '1.0.0',
    description: 'Workflow automation and execution',
    endpoints: [
      { path: '/api/v1/workflows', method: 'GET', description: 'List workflows' },
      { path: '/api/v1/workflows/:id', method: 'GET', description: 'Get workflow details' },
      { path: '/api/v1/workflows/:id/execute', method: 'POST', description: 'Execute workflow' },
      { path: '/api/v1/workflows/:id/executions', method: 'GET', description: 'Get workflow executions' },
    ],
    events_published: [
      { event_name: 'workflow.started', description: 'Workflow execution started' },
      { event_name: 'workflow.completed', description: 'Workflow execution completed' },
    ],
    events_consumed: [],
  },

  // ========== Unified Inbox Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'unified_inbox',
    module_version: '1.0.0',
    description: 'Unified inbox for all customer communications',
    endpoints: [
      { path: '/api/v1/inbox/conversations', method: 'GET', description: 'List conversations' },
      { path: '/api/v1/inbox/conversations', method: 'POST', description: 'Create conversation' },
    ],
    events_published: [
      { event_name: 'conversation.created', description: 'New conversation created' },
      { event_name: 'message.received', description: 'New message received' },
    ],
    events_consumed: [
      { event_name: 'email.received', source_service: 'email_provider' },
      { event_name: 'sms.received', source_service: 'twilio' },
      { event_name: 'whatsapp.received', source_service: 'whatsapp' },
    ],
  },

  // ========== Voice/Calls Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'voice_calls',
    module_version: '1.0.0',
    description: 'Voice call management via Twilio',
    endpoints: [
      { path: '/api/v1/calls', method: 'GET', description: 'List calls' },
      { path: '/api/v1/calls/outbound', method: 'POST', description: 'Make outbound call' },
      { path: '/api/v1/calls/stats', method: 'GET', description: 'Get call statistics' },
      { path: '/api/v1/voice/outbound', method: 'POST', description: 'Initiate voice call' },
      { path: '/api/v1/voice/recording', method: 'GET', description: 'Get call recording' },
      { path: '/api/v1/voice/status', method: 'POST', description: 'Update call status' },
    ],
    events_published: [
      { event_name: 'call.initiated', description: 'Call initiated' },
      { event_name: 'call.completed', description: 'Call completed' },
      { event_name: 'call.recording_ready', description: 'Call recording ready' },
    ],
    events_consumed: [],
  },

  // ========== Analytics Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'analytics',
    module_version: '1.0.0',
    description: 'Usage analytics, trends, and agent performance',
    endpoints: [
      { path: '/api/v1/analytics/dashboard', method: 'GET', description: 'Get analytics dashboard' },
      { path: '/api/v1/analytics/team', method: 'GET', description: 'Get team analytics' },
      { path: '/api/v1/analytics/agent/:id', method: 'GET', description: 'Get agent analytics' },
      { path: '/api/v1/analytics/agent/:id/comparison', method: 'GET', description: 'Compare agent performance' },
      { path: '/api/v1/analytics/trends/summary', method: 'GET', description: 'Get trend summary' },
      { path: '/api/v1/analytics/trends/analyze', method: 'POST', description: 'Analyze trends' },
      { path: '/api/v1/analytics/trends/pain-points', method: 'GET', description: 'Get pain points' },
      { path: '/api/v1/analytics/trends/feedback', method: 'GET', description: 'Get feedback trends' },
      { path: '/api/v1/analytics/usage/summary', method: 'GET', description: 'Get usage summary' },
      { path: '/api/v1/analytics/usage/event', method: 'POST', description: 'Track usage event' },
      { path: '/api/v1/analytics/usage/feature-adoption', method: 'GET', description: 'Get feature adoption' },
      { path: '/api/v1/analytics/usage/churn-risk', method: 'GET', description: 'Get churn risk analysis' },
    ],
    events_published: [
      { event_name: 'analytics.report_generated', description: 'Analytics report generated' },
      { event_name: 'usage.anomaly_detected', description: 'Usage anomaly detected' },
    ],
    events_consumed: [
      { event_name: 'usage.event', source_service: 'tenant_app' },
    ],
  },

  // ========== Knowledge Base Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'knowledge_base',
    module_version: '1.0.0',
    description: 'Knowledge base and FAQ management',
    endpoints: [
      { path: '/api/v1/kb/articles', method: 'GET', description: 'List KB articles' },
      { path: '/api/v1/kb/articles', method: 'POST', description: 'Create KB article' },
      { path: '/api/v1/kb/articles/:id', method: 'GET', description: 'Get KB article' },
      { path: '/api/v1/kb/articles/:id', method: 'PUT', description: 'Update KB article' },
      { path: '/api/v1/kb/articles/:id/helpful', method: 'POST', description: 'Mark article helpful' },
      { path: '/api/v1/kb/categories', method: 'GET', description: 'List KB categories' },
      { path: '/api/v1/faqs', method: 'GET', description: 'List FAQs' },
      { path: '/api/v1/faqs', method: 'POST', description: 'Create FAQ' },
      { path: '/api/v1/faqs/:id', method: 'GET', description: 'Get FAQ' },
      { path: '/api/v1/faqs/:id', method: 'PUT', description: 'Update FAQ' },
      { path: '/api/v1/faqs/search', method: 'GET', description: 'Search FAQs' },
      { path: '/api/v1/faqs/categories', method: 'GET', description: 'List FAQ categories' },
    ],
    events_published: [
      { event_name: 'kb.article_created', description: 'KB article created' },
      { event_name: 'faq.created', description: 'FAQ created' },
    ],
    events_consumed: [],
  },

  // ========== Tickets Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'tickets',
    module_version: '1.0.0',
    description: 'Support ticket management',
    endpoints: [
      { path: '/api/v1/tickets', method: 'GET', description: 'List tickets' },
      { path: '/api/v1/tickets', method: 'POST', description: 'Create ticket' },
      { path: '/api/v1/tickets/:id/activity', method: 'GET', description: 'Get ticket activity' },
      { path: '/api/v1/tickets/:id/notes', method: 'GET', description: 'Get ticket notes' },
      { path: '/api/v1/tickets/:id/notes', method: 'POST', description: 'Add ticket note' },
    ],
    events_published: [
      { event_name: 'ticket.created', description: 'Ticket created' },
      { event_name: 'ticket.resolved', description: 'Ticket resolved' },
      { event_name: 'ticket.escalated', description: 'Ticket escalated' },
    ],
    events_consumed: [
      { event_name: 'support.request', source_service: 'fls' },
    ],
  },

  // ========== Surveys Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'surveys',
    module_version: '1.0.0',
    description: 'Customer survey and NPS management',
    endpoints: [
      { path: '/api/v1/surveys/stats', method: 'GET', description: 'Get survey stats' },
      { path: '/api/v1/surveys/response', method: 'POST', description: 'Submit survey response' },
      { path: '/api/v1/surveys/send-scheduled', method: 'POST', description: 'Send scheduled surveys' },
      { path: '/api/v1/surveys/process-resolution', method: 'POST', description: 'Process resolution survey' },
    ],
    events_published: [
      { event_name: 'survey.sent', description: 'Survey sent to customer' },
      { event_name: 'survey.response_received', description: 'Survey response received' },
      { event_name: 'nps.score_updated', description: 'NPS score updated' },
    ],
    events_consumed: [
      { event_name: 'ticket.resolved', source_service: 'cs_core' },
    ],
  },

  // ========== Reports Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'reports',
    module_version: '1.0.0',
    description: 'Report generation and scheduling',
    endpoints: [
      { path: '/api/v1/reports', method: 'GET', description: 'List reports' },
      { path: '/api/v1/reports/:id', method: 'GET', description: 'Get report' },
      { path: '/api/v1/reports/generate', method: 'POST', description: 'Generate report' },
      { path: '/api/v1/reports/templates', method: 'GET', description: 'List report templates' },
      { path: '/api/v1/reports/scheduled', method: 'GET', description: 'List scheduled reports' },
      { path: '/api/v1/reports/scheduled', method: 'POST', description: 'Schedule report' },
    ],
    events_published: [
      { event_name: 'report.generated', description: 'Report generated' },
      { event_name: 'report.scheduled', description: 'Report scheduled' },
    ],
    events_consumed: [],
  },

  // ========== Training Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'training',
    module_version: '1.0.0',
    description: 'Customer training and onboarding programs',
    endpoints: [
      { path: '/api/v1/training/programs', method: 'GET', description: 'List training programs' },
      { path: '/api/v1/training/programs', method: 'POST', description: 'Create training program' },
      { path: '/api/v1/training/sessions', method: 'GET', description: 'List training sessions' },
      { path: '/api/v1/training/sessions', method: 'POST', description: 'Create training session' },
      { path: '/api/v1/training/enrollments', method: 'GET', description: 'List enrollments' },
      { path: '/api/v1/training/enrollments', method: 'POST', description: 'Create enrollment' },
    ],
    events_published: [
      { event_name: 'training.enrolled', description: 'Customer enrolled in training' },
      { event_name: 'training.completed', description: 'Training completed' },
    ],
    events_consumed: [
      { event_name: 'customer.transferred', source_service: 'cs_core' },
    ],
  },

  // ========== Tenant Configuration Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'tenant_config',
    module_version: '1.0.0',
    description: 'Tenant-specific configuration management',
    endpoints: [
      { path: '/api/v1/tenants/:tenant_id/configuration', method: 'GET', description: 'Get tenant config' },
      { path: '/api/v1/tenants/:tenant_id/configuration', method: 'PUT', description: 'Update tenant config' },
      { path: '/api/v1/tenants/:tenant_id/intake-questions', method: 'GET', description: 'Get intake questions' },
      { path: '/api/v1/tenants/:tenant_id/intake-questions', method: 'PUT', description: 'Update intake questions' },
      { path: '/api/v1/tenants/:tenant_id/screening-rules', method: 'GET', description: 'Get screening rules' },
      { path: '/api/v1/tenants/:tenant_id/screening-rules', method: 'PUT', description: 'Update screening rules' },
    ],
    events_published: [
      { event_name: 'tenant.config_updated', description: 'Tenant configuration updated' },
    ],
    events_consumed: [],
  },

  // ========== Internal Ops Integration Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'internal_ops_integration',
    module_version: '1.0.0',
    description: 'Integration with Internal Ops for RevOps and task management',
    endpoints: [
      { path: '/api/v1/integrations/internal-ops/tasks', method: 'GET', description: 'Get Internal Ops tasks' },
      { path: '/api/v1/integrations/internal-ops/tasks', method: 'POST', description: 'Create Internal Ops task' },
      { path: '/api/v1/integrations/internal-ops/revops/activities', method: 'GET', description: 'Get RevOps activities' },
      { path: '/api/v1/integrations/internal-ops/time-tracking', method: 'GET', description: 'Get time tracking' },
      { path: '/api/v1/integrations/internal-ops/time-tracking', method: 'POST', description: 'Log time entry' },
    ],
    events_published: [
      { event_name: 'task.created', description: 'Task created in Internal Ops' },
      { event_name: 'time.logged', description: 'Time entry logged' },
    ],
    events_consumed: [
      { event_name: 'task.assigned', source_service: 'internal_ops' },
    ],
  },

  // ========== Attribution Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'attribution',
    module_version: '1.0.0',
    description: 'Agent attribution reporting to Internal Ops',
    endpoints: [],
    events_published: [
      { event_name: 'attribution.reported', description: 'Attribution event reported to Internal Ops' },
      { event_name: 'agent.execution_logged', description: 'Agent execution logged' },
    ],
    events_consumed: [],
  },

  // ========== Dashboard Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'dashboards',
    module_version: '1.0.0',
    description: 'Dashboard and visualization endpoints',
    endpoints: [
      { path: '/api/v1/dashboard/master', method: 'GET', description: 'Get master dashboard' },
      { path: '/api/v1/dashboard/onboarding', method: 'GET', description: 'Get onboarding dashboard' },
    ],
    events_published: [],
    events_consumed: [],
  },

  // ========== Webhooks Module ==========
  {
    service_name: SERVICE_NAME,
    module_name: 'webhooks',
    module_version: '1.0.0',
    description: 'Webhook receivers for external services',
    endpoints: [
      { path: '/api/v1/webhooks/platform/milestone', method: 'POST', description: 'Platform milestone webhook' },
      { path: '/api/v1/webhooks/whatsapp', method: 'POST', description: 'WhatsApp webhook receiver' },
      { path: '/api/webhooks/resend', method: 'POST', description: 'Resend email webhook' },
    ],
    events_published: [
      { event_name: 'webhook.received', description: 'Webhook received' },
    ],
    events_consumed: [],
  },
]

// ============================================================
// INTEGRATION DEFINITIONS - All Cross-Service Integrations
// ============================================================

export const SERVICE_INTEGRATIONS = [
  // Inbound integrations (other services → CS CORE)
  {
    source_service: 'saas_admin',
    target_service: SERVICE_NAME,
    integration_type: 'api_call',
    purpose: 'Customer transfer from SaaS Admin after lead conversion',
    event_triggers: ['lead.converted', 'tenant.created'],
  },
  {
    source_service: 'fls',
    target_service: SERVICE_NAME,
    integration_type: 'api_call',
    purpose: 'Integration troubleshooting requests from First Line Support',
    event_triggers: ['integration.troubleshoot_request', 'support.escalation'],
  },
  {
    source_service: 'billing',
    target_service: SERVICE_NAME,
    integration_type: 'event_subscription',
    purpose: 'Subscription lifecycle events for renewal and health tracking',
    event_triggers: ['subscription.created', 'subscription.cancelled', 'subscription.renewed', 'subscription.expiring'],
  },
  {
    source_service: 'tenant_app',
    target_service: SERVICE_NAME,
    integration_type: 'event_subscription',
    purpose: 'Usage events for health scoring and analytics',
    event_triggers: ['usage.event', 'usage.spike', 'feature.adopted'],
  },

  // Outbound integrations (CS CORE → other services)
  {
    source_service: SERVICE_NAME,
    target_service: 'internal_ops',
    integration_type: 'api_call',
    purpose: 'Attribution reporting, task creation, and time tracking',
    event_triggers: ['attribution.reported', 'task.created', 'time.logged'],
  },
  {
    source_service: SERVICE_NAME,
    target_service: 'saas_admin',
    integration_type: 'api_call',
    purpose: 'Tenant configuration sync and status updates',
    event_triggers: ['tenant.config_updated', 'health_score.critical'],
  },
  {
    source_service: SERVICE_NAME,
    target_service: 'billing',
    integration_type: 'api_call',
    purpose: 'Renewal status updates and expansion opportunities',
    event_triggers: ['renewal.completed', 'expansion.opportunity_detected'],
  },
  {
    source_service: SERVICE_NAME,
    target_service: 'fls',
    integration_type: 'event_subscription',
    purpose: 'Support ticket escalation and resolution updates',
    event_triggers: ['ticket.escalated', 'ticket.resolved'],
  },
]
