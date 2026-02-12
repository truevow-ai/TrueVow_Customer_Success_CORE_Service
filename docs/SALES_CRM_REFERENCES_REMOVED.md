# Sales CRM References Removed from CS-Support

**Date:** January 15, 2026  
**Status:** ✅ Complete

---

## Overview

Removed all sales CRM-related onboarding templates and references from the CS-Support service. These templates belong in the Sales CRM service, not CS-Support.

---

## Sales CRM Templates Removed

The following 5 sales CRM templates were removed from all CS-Support files:

1. ❌ `compliance_magnet_loop` - Compliance-focused sales sequence
2. ❌ `founder_authority_sprint` - Founder-led authority sales sequence
3. ❌ `outbound_precision_sprint` - Outbound sales sequence
4. ❌ `partner_influencer_push` - Partner/influencer sales sequence
5. ❌ `selective_paid_capture` - Paid acquisition sales sequence

**Reason:** These are sales CRM go-to-market playbooks, not customer support onboarding templates.

---

## Files Updated

### 1. Database & Seeding Files
- ✅ `database/seed_onboarding_sequence_templates.sql`
  - **Before:** 5 sales CRM templates
  - **After:** 3 CS-Support templates (`law_firm_pre_onboarding`, `law_firm_onboarding_call`, `law_firm_post_onboarding_90_days`)

- ✅ `scripts/seed-templates-auto.ts`
  - **Before:** 5 sales CRM templates
  - **After:** 3 CS-Support templates

- ✅ `database/migrations/020_add_template_key_to_onboarding_sequences.sql`
  - **Before:** Comment referenced sales CRM template examples
  - **After:** Comment references CS-Support template examples

### 2. Documentation Files
- ✅ `docs/ONBOARDING_TEMPLATES_IMPLEMENTATION_SUMMARY.md`
  - **Before:** Documented 5 sales CRM templates
  - **After:** Documents 3 CS-Support templates

- ✅ `docs/ONBOARDING_TEMPLATES_SEED_STATUS.md`
  - **Before:** Listed 5 sales CRM templates to seed
  - **After:** Lists 3 CS-Support templates to seed

- ✅ `docs/API_DOCUMENTATION_ONBOARDING_TEMPLATES.md`
  - **Before:** API examples used sales CRM template keys
  - **After:** API examples use CS-Support template keys

- ✅ `docs/setup/ONBOARDING_SEQUENCE_TEMPLATES.md`
  - **Before:** Documented 5 sales CRM templates
  - **After:** Documents 3 CS-Support templates

- ✅ `docs/setup/ONBOARDING_TEMPLATE_CONTENT_DESIGN.md`
  - **Status:** ❌ DELETED (entirely sales CRM-focused)

### 3. New Documentation Created
- ✅ `docs/setup/CS_ONBOARDING_TEMPLATES.md` - CS-Support template overview
- ✅ `docs/setup/CSM_ONBOARDING_WORKFLOW.md` - CSM workflow guide

---

## CS-Support Templates (Correct)

The following 3 CS-Support templates are now correctly documented:

1. ✅ `law_firm_pre_onboarding` (3 days)
   - Pre-onboarding preparation checklist
   - CSM sends groundwork prep email

2. ✅ `law_firm_onboarding_call` (1 day)
   - White-glove onboarding call workflow
   - CSM helps fill profile during call

3. ✅ `law_firm_post_onboarding_90_days` (90 days)
   - First 90 days support
   - AI agent + CSM team support

---

## Verification

### Database Seeding
After Supabase is back up, verify only CS-Support templates exist:

```sql
SELECT template_key, name, jtbd, is_active 
FROM cs_onboarding_sequences 
WHERE template_key IS NOT NULL;
```

**Expected Result:** 3 rows (CS-Support templates only)

### Code References
All code references now use CS-Support template keys:
- `law_firm_pre_onboarding`
- `law_firm_onboarding_call`
- `law_firm_post_onboarding_90_days`

### Documentation
All documentation now references CS-Support templates only.

---

## What Belongs Where

### CS-Support Service (This Service)
- ✅ Law firm onboarding after INTAKE application
- ✅ Pre-onboarding preparation
- ✅ Onboarding call workflow
- ✅ Post-onboarding support (first 90 days)
- ✅ Customer success management

### Sales CRM Service (Different Service)
- ✅ Sales go-to-market playbooks
- ✅ Compliance magnet loop
- ✅ Founder authority sprint
- ✅ Outbound precision sprint
- ✅ Partner/influencer push
- ✅ Selective paid capture
- ✅ Lead qualification
- ✅ Demo scheduling

---

## Next Steps

1. ✅ All sales CRM references removed
2. ✅ All files updated with CS-Support templates
3. ⏳ Wait for Supabase to come back online
4. ⏳ Run seed script to insert CS-Support templates
5. ⏳ Verify no sales CRM templates exist in database

---

**Status:** ✅ **COMPLETE**  
**All sales CRM references removed from CS-Support service**
