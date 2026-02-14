import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { IntegrationManagementService } from '@/lib/services/integration-management'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * GET /api/v1/integrations/status
 * Get status of all integrations
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    const apiKeyValid = await verifyApiKey(request)

    if (!userId && !apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const health = await IntegrationManagementService.checkAllIntegrations()

    return NextResponse.json({ data: health })
  } catch (error: any) {
    console.error('Error checking integration status:', error)
    return NextResponse.json(
      { error: 'Failed to check integration status', details: error.message },
      { status: 500 }
    )
  }
}



