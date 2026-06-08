/**
 * CRM Sync Service
 * Handles synchronization between CS Support tickets and Intakely CRM cases
 */

import { TicketRepository } from '@/lib/repositories/tickets'
import { MessageRepository } from '@/lib/repositories/messages'
import { createServerSupabase } from '@/lib/db/supabase'
import { EXTERNAL_API_URLS, API_TIMEOUTS, INPUT_LIMITS } from '@/lib/config/app-config'

export interface CRMCase {
  caseId: string
  caseNumber: string
  title: string
  description: string
  status: string
  priority: string
  assignedTo?: string
  customerEmail: string
  customerName?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface SyncStatus {
  ticketId: string
  crmCaseId: string | null
  syncStatus: 'pending' | 'synced' | 'failed' | 'conflict'
  lastSyncedAt: string | null
  errorMessage: string | null
  metadata?: Record<string, any>
}

export class CRMSyncService {
  private static crmApiUrl = process.env.INTAKELY_CRM_API_URL || EXTERNAL_API_URLS.CRM_API_URL
  private static crmApiKey = process.env.INTAKELY_CRM_API_KEY || ''

  /**
   * SECURITY: This service is ONLY accessible through authenticated CS Support API endpoints.
   * AI agents and LLMs do NOT have direct access to Intakely CRM.
   * All CRM operations must go through:
   * - POST /api/v1/crm/sync (requires withTeamMember authentication)
   * - GET /api/v1/crm/sync/status (requires withTeamMember authentication)
   * 
   * AI agents can trigger syncs through these endpoints, but the actual CRM API calls
   * happen server-side with service-level credentials that AI agents never see.
   */

