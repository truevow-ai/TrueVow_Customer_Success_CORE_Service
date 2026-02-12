# Tenant ID Nullable Fix - Pre-Sale Tickets

**Date:** January 10, 2026  
**Migration File:** `database/migrations/006_allow_null_tenant_for_presale.sql`  
**Status:** ✅ Ready to Execute

## Problem

Pre-sale tickets are for leads who don't have a tenant yet. The original schema required `tenant_id` to be NOT NULL, which forced us to use placeholder UUIDs (bad practice).

## Solution

**Proper Approach:**
- Make `tenant_id` nullable in the database
- Add validation to ensure `tenant_id` is NULL only for pre-sale tickets
- Use a trigger to enforce this business rule

## What This Migration Does

1. **Makes tenant_id Nullable**
   - Removes NOT NULL constraint from `tenant_id` column
   - Allows NULL values for pre-sale tickets

2. **Adds Validation**
   - Creates a trigger function that validates:
     - Pre-sale tickets: `tenant_id` can be NULL
     - All other tickets: `tenant_id` must be NOT NULL

3. **Updates Seed Data**
   - Pre-sale ticket now uses NULL instead of placeholder UUID

4. **Updates TypeScript Types**
   - `tenant_id` is now `string | null` in types

## Business Logic

```
Pre-Sale Ticket (stage = 'pre-sale'):
  ✅ tenant_id = NULL (lead doesn't have tenant yet)

Post-Sale Ticket (stage = 'post-sale' or 'converted'):
  ✅ tenant_id = <actual_tenant_uuid> (required)

All Other Tickets:
  ✅ tenant_id = <actual_tenant_uuid> (required)
```

## Why This Is Better

**Before (Bad Practice):**
- ❌ Placeholder UUIDs (`00000000-0000-0000-0000-000000000000`)
- ❌ Confusing data (looks like real tenant)
- ❌ Hard to query pre-sale tickets
- ❌ Risk of using placeholder in queries

**After (Good Practice):**
- ✅ NULL for pre-sale tickets (clear intent)
- ✅ Easy to query: `WHERE tenant_id IS NULL AND stage = 'pre-sale'`
- ✅ Database enforces business rule
- ✅ Type-safe (TypeScript knows it can be null)

## Migration Instructions

```bash
# Run the migration
psql $DATABASE_URL -f database/migrations/006_allow_null_tenant_for_presale.sql

# Then update seed data
psql $DATABASE_URL -f database/seed.sql
```

## After Migration

1. ✅ `tenant_id` is nullable
2. ✅ Validation trigger enforces business rule
3. ✅ Pre-sale tickets can have NULL tenant_id
4. ✅ All other tickets require tenant_id
5. ✅ TypeScript types updated
6. ✅ Seed data updated

---

**Status:** ✅ READY TO EXECUTE  
**Better Practice:** NULL for pre-sale tickets instead of placeholder UUIDs
