/**
 * CAS Agent Types
 * 
 * Type definitions for Customer Automation Specialist agents and
 * the Internal Ops Agent Framework integration.
 * 
 * Source: Internal Ops Agent Framework Spec
 */

// ============================================================
// CAS Agent Types
// ============================================================

export type CASType = 
  | 'CAS-GCalendar'
  | 'CAS-Gmail'
  | 'CAS-Phone'
  | 'CAS-Microsoft'
  | 'CAS-Stripe'
  | 'CAS-Draft'

export type OAuthProvider = 'google' | 'microsoft' | 'stripe' | 'twilio' | 'internal'

export interface CASConfig {
  cas_type: CASType
  provider: OAuthProvider
  oauth_required: boolean
  oauth_scope?: string
  api_key_required?: boolean
  is_external: boolean
}

export type IntegrationStatus = 'pending' | 'configured' | 'active' | 'error' | 'disabled'
export type HealthStatus = 'healthy' | 'degraded' | 'error' | 'unknown'

export interface CASIntegrationAssignment {
  assignment_id: string
  tenant_id: string
  cas_type: CASType
  status: IntegrationStatus
  config: Record<string, unknown>
  assigned_to: string | null
  last_health_check: string | null
  health_status: HealthStatus
  created_at: string
  updated_at: string
}

export interface IntegrationHealthLog {
  log_id: string
  assignment_id: string
  health_status: HealthStatus
  check_type: 'oauth_valid' | 'api_reachable' | 'sync_working' | 'manual'
  error_details: Record<string, unknown> | null
  latency_ms: number | null
  checked_at: string
}

export interface IntegrationOAuthToken {
  token_id: string
  tenant_id: string
  provider: 'google' | 'microsoft' | 'stripe'
  encrypted_access_token: string
  encrypted_refresh_token: string | null
  expires_at: string | null
  scope: string[]
  created_at: string
  updated_at: string
}

// ============================================================
// Agent Framework Types (Internal Ops Spec)
// ============================================================

export type JtbdLayerType = 'standard' | 'customer_value' | 'org_value'
export type AutonomyTier = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'
export type RolloutPhase = 'suggest_only' | 'limited_execution' | 'strategic' | 'full_autonomous' | 'deprecated'
export type ExecutionMode = 'deterministic' | 'llm_powered'
export type ImprovementAction = 'retrain_model' | 'revise_prompt' | 'update_playbook' | 'review_data' | 'escalate_human'
export type QuadrantType = 'top_right' | 'top_left' | 'bottom_right' | 'bottom_left'
export type TrainingDataSource = 'health_scores' | 'onboarding_sequences' | 'churn_events' | 'renewal_outcomes' | 'integration_health'

export interface JtbdLayer {
  layer: JtbdLayerType
  job_statement: string
  success_metric: string
  target_value: number
  unit: string
}

export interface JtbdPerformanceTarget {
  metric: string
  target_value: number
  unit: string
  jtbd_layer: JtbdLayerType
  drift_threshold_pct: number
  improvement_action: ImprovementAction
}

export interface TrainingCycleConfig {
  review_cadence_hours: number
  attribution_floor: number
  graduation_threshold: number
  training_data_source: TrainingDataSource
  rollback_on_regression: boolean
}

export interface QuadrantPosition {
  autonomy_score: number
  attribution_score: number
  quadrant: QuadrantType
  target_quadrant?: QuadrantType
}

export interface CSCoreAgentDefinition {
  agent_type: string
  agent_name: string
  autonomy_tier: AutonomyTier
  rollout_phase: RolloutPhase
  approval_required_for: string[]
  jtbd_layers: JtbdLayer[]
  jtbd_performance_targets: JtbdPerformanceTarget[]
  training_cycle: TrainingCycleConfig
  quadrant_position: QuadrantPosition
  attribution_metrics: Record<string, string>
  execution_mode: ExecutionMode
  
  // Expanded fields (matches FLS schema for Internal Ops)
  role_responsibilities?: RoleResponsibilities
  brief_config?: BriefConfig
  execution_config?: ExecutionConfig
  performance_metrics?: PerformanceMetrics
  autonomy_actions?: AutonomyActions
  customer_outcome_metrics?: OutcomeMetric[]
  business_outcome_metrics?: OutcomeMetric[]
  service_stage?: ServiceStage
  truevow_service?: TrueVowService
  status?: AgentStatus
  
