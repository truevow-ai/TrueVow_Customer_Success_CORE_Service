import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ReportGeneratorService } from '@/lib/services/report-generator'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * GET /api/v1/reports/:id
 * Get a specific report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = params.id
    const report = await ReportGeneratorService.getReport(reportId)

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Log access
    if (userId) {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      const userAgent = request.headers.get('user-agent')
      await ReportGeneratorService.logReportAccess(reportId, userId, 'viewed', ipAddress || undefined, userAgent || undefined)
    }

    return NextResponse.json({ data: report })
  } catch (error: any) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report', details: error.message },
      { status: 500 }
    )
  }
}
