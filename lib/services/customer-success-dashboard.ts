/**
 * Customer Success Dashboard Service
 * 
 * Provides data for Client Success Manager dashboard focused on POST-ONBOARDING customer management:
 * - Post-onboarding customers (transferred from SaaS Admin after go-live)
 * - Customer health scores and churn risk
 * - Communication history (from existing communication tables)
 * - At-risk customer identification
 * 
 * NOTE: All onboarding workflows are handled in SaaS Admin service.
 * This service only manages customers AFTER they've completed onboarding and gone live.
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { HealthScoringService } from './health-scoring'

export interface PostOnboardingCustomer {
  customer_id: string
  customer_email: string
  tenant_id: string
  go_live_date: string
  onboarding_completed_at: string
  transferred_from_onboarding_at: string
  assigned_csm_id: string | null
  health_score: number | null
  churn_risk_level: 'low' | 'medium' | 'high' | 'critical' | null
  days_since_go_live: number
  communications_count: number
  last_communication_at: string | null
  status: 'active' | 'at_risk' | 'healthy'
  notes?: string | null
  metadata?: Record<string, any> | null
}

export interface CustomerSuccessDashboardData {
  summary: {
    total_customers: number
    total_at_risk: number
    total_healthy: number
    average_health_score: number
    average_days_since_go_live: number
  }
  active_customers: PostOnboardingCustomer[]
  at_risk_customers: PostOnboardingCustomer[]
  recent_transfers: PostOnboardingCustomer[]
  communication_stats: {
    total_communications: number
    emails_sent: number
    sms_sent: number
    calls_made: number
    last_7_days: number
  }
}

export class CustomerSuccessDashboardService {
  /**
   * Get customer success dashboard data for a tenant
   * 
   * Returns only POST-ONBOARDING customers (transferred from SaaS Admin after go-live)
   * CSMs manage these customers after they've been onboarded by Client Onboarding Managers
   */
  static async getDashboardData(tenantId: string): Promise<CustomerSuccessDashboardData> {
    const supabase = createServerSupabase()

    // Get all post-onboarding customers for this tenant
    const { data: postOnboardingCustomers, error: customersError } = await supabase
      .from('cs_customer_post_onboarding')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('transferred_from_onboarding_at', { ascending: false })

    if (customersError) {
      throw new Error(`Failed to fetch post-onboarding customers: ${customersError.message}`)
    }

    if (!postOnboardingCustomers || postOnboardingCustomers.length === 0) {
      return {
        summary: {
          total_customers: 0,
          total_at_risk: 0,
          total_healthy: 0,
          average_health_score: 0,
          average_days_since_go_live: 0,
        },
        active_customers: [],
        at_risk_customers: [],
        recent_transfers: [],
        communication_stats: {
          total_communications: 0,
          emails_sent: 0,
          sms_sent: 0,
          calls_made: 0,
          last_7_days: 0,
        },
      }
    }

    // Get customer emails for communication queries
    const customerEmails = postOnboardingCustomers.map((c) => c.customer_email)

    // Get communication history from existing tables
    const [emailsResult, smsResult, callsResult] = await Promise.all([
      // Email communications
      supabase
        .from('cs_email_sends')
        .select('*')
        .in('recipient_email', customerEmails)
        .order('sent_at', { ascending: false }),
      
      // SMS communications
      supabase
        .from('cs_sms_logs')
        .select('*')
        .in('to_number', customerEmails) // Note: This might need adjustment based on actual schema
        .order('sent_at', { ascending: false }),
      
      // Call communications
      supabase
        .from('cs_call_logs')
        .select('*')
        .in('customer_email', customerEmails)
        .order('created_at', { ascending: false }),
    ])

    const emails = emailsResult.data || []
    const smsLogs = smsResult.data || []
    const callLogs = callsResult.data || []

    // Process customers with communication data
    const now = new Date()
    const customers: PostOnboardingCustomer[] = await Promise.all(
      postOnboardingCustomers.map(async (customer) => {
        const goLiveDate = new Date(customer.go_live_date)
        const daysSinceGoLive = Math.floor((now.getTime() - goLiveDate.getTime()) / (1000 * 60 * 60 * 24))

        // Get communications for this customer
        const customerEmails = emails.filter((e) => e.recipient_email === customer.customer_email)
        const customerSms = smsLogs.filter((s) => s.to_number === customer.customer_email)
        const customerCalls = callLogs.filter((c) => c.customer_email === customer.customer_email)

        const allCommunications = [
          ...customerEmails.map((e) => ({ type: 'email', date: e.sent_at || e.created_at })),
          ...customerSms.map((s) => ({ type: 'sms', date: s.sent_at || s.created_at })),
          ...customerCalls.map((c) => ({ type: 'call', date: c.created_at })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const communicationsCount = allCommunications.length
        const lastCommunicationAt = allCommunications[0]?.date || null

        // Fetch health score if not already set
        let healthScore = customer.health_score
        if (healthScore === null) {
          try {
            const healthScoreData = await HealthScoringService.getCustomerHealthScore(
              customer.tenant_id,
              customer.customer_email
            )
            healthScore = healthScoreData?.overall_score || null
          } catch (error) {
            console.warn(`Failed to fetch health score for ${customer.customer_email}:`, error)
          }
        }

        // Determine status based on health score and churn risk
        let status: 'active' | 'at_risk' | 'healthy' = 'active'
        if (customer.churn_risk_level === 'critical' || customer.churn_risk_level === 'high') {
          status = 'at_risk'
        } else if (healthScore !== null && healthScore >= 70 && customer.churn_risk_level === 'low') {
          status = 'healthy'
        } else if (healthScore !== null && healthScore < 50) {
          status = 'at_risk'
        }

        return {
          customer_id: customer.customer_id,
          customer_email: customer.customer_email,
          tenant_id: customer.tenant_id,
          go_live_date: customer.go_live_date,
          onboarding_completed_at: customer.onboarding_completed_at,
          transferred_from_onboarding_at: customer.transferred_from_onboarding_at,
          assigned_csm_id: customer.assigned_csm_id,
          health_score: healthScore,
          churn_risk_level: customer.churn_risk_level,
          days_since_go_live: daysSinceGoLive,
          communications_count: communicationsCount,
          last_communication_at: lastCommunicationAt,
          status,
          notes: customer.notes,
          metadata: customer.metadata,
        }
      })
    )

    // Calculate summary statistics
    const totalCustomers = customers.length
    const atRiskCustomers = customers.filter((c) => c.status === 'at_risk')
    const healthyCustomers = customers.filter((c) => c.status === 'healthy')
    const activeCustomers = customers.filter((c) => c.status === 'active')

    const customersWithHealth = customers.filter((c) => c.health_score !== null)
    const averageHealthScore =
      customersWithHealth.length > 0
        ? customersWithHealth.reduce((sum, c) => sum + (c.health_score || 0), 0) / customersWithHealth.length
        : 0

    const averageDaysSinceGoLive =
      customers.length > 0
        ? customers.reduce((sum, c) => sum + c.days_since_go_live, 0) / customers.length
        : 0

    // Calculate communication stats
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const allComms = [
      ...emails.map((e) => ({ type: 'email', date: e.sent_at || e.created_at })),
      ...smsLogs.map((s) => ({ type: 'sms', date: s.sent_at || s.created_at })),
      ...callLogs.map((c) => ({ type: 'call', date: c.created_at })),
    ]

    const emailsSent = emails.length
    const smsSent = smsLogs.length
    const callsMade = callLogs.length
    const last7Days = allComms.filter((c) => new Date(c.date) >= sevenDaysAgo).length

    // Get recent transfers (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentTransfers = customers
      .filter((c) => new Date(c.transferred_from_onboarding_at) >= thirtyDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.transferred_from_onboarding_at).getTime() -
          new Date(a.transferred_from_onboarding_at).getTime()
      )
      .slice(0, 10)

    return {
      summary: {
        total_customers: totalCustomers,
        total_at_risk: atRiskCustomers.length,
        total_healthy: healthyCustomers.length,
        average_health_score: Math.round(averageHealthScore),
        average_days_since_go_live: Math.round(averageDaysSinceGoLive),
      },
      active_customers: activeCustomers.slice(0, 20), // Limit to 20 for performance
      at_risk_customers: atRiskCustomers.slice(0, 10),
      recent_transfers: recentTransfers,
      communication_stats: {
        total_communications: allComms.length,
        emails_sent: emailsSent,
        sms_sent: smsSent,
        calls_made: callsMade,
        last_7_days: last7Days,
      },
    }
  }

  /**
   * Get post-onboarding customer details
   */
  static async getCustomerDetails(customerId: string): Promise<PostOnboardingCustomer | null> {
    const supabase = createServerSupabase()

    const { data: customer, error } = await supabase
      .from('cs_customer_post_onboarding')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    if (error || !customer) {
      return null
    }

    const now = new Date()
    const goLiveDate = new Date(customer.go_live_date)
    const daysSinceGoLive = Math.floor((now.getTime() - goLiveDate.getTime()) / (1000 * 60 * 60 * 24))

    // Get communications
    const [emailsResult, smsResult, callsResult] = await Promise.all([
      supabase
        .from('cs_email_sends')
        .select('*')
        .eq('recipient_email', customer.customer_email)
        .order('sent_at', { ascending: false }),
      supabase
        .from('cs_sms_logs')
        .select('*')
        .eq('to_number', customer.customer_email) // Note: Adjust based on actual schema
        .order('sent_at', { ascending: false }),
      supabase
        .from('cs_call_logs')
        .select('*')
        .eq('customer_email', customer.customer_email)
        .order('created_at', { ascending: false }),
    ])

    const emails = emailsResult.data || []
    const smsLogs = smsResult.data || []
    const callLogs = callsResult.data || []

    const allCommunications = [
      ...emails.map((e) => ({ type: 'email', date: e.sent_at || e.created_at })),
      ...smsLogs.map((s) => ({ type: 'sms', date: s.sent_at || s.created_at })),
      ...callLogs.map((c) => ({ type: 'call', date: c.created_at })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Fetch health score
    let healthScore = customer.health_score
    if (healthScore === null) {
      try {
        const healthScoreData = await HealthScoringService.getCustomerHealthScore(
          customer.tenant_id,
          customer.customer_email
        )
        healthScore = healthScoreData?.overall_score || null
      } catch (error) {
        console.warn(`Failed to fetch health score for ${customer.customer_email}:`, error)
      }
    }

    // Determine status
    let status: 'active' | 'at_risk' | 'healthy' = 'active'
    if (customer.churn_risk_level === 'critical' || customer.churn_risk_level === 'high') {
      status = 'at_risk'
    } else if (healthScore !== null && healthScore >= 70 && customer.churn_risk_level === 'low') {
      status = 'healthy'
    } else if (healthScore !== null && healthScore < 50) {
      status = 'at_risk'
    }

    return {
      customer_id: customer.customer_id,
      customer_email: customer.customer_email,
      tenant_id: customer.tenant_id,
      go_live_date: customer.go_live_date,
      onboarding_completed_at: customer.onboarding_completed_at,
      transferred_from_onboarding_at: customer.transferred_from_onboarding_at,
      assigned_csm_id: customer.assigned_csm_id,
      health_score: healthScore,
      churn_risk_level: customer.churn_risk_level,
      days_since_go_live: daysSinceGoLive,
      communications_count: allCommunications.length,
      last_communication_at: allCommunications[0]?.date || null,
      status,
      notes: customer.notes,
      metadata: customer.metadata,
    }
  }
}
