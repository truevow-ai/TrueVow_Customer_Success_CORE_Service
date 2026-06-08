/**
 * Check Dialer Permissions Setup
 * Shows current dialer permissions, phone pools, and CSM team members
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.CUSTOMER_SUCCESS_CORE_PROJECT_URL!,
  process.env.CUSTOMER_SUCCESS_CORE_DATABASE_SERVICE_ROLE_KEY!
)

async function checkDialerPermissions() {
  console.log('\n🔍 CHECKING DIALER SETUP FOR CSM\n')
  console.log('=' .repeat(50))

  // Check dialer_permissions table
  const { data: permissions, error: permError } = await supabase
    .from('dialer_permissions')
    .select('*')
  
  console.log('\n📋 DIALER PERMISSIONS')
  console.log('-' .repeat(30))
  if (permError) {
    console.log('❌ Error:', permError.message)
  } else if (!permissions || permissions.length === 0) {
    console.log('⚠️  No dialer permissions configured yet.')
    console.log('   The table exists but has no records.')
    console.log('   CSMs will NOT be able to make calls until permissions are added.')
  } else {
    console.log(`✅ Found ${permissions.length} permission record(s):\n`)
    permissions.forEach(p => {
      console.log(`   User ID: ${p.user_id}`)
      console.log(`   Role: ${p.role}`)
      console.log(`   Department: ${p.department}`)
      console.log(`   Dialer Enabled: ${p.dialer_enabled ? '✅ YES' : '❌ NO'}`)
      console.log(`   Permissions: ${JSON.stringify(p.permissions || {})}`)
      console.log(`   Number Assignment: ${p.number_assignment || 'not set'}`)
      console.log(`   Phone Number: ${p.phone_number || 'not assigned'}`)
      console.log('')
    })
  }

  // Check phone_number_pools table
  const { data: pools, error: poolError } = await supabase
    .from('phone_number_pools')
    .select('*')
  
  console.log('\n📞 PHONE NUMBER POOLS')
  console.log('-' .repeat(30))
  if (poolError) {
    console.log('❌ Error:', poolError.message)
  } else if (!pools || pools.length === 0) {
    console.log('⚠️  No phone numbers in the pool.')
    console.log('   Add Twilio numbers to the pool for outbound calling.')
    console.log('   The default Twilio number from env will be used as fallback.')
  } else {
    console.log(`✅ Found ${pools.length} phone number(s):\n`)
    pools.forEach(p => {
      console.log(`   📱 ${p.phone_number} (${p.department})`)
      console.log(`      Status: ${p.status}`)
      console.log(`      Twilio SID: ${p.twilio_number_sid || 'N/A'}`)
      console.log('')
    })
  }

  // Check team members who are CSMs
  const { data: teamMembers, error: teamError } = await supabase
    .from('cs_team_members')
    .select('clerk_user_id, email, role, department')
    .in('role', ['customer_success_manager', 'head_of_cs', 'admin'])
  
  console.log('\n👥 CSM TEAM MEMBERS')
  console.log('-' .repeat(30))
  if (teamError) {
    console.log('❌ Error:', teamError.message)
  } else if (!teamMembers || teamMembers.length === 0) {
    console.log('⚠️  No CSM team members found.')
    console.log('   Add team members first before enabling dialer.')
  } else {
    console.log(`✅ Found ${teamMembers.length} CSM team member(s):\n`)
    teamMembers.forEach(m => {
      console.log(`   👤 ${m.email || m.clerk_user_id}`)
      console.log(`      Role: ${m.role}`)
      console.log(`      Department: ${m.department || 'N/A'}`)
      console.log('')
    })
  }

  // Summary and recommendations
  console.log('\n' + '=' .repeat(50))
  console.log('📊 SUMMARY')
  console.log('=' .repeat(50))
  
  const hasPermissions = permissions && permissions.length > 0
  const hasPhonePools = pools && pools.length > 0
  const hasTeamMembers = teamMembers && teamMembers.length > 0
  
  console.log(`Dialer Permissions: ${hasPermissions ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`Phone Number Pools: ${hasPhonePools ? '✅ Available' : '⚠️  Empty (will use env default)'}`)
  console.log(`CSM Team Members: ${hasTeamMembers ? '✅ Found' : '❌ None'}`)
  
  if (!hasPermissions && hasTeamMembers) {
    console.log('\n🔧 TO ENABLE DIALER FOR CSMs:')
    console.log('Run the setup-dialer-permissions script or manually add records to dialer_permissions table.')
  }
  
  console.log('')
}

checkDialerPermissions().catch(console.error)
