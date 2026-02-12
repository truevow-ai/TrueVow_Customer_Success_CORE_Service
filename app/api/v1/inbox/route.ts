import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, getPagination } from '@/lib/api/helpers'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'
import { TeamMemberRepository } from '@/lib/repositories/team-members'

/**
 * GET /api/v1/inbox
 * Get list of conversations for the inbox with ticket details
 */
export const GET = withTeamMember(async (req: NextRequest, context) => {
  try {
    const { page, limit, offset } = getPagination(req)
    const searchParams = req.nextUrl.searchParams
    
    const channel = searchParams.get('channel') || undefined
    const status = searchParams.get('status') || undefined
    const assigned = searchParams.get('assigned_to') || undefined
    const search = searchParams.get('search') || undefined

    // Get conversations - filter by tenant_id from conversations table
    // Note: For pre-sale tickets, tenant_id may be NULL, so we'll include those too
    const allConversations = await ConversationRepository.findAll({
      channel,
      limit: 1000, // Get all for filtering
    })

    // Get related tickets and last messages for each conversation
    const conversationsWithTickets = await Promise.all(
      allConversations.map(async (conv) => {
        let ticket = null
        let lastMessage = null
        
        if (conv.ticket_id) {
          ticket = await TicketRepository.findById(conv.ticket_id)
          if (ticket) {
            // Get last message for preview
            const messages = await MessageRepository.findByTicket(conv.ticket_id)
            lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
          }
        }

        // Apply filters
        if (status && ticket?.status !== status) return null
        if (assigned === 'unassigned' && ticket?.assigned_to) return null
        if (assigned === 'me' && ticket?.assigned_to !== context.teamMemberId) return null
        if (search) {
          const searchLower = search.toLowerCase()
          const matchesSearch =
            conv.customer_email?.toLowerCase().includes(searchLower) ||
            conv.customer_name?.toLowerCase().includes(searchLower) ||
            ticket?.subject?.toLowerCase().includes(searchLower) ||
            lastMessage?.body?.toLowerCase().includes(searchLower)
          if (!matchesSearch) return null
        }

        return {
          conversation_id: conv.conversation_id,
          ticket_id: conv.ticket_id,
          channel: conv.channel,
          customer_email: conv.customer_email,
          customer_name: conv.customer_name,
          subject: ticket?.subject || null,
          last_message_at: conv.last_message_at,
          last_message_preview: lastMessage?.body?.substring(0, 100) || null,
          unread_count: conv.unread_count || 0,
          status: ticket?.status || 'open',
          priority: ticket?.priority || 'medium',
          assigned_to: ticket?.assigned_to || null,
          assigned_to_name: null, // TODO: Fetch team member name
          tenant_id: ticket?.tenant_id || null,
          created_at: conv.created_at,
        }
      })
    )

    // Filter out nulls and paginate
    const filtered = conversationsWithTickets.filter((c) => c !== null)
    const paginated = filtered.slice(offset, offset + limit)

    return successResponse({
      conversations: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
      },
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch inbox', 500)
  }
})

