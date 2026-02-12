/**
 * Scheduled Job: Post-Onboarding Flows
 * 
 * Runs daily to process:
 * - Check-in schedules
 * - Health score alerts
 * - Usage alerts
 * - Renewal reminders
 * 
 * Can be run via:
 * - Cron job (production)
 * - Scheduled task (Windows)
 * - Node.js cron library
 * - Vercel Cron Jobs
 */

import { createServerSupabase } from '@/lib/db/supabase'
import { PostOnboardingFlowsService } from '@/lib/services/post-onboarding-flows'
import { HealthScoringService } from '@/lib/services/health-scoring'
import { UsageAnalyticsService } from '@/lib/services/usage-analytics'

async function processPostOnboardingFlows() {
  console.log('🔄 Starting Post-Onboarding Flows Processing')
  console.log('=' .repeat(80))

  const supabase = createServerSupabase()
  let processedCount = 0
  let errorCount = 0

  try {
    // Get all active customers with completed onboarding
    const { data: customers, error } = await supabase
      .from('cs_customer_onboarding_progress')
      .select('customer_id, tenant_id, customer_email, onboarding_completed_at, csm_user_id')
      .eq('onboarding_status', 'completed')
      .not('onboarding_completed_at', 'is', null)

    if (error) {
      throw error
    }

    if (!customers || customers.length === 0) {
      console.log('No customers with completed onboarding found')
      return
    }

    console.log(`Found ${customers.length} customers to process`)

    // Process each customer
    for (const customer of customers) {
      try {
        console.log(`\nProcessing customer: ${customer.customer_email}`)

        // 1. Process check-in schedule
        if (customer.onboarding_completed_at) {
          await PostOnboardingFlowsService.processCheckInSchedule(
            customer.customer_id,
            customer.tenant_id,
            customer.onboarding_completed_at
          )
          console.log('  ✅ Check-in schedule processed')
        }

        // 2. Process health score alerts
        await PostOnboardingFlowsService.processHealthScoreAlerts(
          customer.customer_id,
          customer.tenant_id,
          customer.customer_email
        )
        console.log('  ✅ Health score alerts processed')

        // 3. Process usage alerts
        await PostOnboardingFlowsService.processUsageAlerts(
          customer.customer_id,
          customer.tenant_id,
          customer.customer_email
        )
        console.log('  ✅ Usage alerts processed')

        // 4. Process renewal reminders (if renewal date available)
        // This would require integration with Platform Service to get renewal dates
        // For now, skip if renewal date not available

        processedCount++
      } catch (error) {
        console.error(`  ❌ Error processing customer ${customer.customer_email}:`, error)
        errorCount++
      }
    }

    console.log('\n' + '=' .repeat(80))
    console.log('✅ Post-Onboarding Flows Processing Complete')
    console.log(`   Processed: ${processedCount}`)
    console.log(`   Errors: ${errorCount}`)
  } catch (error) {
    console.error('❌ Fatal error in post-onboarding flows processing:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  processPostOnboardingFlows()
    .then(() => {
      console.log('✅ Job completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Job failed:', error)
      process.exit(1)
    })
}

export { processPostOnboardingFlows }
