/**
 * Internal Ops Service Client
 * For calling Internal Ops Service APIs from CS-Support Service
 */

const INTERNAL_OPS_SERVICE_URL = process.env.INTERNAL_OPS_SERVICE_URL || process.env.SAAS_ADMIN_SERVICE_URL || 'http://localhost:3001'
const INTERNAL_OPS_SERVICE_API_KEY = process.env.INTERNAL_OPS_SERVICE_API_KEY || process.env.SAAS_ADMIN_SERVICE_API_KEY || ''

export class InternalOpsServiceClient {
  private baseUrl: string
  private apiKey: string

  constructor(
    baseUrl: string = INTERNAL_OPS_SERVICE_URL,
    apiKey: string = INTERNAL_OPS_SERVICE_API_KEY
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
      throw new Error(`Internal Ops Service API error: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create a task in Internal Ops Service
   */
  async createTask(task: {
    title: string
    description: string
    assigned_to: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    related_ticket_id?: string
    related_customer_id?: string
    due_date?: string
    service: 'cs-support'
    metadata?: Record<string, any>
  }) {
    return this.request('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  }

  /**
   * Log time tracking for support activity
   */
  async logTimeTracking(tracking: {
    activity_type: 'support_ticket' | 'customer_success' | 'onboarding' | 'escalation'
    ticket_id?: string
    customer_id?: string
    user_id: string
    start_time: string
    end_time?: string
    duration_minutes?: number
    description?: string
    metadata?: Record<string, any>
  }) {
    return this.request('/api/v1/time-tracking', {
      method: 'POST',
      body: JSON.stringify(tracking),
    })
  }

  /**
   * Report activity for RevOps tracking
   */
  async logRevOpsActivity(activity: {
    user_id: string
    role_id?: string
    function_id?: string
    service_name?: string
    activity_type: string
    activity_timestamp?: string
    description?: string
    points?: number
    revenue_impact?: number
    revenue_attribution_type?: 'retention' | 'expansion' | 'assisted'
    customer_id?: string
    ticket_id?: string
    metadata?: Record<string, any>
  }) {
    return this.request('/api/v1/revops/activities', {
      method: 'POST',
      body: JSON.stringify({
        ...activity,
        service_name: activity.service_name || 'cs-support',
        activity_timestamp: activity.activity_timestamp || new Date().toISOString(),
      }),
    })
  }

  /**
   * Log activity for RevOps tracking (legacy method, kept for compatibility)
   */
  async logActivity(activity: {
    user_id: string
    activity_type: string
    description: string
    points?: number
    metadata?: Record<string, any>
  }) {
    return this.logRevOpsActivity(activity)
  }

  /**
   * Get user performance metrics
   */
  async getUserPerformance(userId: string, period?: { start: string; end: string }) {
    const params = new URLSearchParams()
    if (period) {
      params.append('start', period.start)
      params.append('end', period.end)
    }
    
    return this.request(`/api/v1/users/${userId}/performance?${params.toString()}`)
  }

  /**
   * Track call activity (automatic time tracking)
   */
  async trackCallActivity(activity: {
    start_time: string
    end_time: string
    call_type: 'support_call' | 'onboarding_call' | 'health_check'
    platform: 'zoom' | 'teams' | 'twilio' | 'phone'
    participant_count?: number
    metadata?: Record<string, any>
  }) {
    return this.request('/api/v1/auto-tracking/call-activity', {
      method: 'POST',
      body: JSON.stringify(activity),
    })
  }

  /**
   * Track email activity (automatic time tracking)
   */
  async trackEmailActivity(activity: {
    start_time: string
    end_time: string
    action: 'compose' | 'send' | 'reply' | 'forward'
    email_id?: string
    recipient_count?: number
    metadata?: Record<string, any>
  }) {
    return this.request('/api/v1/auto-tracking/email-activity', {
      method: 'POST',
      body: JSON.stringify(activity),
    })
  }

  /**
   * Track platform activity (ticket work, etc.)
   */
  async trackPlatformActivity(activity: {
    start_time: string
    end_time: string
    page_url: string
    action_type: string
    metadata?: Record<string, any>
  }) {
    return this.request('/api/v1/auto-tracking/platform-activity', {
      method: 'POST',
      body: JSON.stringify(activity),
    })
  }

  /**
   * Batch track activities
   */
  async batchTrackActivities(activities: Array<{
    activity_type: string
    start_time: string
    end_time: string
    metadata?: Record<string, any>
  }>) {
    return this.request('/api/v1/auto-tracking/batch-activities', {
      method: 'POST',
      body: JSON.stringify({ activities }),
    })
  }

  /**
   * Get health status of Internal Ops Service
   */
  async getHealth(): Promise<{ status: string }> {
    return this.request('/health')
  }
}

export const internalOpsServiceClient = new InternalOpsServiceClient()

