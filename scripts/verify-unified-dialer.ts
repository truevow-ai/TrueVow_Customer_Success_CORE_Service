/**
 * Verification Script for Unified Dialer Integration
 * 
 * Verifies all components of the unified dialer integration
 */

import { createServiceSupabase } from '../lib/db/supabase'

interface VerificationResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

const results: VerificationResult[] = []

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string) {
  results.push({ name, status, message })
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${name}: ${message}`)
}

async function verifyDatabaseTables() {
  console.log('\n📊 Verifying Database Tables...\n')

  const supabase = createServiceSupabase()

  // Check dialer_permissions table
  try {
    const { error } = await supabase.from('dialer_permissions').select('user_id').limit(1)
    if (error) {
      addResult('dialer_permissions table', 'fail', `Table does not exist: ${error.message}`)
    } else {
      addResult('dialer_permissions table', 'pass', 'Table exists')
    }
  } catch (err) {
    addResult('dialer_permissions table', 'fail', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  // Check phone_number_pools table
  try {
    const { error } = await supabase.from('phone_number_pools').select('id').limit(1)
    if (error) {
      addResult('phone_number_pools table', 'fail', `Table does not exist: ${error.message}`)
    } else {
      addResult('phone_number_pools table', 'pass', 'Table exists')
    }
  } catch (err) {
    addResult('phone_number_pools table', 'fail', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  // Check phone_number_mappings table
  try {
    const { error } = await supabase.from('phone_number_mappings').select('id').limit(1)
    if (error) {
      addResult('phone_number_mappings table', 'fail', `Table does not exist: ${error.message}`)
    } else {
      addResult('phone_number_mappings table', 'pass', 'Table exists')
    }
  } catch (err) {
    addResult('phone_number_mappings table', 'fail', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

async function verifyServices() {
  console.log('\n🔧 Verifying Services...\n')

  // Check DialerPermissionsService
  try {
    const { DialerPermissionsService } = await import('../lib/services/dialer-permissions-service')
    if (DialerPermissionsService) {
      addResult('DialerPermissionsService', 'pass', 'Service exists and can be imported')
    } else {
      addResult('DialerPermissionsService', 'fail', 'Service not found')
    }
  } catch (err) {
    addResult('DialerPermissionsService', 'fail', `Import error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  // Check PhonePoolService
  try {
    const { PhonePoolService } = await import('../lib/services/phone-pool-service')
    if (PhonePoolService) {
      addResult('PhonePoolService', 'pass', 'Service exists and can be imported')
    } else {
      addResult('PhonePoolService', 'fail', 'Service not found')
    }
  } catch (err) {
    addResult('PhonePoolService', 'fail', `Import error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  // Check UnifiedDialerService
  try {
    const { UnifiedDialerService } = await import('../lib/services/unified-dialer-service')
    if (UnifiedDialerService) {
      addResult('UnifiedDialerService', 'pass', 'Service exists and can be imported')
    } else {
      addResult('UnifiedDialerService', 'fail', 'Service not found')
    }
  } catch (err) {
    addResult('UnifiedDialerService', 'fail', `Import error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

async function verifyAPIEndpoints() {
  console.log('\n🌐 Verifying API Endpoints...\n')

  const endpoints = [
    { name: 'GET /api/v1/dialer/permissions', path: 'app/api/v1/dialer/permissions/route.ts' },
    { name: 'POST /api/v1/dialer/permissions/toggle', path: 'app/api/v1/dialer/permissions/toggle/route.ts' },
    { name: 'GET /api/v1/dialer/phone-number', path: 'app/api/v1/dialer/phone-number/route.ts' },
  ]

  for (const endpoint of endpoints) {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const filePath = path.join(process.cwd(), endpoint.path)
      await fs.access(filePath)
      addResult(endpoint.name, 'pass', 'Endpoint file exists')
    } catch (err) {
      addResult(endpoint.name, 'fail', `Endpoint file not found: ${endpoint.path}`)
    }
  }
}

async function verifyComponents() {
  console.log('\n🎨 Verifying Components...\n')

  const components = [
    { name: 'DialerToggle', path: 'components/cs-support/dialer/DialerToggle.tsx' },
    { name: 'Settings Page', path: 'app/(dashboard)/settings/page.tsx' },
  ]

  for (const component of components) {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const filePath = path.join(process.cwd(), component.path)
      await fs.access(filePath)
      addResult(component.name, 'pass', 'Component file exists')
    } catch (err) {
      addResult(component.name, 'fail', `Component file not found: ${component.path}`)
    }
  }
}

async function verifyMigrations() {
  console.log('\n📦 Verifying Migrations...\n')

  const migrations = [
    '022_dialer_permissions.sql',
    '023_phone_number_pools.sql',
    '024_phone_number_mappings.sql',
  ]

  for (const migration of migrations) {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'database', 'migrations', migration)
      await fs.access(filePath)
      addResult(migration, 'pass', 'Migration file exists')
    } catch (err) {
      addResult(migration, 'fail', `Migration file not found: ${migration}`)
    }
  }
}

async function main() {
  console.log('🔍 Unified Dialer Integration Verification\n')
  console.log('=' .repeat(60))

  await verifyMigrations()
  await verifyDatabaseTables()
  await verifyServices()
  await verifyAPIEndpoints()
  await verifyComponents()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Verification Summary\n')

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const warnings = results.filter((r) => r.status === 'warning').length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`📊 Total: ${results.length}`)

  if (failed > 0) {
    console.log('\n❌ Some verifications failed. Please review the errors above.')
    process.exit(1)
  } else {
    console.log('\n✅ All verifications passed!')
    process.exit(0)
  }
}

main().catch(console.error)
