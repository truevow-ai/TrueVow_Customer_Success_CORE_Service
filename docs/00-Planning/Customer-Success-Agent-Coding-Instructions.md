# Customer Success CORE — Coding Agent Operating Instructions
## Read This Before Writing a Single Line of Code

**Version:** 1.0
**Date:** July 2026
**Classification:** Engineering — Required Reading
**Service:** TrueVow Customer Success CORE — internal CSM operations hub for tenant health monitoring, onboarding workflows, churn-risk detection, renewal orchestration, JTBD, and RevOps reporting
**Trust domain:** PLATFORM OPERATORS (Clerk App "TrueVow-Internal") — internal, platform-scoped
**Prerequisite:** `docs/CS_SUPPORT_SERVICE_PRD.md`, the platform AGENTS.md, ADR-000 (Clerk over Auth0)

> This document is the operating standard for every line of code in Customer Success CORE. It is not a set of guidelines. Any deviation requires explicit justification in the PR description and sign-off from the product owner.

---

## The One Thing That Matters Most

The people Customer Success CORE serves are **TrueVow's Customer Success Managers (CSMs)** — the frontline operators responsible for keeping law-firm tenants healthy, retained, and growing. A CSM manages a portfolio of firms in a region. Their dashboard is the only signal they have that a tenant is slipping toward churn. Their onboarding checklist is the only path a new tenant follows from contract-sign to live product. Their renewal workflow is the only mechanism that prevents a contract from lapsing silently.

Every decision you make — every health score algorithm, every onboarding step, every churn-risk indicator, every renewal reminder, every CSAT data point — must be made with the awareness that **the CSM is flying blind without this dashboard.** A single missed signal here means a paying law firm churns without anyone knowing it was about to happen.

Not a dashboard. Not a metric. **The early-warning system for the company's recurring revenue.**

If a tenant health score drops from "healthy" to "at-risk" and the CSM is not notified for three days, you have failed — the retention window closes, and a firm that could have been saved is now a cancellation. If a silently dropped inbox message from a tenant goes unanswered, you have failed — a real firm with a real problem thinks TrueVow abandoned them, and trust is broken. If an onboarding step is skipped or lost and a new tenant never goes live, you have failed — the deal is functionally lost, and the sales team's work is wasted. If CSAT or NPS data is corrupted, you have failed — satisfaction measurement becomes useless, and the product team makes roadmap decisions on bad data. If renewal orchestration fails and a contract lapses silently, you have failed — monthly recurring revenue drops without a single alert, and by the time Finance notices, the tenant has already started evaluating alternatives.

The CSMs using this dashboard trust you. They will assume the health score they see reflects reality. They will assume the inbox message they answered was the only one that arrived. They will assume the onboarding workflow completed all its steps.

Everything below exists because breaking it eventually loses a tenant, erodes trust, or blinds the company to a revenue leak.

---

## Part 0 — What Customer Success CORE Is (So You Don't Break It)

Customer Success CORE is a **Next.js 14 App Router web dashboard** that CSMs use to monitor and manage the health, onboarding, retention, and renewal of every law-firm tenant on the platform. It is **not customer-facing** — no tenant attorney ever sees this interface.

The defining architectural fact: **this service is LLM-free.** After the February 2026 CS-Support split, all LLM-based first-line-support and AI chat capabilities were moved to the separate, now-archived First-Line-Support service. Customer Success CORE handles the deterministic, data-driven CSM operations: tenant health scoring, onboarding workflow orchestration, churn-risk detection, renewal tracking, JTBD (Jobs-To-Be-Done) integration, and RevOps reporting. No Claude, no Kimi, no Gemini, no LLM of any kind belongs in this repository. If a feature requires an LLM call, it belongs in a different service.

Two constraints are non-negotiable and predate you:
1. **Platform operators are not firm-scoped — tenant-boundary enforcement is critical.** A CSM managing Firm A must never see Firm B's data unless Firm B is explicitly in their portfolio. Tenant data isolation applies across CSM portfolios, not just across tenants. Every query that fetches tenant data includes a `tenant_id` filter scoped to the CSM's assigned portfolio.
2. **Health scores, churn-risk flags, and renewal dates drive real operational decisions.** A wrong score wastes a CSM's limited time on a healthy tenant while the truly at-risk firm goes unattended. Every scoring algorithm is versioned, testable, and auditable. Every threshold change is logged.

---

## Part 1 — Build Philosophy

