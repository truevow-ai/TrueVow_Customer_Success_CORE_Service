/**
 * Shared Drafts API
 * 
 * GET /api/v1/inbox/[id]/shared-draft - Get shared draft
 * POST /api/v1/inbox/[id]/shared-draft - Create/update shared draft
 * DELETE /api/v1/inbox/[id]/shared-draft - Discard draft
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { SharedDraftsService } from '@/lib/services/shared-drafts-service'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { TeamMemberRepository } from '@/lib/repositories/team-members'
import { z } from 'zod'

const saveDraftSchema = z.object({
  subject: z.string().optional().nullable(),
  body: z.string().min(1),
  body_html: z.string().optional().nullable(),
  attachments: z.array(z.any()).optional(),
  shared_with_team: z.enum(['all', 'assigned_team', 'specific_role']).optional(),
  shared_with_role: z.string().optional().nullable(),
  editable_by_all: z.boolean().optional().default(true),
  existing_draft_id: z.string().uuid().optional(),
})

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
    const draft = await SharedDraftsService.getDraftForConversation(conversationId)

    if (!draft) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No draft found',
      })
    }

    return NextResponse.json({
      success: true,
      data: draft,
    })
  } catch (error: any) {
    console.error('Error fetching shared draft:', error)
    return NextResponse.json(
      { error: 'Failed to fetch draft', details: error.message },
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
    const body = await req.json()
    const validated = saveDraftSchema.parse(body)

    // Get conversation
    const conversation = await ConversationRepository.findById(conversationId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get team member
    const teamMember = await TeamMemberRepository.findByUserId(context.userId)
    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Save draft
    const draft = await SharedDraftsService.saveDraft(
      {
        conversation_id: conversationId,
        ticket_id: conversation.ticket_id,
        subject: validated.subject,
        body: validated.body,
        body_html: validated.body_html,
        attachments: validated.attachments,
        shared_with_team: validated.shared_with_team || 'all',
        shared_with_role: validated.shared_with_role,
        editable_by_all: validated.editable_by_all,
        created_by: teamMember.member_id,
      },
      validated.existing_draft_id
    )

    return NextResponse.json({
      success: true,
      data: draft,
    }, { status: validated.existing_draft_id ? 200 : 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving shared draft:', error)
    return NextResponse.json(
      { error: 'Failed to save draft', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    
    // Get draft
    const draft = await SharedDraftsService.getDraftForConversation(conversationId)
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Discard draft
    await SharedDraftsService.discardDraft(draft.draft_id)

    return NextResponse.json({
      success: true,
      message: 'Draft discarded',
    })
  } catch (error: any) {
    console.error('Error discarding draft:', error)
    return NextResponse.json(
      { error: 'Failed to discard draft', details: error.message },
      { status: 500 }
    )
  }
}
