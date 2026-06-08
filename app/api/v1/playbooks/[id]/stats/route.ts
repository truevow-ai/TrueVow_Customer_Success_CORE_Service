/**
 * Playbook Statistics API
 * 
 * GET /api/v1/playbooks/[id]/stats?period_start=...&period_end=...
 * Get playbook execution statistics
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { validateInput } from '@/lib/utils/input-sanitization'
import { SuccessPlaybooksService } from '@/lib/services/success-playbooks'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: playbookId } = await params
    const searchParams = req.nextUrl.searchParams
    const periodStartParam = searchParams.get('period_start')
    const periodEndParam = searchParams.get('period_end')

    if (!playbookId) {
      return errorResponse('Playbook ID is required', 400)
    }

    const sanitizedId = validateInput(playbookId, 'uuid')

    // Parse dates (default to last 30 days)
    const periodStart = periodStartParam
      ? new Date(periodStartParam)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const periodEnd = periodEndParam
      ? new Date(periodEndParam)
      : new Date()

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return errorResponse('Invalid date format. Use YYYY-MM-DD', 400)
    }

    const stats = await SuccessPlaybooksService.getPlaybookStats(sanitizedId, periodStart, periodEnd)

    return successResponse(stats)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get playbook statistics',
      500
    )
  }
}