### 1.1 Boring is a Feature
Do not adopt a new charting library because it is trendier, or a new data-fetching pattern because it appeared in a blog post. Use the stack that is already in production: Next.js 14 App Router, React Query, Tailwind CSS, shadcn/ui, Supabase, Clerk. Boring code still works in three years when the person who wrote it is gone. **The test:** *Has this been done 10,000 times and does it have a Stack Overflow answer from 2018?* If yes, do it that way.

### 1.2 Simple is Not Simplistic
Simple code is the hardest code to write — it requires understanding the problem deeply enough to solve it without cleverness. Simple code has one component that does one thing, names that say what they contain, hooks short enough to fit on one screen, no nested ternaries or magic, and comments that explain *why*. **Junior developer test:** can a developer who has never seen this codebase understand a component in 30 seconds? If not, rewrite it.

### 1.3 No Premature Abstractions
The `HealthScoreEngine` exists because tenant-health calculation is a versioned, testable algorithm that affects CSM prioritization. The `OnboardingWorkflowEngine` exists because multi-step legal-firm onboarding has real state-machine complexity. Everything else: build the simplest thing that works today. **Write a component three times before you abstract it.** If you are writing the fourth copy, abstract then — not before.

### 1.4 The CSM Is Always Right About Their Experience
If a real CSM would be confused by a health score indicator, miss a churn warning because it was buried, or be unable to find a tenant's onboarding status, the behavior is wrong — even if it is technically correct. When unsure about a UI decision, ask: *what would a busy CSM managing 30+ tenants, about to join a renewal call, expect to see here?* Build that.

---

## Part 2 — Code Quality Rules (Non-Negotiable)

### 2.1 Every Component and Function Does One Thing
A function that does two things is two functions. Max length is what fits on one screen (~40-50 lines). A React component that renders both a health score chart and an onboarding-progress tracker is two components, not one.

### 2.2 Name Everything Like a Sentence
Code is read far more than written. `useTenantHealthScore(tenantId: string)` — not `useScore(id)`. Never single-letter names outside loop indexes. Never abbreviate unless the full word exceeds 15 characters. Never name a variable `data`, `result`, `info`, `obj`, `thing`, or `stuff`.

### 2.3 Explicit Over Implicit
Never rely on implicit behavior when explicit is available. Named arguments, not positional. Zod schemas for API input and health-score configuration. Every health-score threshold is a named constant with a comment explaining the business reason — `AT_RISK_THRESHOLD`, not `0.6`.

### 2.4 Type Everything — TypeScript Strict Mode
Every function signature, React prop, API route parameter, and Supabase query result is typed. Run `tsc --noEmit` on every commit and fail CI on errors. `strict: true` in `tsconfig.json` is the floor, not the ceiling. ESLint with `@typescript-eslint` catches what tsc does not.

### 2.5 Handle Every Error Path — Especially in Health Scoring and Renewal Workflows
No bare `catch {}`, no swallowed promises, no silent failures. A health score that silently fails to compute leaves the CSM with a stale score from last week — and they make a retention call on data that is 7 days out of date. A renewal-reminder notification that fails to deliver means a contract lapses silently.

```typescript
// Wrong — swallowed failure, CSM sees stale data
try {
  const score = await healthEngine.calculate(tenantId);
} catch {}

// Right — explicit, observable, CSM sees a clear state
try {
  const score = await healthEngine.calculate(tenantId);
  return { status: "current", score };
} catch (error) {
  logger.error("Health score calculation failed", {
    tenantId,
    errorCode: error instanceof HealthScoreError ? error.code : "UNKNOWN",
    lastComputedAt: lastKnownScore.timestamp,
    // Never log tenant PII or customer communication content here
  });
  return { status: "stale", score: lastKnownScore.value, staleDays };
}
```

### 2.6 DRY — But Not at the Cost of Clarity
Don't Repeat Yourself is a guideline, not a religion. If extracting a shared helper forces a reader to jump files to understand how churn risk is computed, the duplication is better. **Never** share health-score logic between two different tenant tiers (Standard vs. Enterprise) just to save lines — they have different success criteria, and a shared function conflates them.

### 2.7 Comments Explain Why, Not What

```typescript
// Wrong — restates the code
// flag the tenant as at-risk
tenant.atRisk = true;

// Right — explains the operational consequence
// At-risk flag triggers: (1) immediate CSM dashboard notification, (2) creation of a
// retention playbook task, (3) a 48-hour escalation timer. If the tenant is not marked
// healthy within 48 hours, the regional CSM lead gets an email. The threshold is
// intentionally conservative — false positives cost a CSM 10 minutes; false negatives
// cost a tenant.
tenant.atRisk = true;
```

