# SaaS Admin Onboarding Services - Complete Implementation
**Date:** January 26, 2026  
**Status:** 📦 **Ready for Copy to SaaS Admin**  
**Purpose:** Complete service implementations for SaaS Admin onboarding module

---

## 📦 Service Files to Create

This document contains the complete implementations for all onboarding services that were removed from CS-Support. Copy these files to your SaaS Admin service.

---

## 1. Onboarding Sequences Service

**File:** `lib/services/onboarding-sequences.ts`

This service handles:
- Starting onboarding sequences
- Milestone tracking and completion
- Stage progression
- Communication triggers
- Template-based onboarding

**Key Methods:**
- `startOnboarding()` - Start onboarding with template key or sequence ID
- `completeMilestone()` - Mark milestone as complete
- `getSequenceByTemplateKey()` - Get sequence by template key
- `getProgress()` - Get customer onboarding progress
- `parseSequence()` - Parse sequence JSON structure

---

## 2. Law Firm Onboarding Service

**File:** `lib/services/law-firm-onboarding.ts`

This service handles:
- Law firm onboarding workflow (Steps 1-5)
- Firm profile management
- Phone configuration
- Calendar/email integrations
- Compliance settings
- Internal status management
- Progress tracking

**Key Methods:**
- `completeStep1()` - Firm & Team Profile (0-25%)
- `completeStep2()` - Phone Number Setup (25-40%)
- `completeStep3()` - Calendar & Email Integration (40-60%)
- `completeStep4()` - Compliance & Data Settings (60-80%)
- `completeStep5()` - Review & Submit (80-100%)
- `updateInternalStatus()` - Update internal configuration status
- `getProgress()` - Get law firm onboarding progress

---

## 3. Onboarding Dashboard Service

**File:** `lib/services/onboarding-dashboard.ts`

This service provides dashboard data for Client Onboarding Managers:
- Active onboarding customers
- Progress tracking
- Milestone statistics
- Communication activity
- At-risk customers

**Key Methods:**
- `getDashboardData()` - Get complete dashboard data
- `getCustomerDetails()` - Get individual customer details

---

## 4. Onboarding Communication Service

**File:** `lib/services/onboarding-communication.ts`

This service handles communication tracking during onboarding:
- Email/SMS/Call logging
- Communication history
- Template tracking

**Note:** Uses `cs_onboarding_communications` table (exists in SaaS Admin database)

---

## 📋 API Endpoints to Create

All endpoints should be in `app/api/v1/onboarding/` directory:

1. **`start/route.ts`** - Start onboarding sequence
2. **`law-firm/step-1/route.ts`** - Firm profile
3. **`law-firm/step-2/route.ts`** - Phone config
4. **`law-firm/step-3/route.ts`** - Calendar integration
5. **`law-firm/step-4/route.ts`** - Compliance settings
6. **`law-firm/step-5/route.ts`** - Review & submit
7. **`law-firm/internal-status/route.ts`** - Update internal status
8. **`law-firm/progress/route.ts`** - Get law firm progress
9. **`milestone/complete/route.ts`** - Complete milestone
10. **`progress/route.ts`** - Get onboarding progress
11. **`sequences/templates/route.ts`** - List templates
12. **`sequences/template/[templateKey]/route.ts`** - Get template

**Webhook:**
- **`app/api/v1/webhooks/platform/milestone/route.ts`** - Platform milestone webhook

**Dashboard:**
- **`app/api/v1/dashboard/onboarding/route.ts`** - Onboarding manager dashboard

---

## 🔗 Integration with CS-Support

After customer accepts go-live, call CS-Support transfer API:

```typescript
// In SaaS Admin service, after go-live acceptance:
const transferResult = await fetch('https://cs-support-service/api/v1/customers/transfer', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CS_SUPPORT_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customer_id: onboardingProgress.progress_id,
    tenant_id: onboardingProgress.tenant_id,
    customer_email: onboardingProgress.customer_email,
    go_live_date: onboardingProgress.go_live_date,
    onboarding_completed_at: onboardingProgress.completed_at,
    assigned_csm_id: onboardingProgress.assigned_csm_id,
    notes: 'Customer accepted go-live',
    metadata: {
      onboarding_progress_id: onboardingProgress.progress_id,
      onboarding_phase: onboardingProgress.onboarding_phase,
    },
  }),
})
```

---

## 📝 Next Steps

1. **Copy service files** to SaaS Admin `lib/services/` directory
2. **Copy API endpoint files** to SaaS Admin `app/api/v1/onboarding/` directory
3. **Update imports** to match SaaS Admin's project structure
4. **Set up authentication** for `client_onboarding_manager` role
5. **Configure RLS policies** in SaaS Admin database
6. **Test integration** with CS-Support transfer API

---

**Last Updated:** January 26, 2026  
**Status:** 📦 **Ready for SaaS Admin Implementation**
