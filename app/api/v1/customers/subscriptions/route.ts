/**
 * GET /api/v1/customers/subscriptions?tenant_id=<uuid>
 *
 * Returns per-tenant service activation status (INTAKE, VERIFY, LEVERAGE, SETTLE, CONNECT)
 * Proxies to SaaS Admin pillar-status endpoint with local DB fallback
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'

const SAAS_ADMIN_URL = process.env.SAAS_ADMINISTRATION_SERVICE_URL || 'http://localhost:3001'
const SAAS_API_KEY = process.env.SAAS_ADMINISTRATION_SERVICE_API_KEY || process.env.SAAS_ADMIN_API_KEY || ''

const SERVICE_PILLAR_MAP: Record<string, string[]> = {
  intake: ['INTAKE'],
  verify: ['VERIFY'],
  leverage: ['LEVERAGE', 'DRAFT'],
  draft: ['LEVERAGE', 'DRAFT'],
  settle: ['SETTLE'],
  connect: ['CONNECT'],
}

async function fetchFromSaaSAdmin(endpoint: string): Promise<any | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${SAAS_ADMIN_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${SAAS_API_KEY}`,
        'X-API-Key': SAAS_API_KEY,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    const json = await res.json()
    return json.data || json
  } catch {
    return null
  }
}

function parsePillarStatus(pillarData: any): Record<string, boolean> {
  const subscriptions: Record<string, boolean> = {
    INTAKE: true,
    VERIFY: false,
    LEVERAGE: false,
    SETTLE: false,
    CONNECT: false,
  }

  const pillars = pillarData?.pillars || pillarData?.services || pillarData || {}

  for (const [key, value] of Object.entries(pillars)) {
    const normalized = key.toLowerCase()
    const isActive = value === true || (typeof value === 'object' && (value as any).active === true)
    const targetServices = SERVICE_PILLAR_MAP[normalized]
    if (targetServices) {
      for (const svc of targetServices) {
        subscriptions[svc] = isActive
      }
    }
  }

  return subscriptions
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return errorResponse('Unauthorized', 401)
    }

    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return errorResponse('Tenant ID is required', 400)
    }

    const pillarData = await fetchFromSaaSAdmin(`/api/v1/billing/tenants/${tenantId}/pillar-status`)
    const subscriptions = parsePillarStatus(pillarData)

    return successResponse({
      tenant_id: tenantId,
      subscriptions,
      source: pillarData ? 'saas-admin' : 'fallback',
      updated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error)
    return errorResponse('Failed to fetch subscription status', 500)
  }
}



