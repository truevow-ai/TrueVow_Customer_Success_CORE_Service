/**
 * AI Support Agent - Generate Response API
 * 
 * POST /api/v1/ai/support/respond
 * Generate an AI response to a ticket
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { SupportAgent } from '@/lib/ai/support-agent'
import { AgentContext } from '@/lib/services/ai-agent-prompts'
import { z } from 'zod'
import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'

const generateResponseSchema = z.object({
  ticket_id: z.string().uuid(),
  issue_type: z.enum(['password_reset', 'service_status', 'feature_request', 'billing', 'general']).optional(),
  auto_send: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  return withRateLimit(
    {
      windowMs: 60 * 1000,
      maxRequests: 10,
    },
    withTeamMember(async (req: NextRequest, context) => {
      try {
        const validation = await validateBody(req, generateResponseSchema)
        if (!validation.success) {
          return validation.response
        }

        const { ticket_id, issue_type, auto_send } = validation.data

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
          priority: ticket.priority,
          status: ticket.status,
        }

        // Generate response
        const agent = new SupportAgent()
        let response

        if (issue_type && issue_type !== 'general') {
          response = await agent.generateIssueResponse(issue_type, agentContext)
        } else {
          response = await agent.generateFirstResponse(agentContext)
        }

        // If auto_send is true, create a message
        if (auto_send && !response.shouldEscalate) {
          await MessageRepository.create({
            ticket_id: ticket.ticket_id,
            from_type: 'agent',
            from_user_id: context.teamMemberId || context.userId,
            sender_id: context.teamMemberId || context.userId,
            sender_type: 'agent',
            body: response.response,
            is_internal: false,
            metadata: {
              ai_generated: true,
              confidence: response.confidence,
              suggested_actions: response.suggestedActions,
              kb_articles: response.kbArticles,
            },
          })

          // Update ticket status
          await TicketRepository.update(ticket_id, {
            status: 'in_progress',
          })
        }

        return successResponse({
          response: response.response,
          confidence: response.confidence,
          should_escalate: response.shouldEscalate,
          escalation_reason: response.escalationReason,
          suggested_actions: response.suggestedActions,
          kb_articles: response.kbArticles,
          auto_sent: auto_send && !response.shouldEscalate,
        }, 'Response generated successfully')
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : 'Failed to generate response',
          500
        )
      }
    })
  )(req)
}
