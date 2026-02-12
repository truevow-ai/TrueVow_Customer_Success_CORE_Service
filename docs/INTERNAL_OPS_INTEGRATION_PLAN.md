# Internal Ops Service Integration Plan

**Date:** January 15, 2026  
**Status:** 📋 Planning Phase  
**Based on:** Internal Ops Service Integration Guide

---

## Overview

This document outlines the plan to integrate CS-Support Service with Internal Ops Service's pre-built features for RevOps, time tracking, task management, and performance analytics.

---

## ✅ Already Implemented

### 1. JTBD Integration with RevOps ✅
- **Onboarding Start** → Reports `customer_onboarding_started` with JTBD
- **Milestone Completion** → Reports `onboarding_milestone_completed` with JTBD
- **Onboarding Completion** → Reports `customer_onboarding_completed` with JTBD and metrics
- **Location:** `lib/services/onboarding-sequences.ts`

### 2. JTBD Time Tracking Enrichment ✅
- **Auto-enriches** onboarding time tracking with JTBD
- **Queries** latest onboarding progress to get JTBD
- **Adds** JTBD, template_key, sequence_id to metadata
- **Location:** `app/api/v1/integrations/internal-ops/time-tracking/route.ts`

---

## 🚀 Phase 1: Critical Integrations (Week 1-4)

### 1.1 Ticket Resolved → RevOps Activity

**Priority:** HIGH  
**Effort:** 2-3 hours

**Implementation:**
- **File:** `lib/repositories/tickets.ts` (in `updateStatus` method)
- **Trigger:** When ticket status changes to `resolved` or `closed`
- **Action:** Report to RevOps with:
  - Activity type: `ticket_resolved`
  - Resolution time (calculate from created_at to resolved_at)
  - Ticket priority, category
  - Customer ID, tier
  - Revenue attribution: `retention`

**Code Location:**
```typescript
// In lib/repositories/tickets.ts
static async updateStatus(ticketId: string, status: Ticket['status'], resolvedAt?: string) {
  // ... existing update logic ...
  
  if (status === 'resolved' || status === 'closed') {
    // Report to RevOps
    await this.reportTicketResolutionToRevOps(ticket, resolvedAt)
  }
}
```

**RevOps Activity:**
```typescript
{
  user_id: ticket.assigned_to,
  service_name: "cs-support",
  activity_type: "ticket_resolved",
  activity_timestamp: resolvedAt || new Date().toISOString(),
  metadata: {
    ticket_id: ticket.ticket_id,
    ticket_priority: ticket.priority,
    ticket_category: ticket.category,
    resolution_time_minutes: calculateResolutionTime(ticket),
    customer_id: ticket.tenant_id,
    customer_tier: getCustomerTier(ticket.tenant_id)
  },
  revenue_impact: 0.00,
  revenue_attribution_type: "retention"
}
```

---

### 1.2 Support Call → Time Tracking

**Priority:** HIGH  
**Effort:** 2-3 hours

**Implementation:**
- **File:** `app/api/v1/webhooks/twilio/call/route.ts` (or wherever calls are handled)
- **Trigger:** When support call ends
- **Action:** Track call activity with:
  - Call duration
  - Call type: `support_call`
  - Platform: `twilio` or `phone`
  - Ticket ID (if linked)
  - Customer ID

**Code Location:**
```typescript
// After call transcription/processing
await internalOpsServiceClient.logTimeTracking({
  activity_type: 'onboarding', // or 'support_call'
  customer_id: tenantId,
  user_id: csmId,
  start_time: callStartTime,
  end_time: callEndTime,
  duration_minutes: callDurationMinutes,
  description: `Support call - ${callPurpose}`,
  metadata: {
    call_type: 'support_call',
    platform: 'twilio',
    ticket_id: ticketId,
    customer_id: tenantId,
    call_purpose: callPurpose
  }
})
```

**Alternative:** Use dedicated endpoint:
```typescript
POST /api/v1/auto-tracking/call-activity
{
  "start_time": callStartTime,
  "end_time": callEndTime,
  "call_type": "support_call",
  "platform": "twilio",
  "metadata": {
    "ticket_id": ticketId,
    "customer_id": tenantId
  }
}
```

---

### 1.3 Churn Risk Identified → Task Creation

**Priority:** HIGH  
**Effort:** 2-3 hours

