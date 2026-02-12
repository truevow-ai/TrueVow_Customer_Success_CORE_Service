# CS Communication Agent System - Analysis & Implementation Plan

**Date:** January 15, 2026  
**Status:** 📋 Analysis Complete - Ready for Implementation  
**Source:** Perplexity & Qwen Suggestions

---

## Executive Summary

After analyzing suggestions from Perplexity and Qwen against our current implementation, I've identified **6 critical enhancements** that align with TrueVow's needs, especially for **Bar-compliant, zero-knowledge legal SaaS**:

1. ✅ **Tiered AI Agent Architecture** (CRITICAL - Compliance Safety)
2. ✅ **Compliance Safety Layer** (CRITICAL - Legal Requirements)
3. ✅ **A/B Testing Engine** (HIGH VALUE - Optimization)
4. ✅ **Approval Workflow** (HIGH VALUE - Risk Management)
5. ✅ **CS Message Authoring Agent** (MEDIUM VALUE - Automation)
6. ✅ **Playbook Engine Enhancement** (MEDIUM VALUE - Structure)

---

## Current State Analysis

### ✅ What We Already Have

1. **Communication Templates System** ✅
   - 13 templates (9 email, 2 SMS, 1 in-app, 1 call)
   - Variable substitution
   - Template rendering
   - Integration with onboarding sequences

2. **Success Playbooks Database** ✅
   - `cs_success_playbooks` table exists
   - Playbook execution tracking
   - Step-by-step workflows

3. **AI Agent Framework** ✅
   - `SupportAgent` class
   - Ticket analysis and response generation
   - Basic guardrails in prompts
   - Multi-LLM provider support

4. **Communication Sender Service** ✅
   - Email (Resend)
   - SMS (Twilio)
   - WhatsApp (Twilio)
   - Communication tracking

5. **Onboarding Sequences** ✅
   - Milestone-based triggers
   - Automatic template lookup
   - Progress tracking

### ❌ What We're Missing

1. **Tiered AI Agent Architecture** ❌
   - No rule-based FAQ agent (Tier 1)
   - No separate LLM guidance agent (Tier 2)
   - No structured human escalation router (Tier 3)

2. **Compliance Safety Layer** ❌
   - No hard compliance validator
   - No Bar-compliant phrase blocking
   - No zero-knowledge reminders in every response

3. **A/B Testing Engine** ❌
   - No message variant system
   - No performance tracking per variant
   - No automatic winner promotion

4. **Approval Workflow** ❌
   - No DRAFT → REFINED → PENDING_APPROVAL → APPROVED states
   - No auto-approval rules for low-risk messages
   - No human approval requirement for high-impact messages

5. **CS Message Authoring Agent** ❌
   - No AI agent that drafts messages from playbooks
   - No context-aware message generation (health, events, tickets)
   - No refinement/tone alignment agent

6. **Playbook Engine Enhancement** ❌
   - Playbooks exist but not fully integrated with triggers
   - No event-based playbook triggering
   - No health-score-based playbook triggering

---

## Prioritized Implementation Plan

### 🔴 **PRIORITY 1: Hybrid AI Agent Architecture** (CRITICAL)

**Why:** Essential for Bar-compliant, zero-knowledge legal SaaS. Prevents AI from giving legal advice or making unsupported claims.

**Architecture:**
**Tier 1 (Rule-Based FAQ) → Tier 2 (LLM Enhancement) → Compliance Validation → Structured Response**

**Components:**
1. **Tier 1: Rule-Based FAQ Agent** (Deterministic - FIRST CHOICE)
   - Searches pre-approved FAQs from knowledge base and FAQ table
   - Exact match, fuzzy match, intent-based matching
   - Confidence scoring (0-1)
   - **No LLM** - completely deterministic, zero risk
   - Returns base response if match found

2. **Tier 2: LLM Enhancement Agent** (AUGMENTS Tier 1 - SECOND STEP)
   - **Only called AFTER Tier 1 finds a match**
   - Takes Tier 1 base response and enhances/refines it
   - Multi-LLM provider support (Anthropic, OpenAI, Grok, Qwen, Kimi)
   - Adds structure: steps, links, next actions
   - Personalizes tone for law firm context
   - Strict compliance guardrails in prompts
   - Always includes zero-knowledge reminder

3. **Compliance Safety Layer** (VALIDATION)
   - Validates all responses for blocked phrases
   - Blocks legal advice indicators
   - Blocks data speculation
   - Ensures zero-knowledge reminders
   - Triggers escalation for compliance-sensitive queries

