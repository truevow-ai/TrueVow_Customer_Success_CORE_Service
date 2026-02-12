import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/middleware/api-key'
import { checkRateLimit } from '@/lib/middleware/rate-limit'
import { TicketRepository } from '@/lib/repositories/tickets'
import { sanitizeInput } from '@/lib/utils/input-sanitization'

/**
 * POST /api/v1/customer-portal/tickets
 * Ticket submission endpoint for customer portal
 * This endpoint is called by Tenant Service on behalf of customers
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key (service-to-service auth)
    const apiKeyValid = await verifyApiKey(request)
    if (!apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenant_id, customer_email, customer_name, subject, message, channel = 'form', priority = 'medium' } = body

    if (!tenant_id || !customer_email || !subject || !message) {
      return NextResponse.json(
        { error: 'tenant_id, customer_email, subject, and message are required' },
        { status: 400 }
      )
    }

    // Rate limiting: 10 ticket submissions per hour per tenant
    const rateLimitResult = await checkRateLimit(request, {
      key: `customer-portal-tickets:${tenant_id}`,
      limit: 10,
      window: 3600, // 1 hour
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    // Sanitize inputs
    const sanitizedSubject = sanitizeInput(subject)
    const sanitizedMessage = sanitizeInput(message)
    const sanitizedEmail = sanitizeInput(customer_email)
    const sanitizedName = customer_name ? sanitizeInput(customer_name) : undefined

    // Create ticket
    const ticket = await TicketRepository.create({
      tenant_id,
      customer_email: sanitizedEmail,
      customer_name: sanitizedName,
      subject: sanitizedSubject,
      message: sanitizedMessage,
      channel,
      priority,
      status: 'open',
      source: 'customer',
      stage: 'post-sale',
    })

    return NextResponse.json({ data: ticket }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating ticket from customer portal:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/customer-portal/tickets
 * Get tickets for a customer (via Tenant Service)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const apiKeyValid = await verifyApiKey(request)
    if (!apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const customerEmail = searchParams.get('customer_email')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!tenantId || !customerEmail) {
      return NextResponse.json(
        { error: 'tenant_id and customer_email are required' },
        { status: 400 }
      )
    }

    // Get tickets for this customer
    const tickets = await TicketRepository.findByCustomer(tenantId, customerEmail, {
      status: status || undefined,
      limit,
      offset,
    })

    return NextResponse.json({ data: tickets, count: tickets.length })
  } catch (error: any) {
    console.error('Error fetching customer tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error.message },
      { status: 500 }
    )
  }
}
