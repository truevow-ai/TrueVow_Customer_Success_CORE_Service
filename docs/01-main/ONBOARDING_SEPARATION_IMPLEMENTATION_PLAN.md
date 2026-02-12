# Onboarding Separation Implementation Plan
**Date:** January 24, 2026  
**Status:** 🚀 **In Progress**  
**Objective:** Complete separation of onboarding workflows from CS-Support to SaaS Admin

---

## 🎯 Overview

This document outlines the phase-wise implementation plan to complete the separation of onboarding workflows from CS-Support service to SaaS Admin service, as per the architectural decision in `ONBOARDING_DATABASE_ARCHITECTURE.md`.

---

## 📋 Phase 1: Database Migration ✅

### Objective
Execute migration 032 to remove all onboarding tables from CS-Support and create the minimal post-onboarding tracking table.

### Tasks
- [x] Migration file `032_separate_onboarding_from_csm.sql` is ready
- [ ] Execute migration (drop onboarding tables, create `cs_customer_post_onboarding`)
- [ ] Verify RLS policies are correctly applied
- [ ] Test table creation and basic queries

### Files
- `database/migrations/032_separate_onboarding_from_csm.sql`

### Expected Outcome
- All `cs_onboarding_*` tables removed from CS-Support database
- `cs_customer_post_onboarding` table created with proper RLS policies
- No broken foreign key references

---

## 📋 Phase 2: Update Dashboard Service

### Objective
Refactor `onboarding-dashboard.ts` to use `cs_customer_post_onboarding` instead of old onboarding tables.

### Current Issues
- Queries `cs_customer_onboarding_progress` (dropped)
- Queries `cs_onboarding_sequences` (dropped)
- Queries `cs_onboarding_milestone_completions` (dropped)
- Queries `cs_onboarding_communications` (dropped)

### Tasks
- [ ] Update `getDashboardData()` to query `cs_customer_post_onboarding`
- [ ] Use `cs_email_sends`, `cs_sms_logs`, `cs_call_logs` for communication history
- [ ] Update interface types to match new data model
- [ ] Remove references to onboarding phases/milestones
- [ ] Update health score calculation to use existing health scoring service
- [ ] Update `getCustomerDetails()` method

### Files to Update
- `lib/services/onboarding-dashboard.ts` → Rename to `customer-success-dashboard.ts`

### New Data Sources
- `cs_customer_post_onboarding` - Main customer data
- `cs_email_sends` - Email communication history
- `cs_sms_logs` - SMS communication history
- `cs_call_logs` - Call communication history
- `cs_customer_health_scores` - Health score data (if exists)
- `cs_customer_churn_risk` - Churn risk data (if exists)

---

## 📋 Phase 3: Remove Onboarding API Endpoints

### Objective
Delete all onboarding-related API endpoints from CS-Support service.

### Endpoints to Remove
- [ ] `app/api/v1/onboarding/start/route.ts`
- [ ] `app/api/v1/onboarding/law-firm/step-1/route.ts`
- [ ] `app/api/v1/onboarding/law-firm/step-2/route.ts`
- [ ] `app/api/v1/onboarding/law-firm/step-3/route.ts`
- [ ] `app/api/v1/onboarding/law-firm/step-4/route.ts`
- [ ] `app/api/v1/onboarding/law-firm/step-5/route.ts`
- [ ] `app/api/v1/onboarding/law-firm/internal-status/route.ts`
- [ ] `app/api/v1/onboarding/law-firm/progress/route.ts`
- [ ] `app/api/v1/onboarding/milestone/complete/route.ts`
- [ ] `app/api/v1/onboarding/progress/route.ts`
- [ ] `app/api/v1/onboarding/sequences/templates/route.ts`
- [ ] `app/api/v1/onboarding/sequences/template/[templateKey]/route.ts`

### Endpoints to Update
- [ ] `app/api/v1/dashboard/onboarding/route.ts` → Update to use new dashboard service

### Action
Delete entire `app/api/v1/onboarding/` directory

---

## 📋 Phase 4: Remove Onboarding Services

### Objective
Delete onboarding service files that are no longer needed in CS-Support.

### Services to Remove
- [ ] `lib/services/law-firm-onboarding.ts` - Delete (move to SaaS Admin)
- [ ] `lib/services/onboarding-sequences.ts` - Delete (move to SaaS Admin)

### Action
Delete these files entirely (they will be recreated in SaaS Admin service)

---

## 📋 Phase 5: Update Communication Services

### Objective
Update services that reference `cs_onboarding_communications` to use the new communication tables.

