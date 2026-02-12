# Onboarding Code Removal Plan - CS-Support Service
**Date:** January 24, 2026  
**Status:** ⚠️ **Ready to Execute**

---

## 🎯 Objective

Remove all onboarding-related workflows, pages, and code from CS-Support service. Update remaining code to use `cs_customer_post_onboarding` table and existing communication tables for post-onboarding customer management.

---

## 📋 Files to Remove (Move to SaaS Admin)

### API Endpoints - Remove Entirely
**Location:** `app/api/v1/onboarding/`

- ❌ `start/route.ts` - Start onboarding
- ❌ `law-firm/step-1/route.ts` - Firm profile
- ❌ `law-firm/step-2/route.ts` - Phone config
- ❌ `law-firm/step-3/route.ts` - Calendar integration
- ❌ `law-firm/step-4/route.ts` - Compliance settings
- ❌ `law-firm/step-5/route.ts` - Review & submit
- ❌ `law-firm/internal-status/route.ts` - Update internal status
- ❌ `law-firm/progress/route.ts` - Get law firm progress
- ❌ `milestone/complete/route.ts` - Complete milestone
- ❌ `progress/route.ts` - Get onboarding progress
- ❌ `sequences/templates/route.ts` - List templates
- ❌ `sequences/template/[templateKey]/route.ts` - Get template

**Action:** Delete entire `app/api/v1/onboarding/` directory

---

### Services - Remove Entirely
- ❌ `lib/services/law-firm-onboarding.ts` - All law firm onboarding logic
- ❌ `lib/services/onboarding-sequences.ts` - Onboarding sequence management

**Action:** Delete these files

---

## 📋 Files to Update

### 1. Dashboard Service
**File:** `lib/services/onboarding-dashboard.ts`

**Current Issues:**
- Queries `cs_customer_onboarding_progress` (table dropped)
- Queries `cs_onboarding_sequences` (table dropped)
- Queries `cs_onboarding_milestone_completions` (table dropped)
- Queries `cs_onboarding_communications` (table dropped)

**Update To:**
- Query `cs_customer_post_onboarding` table instead
- Use `cs_email_sends`, `cs_sms_logs`, `cs_call_logs` for communication history
- Use `cs_customer_health_scores` for health scores
- Use `cs_customer_churn_risk` for churn risk

**New Data Structure:**
```typescript
interface PostOnboardingCustomer {
  customer_id: string
  tenant_id: string
  customer_email: string
  go_live_date: string
  onboarding_completed_at: string
  transferred_from_onboarding_at: string
  assigned_csm_id: string | null
  health_score: number | null
  churn_risk_level: 'low' | 'medium' | 'high' | 'critical' | null
  notes: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}
```

---

### 2. Communication Sender Service
**File:** `lib/services/communication-sender.ts`

**Current Issues:**
- Inserts into `cs_onboarding_communications` (table dropped)
- Uses `onboarding_progress_id` field

**Update To:**
- For post-onboarding communications, use:
  - `cs_email_sends` for emails
  - `cs_sms_logs` for SMS
  - `cs_call_logs` for calls
  - `cs_conversations` and `cs_messages` for unified messaging
- Remove `onboarding_progress_id` references
- Use `customer_id` from `cs_customer_post_onboarding` instead

---

### 3. Post-Onboarding Flows Service
**File:** `lib/services/post-onboarding-flows.ts`

**Current Issues:**
- Queries `cs_customer_onboarding_progress` (table dropped)
- Queries `cs_onboarding_communications` (table dropped)
- Uses `OnboardingDashboardService` (needs update)

**Update To:**
- Query `cs_customer_post_onboarding` instead
- Use communication tables (`cs_email_sends`, `cs_sms_logs`, etc.) instead of `cs_onboarding_communications`
- Update to use updated `CustomerSuccessDashboardService`

---

### 4. Dashboard Component
**File:** `components/cs-support/dashboard/OnboardingDashboard.tsx`

**Current Issues:**
- Uses `OnboardingCustomer` interface with `progress_id`, `sequence_id`, etc.
- References onboarding milestones and communications

**Update To:**
- Use `PostOnboardingCustomer` interface
- Remove references to milestones, sequences
- Focus on health scores, churn risk, go-live date
- Show communication history from `cs_email_sends`, `cs_sms_logs`, `cs_call_logs`

