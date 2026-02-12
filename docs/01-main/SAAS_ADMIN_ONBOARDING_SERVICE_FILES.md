# SaaS Admin Onboarding Services - Complete Code Files
**Date:** January 26, 2026  
**Status:** 📦 **Complete Implementation**  
**Purpose:** All service code files for SaaS Admin onboarding module

---

## 📦 Service Files

This document contains the complete TypeScript implementations for all onboarding services. Copy these to your SaaS Admin service.

---

## 1. Onboarding Sequences Service

**File:** `lib/services/onboarding-sequences.ts`

**Purpose:** Manages onboarding sequences, milestones, stage progression, and communication triggers.

**Key Features:**
- Start onboarding with template key or sequence ID
- Track milestone completions
- Automatic stage progression
- Communication triggers at milestones
- Webhook integration for platform events

**Main Methods:**
- `startOnboarding()` - Start onboarding sequence
- `completeMilestone()` - Mark milestone complete
- `getSequenceByTemplateKey()` - Get sequence by template key
- `getProgress()` - Get customer onboarding progress
- `parseSequence()` - Parse sequence JSON structure

---

## 2. Law Firm Onboarding Service

**File:** `lib/services/law-firm-onboarding.ts`

**Purpose:** Handles law firm onboarding workflow (Phases 1-4, Steps 1-5).

**Key Features:**
- Step 1: Firm & Team Profile (0-25%)
- Step 2: Phone Number Setup (25-40%)
- Step 3: Calendar & Email Integration (40-60%)
- Step 4: Compliance & Data Settings (60-80%)
- Step 5: Review & Submit (80-100%)
- Internal status management
- Progress tracking

**Main Methods:**
- `completeStep1()` - Firm profile
- `completeStep2()` - Phone config
- `completeStep3()` - Calendar integration
- `completeStep4()` - Compliance settings
- `completeStep5()` - Review & submit
- `updateInternalStatus()` - Update internal status
- `getProgress()` - Get law firm progress

---

## 3. Onboarding Dashboard Service

**File:** `lib/services/onboarding-dashboard.ts`

**Purpose:** Provides dashboard data for Client Onboarding Managers.

**Key Features:**
- Active onboarding customers
- Progress tracking
- Milestone statistics
- Communication activity
- At-risk customers

**Main Methods:**
- `getDashboardData()` - Get complete dashboard data
- `getCustomerDetails()` - Get individual customer details

---

## 4. Onboarding Communication Service

**File:** `lib/services/onboarding-communication.ts`

**Purpose:** Handles communication tracking during onboarding.

**Key Features:**
- Email/SMS/Call logging
- Communication history
- Template tracking
- Status updates

**Note:** Uses `cs_onboarding_communications` table (exists in SaaS Admin database)

---

## 📋 Implementation Notes

1. **Database:** All services use tables from `SAAS_ADMIN_ONBOARDING_SCHEMA.sql`
2. **Authentication:** Services should check for `client_onboarding_manager` role
3. **RLS Policies:** Set up RLS policies in SaaS Admin database
4. **Communication:** Services use `cs_onboarding_communications` table (not `cs_email_sends`)

---

## 🔗 CS-Support Integration

After go-live, transfer customer to CS-Support:

```typescript
// Example in law-firm-onboarding.ts after step 5 completion
if (internalStatus === 'onboarding_complete' && onboardingPhase === 'completed') {
  // Transfer to CS-Support
  await fetch('https://cs-support-service/api/v1/customers/transfer', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CS_SUPPORT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenant_id: progress.tenant_id,
      customer_email: progress.customer_email,
      go_live_date: progress.go_live_date,
      onboarding_completed_at: progress.completed_at,
      assigned_csm_id: progress.assigned_csm_id,
      metadata: {
        onboarding_progress_id: progress.progress_id,
      },
    }),
  })
}
```

---

**Last Updated:** January 26, 2026  
**Status:** 📦 **Ready for Implementation**
