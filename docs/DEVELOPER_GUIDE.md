# TrueVow — Customer Success CORE Service: Developer Guide

> **Audience:** Entry-level software developers joining this project.  
> **Goal:** Understand every perspective of this repository — architecture, integrations, data ownership, use cases, edge cases, and how to troubleshoot bugs in staging or production.

---

## Table of Contents

1. [What is This Service?](#1-what-is-this-service)
2. [Where Does It Fit in the Platform?](#2-where-does-it-fit-in-the-platform)
3. [The Three-Layer Intelligence Stack](#3-the-three-layer-intelligence-stack)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Technology Stack](#5-technology-stack)
6. [Running the Service Locally](#6-running-the-service-locally)
7. [Environment Variables Explained](#7-environment-variables-explained)
8. [Authentication Architecture](#8-authentication-architecture)
9. [Database Architecture](#9-database-architecture)
10. [API Routes Reference](#10-api-routes-reference)
11. [Core Services (Business Logic Layer)](#11-core-services-business-logic-layer)
12. [Repositories (Data Access Layer)](#12-repositories-data-access-layer)
13. [Middleware Stack](#13-middleware-stack)
14. [Service-to-Service Integrations](#14-service-to-service-integrations)
15. [External Integrations (Third Parties)](#15-external-integrations-third-parties)
16. [Key Use Cases — End to End](#16-key-use-cases--end-to-end)
17. [Critical Architectural Rules — Never Violate](#17-critical-architectural-rules--never-violate)
18. [Edge Cases to Know](#18-edge-cases-to-know)
19. [Troubleshooting Guide (Staging & Production)](#19-troubleshooting-guide-staging--production)
20. [Running Tests](#20-running-tests)
21. [Database Migrations](#21-database-migrations)

---

## 1. What is This Service?

The **CS Core Service** (also referred to as "CS-Support" or "Customer Success Core") is TrueVow's post-sale customer success platform. It is the internal tool used by **Customer Success Managers (CSMs)** to:

- Manage support tickets and customer conversations
- Monitor the health and lifecycle of tenants (law firms) after they've subscribed
- Run onboarding sequences and success playbooks
- Track renewals, expansion signals, and churn risk
- Communicate with customers via email, SMS, voice, and WhatsApp
- Coordinate with the SaaS Admin intelligence engine for behavioral insights

It runs on **port 3061** in local development.

> **One-liner:** This is the tool the TrueVow customer success team uses to make sure every law firm that signed up is happy, getting value, and not about to cancel.

---

## 2. Where Does It Fit in the Platform?

TrueVow is a multi-service platform. Each service runs independently with its own database and port.

| Service | Port | Purpose |
|---|---|---|
| Platform/SaaS Admin | 3001 | Core platform, tenant management, **intelligence engine** |
| Internal Ops | 3006 | Internal operations, service registry |
| Financial Management | 3011 | Billing and finance |
| Tenant Billing | 3016 | Billing for tenants |
| Tenant App | 3021 | The law firm-facing application (INTAKE, DRAFT, VERIFY) |
| Customer Portal | 3031 | Self-service portal for tenants |
| Leverage | 3036 | Legal leverage tool |
| Settle | 3041 | Settlement management |
| Connect | 3046 | Communication/connection tool |
| Verify | 3051 | Document verification |
| Sales CRM | 3056 | Sales operations (separate from CS) |
| **CS Core (this service)** | **3061** | **Customer success management** |
| First Line Support | 3066 | First-line AI-assisted support |
| Platform Analytics | 3071 | Cross-platform analytics |

### What CS Core Talks To

```
CS Core (3061)
  ├── READS FROM → SaaS Admin (3001)       [health scores, recommendations, behavior metrics]
  ├── WRITES TO  → SaaS Admin (3001)       [recommendation outcomes]
  ├── READS FROM → Internal Ops (3006)     [service registry, heartbeat]
  ├── SENDS VIA  → Twilio                  [SMS, voice calls]
  ├── SENDS VIA  → Resend / SendGrid       [emails]
  ├── USES       → Clerk (App 1)           [user authentication for CSMs]
  └── STORES IN  → Own Supabase DB         [tickets, onboarding, playbooks, etc.]
```

---

## 3. The Three-Layer Intelligence Stack

This is the most important architectural concept to understand. **Get this wrong and you will break the platform.**

### The Three Layers

```
Layer 1 — Tenant App (Intake Intelligence)
  - Owns: leads, intake forms, injury data, signed documents
  - Produces: behavioral signals, events
  - Rule: ALL lead data lives here. Never reference lead data in CS Core.

Layer 2 — SaaS Admin (Behavioral Intelligence Engine)
  - Owns: health_scores, recommendations, recommendation_outcomes,
           portal_behavior_events, tenant_behavior_metrics
  - Computes: ALL health scores, churn risk, expansion probability
  - Rule: THE ONLY place health scores are computed. CS Core must never compute them.

Layer 3 — CS Core (Operational Intelligence — THIS SERVICE)
  - Owns: support tickets, onboarding records, playbooks, CSM activity
  - Displays: health scores and recommendations (fetched from SaaS Admin)
  - Rule: DISPLAY ONLY. No computation. No caching of intelligence data.
```

### How CS Core Gets Health Score Data

CS Core does **NOT** compute health scores. It asks SaaS Admin:

```
CS Core API route
  → intelligence/client.ts   (the ONLY allowed gateway)
  → SaaS Admin /api/v1/health/score
  → Returns health score
  → CS Core displays it
```

The key file: [`libs/core/intelligence/client.ts`](../libs/core/intelligence/client.ts)

---

## 4. Project Folder Structure

```
TrueVow_Customer_Success_CORE_Service/
│
├── app/                          # Next.js App Router
│   ├── (auth)/sign-in/           # Clerk sign-in page
│   ├── (dashboard)/              # All UI pages (protected)
│   │   ├── dashboard/            # Main CSM dashboard
│   │   ├── analytics/            # Analytics views
│   │   ├── customer-portal/      # Customer portal views
│   │   ├── intelligence/         # Health score / recommendations UI
│   │   ├── knowledge-base/       # KB article management
│   │   └── settings/             # Service settings
│   ├── api/
│   │   ├── v1/                   # All REST API endpoints
│   │   │   ├── analytics/        # Analytics endpoints
│   │   │   ├── auth/             # Auth endpoints
│   │   │   ├── billing/          # Billing proxy
│   │   │   ├── crm/              # CRM sync
│   │   │   ├── customers/        # Customer management
│   │   │   ├── dashboard/        # Dashboard data
│   │   │   ├── expansion/        # Expansion trigger management
│   │   │   ├── faqs/             # FAQ management
│   │   │   ├── health/           # Health score endpoints (deprecated proxy)
│   │   │   ├── integrations/     # Third-party integrations
│   │   │   ├── kb/               # Knowledge base
│   │   │   ├── onboarding/       # Onboarding flow management
│   │   │   ├── playbooks/        # Success playbooks
│   │   │   ├── renewal/          # Renewal orchestration
│   │   │   ├── reports/          # Report generation
│   │   │   ├── service/          # Service health check
│   │   │   ├── surveys/          # CSAT/NPS surveys
│   │   │   ├── tickets/          # Support tickets
│   │   │   ├── workflows/        # Workflow engine
│   │   │   └── webhooks/         # Incoming webhooks
│   │   └── intelligence/         # NEW: canonical intelligence proxy routes
│   │       ├── health/           # GET /api/intelligence/health
│   │       └── health/calculate/ # POST /api/intelligence/health/calculate
│   ├── globals.css
│   ├── layout.tsx                # Root layout (Clerk provider)
│   └── page.tsx                  # Root page (redirects to /dashboard)
│
├── libs/core/                    # All business logic (server-side)
│   ├── agents/                   # AI agent execution framework
│   ├── api/                      # API utilities
│   ├── auth/                     # Auth helpers
│   ├── config/                   # App configuration
│   ├── db/                       # Supabase client setup
│   ├── integrations/             # Third-party integration adapters
│   ├── intelligence/             # Intelligence proxy client
│   │   └── client.ts             # ONLY gateway to SaaS Admin intelligence
│   ├── middleware/               # Request middleware (auth, rate-limit, API key, audit)
│   ├── repositories/             # Database access layer (14 repos)
│   ├── security/                 # Scope-aware auth (new pattern)
│   ├── services/                 # Business logic services (32 services)
│   └── utils/                   # Shared utility functions
│
├── components/                   # React UI components
│   ├── analytics/
│   ├── billing/
│   ├── command-palette/
│   ├── cs-support/               # Core support UI components
│   │   ├── dashboard/            # Dashboard widgets
│   │   └── dialer/               # Phone dialer
│   ├── health/
│   ├── kb/
│   ├── layout/
│   ├── navigation/
│   ├── shared/
│   ├── tickets/
│   ├── ui/
│   └── workflows/
│
├── infra/database/migrations/    # PostgreSQL migrations (001 → 044+)
│
├── tests/__tests__/              # Jest test suites
│
├── scripts/                      # Seed scripts, scheduled jobs
│
├── middleware.ts                 # Clerk auth middleware (request gating)
├── next.config.js
├── package.json
└── .env.local                    # Environment variables (never commit)
```

---

## 5. Technology Stack

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | Next.js | 14 (App Router) | Full-stack React framework, API routes + UI |
| Language | TypeScript | 5.4 | Type safety |
| Database | Supabase (PostgreSQL) | — | Own DB at `inbwimykrvmxhlmwxamk` |
| Auth | Clerk (App 1: TrueVow-Platform-Operators) | 6.x | CSM authentication |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| State | Zustand + TanStack Query | — | Client state + server data |
| Forms | React Hook Form + Zod | — | Form handling + validation |
| SMS/Voice | Twilio | — | Outbound comms |
| Email | Resend + SendGrid | — | Email sending |
| Monitoring | Grafana (Truthline stack) | — | Production observability |
| Testing | Jest + Babel | 29 | Unit and integration tests |
| Icons | Lucide React | — | UI icons |

---

## 6. Running the Service Locally

### Prerequisites

- Node.js 18+
- npm
- A valid `.env.local` (never commit this file)

### Start Development Server

```powershell
npm run dev
```

The service starts at **http://localhost:3061**

> Note: `package.json` sets `next dev -p 3012` — if you see port conflicts, the `.env.local` says `3061`. Confirm with your team which port to use.

### Other Useful Scripts

```powershell
npm run build           # Production build
npm run typecheck       # TypeScript type checking (no emit)
npm run lint            # ESLint check
npm run test            # Run all Jest tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage   # With coverage report
```

---

## 7. Environment Variables Explained

The `.env.local` file contains configuration for all services CS Core connects to. Key groups:

### Own Database

```env
CUSTOMER_SUCCESS_CORE_PROJECT_ID=inbwimykrvmxhlmwxamk
CUSTOMER_SUCCESS_CORE_DATABASE_URL=...
CUSTOMER_SUCCESS_CORE_DATABASE_ANON_KEY=...      # Client-side queries (RLS enforced)
CUSTOMER_SUCCESS_CORE_DATABASE_SERVICE_ROLE_KEY=... # Server-side (bypasses RLS)
```

### SaaS Admin (Intelligence Engine)

```env
SAAS_ADMINISTRATION_SERVICE_URL=http://localhost:3001
SAAS_ADMINISTRATION_SERVICE_API_KEY=...  # Used by intelligence/client.ts
SAAS_ADMIN_API_KEY=...                   # Must match CS_SUPPORT_API_KEY in SaaS Admin .env.local
```

### Clerk Authentication (3 Apps)

```env
# App 1: TrueVow-Platform-Operators (HIGH TRUST — used by this service for CSMs)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# App 2: TrueVow-Sales-Support (LLM Zone — sales reps, first-line support)
# App 3: TrueVow-Tenants (External — law firms, customer portal)
```

### Communication Services

```env
TWILIO_PHONE_NUMBER=+13269991112          # Voice calls
TWILIO_SMS_FROM=+13269991112             # SMS
RESEND_CS_SUPPORT_API_KEY=re_...         # Email (primary)
SENDGRID_API_KEY=SG....                  # Email (secondary)
```

### Service Registry

```env
SERVICE_REGISTRY_URL=http://localhost:3006   # Internal Ops hosts the registry
SERVICE_NAME=cs-core
SERVICE_PORT=3061
SERVICE_HEARTBEAT_INTERVAL_S=300             # Ping every 5 minutes
```

### Security

```env
AUTH_MODE=clerk              # Use 'local' only for dev testing
PERMISSION_FAIL_OPEN=true    # Non-production: allow on permission error
OUTBOUND_RATE_LIMIT=100      # Max 100 outbound messages per window
```

---

## 8. Authentication Architecture

### Who Uses This Service

| User Type | Auth Method | Clerk App |
|---|---|---|
| CSMs (Customer Success Managers) | Clerk session (browser) | App 1: TrueVow-Platform-Operators |
| Other internal services | API Key (X-API-Key header) | N/A |
| Webhook senders (Twilio, Resend) | Webhook secret | N/A |

### Two Auth Patterns in the Codebase

#### Pattern 1 (NEW — use for all new code)

Located in `libs/core/security/`. Scope-aware:

```typescript
import { requireInternalUser, requireTenantUser } from '@/lib/security'

// For CSMs / internal staff
const user = await requireInternalUser()

// For tenant (law firm) users via Customer Portal
const user = await requireTenantUser()
```

#### Pattern 2 (LEGACY — do not use for new code)

Located in `libs/core/middleware/auth.ts`. Still works but all functions are marked `@deprecated`:

```typescript
import { requireAuth, requireTeamMember } from '@/lib/core/middleware/auth'
```

### Request Gating (middleware.ts)

The root `middleware.ts` uses Clerk to protect every route except:
- `/sign-in`
- `/api/webhooks/*`
- `/api/v1/test/*`
- `/api/v1/service/health/*`

If an unauthenticated request hits a protected route, it is redirected to `/sign-in`.

### Service-to-Service Auth

Other services call CS Core by including their API key:

```
X-API-Key: <CUSTOMER_SUCCESS_CORE_SERVICE_API_KEY>
```

CS Core validates this in `libs/core/middleware/api-key.ts`. The known valid callers are SaaS Admin, Platform Service, Internal Ops, Sales CRM, and the Tenant App.

---

## 9. Database Architecture

### CS Core's Own Database

**Supabase project:** `inbwimykrvmxhlmwxamk`

The database is built through 44 migration files in `infra/database/migrations/`. Key tables:

| Table | Purpose |
|---|---|
| `cs_tickets` | Support ticket records |
| `cs_messages` | Message threads within tickets |
| `cs_team_activity_feed` | Activity log for the support team |
| `cs_team_members` | CSM profiles mapped to Clerk user IDs |
| `cs_knowledge_base` | KB articles |
| `cs_onboarding_sequences` | Onboarding step definitions |
| `cs_customer_post_onboarding` | Per-tenant post-onboarding tracking |
| `employee_messages` | SMS/WhatsApp messages sent by staff |
| `cs_csat_surveys` | CSAT/NPS survey records |
| `cs_audit_logs` | Security audit trail |
| `cs_playbook_*` | Success playbook definitions and executions |
| `cs_renewal_*` | Renewal orchestration records |
| `cs_expansion_*` | Expansion trigger tracking |
| `cs_core_agents` | AI agent configuration |
| `cs_core_agent_executions` | AI agent run history |

### Row-Level Security (RLS)

All tables use Supabase RLS. The pattern:

- **Anon key** (client-side): Subject to full RLS — users only see data scoped to their `tenant_id` or `user_id`
- **Service role key** (server-side): Bypasses RLS — used only in API routes

### What Lives in OTHER Databases

| Data | Database | Why CS Core Cannot Own It |
|---|---|---|
| `leads` | SaaS Admin / Tenant App | Pre-sale data, ownership boundary |
| `health_scores` | SaaS Admin | Intelligence engine owns computation |
| `recommendations` | SaaS Admin | Intelligence engine owns computation |
| `portal_behavior_events` | SaaS Admin | Behavioral signals, emit-only |
| `tenants` | SaaS Admin | Platform source of truth |
| `billing_records` | Tenant Billing | Separate billing service |

### Connecting to the Database

```typescript
import { createServerSupabase } from '@/lib/db/supabase'

const supabase = await createServerSupabase()  // Service role — bypasses RLS
const { data, error } = await supabase.from('cs_tickets').select('*')
```

---

## 10. API Routes Reference

### Base: `/api/v1/`

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/v1/tickets` | Ticket management |
| GET/POST | `/api/v1/customers` | Customer records |
| GET | `/api/v1/dashboard` | Dashboard aggregations |
| GET/POST | `/api/v1/analytics/*` | Analytics data |
| GET/POST | `/api/v1/onboarding/*` | Onboarding flows |
| GET/POST | `/api/v1/playbooks/*` | Success playbooks |
| GET/POST | `/api/v1/renewal/*` | Renewal pipeline |
| GET/POST | `/api/v1/expansion/*` | Expansion triggers |
| GET/POST | `/api/v1/surveys/*` | CSAT/NPS surveys |
| GET/POST | `/api/v1/kb/*` | Knowledge base |
| GET/POST | `/api/v1/faqs/*` | FAQ management |
| GET/POST | `/api/v1/reports/*` | Report generation |
| GET/POST | `/api/v1/billing/*` | Billing proxy |
| GET/POST | `/api/v1/integrations/*` | Integration management |
| GET/POST | `/api/v1/workflows/*` | Workflow engine |
| GET | `/api/v1/service/health` | Service health check (public) |

### Intelligence Routes: `/api/intelligence/`

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/intelligence/health` | Get health score (proxied from SaaS Admin) |
| POST | `/api/intelligence/health/calculate` | Request health score calculation |
| GET/POST | `/api/intelligence/recommendations` | Get/generate recommendations |

### Deprecated Routes

| Route | Replacement | Note |
|---|---|---|
| `POST /api/v1/health/calculate` | `POST /api/intelligence/health/calculate` | Returns deprecation headers |

### Webhooks: `/api/webhooks/`

Receives events from Twilio, Resend, and other external services.

---

## 11. Core Services (Business Logic Layer)

Located in `libs/core/services/`. These are pure TypeScript classes — they do NOT touch HTTP. They are called by API routes.

| Service File | What It Does |
|---|---|
| `analytics.ts` | Aggregates analytics data from the CS Core DB |
| `billing-proxy.ts` | Proxies billing queries to Tenant Billing service |
| `communication-sender.ts` | Sends emails, SMS, calls via Twilio/Resend |
| `crm-sync.ts` | Syncs data with SaaS Admin CRM |
| `csat-nps-survey.ts` | Manages CSAT and NPS survey lifecycle |
| `customer-success-dashboard.ts` | Builds data for the CSM dashboard |
| `customer-transfer.ts` | Handles customer account transfers between CSMs |
| `expansion-triggers.ts` | Detects and manages upsell/expansion opportunities |
| `faq-repository-service.ts` | Manages FAQ content |
| `health-scoring.ts` | **Proxy only** — fetches from SaaS Admin, no local computation |
| `integration-management.ts` | Manages third-party integration settings |
| `master-dashboard.ts` | Top-level dashboard aggregation |
| `post-onboarding-flows.ts` | Post-onboarding automation flows |
| `renewal-orchestration.ts` | Full renewal pipeline management |
| `report-generator.ts` | Generates PDF/CSV reports |
| `scheduled-reports.ts` | Cron-driven report scheduling |
| `service-registry.ts` | Registers this service with Internal Ops |
| `success-playbooks.ts` | Manages and executes CSM playbooks |
| `tag-sync.ts` | Syncs tags with SaaS Admin |
| `trend-analysis.ts` | Analyzes customer metric trends |
| `unified-dialer-service.ts` | Manages the unified phone dialer |
| `usage-analytics.ts` | Tracks customer product usage |
| `workflow-engine.ts` | Powers the visual workflow automations |
| `whatsapp-voice-service.ts` | WhatsApp and voice message handling |

---

## 12. Repositories (Data Access Layer)

Located in `libs/core/repositories/`. Each repository wraps Supabase queries for one domain.

| Repository | Tables It Accesses |
|---|---|
| `activity-feed.ts` | `cs_team_activity_feed` |
| `agent-executions.ts` | `cs_core_agent_executions` |
| `call-logs.ts` | Call log tables |
| `conversations.ts` | `cs_messages` / conversation threads |
| `customer-churn-risk.ts` | Churn risk data |
| `customer-health.ts` | Customer health records (display only) |
| `customer-success-metrics.ts` | CS performance metrics |
| `integrations.ts` | Integration configurations |
| `kb.ts` | `cs_knowledge_base` |
| `messages.ts` | `cs_messages` |
| `team-members.ts` | `cs_team_members` |
| `tenant-configuration.ts` | Tenant settings and config |
| `tickets.ts` | `cs_tickets` |

### Usage Pattern

```typescript
import { TicketsRepository } from '@/lib/core/repositories/tickets'

const tickets = await TicketsRepository.findByTenant(tenantId)
```

---

## 13. Middleware Stack

Each API request may pass through multiple middleware layers:

### 1. Clerk Middleware (`middleware.ts`)

Global — runs on every request. Redirects unauthenticated users to `/sign-in`.

### 2. Auth Middleware (`libs/core/middleware/auth.ts`)

Within API routes, wraps handlers to require a valid Clerk session:

```typescript
export function withAuth(handler) { ... }       // Requires auth
export function withTeamMember(handler) { ... } // Requires team member mapping
export function withRole(role, handler) { ... } // Requires specific role
```

### 3. API Key Middleware (`libs/core/middleware/api-key.ts`)

For service-to-service endpoints. Validates `X-API-Key` or `Authorization: Bearer` header:

```typescript
export function withApiKey(handler) { ... }
export async function verifyApiKey(req): Promise<boolean>
```

### 4. Rate Limit Middleware (`libs/core/middleware/rate-limit.ts`)

Prevents abuse. Two patterns:
- `withRateLimit(config, handler)` — wraps a handler
- `checkRateLimit(req, config)` — inline check in a route

Uses in-memory store in development. **In production, replace with Redis.**

### 5. Audit Log Middleware (`libs/core/middleware/audit-log.ts`)

Logs sensitive operations to `cs_audit_logs`:

```typescript
await logAuditEntry({
  action: 'ticket_resolved',
  resource_type: 'ticket',
  resource_id: ticketId,
  ...
})
```

### 6. Compliance Validator (`libs/core/middleware/compliance-validator.ts`)

Validates requests against compliance rules before processing.

---

## 14. Service-to-Service Integrations

### SaaS Admin (3001) — Most Important Integration

CS Core calls SaaS Admin for **all intelligence data**. The gateway is `libs/core/intelligence/client.ts`:

```typescript
// Get health score for a customer
import { getHealthScore } from '@/lib/intelligence/client'
const response = await getHealthScore(tenantId, customerEmail)

// Get AI recommendations
import { getRecommendations } from '@/lib/intelligence/client'
const response = await getRecommendations(tenantId)

// Record that a recommendation was acted on
import { recordRecommendationOutcome } from '@/lib/intelligence/client'
await recordRecommendationOutcome(recommendationId, { action_taken: true, success_flag: true })
```

Authentication: `X-API-Key: SAAS_ADMINISTRATION_SERVICE_API_KEY`  
Timeout: 8 seconds (15 seconds for calculations)

### Internal Ops (3006) — Service Registry

CS Core registers itself on startup and sends a heartbeat every 5 minutes via `libs/core/services/service-registry.ts`.

```env
SERVICE_NAME=cs-core
SERVICE_TYPE=customer_success_core
SERVICE_PORT=3061
SERVICE_HEARTBEAT_INTERVAL_S=300
```

### Tenant Billing (3016) — Billing Proxy

CS Core does not own billing data. It proxies via `libs/core/services/billing-proxy.ts`.

### SaaS Admin Tag Sync

Tags applied to customers in CS Core are synced back to SaaS Admin via `libs/core/services/tag-sync.ts`.

---

## 15. External Integrations (Third Parties)

### Twilio (SMS + Voice)

Used for SMS and outbound calls.

- **Account SID:** `AC****` (stored in `.env.local`)
- **Primary number:** `+13269991112`
- **Testing number:** `+12727771112`
- Service: `libs/core/services/unified-dialer-service.ts`, `whatsapp-voice-service.ts`

Webhooks from Twilio land at `/api/webhooks/`.

### Resend (Primary Email)

- **From:** `support@intakely.xyz` (Benjamin - TrueVow Support)
- **API Key env:** `RESEND_CS_SUPPORT_API_KEY`
- **Webhook:** `/api/webhooks/resend`
- Service: `libs/core/services/communication-sender.ts`, `enhanced-email-service.ts`

### SendGrid (Secondary Email)

- **From:** `shah@intakely.ai` (TrueVow Intake)
- **API Key env:** `SENDGRID_API_KEY`

### Deepgram (Speech-to-Text)

- **API Key env:** `DEEPGRAM_API_KEY`
- Used for transcribing voice calls

### Cartesia (Text-to-Speech)

- **API Key env:** `CARTESIA_API_KEY`
- Used for AI voice responses

### Grafana (Monitoring)

- **Stack URL:** `https://truthline.grafana.net`
- Used for production dashboards and alerts

### GitHub

- **Repo:** `https://github.com/truevow-ai/Customer_Success_Support_Service.git`

---

## 16. Key Use Cases — End to End

### Use Case 1: Customer Submits a Support Request

1. Customer submits via email, SMS, chat, or form
2. Webhook or API receives the message
3. `POST /api/v1/tickets` creates a `cs_tickets` record
4. `cs_messages` record is created for the initial message
5. SLA targets are calculated and stored
6. Activity feed entry is created
7. Assigned CSM is notified (email via Resend)
8. CSM responds through the dashboard → new `cs_messages` record

### Use Case 2: CSM Views a Customer's Health Score

1. CSM opens customer profile in dashboard
2. UI calls `GET /api/intelligence/health?tenant_id=X&customer_email=Y`
3. Route handler calls `getHealthScore()` from `intelligence/client.ts`
4. Client sends request to SaaS Admin `GET /api/v1/health/score`
5. SaaS Admin returns the computed score
6. CS Core displays it — **no local storage, no caching**

### Use Case 3: Onboarding a New Law Firm

1. SaaS Admin notifies CS Core (via webhook or API call) that a tenant completed signup
2. CS Core creates a `cs_customer_post_onboarding` record
3. `post-onboarding-flows.ts` kicks off the onboarding sequence
4. Automated emails are sent at scheduled intervals
5. CSM reviews progress on the dashboard
6. Onboarding steps are marked complete as the firm progresses

### Use Case 4: Renewal Pipeline

1. `renewal-orchestration.ts` detects a tenant approaching renewal date
2. Renewal record is created in `cs_renewal_*` tables
3. Automated outreach sequence begins (email + calls)
4. CSM receives renewal task in dashboard
5. Outcome (renewed / churned / downgraded) is recorded

### Use Case 5: AI Recommendation Acted On

1. CSM views AI recommendation fetched from SaaS Admin
2. CSM clicks "Done" after making the recommended call
3. UI calls `POST /api/intelligence/health/calculate` (to trigger re-evaluation)
4. `recordRecommendationOutcome()` sends outcome to SaaS Admin
5. SaaS Admin intelligence engine learns from the outcome for future recommendations

---

## 17. Critical Architectural Rules — Never Violate

These rules are permanently enforced in `.cursor/rules/task-completion-verification.mdc`.

### Rule 1: CS Core Never Computes Health Scores

```
WRONG: const score = HealthScoringService.computeEngagementScore(...)
RIGHT: const response = await getHealthScore(tenantId, email)
```

### Rule 2: CS Core Never Caches Intelligence Data

```
WRONG: await redis.set(`health:${tenantId}`, JSON.stringify(score))
RIGHT: Always call intelligence/client.ts — let SaaS Admin be the source of truth
```

### Rule 3: CS Core Never Stores Lead Data

```
WRONG: ALTER TABLE cs_tickets ADD COLUMN lead_id UUID
RIGHT: Lead data stays in SaaS Admin / Tenant App. CS Core works with tenant_id + customer_email.
```

### Rule 4: CS Core Never Imports from Sales CRM's Logic

```
WRONG: import { LeadScorer } from '@sales-crm/scoring'
RIGHT: CS Core is entirely separate from Sales CRM
```

### Rule 5: Intelligence Access Only Through intelligence/client.ts

```
WRONG: const res = await fetch('http://localhost:3001/api/v1/health/score', ...)  // inline fetch
RIGHT: import { getHealthScore } from '@/lib/intelligence/client'
```

### Table Ownership Quick Reference

| Table | Owner | CS Core Access |
|---|---|---|
| `leads` | SaaS Admin / Tenant App | None |
| `portal_behavior_events` | SaaS Admin | None (emit via API only) |
| `health_scores` | SaaS Admin | Read via intelligence/client.ts |
| `recommendations` | SaaS Admin | Read via intelligence/client.ts |
| `recommendation_outcomes` | SaaS Admin | Write via intelligence/client.ts |
| `cs_tickets` | CS Core | Full ownership |
| `cs_customer_post_onboarding` | CS Core | Full ownership |
| `cs_team_members` | CS Core | Full ownership |

---

## 18. Edge Cases to Know

### Edge Case 1: SaaS Admin Is Down

If SaaS Admin is unreachable when CS Core requests a health score:
- `getHealthScore()` in `intelligence/client.ts` has an 8-second timeout (`AbortSignal.timeout(8000)`)
- `HealthScoringService.getHealthScore()` catches errors and returns `null`
- The UI should gracefully show "Health score unavailable" — **never crash**
- Check: Is `SAAS_ADMINISTRATION_SERVICE_URL` set correctly in `.env.local`?

### Edge Case 2: Tenant ID vs Customer Email

CS Core identifies customers by `tenant_id` (the law firm) + `customer_email` (the specific person). If either is missing:
- Health score calls will fail (SaaS Admin requires both)
- Tickets can be created with just `customer_email` (tenant_id is derived from the authenticated user's context)

### Edge Case 3: Clerk User Not Mapped to a Team Member

New CSMs authenticate via Clerk but may not be in `cs_team_members` yet. The legacy `requireTeamMember()` will throw. The new scope-aware `requireInternalUser()` is more permissive. During onboarding of new staff, ensure their Clerk user ID is mapped in `cs_team_members`.

### Edge Case 4: Rate Limit in Production (In-Memory Store)

The current `rate-limit.ts` uses an **in-memory store**. In production with multiple instances, each instance has its own counter — rate limits are NOT shared across instances. This is a known issue. The comment in the code says "in production, use Redis." Do not ship high-traffic endpoints without moving to Redis-backed rate limiting.

### Edge Case 5: Deprecated Health API

The route `POST /api/v1/health/calculate` still exists but returns deprecation headers:
- `X-Deprecated: true`
- `X-Migration-Date: 2026-06-01`
- Response body includes `_deprecated: true`

Any internal service still calling this should be migrated to `POST /api/intelligence/health/calculate`.

### Edge Case 6: Twilio Webhook Signature Validation

Twilio signs webhook payloads with `Twilio_Auth_Token`. If your webhook endpoint is not validating this signature, any attacker can spoof Twilio events. Ensure `X-Twilio-Signature` is validated in `/api/webhooks/`.

### Edge Case 7: employee_messages.service_type

The `employee_messages` table's `service_type` column is now constrained to `('cs_support')` only (migration 044). Inserting `'sales_crm'` will fail with a check constraint violation. This is intentional — the sales CRM has its own messaging table.

### Edge Case 8: Onboarding Sequence Template Keys

The `020_add_template_key_to_onboarding_sequences.sql` migration adds a `template_key` column. If you seed onboarding sequences without this key, the sequence lookup by `template_key` will return null. Run the seed script in `scripts/` before testing onboarding flows.

---

## 19. Troubleshooting Guide (Staging & Production)

### Problem: Service Won't Start

**Symptom:** `npm run dev` crashes immediately.

**Check:**
1. Is `.env.local` present? Copy from `.env.backup` if needed.
2. Run `npm install` — missing node_modules?
3. Run `npm run typecheck` — TypeScript compile errors?
4. Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set — Clerk fails silently without it.

---

### Problem: 401 Unauthorized on API Calls

**Symptom:** API returns `{ error: "Unauthorized" }`.

**Check:**
1. **Browser user:** Is the Clerk session valid? Check browser cookies. Try signing out and back in.
2. **Service-to-service:** Is the `X-API-Key` header correct? Check `CUSTOMER_SUCCESS_CORE_SERVICE_API_KEY` in the calling service's `.env.local`.
3. **Wrong Clerk app:** Ensure the calling user is authenticated against Clerk App 1 (TrueVow-Platform-Operators), not App 2 or 3.

---

### Problem: Health Score Always Returns Null

**Symptom:** Customer health score shows "N/A" or unavailable.

**Debug steps:**
1. Check `SAAS_ADMINISTRATION_SERVICE_URL` in `.env.local`. Is SaaS Admin running?
2. Check `SAAS_ADMINISTRATION_SERVICE_API_KEY` — does it match the key in SaaS Admin's config?
3. Call SaaS Admin directly: `GET http://localhost:3001/api/v1/health/score?tenant_id=X&customer_email=Y`
4. Check SaaS Admin logs for the request.
5. If SaaS Admin returns 404, the health score has not been computed yet for that tenant — trigger a calculation via `POST /api/intelligence/health/calculate`.

---

### Problem: Emails Not Sending

**Symptom:** Customers not receiving automated emails.

**Check:**
1. Is `RESEND_CS_SUPPORT_API_KEY` valid? Test via Resend dashboard.
2. Is `RESEND_FROM_EMAIL` a verified sender in the Resend account?
3. Check `cs_audit_logs` for email send attempts and error messages.
4. Check Resend's dashboard for bounce/block status on the recipient email.
5. Fall back: Is `SENDGRID_API_KEY` configured as a backup?

---

### Problem: SMS Not Sending

**Symptom:** SMS messages not delivered.

**Check:**
1. Is `Twilio_Account_SID` and `Twilio_Auth_Token` correct in `.env.local`?
2. Is `TWILIO_PHONE_NUMBER` verified and active in Twilio?
3. Check Twilio logs at `console.twilio.com` for the failed message SID.
4. For testing: use `Twilio_Testing_Account_SID` + `TWILIO_TESTING_PHONE_NUMBER`.
5. Are you sending to an international number? Check Twilio geo-permissions.

---

### Problem: Database Query Fails (Supabase Error)

**Symptom:** `{ error: "relation \"table_name\" does not exist" }` or similar.

**Check:**
1. Has the migration been run? Check `infra/database/migrations/` — run any missing `.sql` files against the CS Core Supabase project (`inbwimykrvmxhlmwxamk`).
2. Are you using the correct Supabase client? Server-side routes must use `createServerSupabase()` (service role key). Client-side components use the anon key.
3. Check RLS policies in `003_rls_policies.sql` — the anon key is subject to RLS. If data is unexpectedly missing, RLS may be filtering it out.

---

### Problem: Service Not Appearing in Service Registry

**Symptom:** Internal Ops shows CS Core as "unreachable" or not registered.

**Check:**
1. Is `SERVICE_REGISTRY_URL=http://localhost:3006` correct and is Internal Ops running?
2. Is `SERVICE_REGISTRY_API_KEY` correct?
3. Check `libs/core/services/service-registry.ts` — the registration runs on service startup.
4. Check `SERVICE_HEARTBEAT_INTERVAL_S=300` — the service sends a heartbeat every 5 minutes.

---

### Problem: TypeScript Errors in CI/CD

**Symptom:** Build fails with TypeScript errors.

**Debug:**
```powershell
npm run typecheck 2>&1 | Select-String "error TS"
```

Common causes:
- New function added to `intelligence/client.ts` but not exported with correct types
- `@deprecated` method signature changed but callers not updated
- Missing `await` on async functions returning `Promise<Response>`

---

### Problem: Webhook Not Being Processed

**Symptom:** Twilio or Resend webhook events are being sent but not processed.

**Check:**
1. Is the webhook URL correct? Twilio needs the public URL, not localhost.
2. In staging: Is ngrok or a tunnel running to expose the local service?
3. Check `/api/webhooks/` route for the correct signature validation.
4. Check `RESEND_WEBHOOK_SECRET` matches what's configured in Resend dashboard.

---

### General Debugging Pattern

For any unexpected behavior in production:

```
1. Check cs_audit_logs table — all sensitive operations are logged here
2. Check Next.js server logs (Vercel / hosting platform)
3. Check Grafana (https://truthline.grafana.net) for metrics and alerts
4. Reproduce locally with matching .env.local values
5. Add console.log in the relevant service or repository
6. Run npm run test:integration to check service-level integration
```

---

## 20. Running Tests

```powershell
# All tests
npm run test

# Unit tests only (fast, no external dependencies)
npm run test:unit

# Integration tests (may need services running)
npm run test:integration

# Specific test file
npm run test -- --testPathPattern=service-example

# With coverage report
npm run test:coverage

# Watch mode (reruns on file save)
npm run test:watch
```

### Test Structure

```
tests/__tests__/
├── examples/         # Example tests showing patterns
├── integration/      # Cross-service integration tests
├── unit/             # Unit tests per service
└── ...
```

Tests use Jest + Babel. The `libs/core/intelligence/client.ts` is mocked in tests — do not write tests that make real HTTP calls to SaaS Admin.

---

## 21. Database Migrations

All migrations are in `infra/database/migrations/`.

### Running a Migration

```powershell
# Connect to CS Core database using psql
psql "postgresql://postgres:PASSWORD@db.inbwimykrvmxhlmwxamk.supabase.co:5432/postgres"

# Or using the transaction pooler (for scripts)
psql "postgres://postgres:PASSWORD@db.inbwimykrvmxhlmwxamk.supabase.co:6543/postgres"
```

Then run the file:
```sql
\i infra/database/migrations/044_remove_lead_references_from_cs_core.sql
```

### Migration Numbering

- Files `001` through `044` have been applied to production
- New migrations: increment the number (`045_...`)
- Name format: `NNN_short_description.sql`
- Always wrap migrations in `BEGIN; ... COMMIT;` for atomicity

### Special Files

| File | Purpose |
|---|---|
| `SAAS_ADMIN_BEHAVIORAL_INTELLIGENCE_SCHEMA.sql` | Reference schema for SaaS Admin team (NOT for CS Core DB) |
| `SAAS_ADMIN_ONBOARDING_SCHEMA.sql` | Reference schema for SaaS Admin onboarding tables |
| `ensure_cs_onboarding_sequences_for_seed.sql` | Helper for seeding onboarding data |

---

*Last updated: 2026-03-08 | Maintained by the TrueVow engineering team*
