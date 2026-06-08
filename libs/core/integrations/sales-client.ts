/**
 * Sales-CRM Service Client
 * For calling Sales-CRM Service APIs from CS-Support Service
 */

import { SERVICE_URLS, API_TIMEOUTS } from '@/lib/config/app-config'
import { withRetry } from '@/lib/utils/retry'
import { apiLogger, createTimer } from '@/lib/utils/api-logger'

const SALES_SERVICE_URL = SERVICE_URLS.SALES_SERVICE_URL
const SALES_SERVICE_API_KEY = process.env.SALES_CRM_SERVICE_API_KEY || process.env.SALES_SERVICE_API_KEY || ''

export class SalesServiceClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string = SALES_SERVICE_URL, apiKey: string = SALES_SERVICE_API_KEY) {
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
        apiLogger.externalCall('sales-service', endpoint, durationMs, false, { statusCode: response.status })
        throw new Error(`Sales Service API error: ${response.statusText}`)
      }

      apiLogger.externalCall('sales-service', endpoint, durationMs, true, { statusCode: response.status })
      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      const durationMs = timer()
      apiLogger.externalCall('sales-service', endpoint, durationMs, false)
      throw error
    }
  }

  /**
   * Get lead information
   */
  async getLead(leadId: string) {
    return this.request(`/api/v1/leads/${leadId}`)
  }

  /**
   * Get customer information
   */
  async getCustomer(customerId: string) {
    return this.request(`/api/v1/customers/${customerId}`)
  }

  /**
   * Convert lead to customer
   */
  async convertLead(leadId: string, tenantId: string) {
    return this.request(`/api/v1/leads/${leadId}/convert`, {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId }),
    })
  }

  /**
   * Get phone number for user (CSM or Sales Rep)
   * Leverages Sales CRM phone number assignment system
   */
  async getPhoneNumber(options: {
    user_id: string
    call_type: 'direct_call' | 'parallel_dialing'
    service?: 'sales' | 'cs_support'
    campaign_id?: string
  }): Promise<{ phone_number: string; number_type: 'individual' | 'pool' }> {
    return this.request(`/api/v1/users/${options.user_id}/phone-number`, {
      method: 'GET',
      headers: {
        'X-Call-Type': options.call_type,
        'X-Service': options.service || 'cs_support',
        ...(options.campaign_id && { 'X-Campaign-ID': options.campaign_id }),
      },
    })
  }

  /**
   * Update user's individual phone number
   */
  async updatePhoneNumber(
    userId: string,
    phoneNumber: string,
    twilioNumberSid?: string,
    virtualNumberProvider: 'twilio' | 'other' = 'twilio'
  ) {
    return this.request(`/api/v1/users/${userId}/phone-number`, {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        twilio_number_sid: twilioNumberSid,
        virtual_number_provider: virtualNumberProvider,
      }),
    })
  }
}

export const salesServiceClient = new SalesServiceClient()
/** @deprecated Use salesServiceClient */
export const salesCrmClient = salesServiceClient

