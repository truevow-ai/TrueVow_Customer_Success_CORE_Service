/**
 * Collision Detection API - Mark Viewing
 * 
 * POST /api/v1/collision/[id]/viewing - Mark user as viewing conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { CollisionDetectionService } from '@/lib/services/collision-detection-service'
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

    const { id: conversationId } = await params

    await CollisionDetectionService.markViewing(conversationId, context.userId)

    return successResponse({ success: true })
  } catch (error: any) {
    console.error('Error marking viewing:', error)
    return errorResponse('Failed to mark viewing', 500, error.message)
  }
}
