/**
 * Conversation Summarization API
 * 
 * GET /api/v1/inbox/[id]/summarize - Get or generate conversation summary
 * POST /api/v1/inbox/[id]/summarize - Force regenerate summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { ConversationSummarizer } from '@/lib/services/conversation-summarizer'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    const { searchParams } = new URL(req.url)
    const forceRegenerate = searchParams.get('regenerate') === 'true'

    const summary = await ConversationSummarizer.getSummary(conversationId, forceRegenerate)

    return NextResponse.json({
      success: true,
      data: summary,
    })
  } catch (error: any) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary', details: error.message },
      { status: 500 }
    )
  }
}

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

    // Force regenerate summary
    const summary = await ConversationSummarizer.getSummary(conversationId, true)

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Summary regenerated',
    })
  } catch (error: any) {
    console.error('Error regenerating summary:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate summary', details: error.message },
      { status: 500 }
    )
  }
}
