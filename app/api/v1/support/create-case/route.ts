/**
 * POST /api/v1/support/create-case
 * 
 * Create a support case for escalation to human agent
 * Used when AI agent cannot resolve the issue
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await req.json()
    const { subject, description, service, account, conversation_id, priority = 'high' } = body

    if (!subject || !description) {
      return errorResponse('Subject and description are required', 400)
    }

    // Create ticket
    const ticket = await TicketRepository.create({
      tenant_id: null, // Will be set from user context
      customer_email: null, // Will be set from user context
      subject,
      channel: 'chat',
      status: 'open',
      priority,
      source: 'customer',
      metadata: {
        service,
        account,
        escalated_from_chat: true,
        conversation_id,
      },
    })

    // Link to conversation if provided
    if (conversation_id) {
      await ConversationRepository.update(conversation_id, {
        ticket_id: ticket.ticket_id,
      })
    }

    return successResponse({
      ticket_id: ticket.ticket_id,
      message: 'Support case created successfully. Our team will investigate and get back to you.',
    })
  } catch (error: any) {
    console.error('Error creating support case:', error)
    return errorResponse('Failed to create support case', 500)
  }
}
