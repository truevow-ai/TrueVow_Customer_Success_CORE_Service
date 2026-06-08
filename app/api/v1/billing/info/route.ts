/**
 * Billing Info API
 * GET /api/v1/billing/info?tenant_id=<uuid>
 * Proxies to SaaS Admin for real subscription + usage data
 */

import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { createServerSupabase } from '@/lib/db/supabase'

const SAAS_ADMIN_URL = process.env.SAAS_ADMINISTRATION_SERVICE_URL || 'http://localhost:3001'
const SAAS_API_KEY = process.env.SAAS_ADMINISTRATION_SERVICE_API_KEY || process.env.SAAS_ADMIN_API_KEY || ''

interface BillingInfo {
  tenant_id: string
  subscription: {
    tier: string
    status: string
    renewal_date: string | null
  } | null
  usage: {
    current: number
    limit: number
    period_start: string | null
    period_end: string | null
  }
  services: Record<string, boolean>
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchFromSaaSAdmin(endpoint: string): Promise<any | null> {
  const url = `${SAAS_ADMIN_URL}${endpoint}`
  const res = await fetchWithTimeout(url, {
    headers: {
      'Authorization': `Bearer ${SAAS_API_KEY}`,
      'X-API-Key': SAAS_API_KEY,
      'Content-Type': 'application/json',
    },
  })
  if (!res || !res.ok) return null
  const json = await res.json()
  return json.data || json
}

async function getBillingFromLocalDB(tenantId: string): Promise<BillingInfo | null> {
  const supabase = await createServerSupabase()

  const { data: renewal } = await supabase
    .from('cs_renewal_tracking')
    .select('subscription_tier, renewal_status, renewal_date')
    .eq('tenant_id', tenantId)
    .order('renewal_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const subscription = renewal
    ? {
        tier: (renewal as any).subscription_tier || 'unknown',
        status: (renewal as any).renewal_status || 'unknown',
        renewal_date: (renewal as any).renewal_date || null,
      }
    : null

  const { count } = await supabase
    .from('cs_usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('event_timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  return {
    tenant_id: tenantId,
    subscription,
    usage: {
      current: count || 0,
      limit: 0,
      period_start: null,
      period_end: null,
    },
    services: {},
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return errorResponse('tenant_id query parameter is required', 400)
    }

    let billingInfo: BillingInfo | null = null

    const saasUsage = await fetchFromSaaSAdmin(`/api/v1/billing/usage/${tenantId}/current-period`)
    const saasPillar = await fetchFromSaaSAdmin(`/api/v1/billing/tenants/${tenantId}/pillar-status`)

    if (saasUsage || saasPillar) {
      billingInfo = {
        tenant_id: tenantId,
        subscription: saasPillar?.subscription || null,
        usage: saasUsage
          ? {
              current: saasUsage.total_usage || saasUsage.current || 0,
              limit: saasUsage.limit || saasUsage.quota || 0,
              period_start: saasUsage.period_start || null,
              period_end: saasUsage.period_end || null,
            }
          : { current: 0, limit: 0, period_start: null, period_end: null },
        services: saasPillar?.services || saasPillar?.pillars || {},
      }
    }

    if (!billingInfo) {
      billingInfo = await getBillingFromLocalDB(tenantId)
    }

    if (!billingInfo) {
      billingInfo = {
        tenant_id: tenantId,
        subscription: null,
        usage: { current: 0, limit: 0, period_start: null, period_end: null },
        services: {},
      }
    }

    return successResponse(billingInfo)
  } catch (error: any) {
    console.error('Billing info proxy error:', error)
    return errorResponse('Failed to fetch billing info', 502)
  }
}
