# Onboarding Sequence Templates

## Overview

This document describes the CS-Support onboarding sequence templates that have been seeded into the database. These templates provide different onboarding journeys for law firm customers after they apply for INTAKE service.

**⚠️ NOTE:** These are CS-Support onboarding templates (NOT sales CRM templates). Sales CRM templates belong in the Sales CRM service.

## Template Structure

Each template includes:
- **template_key**: Unique identifier for the template
- **name**: Display name
- **description**: Detailed description of the sequence purpose
- **jtbd**: Jobs To Be Done - The customer goal this sequence addresses
- **estimated_duration_days**: Expected duration of the onboarding process

## Available Templates (CS-Support)

### 1. Law Firm Pre-Onboarding Preparation
- **template_key**: `law_firm_pre_onboarding`
- **jtbd**: "Help me prepare everything needed for a successful onboarding call."
- **Duration**: 3 days
- **Purpose**: CSM sends automated email about preparing groundwork and checklist items before onboarding call. Customer prepares checklist items and requests calendar booking.

### 2. Law Firm Onboarding Call
- **template_key**: `law_firm_onboarding_call`
- **jtbd**: "Help me complete my profile setup with expert guidance."
- **Duration**: 1 day (45-minute call + configuration)
- **Purpose**: CSM helps fill in profile information during white-glove onboarding call, then account configuration. Account ready for testing INTAKE.

### 3. Law Firm Post-Onboarding Support (First 90 Days)
- **template_key**: `law_firm_post_onboarding_90_days`
- **jtbd**: "Help me successfully use INTAKE and resolve any issues I face."
- **Duration**: 90 days
- **Purpose**: First-line AI agent + CSM team support for first 90 days of using INTAKE service. Helps customer with using the service and resolving issues.

## Database Schema

### Migration
- **File**: `database/migrations/020_add_template_key_to_onboarding_sequences.sql`
- **Changes**: Adds `template_key` (unique) and `jtbd` columns to `cs_onboarding_sequences` table

### Seed Data
- **File**: `database/seed_onboarding_sequence_templates.sql`
- **Action**: Inserts 3 CS-Support templates with `ON CONFLICT` handling for idempotency

## Usage

### Starting Onboarding with Template Key

```typescript
import { OnboardingSequencesService } from '@/lib/services/onboarding-sequences'

// Start onboarding using a template key
const progress = await OnboardingSequencesService.startOnboarding(
  tenantId,
  customerEmail,
  undefined, // sequenceId (optional)
  'law_firm_pre_onboarding' // templateKey
)
```

### Getting Sequence by Template Key

```typescript
// Get sequence details by template key
const sequence = await OnboardingSequencesService.getSequenceByTemplateKey(
  'law_firm_pre_onboarding',
  tenantId // optional, for tenant-specific overrides
)
```

## Template Customization

### Current Status

All templates are currently **template shells** with:
- ✅ Basic metadata (name, description, jtbd)
- ✅ Template structure defined
- ⏳ Stages: Empty (to be designed)
- ⏳ Milestones: Empty (to be designed)
- ⏳ Communication flows: Empty (to be designed)

### Next Steps

1. **Design Stages**: Define the onboarding stages for each template
2. **Create Milestones**: Design specific milestones for each stage
3. **Build Communication Flows**: Create email, SMS, and call scripts
4. **Link Templates**: Associate communication templates with milestones
5. **Test Sequences**: Validate end-to-end onboarding flows

## Template Selection Logic

When starting onboarding:

1. If `templateKey` provided → Use that template
2. If `sequenceId` provided → Use that sequence
3. Otherwise → Use default sequence for tenant

Template lookup priority:
1. Tenant-specific template (if `tenant_id` matches)
2. Default template (`tenant_id` is NULL)

## API Integration

### Start Onboarding with Template

```http
POST /api/v1/onboarding/start
Content-Type: application/json

{
  "tenant_id": "uuid",
  "customer_email": "customer@example.com",
  "template_key": "law_firm_pre_onboarding"
}
```

### Get Sequence by Template Key

```http
GET /api/v1/onboarding/sequences/template/:templateKey?tenant_id=uuid
```

## Notes

- All templates are set as `is_default: true` and `is_active: true`
- Templates have `tenant_id: NULL` making them available to all tenants
- Tenants can create custom sequences that override defaults
- Template keys are unique and indexed for fast lookups
- JTBD field helps track which customer goals each template addresses

## Related Documentation

- `docs/setup/CS_ONBOARDING_TEMPLATES.md` - CS-Support template overview
- `docs/setup/CSM_ONBOARDING_WORKFLOW.md` - CSM workflow guide
- `docs/setup/ONBOARDING_SEQUENCE_MAPPING.md` - Sequence mapping strategy
- `docs/setup/LAW_FIRM_ONBOARDING_FLOW.md` - Law firm onboarding flow
- `lib/services/onboarding-sequences.ts` - Service implementation
