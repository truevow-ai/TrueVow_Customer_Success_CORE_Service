/**
 * Tenant Service Client
 * For calling Tenant Service APIs from CS-Support Service
 */

const TENANT_SERVICE_URL = process.env.TENANT_APP_URL || process.env.FASTAPI_BACKEND_SERVICE_URL || process.env.TENANT_SERVICE_URL || 'http://localhost:8000'
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
      throw new Error(`Tenant Service API error: ${response.statusText}`)
    }

    return response.json()
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
