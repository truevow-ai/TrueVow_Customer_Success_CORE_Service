/**
 * Post-Onboarding Support Flows Service
 * 
 * Implements check-in schedules, escalation paths, and automation rules
 * Based on the design in docs/POST_ONBOARDING_SUPPORT_FLOWS.md
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { CommunicationSenderService } from './communication-sender'
import { HealthScoringService, HealthScore } from './health-scoring'
import { UsageAnalyticsService, UsagePattern } from './usage-analytics'
import { InternalOpsServiceClient } from '@/lib/integrations/internal-ops-client'

export interface CheckInSchedule {
  phase: 'immediate' | 'early_adoption' | 'established' | 'long_term'
  daysAfterOnboarding: number
  type: 'call' | 'email' | 'sms'
  duration?: number // minutes for calls
  templateKey?: string
  required: boolean
}

export interface EscalationRule {
  trigger: string
  condition: (context: any) => boolean
  action: 'escalate_to_csm' | 'escalate_to_engineering' | 'escalate_to_billing' | 'escalate_to_head_of_cs'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  responseTime?: number // hours
}

export interface HealthScoreAlert {
  threshold: number
  dropAmount: number
  action: 'email_csm' | 'call_csm' | 'create_task'
  followUpHours: number
}

export class PostOnboardingFlowsService {
  /**
   * Get check-in schedule for customer based on onboarding completion date
   */
  static getCheckInSchedule(daysSinceOnboarding: number): CheckInSchedule[] {
    const schedules: CheckInSchedule[] = []

    // Phase 1: Immediate Post-Onboarding (Days 1-7)
    if (daysSinceOnboarding <= 7) {
      schedules.push(
        { phase: 'immediate', daysAfterOnboarding: 1, type: 'email', templateKey: 'welcome_post_onboarding', required: false },
        { phase: 'immediate', daysAfterOnboarding: 3, type: 'email', templateKey: 'quick_checkin_3days', required: false },
        { phase: 'immediate', daysAfterOnboarding: 7, type: 'call', duration: 30, templateKey: 'week1_checkin_call', required: true },
      )
    }

    // Phase 2: Early Adoption (Days 8-30)
    if (daysSinceOnboarding > 7 && daysSinceOnboarding <= 30) {
      schedules.push(
        { phase: 'early_adoption', daysAfterOnboarding: 14, type: 'email', templateKey: 'mid_month_checkin', required: false },
        { phase: 'early_adoption', daysAfterOnboarding: 30, type: 'call', duration: 45, templateKey: 'month1_review_call', required: true },
      )
    }

    // Phase 3: Established Customer (Days 31-90)
    if (daysSinceOnboarding > 30 && daysSinceOnboarding <= 90) {
      schedules.push(
        { phase: 'established', daysAfterOnboarding: 60, type: 'call', duration: 60, templateKey: 'quarterly_review_call', required: true },
        { phase: 'established', daysAfterOnboarding: 90, type: 'call', duration: 60, templateKey: 'end_of_quarter_review', required: true },
      )
    }

    // Phase 4: Long-term Customer (90+ Days)
    if (daysSinceOnboarding > 90) {
      // Monthly health score review (automated)
      // Quarterly scheduled check-in
      const quartersSinceOnboarding = Math.floor(daysSinceOnboarding / 90)
      schedules.push(
        { phase: 'long_term', daysAfterOnboarding: quartersSinceOnboarding * 90, type: 'call', duration: 60, templateKey: 'quarterly_review_call', required: true },
      )
    }

    return schedules
  }

  /**
   * Check if check-in is due and send if needed
   */
  static async processCheckInSchedule(
    customerId: string,
    tenantId: string,
    onboardingCompletedAt: string
  ): Promise<void> {
    const supabase = createServerSupabase()
    
    // Calculate days since onboarding
    const completedDate = new Date(onboardingCompletedAt)
    const now = new Date()
    const daysSinceOnboarding = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24))

    // Get scheduled check-ins
    const schedules = this.getCheckInSchedule(daysSinceOnboarding)

    // Get customer info from post-onboarding table
    const { data: customer } = await supabase
      .from('cs_customer_post_onboarding')
      .select('customer_email, assigned_csm_id')
      .eq('customer_id', customerId)
      .single()

    if (!customer) {
      throw new Error('Customer not found')
    }

    // Process each scheduled check-in
    for (const schedule of schedules) {
      // Check if this check-in has already been sent
      // Check in appropriate communication table based on type
      let existing = null
      if (schedule.type === 'email') {
        const { data } = await supabase
          .from('cs_email_sends')
          .select('email_id')
          .eq('to_email', customer.customer_email)
          .eq('metadata->>template_key', schedule.templateKey || '')
          .single()
        existing = data
      } else if (schedule.type === 'sms') {
        const { data } = await supabase
          .from('cs_sms_logs')
          .select('log_id')
          .eq('to_number', customer.customer_email) // Note: May need adjustment based on actual schema
          .eq('metadata->>template_key', schedule.templateKey || '')
          .single()
        existing = data
      } else if (schedule.type === 'call') {
        const { data } = await supabase
          .from('cs_call_logs')
          .select('log_id')
          .eq('to_number', customer.customer_email) // Note: May need adjustment based on actual schema
          .eq('metadata->>template_key', schedule.templateKey || '')
          .single()
        existing = data
      }

      if (existing) {
        continue // Already sent
      }

      // Check if it's time to send (within 1 day of scheduled date)
      const scheduledDate = new Date(completedDate)
      scheduledDate.setDate(scheduledDate.getDate() + schedule.daysAfterOnboarding)
      
      const daysUntilCheckIn = Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilCheckIn <= 1 && daysUntilCheckIn >= -1) {
        // Time to send check-in
        try {
          await CommunicationSenderService.sendCommunication({
            templateKey: schedule.templateKey || 'default_checkin',
            to: schedule.type === 'call' ? customer.customer_email : customer.customer_email,
            variables: {
              customer_name: customer.customer_email.split('@')[0], // Fallback
              days_since_onboarding: daysSinceOnboarding,
            },
            tenantId,
            customerEmail: customer.customer_email,
            metadata: {
              check_in_type: schedule.type,
              check_in_phase: schedule.phase,
              days_after_onboarding: schedule.daysAfterOnboarding,
              csm_user_id: customer.assigned_csm_id,
            },
          })
        } catch (error) {
          console.error(`Failed to send check-in for customer ${customerId}:`, error)
        }
      }
    }
  }

  /**
   * Check health score and trigger alerts if needed
   */
  static async processHealthScoreAlerts(
    customerId: string,
    tenantId: string,
    customerEmail: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    try {
      // Get current health score (calculate if doesn't exist)
      let currentHealth = await HealthScoringService.getHealthScore(tenantId, customerEmail)
      
      // If no health score exists, calculate it
      if (!currentHealth) {
        currentHealth = await HealthScoringService.calculateHealthScore(tenantId, customerEmail)
      }
      
      if (!currentHealth) {
        return
      }

      // Get previous health score
      const { data: previousHealth } = await supabase
        .from('cs_customer_health_scores')
        .select('health_score')
        .eq('tenant_id', tenantId)
        .eq('customer_email', customerEmail)
        .order('calculated_at', { ascending: false })
        .limit(2)
        .single()

      const previousHealthScore = previousHealth?.health_score

      // Health Score Drop Alert
      if (previousHealthScore && currentHealth.health_score < previousHealthScore) {
        const dropAmount = previousHealthScore - currentHealth.health_score
        
        if (currentHealth.health_score < 40 || dropAmount > 10) {
          // Get customer info from post-onboarding table
          const { data: customer } = await supabase
            .from('cs_customer_post_onboarding')
            .select('customer_email, assigned_csm_id')
            .eq('customer_id', customerId)
            .single()

          if (!customer) {
            return
          }

          // Create task for CSM via Internal Ops
          if (customer.csm_user_id) {
            try {
              const internalOpsClient = new InternalOpsServiceClient()
              await internalOpsClient.createTask({
                title: `Health Score Alert: ${customerEmail}`,
                description: `Customer health score dropped from ${previousHealthScore} to ${currentHealth.health_score} (drop of ${dropAmount} points)`,
                assigned_to: customer.csm_user_id,
                priority: currentHealth.health_score < 30 ? 'urgent' : 'high',
                related_customer_id: customerId,
                service: 'cs-support',
                due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
                metadata: {
                  alert_type: 'health_score_drop',
                  health_score: currentHealth.health_score,
                  previous_health_score: previousHealthScore,
                  drop_amount: dropAmount,
                },
              })
            } catch (error) {
              console.error('Failed to create task in Internal Ops:', error)
            }
          }
          
          // Send check-in email to customer
          try {
            await CommunicationSenderService.sendCommunication({
              templateKey: 'health_score_drop_alert',
              to: customer.customer_email,
              variables: {
                customer_name: customer.customer_email.split('@')[0],
                health_score: currentHealth.health_score,
                previous_health_score: previousHealthScore,
              },
              tenantId,
              customerEmail: customer.customer_email,
              metadata: {
                alert_type: 'health_score_drop',
                health_score: currentHealth.health_score,
                previous_health_score: previousHealthScore,
                drop_amount: dropAmount,
                csm_user_id: customer.assigned_csm_id,
              },
            })
          } catch (error) {
            console.error(`Failed to send health score alert:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error processing health score alerts:', error)
    }
  }

  /**
   * Check usage and trigger low usage alerts
   */
  static async processUsageAlerts(
    customerId: string,
    tenantId: string,
    customerEmail: string
  ): Promise<void> {
    const supabase = createServerSupabase()

    try {
      // Get usage pattern from Usage Analytics service
      // Note: calculateUsagePattern requires user_id, so we'll get it from customer
      const { data: customer } = await supabase
        .from('cs_customer_post_onboarding')
        .select('customer_id')
        .eq('customer_id', customerId)
        .single()

      if (!customer) {
        return
      }

      // For usage pattern, we need a user_id - use customer_id as fallback
      // In production, this would map to actual user accounts
      const userId = customer.customer_id // This should be mapped to actual user_id
      
      const usagePattern = await UsageAnalyticsService.calculateUsagePattern(tenantId, userId)
      
      if (!usagePattern) {
        return
      }

      // Calculate expected usage (based on tenant size, plan, etc.)
      // For now, use a simple threshold
      const expectedUsage = 10 // Could be calculated based on plan/features
      const currentUsage = usagePattern.features_used_count
      const daysSinceLastUse = usagePattern.days_since_last_activity

      // Low Usage Alert
      if (currentUsage < expectedUsage * 0.5 && daysSinceLastUse > 7) {
        const { data: customer } = await supabase
          .from('cs_customer_post_onboarding')
          .select('customer_email, assigned_csm_id')
          .eq('customer_id', customerId)
          .single()

        if (!customer) {
          return
        }

        // Create task for CSM
        if (customer.csm_user_id) {
          try {
            const internalOpsClient = new InternalOpsServiceClient()
            await internalOpsClient.createTask({
              title: `Low Usage Alert: ${customerEmail}`,
              description: `Customer has low usage (${currentUsage} features used, expected ${expectedUsage}). Last activity: ${daysSinceLastUse} days ago.`,
              assigned_to: customer.csm_user_id,
              priority: daysSinceLastUse > 14 ? 'high' : 'medium',
              related_customer_id: customerId,
              service: 'cs-support',
              metadata: {
                alert_type: 'low_usage',
                current_usage: currentUsage,
                expected_usage: expectedUsage,
                days_since_last_use: daysSinceLastUse,
              },
            })
          } catch (error) {
            console.error('Failed to create task in Internal Ops:', error)
          }
        }

        // Send low usage alert
        try {
          await CommunicationSenderService.sendCommunication({
            templateKey: 'low_usage_alert',
            to: customer.customer_email,
            variables: {
              customer_name: customer.customer_email.split('@')[0],
              days_since_last_use: daysSinceLastUse,
            },
            tenantId,
            customerEmail: customer.customer_email,
            metadata: {
              alert_type: 'low_usage',
              current_usage: currentUsage,
              expected_usage: expectedUsage,
              days_since_last_use: daysSinceLastUse,
              csm_user_id: customer.assigned_csm_id,
            },
          })
        } catch (error) {
          console.error(`Failed to send low usage alert:`, error)
        }
      }
    } catch (error) {
      console.error('Error processing usage alerts:', error)
    }
  }

  /**
   * Process renewal reminders
   */
  static async processRenewalReminders(
    customerId: string,
    tenantId: string,
    renewalDate: string
  ): Promise<void> {
    const supabase = createServerSupabase()
    
    const renewal = new Date(renewalDate)
    const now = new Date()
    const daysUntilRenewal = Math.floor((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Send reminder at 60 days before renewal
    if (daysUntilRenewal === 60) {
      const { data: customer } = await supabase
        .from('cs_customer_post_onboarding')
        .select('customer_email, assigned_csm_id')
        .eq('customer_id', customerId)
        .single()

      if (!customer) {
        return
      }

      try {
        await CommunicationSenderService.sendCommunication({
          templateKey: 'renewal_reminder_60days',
          to: customer.customer_email,
          variables: {
            customer_name: customer.customer_email.split('@')[0],
            renewal_date: renewalDate,
            days_until_renewal: daysUntilRenewal,
          },
          tenantId,
          customerEmail: customer.customer_email,
          metadata: {
            reminder_type: 'renewal',
            days_until_renewal: daysUntilRenewal,
            renewal_date: renewalDate,
            csm_user_id: customer.csm_user_id,
          },
        })
      } catch (error) {
        console.error(`Failed to send renewal reminder:`, error)
      }
    }
  }

  /**
   * Determine escalation path based on issue type
   */
  static getEscalationPath(issueType: string, priority: string): {
    team: string
    responseTime: number // hours
    action: string
  } {
    const escalationMap: Record<string, Record<string, any>> = {
      technical: {
        low: { team: 'solutions_engineer', responseTime: 24, action: 'escalate_to_solutions_engineer' },
        medium: { team: 'solutions_engineer', responseTime: 12, action: 'escalate_to_solutions_engineer' },
        high: { team: 'engineering', responseTime: 4, action: 'escalate_to_engineering' },
        urgent: { team: 'engineering', responseTime: 2, action: 'escalate_to_engineering' },
      },
      billing: {
        low: { team: 'billing', responseTime: 24, action: 'escalate_to_billing' },
        medium: { team: 'billing', responseTime: 12, action: 'escalate_to_billing' },
        high: { team: 'billing_csm', responseTime: 4, action: 'escalate_to_billing_csm' },
        urgent: { team: 'billing_csm', responseTime: 2, action: 'escalate_to_billing_csm' },
      },
      account: {
        low: { team: 'csm', responseTime: 24, action: 'escalate_to_csm' },
        medium: { team: 'csm', responseTime: 12, action: 'escalate_to_csm' },
        high: { team: 'head_of_cs', responseTime: 4, action: 'escalate_to_head_of_cs' },
        urgent: { team: 'head_of_cs', responseTime: 2, action: 'escalate_to_head_of_cs' },
      },
      feature_request: {
        low: { team: 'product', responseTime: 72, action: 'escalate_to_product' },
        medium: { team: 'product', responseTime: 48, action: 'escalate_to_product' },
        high: { team: 'product', responseTime: 24, action: 'escalate_to_product' },
        urgent: { team: 'product', responseTime: 12, action: 'escalate_to_product' },
      },
    }

    return escalationMap[issueType]?.[priority] || {
      team: 'csm',
      responseTime: 24,
      action: 'escalate_to_csm',
    }
  }
}
