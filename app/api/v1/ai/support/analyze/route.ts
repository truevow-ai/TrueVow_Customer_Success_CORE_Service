/**
 * AI Support Agent - Ticket Analysis API
 * 
 * POST /api/v1/ai/support/analyze
 * Analyze a ticket and provide triage information
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { SupportAgent } from '@/lib/ai/support-agent'
import { AgentContext } from '@/lib/services/ai-agent-prompts'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db/supabase'
import { TicketRepository } from '@/lib/repositories/tickets'

const analyzeTicketSchema = z.object({
  ticket_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  return withRateLimit(
    {
      windowMs: 60 * 1000,
      maxRequests: 20,
    },
    withTeamMember(async (req: NextRequest, context) => {
      try {
        const validation = await validateBody(req, analyzeTicketSchema)
        if (!validation.success) {
          return validation.response
        }

        const { ticket_id } = validation.data

        // Get ticket
        const ticket = await TicketRepository.findById(ticket_id)
        if (!ticket) {
          return errorResponse('Ticket not found', 404)
        }

        // Build agent context
        const agentContext: AgentContext = {
          ticketId: ticket.ticket_id,
          subject: ticket.subject,
          description: ticket.message || '',
          channel: ticket.channel,
          customerEmail: ticket.customer_email,
          customerName: ticket.customer_name || undefined,
          tenantName: ticket.tenant_id ?? undefined,
          priority: ticket.priority,
          status: ticket.status,
        }

        // Analyze ticket
        const agent = new SupportAgent()
        const analysis = await agent.analyzeTicket(agentContext)

        return successResponse(analysis, 'Ticket analyzed successfully')
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : 'Failed to analyze ticket',
          500
        )
      }
    })
  )(req)
}
