import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * Service-to-Service Authentication
 * Validates API keys for service-to-service communication
 */

// CS-Support Service's own API key (other services use this to call CS-Support)
const CS_SUPPORT_API_KEY = process.env.CS_SUPPORT_SERVICE_API_KEY

// API keys from other services (for backward compatibility or special cases)
const VALID_API_KEYS = [
  CS_SUPPORT_API_KEY, // CS-Support's own key (primary - when other services call CS)
  process.env.SALES_SERVICE_API_KEY,
  process.env.SALES_CRM_SERVICE_API_KEY, // Alternative naming
  process.env.PLATFORM_SERVICE_API_KEY,
  process.env.INTERNAL_OPS_SERVICE_API_KEY,
  process.env.TENANT_SERVICE_API_KEY,
  process.env.TENANT_APP_API_KEY, // Alternative naming
].filter(Boolean) as string[]

/**
 * Get API key from request headers
 */
function getApiKey(req: NextRequest): string | null {
  // Check Authorization header: Bearer <api-key>
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers.get('x-api-key')
  if (apiKeyHeader) {
    return apiKeyHeader
  }

  return null
}

/**
 * Validate API key (exported for use by route handlers that need verifyApiKey)
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false
  return VALID_API_KEYS.includes(apiKey)
}

/**
 * Get service name from API key (for logging)
 */
function getServiceNameFromApiKey(apiKey: string): string {
  // Check CS-Support's own key first (when other services call CS)
  if (apiKey === CS_SUPPORT_API_KEY) return 'cs-support-service-caller'
  if (apiKey === process.env.SALES_SERVICE_API_KEY || apiKey === process.env.SALES_CRM_SERVICE_API_KEY) return 'sales-crm-service'
  if (apiKey === process.env.PLATFORM_SERVICE_API_KEY) return 'platform-service'
  if (apiKey === process.env.INTERNAL_OPS_SERVICE_API_KEY) return 'internal-ops-service'
  if (apiKey === process.env.TENANT_SERVICE_API_KEY || apiKey === process.env.TENANT_APP_API_KEY) return 'tenant-service'
  return 'unknown-service'
}

/**
 * Require valid API key for service-to-service requests
 */
export async function requireApiKey(): Promise<{ serviceName: string }> {
  const headersList = await headers()
  const apiKey = headersList.get('authorization')?.replace('Bearer ', '') || 
                 headersList.get('x-api-key')

  if (!apiKey || !validateApiKey(apiKey)) {
    throw new Error('Invalid or missing API key')
  }

  return {
    serviceName: getServiceNameFromApiKey(apiKey),
  }
}

/**
 * API route wrapper for service-to-service endpoints
 */
export function withApiKey(
  handler: (req: NextRequest, context: { serviceName: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const context = await requireApiKey()
      return await handler(req, context)
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: error instanceof Error ? error.message : 'Invalid API key' 
        },
        { status: 401 }
      )
    }
  }
}

/**
 * Optional API key validation (for endpoints that support both user auth and service auth)
 */
export async function getOptionalApiKey(): Promise<{ serviceName: string } | null> {
  try {
    return await requireApiKey()
  } catch {
    return null
  }
}

/**
 * Verify API key from request (for use in route handlers)
 * Returns true if API key is valid, false otherwise
 */
export async function verifyApiKey(req: NextRequest): Promise<boolean> {
  const apiKey = getApiKey(req)
  return validateApiKey(apiKey)
}

