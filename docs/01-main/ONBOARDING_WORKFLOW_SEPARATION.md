# Onboarding Workflow Separation - Implementation Complete
**Date:** January 24, 2026  
**Service:** CS-Support Service  
**Status:** ✅ **Complete**

---

## 🎯 Executive Summary

Successfully separated onboarding workflows from Client Success Manager (CSM) responsibilities. CSMs now focus exclusively on **post-onboarding customer management** (after customers have signed off on going live). Onboarding workflows are restricted to `client_onboarding_manager` role and will be handled in the SaaS Admin service.

**Workflow:**
1. **Sales Ops Service** → hands over lead to **Client Onboarding Manager**
2. **Client Onboarding Manager** → approves application, manages onboarding workflow, testing, go-live
3. **After go-live** → **Client Onboarding Manager** hands over to **Client Success Manager** (CSM)

---

## 📋 Changes Made

### 1. New Role Created ✅

**Role:** `client_onboarding_manager`
- **Display Name:** "Client Onboarding Manager"
- **Purpose:** Handles all onboarding workflows in SaaS Admin service
- **Access:** Can create/manage onboarding records
- **Location:** SaaS Admin service (not CS-Support)

**Role Hierarchy:**
- `client_onboarding_manager` = 2.5 (separate track from CSM)
- `csm` = 3 (manages post-onboarding only, display: "Client Success Manager")

---

### 2. Client Success Manager (CSM) Role Restrictions ✅

**Client Success Manager Permissions Updated:**
- ❌ **CANNOT** create onboarding records
- ❌ **CANNOT** start onboarding workflows
- ❌ **CANNOT** create firm profiles, phone configs, calendar integrations, compliance settings
- ✅ **CAN** view onboarding data (read-only)
- ✅ **CAN** update onboarding progress (for post-onboarding management)
- ✅ **CAN** manage customers post-onboarding (after signoff for going live)

---

### 3. Dashboard Refactored ✅

**Renamed:**
- `OnboardingDashboard` → `CustomerSuccessDashboard`
- `OnboardingDashboardService` → `CustomerSuccessDashboardService`
- API: `/api/v1/dashboard/onboarding` → Focuses on post-onboarding customers

**Dashboard Now Shows:**
- ✅ Only POST-ONBOARDING customers:
  - `onboarding_phase = 'phase_3_go_live'` (going live)
  - `onboarding_phase = 'phase_4_success_call'` (post-onboarding)
  - `onboarding_phase = 'completed'` (fully completed)
  - `internal_status = 'onboarding_complete'` (signed off on going live)
  - `completed_at IS NOT NULL` (onboarding completed)

**Removed:**
- ❌ Active onboarding customers (in-progress)
- ❌ Onboarding creation/management UI
- ❌ Pre-onboarding workflows

---

### 4. API Endpoints Restricted ✅

**Onboarding Creation Endpoints (Restricted to `client_onboarding_manager`):**
- ✅ `POST /api/v1/onboarding/start` - Start onboarding
- ✅ `POST /api/v1/onboarding/law-firm/step-1` - Firm profile
- ✅ `POST /api/v1/onboarding/law-firm/step-2` - Phone config
- ✅ `POST /api/v1/onboarding/law-firm/step-3` - Calendar integration
- ✅ `POST /api/v1/onboarding/law-firm/step-4` - Compliance settings
- ✅ `POST /api/v1/onboarding/law-firm/step-5` - Review & submit
- ✅ `POST /api/v1/onboarding/law-firm/internal-status` - Update internal status

**CSM Dashboard Endpoint:**
- ✅ `GET /api/v1/dashboard/onboarding` - Post-onboarding customers only (CSM access)

**Read-Only Endpoints (CSM Can Access):**
- ✅ `GET /api/v1/onboarding/progress` - View onboarding progress
- ✅ `GET /api/v1/onboarding/law-firm/progress` - View law firm onboarding progress

---

### 5. RLS Policies Updated ✅

**Database Migration:** `032_separate_onboarding_from_csm.sql`

**New Policies:**
- ✅ `is_client_onboarding_manager()` - Helper function
- ✅ `client_onboarding_manager_can_create_onboarding` - Only Client Onboarding Managers can create
- ✅ `client_onboarding_manager_can_create_firm_profile` - Only Client Onboarding Managers can create
- ✅ `client_onboarding_manager_can_create_phone_config` - Only Client Onboarding Managers can create
- ✅ `client_onboarding_manager_can_create_calendar_integrations` - Only Client Onboarding Managers can create
- ✅ `client_onboarding_manager_can_create_compliance_settings` - Only Client Onboarding Managers can create
- ✅ `client_onboarding_manager_can_create_step_completions` - Only Client Onboarding Managers can create

**CSM Access (Read-Only):**
- ✅ `csm_can_view_onboarding` - CSM can view onboarding progress
- ✅ `csm_can_view_firm_profile` - CSM can view firm profiles
- ✅ `csm_can_view_phone_config` - CSM can view phone configs
- ✅ `csm_can_view_calendar_integrations` - CSM can view calendar integrations
- ✅ `csm_can_view_compliance_settings` - CSM can view compliance settings
- ✅ `csm_can_view_step_completions` - CSM can view step completions

**CSM Update Access:**
- ✅ `csm_can_update_onboarding` - CSM can update onboarding progress (for post-onboarding management)

---

## 🔄 Workflow Separation

### Before (Old Workflow)
```
Sales CRM → CSM (in CS-Support) → Onboarding → Post-Onboarding Management
```

