/**
 * Workflow Execution API
 * 
 * POST /api/v1/workflows/[id]/execute - Execute workflow manually
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { WorkflowEngine } from '@/lib/services/workflow-engine'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: workflowId } = await params
    const body = await req.json()
    const { conversation_id } = body

    if (!conversation_id) {
      return errorResponse('conversation_id is required', 400)
    }

    const execution = await WorkflowEngine.executeManual(
      workflowId,
      conversation_id,
      context.userId
    )

    return successResponse(execution)
  } catch (error: any) {
    console.error('Error executing workflow:', error)
    return errorResponse('Failed to execute workflow', 500, error.message)
  }
}
