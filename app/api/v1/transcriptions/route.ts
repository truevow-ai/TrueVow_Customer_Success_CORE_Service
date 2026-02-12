import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, getPagination } from '@/lib/api/helpers'
import { MessageRepository } from '@/lib/repositories/messages'
import { TicketRepository } from '@/lib/repositories/tickets'
import { TeamMemberRepository } from '@/lib/repositories/team-members'
import { createServerSupabase } from '@/lib/db/supabase'

/**
 * GET /api/v1/transcriptions
 * Search transcriptions from call messages
 */
export const GET = withTeamMember(async (req: NextRequest, context) => {
  try {
    const { page, limit, offset } = getPagination(req)
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const ticketId = searchParams.get('ticket_id') || undefined

    // Get team member for tenant filtering
    const teamMember = await TeamMemberRepository.findByClerkUserId(context.userId)
    if (!teamMember) {
      return errorResponse('Team member not found', 404)
    }

    const supabase = createServerSupabase()

    // Get messages with transcriptions (call messages)
    let messageQuery = supabase
      .from('cs_messages')
      .select(`
        message_id,
        ticket_id,
        body,
        metadata,
        created_at,
        cs_tickets!inner (
          ticket_id,
          tenant_id,
          subject,
          customer_email
        )
      `)
      .eq('cs_tickets.tenant_id', teamMember.tenant_id)
      .not('metadata->transcription', 'is', null)

    if (ticketId) {
      messageQuery = messageQuery.eq('ticket_id', ticketId)
    }

    if (query) {
      // Search in transcription text (stored in body) and metadata
      messageQuery = messageQuery.or(`body.ilike.%${query}%,metadata->transcription->text.ilike.%${query}%`)
    }

    messageQuery = messageQuery.order('created_at', { ascending: false })
    messageQuery = messageQuery.range(offset, offset + limit - 1)

    const { data: messages, error } = await messageQuery

    if (error) throw error

    // Get total count
    const { count } = await supabase
      .from('cs_messages')
      .select('message_id', { count: 'exact', head: true })
      .not('metadata->transcription', 'is', null)
      .eq('cs_tickets.tenant_id', teamMember.tenant_id)

    const transcriptions = (messages || []).map((msg: any) => {
      const ticket = Array.isArray(msg.cs_tickets) ? msg.cs_tickets[0] : msg.cs_tickets
      const transcription = msg.metadata?.transcription || {}

      return {
        message_id: msg.message_id,
        ticket_id: msg.ticket_id,
        ticket_subject: ticket?.subject,
        customer_email: ticket?.customer_email,
        transcription_text: msg.body || transcription.text || '',
        confidence: transcription.confidence || 0,
        duration: transcription.duration || 0,
        speakers: transcription.speakers || [],
        recording_url: msg.metadata?.recordingUrl || msg.metadata?.recording_url,
        call_id: msg.metadata?.callId || msg.metadata?.call_id,
        created_at: msg.created_at,
      }
    })

    return successResponse({
      transcriptions,
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    })
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to search transcriptions',
      500
    )
  }
})
