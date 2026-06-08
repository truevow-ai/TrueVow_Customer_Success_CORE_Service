# CS Core Service - Domain Patterns

> **Gap Analysis (2026-03-10):** Updated with learnings from boundary enforcement and documentation creation.

## Overview

This file documents domain-specific patterns, architecture decisions, and common workflows for the TrueVow Customer Success Core Service.

## Architecture Summary

### Service Identity

- **Name:** Customer Success Core (CS Core)
- **Port:** 3061
- **Purpose:** Post-sale customer success management
- **Owns:** Support tickets, onboarding, playbooks, CSM operations
- **Proxies to:** SaaS Admin (intelligence), Tenant Billing (billing)

### Three-Layer Intelligence Stack

```
Layer 1: Tenant App (Intake)
  - Owns: leads, intake forms, injury data
  - Produces: behavioral signals
  - Location: Port 3021

Layer 2: SaaS Admin (Behavioral Intelligence)  
  - Owns: health_scores, recommendations, behavior_events
  - Computes: ALL health scores, churn risk, expansion probability
  - Location: Port 3001

Layer 3: CS Core (Operational Intelligence)
  - Owns: cs_tickets, cs_onboarding_sequences, cs_playbooks
  - Displays: health scores from SaaS Admin
  - NEVER: computes, caches, stores lead data
```

---

## Key Patterns

### Pattern: Fetching Health Score

**When to use:** When displaying customer health in UI or API

**Correct approach:**
```typescript
import { getHealthScore } from '@/lib/intelligence/client'

const response = await getHealthScore(tenantId, customerEmail)
if (response.ok) {
  const healthData = await response.json()
  return healthData
}
return null
```

**Wrong approach:**
```typescript
// NEVER do this in CS Core
import { HealthScoringService } from '@/lib/core/services/health-scoring'
const score = await HealthScoringService.calculateHealthScore(...) // WRONG
```

### Pattern: Adding New API Route

**When to use:** Creating new endpoint

**Steps:**
1. Choose domain: `app/api/v1/{domain}/{action}/route.ts`
2. Add auth: `const user = await requireInternalUser()`
3. Add validation: Use Zod schemas from `libs/core/config/`
4. Add business logic: Import from `libs/core/services/`
5. Add DB access: Import from `libs/core/repositories/`
6. Return: `NextResponse.json({ success: true, data: ... })`

### Pattern: Creating Database Migration

**When to use:** Adding/changing table schema

**Steps:**
1. Number: Increment from last migration (e.g., `045_`)
2. Wrap: `BEGIN; ... COMMIT;`
3. Columns: Always include `tenant_id` for multi-tenant isolation
4. RLS: Always enable RLS and add policies
5. Comments: Explain WHY this change is needed
6. Indexes: Add for frequently queried columns

### Pattern: Service-to-Service Call

**When to use:** Calling another service (SaaS Admin, Internal Ops)

**Steps:**
1. Check if client already exists in `libs/core/integrations/`
2. If not, create new client in appropriate location
3. Use API key from environment variables
4. Add timeout (8 seconds standard, 15 for calculations)
5. Handle errors gracefully, return null on failure

### Pattern: Authentication

**When to use:** Protecting API routes

**Modern approach (preferred):**
```typescript
import { requireInternalUser } from '@/lib/security'
const user = await requireInternalUser()
```

**Legacy approach (deprecated):**
```typescript
import { requireAuth, requireTeamMember } from '@/lib/core/middleware/auth'
// Don't use for new code
```

---

## Common Workflows

### Workflow: New Support Ticket

1. **Request arrives** via webhook or API
2. **Validate** channel (email, SMS, call, chat)
3. **Create ticket** in `cs_tickets` table
4. **Create message** in `cs_messages` table
5. **Log activity** in `cs_team_activity_feed`
6. **Calculate SLA** targets based on priority
7. **Notify** assigned CSM (if any)

**Files involved:**
- `app/api/v1/tickets/route.ts`
- `libs/core/repositories/tickets.ts`
- `libs/core/services/notification-service.ts`

### Workflow: Onboarding Sequence

1. **Trigger:** Tenant signs up (SaaS Admin notifies CS Core)
2. **Create record:** `cs_customer_post_onboarding`
3. **Load sequence:** Get steps from `cs_onboarding_sequences`
4. **Schedule:** First touchpoint at Day 1
5. **Execute:** Send email/SMS per schedule
6. **Track:** Mark steps complete as customer progresses
7. **Escalate:** If no progress after N days