### 2.8 Write the Test Before You Think You're Done
Every piece of business logic has a test before the PR opens — not after. The pyramid: unit tests for health-score calculation, churn-risk thresholds, onboarding-step state transitions, and renewal-date logic; integration tests for onboarding workflow orchestration; contract tests for JTBD and RevOps ingestion endpoints. Coverage floor is 80%; the **health-score engine, churn-risk detection, and renewal orchestration must be at 95%+** and must have tests proving they flag the right tenants and trigger the right notifications on known fixture data.

---

## Part 3 — Architecture Rules (Non-Negotiable)

### 3.1 One File Per Feature Domain / One Folder Per Concern
Follow the repo layout exactly. Tenant health lives in `app/(dashboard)/health/` and `app/api/health/`. Onboarding workflows live in `app/(dashboard)/onboarding/` and `app/api/onboarding/`. Renewal orchestration lives in `lib/services/renewal/`. Do not put two domains' logic in one file because they "share a chart."

### 3.2 Never Edit Shared Infrastructure to Fix One Feature
This rule has its own section because the mistake is catastrophic. `middleware.ts`, the Supabase client singleton, the `CSMAuthProvider`, and the shared health-score calculation core are **shared infrastructure**. A change there to satisfy one feature can silently break the health scores, onboarding states, and renewal reminders for every tenant and every CSM.

- New feature behavior goes in the feature's own folder.
- Changes to shared files require the four-eyes review in Section 6.2 and a full regression test run.
- If you feel you must edit a shared file, flag it in the PR description with an explicit risk assessment.

### 3.3 No Business Logic in API Route Handlers
Next.js API route handlers are for HTTP — parse, authorize, delegate, respond. Business logic lives in service modules under `lib/services/` or `services/`. No database queries in route handlers. No health-score calculation in route handlers. Route handlers validate input with Zod, check authorization, call a service function, and format the response. Nothing more.

### 3.4 The Service Layer Owns Business Logic
Every service module takes its dependencies via constructor injection or function parameters and is testable without a live Supabase connection, a live Clerk session, or a live integration with external services. A health-score engine you cannot unit-test is a health-score engine you cannot trust.

### 3.5 Database Access is Explicit — and Always Tenant-Scoped to the CSM's Portfolio
Use the Supabase client with explicit select columns; never `select("*")`. **Every query that touches tenant-specific data includes a `tenant_id` filter and is scoped to the CSM's assigned portfolio.** A CSM managing a region of 30 firms must never see data for a firm outside their portfolio. The portfolio-scoping is enforced at the API layer via `AuthContext.assignedTenants` — never rely on the UI alone to filter what data is fetched.

### 3.6 No LLM Calls in This Repository — Ever
After the February 2026 CS-Support split, this CORE service is explicitly LLM-free. No Anthropic SDK, no Google GenAI, no OpenAI, no local model imports. If a feature concept begins with "we'll use an LLM to..." — stop. That feature belongs in the First-Line-Support service or a new service. This is a hard rule, not a preference. A Next.js bundle with an LLM SDK in its dependency tree is a failed PR.

### 3.7 Environment Variables Are the Only Configuration
No hardcoded URLs, keys, thresholds, health-score parameters, or integration endpoints. Every value that differs between environments is an env var. Keep `.env.example` current in the **same PR** that adds a variable. Never commit a real `.env` or `.env.local`.

### 3.8 Explicit Disabled State — Never Infer Capability from Absence
Every optional capability (a notification channel, a churn-risk model variant, a JTBD integration) has an explicit `disabled` state via env var. An absent env var is a misconfiguration, not an "off" switch. A feature that reads a disabled integration raises immediately with a message that tells the developer exactly what to set and why — never a silent wrong default.

### 3.9 Auth — Consume `@truevow/auth-client`, Never Import Clerk Directly
Clerk (App "TrueVow-Internal") is the platform-wide auth standard for internal services. The Customer Success CORE frontend consumes the shared `@truevow/auth-client` (`ClerkWrapper`) — it never imports `@clerk/nextjs` directly. The middleware verifies the Clerk-issued JWT and normalizes claims into an `AuthContext(userId, role, permissions, assignedTenants)`. **Every API route and service consumes `AuthContext`, never a raw Clerk object or JWT field.** Why: services stay testable (mock `AuthContext`), intent stays readable, and any claim change is isolated to one adapter. CSMs have regional portfolios (`assignedTenants: string[]`) — every tenant query is filtered against this list, and a CSM attempting to access a tenant outside their portfolio receives a clear "Not in your portfolio" response, not a generic 403.

