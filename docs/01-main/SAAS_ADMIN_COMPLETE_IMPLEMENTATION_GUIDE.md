# SaaS Admin Onboarding Module - Complete Implementation Guide
**Date:** January 26, 2026  
**Status:** 📦 **Complete Package Ready**

---

## 🎯 Executive Summary

This document provides a **complete implementation package** for the onboarding module in SaaS Admin service. All onboarding functionality has been removed from CS-Support and needs to be recreated in SaaS Admin.

**What Was Removed from CS-Support:**
- 2 service files (~52KB of code)
- 12 API endpoints
- 1 webhook endpoint
- Dashboard service (replaced with post-onboarding version)

**What SaaS Admin Needs:**
- Complete service implementations (4 files)
- Complete API endpoint implementations (12+ files)
- Database schema (already exists)
- UI components (to be created)

---

## 📦 Complete File Package

### 1. Database Schema ✅
**File:** `database/migrations/SAAS_ADMIN_ONBOARDING_SCHEMA.sql`
- **Status:** ✅ Complete and ready
- **Action:** Apply to SaaS Admin database
- **Tables:** All onboarding tables (9 tables total)

### 2. Services (4 files needed)

#### A. Onboarding Sequences Service
**File:** `lib/services/onboarding-sequences.ts`
- **Size:** ~30KB (based on removed file)
- **Purpose:** Sequence management, milestone tracking, stage progression
- **Key Methods:**
  - `startOnboarding()` - Start onboarding with template key or sequence ID
  - `completeMilestone()` - Mark milestone complete (webhook/manual/API)
  - `getSequenceByTemplateKey()` - Get sequence by template key
  - `getProgress()` - Get customer onboarding progress
  - `parseSequence()` - Parse sequence JSON structure
  - `triggerCommunication()` - Trigger communications at milestones

#### B. Law Firm Onboarding Service
**File:** `lib/services/law-firm-onboarding.ts`
- **Size:** ~21KB (based on removed file)
- **Purpose:** Law firm onboarding workflow (Phases 1-4, Steps 1-5)
- **Key Methods:**
  - `completeStep1()` - Firm & Team Profile (0-25%)
  - `completeStep2()` - Phone Number Setup (25-40%)
  - `completeStep3()` - Calendar & Email Integration (40-60%)
  - `completeStep4()` - Compliance & Data Settings (60-80%)
  - `completeStep5()` - Review & Submit (80-100%)
  - `updateInternalStatus()` - Update internal configuration status
  - `getProgress()` - Get law firm onboarding progress
  - `transferToCSSupport()` - Transfer customer after go-live

#### C. Onboarding Dashboard Service
**File:** `lib/services/onboarding-dashboard.ts`
- **Purpose:** Dashboard data for Client Onboarding Managers
- **Key Methods:**
  - `getDashboardData()` - Get complete dashboard data
  - `getCustomerDetails()` - Get individual customer details
- **Data Sources:**
  - `cs_customer_onboarding_progress` - Main progress tracking
  - `cs_onboarding_sequences` - Sequence templates
  - `cs_onboarding_milestone_completions` - Milestone completions
  - `cs_onboarding_communications` - Communication history

#### D. Onboarding Communication Service
**File:** `lib/services/onboarding-communication.ts`
- **Purpose:** Communication tracking during onboarding
- **Key Methods:**
  - `logEmail()` - Log email communication
  - `logSMS()` - Log SMS communication
  - `logCall()` - Log call communication
  - `getCommunicationHistory()` - Get communication history
- **Note:** Uses `cs_onboarding_communications` table (exists in SaaS Admin)

### 3. API Endpoints (12+ files needed)

#### Onboarding Management
1. `app/api/v1/onboarding/start/route.ts` - Start onboarding sequence
2. `app/api/v1/onboarding/progress/route.ts` - Get onboarding progress
3. `app/api/v1/onboarding/milestone/complete/route.ts` - Complete milestone

#### Law Firm Onboarding Steps
4. `app/api/v1/onboarding/law-firm/step-1/route.ts` - Firm profile
5. `app/api/v1/onboarding/law-firm/step-2/route.ts` - Phone config
6. `app/api/v1/onboarding/law-firm/step-3/route.ts` - Calendar integration
7. `app/api/v1/onboarding/law-firm/step-4/route.ts` - Compliance settings
8. `app/api/v1/onboarding/law-firm/step-5/route.ts` - Review & submit
9. `app/api/v1/onboarding/law-firm/internal-status/route.ts` - Update internal status
10. `app/api/v1/onboarding/law-firm/progress/route.ts` - Get law firm progress

#### Sequence Templates
11. `app/api/v1/onboarding/sequences/templates/route.ts` - List templates
12. `app/api/v1/onboarding/sequences/template/[templateKey]/route.ts` - Get template

#### Webhooks
13. `app/api/v1/webhooks/platform/milestone/route.ts` - Platform milestone webhook

#### Dashboard
14. `app/api/v1/dashboard/onboarding/route.ts` - Onboarding manager dashboard

---

## 📝 Implementation Details

### Service Implementation Patterns

All services should follow these patterns:

