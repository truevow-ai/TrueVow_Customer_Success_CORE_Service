# First-Line-Support-Service – Onboarding & Handoff

**Audience:** Developers and AI agents working on the **TrueVow_First_Line_Support_Service** repository  
**Purpose:** Pick up from the CS-Support split; understand directory layout, shared database, and how to work alongside Customer-Success-CORE  
**Last Updated:** February 15, 2026  
**Sibling repo:** `TrueVow_Customer_Success_CORE_Service` (this repo – “CORE”)

---

## 1. Where We Are (Context)

The former **monolithic CS-Support Service** was split into two services:

| Service | Repo | Port | Clerk | LLM | Role |
|--------|------|------|-------|-----|------|
| **Customer-Success-CORE** | `TrueVow_Customer_Success_CORE_Service` | 3003 | App 1 (HIGH) | No | Internal CS: dashboards, health, onboarding, playbooks, renewal, JTBD |
| **First-Line-Support** | `TrueVow_First_Line_Support_Service` | 3008 | App 2 (MEDIUM) | Yes | Customer-facing: inbox, tickets, KB, AI agents, CSAT/NPS, voice, Beacon |

- **Split status:** Complete. CORE has been cleaned (customer-facing/LLM code removed); First-Line repo exists as a skeleton with Clerk App 2, routing, and is ready for feature migration.
- **You (First-Line)** own: multi-channel unified inbox, support tickets, messages, Knowledge Base, AI digital agents (e.g. Benjamin), CSAT/NPS collection, voice/telephony UI, SLA tracking, communication templates for support, Beacon/customer-portal integration.
- **CORE** owns: CSM dashboards, tenant health scoring, onboarding workflows, success playbooks, churn/renewal, JTBD/RevOps, time tracking, dialer (for CSM calls), billing-related UI.

You and CORE **share one database** (`cs_support_db`). You use **Clerk App 2**; CORE uses Clerk App 1. You are allowed **LLM access**; CORE is LLM-free.

---

## 2. What You Will Have in the First-Line Repo (Directory)

The First-Line repo was created by copying a subset of the monolith and then cleaning it. You can expect (or will migrate):

- **App structure:** Next.js App Router (`app/`), with routes for:
  - Inbox / unified inbox (conversations, threads)
  - Support tickets (list, detail, create)
  - Knowledge Base (articles, categories)
  - AI agent workspace (Benjamin, triage, suggestions)
  - CSAT/NPS surveys (collection and display)
  - Settings (templates, SLA, team)
  - Beacon / customer portal integration
- **Auth:** Clerk App 2 (MEDIUM TRUST) – same Clerk instance as TrueVow, different application for support agents and customer-facing flows.
- **Libraries:** LLM integrations (e.g. OpenAI/Claude), unified messaging (email/SMS/WhatsApp), voice/telephony clients, Supabase client for `cs_support_db`.
- **No longer in CORE (so they belong in First-Line):** Unified inbox UI, ticket/message UI, KB public and internal UI, AI agent prompts and orchestration, CSAT/NPS survey UI, voice agent UI, Beacon widget. CORE kept: dialer for CSMs, billing, health score, onboarding management, playbooks, workflow engine.

If your repo is still a minimal skeleton, use this doc and the CORE repo’s `app/` and `lib/` (for inbox, tickets, messages, KB, AI, CSAT) as the **source of truth** for what to copy or reimplement in First-Line.

---

## 3. Shared Database: `cs_support_db`

Both services use the **same Supabase project** (database `cs_support_db`). Schema is **`public`** (default). There is no separate “OPS_SERVICE” database; **Internal Ops Service** is another **HTTP service** (see section 5).

### 3.1 Table Ownership (Who Uses What)

Use this to avoid stepping on CORE’s toes and to know which tables you primarily read/write.

**First-Line–primary (you own these for support/inbox/AI/KB):**