---

### 5. Dashboard API
**File:** `app/api/v1/dashboard/onboarding/route.ts`

**Current Issues:**
- Uses `CustomerSuccessDashboardService.getDashboardData()` which queries dropped tables

**Update To:**
- Update service first, then this will work automatically

---

### 6. Other Services Using `cs_onboarding_communications`

**Files to Update:**
- `lib/services/csat-nps-survey.ts` - Uses `cs_onboarding_communications` with `onboarding_progress_id: null`
- `lib/services/renewal-orchestration.ts` - Uses `cs_onboarding_communications` with `onboarding_progress_id: null`
- `lib/services/success-playbooks.ts` - Uses `cs_onboarding_communications` with `onboarding_progress_id: null`

**Update To:**
- Use `cs_email_sends`, `cs_sms_logs`, `cs_call_logs` instead
- Or create a generic `cs_customer_communications` table if needed

---

## 🔄 Communication Table Strategy

### Option 1: Use Existing Tables (Recommended)
- ✅ `cs_email_sends` - For email tracking
- ✅ `cs_sms_logs` - For SMS tracking
- ✅ `cs_call_logs` - For call tracking
- ✅ `cs_conversations` - For unified conversations
- ✅ `cs_messages` - For message tracking

**Pros:**
- Already exists
- No migration needed
- Unified with existing messaging system

**Cons:**
- Need to update all services to use these tables
- May need to link to `cs_customer_post_onboarding` via `customer_email`

---

### Option 2: Create Generic Customer Communications Table
Create `cs_customer_communications` table that:
- Links to `cs_customer_post_onboarding` via `customer_id`
- Tracks all customer communications (email, SMS, call)
- Replaces `cs_onboarding_communications` functionality

**Pros:**
- Single table for all customer communications
- Clear link to post-onboarding customers

**Cons:**
- Requires migration
- Duplicates functionality of existing tables

---

## ✅ Recommended Approach

**Use Option 1 (Existing Tables):**
- Update services to use `cs_email_sends`, `cs_sms_logs`, `cs_call_logs`
- Link via `customer_email` to `cs_customer_post_onboarding`
- Keep unified messaging system intact

---

## 📊 Implementation Steps

### Step 1: Update Dashboard Service
1. Rewrite `CustomerSuccessDashboardService.getDashboardData()` to use `cs_customer_post_onboarding`
2. Remove queries to dropped onboarding tables
3. Use health scoring and churn risk tables
4. Use communication tables for history

### Step 2: Update Communication Services
1. Update `CommunicationSenderService` to use `cs_email_sends`, `cs_sms_logs`, `cs_call_logs`
2. Remove `onboarding_progress_id` references
3. Link to `cs_customer_post_onboarding` via `customer_email`

### Step 3: Update Post-Onboarding Flows
1. Update `PostOnboardingFlowsService` to use `cs_customer_post_onboarding`
2. Update to use new communication tables

### Step 4: Update Dashboard Component
1. Update `OnboardingDashboard.tsx` to use new data structure
2. Remove onboarding-specific UI elements
3. Focus on post-onboarding metrics

### Step 5: Remove Onboarding APIs
1. Delete entire `app/api/v1/onboarding/` directory
2. Update any references in documentation

### Step 6: Remove Onboarding Services
1. Delete `lib/services/law-firm-onboarding.ts`
2. Delete `lib/services/onboarding-sequences.ts`
3. Update imports in other files

### Step 7: Update Other Services
1. Update `csat-nps-survey.ts` to use new communication tables
2. Update `renewal-orchestration.ts` to use new communication tables
3. Update `success-playbooks.ts` to use new communication tables

---

## ⚠️ Important Notes

1. **Communication History:** We're dropping `cs_onboarding_communications`, but post-onboarding services use it. Need to migrate to existing communication tables.

2. **Data Migration:** If there's existing data in `cs_onboarding_communications` with `onboarding_progress_id: null`, we may need to:
   - Export this data
   - Import into appropriate communication tables
   - Or keep a read-only view

3. **Customer Transfer:** Need to implement workflow that:
   - Creates `cs_customer_post_onboarding` record when customer is transferred
   - Links existing communications if needed

---

**Status:** ⚠️ **Ready to Execute - Awaiting Approval**