### 3.10 Observability Is Part of the Feature
Customer Success CORE ships OpenTelemetry + SigNoz for tracing and metrics, with errors routed to the platform Sentry. Every health-score calculation, every churn-risk evaluation, every onboarding-step completion, every renewal-reminder dispatch, and every failed authorization check emits a span. Metrics must carry `csm_id`, `tenant_id`, `region`, and `action` — never tenant staff PII, customer communication content, or CSAT free-text responses. A health monitoring system you cannot observe in real time is a health monitoring system you cannot debug when a CSM reports a wrong score **right now**.

### 3.11 Schema First — Add Fields Before You Need Them
If the PRD's data model shows a field a future phase will populate, add it now as a nullable column. One migration line today beats a production migration touching every row later.

---

## Part 4 — Access Control, Tenant-Data Boundary & Audit (Zero Tolerance)

### 4.1 Least-Privilege by Role
Every operator has a specific role (CSM, CSM Lead, Readonly/Management) with explicit, auditable permissions. **No shared CSM accounts.** Each CSM's dashboard is scoped to their assigned tenant portfolio — a CSM for the West region sees only West-region tenants. The CSM Lead sees aggregate data across all regions but cannot perform tenant-level actions outside an escalation context. Enforce this at three layers: (1) `AuthContext.assignedTenants` filter in every API route; (2) UI hides or disables controls for tenants outside the CSM's portfolio; (3) the service layer rejects operations on out-of-portfolio tenants.

### 4.2 Audit Every Privileged Mutation
Every health-score threshold change, every onboarding-step manual override, every renewal-date adjustment, every portfolio reassignment, and every manual churn-risk flag writes an immutable row to the audit log. Fields: `operator_id`, `tenant_id`, `action`, `resource_type`, `previous_value`, `new_value`, `timestamp`. No deletion endpoint for audit logs. No UPDATE on audit log rows.

### 4.3 Tenant-Data Boundary — Never Expose One Tenant's Data to the Wrong CSM
This is the single most critical rule in the entire codebase. A CSM assigned to 30 West-region tenants must never see data for an East-region tenant, even accidentally. Every query that fetches tenant data includes a `tenant_id IN (csmsPortfolio)` filter. Every dashboard page displays the region label so the CSM always knows which portfolio context they are viewing. When rendering aggregate views for CSM Leads, never include tenant-level PII or customer-communication content in the aggregate — only anonymized metrics.

### 4.4 PHI-Adjacent Content in Support Views — Treat With Care
Customer communications that surface in CSM dashboards (support inbox messages, onboarding notes, CSAT free-text responses) may contain PHI-adjacent legal-client intake content — injury details, case numbers, medical provider names. Never log the content of these messages. Never include them in Sentry events. Never render them in aggregate dashboards. When displaying them in a tenant-specific CSM view, include a visible reminder that the content may contain confidential information.

### 4.5 CSAT/NPS Data Integrity — Validate Before Storage
CSAT scores, NPS ratings, and survey free-text responses are ingested from external collection points. Validate every input before storage: scores must be within defined ranges (CSAT 1-5, NPS 0-10), free-text must be sanitized (no script injection), and every entry is linked to a valid tenant and timestamp. A corrupted CSAT value in the database corrupts every aggregate report that references it.

### 4.6 Secrets Never Touch Git
Vercel environment variables for production, `.env.local` for dev, `.env.example` (placeholders only) in git. If a secret is ever committed: rotate it first, then scrub history, then notify the team.

---

## Part 5 — The CSM Experience (This Is the Product)

### 5.1 The Dashboard Must Answer "Who Needs Me Right Now?" in Under 5 Seconds
When a CSM opens their dashboard, the most prominent component shows a prioritized list: tenants with descending churn risk, tenants with overdue onboarding steps, and tenants approaching renewal within 30 days. The CSM should never have to hunt for what requires their immediate attention. Sort, filter, color-code. The clock is ticking on every at-risk tenant.

### 5.2 Empty and Error States Are Written for a Non-Technical Person
When a health-score chart fails to load, it says "Health data is currently unavailable. Your last known scores are shown below. Our team has been notified." — never "null," "undefined," "Error 500," or a stack trace. When an onboarding checklist shows no steps, it says "All onboarding steps are complete for this tenant" — never an empty list with no context.

### 5.3 Onboarding Workflows Must Be Immutable and Resumable
Once an onboarding step is completed, it stays completed — no accidental regression. A CSM who loses their session mid-onboarding must be able to resume exactly where they were. Onboarding state is persisted per step, per tenant, in the database, never in browser localStorage or session state.