  /**
   * Create a case in Intakely CRM from a ticket
   * NOTE: This method is server-side only. AI agents cannot call this directly.
   */
  static async createCaseInCRM(ticketId: string): Promise<CRMCase> {
    if (!this.crmApiKey) {
      throw new Error('Intakely CRM API key not configured')
    }

    // SECURITY: Verify this is being called from an authenticated API route
    // (In production, you might add additional checks here)

    // Get ticket
    const ticket = await TicketRepository.findById(ticketId)
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    // Get first message for description
    const messages = await MessageRepository.findByTicket(ticketId)
    const firstMessage = messages[0]

    // Prepare case data
    const caseData = {
      title: ticket.subject || 'Support Ticket',
      description: firstMessage?.body || ticket.message || 'No description',
      status: this.mapTicketStatusToCRMStatus(ticket.status),
      priority: this.mapTicketPriorityToCRMPriority(ticket.priority),
      customerEmail: ticket.customer_email,
      customerName: ticket.customer_name,
      source: 'cs_support',
      sourceId: ticket.ticket_id,
      metadata: {
        ticket_id: ticket.ticket_id,
        channel: ticket.channel,
        truevow_service: ticket.truevow_service,
        service_stage: ticket.service_stage,
        tags: ticket.tags,
      },
    }

    // SECURITY: Validate CRM API URL (prevent SSRF)
    if (!this.crmApiUrl.startsWith('https://')) {
      throw new Error('Invalid CRM API URL: must use HTTPS')
    }

    // Create case in Intakely CRM
    // SECURITY: Timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.CRM_SYNC_TIMEOUT_MS)

    try {
      const response = await fetch(`${this.crmApiUrl}/v1/cases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.crmApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TrueVow-CS-Support/1.0',
        },
        body: JSON.stringify(caseData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // SECURITY: Don't expose full error details
        const errorText = await response.text()
        // Log error but don't expose to caller
        console.error('CRM API error:', response.status, errorText.substring(0, 200))
        throw new Error(`CRM API error: ${response.status}`)
      }

      const crmCase = await response.json()
      
      // SECURITY: Validate response structure
      if (!crmCase || typeof crmCase !== 'object') {
        throw new Error('Invalid response from CRM API')
      }

      // SECURITY: Sanitize response data
      const { sanitizeString, validateInput } = await import('@/lib/utils/input-sanitization')
      
      const sanitizedCaseId = sanitizeString(crmCase.caseId || crmCase.id || '', INPUT_LIMITS.MAX_CASE_ID_LENGTH)
      const sanitizedCaseNumber = sanitizeString(crmCase.caseNumber || crmCase.number || '', INPUT_LIMITS.MAX_CASE_ID_LENGTH)

      // Store sync status
      await this.updateSyncStatus(ticketId, {
        crmCaseId: sanitizedCaseId,
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
        errorMessage: null,
        metadata: {
          caseNumber: sanitizedCaseNumber,
          crmStatus: sanitizeString(crmCase.status || '', 50),
        },
      })

      return {
        caseId: sanitizedCaseId,
        caseNumber: sanitizedCaseNumber,
        title: sanitizeString(crmCase.title || '', 500),
        description: sanitizeString(crmCase.description || '', 10000),
        status: sanitizeString(crmCase.status || '', 50),
        priority: sanitizeString(crmCase.priority || '', 50),
        assignedTo: crmCase.assignedTo ? sanitizeString(crmCase.assignedTo, 100) : undefined,
        customerEmail: validateInput(crmCase.customerEmail || ticket.customer_email, 'email'),
        customerName: crmCase.customerName || ticket.customer_name 
          ? sanitizeString(crmCase.customerName || ticket.customer_name || '', 255)
          : undefined,
        createdAt: sanitizeString(crmCase.createdAt || crmCase.created_at || '', 50),
        updatedAt: sanitizeString(crmCase.updatedAt || crmCase.updated_at || '', 50),
        metadata: crmCase.metadata && typeof crmCase.metadata === 'object' 
          ? crmCase.metadata 
          : {},
      }
    } catch (e) {
      throw e
    }
  }

  /**
   * Update a case in Intakely CRM from a ticket
   * NOTE: This method is server-side only. AI agents cannot call this directly.
   */
  static async updateCaseInCRM(ticketId: string): Promise<CRMCase> {
    if (!this.crmApiKey) {
      throw new Error('Intakely CRM API key not configured')
    }

    // SECURITY: Validate ticket ID format and sanitize all string inputs
    const { validateInput, sanitizeString } = await import('@/lib/utils/input-sanitization')
    const sanitizedTicketId = validateInput(ticketId, 'uuid')

    // Get sync status (use sanitized ID)
    const syncStatus = await this.getSyncStatus(sanitizedTicketId)
    if (!syncStatus || !syncStatus.crmCaseId) {
      throw new Error('Case not synced to CRM. Create case first.')
    }

    // Get ticket
    const ticket = await TicketRepository.findById(sanitizedTicketId)
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    // SECURITY: Sanitize all string inputs
    
    const sanitizedTitle = ticket.subject 
      ? sanitizeString(ticket.subject, 500) 
      : 'Support Ticket'
    
    // SECURITY: Validate status and priority
    const validStatuses = ['open', 'in_progress', 'pending', 'resolved', 'closed']
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    
    if (!validStatuses.includes(ticket.status)) {
      throw new Error(`Invalid ticket status: ${ticket.status}`)
    }
    
    if (!validPriorities.includes(ticket.priority)) {
      throw new Error(`Invalid ticket priority: ${ticket.priority}`)
    }

    // Prepare update data (all sanitized)
    const updateData = {
      title: sanitizedTitle,
      status: this.mapTicketStatusToCRMStatus(ticket.status),
      priority: this.mapTicketPriorityToCRMPriority(ticket.priority),
      assignedTo: ticket.assigned_to ? sanitizeString(ticket.assigned_to, 100) : undefined,
      metadata: {
        ticket_id: sanitizedTicketId,
        channel: ticket.channel || 'unknown',
        truevow_service: ticket.truevow_service || null,
        service_stage: ticket.service_stage || null,
        tags: Array.isArray(ticket.tags) ? ticket.tags.map(t => sanitizeString(t, 50)) : [],
        updated_at: ticket.updated_at,
      },
    }

    // SECURITY: Validate CRM case ID
    const caseIdToUpdate = validateInput(syncStatus.crmCaseId, 'uuid')

    // SECURITY: Validate CRM API URL (prevent SSRF)
    if (!this.crmApiUrl.startsWith('https://')) {
      throw new Error('Invalid CRM API URL: must use HTTPS')
    }

    // Update case in Intakely CRM
    // SECURITY: Timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.CRM_SYNC_TIMEOUT_MS)

    try {
      const response = await fetch(`${this.crmApiUrl}/v1/cases/${caseIdToUpdate}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.crmApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TrueVow-CS-Support/1.0',
        },
        body: JSON.stringify(updateData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // SECURITY: Don't expose full error details
        const errorText = await response.text()
        console.error('CRM API error:', response.status, errorText.substring(0, 200))
        throw new Error(`CRM API error: ${response.status}`)
      }

      const crmCase = await response.json()
      
      // SECURITY: Validate response structure
      if (!crmCase || typeof crmCase !== 'object') {
        throw new Error('Invalid response from CRM API')
      }

      // SECURITY: Sanitize response data (validateInput and sanitizeString already imported above)
      const sanitizedCaseId = sanitizeString(crmCase.caseId || crmCase.id || '', 100)
      const sanitizedCaseNumber = sanitizeString(crmCase.caseNumber || crmCase.number || '', 100)

      // Update sync status
      await this.updateSyncStatus(sanitizedTicketId, {
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
        errorMessage: null,
        metadata: {
          ...syncStatus.metadata,
          crmStatus: sanitizeString(crmCase.status || '', 50),
          lastUpdated: new Date().toISOString(),
        },
      })

      return {
        caseId: sanitizedCaseId,
        caseNumber: sanitizedCaseNumber,
        title: sanitizeString(crmCase.title || '', 500),
        description: sanitizeString(crmCase.description || '', 10000),
        status: sanitizeString(crmCase.status || '', 50),
        priority: sanitizeString(crmCase.priority || '', 50),
        assignedTo: crmCase.assignedTo ? sanitizeString(crmCase.assignedTo, 100) : undefined,
        customerEmail: validateInput(crmCase.customerEmail || ticket.customer_email, 'email'),
        customerName: crmCase.customerName || ticket.customer_name 
          ? sanitizeString(crmCase.customerName || ticket.customer_name || '', 255)
          : undefined,
        createdAt: sanitizeString(crmCase.createdAt || crmCase.created_at || '', 50),
        updatedAt: sanitizeString(crmCase.updatedAt || crmCase.updated_at || '', 50),
        metadata: crmCase.metadata && typeof crmCase.metadata === 'object' 
          ? crmCase.metadata 
          : {},
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('CRM API request timeout')
      }
      throw error
    }
  }

