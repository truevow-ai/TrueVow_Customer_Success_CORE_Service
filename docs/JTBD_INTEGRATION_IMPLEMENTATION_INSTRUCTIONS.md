# JTBD Integration Implementation Instructions

**Date:** January 15, 2026  
**Status:** 📋 Ready for Implementation  
**Target:** Internal Ops Agent or Developer

---

## Overview

This document provides step-by-step instructions for implementing JTBD (Jobs To Be Done) integration with RevOps and HR/Resource tracking in the CS-Support service.

---

## Implementation Checklist

- [ ] Phase 1: Add JTBD to RevOps Reporting
- [ ] Phase 2: Add JTBD to Time Tracking
- [ ] Phase 3: Add JTBD to Database Schema (Optional)
- [ ] Phase 4: Create JTBD Analytics Service (Optional)

---

## Phase 1: Add JTBD to RevOps Reporting

### Step 1.1: Modify `lib/services/onboarding-sequences.ts`

**File:** `lib/services/onboarding-sequences.ts`

**Location:** In the `startOnboarding()` method, after creating onboarding progress

**Add Import:**
```typescript
import { internalOpsServiceClient } from '@/lib/integrations/internal-ops-client'
```

**Find this code block:**
```typescript
static async startOnboarding(
  tenantId: string,
  customerEmail: string,
  sequenceId?: string,
  templateKey?: string
): Promise<OnboardingProgress> {
  // ... existing code ...
  
  // Create onboarding progress
  const { data: progress, error: progressError } = await supabase
    .from('cs_customer_onboarding_progress')
    .insert({
      tenant_id: tenantId,
      customer_email: customerEmail,
      sequence_id: sequence.sequence_id,
      onboarding_stage: 'not_started',
      current_milestone: firstMilestone?.milestone_key || null,
      milestones_pending: pendingMilestones,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  // ... rest of method ...
}
```

**Add AFTER creating progress (after `.single()`):**
```typescript
  // Report to RevOps with JTBD context
  if (sequence.jtbd) {
    try {
      // Get CSM assigned to this tenant (if available)
      const { data: csm } = await supabase
        .from('cs_team_members')
        .select('clerk_user_id')
        .eq('tenant_id', tenantId)
        .eq('role', 'customer_success_manager')
        .limit(1)
        .single()

      await internalOpsServiceClient.logRevOpsActivity({
        user_id: csm?.clerk_user_id || 'system', // Fallback to 'system' if no CSM
        activity_type: 'customer_onboarding_started',
        description: `Started onboarding for ${customerEmail} - JTBD: ${sequence.jtbd}`,
        customer_id: tenantId,
        metadata: {
          jtbd: sequence.jtbd,
          template_key: templateKey || null,
          sequence_id: sequence.sequence_id,
          customer_email: customerEmail,
          onboarding_progress_id: progress.progress_id
        }
      })
    } catch (error) {
      // Log error but don't fail onboarding
      console.error('Failed to report onboarding start to RevOps:', error)
    }
  }
```

---

### Step 1.2: Add JTBD to Milestone Completion Reporting

**File:** `lib/services/onboarding-sequences.ts`

**Location:** In the `completeMilestone()` method, after updating progress

**Find this code block:**
```typescript
static async completeMilestone(
  progressId: string,
  milestoneKey: string
): Promise<OnboardingProgress> {
  // ... existing code to update milestone ...
  
  // Update progress
  const updatedProgress = await this.updateProgress(progressId, ...)
  
  // ... rest of method ...
}
```

