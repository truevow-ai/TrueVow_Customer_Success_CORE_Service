# Documentation Update Plan - CS-Support Split

**Last Updated:** February 15, 2026  
**Status:** Plan ready; enterprise docs in TrueVow-Documentation repo pending update  
**Related:** `MILESTONE_CS_SPLIT_CHECKPOINT.md`, `IMPLEMENTATION_PROGRESS.md`

---

## Executive Summary

The monolithic CS-Support Service has been successfully split into two independent services (Customer-Success-CORE + First-Line-Support) as part of TrueVow's evolution from a 5-service to **6-service** enterprise architecture. This document:

1. Summarizes the architecture change and implementation status.
2. Lists the **specific sections** in each main TrueVow documentation file that need updates.
3. Provides a **line-level checklist** and **priority order** for updating docs in the **TrueVow-Documentation** repo.

---

## Architecture Summary

### Before (5-Service Model)

| # | Service              | Port | Notes                                      |
|---|----------------------|------|--------------------------------------------|
| 1 | Platform Service     | 3000 | Tenant, billing, config                     |
| 2 | Sales-CRM Service    | 3002 | Pipeline, demos                             |
| 3 | **CS-Support Service** | 3003 | **Monolithic** – internal CS + customer support |
| 4 | Internal Ops Service | 3004 | HR, IT, admin                              |
| 5 | Tenant Application   | 8000 | Multi-tenant APIs, Customer Portal          |

### After (6-Service Model)

| # | Service                         | Port | Clerk | LLM   | Purpose                    |
|---|---------------------------------|------|-------|-------|----------------------------|
| 1 | Platform Service                | 3000 | —     | No    | Tenant, billing, config     |
| 2 | Internal Ops Service            | 3001 | —     | No    | Admin, ops                  |
| 3 | Tenant Application              | 8000 | —     | No    | Multi-tenant APIs           |
| 4 | Sales-CRM Service               | 3002 | —     | No    | Pipeline, demos             |
| 5 | **Customer-Success-CORE-Service** | **3003** | App 1 (HIGH)   | **No**  | Internal CS only           |
| 6 | **First-Line-Support-Service**  | **3008** | App 2 (MEDIUM) | **Yes** | Customer-facing support     |

### Service Responsibilities

**Customer-Success-CORE-Service (LLM-Free, Internal-Only)**  
- Port: 3003 · Clerk App 1 (HIGH TRUST) · Repo: `TrueVow_Customer_Success_CORE_Service`  
- CSM dashboards, tenant health scoring, onboarding workflows, playbooks, churn risk, renewal orchestration, JTBD/RevOps, time tracking, internal collaboration.

**First-Line-Support-Service (LLM-Enabled, Customer-Facing)**  
- Port: 3008 · Clerk App 2 (MEDIUM TRUST) · Repo: `TrueVow_First_Line_Support_Service`  
- Multi-channel inbox (Email, SMS, WhatsApp, Chat, Voice), AI agents (e.g. Benjamin), Knowledge Base, CSAT/NPS, ticket management, SLA, communication templates, Beacon/customer portal.

### Security Model

- **Clerk App 1 (HIGH TRUST):** Customer-Success-CORE only – internal CSMs/executives.
- **Clerk App 2 (MEDIUM TRUST):** First-Line-Support – support agents and customer-facing.
- **Clerk App 3:** Reserved.
- **LLM:** CORE = ❌ no LLM; First-Line = ✅ LLM authorized. Both share `cs_support_db` with different access patterns.

### Implementation Status

- ✅ First-Line-Support build complete (skeleton, Clerk App 2, routing).
- ✅ CS-Support-CORE cleanup complete (customer-facing/LLM components removed; tsc, lint, build passing).
- ✅ Documentation update plan created (this document).

---

## Documents to Update (TrueVow-Documentation Repo)

