import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { IntegrationManagementService } from '@/lib/services/integration-management'
import { verifyApiKey } from '@/lib/middleware/api-key'

/**
 * GET /api/v1/integrations/health
 * Get health status of all integrations (same as status, kept for compatibility)
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

    // Update integration statuses in database
    for (const integration of health.integrations) {
      await IntegrationManagementService.updateIntegrationStatus(
        integration.integration_type,
        integration.status,
        integration.error_message
      )
    }

    return NextResponse.json({ data: health })
  } catch (error: any) {
    console.error('Error checking integration health:', error)
    return NextResponse.json(
      { error: 'Failed to check integration health', details: error.message },
      { status: 500 }
    )
  }
}