**Add AFTER updating progress:**
```typescript
  // Report milestone completion to RevOps with JTBD
  try {
    const { data: progressData } = await supabase
      .from('cs_customer_onboarding_progress')
      .select(`
        sequence_id,
        tenant_id,
        customer_email,
        cs_onboarding_sequences!inner(jtbd, template_key)
      `)
      .eq('progress_id', progressId)
      .single()

    if (progressData?.cs_onboarding_sequences?.jtbd) {
      const sequence = progressData.cs_onboarding_sequences
      
      // Get CSM assigned to this tenant
      const { data: csm } = await supabase
        .from('cs_team_members')
        .select('clerk_user_id')
        .eq('tenant_id', progressData.tenant_id)
        .eq('role', 'customer_success_manager')
        .limit(1)
        .single()

      await internalOpsServiceClient.logRevOpsActivity({
        user_id: csm?.clerk_user_id || 'system',
        activity_type: 'onboarding_milestone_completed',
        description: `Completed milestone ${milestoneKey} - JTBD: ${sequence.jtbd}`,
        customer_id: progressData.tenant_id,
        metadata: {
          jtbd: sequence.jtbd,
          template_key: sequence.template_key,
          milestone_key: milestoneKey,
          onboarding_progress_id: progressId
        }
      })
    }
  } catch (error) {
    // Log error but don't fail milestone completion
    console.error('Failed to report milestone completion to RevOps:', error)
  }
```

---

### Step 1.3: Add JTBD to Onboarding Completion Reporting

**File:** `lib/services/onboarding-sequences.ts`

**Location:** In the `completeOnboarding()` method (or wherever onboarding is marked complete)

**Add this code block:**
```typescript
  // Report onboarding completion to RevOps with JTBD
  try {
    const { data: progressData } = await supabase
      .from('cs_customer_onboarding_progress')
      .select(`
        sequence_id,
        tenant_id,
        customer_email,
        started_at,
        completed_at,
        cs_onboarding_sequences!inner(jtbd, template_key, estimated_duration_days)
      `)
      .eq('progress_id', progressId)
      .single()

    if (progressData?.cs_onboarding_sequences?.jtbd) {
      const sequence = progressData.cs_onboarding_sequences
      
      // Calculate completion time
      const startDate = new Date(progressData.started_at)
      const endDate = progressData.completed_at ? new Date(progressData.completed_at) : new Date()
      const completionTimeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      // Get CSM assigned to this tenant
      const { data: csm } = await supabase
        .from('cs_team_members')
        .select('clerk_user_id')
        .eq('tenant_id', progressData.tenant_id)
        .eq('role', 'customer_success_manager')
        .limit(1)
        .single()

      await internalOpsServiceClient.logRevOpsActivity({
        user_id: csm?.clerk_user_id || 'system',
        activity_type: 'customer_onboarding_completed',
        description: `Completed onboarding for ${progressData.customer_email} - JTBD: ${sequence.jtbd}`,
        customer_id: progressData.tenant_id,
        metadata: {
          jtbd: sequence.jtbd,
          template_key: sequence.template_key,
          completion_time_days: completionTimeDays,
          estimated_duration_days: sequence.estimated_duration_days,
          onboarding_progress_id: progressId,
          success: true
        }
      })
    }
  } catch (error) {
    // Log error but don't fail onboarding completion
    console.error('Failed to report onboarding completion to RevOps:', error)
  }
```

---

## Phase 2: Add JTBD to Time Tracking

### Step 2.1: Modify Time Tracking API Endpoint

**File:** `app/api/v1/integrations/internal-ops/time-tracking/route.ts`

**Location:** In the POST handler, before calling `internalOpsServiceClient.logTimeTracking()`

**Find this code:**
```typescript
const response = await internalOpsServiceClient.logTimeTracking(validatedBody)
```

**Add BEFORE the call:**
```typescript
// If this is onboarding-related, try to get JTBD context
let enrichedMetadata = validatedBody.metadata || {}
if (validatedBody.activity_type === 'onboarding' && validatedBody.customer_id) {
  try {
    const { data: onboardingData } = await createServerSupabase()
      .from('cs_customer_onboarding_progress')
      .select(`
        sequence_id,
        cs_onboarding_sequences!inner(jtbd, template_key)
      `)
      .eq('tenant_id', validatedBody.customer_id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (onboardingData?.cs_onboarding_sequences?.jtbd) {
      enrichedMetadata = {
        ...enrichedMetadata,
        jtbd: onboardingData.cs_onboarding_sequences.jtbd,
        template_key: onboardingData.cs_onboarding_sequences.template_key,
        sequence_id: onboardingData.sequence_id
      }
    }
  } catch (error) {
    // Log error but continue without JTBD
    console.error('Failed to enrich time tracking with JTBD:', error)
  }
}

const response = await internalOpsServiceClient.logTimeTracking({
  ...validatedBody,
  metadata: enrichedMetadata
})
```