4. **Structured Response Formatter** (OUTPUT)
   - Formats final response with sections
   - Includes summary, steps, links, next actions
   - Adds escalation offer when needed

**Files Created:**
- ✅ `lib/ai/tier1-faq-agent.ts` - Rule-based FAQ agent (deterministic matching)
- ✅ `lib/ai/tier2-llm-enhancer.ts` - LLM enhancement agent (augments Tier 1)
- ✅ `lib/ai/hybrid-support-agent.ts` - Main orchestrator (Tier 1 → Tier 2 → Compliance)
- ✅ `lib/middleware/compliance-validator.ts` - Compliance safety layer
- ✅ `database/migrations/025_faq_entries.sql` - FAQ entries table
- ✅ `app/api/v1/ai/hybrid-support/route.ts` - API endpoint

**Database Changes:**
- ✅ `cs_faq_entries` table created for pre-approved FAQs
- Add `compliance_flags` JSONB field to `cs_llm_agent_executions` (future)

---

### 🔴 **PRIORITY 2: Compliance Safety Layer** (CRITICAL)

**Why:** Legal requirement for law firm customers. Must prevent UPL, data speculation, and unsupported promises.

**Components:**
1. **Compliance Validator Middleware**
   - Blocks phrases: "you should", "your case is worth", "file a motion"
   - Blocks data speculation: "We can see your calls..." → "Based on your settings..."
   - Adds zero-knowledge reminder to every response
   - Full audit log of all interactions

2. **Bar-Compliant Response Templates**
   - Pre-approved responses for common compliance questions
   - Blockchain certificate references
   - Mock audit walkthrough offers

**Files to Create:**
- `lib/middleware/compliance-validator.ts` - Compliance validation middleware
- `lib/utils/compliance-rules.ts` - Compliance rules and phrase blocking
- `database/kb/compliance/` - Compliance response templates

**Database Changes:**
- Add `cs_compliance_audit_log` table for tracking all interactions
- Add `compliance_flags` JSONB to `cs_llm_agent_executions`

---

### 🟡 **PRIORITY 3: A/B Testing Engine** (HIGH VALUE)

**Why:** Optimize message performance (activation, time-to-value, reduced churn, CSAT).

**Components:**
1. **Message Variant System**
   - Multiple variants per template
   - A/B subject lines
   - Different style variants (short vs detailed, direct vs soft)

2. **Performance Tracking**
   - Metrics per variant: sent, opened, clicked, replied, activated, churned
   - Automatic winner promotion
   - Statistical significance testing

**Files to Create:**
- `lib/services/ab-testing-service.ts` - A/B testing service
- `app/api/v1/ab-testing/variants/route.ts` - Variant management API
- `app/api/v1/ab-testing/metrics/route.ts` - Metrics tracking API

**Database Changes:**
- Add `cs_message_variants` table
- Add `cs_variant_metrics` table
- Add `variant_id` to `cs_onboarding_communications` table

---

### 🟡 **PRIORITY 4: Approval Workflow** (HIGH VALUE)

**Why:** Risk management for high-impact messages (billing, legal policy changes, major incidents).

**Components:**
1. **Message Status Workflow**
   - DRAFT → REFINED → PENDING_APPROVAL → APPROVED → SCHEDULED/SENT
   - Auto-approval rules for low-risk messages
   - Human approval required for high-impact messages

2. **Approval UI**
   - Approval queue dashboard
   - Approve/reject with comments
   - Edit before approval

**Files to Create:**
- `lib/services/message-approval-service.ts` - Approval workflow service
- `app/api/v1/messages/approval/route.ts` - Approval API
- `components/messages/ApprovalQueue.tsx` - Approval queue UI

**Database Changes:**
- Add `approval_status` field to `cs_onboarding_communications` table
- Add `cs_message_approvals` table for approval history
- Add `auto_approval_rules` JSONB to `cs_communication_templates`

---

### 🟢 **PRIORITY 5: CS Message Authoring Agent** (MEDIUM VALUE)

**Why:** Automate message drafting based on playbooks, health metrics, and events.

**Components:**
1. **Message Authoring Agent**
   - Inputs: playbook_id, account profile, health metrics, events, tickets
   - Outputs: Draft messages (email, in-app, SMS)
   - Uses existing CS/support language

2. **Refinement Agent**
   - Tone alignment
   - Clarity checks
   - Channel appropriateness validation