**Files involved:**
- `libs/core/services/post-onboarding-flows.ts`
- `libs/core/services/post-onboarding-sequences.ts`
- `libs/core/repositories/customer-onboarding.ts`

### Workflow: Renewal Pipeline

1. **Detect:** Tenant renewal date approaching (90 days out)
2. **Create:** `cs_renewal_records` entry
3. **Assess:** Fetch health score from SaaS Admin
4. **Plan:** CSM creates renewal strategy
5. **Execute:** Automated outreach (email, calls)
6. **Track:** Progress in `cs_renewal_*` tables
7. **Close:** Mark as renewed/churned/downgraded

**Files involved:**
- `libs/core/services/renewal-orchestration.ts`
- `libs/core/repositories/renewal.ts`

### Workflow: AI Recommendation Action

1. **Fetch:** Get recommendations from SaaS Admin
2. **Display:** Show in CSM dashboard
3. **Act:** CSM takes recommended action
4. **Record:** Call `recordRecommendationOutcome()`
5. **Learn:** SaaS Admin intelligence engine improves

**Files involved:**
- `libs/core/intelligence/client.ts` (recordRecommendationOutcome)
- `app/api/intelligence/recommendations/route.ts`

---

## Debugging Checklist

### API Returns 401

- [ ] Clerk session valid? Check cookies
- [ ] API key correct? Check X-API-Key header
- [ ] Wrong Clerk app? Must be App 1 (Platform-Operators)

### Health Score Not Showing

- [ ] SaaS Admin running at port 3001?
- [ ] SAAS_ADMINISTRATION_SERVICE_URL correct?
- [ ] SAAS_ADMINISTRATION_SERVICE_API_KEY valid?
- [ ] Tenant has any customers?

### Emails Not Sending

- [ ] RESEND_CS_SUPPORT_API_KEY set?
- [ ] RESEND_FROM_EMAIL verified in Resend?
- [ ] Check cs_audit_logs for errors?
- [ ] Check Resend dashboard for bounces?

### Database Errors

- [ ] Migration run? Check pg_migrations
- [ ] RLS blocking? Check policy definitions
- [ ] Wrong Supabase client? Server vs anon key

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Intelligence proxy | `libs/core/intelligence/client.ts` |
| Auth middleware | `libs/core/middleware/auth.ts` |
| Security | `libs/core/security/index.ts` |
| Rate limiting | `libs/core/middleware/rate-limit.ts` |
| API key validation | `libs/core/middleware/api-key.ts` |
| Audit logging | `libs/core/middleware/audit-log.ts` |
| Service registry | `libs/core/services/service-registry.ts` |
| Agent definitions | `libs/core/agents/agent-definitions.ts` |
| DB client | `libs/core/db/supabase.ts` |

---

## Integrations

### External Services

| Service | Purpose | Env Vars |
|---------|---------|----------|
| SaaS Admin | Intelligence data | SAAS_ADMINISTRATION_SERVICE_URL, SAAS_ADMINISTRATION_SERVICE_API_KEY |
| Internal Ops | Service registry | SERVICE_REGISTRY_URL, SERVICE_REGISTRY_API_KEY |
| Clerk | User authentication | CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY |
| Twilio | SMS/Voice | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER |
| Resend | Email | RESEND_CS_SUPPORT_API_KEY |
| SendGrid | Email (backup) | SENDGRID_API_KEY |
| Deepgram | STT | DEEPGRAM_API_KEY |
| Cartesia | TTS | CARTESIA_API_KEY |
| Grafana | Monitoring | Stack URL in docs |

### Database Connections

| Database | Project ID | Purpose |
|----------|------------|---------|
| CS Core | inbwimykrvmxhlmwxamk | Own tables |
| SaaS Admin | jahhqcypxjkxwrfzpyxd | Intelligence |
| Tenant App | flhnyyreaxkmwmexchla | Lead data |
| Internal Ops | yhxtjqczyvjceooyjskc | Registry |
| Tenant Billing | hnnuikyoprpprxpvixzq | Billing data |

---

## Gotchas

1. **Never import SaaS Admin services directly** — Use proxy pattern
2. **Always add tenant_id to new tables** — Multi-tenant isolation
3. **Check RLS on every new table** — Security requirement
4. **Use scoped auth (lib/security)** — Not legacy middleware
5. **Set timeouts on external calls** — 8 seconds standard
6. **Log audit entries for sensitive ops** — Security requirement
7. **Mark deprecated code clearly** — @deprecated + console.warn
8. **Test with real auth flow** — Mock can hide issues

---

**Version:** 1.0 | **Updated:** 2026-03-10