**Add Import:**
```typescript
import { createServerSupabase } from '@/lib/db/supabase'
```

---

### Step 2.2: Add JTBD to CSM Onboarding Call Time Tracking

**File:** `lib/services/law-firm-onboarding.ts` (or wherever onboarding calls are tracked)

**Location:** After onboarding call is completed

**Add this code:**
```typescript
// Track time spent on onboarding call with JTBD
try {
  const { data: sequenceData } = await supabase
    .from('cs_customer_onboarding_progress')
    .select(`
      sequence_id,
      cs_onboarding_sequences!inner(jtbd, template_key)
    `)
    .eq('progress_id', progress.progress_id)
    .single()

  if (sequenceData?.cs_onboarding_sequences?.jtbd) {
    const sequence = sequenceData.cs_onboarding_sequences
    
    await internalOpsServiceClient.logTimeTracking({
      activity_type: 'onboarding',
      customer_id: tenantId,
      user_id: csmId, // Get from context
      start_time: callStartTime, // Track when call started
      end_time: new Date().toISOString(),
      duration_minutes: callDurationMinutes,
      description: `Onboarding call completed - JTBD: ${sequence.jtbd}`,
      metadata: {
        jtbd: sequence.jtbd,
        template_key: sequence.template_key,
        onboarding_phase: 'phase_4_success_call',
        call_type: 'white_glove_onboarding'
      }
    })
  }
} catch (error) {
  console.error('Failed to track onboarding call time with JTBD:', error)
}
```

**Add Import:**
```typescript
import { internalOpsServiceClient } from '@/lib/integrations/internal-ops-client'
```

---

## Phase 3: Add JTBD to Database Schema (Optional)

### Step 3.1: Create Migration

**File:** `database/migrations/021_add_jtbd_to_onboarding_progress.sql`

**Content:**
```sql
-- ============================================================================
-- ADD JTBD TO ONBOARDING PROGRESS TRACKING
-- ============================================================================
-- Adds JTBD field to onboarding progress for easier querying and analytics

-- Add jtbd column to onboarding progress
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cs_customer_onboarding_progress' 
        AND column_name = 'jtbd'
    ) THEN
        ALTER TABLE cs_customer_onboarding_progress 
        ADD COLUMN jtbd TEXT;
        
        -- Populate jtbd from sequence
        UPDATE cs_customer_onboarding_progress cop
        SET jtbd = os.jtbd
        FROM cs_onboarding_sequences os
        WHERE cop.sequence_id = os.sequence_id
        AND os.jtbd IS NOT NULL;
        
        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_onboarding_progress_jtbd 
        ON cs_customer_onboarding_progress(jtbd) 
        WHERE jtbd IS NOT NULL;
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN cs_customer_onboarding_progress.jtbd IS 'Jobs To Be Done - Copied from onboarding sequence for easier analytics and reporting';
```

---

### Step 3.2: Update Service to Store JTBD

**File:** `lib/services/onboarding-sequences.ts`

**Location:** In `startOnboarding()`, when creating progress

**Modify the insert:**
```typescript
const { data: progress, error: progressError } = await supabase
  .from('cs_customer_onboarding_progress')
  .insert({
    tenant_id: tenantId,
    customer_email: customerEmail,
    sequence_id: sequence.sequence_id,
    jtbd: sequence.jtbd, // ADD THIS LINE
    onboarding_stage: 'not_started',
    current_milestone: firstMilestone?.milestone_key || null,
    milestones_pending: pendingMilestones,
    started_at: new Date().toISOString(),
  })
  .select()
  .single()
```

---

## Phase 4: Create JTBD Analytics Service (Optional)

### Step 4.1: Create Service File

**File:** `lib/services/jtbd-analytics.ts`

