/**
 * Seed Onboarding Sequence Templates
 * Automatically runs the seed SQL file to insert default onboarding templates
 */

import { createServiceSupabase } from '@/lib/db/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

async function seedOnboardingTemplates() {
  console.log('🌱 Seeding Onboarding Sequence Templates...\n')

  try {
    // Read the seed SQL file
    const seedFilePath = join(process.cwd(), 'database', 'seed_onboarding_sequence_templates.sql')
    const sql = readFileSync(seedFilePath, 'utf-8')

    // Split by semicolons to execute statements separately
    // Filter out empty statements and comments
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    const supabase = createServiceSupabase()

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip if it's just a comment or empty
      if (!statement || statement.startsWith('--') || statement.length < 10) {
        continue
      }

      try {
        console.log(`  [${i + 1}/${statements.length}] Executing statement...`)
        
        // Use Supabase RPC or direct query
        // Note: Supabase client doesn't support raw SQL directly, so we'll use the REST API
        // For now, we'll use a workaround with the service role client
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // If RPC doesn't exist, try direct execution via REST
          // This requires the SQL to be executed through Supabase dashboard or psql
          console.warn(`  ⚠️  Could not execute via RPC, this may need manual execution`)
          console.warn(`  Error: ${error.message}`)
          break
        }

        console.log(`  ✅ Statement executed successfully`)
      } catch (err: any) {
        console.error(`  ❌ Error executing statement: ${err.message}`)
        throw err
      }
    }

    console.log('\n✅ Seed script execution completed!')
    console.log('\n📋 Templates that should be inserted:')
    console.log('  • compliance_magnet_loop')
    console.log('  • founder_authority_sprint')
    console.log('  • outbound_precision_sprint')
    console.log('  • partner_influencer_push')
    console.log('  • selective_paid_capture')
    console.log('\n💡 Note: If RPC method failed, please run the SQL file manually in Supabase Dashboard')
  } catch (error: any) {
    console.error('\n❌ Error seeding templates:', error.message)
    console.error('\n💡 Alternative: Run the SQL file manually:')
    console.error('   database/seed_onboarding_sequence_templates.sql')
    process.exit(1)
  }
}

// Run the seed
seedOnboardingTemplates()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
