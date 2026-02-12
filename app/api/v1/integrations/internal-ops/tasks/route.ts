import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { internalOpsServiceClient } from '@/lib/integrations/internal-ops-client'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * POST /api/v1/integrations/internal-ops/tasks
 * Create a task in Internal Ops Service from CS-Support
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      assigned_to,
      priority,
      related_ticket_id,
      related_customer_id,
      due_date,
      metadata,
    } = body

    if (!title || !description || !assigned_to || !priority) {
      return NextResponse.json(
        { error: 'title, description, assigned_to, and priority are required' },
        { status: 400 }
      )
    }

    // Create task in Internal Ops Service
    const task = await internalOpsServiceClient.createTask({
      title,
      description,
      assigned_to,
      priority,
      related_ticket_id,
      related_customer_id,
      due_date,
      service: 'cs-support',
      metadata: {
        ...metadata,
        created_by: userId,
        created_from: 'cs-support-service',
      },
    })

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task in Internal Ops:', error)
    return NextResponse.json(
      { error: 'Failed to create task', details: error.message },
      { status: 500 }
    )
  }
}