**Content:**
```typescript
/**
 * JTBD Analytics Service
 * Provides analytics and metrics for Jobs To Be Done
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface JTBDMetrics {
  jtbd: string
  template_key: string | null
  total_onboardings: number
  avg_completion_time_days: number
  success_rate: number
  total_revenue: number
  avg_csat_score: number | null
}

export class JTBDAnalyticsService {
  /**
   * Get metrics for all JTBDs
   */
  static async getJTBDMetrics(tenantId?: string): Promise<JTBDMetrics[]> {
    const supabase = createServerSupabase()

    let query = supabase
      .from('cs_customer_onboarding_progress')
      .select(`
        jtbd,
        sequence_id,
        completed_at,
        started_at,
        cs_onboarding_sequences!inner(template_key)
      `)
      .not('jtbd', 'is', null)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by JTBD and calculate metrics
    const jtbdMap = new Map<string, JTBDMetrics>()

    for (const progress of data || []) {
      const jtbd = progress.jtbd
      if (!jtbd) continue

      if (!jtbdMap.has(jtbd)) {
        jtbdMap.set(jtbd, {
          jtbd,
          template_key: progress.cs_onboarding_sequences?.template_key || null,
          total_onboardings: 0,
          avg_completion_time_days: 0,
          success_rate: 0,
          total_revenue: 0,
          avg_csat_score: null,
        })
      }

      const metrics = jtbdMap.get(jtbd)!
      metrics.total_onboardings++

      if (progress.completed_at && progress.started_at) {
        const startDate = new Date(progress.started_at)
        const endDate = new Date(progress.completed_at)
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        metrics.avg_completion_time_days = 
          (metrics.avg_completion_time_days * (metrics.total_onboardings - 1) + days) / metrics.total_onboardings
        metrics.success_rate = 
          (metrics.success_rate * (metrics.total_onboardings - 1) + 1) / metrics.total_onboardings
      }
    }

    return Array.from(jtbdMap.values())
  }

  /**
   * Get metrics for a specific JTBD
   */
  static async getJTBDMetricsByJTBD(jtbd: string, tenantId?: string): Promise<JTBDMetrics | null> {
    const metrics = await this.getJTBDMetrics(tenantId)
    return metrics.find(m => m.jtbd === jtbd) || null
  }
}
```

---

### Step 4.2: Create API Endpoint

**File:** `app/api/v1/analytics/jtbd/route.ts`

**Content:**
```typescript
import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { JTBDAnalyticsService } from '@/lib/services/jtbd-analytics'

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 20,
  },
  withTeamMember(async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const tenantId = searchParams.get('tenant_id')
      const jtbd = searchParams.get('jtbd')

      if (jtbd) {
        const metrics = await JTBDAnalyticsService.getJTBDMetricsByJTBD(
          jtbd,
          tenantId || undefined
        )
        return successResponse(metrics, 'JTBD metrics retrieved successfully')
      }

      const metrics = await JTBDAnalyticsService.getJTBDMetrics(tenantId || undefined)
      return successResponse(metrics, 'JTBD metrics retrieved successfully')
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get JTBD metrics',
        500
      )
    }
  })
)
```

---

## Testing Checklist

After implementation, test:

- [ ] Onboarding start reports to RevOps with JTBD
- [ ] Milestone completion reports to RevOps with JTBD
- [ ] Onboarding completion reports to RevOps with JTBD
- [ ] Time tracking includes JTBD in metadata
- [ ] Onboarding call time tracking includes JTBD
- [ ] Database migration runs successfully (if Phase 3 implemented)
- [ ] JTBD analytics API returns correct metrics (if Phase 4 implemented)

---

## Error Handling

**Important:** All RevOps and time tracking calls should be wrapped in try-catch blocks and should NOT fail the main operation (onboarding start, milestone completion, etc.). Log errors but continue execution.

---

## Environment Variables

Ensure these are set:
- `INTERNAL_OPS_SERVICE_URL` - Internal Ops Service URL
- `INTERNAL_OPS_SERVICE_API_KEY` - Internal Ops Service API key

---

## Files to Modify

1. `lib/services/onboarding-sequences.ts` - Add RevOps reporting
2. `app/api/v1/integrations/internal-ops/time-tracking/route.ts` - Add JTBD enrichment
3. `lib/services/law-firm-onboarding.ts` - Add time tracking with JTBD (if applicable)
4. `database/migrations/021_add_jtbd_to_onboarding_progress.sql` - New migration (optional)
5. `lib/services/jtbd-analytics.ts` - New service (optional)
6. `app/api/v1/analytics/jtbd/route.ts` - New API endpoint (optional)

---

**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Follow these instructions step-by-step to implement JTBD integration**
