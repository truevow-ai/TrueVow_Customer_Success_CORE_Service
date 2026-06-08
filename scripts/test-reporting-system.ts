/**
 * Test Script for Reporting System
 * 
 * This script tests:
 * 1. Report template creation
 * 2. Report generation
 * 3. Scheduled reports
 * 4. Report retrieval
 */

import { createServiceSupabase } from '@/lib/db/supabase'
import { ReportGeneratorService } from '@/lib/services/report-generator'
import { ScheduledReportsService } from '@/lib/services/scheduled-reports'

// Test configuration
const TEST_TENANT_ID = process.env.TEST_TENANT_ID || '00000000-0000-0000-0000-000000000000'
const TEST_USER_ID = process.env.TEST_USER_ID || 'user_test_123'

async function testReportTemplates() {
  console.log('\n📋 Testing Report Templates...')
  const supabase = createServiceSupabase()

  // Create a test template
  const testTemplate = {
    template_name: 'Test Ticket Summary Report',
    template_type: 'ticket_summary',
    description: 'Test report for ticket analytics',
    report_config: {
      sections: [
        {
          name: 'Ticket Summary',
          data_source: 'tickets',
          filters: { status: 'resolved' },
          metrics: ['total_tickets', 'resolution_rate', 'avg_resolution_time'],
          chart_type: 'bar',
        },
      ],
      format: 'json',
      include_charts: true,
      include_tables: true,
    },
    schedule_type: 'none',
    is_active: true,
    is_default: false,
    tenant_id: TEST_TENANT_ID,
  }

  const { data: template, error } = await supabase
    .from('cs_report_templates')
    .insert(testTemplate)
    .select()
    .single()

  if (error) {
    console.error('❌ Failed to create template:', error.message)
    return null
  }

  console.log('✅ Template created:', template.template_id)
  return template
}

async function testReportGeneration(templateId: string) {
  console.log('\n📊 Testing Report Generation...')

  try {
    const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const periodEnd = new Date().toISOString()

    const report = await ReportGeneratorService.generateReport(
      templateId,
      TEST_TENANT_ID,
      periodStart,
      periodEnd,
      TEST_USER_ID
    )

    console.log('✅ Report generated successfully')
    console.log('   Report ID:', report.report_id)
    console.log('   Report Name:', report.report_name)
    console.log('   Status:', report.status)
    console.log('   Sections:', report.report_data.sections?.length || 0)

    // Display section data
    if (report.report_data.sections) {
      report.report_data.sections.forEach((section: any, index: number) => {
        console.log(`\n   Section ${index + 1}: ${section.name}`)
        if (section.data) {
          const keys = Object.keys(section.data)
          console.log(`     Metrics: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`)
        }
      })
    }

    return report
  } catch (error: any) {
    console.error('❌ Failed to generate report:', error.message)
    throw error
  }
}

async function testReportRetrieval(reportId: string) {
  console.log('\n🔍 Testing Report Retrieval...')

  try {
    const report = await ReportGeneratorService.getReport(reportId)

    if (!report) {
      console.error('❌ Report not found')
      return false
    }

    console.log('✅ Report retrieved successfully')
    console.log('   Report ID:', report.report_id)
    console.log('   Report Name:', report.report_name)
    console.log('   Period:', `${report.period_start} to ${report.period_end}`)
    console.log('   Status:', report.status)

    return true
  } catch (error: any) {
    console.error('❌ Failed to retrieve report:', error.message)
    return false
  }
}

async function testReportListing() {
  console.log('\n📑 Testing Report Listing...')

  try {
    const reports = await ReportGeneratorService.getReports(TEST_TENANT_ID, {
      limit: 10,
    })

    console.log(`✅ Found ${reports.length} reports`)
    reports.forEach((report, index) => {
      console.log(`   ${index + 1}. ${report.report_name} (${report.report_type}) - ${report.status}`)
    })

    return reports.length > 0
  } catch (error: any) {
    console.error('❌ Failed to list reports:', error.message)
    return false
  }
}

async function testScheduledReports() {
  console.log('\n⏰ Testing Scheduled Reports...')

  try {
    // Get scheduled templates
    const templates = await ScheduledReportsService.getScheduledTemplates(TEST_TENANT_ID)
    console.log(`✅ Found ${templates.length} scheduled templates`)

    // Get pending executions
    const pending = await ScheduledReportsService.getPendingExecutions(10)
    console.log(`✅ Found ${pending.length} pending executions`)

    return true
  } catch (error: any) {
    console.error('❌ Failed to test scheduled reports:', error.message)
    return false
  }
}

async function cleanup(testTemplateId?: string) {
  console.log('\n🧹 Cleaning up test data...')
  const supabase = createServiceSupabase()

  if (testTemplateId) {
    // Delete test template and related reports
    const { error: reportsError } = await supabase
      .from('cs_reports')
      .delete()
      .eq('template_id', testTemplateId)

    const { error: templateError } = await supabase
      .from('cs_report_templates')
      .delete()
      .eq('template_id', testTemplateId)

    if (templateError || reportsError) {
      console.log('⚠️  Cleanup warnings (may not exist):', templateError?.message || reportsError?.message)
    } else {
      console.log('✅ Test data cleaned up')
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Reporting System Tests...')
  console.log('=' .repeat(60))

  let testTemplateId: string | null = null

  try {
    // Test 1: Create template
    const template = await testReportTemplates()
    if (!template) {
      console.log('\n❌ Template creation failed. Stopping tests.')
      return
    }
    testTemplateId = template.template_id

    // Test 2: Generate report
    const report = await testReportGeneration(testTemplateId)
    if (!report) {
      console.log('\n❌ Report generation failed.')
      await cleanup(testTemplateId)
      return
    }

    // Test 3: Retrieve report
    const retrieved = await testReportRetrieval(report.report_id)
    if (!retrieved) {
      console.log('\n⚠️  Report retrieval test failed.')
    }

    // Test 4: List reports
    const listed = await testReportListing()
    if (!listed) {
      console.log('\n⚠️  Report listing test failed.')
    }

    // Test 5: Scheduled reports
    const scheduled = await testScheduledReports()
    if (!scheduled) {
      console.log('\n⚠️  Scheduled reports test failed.')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ All tests completed!')
    console.log('\n📝 Summary:')
    console.log('   - Template creation: ✅')
    console.log('   - Report generation: ✅')
    console.log('   - Report retrieval: ' + (retrieved ? '✅' : '⚠️'))
    console.log('   - Report listing: ' + (listed ? '✅' : '⚠️'))
    console.log('   - Scheduled reports: ' + (scheduled ? '✅' : '⚠️'))

  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message)
    console.error(error.stack)
  } finally {
    // Cleanup
    if (testTemplateId) {
      await cleanup(testTemplateId)
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✨ Test script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error)
      process.exit(1)
    })
}

export { runTests }
