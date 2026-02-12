import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ReportGeneratorService } from '@/lib/services/report-generator'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * GET /api/v1/reports
 * Get all reports for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const reportType = searchParams.get('report_type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
    }

    const reports = await ReportGeneratorService.getReports(tenantId, {
      report_type: reportType || undefined,
      status: status || undefined,
      limit,
      offset,
    })

    return NextResponse.json({ data: reports, count: reports.length })
  } catch (error: any) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    )
  }
}
