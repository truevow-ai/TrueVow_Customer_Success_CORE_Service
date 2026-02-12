import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'
import { z } from 'zod'

const noteSchema = z.object({
  body: z.string().min(1, 'Note body is required').max(5000, 'Note too long'),
  is_internal: z.boolean().optional().default(false),
})

/**
 * GET /api/v1/tickets/:id/notes
 * Get all notes for a ticket (internal and external)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      // Verify ticket exists
      const ticket = await TicketRepository.findById(id)
      if (!ticket) {
        return errorResponse('Ticket not found', 404)
      }

      // Get all messages that are notes (internal messages)
      const messages = await MessageRepository.findByTicket(id)
      const notes = messages
        .filter((msg) => msg.is_internal)
        .map((msg) => ({
          note_id: msg.message_id,
          ticket_id: msg.ticket_id,
          user_id: msg.from_user_id || '',
          user_name: null, // TODO: Fetch user name from team member
          body: msg.body,
          is_internal: msg.is_internal,
          created_at: msg.created_at,
        }))

      return successResponse({ notes })
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to fetch notes', 500)
    }
  })(req)
}

/**
 * POST /api/v1/tickets/:id/notes
 * Create a new note for a ticket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const validation = await validateBody(req, noteSchema)
      if (!validation.success) {
        return validation.response
      }

      const { body, is_internal } = validation.data

      // Verify ticket exists
      const ticket = await TicketRepository.findById(id)
      if (!ticket) {
        return errorResponse('Ticket not found', 404)
      }

      // Create note as internal message
      const note = await MessageRepository.create({
        ticket_id: id,
        from_type: 'agent',
        from_user_id: context.teamMemberId || context.userId,
        sender_id: context.teamMemberId || context.userId,
        sender_type: 'agent',
        body,
        is_internal: is_internal || true, // Notes are always internal
      })

      return successResponse(
        {
          note_id: note.message_id,
          ticket_id: note.ticket_id,
          user_id: note.from_user_id || '',
          user_name: null,
          body: note.body,
          is_internal: note.is_internal,
          created_at: note.created_at,
        },
        'Note added successfully'
      )
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to add note', 500)
    }
  })(req)
}