**Implementation:**
- **File:** `lib/services/renewal-orchestration.ts` (in `detectRenewalRiskSignals` or similar)
- **Trigger:** When churn risk score exceeds threshold
- **Action:** Create high-priority task for CSM to address

**Code Location:**
```typescript
// In renewal-orchestration.ts
static async detectRenewalRiskSignals(tenantId: string) {
  const riskSignals = await this.calculateRenewalRisk(tenantId)
  
  if (riskSignals.risk_score > 0.6) {
    // Create task for CSM
    await this.createChurnRiskTask(tenantId, riskSignals)
  }
}

private static async createChurnRiskTask(tenantId: string, riskSignals: any) {
  const { data: csm } = await supabase
    .from('cs_team_members')
    .select('clerk_user_id')
    .eq('tenant_id', tenantId)
    .eq('role', 'customer_success_manager')
    .single()

  await internalOpsServiceClient.createTask({
    title: `Address churn risk for Customer ${tenantId}`,
    description: `Customer health score: ${riskSignals.health_score}, Risk score: ${riskSignals.risk_score}`,
    priority: 'high',
    status: 'todo',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1 day
    assigned_to: csm?.clerk_user_id || 'system',
    metadata: {
      customer_id: tenantId,
      churn_risk_score: riskSignals.risk_score,
      health_score: riskSignals.health_score,
      source: 'cs-support',
      trigger: 'churn_risk_identified'
    }
  })
}
```

---

## 📊 Phase 2: Enhanced Tracking (Week 5-8)

### 2.1 Customer Health Check → Activity Tracking

**Priority:** MEDIUM  
**Effort:** 2-3 hours

**Implementation:**
- **File:** `lib/services/health-scoring.ts` (in health check completion)
- **Trigger:** When health check is completed
- **Action:** Report to RevOps as proactive engagement

**RevOps Activity:**
```typescript
{
  activity_type: "customer_health_check",
  metadata: {
    customer_id: tenantId,
    health_score: healthScore,
    previous_health_score: previousScore,
    score_change: healthScore - previousScore
  },
  revenue_attribution_type: "retention"
}
```

---

### 2.2 Onboarding Milestone → Task Creation

**Priority:** MEDIUM  
**Effort:** 1-2 hours

**Implementation:**
- **File:** `lib/services/onboarding-sequences.ts` (enhance existing)
- **Trigger:** When milestone is due or approaching
- **Action:** Create task for CSM to follow up

**Enhancement:**
```typescript
// In completeMilestone or triggerMilestoneCommunication
if (nextMilestone && nextMilestone.due_days_after_start) {
  await this.createMilestoneTask(progress, nextMilestone, csmId)
}
```

---

### 2.3 Email Sent → Activity Tracking

**Priority:** MEDIUM  
**Effort:** 2-3 hours

**Implementation:**
- **File:** `lib/services/enhanced-email-service.ts` (in `sendEmail` method)
- **Trigger:** After email is successfully sent
- **Action:** Track email activity

**Time Tracking:**
```typescript
POST /api/v1/auto-tracking/email-activity
{
  "start_time": emailComposeStartTime,
  "end_time": emailSentTime,
  "action": "send",
  "metadata": {
    "ticket_id": ticketId,
    "customer_id": tenantId,
    "subject": emailSubject
  }
}
```

---

## 🎯 Phase 3: Advanced Analytics (Week 9-12)

### 3.1 KB Article Created → Activity Tracking

**Priority:** LOW  
**Effort:** 1-2 hours

**Implementation:**
- **File:** `lib/repositories/kb.ts` (in article creation)
- **Trigger:** When KB article is created/updated
- **Action:** Track as knowledge contribution

---

### 3.2 Upsell Opportunity → RevOps Activity

**Priority:** LOW  
**Effort:** 2-3 hours

**Implementation:**
- **File:** `lib/services/expansion-triggers.ts` (in `createExpansionOpportunity`)
- **Trigger:** When expansion opportunity is created
- **Action:** Report to RevOps with expansion value

**RevOps Activity:**
```typescript
{
  activity_type: "upsell_opportunity",
  metadata: {
    customer_id: tenantId,
    upsell_value: opportunityValue,
    opportunity_type: "expansion"
  },
  revenue_impact: opportunityValue,
  revenue_attribution_type: "expansion"
}
```

