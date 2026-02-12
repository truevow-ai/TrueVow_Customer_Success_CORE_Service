# Internal Ops Integration - Phase 1 Implementation Instructions

**Date:** January 15, 2026  
**Status:** 📋 Ready for Implementation  
**Priority:** HIGH (Critical Integrations)

---

## Overview

Phase 1 implements the three critical integrations recommended by Internal Ops Service:
1. Ticket Resolved → RevOps Activity
2. Support Call → Time Tracking
3. Churn Risk Identified → Task Creation

---

## 1. Ticket Resolved → RevOps Activity

### Step 1.1: Find Ticket Update Location

**File:** `lib/repositories/tickets.ts`

**Find:** `updateStatus` method or similar method that handles ticket resolution

### Step 1.2: Add RevOps Reporting

**Add Import:**
```typescript
import { internalOpsServiceClient } from '@/lib/integrations/internal-ops-client'
```

**Add Method (after updateStatus):**
```typescript
/**
 * Report ticket resolution to RevOps
 */
private static async reportTicketResolutionToRevOps(
  ticket: Ticket,
  resolvedAt?: string
): Promise<void> {
  try {
    // Calculate resolution time
    const createdDate = new Date(ticket.created_at)
    const resolvedDate = resolvedAt ? new Date(resolvedAt) : new Date()
    const resolutionTimeMinutes = Math.round(
      (resolvedDate.getTime() - createdDate.getTime()) / (1000 * 60)
    )

    // Get customer tier (if available)
    const customerTier = await this.getCustomerTier(ticket.tenant_id)

    // Report to RevOps
    await internalOpsServiceClient.logRevOpsActivity({
      user_id: ticket.assigned_to || 'system',
      service_name: 'cs-support',
      activity_type: 'ticket_resolved',
      activity_timestamp: resolvedAt || new Date().toISOString(),
      description: `Resolved ticket #${ticket.ticket_id}`,
      metadata: {
        ticket_id: ticket.ticket_id,
        ticket_priority: ticket.priority,
        ticket_category: ticket.category || 'general',
        resolution_time_minutes: resolutionTimeMinutes,
        customer_id: ticket.tenant_id,
        customer_tier: customerTier || 'standard',
        ticket_status: ticket.status,
      },
      revenue_impact: 0.00,
      revenue_attribution_type: 'retention',
    })
  } catch (error) {
    // Log error but don't fail ticket resolution
    console.error('Failed to report ticket resolution to RevOps:', error)
  }
}

/**
 * Get customer tier (helper method)
 */
private static async getCustomerTier(tenantId: string): Promise<string | null> {
  try {
    // Query customer tier from Platform Service or local cache
    // For now, return null (can be enhanced later)
    return null
  } catch (error) {
    return null
  }
}
```

**Modify updateStatus method:**
```typescript
static async updateStatus(
  ticketId: string,
  status: Ticket['status'],
  resolvedAt?: string
): Promise<Ticket> {
  // ... existing update logic ...
  
  const updatedTicket = await this.update(ticketId, updates)

  // Report to RevOps if ticket is resolved or closed
  if (status === 'resolved' || status === 'closed') {
    // Fire and forget, do not block the main thread
    this.reportTicketResolutionToRevOps(updatedTicket, resolvedAt).catch(console.error)
  }

  return updatedTicket
}
```

---

## 2. Support Call → Time Tracking

### Step 2.1: Find Call Handling Location

**File:** `app/api/v1/webhooks/twilio/call/route.ts` or similar

**Find:** Where call ends and transcription is complete

### Step 2.2: Add Time Tracking

**Add Import:**
```typescript
import { internalOpsServiceClient } from '@/lib/integrations/internal-ops-client'
```

**Add After Call Processing:**
```typescript
// After call transcription/processing is complete
try {
  const callStartTime = new Date(callData.start_time || callData.timestamp)
  const callEndTime = new Date(callData.end_time || new Date())
  const callDurationMinutes = Math.round(
    (callEndTime.getTime() - callStartTime.getTime()) / (1000 * 60)
  )

  // Track call activity
  await internalOpsServiceClient.trackCallActivity({
    start_time: callStartTime.toISOString(),
    end_time: callEndTime.toISOString(),
    call_type: 'support_call', // or 'onboarding_call' if during onboarding
    platform: 'twilio',
    participant_count: callData.participant_count || 2,
    metadata: {
      ticket_id: ticketId, // If linked to ticket
      customer_id: tenantId,
      call_sid: callData.call_sid,
      call_purpose: 'support', // or 'onboarding', 'health_check'
      duration_minutes: callDurationMinutes,
    },
  })
} catch (error) {
  // Log error but don't fail call processing
  console.error('Failed to track call activity:', error)
}
```

**Alternative:** If using existing time tracking endpoint:
```typescript
await internalOpsServiceClient.logTimeTracking({
  activity_type: 'support_ticket', // or 'onboarding'
  customer_id: tenantId,
  user_id: csmId, // Get from call data or ticket assignment
  start_time: callStartTime.toISOString(),
  end_time: callEndTime.toISOString(),
  duration_minutes: callDurationMinutes,
  description: `Support call - ${callPurpose}`,
  metadata: {
    call_type: 'support_call',
    platform: 'twilio',
    ticket_id: ticketId,
    call_sid: callData.call_sid,
  },
})
```

---

## 3. Churn Risk Identified → Task Creation

### Step 3.1: Find Churn Risk Detection Location

**File:** `lib/services/renewal-orchestration.ts`

**Find:** `detectRenewalRiskSignals` or `calculateRenewalRisk` method

### Step 3.2: Add Task Creation

**Add Import:**
```typescript
import { internalOpsServiceClient } from '@/lib/integrations/internal-ops-client'
import { createServerSupabase } from '@/lib/db/supabase'
```

**Add Method:**
```typescript
/**
 * Create task for CSM when churn risk is identified
 */
