/**
 * Auto-Seed Onboarding Sequence Templates
 * Inserts templates directly via Supabase API (fully automated)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// CS-Support Onboarding Templates (NOT sales CRM templates)
// These support law firm customers after they apply for INTAKE service
const templates = [
  {
    template_key: 'law_firm_pre_onboarding',
    name: 'Law Firm Pre-Onboarding Preparation',
    description: 'CSM sends automated email about preparing groundwork and checklist items before onboarding call.',
    jtbd: 'Help me prepare everything needed for a successful onboarding call.',
    tenant_id: null,
    is_default: true,
    is_active: true,
    stages: [],
    milestones: [],
    communication_flows: [],
    estimated_duration_days: 3,
    created_at: new Date().toISOString(),
  },
  {
    template_key: 'law_firm_onboarding_call',
    name: 'Law Firm Onboarding Call',
    description: 'CSM helps fill in profile information during white-glove onboarding call, then account configuration.',
    jtbd: 'Help me complete my profile setup with expert guidance.',
    tenant_id: null,
    is_default: true,
    is_active: true,
    stages: [],
    milestones: [],
    communication_flows: [],
    estimated_duration_days: 1,
    created_at: new Date().toISOString(),
  },
  {
    template_key: 'law_firm_post_onboarding_90_days',
    name: 'Law Firm Post-Onboarding Support (First 90 Days)',
    description: 'First-line AI agent + CSM team support for first 90 days of using INTAKE service.',
    jtbd: 'Help me successfully use INTAKE and resolve any issues I face.',
    tenant_id: null,
    is_default: true,
    is_active: true,
    stages: [],
    milestones: [],
    communication_flows: [],
    estimated_duration_days: 90,
    created_at: new Date().toISOString(),
  },
]

async function seedTemplates() {
  console.log('🌱 Auto-Seeding Onboarding Sequence Templates...\n')

  // Try multiple possible variable names (including custom CS_SUPPORT_* names)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                      process.env.SUPABASE_URL ||
                      process.env.CS_SUPPORT_DATABASE_URL ||
                      process.env.DATABASE_URL?.replace(/\/\/.*@/, '//').replace(/\/[^\/]*$/, '') // Extract URL from connection string
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                     process.env.SUPABASE_SERVICE_KEY || 
                     process.env.CS_SUPPORT_DATABASE_SECRET_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables:')
    console.error('   Supabase URL:', supabaseUrl ? '✅' : '❌')
    console.error('   Service Key:', serviceKey ? '✅' : '❌')
    console.error('\n💡 Looking for:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL or CS_SUPPORT_DATABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY or CS_SUPPORT_DATABASE_SECRET_KEY')
    console.error('\n💡 Available env vars with SUPABASE/CS_SUPPORT:', 
      Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('CS_SUPPORT')).join(', ') || 'none')
    console.error('\n💡 Please ensure .env.local has the Supabase URL')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`📝 Inserting ${templates.length} templates...\n`)

  let successCount = 0
  let errorCount = 0

  for (const template of templates) {
    try {
      // Use upsert with ON CONFLICT handling
      const { data, error } = await supabase
        .from('cs_onboarding_sequences')
        .upsert(template, {
          onConflict: 'template_key',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error(`  ❌ ${template.template_key}: ${error.message}`)
        errorCount++
      } else {
        console.log(`  ✅ ${template.template_key} - ${template.name}`)
        successCount++
      }
    } catch (err: any) {
      console.error(`  ❌ ${template.template_key}: ${err.message}`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successfully inserted: ${successCount}/${templates.length}`)
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`)
  }
  console.log('='.repeat(50) + '\n')

  if (successCount === templates.length) {
    console.log('🎉 All templates seeded successfully!')
    process.exit(0)
  } else {
    console.log('⚠️  Some templates failed to insert. Check errors above.')
    process.exit(1)
  }
}

seedTemplates().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})