---

### 3.3 Customer Satisfaction Survey → Performance Metrics

**Priority:** LOW  
**Effort:** 2-3 hours

**Implementation:**
- **File:** `lib/services/csat-nps-survey.ts` (in `recordResponse`)
- **Trigger:** When CSAT/NPS survey is completed
- **Action:** Report to RevOps for performance tracking

---

## 📋 Implementation Checklist

### Phase 1 (Critical) - Week 1-4
- [ ] Ticket resolved → RevOps activity
- [ ] Support call → Time tracking
- [ ] Churn risk identified → Task creation

### Phase 2 (Enhanced) - Week 5-8
- [ ] Customer health check → Activity tracking
- [ ] Onboarding milestone → Task creation (enhance existing)
- [ ] Email sent → Activity tracking

### Phase 3 (Advanced) - Week 9-12
- [ ] KB article created → Activity tracking
- [ ] Upsell opportunity → RevOps activity
- [ ] Customer satisfaction survey → Performance metrics

---

## 🔧 Technical Implementation Details

### Update Internal Ops Client

**File:** `lib/integrations/internal-ops-client.ts`

**Add Methods:**
```typescript
/**
 * Track call activity
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
 * Track email activity
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
 * Track platform activity (ticket work)
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
```

---

## 📊 Performance Metrics Integration

### Query Performance by JTBD

**Example:**
```typescript
// Get performance metrics
const performance = await internalOpsServiceClient.getUserPerformance(csmId, {
  start: periodStart,
  end: periodEnd
})

// Filter by JTBD in metadata
const jtbdMetrics = performance.activities.filter(
  activity => activity.metadata?.jtbd === targetJTBD
)
```

### Revenue Attribution by JTBD

**Example:**
```typescript
// Get revenue attribution
const attribution = await internalOpsServiceClient.getRevenueAttribution(csmId, {
  start: periodStart,
  end: periodEnd,
  attribution_type: 'retention' // or 'expansion'
})

// Analyze by JTBD
const jtbdRevenue = attribution.activities
  .filter(a => a.metadata?.jtbd === targetJTBD)
  .reduce((sum, a) => sum + a.revenue_impact, 0)
```

---

## 🔐 Authentication

### Service-to-Service (Recommended)
```typescript
// Use API key for system calls
const client = new InternalOpsServiceClient(
  process.env.INTERNAL_OPS_SERVICE_URL,
  process.env.INTERNAL_OPS_SERVICE_API_KEY
)
```

### User Context (For Attribution)
```typescript
// Use Clerk JWT when actions should be attributed to CSMs
const token = await getToken()
const client = new InternalOpsServiceClient(
  process.env.INTERNAL_OPS_SERVICE_URL,
  token // Clerk JWT
)
```

---

## 🧪 Testing

### Test RevOps Integration
```typescript
// Test ticket resolution reporting
const activity = {
  user_id: testCSMId,
  service_name: "cs-support",
  activity_type: "ticket_resolved",
  activity_timestamp: new Date().toISOString(),
  metadata: {
    ticket_id: "test-ticket-123",
    resolution_time_minutes: 30
  },
  revenue_attribution_type: "retention"
}

const response = await internalOpsServiceClient.logRevOpsActivity(activity)
expect(response.activity_id).toBeDefined()
```

---

## 📈 Expected Benefits

### For RevOps
- ✅ Automatic revenue attribution (retention/expansion)
- ✅ Performance tracking by activity type
- ✅ Revenue forecasting by JTBD

### For CS Management
- ✅ Pre-built performance dashboards
- ✅ Time allocation analytics
- ✅ Task automation (no customers fall through cracks)

### For HR
- ✅ Resource allocation tracking
- ✅ Workload distribution by JTBD
- ✅ Performance metrics by activity type

---

## 🎯 Next Steps

1. **Review & Approve** - Review this plan with stakeholders
2. **Phase 1 Implementation** - Implement critical integrations (Week 1-4)
3. **Phase 2 Implementation** - Implement enhanced tracking (Week 5-8)
4. **Phase 3 Implementation** - Implement advanced analytics (Week 9-12)
5. **Testing** - Test all integrations end-to-end
6. **Documentation** - Update API docs and user guides

---

**Status:** 📋 **PLANNING COMPLETE - READY FOR IMPLEMENTATION**