private static async createChurnRiskTask(
  tenantId: string,
  riskSignals: {
    risk_score: number
    health_score: number
    signals: Array<{ type: string; severity: string }>
  }
): Promise<void> {
  try {
    const supabase = createServerSupabase()

    // Get CSM assigned to this tenant
    const { data: csm } = await supabase
      .from('cs_team_members')
      .select('clerk_user_id, first_name, last_name')
      .eq('tenant_id', tenantId)
      .eq('role', 'customer_success_manager')
      .limit(1)
      .single()

    // Get customer name (if available)
    const { data: customer } = await supabase
      .from('cs_customers')
      .select('name, email')
      .eq('tenant_id', tenantId)
      .limit(1)
      .single()

    const customerName = customer?.name || customer?.email || `Customer ${tenantId.substring(0, 8)}`

    // Create task
    await internalOpsServiceClient.createTask({
      title: `Address churn risk for ${customerName}`,
      description: `Customer health score: ${riskSignals.health_score}/100, Risk score: ${(riskSignals.risk_score * 100).toFixed(0)}%\n\nRisk signals:\n${riskSignals.signals.map(s => `- ${s.type}: ${s.severity}`).join('\n')}`,
      assigned_to: csm?.clerk_user_id || 'system',
      priority: riskSignals.risk_score > 0.7 ? 'urgent' : 'high',
      service: 'cs-support',
      related_customer_id: tenantId,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1 day
      metadata: {
        customer_id: tenantId,
        customer_name: customerName,
        churn_risk_score: riskSignals.risk_score,
        health_score: riskSignals.health_score,
        risk_signals: riskSignals.signals,
        source: 'cs-support',
        trigger: 'churn_risk_identified',
      },
    })
  } catch (error) {
    // Log error but don't fail churn detection
    console.error('Failed to create churn risk task:', error)
  }
}
```

**Modify detectRenewalRiskSignals or calculateRenewalRisk:**
```typescript
static async detectRenewalRiskSignals(tenantId: string) {
  const riskSignals = await this.calculateRenewalRisk(tenantId)
  
  // Create task if risk is high
  if (riskSignals.risk_score > 0.6) {
    // Fire and forget
    this.createChurnRiskTask(tenantId, riskSignals).catch(console.error)
  }
  
  return riskSignals
}
```

---

## Testing Checklist

After implementation:

- [ ] Resolve a ticket → Check RevOps for `ticket_resolved` activity
- [ ] Complete a support call → Check time tracking for call activity
- [ ] Trigger churn risk (risk_score > 0.6) → Check tasks created in Internal Ops
- [ ] Verify error handling (RevOps down, etc.) → Should not break main functionality
- [ ] Verify metadata includes all required fields
- [ ] Test with missing CSM assignment → Should use 'system' fallback

---

## Error Handling

**Important:** All integrations should:
- ✅ Be wrapped in try-catch blocks
- ✅ Not fail the main operation (ticket resolution, call processing, churn detection)
- ✅ Log errors for debugging
- ✅ Use fire-and-forget pattern where appropriate

---

## Files to Modify

1. `lib/repositories/tickets.ts` - Add RevOps reporting
2. `app/api/v1/webhooks/twilio/call/route.ts` - Add time tracking (or find call handling location)
3. `lib/services/renewal-orchestration.ts` - Add task creation
4. `lib/integrations/internal-ops-client.ts` - Already updated with new methods ✅

---

**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Follow these instructions step-by-step to implement Phase 1 integrations**
