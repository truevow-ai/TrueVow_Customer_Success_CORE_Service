import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { TicketRepository } from '@/lib/repositories/tickets'
import { ConversationRepository } from '@/lib/repositories/conversations'
import { CustomerHealthRepository } from '@/lib/repositories/customer-health'

/**
 * GET /api/v1/customers/profile
 * Get customer profile data
 */
export const GET = withTeamMember(async (req: NextRequest, context) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const email = searchParams.get('email')
    const tenantId = searchParams.get('tenant_id')

    if (!email) {
      return errorResponse('Email is required', 400)
    }

    // Get all tickets for this customer
    const tickets = await TicketRepository.findByCustomerEmail(email)

    // Filter by tenant if provided
    const filteredTickets = tenantId
      ? tickets.filter((t) => t.tenant_id === tenantId)
      : tickets

    // Calculate stats
    const totalTickets = filteredTickets.length
    const openTickets = filteredTickets.filter((t) =>
      ['open', 'in_progress', 'pending'].includes(t.status)
    ).length
    const resolvedTickets = filteredTickets.filter((t) => t.status === 'resolved').length

    // Calculate average response time (simplified)
    const responseTimes = filteredTickets
      .filter((t) => t.resolved_at && t.created_at)
      .map((t) => {
        const created = new Date(t.created_at).getTime()
        const resolved = new Date(t.resolved_at!).getTime()
        return resolved - created
      })

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0

    // Get last contact
    const lastContact =
      filteredTickets.length > 0
        ? filteredTickets.sort((a, b) => {
            const dateA = new Date(a.updated_at).getTime()
            const dateB = new Date(b.updated_at).getTime()
            return dateB - dateA
          })[0].updated_at
        : null

    // Get health score if tenant_id provided
    let healthScore = null
    let healthLevel = null
    if (tenantId) {
      try {
        const health = await CustomerHealthRepository.getAtRiskCustomers(tenantId)
        const customerHealth = health.find((h) => h.tenant_id === tenantId)
        if (customerHealth) {
          healthScore = customerHealth.health_score
          healthLevel = customerHealth.health_level
        }
      } catch (error) {
        // Health score not available, continue without it
      }
    }

    // Get tags from tickets
    const allTags = new Set<string>()
    filteredTickets.forEach((ticket) => {
      if (ticket.tags) {
        ticket.tags.forEach((tag) => allTags.add(tag))
      }
    })

    const profile = {
      email,
      name: filteredTickets.length > 0 ? filteredTickets[0].customer_name : null,
      totalTickets,
      openTickets,
      resolvedTickets,
      averageResponseTime,
      lastContact,
      healthScore,
      healthLevel,
      tags: Array.from(allTags),
    }

    return successResponse(profile)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch customer profile', 500)
  }
})