1. **Database Access:**
   ```typescript
   import { createServerSupabase } from '@/lib/db/supabase'
   const supabase = createServerSupabase()
   ```

2. **Authentication:**
   ```typescript
   // Check for client_onboarding_manager role
   const hasAccess = await hasAnyRole(['client_onboarding_manager', 'admin'])
   ```

3. **Error Handling:**
   ```typescript
   try {
     // Service logic
   } catch (error) {
     throw new Error(`Failed to ${action}: ${error.message}`)
   }
   ```

4. **Communication Tracking:**
   ```typescript
   // Use cs_onboarding_communications table
   await supabase.from('cs_onboarding_communications').insert({
     onboarding_progress_id: progressId,
     communication_type: 'email',
     // ... other fields
   })
   ```

### API Endpoint Patterns

All endpoints should follow these patterns:

1. **Authentication:**
   ```typescript
   return withTeamMember(async (req, context) => {
     // Endpoint logic
   })(req)
   ```

2. **Role Check:**
   ```typescript
   const hasAccess = await hasAnyRole(['client_onboarding_manager'])
   if (!hasAccess) {
     return errorResponse('Access denied', 403)
   }
   ```

3. **Validation:**
   ```typescript
   const validation = await validateBody(req, schema)
   if (!validation.success) {
     return validation.response
   }
   ```

4. **Response:**
   ```typescript
   return successResponse(data)
   // or
   return errorResponse(message, statusCode)
   ```

---

## 🔗 CS-Support Integration

### Transfer Customer After Go-Live

**When to Transfer:**
- Customer accepts go-live
- `internal_status = 'onboarding_complete'`
- `onboarding_phase = 'completed'`

**Implementation:**
```typescript
// In law-firm-onboarding.ts after step 5 or internal status update
if (internalStatus === 'onboarding_complete' && onboardingPhase === 'completed') {
  const transferResult = await fetch('https://cs-support-service/api/v1/customers/transfer', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CS_SUPPORT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer_id: progress.progress_id,
      tenant_id: progress.tenant_id,
      customer_email: progress.customer_email,
      go_live_date: progress.go_live_date,
      onboarding_completed_at: progress.completed_at,
      assigned_csm_id: progress.assigned_csm_id,
      notes: 'Customer accepted go-live',
      metadata: {
        onboarding_progress_id: progress.progress_id,
        onboarding_phase: progress.onboarding_phase,
      },
    }),
  })

  if (transferResult.ok) {
    // Update transfer status
    await supabase
      .from('cs_customer_onboarding_progress')
      .update({
        transfer_status: 'completed',
        transferred_to_cs_support_at: new Date().toISOString(),
      })
      .eq('progress_id', progress.progress_id)
  }
}
```

---

## 📋 Step-by-Step Implementation

### Step 1: Database Setup
1. Apply `SAAS_ADMIN_ONBOARDING_SCHEMA.sql` to SaaS Admin database
2. Run seed data: `seed_onboarding_sequence_templates.sql`
3. Set up RLS policies for `client_onboarding_manager` role
4. Verify all tables exist

### Step 2: Create Services
1. Create `lib/services/onboarding-sequences.ts`
2. Create `lib/services/law-firm-onboarding.ts`
3. Create `lib/services/onboarding-dashboard.ts`
4. Create `lib/services/onboarding-communication.ts`

### Step 3: Create API Endpoints
1. Create `app/api/v1/onboarding/` directory structure
2. Implement all 12 onboarding endpoints
3. Create webhook endpoint
4. Create dashboard endpoint

### Step 4: Set Up Authentication
1. Configure `client_onboarding_manager` role
2. Set up role-based access control
3. Add authentication middleware

### Step 5: Test Integration
1. Test CS-Support transfer API integration
2. Test webhook for platform milestones
3. Test end-to-end onboarding flow

---

## 📚 Reference Documentation

- **Law Firm Onboarding Flow:** `docs/setup/LAW_FIRM_ONBOARDING_FLOW.md`
- **Onboarding Sequence Mapping:** `docs/setup/ONBOARDING_SEQUENCE_MAPPING.md`
- **Database Schema:** `database/migrations/SAAS_ADMIN_ONBOARDING_SCHEMA.sql`
- **Seed Data:** `database/seed_onboarding_sequence_templates.sql`

---

## ⚠️ Important Notes

1. **Communication Tables:** Services use `cs_onboarding_communications` (not `cs_email_sends` like CS-Support)
2. **Role Name:** Use `client_onboarding_manager` (not `onboarding_specialist`)
3. **Transfer API:** Must call CS-Support transfer API after go-live
4. **Webhook:** Platform milestone webhook should be active in SaaS Admin (deprecated in CS-Support)

---

## 🎯 Success Criteria

Implementation is complete when:
- ✅ All 4 services are created and working
- ✅ All 12+ API endpoints are created and working
- ✅ Database schema is applied
- ✅ Authentication is configured
- ✅ CS-Support transfer integration works
- ✅ Webhook integration works
- ✅ UI components are created

---

**Last Updated:** January 26, 2026  
**Status:** 📦 **Complete Implementation Guide Ready**
