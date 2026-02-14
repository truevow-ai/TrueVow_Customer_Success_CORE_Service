/**
 * Workflow Executions API
 * 
 * GET /api/v1/workflows/[id]/executions - Get execution history
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { createServerSupabase } from '@/lib/db/supabase'
import { successResponse, errorResponse, getPagination } from '@/lib/api/helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: workflowId } = await params
    const { page, limit, offset } = getPagination(req)

    const supabase = createServerSupabase()
    const { data, error, count } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact' })
      .eq('workflow_id', workflowId)
      .order('triggered_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return successResponse({
      executions: data || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error: any) {
    console.error('Error fetching workflow executions:', error)
    return errorResponse(error.message || 'Failed to fetch executions', 500)
  }
}