### 5.4 Renewal Orchestration Cannot Be Missed
Every contract approaching its renewal date triggers a cascading set of reminders: 90 days out (CSM Lead visibility), 60 days out (CSM dashboard notification), 30 days out (CSM email), 14 days out (CSM Lead email + internal ops task), 7 days out (Slack/Mattermost notification). A failed notification dispatch at any step retries and escalates. Never allow a renewal date to pass without at least one alert reaching a human.

### 5.5 Notify the CSM Only When Action Is Needed
Notify (dashboard badge + email) for: a tenant crossing the at-risk threshold, an overdue onboarding step, a renewal 30/14/7 days away, a new support inbox message from a tenant. Dashboard-only (no email) for: health-score recalculations within normal range, routine onboarding step completions. Never notify for background job completions or scheduled metric refreshes.

---

## Part 6 — Code Review Standards

### 6.1 The PR Description Is Part of the Code
Every PR states: what changed (plain English), why (link to PRD/spec), how to test it manually (step by step), and any risks. "Fixed the thing" is not mergeable.

### 6.2 Four-Eyes Rule for High-Stakes Code
Explicit second-reviewer sign-off — a comment confirming the specific concern was checked, not just "approved" — is required for any change that:
- touches a **shared file** (`middleware.ts`, `CSMAuthProvider`, health-score core engine, Supabase client singleton),
- modifies **health-score calculation** logic, thresholds, or inputs,
- modifies **churn-risk detection** rules or thresholds,
- modifies **renewal orchestration** logic, reminders, or escalation paths,
- changes **auth/authorization** or CSM portfolio scoping,
- changes how **tenant PII or customer communications** are accessed, stored, or displayed,
- adds or removes any **dependency** — especially any LLM SDK, which is a hard blocker.

### 6.3 The LLM-Free Dependency Rule
Any PR that adds an LLM SDK (`@anthropic-ai/sdk`, `@google/generative-ai`, `openai`, etc.) to `package.json` or `node_modules` is rejected without review. This is a hard architectural boundary, not a preference. See Section 3.6.

### 6.4 No Dead Code
No commented-out code, no unused imports, no TODOs older than a sprint. The only allowed marker is `// AGENT CHOICE: [description] — flagged for review`, to be resolved next sprint.

---

## Part 7 — Deployment Rules

### 7.1 Production Is Sacred
Production is where real CSMs manage real tenant relationships, and where a missed churn signal or failed renewal reminder means lost recurring revenue. Pipeline: merge to `main` → auto-deploy to staging → full test suite → manual, signed-off production deploy, logged (who/when/what). No production deploys on Friday afternoon. No production deploy that has not run in staging — **including a manual smoke-test of health-score rendering, onboarding-workflow completion, and renewal-reminder dispatch.**

### 7.2 Secrets Never Touch Git
See Section 4.6. Vercel environment variables are the only path for production credentials.

### 7.3 Rollback Must Be Possible in Under 5 Minutes
Every deploy is rollback-able and tested in staging first. A bad deploy that breaks the CSM dashboard means every CSM is blind to tenant health — that is missed retention windows by the hour.

---

## Part 8 — The Simplicity Test

Before marking any work complete, run it through these:

1. **Would a developer joining today understand this code in 30 minutes without asking anyone?** If no: simplify or comment until yes.
2. **Would a CSM managing 30+ tenants, with 5 minutes before a renewal call, find the information they need on this screen without clicking more than once?** If no: fix it.
3. **Does this query, component, or route expose one tenant's data or customer communications to a CSM who is not assigned to that tenant?** If yes: fix before merging.
4. **Does this code import, call, or depend on any LLM library?** If yes: remove it — it belongs in a different service.
5. **If a health-score calculation fails silently or a renewal reminder is not dispatched, will a human notice within 24 hours?** If no: add explicit monitoring and alerting.

---

## The Final Instruction

You are not building a dashboard. You are building the early-warning system for TrueVow's customer relationships — the service that tells a CSM which tenant is about to churn before the tenant themselves knows it, that guides a new firm from contract to live product without a single missed step, and that makes sure no renewal date passes without someone picking up the phone.

The code you write is the difference between a CSM who saved an at-risk tenant because the health score flagged it 14 days early and a CSM who opened the dashboard Monday morning to find a cancellation email that arrived Friday night. It is the difference between a new tenant who went live in 3 days and one who gave up after 2 weeks of onboarding silence. It is the difference between a renewal that happened on time and a lapsed contract that Finance discovered in the monthly close.

Write code like it matters. Because it does.

---

*These instructions apply to every line of code written for Customer Success CORE. They are the operating standard, not guidelines. Any deviation requires explicit justification in the PR description and product-owner sign-off.*

*Last updated: July 2026*