  // CAS-specific fields (external integrations)
  is_external?: boolean
  oauth_provider?: OAuthProvider
  oauth_scope?: string
  api_key_provider?: string // For non-OAuth integrations like Twilio
}

// ============================================================
// Expanded Agent Configuration Types (Internal Ops Compatible)
// ============================================================

export type ServiceStage = 'Pre-sale' | 'Post-sale' | 'Retention' | 'All stages'
export type TrueVowService = 'INTAKE' | 'DRAFT' | 'VERIFY' | 'SETTLE' | 'CONNECT' | 'ALL'
export type AgentStatus = 'active' | 'inactive' | 'testing' | 'maintenance'
export type AgentTone = 'professional' | 'friendly' | 'formal'
export type ResponseStyle = 'concise' | 'detailed'
export type FallbackAction = 'escalate_human' | 'log_and_retry' | 'fail_silently'

export interface RoleResponsibilities {
  primary_mission: string
  scope: string[]
  boundaries: string[]
  escalation_paths: Record<string, string>
}

export interface BriefConfig {
  personality: string
  tone: string
  response_style: string
  communication_cadence?: string
}

export interface ExecutionConfig {
  workflow_engine: 'deterministic' // CS CORE is always deterministic
  max_retries: number
  timeout_ms: number
  fallback_action: FallbackAction
}

export interface PerformanceMetrics {
  total_executions: number
  avg_execution_time_ms: number
  success_rate: number
  escalation_rate: number
  customer_satisfaction: number
}

export interface AutonomyActions {
  fully_autonomous: string[]
  requires_approval: string[]
  human_only: string[]
}

export interface OutcomeMetric {
  metric: string
  description: string
  target: number
  unit: string
}

// ============================================================
// Agent Execution Tracking Types
// ============================================================

export type ExecutionType = 
  | 'sequence_trigger'      // CSM: trigger 90-day sequence step
  | 'health_check'          // CSM: calculate health score
  | 'churn_detection'       // CSM: detect churn risk
  | 'integration_configure' // CAS: configure integration
  | 'integration_health'    // CAS: check integration health
  | 'oauth_refresh'         // CAS: refresh OAuth token
  | 'troubleshoot'          // CAS: troubleshoot integration issue
  | 'template_sync'         // CAS-Draft: sync document templates
  | 'escalate'              // All: escalate to human

export type ExecutionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'timeout' | 'escalated'
export type TriggerSource = 'saas_admin' | 'fls' | 'cron' | 'manual'

export interface CSCoreAgentExecution {
  execution_id: string
  agent_id: string
  tenant_id: string
  execution_type: ExecutionType
  trigger_source: TriggerSource
  input_context: Record<string, unknown>
  output_result: Record<string, unknown>
  status: ExecutionStatus
  error_message: string | null
  started_at: string
  completed_at: string | null
  execution_time_ms: number | null
  jtbd_layer: JtbdLayerType | null
  autonomy_score: number | null
  attribution_score: number | null
  created_at: string
}

export interface CreateExecutionRequest {
  agent_type: string
  tenant_id: string
  execution_type: ExecutionType
  trigger_source: TriggerSource
  input_context?: Record<string, unknown>
}

export interface CompleteExecutionRequest {
  execution_id: string
  status: ExecutionStatus
  output_result?: Record<string, unknown>
  error_message?: string
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface ConfigureIntegrationRequest {
  tenant_id: string
  integration_config?: Record<string, unknown>
  assigned_to?: string
}

export interface ConfigureIntegrationResponse {
  success: boolean
  assignment: CASIntegrationAssignment
}

export interface TroubleshootIntegrationRequest {
  tenant_id: string
  ticket_id?: string
  integration_id?: string
  issue_description: string
  error_logs?: Record<string, unknown>
}

export interface TroubleshootIntegrationResponse {
  success: boolean
  troubleshoot_id: string
  assigned_to: string | null
  status: string
}

export interface IntegrationHealthResponse {
  assignment_id: string
  tenant_id: string
  cas_type: CASType
  health_status: HealthStatus
  last_check: string | null
  error_details: Record<string, unknown> | null
}

// ============================================================
// Attribution Event (for Internal Ops reporting)
// ============================================================

export interface AttributionEvent {
  agent_type: string
  agent_name?: string
  service_owner: 'cs_core'
  tenant_id?: string
  action: string
  outcome: 'success' | 'failure' | 'pending'
  autonomy_score?: number
  attribution_score?: number
  jtbd_layer?: JtbdLayerType
  metadata?: Record<string, unknown>
}