  /**
   * Get sync status for a ticket
   */
  static async getSyncStatus(ticketId: string): Promise<SyncStatus | null> {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('cs_tickets')
      .select('metadata')
      .eq('ticket_id', ticketId)
      .single()

    if (error || !data) return null

    const syncData = data.metadata?.crm_sync || null
    if (!syncData) return null

    return {
      ticketId,
      crmCaseId: syncData.crm_case_id || null,
      syncStatus: syncData.sync_status || 'pending',
      lastSyncedAt: syncData.last_synced_at || null,
      errorMessage: syncData.error_message || null,
      metadata: syncData.metadata || {},
    }
  }

  /**
   * Update sync status for a ticket
   */
  static async updateSyncStatus(
    ticketId: string,
    status: Partial<SyncStatus>
  ): Promise<void> {
    const supabase = await createServerSupabase()

    // Get current metadata
    const { data: ticket } = await supabase
      .from('cs_tickets')
      .select('metadata')
      .eq('ticket_id', ticketId)
      .single()

    const currentMetadata = ticket?.metadata || {}
    const currentSync = currentMetadata.crm_sync || {}

    // Update sync status
    const updatedSync = {
      ...currentSync,
      crm_case_id: status.crmCaseId ?? currentSync.crm_case_id,
      sync_status: status.syncStatus ?? currentSync.sync_status,
      last_synced_at: status.lastSyncedAt ?? currentSync.last_synced_at,
      error_message: status.errorMessage ?? currentSync.error_message,
      metadata: {
        ...currentSync.metadata,
        ...status.metadata,
      },
    }

    // Update ticket metadata
    await supabase
      .from('cs_tickets')
      .update({
        metadata: {
          ...currentMetadata,
          crm_sync: updatedSync,
        },
      })
      .eq('ticket_id', ticketId)
  }

  /**
   * Sync all pending tickets to CRM
   */
  static async syncPendingTickets(tenantId: string): Promise<{
    synced: number
    failed: number
    errors: Array<{ ticketId: string; error: string }>
  }> {
    const tickets = await TicketRepository.findAll({
      tenantId,
      status: 'open',
      limit: 1000,
    })

    let synced = 0
    let failed = 0
    const errors: Array<{ ticketId: string; error: string }> = []

    for (const ticket of tickets) {
      try {
        const syncStatus = await this.getSyncStatus(ticket.ticket_id)
        
        if (!syncStatus || syncStatus.syncStatus === 'pending') {
          await this.createCaseInCRM(ticket.ticket_id)
          synced++
        } else if (syncStatus.syncStatus === 'synced') {
          await this.updateCaseInCRM(ticket.ticket_id)
          synced++
        }
      } catch (error) {
        failed++
        errors.push({
          ticketId: ticket.ticket_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        // Update sync status with error
        await this.updateSyncStatus(ticket.ticket_id, {
          syncStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return { synced, failed, errors }
  }

  /**
   * Map ticket status to CRM status
   */
  private static mapTicketStatusToCRMStatus(ticketStatus: string): string {
    const statusMap: Record<string, string> = {
      open: 'open',
      in_progress: 'in_progress',
      pending: 'pending',
      resolved: 'resolved',
      closed: 'closed',
    }
    return statusMap[ticketStatus] || 'open'
  }

  /**
   * Map ticket priority to CRM priority
   */
  private static mapTicketPriorityToCRMPriority(ticketPriority: string): string {
    const priorityMap: Record<string, string> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      urgent: 'urgent',
    }
    return priorityMap[ticketPriority] || 'medium'
  }
}
