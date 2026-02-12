# Onboarding Seed File Migration
**Date:** January 24, 2026  
**Status:** ✅ **Updated**

---

## 📋 Seed File Status

### File: `database/seed_onboarding_sequence_templates.sql`

**Status:** ✅ **Updated for SaaS Admin**

**Changes Made:**
- ✅ Updated comments to reflect SaaS Admin usage
- ✅ Changed references from "CSM" to "Client Onboarding Manager"
- ✅ Added note that this should be applied to SaaS Admin database
- ✅ Updated table comment to reflect SaaS Admin context

**Location:** 
- Currently in CS-Support repository (for reference)
- Should be copied to SaaS Admin repository when onboarding is implemented there

---

## 🎯 What This Seed File Does

**Inserts 3 onboarding sequence templates:**

1. **`law_firm_pre_onboarding`**
   - Pre-onboarding preparation (3 days)
   - Client Onboarding Manager sends preparation email

2. **`law_firm_onboarding_call`**
   - Onboarding call and configuration (1 day)
   - Client Onboarding Manager guides customer through setup

3. **`law_firm_post_onboarding_90_days`**
   - Post-onboarding support (90 days)
   - Note: This is handled in CS-Support after customer transfer

---

## 📊 Database Location

**SaaS Admin Database:**
- ✅ `cs_onboarding_sequences` table (created by `SAAS_ADMIN_ONBOARDING_SCHEMA.sql`)
- ✅ Seed file should be applied to SaaS Admin database

**CS-Support Database:**
- ❌ `cs_onboarding_sequences` table removed (dropped in migration 032)
- ❌ Seed file no longer applies to CS-Support

---

## ✅ Next Steps

1. ✅ **Seed file updated** - Ready for SaaS Admin
2. ⏳ **Copy to SaaS Admin** - When SaaS Admin repository is set up
3. ⏳ **Apply to SaaS Admin database** - Run seed file after schema is created

---

**Status:** ✅ **Seed File Updated - Ready for SaaS Admin**
