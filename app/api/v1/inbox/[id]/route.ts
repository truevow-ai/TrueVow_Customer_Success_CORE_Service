import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/helpers'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'

/**
 * GET /api/v1/inbox/:id
 * Get conversation details with messages
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const conversation = await ConversationRepository.findById(id)
    
    if (!conversation) {
      return notFoundResponse('Conversation not found')
    }

    // Get related ticket if exists
    let ticket = null
    if (conversation.ticket_id) {
      ticket = await TicketRepository.findById(conversation.ticket_id)
    }

    // Get messages for this conversation
    const messages = conversation.ticket_id
      ? await MessageRepository.findByTicket(conversation.ticket_id)
      : []

    return successResponse({
      conversation,
      ticket,
      messages,
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch conversation', 500)
  }
  })(req)
}

/**
 * PATCH /api/v1/inbox/:id
 * Update conversation (status, assignment, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const body = await req.json()
      
      // Update conversation
      const conversation = await ConversationRepository.update(id, {
      status: body.status,
      assigned_to: body.assigned_to,
      tags: body.tags,
    })

    // If conversation has a ticket, update ticket as well
    if (conversation.ticket_id && (body.status || body.priority || body.assigned_to)) {
      await TicketRepository.update(conversation.ticket_id, {
        status: body.status,
        priority: body.priority,
        assigned_to: body.assigned_to,
      })
    }

    return successResponse(conversation)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to update conversation', 500)
    }
  })(req)
}

