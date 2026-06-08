/**
 * Platform Service Client
 * For calling Platform Service APIs from CS-Support Service
 */

import { SERVICE_URLS, API_TIMEOUTS } from '@/lib/config/app-config'
import { withRetry } from '@/lib/utils/retry'
import { apiLogger, createTimer } from '@/lib/utils/api-logger'

const PLATFORM_SERVICE_URL = SERVICE_URLS.PLATFORM_SERVICE_URL
const PLATFORM_SERVICE_API_KEY = process.env.PLATFORM_SERVICE_API_KEY || process.env.SAAS_ADMIN_SERVICE_API_KEY || ''

export class PlatformServiceClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string = PLATFORM_SERVICE_URL, apiKey: string = PLATFORM_SERVICE_API_KEY) {
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
        apiLogger.externalCall('platform-service', endpoint, durationMs, false, { statusCode: response.status })
        throw new Error(`Platform Service API error: ${response.statusText}`)
      }

      apiLogger.externalCall('platform-service', endpoint, durationMs, true, { statusCode: response.status })
      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      const durationMs = timer()
      apiLogger.externalCall('platform-service', endpoint, durationMs, false)
      throw error
    }
  }

  /**
   * Get tenant information
   */
  async getTenant(tenantId: string) {
    return this.request(`/api/v1/tenants/${tenantId}`)
  }

  /**
   * Get tenant subscription status
   */
  async getTenantSubscription(tenantId: string) {
    return this.request(`/api/v1/tenants/${tenantId}/subscription`)
  }

  /**
   * Get tenant usage metrics
   */
  async getTenantUsage(tenantId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    return this.request(`/api/v1/tenants/${tenantId}/usage?${params.toString()}`)
  }
}

export const platformServiceClient = new PlatformServiceClient()
/** @deprecated Use platformServiceClient */
export const platformClient = platformServiceClient

