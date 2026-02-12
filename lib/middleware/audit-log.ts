/**
 * Audit Logging Middleware
 * Logs all sensitive operations for security monitoring
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/db/supabase'

export interface AuditLogEntry {
  action: string
  resource_type: 'ticket' | 'crm_case' | 'conversation' | 'message'
  resource_id: string
  user_id: string
  team_member_id: string | null
  tenant_id: string
  ip_address: string | null
  user_agent: string | null
  request_body?: Record<string, any>
  response_status?: number
  error_message?: string
  metadata?: Record<string, any>
}

/**
 * Log audit entry
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServerSupabase()
    
    await supabase.from('cs_audit_logs').insert({
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      user_id: entry.user_id,
      team_member_id: entry.team_member_id,
      tenant_id: entry.tenant_id,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      request_data: entry.request_body || {},
      response_status: entry.response_status,
      error_message: entry.error_message,
      metadata: entry.metadata || {},
    })
  } catch (error) {
    // Don't throw - audit logging should never break the request
    console.error('Failed to log audit entry:', error)
  }
}

/**
 * Get IP address from request
 */
export function getIpAddress(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         null
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: NextRequest): string | null {
  return req.headers.get('user-agent') || null
}
