/**
 * Platform Service Client
 * For calling Platform Service APIs from CS-Support Service
 */

const PLATFORM_SERVICE_URL = process.env.PLATFORM_SERVICE_URL || 'http://localhost:3000'
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
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Platform Service API error: ${response.statusText}`)
    }

    return response.json()
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