### After (New Workflow)
```
Sales Ops Service → Client Onboarding Manager (in SaaS Admin) → 
  ├─ Approve Application
  ├─ Onboarding Workflow
  ├─ Testing
  └─ Go-Live
  
After Go-Live → Client Success Manager (in CS-Support) → 
  └─ Post-Onboarding Management
```

---

## 📊 Role Responsibilities

### Client Onboarding Manager (SaaS Admin Service)
**Responsibilities:**
- ✅ Receive handoff from Sales Ops Service after intake service registration
- ✅ Approve law firm application
- ✅ Create onboarding records
- ✅ Manage onboarding workflows (Steps 1-5)
- ✅ Conduct testing
- ✅ Manage go-live process
- ✅ Update internal status (Phase 2-4)
- ✅ Complete onboarding and hand over to Client Success Manager

**Access:**
- ✅ Full access to onboarding creation/management
- ✅ Can create all onboarding-related records
- ✅ Handles onboarding in SaaS Admin service

---

### Client Success Manager (CS-Support Service)
**Responsibilities:**
- ✅ Receive handoff from Client Onboarding Manager after go-live
- ✅ Manage customers POST-onboarding (after signoff for going live)
- ✅ Track customer health scores
- ✅ Monitor at-risk customers
- ✅ Manage customer success metrics
- ✅ Handle post-onboarding communications
- ✅ Track customer milestones and engagement

**Access:**
- ✅ Read-only access to onboarding data (for context)
- ✅ Can update onboarding progress (for post-onboarding management)
- ✅ Full access to customer success metrics
- ✅ Full access to post-onboarding customer management

**Restrictions:**
- ❌ Cannot create onboarding records
- ❌ Cannot start onboarding workflows
- ❌ Cannot create firm profiles, phone configs, etc.

---

## 📄 Files Updated

### Role & Permissions
- ✅ `lib/utils/roles.ts` - Added `onboarding_specialist` role
- ✅ `lib/services/user-mapping.ts` - Updated CSM permissions, added onboarding_specialist permissions

### Dashboard
- ✅ `components/cs-support/dashboard/OnboardingDashboard.tsx` → `CustomerSuccessDashboard`
- ✅ `lib/services/onboarding-dashboard.ts` → `CustomerSuccessDashboardService`
- ✅ `app/(dashboard)/dashboard/page.tsx` - Updated to reflect post-onboarding focus
- ✅ `app/api/v1/dashboard/onboarding/route.ts` - Restricted to CSM, filters post-onboarding only

### API Endpoints
- ✅ `app/api/v1/onboarding/start/route.ts` - Restricted to onboarding_specialist
- ✅ `app/api/v1/onboarding/law-firm/step-1/route.ts` - Restricted to onboarding_specialist
- ✅ `app/api/v1/onboarding/law-firm/step-2/route.ts` - Restricted to onboarding_specialist
- ✅ `app/api/v1/onboarding/law-firm/step-3/route.ts` - Restricted to onboarding_specialist
- ✅ `app/api/v1/onboarding/law-firm/step-4/route.ts` - Restricted to onboarding_specialist
- ✅ `app/api/v1/onboarding/law-firm/step-5/route.ts` - Restricted to onboarding_specialist
- ✅ `app/api/v1/onboarding/law-firm/internal-status/route.ts` - Restricted to onboarding_specialist

### Database
- ✅ `database/migrations/032_separate_onboarding_from_csm.sql` - New RLS policies

---

## ✅ Verification Checklist

### Role & Permissions
- [x] New role `client_onboarding_manager` created
- [x] Client Success Manager permissions updated (cannot create onboarding)
- [x] Role hierarchy updated
- [x] Permission checks added to user-mapping service

### Dashboard
- [x] Dashboard renamed to CustomerSuccessDashboard
- [x] Dashboard filters only post-onboarding customers
- [x] Dashboard service renamed and updated
- [x] Dashboard API restricted to CSM role
- [x] UI text updated to reflect post-onboarding focus

### API Endpoints
- [x] All onboarding creation endpoints restricted to onboarding_specialist
- [x] Error messages updated to explain access restrictions
- [x] Read-only endpoints remain accessible to CSM

### Database
- [x] RLS policies updated to restrict CSM from creating onboarding
- [x] Helper function `is_onboarding_specialist()` created
- [x] CSM can still view onboarding data (read-only)
- [x] CSM can still update onboarding progress (for post-onboarding)

---

## 🎯 Next Steps (For SaaS Admin Service)

The following onboarding workflows should be **moved to SaaS Admin service**:

1. **Onboarding UI Pages:**
   - Onboarding form (Steps 1-5)
   - Onboarding progress tracking
   - Internal status management

2. **Onboarding API Endpoints:**
   - All `POST /api/v1/onboarding/*` endpoints
   - These should be accessible only from SaaS Admin service

3. **Client Onboarding Manager Dashboard:**
   - Create new dashboard in SaaS Admin for Client Onboarding Managers
   - Show active onboarding customers
   - Track onboarding progress and milestones
   - Application approval workflow

---

## 📝 Notes

1. **Client Success Manager Dashboard** remains in CS-Support but now focuses on post-onboarding management
2. **Onboarding workflows** will be moved to SaaS Admin service (not yet done)
3. **Client Success Manager access** to onboarding data is read-only (for context on their customers)
4. **Security:** Onboarding creation is now restricted to `client_onboarding_manager` role only
5. **Workflow:** Sales Ops → Client Onboarding Manager (SaaS Admin) → Client Success Manager (CS-Support)

---

**Last Updated:** January 24, 2026  
**Status:** ✅ **Complete - Ready for SaaS Admin Integration**