| Table(s) | Purpose |
|----------|---------|
| `cs_tickets` | Support tickets |
| `cs_messages` | Ticket conversation thread |
| `cs_conversations` | Unified conversation tracking |
| `cs_team_activity_feed` | Support team activity |
| `cs_agent_performance_metrics` | Agent metrics (resolution, CSAT, SLA) |
| `cs_email_logs` | Support email send/log |
| `cs_notifications` | In-app notifications (assignment, SLA, mentions) |
| `cs_kb_articles`, `cs_kb_categories`, `cs_kb_tags`, `cs_kb_article_tags`, `cs_kb_article_views` | Knowledge Base |
| `cs_faq_entries` | FAQ entries (support) |
| `cs_sla_policies`, `cs_sla_tracking` | SLA definitions and per-ticket tracking |
| `cs_survey_csat`, `cs_survey_nps` | CSAT/NPS survey responses |
| `cs_survey_templates`, `cs_survey_responses`, `cs_survey_automation_rules`, `cs_survey_reminders` | Survey config and automation |
| `cs_team_members` | Support team (roles, skills, schedule) |
| `unified_inbox_contexts`, `unified_conversation_contexts` | Unified inbox state |
| `collision_detection`, `workflow_definitions`, `workflow_executions` | Inbox workflows |
| `beacon_sessions` | Beacon/customer portal sessions |
| `cs_shared_drafts`, `cs_mentions` | Drafts and @mentions |
| `employee_messages` | Where `service_type = 'cs_support'` (support channel messages) |
| `ai_agent_guardrails`, `cs_llm_agents`, `cs_agent_executions`, `cs_agent_feedback`, `cs_agent_training_data`, `cs_agent_state`, `cs_agent_orchestration`, `cs_agent_circuit_breakers`, `cs_agent_dlq`, `cs_agent_rate_limits`, `cs_agent_cost_tracking`, `cs_agent_monitoring` | AI agents and guardrails |
| `cs_communication_templates` | Templates for support replies (you use; CORE may use for onboarding) |
| `cs_sms_logs`, `cs_call_logs` | Support SMS/call logs |
| `cs_integrations`, `cs_webhooks`, `cs_api_keys` | Integrations and API keys for support |

**CORE–primary (CORE owns; you mostly read if needed):**

| Table(s) | Purpose |
|----------|---------|
| `cs_onboarding_sequences`, `cs_onboarding_milestones`, `cs_onboarding_communications`, `cs_onboarding_milestone_completions`, `cs_onboarding_firm_profile`, `cs_onboarding_phone_config`, `cs_onboarding_calendar_integrations`, `cs_onboarding_compliance_settings`, `cs_onboarding_step_completions` | Onboarding (SaaS Admin / CORE) |
| `cs_customer_onboarding_progress`, `cs_customer_post_onboarding` | Onboarding and post-onboarding progress |
| `cs_customer_health_scores`, `cs_health_score_history`, `cs_health_signals`, `cs_health_nudges` | Health scoring (CORE) |
| `cs_success_playbooks`, `cs_playbook_executions`, `cs_playbook_step_executions`, `cs_playbook_templates`, `cs_playbook_outcomes` | Success playbooks |
| `cs_renewal_tracking`, `cs_retention_campaigns`, `cs_retention_campaign_executions`, `cs_renewal_risk_signals`, `cs_renewal_forecasts` | Renewal orchestration |
| `cs_expansion_triggers`, `cs_expansion_trigger_executions`, `cs_expansion_opportunities`, `cs_usage_spike_detections` | Expansion triggers |
| `cs_trend_analysis`, `cs_trend_occurrences`, `cs_product_feedback`, `cs_pain_points`, `cs_trend_patterns` | Trend analysis |
| `cs_report_templates`, `cs_reports`, `cs_scheduled_report_executions`, `cs_report_access_logs` | Reporting |
| `cs_usage_events`, `cs_feature_adoption_metrics`, `cs_usage_patterns`, `cs_usage_analytics_summary` | Usage analytics |
| `cs_customer_churn_risk`, `cs_customer_success_metrics` | Churn and CS metrics |
| `cs_audit_logs` | Audit (both may write; CORE leads) |
| `cs_email_sends`, `cs_email_events`, `cs_email_unsubscribes`, `cs_email_suppressions` | Resend/email tracking (shared for campaigns) |
| `cs_email_templates`, `cs_sms_templates`, `cs_call_scripts` | Generic templates (onboarding/CORE) |

**Shared (both read/write or coordinate):**

| Table(s) | Notes |
|----------|--------|
| `phone_number_mappings`, `phone_number_pools`, `dialer_permissions` | CORE owns dialer UI; both may need phone config for support vs CSM |
| `cs_communication_templates` | Support replies (First-Line) and onboarding (CORE) both use |
| `cs_ticket_quality_scores` | Can be written by First-Line (quality), read by CORE for health |

