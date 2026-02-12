# Onboarding Sequence Templates API Documentation

## Overview

API endpoints for managing and using CS-Support onboarding sequence templates. Templates provide predefined onboarding journeys for law firm customers after they apply for INTAKE service.

**⚠️ NOTE:** These are CS-Support onboarding templates (NOT sales CRM templates). Sales CRM templates belong in the Sales CRM service.

---

## Endpoints

### 1. Start Onboarding with Template Key

Start an onboarding sequence using a template key instead of a sequence ID.

**Endpoint:** `POST /api/v1/onboarding/start`

**Request Body:**
```json
{
  "tenantId": "uuid",
  "customerEmail": "customer@example.com",
  "templateKey": "law_firm_pre_onboarding"
}
```

**Alternative (using sequenceId):**
```json
{
  "tenantId": "uuid",
  "customerEmail": "customer@example.com",
  "sequenceId": "uuid"
}
```

**Note:** You cannot specify both `sequenceId` and `templateKey`. Use one or the other.

**Response:**
```json
{
  "success": true,
  "message": "Onboarding started successfully",
  "data": {
    "progress_id": "uuid",
    "tenant_id": "uuid",
    "customer_email": "customer@example.com",
    "sequence_id": "uuid",
    "onboarding_stage": "not_started",
    "current_milestone": "account_created",
    "completion_percentage": 0,
    "started_at": "2026-01-15T16:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid input (both sequenceId and templateKey provided, or invalid format)
- `500` - Server error

---

### 2. Get Sequence by Template Key

Retrieve onboarding sequence details by template key.

**Endpoint:** `GET /api/v1/onboarding/sequences/template/:templateKey`

**Query Parameters:**
- `tenant_id` (optional) - If provided, will prefer tenant-specific template over default

**Example:**
```http
GET /api/v1/onboarding/sequences/template/law_firm_pre_onboarding?tenant_id=uuid
```

**Response:**
```json
{
  "success": true,
  "message": "Sequence retrieved successfully",
  "data": {
    "sequence_id": "uuid",
    "template_key": "law_firm_pre_onboarding",
    "name": "Law Firm Pre-Onboarding Preparation",
    "description": "CSM sends automated email about preparing groundwork and checklist items before onboarding call.",
    "jtbd": "Help me prepare everything needed for a successful onboarding call.",
    "tenant_id": null,
    "is_default": true,
    "is_active": true,
    "stages": [],
    "milestones": [],
    "communication_flows": [],
    "estimated_duration_days": 3
  }
}
```

**Error Responses:**
- `404` - Template not found
- `500` - Server error

---

### 3. List Available Templates

List all available onboarding sequence templates.

**Endpoint:** `GET /api/v1/onboarding/sequences/templates`

**Query Parameters:**
- `tenant_id` (optional) - Filter templates for specific tenant (includes default templates)
- `include_inactive` (optional, default: false) - Include inactive templates

**Example:**
```http
GET /api/v1/onboarding/sequences/templates?tenant_id=uuid&include_inactive=false
```

**Response:**
```json
{
  "success": true,
  "message": "Templates retrieved successfully",
  "data": [
    {
      "sequence_id": "uuid",
      "template_key": "law_firm_pre_onboarding",
      "name": "Law Firm Pre-Onboarding Preparation",
      "description": "CSM sends automated email about preparing groundwork and checklist items before onboarding call.",
      "jtbd": "Help me prepare everything needed for a successful onboarding call.",
      "is_active": true,
      "is_default": true,
      "estimated_duration_days": 3,
      "created_at": "2026-01-15T16:01:40Z"
    },
    {
      "sequence_id": "uuid",
      "template_key": "law_firm_onboarding_call",
      "name": "Law Firm Onboarding Call",
      "description": "CSM helps fill in profile information during white-glove onboarding call, then account configuration.",
      "jtbd": "Help me complete my profile setup with expert guidance.",
      "is_active": true,
      "is_default": true,
      "estimated_duration_days": 1,
      "created_at": "2026-01-15T16:01:40Z"
    },
    {
      "sequence_id": "uuid",
      "template_key": "law_firm_post_onboarding_90_days",
      "name": "Law Firm Post-Onboarding Support (First 90 Days)",
      "description": "First-line AI agent + CSM team support for first 90 days of using INTAKE service.",
      "jtbd": "Help me successfully use INTAKE and resolve any issues I face.",
      "is_active": true,
      "is_default": true,
      "estimated_duration_days": 90,
      "created_at": "2026-01-15T16:01:40Z"
    }
  ]
}
```

---

## Available Template Keys (CS-Support)

### 1. `law_firm_pre_onboarding`
- **Name:** Law Firm Pre-Onboarding Preparation
- **JTBD:** "Help me prepare everything needed for a successful onboarding call."
- **Duration:** 3 days
- **Purpose:** CSM sends automated email about preparing groundwork and checklist items before onboarding call

### 2. `law_firm_onboarding_call`
- **Name:** Law Firm Onboarding Call
- **JTBD:** "Help me complete my profile setup with expert guidance."
- **Duration:** 1 day
- **Purpose:** CSM helps fill in profile information during white-glove onboarding call, then account configuration

### 3. `law_firm_post_onboarding_90_days`
- **Name:** Law Firm Post-Onboarding Support (First 90 Days)
- **JTBD:** "Help me successfully use INTAKE and resolve any issues I face."
- **Duration:** 90 days
- **Purpose:** First-line AI agent + CSM team support for first 90 days of using INTAKE service

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

## Authentication

All endpoints require authentication via Clerk and team member mapping.

**Headers:**
```http
Authorization: Bearer <clerk_session_token>
```

---

## Rate Limiting

- **Start Onboarding:** 10 requests per minute
- **Get Template:** 20 requests per minute
- **List Templates:** 20 requests per minute

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional error details (optional)"
}
```

**Common Error Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (template/sequence not found)
- `500` - Internal Server Error

---

## Examples

### Start Onboarding with Template

```bash
curl -X POST https://api.example.com/api/v1/onboarding/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "123e4567-e89b-12d3-a456-426614174000",
    "customerEmail": "customer@example.com",
    "templateKey": "law_firm_pre_onboarding"
  }'
```

### Get Template Details

```bash
curl -X GET "https://api.example.com/api/v1/onboarding/sequences/template/law_firm_pre_onboarding?tenant_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <token>"
```

### List All Templates

```bash
curl -X GET "https://api.example.com/api/v1/onboarding/sequences/templates" \
  -H "Authorization: Bearer <token>"
```

---

## Related Documentation

- `docs/setup/CS_ONBOARDING_TEMPLATES.md` - CS-Support template overview and usage
- `docs/setup/CSM_ONBOARDING_WORKFLOW.md` - CSM workflow guide
- `docs/setup/ONBOARDING_SEQUENCE_MAPPING.md` - Sequence mapping strategy
- `lib/services/onboarding-sequences.ts` - Service implementation