All target files live under:  
`C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow-Documentation\`

---

### Document 1: TrueVow_PRD.md

**Path:** `TrueVow-Documentation\TrueVow_PRD.md`

#### Line-level checklist (high level)

- **~742:** Section title "5-SERVICE MODEL" → **"6-SERVICE MODEL"**
- **~744:** Version "1.0" → **"2.0"**
- **~745:** Date "December 26, 2025" → **"February 14, 2026"**
- **~750:** Description updated for CS-Support split completion
- **~888–923:** Service list – Customer-Success-CORE-Service and First-Line-Support-Service: Status ✅ Active (Split complete January 2026), label ⭐ SPLIT FROM CS-SUPPORT

#### Sections requiring updates

1. **Service Architecture Overview (~11452–11500)**  
   - Change to 6-service model; split CS-Support into CORE (3003) and First-Line (3008); update diagram and descriptions.

2. **CS-Support Service Section (~11885–12150)**  
   - Rename to "Customer-Success-CORE-Service"; add "First-Line-Support-Service"; CORE version 2.0, status CS-Support Split COMPLETE.

3. **LLM Security (throughout)**  
   - Replace "CS-Support has LLM access" with: CORE = NO LLM; First-Line = LLM AUTHORIZED.

4. **Integration References**  
   - Customer Portal / other consumers: integrate with First-Line-Support-Service; update API endpoints, client libs, env vars.

---

### Document 2: TRUEVOW_COMPLETE_SYSTEM_DOCUMENTATION.txt

**Path:** `TrueVow-Documentation\TRUEVOW_COMPLETE_SYSTEM_DOCUMENTATION.txt`

#### Line-level checklist

- **~50:** Version "10.6" → **"10.7"**
- **~51:** Date → **"February 14, 2026"**
- **~1000–1200:** 6-service architecture diagram and descriptions
- **~1500–1700:** CS-Support section → reflect split (CORE vs First-Line)
- **~2000–2200:** Detailed descriptions for both services (repos, DB, Clerk App, LLM, responsibilities)

#### Sections requiring updates

- **6-Service Model (~50–150):** Service 3 = Customer-Success-CORE-Service; Service 4 (or appropriate slot) = First-Line-Support-Service; ports 3003 / 3008; Clerk App 1 vs 2; LLM restrictions.
- **Service details:** CORE (repo `TrueVow_Customer_Success_CORE_Service`, cs_support_db, App 1, no LLM, responsibilities as above); First-Line (repo `TrueVow_First_Line_Support_Service`, same DB, App 2, LLM, responsibilities as above).
- **Security:** 3-domain Clerk model; LLM access control; inter-service security.

---

### Document 3: TrueVow-Complete-System-Technical-Documentation-for-Developers.md

**Path:** `TrueVow-Documentation\TrueVow-Complete-System-Technical-Documentation-for-Developers.md`

#### Line-level checklist

- **~100–200:** Service architecture overview → 6 services, split CORE/First-Line
- **~300–500:** Technical specs for all 6 services
- **~800–1000:** Deployment/infrastructure
- **~1200–1400:** Security and authentication (Clerk 3-domain, LLM)
- **~1600–1800:** API integration and communication (CORE ↔ First-Line)

#### Sections requiring updates

- **Architecture overview:** 6-service diagrams; CORE vs First-Line; version (e.g. v10.7).
- **Per-service specs:** CORE (stack, APIs, DB, auth, integrations); First-Line (stack, LLM, APIs, channels, security, scaling).
- **Inter-service:** API contracts CORE ↔ First-Line; discovery; security; monitoring/logging.
- **Security:** Clerk 3-domain implementation; LLM controls; data isolation; audit; compliance.

---

## Priority Order

### High (do first)

1. TrueVow_PRD.md – architecture overview and CS-Support → CORE + First-Line sections.
2. TRUEVOW_COMPLETE_SYSTEM_DOCUMENTATION.txt – 6-service model and service list.
3. TrueVow-Complete-System-Technical-Documentation-for-Developers.md – technical specs and diagrams.

### Medium

- LLM security policy wording across all three.
- Integration patterns and API contract summary.

### Low

- Implementation runbooks, migration procedures, future enhancements.

---

## Implementation Approach

- Backup each document before editing.
- Update section by section using the locations above.
- Keep terminology consistent (Customer-Success-CORE-Service, First-Line-Support-Service, ports 3003/3008, Clerk App 1/2).
- Re-check cross-references and links after updates.

### QA checklist

- [ ] Ports 3003 (CORE) and 3008 (First-Line) correct everywhere
- [ ] Clerk App 1 = CORE, App 2 = First-Line
- [ ] CORE = no LLM, First-Line = LLM authorized
- [ ] Service boundaries and responsibilities clear
- [ ] Version/dates updated (e.g. 2.0, Feb 2026, v10.7)

---

## Success Criteria

- [ ] All three main TrueVow-Documentation files updated to 6-service architecture
- [ ] Customer-Success-CORE-Service documented as LLM-free
- [ ] First-Line-Support-Service documented as LLM-enabled
- [ ] Clerk 3-domain model clearly explained
- [ ] Cross-references and links valid
- [ ] Consistent naming and versioning

---

## References (this repo)

- **Checkpoint:** `docs/01-main/MILESTONE_CS_SPLIT_CHECKPOINT.md`
- **Progress:** `docs/01-main/IMPLEMENTATION_PROGRESS.md`
- **This service PRD:** `docs/CS_SUPPORT_SERVICE_PRD.md` (already 6-service and CORE-focused)
- **First-Line onboarding:** `docs/01-main/FIRST_LINE_SUPPORT_SERVICE_ONBOARDING.md` – for the First-Line-Support repo: directory, shared DB (cs_support_db), table ownership, working alongside CORE
