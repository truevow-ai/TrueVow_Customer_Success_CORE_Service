/**
 * Auto-Seed Onboarding Sequence Templates
 * Executes the seed SQL file using Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function seedTemplates() {
  console.log('🌱 Seeding Onboarding Sequence Templates...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅' : '❌')
    console.error('\n💡 Please set these in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Read SQL file
  const sqlPath = join(process.cwd(), 'database', 'seed_onboarding_sequence_templates.sql')
  const sql = readFileSync(sqlPath, 'utf-8')

  console.log(`📄 Read SQL file: ${sqlPath}\n`)

  // Execute SQL using Supabase REST API
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/))

  console.log(`📝 Found ${statements.length} statements to execute\n`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    if (!stmt || stmt.length < 10) continue

    try {
      console.log(`  [${i + 1}/${statements.length}] Executing...`)
      
      // Use Supabase REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ sql_query: stmt }),
      })

      if (!response.ok) {
        // Try direct SQL execution via PostgREST
        // Alternative: Use the SQL editor API if available
        console.log(`  ⚠️  RPC method not available, trying alternative...`)
        
        // For Supabase, we need to use the SQL editor API or psql
        // Since that's not directly available, we'll provide instructions
        console.log(`  ℹ️  Direct SQL execution requires Supabase Dashboard or psql`)
        break
      }

      console.log(`  ✅ Success`)
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`)
    }
  }

  // Since direct SQL execution via API is limited, provide manual instructions
  console.log('\n📋 Templates to be inserted:')
  console.log('  • compliance_magnet_loop')
  console.log('  • founder_authority_sprint')
  console.log('  • outbound_precision_sprint')
  console.log('  • partner_influencer_push')
  console.log('  • selective_paid_capture')
  console.log('\n💡 To complete seeding, run the SQL file in Supabase Dashboard:')
  console.log('   database/seed_onboarding_sequence_templates.sql')
  console.log('\n✅ Script completed!')
}

seedTemplates().catch(console.error)
