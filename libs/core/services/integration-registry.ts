/**
 * Integration Registry Service
 * 
 * Handles CAS specialist routing and integration configuration.
 * Called by SaaS Admin during onboarding (Steps 2-3) and post-go-live.
 * Called by FLS for troubleshooting escalations.
 * 
 * Reports attribution events to Internal Ops (Port 3006).
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { AttributionReporter } from './attribution-reporter'
import { getAgentDefinition } from '@/lib/agents/agent-definitions'
import type { 
  CASType, 
  CASConfig,
  CASIntegrationAssignment, 
  IntegrationStatus,
  HealthStatus 
} from '@/libs/types/cas-agents'

// ============================================================
// CAS Type Validation
// ============================================================

const VALID_CAS_TYPES: CASType[] = [
  'CAS-GCalendar',
  'CAS-Gmail',
  'CAS-Phone',
  'CAS-Microsoft',
  'CAS-Stripe',
  'CAS-Draft',
]

// ============================================================
// CAS Registry — OAuth/API Configuration
// ============================================================

export const CAS_REGISTRY: Record<CASType, CASConfig> = {
  // External - OAuth required (customer consent)
  'CAS-GCalendar': {
    cas_type: 'CAS-GCalendar',
    provider: 'google',
    oauth_required: true,
    oauth_scope: 'https://www.googleapis.com/auth/calendar',
    is_external: true,
  },
  'CAS-Gmail': {
    cas_type: 'CAS-Gmail',
    provider: 'google',
    oauth_required: true,
    oauth_scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
    is_external: true,
  },
  'CAS-Microsoft': {
    cas_type: 'CAS-Microsoft',
    provider: 'microsoft',
    oauth_required: true,
    oauth_scope: 'openid profile email offline_access Calendars.ReadWrite Mail.ReadWrite',
    is_external: true,
  },
  'CAS-Stripe': {
    cas_type: 'CAS-Stripe',
    provider: 'stripe',
    oauth_required: true, // Stripe Connect
    oauth_scope: 'read_write',
    is_external: true,
  },
  
  // External - API Key (TrueVow-held, not per-tenant)
  'CAS-Phone': {
    cas_type: 'CAS-Phone',
    provider: 'twilio',
    oauth_required: false,
    api_key_required: true, // TrueVow holds Twilio credentials
    is_external: true,
  },
  
  // Internal - Service-to-Service
  'CAS-Draft': {
    cas_type: 'CAS-Draft',
    provider: 'internal',
    oauth_required: false,
    api_key_required: true, // Internal service API key (DRAFT_SERVICE_API_KEY)
    is_external: false,
  },
}

export function isValidCASType(type: string): type is CASType {
  return VALID_CAS_TYPES.includes(type as CASType)
}

export function normalizeCASType(type: string): CASType | null {
  // Handle both "gcalendar" and "CAS-GCalendar" formats
  const normalized = type.startsWith('CAS-') 
    ? type 
    : `CAS-${type.charAt(0).toUpperCase()}${type.slice(1)}`
  
  return isValidCASType(normalized) ? normalized : null
}

// ============================================================
// Integration Registry Service
// ============================================================

export class IntegrationRegistry {
  
  /**
   * Configure a new integration for a tenant
   * Called by SaaS Admin during onboarding or post-go-live
   */
  static async configureIntegration(
    tenantId: string,
    casType: CASType,
    config: Record<string, unknown> = {},
    assignedTo?: string
  ): Promise<CASIntegrationAssignment> {
    const supabase = await createServerSupabase()
    
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('cas_integration_assignments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('cas_type', casType)
      .single()
    
    if (existing) {
      // Update existing assignment
      const { data, error } = await supabase
        .from('cas_integration_assignments')
        .update({
          config,
          assigned_to: assignedTo || existing.assigned_to,
          status: 'configuring' as IntegrationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('assignment_id', existing.assignment_id)
        .select()
        .single()
      
      if (error) {
        console.error('Failed to update integration assignment:', error)
        throw new Error(`Failed to update integration: ${error.message}`)
      }
      
      // Report attribution
      await this.reportAttribution(casType, tenantId, 'integration_updated', 'success')
      
      return data as CASIntegrationAssignment
    }
    
    // Create new assignment
    const { data, error } = await supabase
      .from('cas_integration_assignments')
      .insert({
        tenant_id: tenantId,
        cas_type: casType,
        status: 'pending' as IntegrationStatus,
        config,
        assigned_to: assignedTo || null,
        health_status: 'unknown' as HealthStatus,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create integration assignment:', error)
      throw new Error(`Failed to create integration: ${error.message}`)
    }
    
    // Report attribution
    await this.reportAttribution(casType, tenantId, 'integration_created', 'success')
    
    return data as CASIntegrationAssignment
  }
  
  /**
   * Get all integrations for a tenant
   */
  static async getIntegrations(tenantId: string): Promise<CASIntegrationAssignment[]> {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cas_integration_assignments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to get integrations:', error)
      throw new Error(`Failed to get integrations: ${error.message}`)
    }
    
    return (data || []) as CASIntegrationAssignment[]
  }
  
  /**
   * Get a specific integration by tenant and type
   */
  static async getIntegration(
    tenantId: string, 
    casType: CASType
  ): Promise<CASIntegrationAssignment | null> {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('cas_integration_assignments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('cas_type', casType)
      .single()
    
    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Failed to get integration:', error)
      throw new Error(`Failed to get integration: ${error.message}`)
    }
    
    return data as CASIntegrationAssignment | null
  }
  
  /**
   * Update integration status
   */
  static async updateIntegrationStatus(
    assignmentId: string,
    status: IntegrationStatus,
    healthStatus?: HealthStatus,
    errorDetails?: Record<string, unknown>
  ): Promise<CASIntegrationAssignment> {
    const supabase = await createServerSupabase()
    
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    
    if (healthStatus) {
      updateData.health_status = healthStatus
      updateData.last_health_check = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('cas_integration_assignments')
      .update(updateData)
      .eq('assignment_id', assignmentId)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to update integration status:', error)
      throw new Error(`Failed to update integration: ${error.message}`)
    }
    
    // Log health check
    if (healthStatus) {
      await this.logHealthCheck(assignmentId, healthStatus, 'manual', errorDetails)
    }
    
    return data as CASIntegrationAssignment
  }
  
  /**
   * Start troubleshooting session (escalated from FLS)
   */
  static async startTroubleshooting(
    tenantId: string,
    casType: CASType,
    ticketId: string,
    issueDescription: string,
    errorLogs?: Record<string, unknown>,
    escalatedBy?: string
  ): Promise<{ troubleshoot_id: string; assignment: CASIntegrationAssignment }> {
    const supabase = await createServerSupabase()
    
    // Get or create assignment
    let assignment = await this.getIntegration(tenantId, casType)
    
    if (!assignment) {
      // Create assignment if it doesn't exist
      assignment = await this.configureIntegration(tenantId, casType, {})
    }
    
    // Update assignment status
    await supabase
      .from('cas_integration_assignments')
      .update({
        status: 'error' as IntegrationStatus,
        health_status: 'error' as HealthStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('assignment_id', assignment.assignment_id)
    
    // Create troubleshooting log
    const { data: troubleshootLog, error } = await supabase
      .from('cas_troubleshooting_logs')
      .insert({
        assignment_id: assignment.assignment_id,
        tenant_id: tenantId,
        cas_type: casType,
        ticket_id: ticketId,
        escalated_by: escalatedBy || null,
        status: 'open',
        issue_description: issueDescription,
        error_logs: errorLogs || {},
      })
      .select()
      .single()
    
    if (error) {
      // Table might not exist yet - just log and continue
      console.warn('Failed to create troubleshooting log (table may not exist):', error)
      return {
        troubleshoot_id: 'pending',
        assignment: { ...assignment, status: 'error' as IntegrationStatus },
      }
    }
    
    // Report attribution
    await this.reportAttribution(casType, tenantId, 'troubleshooting_started', 'pending', {
      ticket_id: ticketId,
      issue_description: issueDescription,
    })
    
    return {
      troubleshoot_id: troubleshootLog.troubleshoot_id,
      assignment: { ...assignment, status: 'error' as IntegrationStatus },
    }
  }
  
  /**
   * Log health check result
   */
  static async logHealthCheck(
    assignmentId: string,
    healthStatus: HealthStatus,
    checkType: 'oauth_valid' | 'api_reachable' | 'sync_working' | 'manual',
    errorDetails?: Record<string, unknown>,
    latencyMs?: number
  ): Promise<void> {
    const supabase = await createServerSupabase()
    
    // Get assignment for tenant_id and cas_type
    const { data: assignment } = await supabase
      .from('cas_integration_assignments')
      .select('tenant_id, cas_type')
      .eq('assignment_id', assignmentId)
      .single()
    
    await supabase
      .from('integration_health_logs')
      .insert({
        assignment_id: assignmentId,
        health_status: healthStatus,
        check_type: checkType,
        error_details: errorDetails || null,
        latency_ms: latencyMs || null,
      })
    
    // Update assignment health status
    await supabase
      .from('cas_integration_assignments')
      .update({
        health_status: healthStatus,
        last_health_check: new Date().toISOString(),
      })
      .eq('assignment_id', assignmentId)
    
    // Report attribution if health changed to error
    if (assignment && healthStatus === 'error') {
      await this.reportAttribution(
        assignment.cas_type as CASType,
        assignment.tenant_id,
        'health_check_failed',
        'failure',
        errorDetails
      )
    }
  }
  
  /**
   * Get health check history for an integration
   */
  static async getHealthHistory(
    assignmentId: string,
    limit: number = 10
  ): Promise<Array<{
    health_status: HealthStatus
    check_type: string
    error_details: Record<string, unknown> | null
    latency_ms: number | null
    checked_at: string
  }>> {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('integration_health_logs')
      .select('health_status, check_type, error_details, latency_ms, checked_at')
      .eq('assignment_id', assignmentId)
      .order('checked_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Failed to get health history:', error)
      return []
    }
    
    return data || []
  }
  
  /**
   * Report attribution event to Internal Ops
   */
  private static async reportAttribution(
    casType: CASType,
    tenantId: string,
    action: string,
    outcome: 'success' | 'failure' | 'pending',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const agentDef = getAgentDefinition(casType)
    
    if (!agentDef) {
      console.warn(`No agent definition found for ${casType}`)
      return
    }
    
    try {
      await AttributionReporter.report({
        agent_type: casType,
        agent_name: agentDef.agent_name,
        service_owner: 'cs_core',
        tenant_id: tenantId,
        action,
        outcome,
        autonomy_score: agentDef.quadrant_position.autonomy_score,
        attribution_score: agentDef.quadrant_position.attribution_score,
        jtbd_layer: 'standard',
        metadata,
      })
    } catch (err) {
      // Don't fail the main operation if attribution fails
      console.error('Failed to report attribution:', err)
    }
  }
}
