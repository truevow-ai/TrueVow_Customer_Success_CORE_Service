import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { IntegrationManagementService } from '@/lib/services/integration-management'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * GET /api/v1/integrations/errors
 * Get integration errors from database
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const integrationType = searchParams.get('integration_type')
    const limit = parseInt(searchParams.get('limit') || '50')

    const errors = await IntegrationManagementService.getIntegrationErrors(
      integrationType || undefined,
      limit
    )

    return NextResponse.json({ data: errors, count: errors.length })
  } catch (error: any) {
    console.error('Error fetching integration errors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration errors', details: error.message },
      { status: 500 }
    )
  }
}



