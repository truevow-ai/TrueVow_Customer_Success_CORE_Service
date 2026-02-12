# Onboarding Code Cleanup Plan - CS-Support Service
**Date:** January 24, 2026  
**Status:** ⚠️ **In Progress**

---

## 🎯 Objective

Remove all onboarding-related workflows, pages, and code from CS-Support service since onboarding is now handled entirely in SaaS Admin. Update remaining code to use `cs_customer_post_onboarding` table for post-onboarding customer management.

---

## 📋 Code to Remove/Deprecate

### 1. API Endpoints to Remove (Move to SaaS Admin)

**Onboarding Creation Endpoints:**
- ❌ `app/api/v1/onboarding/start/route.ts` - Start onboarding
- ❌ `app/api/v1/onboarding/law-firm/step-1/route.ts` - Firm profile
- ❌ `app/api/v1/onboarding/law-firm/step-2/route.ts` - Phone config
- ❌ `app/api/v1/onboarding/law-firm/step-3/route.ts` - Calendar integration
- ❌ `app/api/v1/onboarding/law-firm/step-4/route.ts` - Compliance settings
- ❌ `app/api/v1/onboarding/law-firm/step-5/route.ts` - Review & submit
- ❌ `app/api/v1/onboarding/law-firm/internal-status/route.ts` - Update internal status
- ❌ `app/api/v1/onboarding/milestone/complete/route.ts` - Complete milestone
- ❌ `app/api/v1/onboarding/sequences/templates/route.ts` - List templates
- ❌ `app/api/v1/onboarding/sequences/template/[templateKey]/route.ts` - Get template

**Onboarding Progress Endpoints (Deprecate or Remove):**
- ⚠️ `app/api/v1/onboarding/progress/route.ts` - Get onboarding progress (may need for read-only)
- ⚠️ `app/api/v1/onboarding/law-firm/progress/route.ts` - Get law firm progress (may need for read-only)

**Webhooks:**
- ⚠️ `app/api/v1/webhooks/platform/milestone/route.ts` - Platform milestone webhook (may need to stay for SaaS Admin to call)

---

### 2. Services to Remove/Update

**Remove Entirely (Move to SaaS Admin):**
- ❌ `lib/services/law-firm-onboarding.ts` - All law firm onboarding logic
- ❌ `lib/services/onboarding-sequences.ts` - Onboarding sequence management

**Update to Use Post-Onboarding Table:**
- ✅ `lib/services/onboarding-dashboard.ts` → Update to use `cs_customer_post_onboarding`
- ⚠️ `lib/services/post-onboarding-flows.ts` - Check if it references onboarding tables
- ⚠️ `lib/services/communication-sender.ts` - Check if it uses `cs_onboarding_communications`

**Keep (Post-Onboarding Only):**
- ✅ `lib/services/health-scoring.ts` - Health scores for post-onboarding customers
- ✅ `lib/services/csat-nps-survey.ts` - Surveys for post-onboarding customers

---

### 3. Components to Update

**Update:**
- ✅ `components/cs-support/dashboard/OnboardingDashboard.tsx` → Update to use post-onboarding data
- ✅ `components/cs-support/dashboard/CustomerDetailModal.tsx` → Update to work with post-onboarding data

**Remove:**
- ❌ Any onboarding creation/management UI components (if they exist)

---

### 4. Dashboard API to Update

**Update:**
- ✅ `app/api/v1/dashboard/onboarding/route.ts` → Update to query `cs_customer_post_onboarding` instead of `cs_customer_onboarding_progress`

---

## 🔄 Migration Strategy

### Phase 1: Update Dashboard Service
1. Update `CustomerSuccessDashboardService` to use `cs_customer_post_onboarding` table
2. Remove references to `cs_onboarding_sequences`, `cs_onboarding_milestone_completions`, `cs_onboarding_communications`
3. Update data structure to match post-onboarding table schema

### Phase 2: Remove Onboarding APIs
1. Add deprecation notices to all onboarding creation endpoints
2. Return 410 Gone or 404 Not Found with message directing to SaaS Admin
3. Eventually remove the files

### Phase 3: Remove Onboarding Services
1. Remove `law-firm-onboarding.ts` service
2. Remove `onboarding-sequences.ts` service
3. Update any services that depend on these

### Phase 4: Update Communication Services
1. Check if `cs_onboarding_communications` is used for post-onboarding communications
2. If yes, keep table or create alternative
3. If no, remove references

---

## ⚠️ Important Notes

1. **Communication History:** `cs_onboarding_communications` table is being dropped. If we need communication history for post-onboarding customers, we may need to:
   - Keep a read-only view of communications from SaaS Admin
   - Or use a different communication tracking table in CS-Support

2. **Read-Only Access:** CS-Support may still need read-only access to onboarding data via API from SaaS Admin (for context on customers)

3. **Customer Transfer:** Need to implement customer transfer workflow from SaaS Admin to CS-Support that creates `cs_customer_post_onboarding` record

---

## 📊 Current State Analysis

**Files That Reference Onboarding Tables:**
- `lib/services/onboarding-dashboard.ts` - Uses `cs_customer_onboarding_progress`, `cs_onboarding_sequences`, `cs_onboarding_milestone_completions`, `cs_onboarding_communications`
- `lib/services/law-firm-onboarding.ts` - Uses all law firm onboarding tables
- `lib/services/onboarding-sequences.ts` - Uses `cs_customer_onboarding_progress`, `cs_onboarding_sequences`, `cs_onboarding_milestone_completions`, `cs_onboarding_communications`
- `lib/services/post-onboarding-flows.ts` - Uses `cs_customer_onboarding_progress`, `cs_onboarding_communications`
- `lib/services/communication-sender.ts` - Uses `cs_onboarding_communications`

---

**Status:** ⚠️ **Planning Phase - Ready to Execute**
