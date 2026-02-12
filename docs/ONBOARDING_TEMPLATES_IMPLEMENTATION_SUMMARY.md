# Onboarding Sequence Templates - Implementation Summary

**Date:** January 15, 2026  
**Status:** ✅ Complete (Pending Database Migration)

---

## Overview

Implemented a comprehensive template-based onboarding system that allows starting onboarding sequences using predefined template keys instead of sequence IDs. This enables different onboarding journeys for law firm customers after they apply for INTAKE service.

**⚠️ NOTE:** These are CS-Support onboarding templates (NOT sales CRM templates). Sales CRM templates belong in the Sales CRM service.

---

## What Was Implemented

### 1. Database Schema Updates ✅

**Migration:** `database/migrations/020_add_template_key_to_onboarding_sequences.sql`
- Added `template_key` column (VARCHAR(100), UNIQUE) for unique template identification
- Added `jtbd` column (TEXT) for Jobs To Be Done descriptions
- Created index on `template_key` for fast lookups

### 2. Seed Data ✅

**File:** `database/seed_onboarding_sequence_templates.sql`
- Seeds 3 CS-Support onboarding sequence templates:
  1. `law_firm_pre_onboarding` (3 days)
  2. `law_firm_onboarding_call` (1 day)
  3. `law_firm_post_onboarding_90_days` (90 days)
- Uses `ON CONFLICT` for idempotent inserts
- All templates are default (`tenant_id: NULL`) and active

### 3. Service Layer Updates ✅

**File:** `lib/services/onboarding-sequences.ts`

**Changes:**
- ✅ Added `template_key` and `jtbd` to `OnboardingSequence` interface
- ✅ Added `getSequenceByTemplateKey()` method
- ✅ Updated `startOnboarding()` to accept `templateKey` parameter
- ✅ Updated `parseSequence()` to include new fields
- ✅ Template lookup prioritizes tenant-specific over default templates

### 4. API Endpoints ✅

**Updated:**
- `POST /api/v1/onboarding/start` - Now accepts `templateKey` parameter

**New:**
- `GET /api/v1/onboarding/sequences/template/:templateKey` - Get sequence by template key
- `GET /api/v1/onboarding/sequences/templates` - List all available templates

**Features:**
- ✅ Input validation and sanitization
- ✅ Rate limiting (10-20 requests/minute)
- ✅ Authentication required
- ✅ Error handling
- ✅ Tenant-specific template override support

### 5. Documentation ✅

**Created:**
- `docs/setup/CS_ONBOARDING_TEMPLATES.md` - CS-Support template overview and usage guide
- `docs/setup/CSM_ONBOARDING_WORKFLOW.md` - CSM workflow guide
- `docs/ONBOARDING_TEMPLATES_IMPLEMENTATION_SUMMARY.md` - This file

---

## Template Details

### Law Firm Pre-Onboarding Preparation
- **Key:** `law_firm_pre_onboarding`
- **JTBD:** "Help me prepare everything needed for a successful onboarding call."
- **Duration:** 3 days
- **Target:** Law firms who have applied for INTAKE service, preparing for onboarding call

### Law Firm Onboarding Call
- **Key:** `law_firm_onboarding_call`
- **JTBD:** "Help me complete my profile setup with expert guidance."
- **Duration:** 1 day (45-minute call + configuration)
- **Target:** Law firms ready for white-glove onboarding call with CSM

### Law Firm Post-Onboarding Support (First 90 Days)
- **Key:** `law_firm_post_onboarding_90_days`
- **JTBD:** "Help me successfully use INTAKE and resolve any issues I face."
- **Duration:** 90 days
- **Target:** Law firms in first 90 days of using INTAKE service

---

## Usage Examples

### Start Onboarding with Template

```typescript
import { OnboardingSequencesService } from '@/lib/services/onboarding-sequences'

const progress = await OnboardingSequencesService.startOnboarding(
  tenantId,
  customerEmail,
  undefined, // sequenceId
  'law_firm_pre_onboarding' // templateKey
)
```

### API Call

```http
POST /api/v1/onboarding/start
Content-Type: application/json

{
  "tenantId": "uuid",
  "customerEmail": "customer@example.com",
  "templateKey": "law_firm_pre_onboarding"
}
```

### Get Template Details

```http
GET /api/v1/onboarding/sequences/template/law_firm_pre_onboarding?tenant_id=uuid
```

### List All Templates

```http
GET /api/v1/onboarding/sequences/templates?tenant_id=uuid
```

---

## Template Selection Logic

When starting onboarding:

1. **If `templateKey` provided** → Use that template
2. **If `sequenceId` provided** → Use that sequence
3. **Otherwise** → Use default sequence for tenant

**Template Lookup Priority:**
1. Tenant-specific template (if `tenant_id` matches)
2. Default template (`tenant_id` is NULL)

---

## Current Status

### ✅ Complete
- Database migration script
- Seed data script (with CS-Support templates)
- Service layer implementation
- API endpoints
- Documentation

### ⏳ Pending
- Database migration execution (Supabase under maintenance)
- Seed data execution
- Template content design (stages, milestones, communication flows)

---

## Next Steps

1. **Execute Migration** - Run `020_add_template_key_to_onboarding_sequences.sql` when Supabase is available
2. **Execute Seed** - Run `seed_onboarding_sequence_templates.sql` to insert CS-Support templates
3. **Design Template Content** - Add stages, milestones, and communication flows for each template
4. **Test Integration** - Verify template-based onboarding works end-to-end
5. **Create Communication Templates** - Design email, SMS, and call scripts for each milestone

---

## Files Created/Modified

### New Files
- `database/migrations/020_add_template_key_to_onboarding_sequences.sql`
- `database/seed_onboarding_sequence_templates.sql` (CS-Support templates)
- `app/api/v1/onboarding/sequences/template/[templateKey]/route.ts`
- `app/api/v1/onboarding/sequences/templates/route.ts`
- `docs/setup/CS_ONBOARDING_TEMPLATES.md`
- `docs/setup/CSM_ONBOARDING_WORKFLOW.md`
- `docs/ONBOARDING_TEMPLATES_IMPLEMENTATION_SUMMARY.md`

### Modified Files
- `lib/services/onboarding-sequences.ts` - Added template key support
- `app/api/v1/onboarding/start/route.ts` - Added templateKey parameter
- `scripts/seed-templates-auto.ts` - Updated with CS-Support templates

---

## Testing Checklist

Once database is available:

- [ ] Run migration successfully
- [ ] Run seed script successfully
- [ ] Verify templates exist in database (3 CS-Support templates)
- [ ] Test `POST /api/v1/onboarding/start` with `templateKey`
- [ ] Test `GET /api/v1/onboarding/sequences/template/:templateKey`
- [ ] Test `GET /api/v1/onboarding/sequences/templates`
- [ ] Verify tenant-specific template override works
- [ ] Verify template lookup prioritization

---

## Related Documentation

- `docs/setup/CS_ONBOARDING_TEMPLATES.md` - CS-Support template overview
- `docs/setup/CSM_ONBOARDING_WORKFLOW.md` - CSM workflow guide
- `docs/setup/ONBOARDING_SEQUENCE_MAPPING.md` - Sequence mapping strategy
- `docs/setup/LAW_FIRM_ONBOARDING_FLOW.md` - Law firm onboarding flow

---

**Implementation Status:** ✅ **COMPLETE** (Pending Database Migration)  
**Ready for:** Database migration and seed execution  
**Next Action:** Execute SQL files when Supabase is available
