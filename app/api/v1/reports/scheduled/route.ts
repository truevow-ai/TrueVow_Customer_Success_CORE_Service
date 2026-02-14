import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ScheduledReportsService } from '@/lib/services/scheduled-reports'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * GET /api/v1/reports/scheduled
 * Get scheduled report templates and executions
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
    const templateId = searchParams.get('template_id')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
    }

    if (templateId) {
      // Get execution history for specific template
      const history = await ScheduledReportsService.getExecutionHistory(templateId, tenantId)
      return NextResponse.json({ data: history })
    } else {
      // Get all scheduled templates
      const templates = await ScheduledReportsService.getScheduledTemplates(tenantId)
      return NextResponse.json({ data: templates })
    }
  } catch (error: any) {
    console.error('Error fetching scheduled reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/reports/scheduled/execute
 * Execute pending scheduled reports (called by cron job)
 */
export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected by API key only (cron job)
    const apiKeyValid = await verifyApiKey(request)

    if (!apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { execution_id } = body

    if (!execution_id) {
      // Execute all pending reports
      const pending = await ScheduledReportsService.getPendingExecutions(100)

      const results = []
      for (const execution of pending) {
        try {
          await ScheduledReportsService.executeScheduledReport(execution.execution_id)
          results.push({ execution_id: execution.execution_id, status: 'success' })
        } catch (error: any) {
          results.push({
            execution_id: execution.execution_id,
            status: 'failed',
            error: error.message,
          })
        }
      }

      return NextResponse.json({ data: { executed: results.length, results } })
    } else {
      // Execute specific execution
      await ScheduledReportsService.executeScheduledReport(execution_id)
      return NextResponse.json({ data: { execution_id, status: 'executed' } })
    }
  } catch (error: any) {
    console.error('Error executing scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to execute scheduled report', details: error.message },
      { status: 500 }
    )
  }
}



