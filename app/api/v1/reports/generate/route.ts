import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ReportGeneratorService } from '@/lib/services/report-generator'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * POST /api/v1/reports/generate
 * Generate a report from a template
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { template_id, tenant_id, period_start, period_end, custom_config } = body

    if (!template_id || !tenant_id) {
      return NextResponse.json(
        { error: 'template_id and tenant_id are required' },
        { status: 400 }
      )
    }

    // Default to last 30 days if period not specified
    const periodStart =
      period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const periodEnd = period_end || new Date().toISOString()

    const report = await ReportGeneratorService.generateReport(
      template_id,
      tenant_id,
      periodStart,
      periodEnd,
      userId || undefined,
      custom_config
    )

    return NextResponse.json({ data: report })
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    )
  }
}