RLS (Row Level Security) and app logic should enforce tenant_id and role so that First-Line only accesses data appropriate for support agents (Clerk App 2).

---

## 4. Internal Ops Service (Not a Table – Another Service)

**INTERNAL_OPS_SERVICE** is **not** a database or schema. It is the **Internal Ops** TrueVow service (another repo/app). It exposes HTTP APIs. CORE (and optionally First-Line) call it with an API key.

- **Env vars (in CORE; add in First-Line if you call Internal Ops):**
  - `INTERNAL_OPS_SERVICE_URL` – e.g. `http://localhost:3005` or production URL  
  - `INTERNAL_OPS_SERVICE_API_KEY` – secret for `X-API-Key` or similar  
- Use when: you need internal ops features (e.g. internal shared inbox, HR/IT flows). For pure support inbox/tickets/KB/AI, you often **don’t** need to call Internal Ops.

**Database naming recap:**

- **`cs_support_db`** = the shared Supabase DB (all tables above).
- **“CS_SUPPORT”** = this domain (CORE + First-Line); **“OPS_SERVICE”** = Internal Ops **service**, not a DB. Tables live in `cs_support_db` only.

---

## 5. Working Alongside CORE

- **Same DB:** Both use `cs_support_db`. Use the table ownership list above; avoid changing CORE-owned tables unless agreed (e.g. shared templates).
- **Different ports:** CORE = 3003, First-Line = 3008. No port conflict.
- **Auth:** You use **Clerk App 2**; CORE uses Clerk App 1. User IDs are from Clerk; map to your `cs_team_members` / internal user as needed.
- **Calling CORE:** If First-Line needs CORE data (e.g. health score, onboarding status for a tenant), call CORE’s HTTP APIs with a service-to-service auth (e.g. API key or internal auth). CORE does not call First-Line for core CS logic; First-Line may call CORE for read-only CS context.
- **Env vars you need (Supabase):** Same as CORE for DB: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or anon + RLS). Prefer a dedicated key with RLS so First-Line only sees allowed rows.
- **Service identification:** When writing to shared tables (e.g. `employee_messages`), use `service_type = 'cs_support'` so CORE and others can distinguish First-Line traffic.

---

## 6. What to Share With Your Teammates / AI Agent

When someone (or an AI) starts on First-Line, give them:

1. **This file** – `FIRST_LINE_SUPPORT_SERVICE_ONBOARDING.md` (copy or link from CORE repo `docs/01-main/`).
2. **Checkpoint** – `MILESTONE_CS_SPLIT_CHECKPOINT.md` (what was split, verification steps).
3. **Doc plan** – `DOCUMENTATION_UPDATE_PLAN_CS_SPLIT.md` (enterprise 6-service docs; useful for context).
4. **This repo (CORE)** – For reference implementation: inbox, tickets, messages, KB, AI agents, CSAT, templates. First-Line can copy or reimplement from here; CORE no longer contains LLM/inbox UI in the long term.

Point them to **section 3** for “what tables do I touch?” and **section 5** for “how do I work with CORE?”.

---

## 7. Quick Reference

| Item | Value |
|------|--------|
| First-Line repo | `TrueVow_First_Line_Support_Service` |
| First-Line port | 3008 |
| CORE repo | `TrueVow_Customer_Success_CORE_Service` |
| CORE port | 3003 |
| Shared DB | `cs_support_db` (Supabase, schema `public`) |
| Clerk | App 2 (First-Line), App 1 (CORE) |
| LLM | First-Line: yes; CORE: no |
| Internal Ops | Separate HTTP service; use `INTERNAL_OPS_SERVICE_URL` + API key if needed |

---

## 8. References (in CORE repo)

- `docs/01-main/MILESTONE_CS_SPLIT_CHECKPOINT.md` – Split summary and verification.
- `docs/01-main/DOCUMENTATION_UPDATE_PLAN_CS_SPLIT.md` – 6-service doc update plan.
- `docs/01-main/IMPLEMENTATION_PROGRESS.md` – CORE progress and Phase 12 (documentation).
- `docs/CS_SUPPORT_SERVICE_PRD.md` – Product context (6-service, CORE vs First-Line).
- `database/migrations/` – Full list of migrations defining the shared schema (apply in CORE/Supabase; First-Line only consumes the DB).

You’re set to pick up the threads from here and work alongside CORE with a clear picture of directory, database, and responsibilities.
