/**
 * Customer Transfer Service
 *
 * Handles customer transfer from SaaS Admin to CS-Support after go-live.
 * Creates post-onboarding customer record and assigns Client Success Manager.
 *
 * Security Contract v1 compliant: tenant_id is TEXT format "org_xxxxx"
 *
 * ARCHITECTURAL BOUNDARY ENFORCEMENT:
 * - Health scores are fetched from SaaS Admin (NO local computation)
 * - CS Core does NOT compute health scores
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { getHealthScore } from '@/lib/intelligence/client'
import { PostOnboardingSequencesService } from './post-onboarding-sequences'

export interface CustomerTransferRequest {
  customer_id?: string // Optional: if not provided, will be generated
  tenant_id: string
  customer_email: string
  go_live_date: string
  onboarding_completed_at: string
  assigned_csm_id?: string | null // Optional: if not provided, will be auto-assigned
  initial_health_score?: number | null // Optional: if not provided, will be calculated
  notes?: string | null
  metadata?: Record<string, any> | null
  tier?: 'premium' | 'standard' | 'free' // Customer tier for CSM assignment
}

export interface CustomerTransferResult {
  customer_id: string
  tenant_id: string
  customer_email: string
  assigned_csm_id: string | null
  health_score: number | null
  transferred_at: string
  success: boolean
}

export class CustomerTransferService {
  /**
   * Transfer customer from SaaS Admin to CS-Support
   * 
   * Called by SaaS Admin service after customer accepts go-live.
   * Creates post-onboarding record and assigns CSM.
   */
  static async transferCustomer(request: CustomerTransferRequest): Promise<CustomerTransferResult> {
    const supabase = await createServerSupabase()

    // Validate required fields
    if (!request.tenant_id || !request.customer_email || !request.go_live_date || !request.onboarding_completed_at) {
      throw new Error('Missing required fields: tenant_id, customer_email, go_live_date, onboarding_completed_at')
    }

    // Check if customer already exists
    const { data: existing } = await supabase
      .from('cs_customer_post_onboarding')
      .select('customer_id')
      .eq('tenant_id', request.tenant_id)
      .eq('customer_email', request.customer_email)
      .single()

    if (existing) {
      throw new Error(`Customer ${request.customer_email} already transferred to CS-Support`)
    }

    // Auto-assign CSM if not provided (tier-based)
    let assignedCsmId = request.assigned_csm_id
    const customerTier = request.tier || request.metadata?.tier || 'standard'
    if (!assignedCsmId) {
      assignedCsmId = await this.assignCSM(request.tenant_id, customerTier)
    }

    // Fetch initial health score from SaaS Admin (NO local computation)
    let initialHealthScore = request.initial_health_score
    if (initialHealthScore === null || initialHealthScore === undefined) {
      try {
        const response = await getHealthScore(request.tenant_id, request.customer_email)
        if (response.ok) {
          const healthScoreData = await response.json()
          initialHealthScore = healthScoreData?.health_score || healthScoreData?.score || null
        }
      } catch (error) {
        console.warn(`Failed to fetch initial health score for ${request.customer_email}:`, error)
        initialHealthScore = null
      }
    }

    // Create post-onboarding customer record
    const transferredAt = new Date().toISOString()
    const { data: customer, error: insertError } = await supabase
      .from('cs_customer_post_onboarding')
      .insert({
        customer_id: request.customer_id || undefined, // Use provided ID or generate new one
        tenant_id: request.tenant_id,
        customer_email: request.customer_email,
        go_live_date: request.go_live_date,
        onboarding_completed_at: request.onboarding_completed_at,
        transferred_from_onboarding_at: transferredAt,
        assigned_csm_id: assignedCsmId,
        health_score: initialHealthScore || 75, // Default 75 for new customers (optimistic baseline)
        churn_risk_level: 'healthy', // New customers start as healthy
        customer_tier: customerTier,
        notes: request.notes || null,
        metadata: {
          ...request.metadata,
          transferred_from: 'saas_admin',
          transfer_source: 'go_live_acceptance',
          tier: customerTier,
        },
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create post-onboarding customer record: ${insertError.message}`)
    }

    // Log transfer event (could be stored in audit log or metadata)
    console.log(`Customer transferred: ${request.customer_email} (${customer.customer_id}) to CSM: ${assignedCsmId || 'unassigned'}`)

    // Start 90-day post-onboarding sequence
    try {
      await PostOnboardingSequencesService.startSequence({
        customer_id: customer.customer_id,
        tenant_id: customer.tenant_id,
        go_live_date: request.go_live_date,
        tier: customerTier,
      })
      console.log(`Started 90-day post-onboarding sequence for customer ${customer.customer_id}`)
    } catch (error) {
      // Non-fatal: log error but don't fail the transfer
      console.error(`Failed to start post-onboarding sequence for ${customer.customer_id}:`, error)
    }

    return {
      customer_id: customer.customer_id,
      tenant_id: customer.tenant_id,
      customer_email: customer.customer_email,
      assigned_csm_id: customer.assigned_csm_id,
      health_score: customer.health_score,
      transferred_at: customer.transferred_from_onboarding_at,
      success: true,
    }
  }

  /**
   * Auto-assign Client Success Manager
   * 
   * Tier-based CSM assignment ratios:
   * - Premium/Founding: dedicated CSM (1:20-30, no transitions)
   * - Standard/INTAKE: onboarding CSM for 3 months, then pool
   * - Free: pool only
   */
  private static async assignCSM(tenantId: string, tier: string = 'standard'): Promise<string | null> {
    const supabase = await createServerSupabase()

    // Get all CSMs for this tenant
    const { data: csms, error } = await supabase
      .from('cs_team_members')
      .select('team_member_id, clerk_user_id, role')
      .eq('tenant_id', tenantId)
      .in('role', ['csm', 'head_of_cs', 'support_manager'])
      .eq('is_active', true)

    if (error || !csms || csms.length === 0) {
      console.warn('No active CSMs found for tenant, customer will be unassigned')
      return null
    }

    // Get current customer assignments to balance workload
    const { data: assignments } = await supabase
      .from('cs_customer_post_onboarding')
      .select('assigned_csm_id, customer_tier')
      .eq('tenant_id', tenantId)
      .not('assigned_csm_id', 'is', null)

    // Count assignments per CSM
    const assignmentCounts = new Map<string, number>()
    const premiumAssignments = new Map<string, number>()
    csms.forEach((csm) => {
      assignmentCounts.set(csm.team_member_id, 0)
      premiumAssignments.set(csm.team_member_id, 0)
    })

    assignments?.forEach((assignment) => {
      if (assignment.assigned_csm_id) {
        const current = assignmentCounts.get(assignment.assigned_csm_id) || 0
        assignmentCounts.set(assignment.assigned_csm_id, current + 1)
        
        // Track premium customers separately for dedicated CSM logic
        if (assignment.customer_tier === 'premium') {
          const premiumCount = premiumAssignments.get(assignment.assigned_csm_id) || 0
          premiumAssignments.set(assignment.assigned_csm_id, premiumCount + 1)
        }
      }
    })

    // Tier-based assignment logic
    if (tier === 'premium') {
      // For premium: assign dedicated CSM with lowest premium customer count (max 30)
      // Prefer head_of_cs or senior CSMs for premium customers
      const premiumCsms = csms.filter(c => c.role === 'head_of_cs' || c.role === 'csm')
      let minPremiumAssignments = Infinity
      let selectedCsmId: string | null = null

      for (const csm of premiumCsms) {
        const count = premiumAssignments.get(csm.team_member_id) || 0
        // Premium CSM max ratio is 1:30
        if (count < minPremiumAssignments && count < 30) {
          minPremiumAssignments = count
          selectedCsmId = csm.team_member_id
        }
      }

      if (selectedCsmId) {
        return selectedCsmId
      }
      // Fall through to standard assignment if no premium slots available
    }

    // Standard and Free: round-robin with workload balancing
    // Standard max ratio is 1:75, Free has no limit
    const maxAssignments = tier === 'standard' ? 75 : Infinity
    let minAssignments = Infinity
    let selectedCsmId: string | null = null

    for (const [csmId, count] of assignmentCounts.entries()) {
      if (count < minAssignments && count < maxAssignments) {
        minAssignments = count
        selectedCsmId = csmId
      }
    }

    return selectedCsmId
  }

  /**
   * Get transfer status for a customer
   */
  static async getTransferStatus(customerEmail: string, tenantId: string): Promise<{
    transferred: boolean
    customer_id?: string
    transferred_at?: string
    assigned_csm_id?: string | null
  }> {
    const supabase = await createServerSupabase()

    const { data: customer } = await supabase
      .from('cs_customer_post_onboarding')
      .select('customer_id, transferred_from_onboarding_at, assigned_csm_id')
      .eq('tenant_id', tenantId)
      .eq('customer_email', customerEmail)
      .single()

    if (!customer) {
      return { transferred: false }
    }

    return {
      transferred: true,
      customer_id: customer.customer_id,
      transferred_at: customer.transferred_from_onboarding_at,
      assigned_csm_id: customer.assigned_csm_id,
    }
  }
}
