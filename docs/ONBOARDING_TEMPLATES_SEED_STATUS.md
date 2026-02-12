# Onboarding Templates Seed Status

**Date:** January 15, 2026  
**Status:** ✅ Migration Complete, ⏳ Seed Pending

---

## ✅ Completed

1. **Migration 009** - Onboarding sequences tables created
2. **Migration 020** - Added `template_key` and `jtbd` columns
3. **Auto-seed script created** - `scripts/seed-templates-auto.ts`
4. **Seed SQL file updated** - `database/seed_onboarding_sequence_templates.sql` (CS-Support templates)

---

## ⏳ To Complete Seeding

### Option 1: Run Auto-Seed Script (Recommended)

**Prerequisites:**
- Ensure `.env.local` has:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` or `CS_SUPPORT_DATABASE_SECRET_KEY`

**Command:**
```bash
npx tsx scripts/seed-templates-auto.ts
```

This will automatically insert all 3 CS-Support templates via Supabase API.

### Option 2: Manual SQL Execution

**In Supabase Dashboard:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of: `database/seed_onboarding_sequence_templates.sql`
3. Paste and execute

---

## 📋 Templates to be Inserted (CS-Support)

1. **law_firm_pre_onboarding** (3 days)
   - Pre-onboarding preparation checklist
   - CSM sends groundwork prep email

2. **law_firm_onboarding_call** (1 day)
   - White-glove onboarding call workflow
   - CSM helps fill profile during call

3. **law_firm_post_onboarding_90_days** (90 days)
   - First 90 days support
   - AI agent + CSM team support

**⚠️ NOTE:** These are CS-Support templates (NOT sales CRM templates). Sales CRM templates belong in the Sales CRM service.

---

## ✅ Verification

After seeding, verify templates exist:

```sql
SELECT template_key, name, jtbd, is_active 
FROM cs_onboarding_sequences 
WHERE template_key IS NOT NULL;
```

Should return 3 rows (CS-Support templates).

---

**Next Action:** Run seed script or execute SQL file manually
