/**
 * AI Copilot API
 * 
 * POST /api/v1/inbox/[id]/copilot - Generate AI draft with full context
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { AICopilotService } from '@/lib/services/ai-copilot-service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params

    // Generate copilot draft
    const draft = await AICopilotService.generateDraftForConversation(conversationId)

    return NextResponse.json({
      success: true,
      data: draft,
    })
  } catch (error: any) {
    console.error('Error generating copilot draft:', error)
    return NextResponse.json(
      { error: 'Failed to generate draft', details: error.message },
      { status: 500 }
    )
  }
}