**Files to Create:**
- `lib/ai/message-authoring-agent.ts` - Message authoring agent
- `lib/ai/message-refinement-agent.ts` - Refinement agent
- `app/api/v1/ai/messages/author/route.ts` - Authoring API
- `app/api/v1/ai/messages/refine/route.ts` - Refinement API

**Database Changes:**
- Add `ai_generated` boolean to `cs_onboarding_communications`
- Add `ai_generation_metadata` JSONB field

---

### 🟢 **PRIORITY 6: Playbook Engine Enhancement** (MEDIUM VALUE)

**Why:** Better integration with triggers and events.

**Components:**
1. **Event-Based Triggering**
   - Webhook endpoints for events (usage, NPS, billing, ticket state)
   - Automatic playbook execution on events

2. **Health-Score-Based Triggering**
   - Trigger playbooks based on health score thresholds
   - Risk/churn playbook automation

**Files to Create:**
- `lib/services/playbook-trigger-service.ts` - Playbook trigger service
- `app/api/v1/webhooks/events/route.ts` - Event webhook endpoint

**Database Changes:**
- Enhance `trigger_conditions` JSONB in `cs_success_playbooks`
- Add `cs_playbook_triggers` table for trigger history

---

## Implementation Phases

### Phase 1: Critical Compliance (Week 1-2)
- ✅ Tiered AI Agent Architecture
- ✅ Compliance Safety Layer
- ✅ Knowledge base for Tier 1 FAQ agent

### Phase 2: Optimization (Week 3-4)
- ✅ A/B Testing Engine
- ✅ Approval Workflow

### Phase 3: Automation (Week 5-6)
- ✅ CS Message Authoring Agent
- ✅ Playbook Engine Enhancement

---

## Database Schema Changes Summary

### New Tables
1. `cs_compliance_audit_log` - Compliance audit trail
2. `cs_message_variants` - A/B testing variants
3. `cs_variant_metrics` - Variant performance metrics
4. `cs_message_approvals` - Approval history
5. `cs_playbook_triggers` - Playbook trigger history

### Modified Tables
1. `cs_llm_agents` - Add `agent_tier`, `compliance_flags`
2. `cs_llm_agent_executions` - Add `compliance_flags`
3. `cs_communication_templates` - Add `auto_approval_rules`
4. `cs_onboarding_communications` - Add `approval_status`, `variant_id`, `ai_generated`, `ai_generation_metadata`
5. `cs_success_playbooks` - Enhance `trigger_conditions` JSONB

---

## Integration Points

### Existing Services to Enhance
- `lib/ai/support-agent.ts` - Add tiered routing
- `lib/services/communication-templates.ts` - Add variant support
- `lib/services/communication-sender.ts` - Add approval check
- `lib/services/success-playbooks.ts` - Add event-based triggering

### New API Endpoints
- `POST /api/v1/ai/tier1/faq` - Tier 1 FAQ agent
- `POST /api/v1/ai/tier2/guidance` - Tier 2 guidance agent
- `POST /api/v1/ai/tier3/escalate` - Tier 3 escalation
- `POST /api/v1/compliance/validate` - Compliance validation
- `POST /api/v1/ab-testing/variants` - Variant management
- `POST /api/v1/messages/approval` - Approval workflow
- `POST /api/v1/ai/messages/author` - Message authoring
- `POST /api/v1/ai/messages/refine` - Message refinement
- `POST /api/v1/webhooks/events` - Event webhook

---

## Out of Scope (For Now)

1. **Separate Microservice** - Building within CS-Support service is sufficient
2. **Full Email GTM Pattern** - Sales-focused patterns don't fully apply to CS
3. **Complex Multi-Agent Orchestration** - Start with simple tiered routing
4. **Advanced ML Models** - Use existing LLM providers for now

---

## Success Metrics

### Compliance
- Zero compliance violations in production
- 100% of responses include zero-knowledge reminder
- < 2 hour human escalation SLA

### Performance
- 20% improvement in message open rates (A/B testing)
- 15% improvement in activation rates
- 10% reduction in churn (risk playbooks)

### Automation
- 60% of messages auto-approved (low-risk)
- 40% reduction in manual message drafting time
- 80% playbook automation rate

---

## Next Steps

1. **Review & Approve Plan** - Confirm priorities and scope
2. **Create Phase 1 Checkpoint** - Document Tiered AI Agent Architecture design
3. **Start Implementation** - Begin with Tier 1 FAQ Agent
4. **Iterate** - Build incrementally, test thoroughly

---

**Status:** 📋 Analysis Complete - Ready for Implementation  
**Last Updated:** January 15, 2026
