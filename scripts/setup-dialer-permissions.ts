/**
 * Setup Dialer Permissions for CSMs
 * Adds dialer permissions for the current user to enable outbound calling
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.CUSTOMER_SUCCESS_CORE_PROJECT_URL!,
  process.env.CUSTOMER_SUCCESS_CORE_DATABASE_SERVICE_ROLE_KEY!
)

async function setupDialerPermissions() {
  console.log('\n🔧 SETTING UP DIALER PERMISSIONS FOR CSM\n')
  console.log('=' .repeat(50))

  // First, check cs_team_members structure
  const { data: teamMembers, error: teamError } = await supabase
    .from('cs_team_members')
    .select('*')
    .limit(5)
  
  if (teamError) {
    console.log('❌ Error fetching team members:', teamError.message)
    return
  }

  console.log('\n👥 Found Team Members:')
  if (!teamMembers || teamMembers.length === 0) {
    console.log('   No team members found. Creating a default CSM permission...')
  } else {
    console.log(`   Found ${teamMembers.length} team member(s)`)
    
    // Show columns available
    const columns = Object.keys(teamMembers[0])
    console.log('\n   Available columns:', columns.join(', '))
  }
  
  // Create a default dialer permission that can be used for testing
  // This uses a valid UUID format
  const testUserId = 'a0000000-0000-0000-0000-000000000001'
  
  const { data: existing } = await supabase
    .from('dialer_permissions')
    .select('*')
    .eq('user_id', testUserId)
    .single()
  
  if (existing) {
    console.log(`\n   ✅ Test CSM already has dialer permissions`)
  } else {
    const { error: insertError } = await supabase
      .from('dialer_permissions')
      .insert({
        user_id: testUserId,
        role: 'customer_success_manager',
        department: 'customer_success',
        dialer_enabled: true,
        permissions: {
          inbound: false,
          outbound: true,
          parallel_dialing: false,
          conference_rooms: false,
          call_coaching: false,
          recording: true,
          transcription: true
        },
        number_assignment: 'pool',
        phone_number: null
      })
    
    if (insertError) {
      console.log('   ❌ Error creating permission:', insertError.message)
    } else {
      console.log('   ✅ Created test CSM dialer permission')
      console.log('   User ID:', testUserId)
      console.log('   Role: customer_success_manager')
      console.log('   Dialer Enabled: true')
    }
  }

  // Add a phone number to the pool
  console.log('\n📞 Setting up Phone Number Pool...')
  
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '+13269991112'
  
  const { data: existingPool } = await supabase
    .from('phone_number_pools')
    .select('*')
    .eq('phone_number', twilioNumber)
    .single()
  
  if (existingPool) {
    console.log(`   ✅ Phone number ${twilioNumber} already in pool`)
  } else {
    const { error: poolError } = await supabase
      .from('phone_number_pools')
      .insert({
        department: 'customer_success',
        phone_number: twilioNumber,
        status: 'available',
        twilio_number_sid: null
      })
    
    if (poolError) {
      console.log('   ❌ Error adding phone to pool:', poolError.message)
    } else {
      console.log(`   ✅ Added ${twilioNumber} to customer_success pool`)
    }
  }

  // Verify setup
  console.log('\n📊 VERIFICATION')
  console.log('=' .repeat(50))
  
  const { data: permissions } = await supabase
    .from('dialer_permissions')
    .select('*')
    .eq('dialer_enabled', true)
  
  const { data: pools } = await supabase
    .from('phone_number_pools')
    .select('*')
  
  console.log(`\nDialer Permissions: ${permissions?.length || 0} enabled`)
  console.log(`Phone Number Pools: ${pools?.length || 0} numbers`)
  
  if ((permissions?.length || 0) > 0) {
    console.log('\n✅ DIALER IS NOW ENABLED FOR CSMs!')
    console.log('   You can now test outbound calling.')
  }
  
  console.log('')
}

setupDialerPermissions().catch(console.error)
