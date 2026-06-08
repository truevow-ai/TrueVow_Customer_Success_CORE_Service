/**
 * Tenant Service Client
 * For calling Tenant Service APIs from CS-Support Service
 */

import { SERVICE_URLS, API_TIMEOUTS } from '@/lib/config/app-config'
import { withRetry } from '@/lib/utils/retry'
import { apiLogger, createTimer } from '@/lib/utils/api-logger'

const TENANT_SERVICE_URL = SERVICE_URLS.TENANT_SERVICE_URL
const TENANT_SERVICE_API_KEY = process.env.TENANT_APP_API_KEY || process.env.FASTAPI_BACKEND_SERVICE_API_KEY || process.env.TENANT_SERVICE_API_KEY || ''

export class TenantServiceClient {
  private baseUrl: string
  private apiKey: string

  constructor(
    baseUrl: string = TENANT_SERVICE_URL,
    apiKey: string = TENANT_SERVICE_API_KEY
  ) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const timer = createTimer()
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.DEFAULT_TIMEOUT_MS)

    try {
      const response = await withRetry(
        async () => {
          const res = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
              'X-API-Key': this.apiKey,
              'X-Service-Name': 'cs-support-service',
              ...options.headers,
            },
          })

          // Throw on retryable status codes to trigger retry
          if ([408, 429, 500, 502, 503, 504].includes(res.status)) {
            const error = new Error(`HTTP ${res.status}: ${res.statusText}`) as any
            error.status = res.status
            throw error
          }

          return res
        },
        { maxRetries: 3 }
      )

      clearTimeout(timeoutId)
      const durationMs = timer()

      if (!response.ok) {
        apiLogger.externalCall('tenant-service', endpoint, durationMs, false, { statusCode: response.status })
        throw new Error(`Tenant Service API error: ${response.statusText}`)
      }

      apiLogger.externalCall('tenant-service', endpoint, durationMs, true, { statusCode: response.status })
      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      const durationMs = timer()
      apiLogger.externalCall('tenant-service', endpoint, durationMs, false)
      throw error
    }
  }

  /**
   * Get customer portal configuration
   */
  async getPortalConfig(tenantId: string) {
    return this.request(`/api/v1/portal/config?tenant_id=${tenantId}`)
  }

  /**
   * Notify tenant service of ticket updates
   */
  async notifyTicketUpdate(tenantId: string, ticketId: string, update: any) {
    return this.request(`/api/v1/portal/tickets/${ticketId}/update`, {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: tenantId,
        ...update,
      }),
    })
  }
}

export const tenantServiceClient = new TenantServiceClient()
