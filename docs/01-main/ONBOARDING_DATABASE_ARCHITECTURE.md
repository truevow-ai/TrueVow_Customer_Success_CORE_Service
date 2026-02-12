# Onboarding Database Architecture - Final Decision
**Date:** January 24, 2026  
**Status:** ✅ **Decision Made - Option 2: Move to SaaS Admin**

---

## 🎯 Final Architecture Decision

**All onboarding tables are moved to SaaS Admin database.**

### Rationale

1. **CS-Support has LLM attached** - SaaS Admin is kept separate (no LLM intrusion)
2. **Client Onboarding Manager works entirely in SaaS Admin** to:
   - Enrich contact management database with customer profile and law firm details
   - Configure phone numbers and intake questions/answers
   - Configure law firm calendars and email accounts
   - Add law firm users and train on customer portal
3. **After go-live acceptance** - Internal customer transfer is triggered
4. **Client Success Manager and support team** handle law firm customer from CS-Support onwards
5. **No reason to keep onboarding data in CS-Support** - All onboarding happens pre-go-live in SaaS Admin

---

## 📊 Database Separation

### SaaS Admin Database (Onboarding)

**All onboarding tables live here:**
- `cs_customer_onboarding_progress` - Main onboarding tracking
- `cs_onboarding_sequences` - Sequence templates
- `cs_onboarding_milestones` - Milestone definitions
- `cs_onboarding_communications` - Communication history
- `cs_onboarding_milestone_completions` - Milestone completions
- `cs_onboarding_firm_profile` - Firm and team profile
- `cs_onboarding_phone_config` - Phone configuration
- `cs_onboarding_calendar_integrations` - Calendar/email integrations
- `cs_onboarding_compliance_settings` - Compliance settings
- `cs_onboarding_step_completions` - Step completion tracking

**Schema File:** `database/migrations/SAAS_ADMIN_ONBOARDING_SCHEMA.sql`

---

### CS-Support Database (Post-Onboarding Only)

**Onboarding tables removed:**
- ❌ All `cs_onboarding_*` tables dropped
- ❌ `cs_customer_onboarding_progress` dropped

**New minimal table for post-onboarding:**
- ✅ `cs_customer_post_onboarding` - Minimal tracking after go-live
  - Go-live date
  - Transfer information
  - Assigned Client Success Manager
  - Health score and churn risk
  - Post-onboarding metadata

**Migration File:** `database/migrations/032_separate_onboarding_from_csm.sql`

---

## 🔄 Workflow

### 1. Onboarding Phase (SaaS Admin)

```
Sales Ops Service → Client Onboarding Manager (SaaS Admin)
  ├─ Approve Application
  ├─ Enrich Contact Management Database
  ├─ Configure Phone Numbers & Intake Q&A
  ├─ Configure Calendars & Email Accounts
  ├─ Add Law Firm Users
  ├─ Training on Customer Portal
  ├─ Testing
  └─ Go-Live Preparation
```

**All data stored in SaaS Admin database.**

---

### 2. Go-Live & Transfer

```
Customer Accepts Go-Live → Internal Transfer Triggered
  ├─ Customer marked as "onboarding_complete" in SaaS Admin
  ├─ Transfer record created in SaaS Admin
  ├─ Customer record created in CS-Support (cs_customer_post_onboarding)
  └─ Assigned to Client Success Manager
```

---

### 3. Post-Onboarding Phase (CS-Support)

```
Client Success Manager (CS-Support)
  ├─ Manage Customer Health
  ├─ Track Success Metrics
  ├─ Monitor At-Risk Customers
  ├─ Handle Support Tickets
  └─ Post-Onboarding Management
```

**All data stored in CS-Support database (post-onboarding only).**

---

## 📋 Migration Files

### CS-Support Migration (032)

**File:** `database/migrations/032_separate_onboarding_from_csm.sql`

**What it does:**
1. ✅ Drops all onboarding tables from CS-Support
2. ✅ Creates minimal `cs_customer_post_onboarding` table
3. ✅ Removes all onboarding-related RLS policies

---

### SaaS Admin Schema

**File:** `database/migrations/SAAS_ADMIN_ONBOARDING_SCHEMA.sql`

**What it does:**
1. ✅ Creates all onboarding tables in SaaS Admin database
2. ✅ Includes all indexes and triggers
3. ✅ Ready for RLS policies (to be added based on SaaS Admin auth)

---

## ✅ Benefits

1. **Clear Separation:**
   - Onboarding = SaaS Admin (no LLM)
   - Post-Onboarding = CS-Support (with LLM)

2. **Security:**
   - Onboarding data isolated from LLM systems
   - Client Onboarding Manager works in secure environment

3. **Workflow Clarity:**
   - Clear handoff point (go-live acceptance)
   - No confusion about where data lives

4. **Performance:**
   - Each service only has relevant data
   - No cross-database queries needed

---

## 🚀 Next Steps

1. ✅ **CS-Support Migration 032** - Ready to execute (drops onboarding tables)
2. ✅ **SaaS Admin Schema** - Ready to apply (creates all onboarding tables)
3. ⏳ **Data Migration** - If existing data exists, migrate from CS-Support to SaaS Admin
4. ⏳ **API Updates** - Update onboarding APIs to point to SaaS Admin database
5. ⏳ **Transfer Workflow** - Implement customer transfer from SaaS Admin to CS-Support

---

**Status:** ✅ **Architecture Complete - Ready for Implementation**