### Services to Update
- [ ] `lib/services/communication-sender.ts` - Update to use `cs_email_sends`, `cs_sms_logs`, `cs_call_logs`
- [ ] `lib/services/post-onboarding-flows.ts` - Update to use new communication tables
- [ ] `lib/services/csat-nps-survey.ts` - Update communication logging
- [ ] `lib/services/renewal-orchestration.ts` - Update communication logging
- [ ] `lib/services/success-playbooks.ts` - Update communication logging

### Tasks
- [ ] Replace `cs_onboarding_communications` inserts with appropriate table (`cs_email_sends`, `cs_sms_logs`, `cs_call_logs`)
- [ ] Update queries to use new table structure
- [ ] Ensure communication history is preserved

---

## 📋 Phase 6: Update UI Components

### Objective
Update dashboard and related UI components to use the new data model.

### Components to Update
- [ ] `components/cs-support/dashboard/OnboardingDashboard.tsx` → Rename to `CustomerSuccessDashboard.tsx`
- [ ] Update component to use `PostOnboardingCustomer` interface
- [ ] Remove references to onboarding phases/milestones
- [ ] Update to show post-onboarding metrics only
- [ ] Fix syntax errors introduced by user reverts

### Pages to Update
- [ ] `app/(dashboard)/dashboard/page.tsx` - Update imports and component usage
- [ ] Fix syntax error (`Breadcrumbs =>`)

### Tasks
- [ ] Update component props and interfaces
- [ ] Update data fetching to use new dashboard service
- [ ] Update UI to reflect post-onboarding focus
- [ ] Remove onboarding-specific UI elements

---

## 📋 Phase 7: Implement Transfer Workflow

### Objective
Create API endpoint and service for customer transfer from SaaS Admin to CS-Support.

### New Endpoint
- [ ] `app/api/v1/customers/transfer/route.ts` - Handle customer transfer

### Service
- [ ] `lib/services/customer-transfer.ts` - Transfer logic

### Tasks
- [ ] Create transfer endpoint (called by SaaS Admin after go-live)
- [ ] Create `cs_customer_post_onboarding` record
- [ ] Assign Client Success Manager
- [ ] Set initial health score
- [ ] Log transfer event
- [ ] Return transfer confirmation

### Transfer Flow
```
SaaS Admin (after go-live acceptance)
  → POST /api/v1/customers/transfer
  → Create cs_customer_post_onboarding record
  → Assign CSM
  → Return success
```

---

## 📋 Phase 8: Verify and Test

### Objective
Verify all changes work correctly and no broken references remain.

### Verification Tasks
- [ ] Run database migration successfully
- [ ] Verify RLS policies work correctly
- [ ] Test dashboard loads with new data model
- [ ] Verify no broken imports or references
- [ ] Test customer transfer workflow
- [ ] Verify communication history displays correctly
- [ ] Check for any remaining references to old tables
- [ ] Run linter and fix any errors
- [ ] Test in development environment

### Files to Check
- [ ] Search for `cs_customer_onboarding_progress` references
- [ ] Search for `cs_onboarding_*` references
- [ ] Search for `onboarding_progress_id` references
- [ ] Verify all imports are updated

---

## 📊 Progress Tracking

### Phase 1: Database Migration
- Status: ⏳ In Progress
- Completion: 0%

### Phase 2: Update Dashboard Service
- Status: ⏸️ Pending
- Completion: 0%

### Phase 3: Remove Onboarding APIs
- Status: ⏸️ Pending
- Completion: 0%

### Phase 4: Remove Onboarding Services
- Status: ⏸️ Pending
- Completion: 0%

### Phase 5: Update Communication Services
- Status: ⏸️ Pending
- Completion: 0%

### Phase 6: Update UI Components
- Status: ⏸️ Pending
- Completion: 0%

### Phase 7: Implement Transfer Workflow
- Status: ⏸️ Pending
- Completion: 0%

### Phase 8: Verify and Test
- Status: ⏸️ Pending
- Completion: 0%

---

## 🚀 Execution Order

1. **Phase 1** - Database migration (foundation)
2. **Phase 2** - Update dashboard service (core functionality)
3. **Phase 3** - Remove onboarding APIs (cleanup)
4. **Phase 4** - Remove onboarding services (cleanup)
5. **Phase 5** - Update communication services (data consistency)
6. **Phase 6** - Update UI components (user-facing)
7. **Phase 7** - Implement transfer workflow (integration)
8. **Phase 8** - Verify and test (quality assurance)

---

## 📝 Notes

- All onboarding workflows will be handled in SaaS Admin service
- CS-Support only manages post-onboarding customers
- Transfer happens automatically after go-live acceptance
- Communication history uses existing tables (`cs_email_sends`, `cs_sms_logs`, `cs_call_logs`)
- Health scores and churn risk are calculated post-onboarding

---

**Last Updated:** January 24, 2026  
**Next Review:** After Phase 1 completion
