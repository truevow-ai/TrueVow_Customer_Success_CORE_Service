# Main Documentation Update Content

**Date:** January 15, 2026  
**Purpose:** Content to add/update in main TrueVow documentation files

---

## Update 1: Onboarding Templates Section

### Add to CS-Support Service Section:

```markdown
### **Onboarding Sequence Templates**

The CS-Support Service provides template-based onboarding sequences for law firm customers who have applied for INTAKE service (handoff from Sales CRM).

**⚠️ IMPORTANT:** These are CS-Support onboarding templates (NOT sales CRM templates). Sales CRM templates belong in the Sales CRM service.

**Available Templates:**

1. **Law Firm Pre-Onboarding Preparation** (`law_firm_pre_onboarding`)
   - **Duration:** 3 days
   - **JTBD:** "Help me prepare everything needed for a successful onboarding call."
   - **Flow:**
     - CSM receives lead/prospect from Sales CRM
     - CSM sends automated email about preparing groundwork
     - Customer prepares checklist items
     - Customer requests calendar booking for onboarding call

2. **Law Firm Onboarding Call** (`law_firm_onboarding_call`)
   - **Duration:** 1 day (45-minute call + configuration)
   - **JTBD:** "Help me complete my profile setup with expert guidance."
   - **Flow:**
     - Customer books 45-minute white-glove onboarding call
     - CSM helps fill in profile information during call
     - Post-call: Account configuration
     - Account ready for testing INTAKE

3. **Law Firm Post-Onboarding Support** (`law_firm_post_onboarding_90_days`)
   - **Duration:** 90 days
   - **JTBD:** "Help me successfully use INTAKE and resolve any issues I face."
   - **Flow:**
     - First-line AI agent available 24/7
     - CSM team handles complex issues
     - Proactive check-ins and support
     - Transition to standard support after 90 days

**Onboarding Flow:**
1. Law firm applies for INTAKE service (Sales CRM)
2. Lead/prospect handed to CSM
3. CSM sends pre-onboarding preparation email
4. Customer prepares checklist items
5. Customer requests calendar booking
6. Onboarding call: CSM helps fill profile (45 minutes)
7. Post-call: Account configuration
8. Go-live: Customer can test INTAKE
9. Post-onboarding: First 90 days support (AI agent + CSM team)
```

---

## Update 2: JTBD Integration Section

### Add to CS-Support Service Section:

```markdown
### **Jobs To Be Done (JTBD) Integration**

The CS-Support Service integrates JTBD (Jobs To Be Done) with RevOps and time tracking to measure success by customer goal.

**JTBD Integration Points:**

1. **RevOps Activity Tracking:**
   - Onboarding start → Reports with JTBD context
   - Milestone completion → Reports with JTBD context
   - Onboarding completion → Reports with JTBD and metrics
   - Enables revenue attribution by JTBD
   - Measures CSM performance by JTBD type

2. **Time Tracking Enrichment:**
   - Automatically enriches onboarding time tracking with JTBD
   - Queries latest onboarding progress to get JTBD
   - Adds JTBD, template_key, sequence_id to metadata
   - Enables time allocation analytics by JTBD

3. **Performance Analytics:**
   - Track revenue by JTBD
   - Measure time-to-completion by JTBD
   - Calculate success rate by JTBD
   - Analyze CSM efficiency by JTBD

**Benefits:**
- Revenue attribution by customer goal (JTBD)
- Resource allocation tracking by JTBD
- Performance metrics by JTBD type
- Optimize onboarding paths by JTBD
```

---

## Update 3: Internal Ops Service Integration Section

### Add to CS-Support Service Section:

```markdown
### **Internal Ops Service Integration**

The CS-Support Service integrates with Internal Ops Service for RevOps tracking, time tracking, task management, and performance analytics.

**Integration Points:**

1. **RevOps Activity Tracking:**
   - Ticket resolved → Reports to RevOps with resolution time
   - Onboarding activities → Reports with JTBD context
   - Support calls → Tracks call duration and purpose
   - Churn risk identified → Reports for revenue attribution
   - Revenue attribution: retention and expansion

2. **Time Tracking:**
   - Support calls → Automatic time tracking
   - Email activities → Tracks email composition/sending time
   - Platform activities → Tracks ticket work time
   - Onboarding sessions → Tracks with JTBD context
   - Manual time entries → For custom activities

3. **Task Management:**
   - Churn risk identified → Auto-creates high-priority tasks
   - Onboarding milestones → Creates follow-up tasks
   - Ticket resolved → Creates follow-up tasks
   - Ensures no customers fall through cracks

4. **Performance Metrics:**
   - Individual performance assessment
   - Team performance metrics
   - Revenue attribution (retention/expansion)
   - Time allocation analytics
   - Efficiency scores

**Phase 1 (Implemented):**
- ✅ JTBD RevOps reporting (onboarding)
- ✅ JTBD time tracking enrichment

**Phase 1 (Planned):**
- ⏳ Ticket resolved → RevOps activity
- ⏳ Support call → Time tracking
- ⏳ Churn risk identified → Task creation

**API Endpoints Used:**
- `POST /api/v1/revops/activities` - Activity tracking
- `POST /api/v1/auto-tracking/call-activity` - Call tracking
- `POST /api/v1/auto-tracking/email-activity` - Email tracking
- `POST /api/v1/auto-tracking/platform-activity` - Platform tracking
- `POST /api/v1/tasks` - Task creation
- `GET /api/v1/revops/reporting/performance` - Performance metrics
```

---

## Update 4: Integration Points Section Update

### Update Existing Integration Points:

**Current:**
```markdown
### **Integration Points**

- **From Sales CRM Service:** API access to pre-sale conversations
- **From Platform Service:** Tenant/subscription data
- **From Internal Ops Service:** Task management, time tracking, RevOps tracking
- **To Customer Portal:** AI agent APIs (Benjamin), ticket submission, KB access (NO LLM in Customer Portal)
- **To Sales CRM Service:** Pre-sale conversation data via API
```

**Updated:**
```markdown
### **Integration Points**

**Incoming:**
- **From Sales CRM Service:** 
  - Pre-sale conversation data via API
  - Lead/prospect handoff after INTAKE application
  - Customer application data
- **From Platform Service:** 
  - Tenant/subscription data
  - Account creation events
  - Calendar OAuth callbacks
  - Phone number assignment
- **From Internal Ops Service:**
  - RevOps activity tracking APIs
  - Time tracking APIs
  - Task management APIs
  - Performance metrics APIs
  - HR/Resource data APIs

**Outgoing:**
- **To Customer Portal:** 
  - AI agent APIs (Benjamin) - NO LLM in Customer Portal
  - Ticket submission APIs
  - KB access APIs
  - Customer portal integration endpoints
- **To Sales CRM Service:** 
  - Pre-sale conversation data via API
  - Post-onboarding success metrics
- **To Internal Ops Service:**
  - RevOps activity reports (with JTBD context)
  - Time tracking data (with JTBD enrichment)
  - Task creation requests
  - Performance data
```

---

## Update 5: Key Features Section Update

### Add to Key Features:

```markdown
### **Key Features**

- Multi-channel unified inbox (Email, SMS, Calls, Web Chat, Facebook, Forms)
- AI-powered response suggestions (Claude for general, Kimi for technical)
- Voice-enabled AI agents (Deepgram STT, Cartesia TTS)
- Customer-facing persona: "Benjamin" (consistent point of contact for each law firm)
- Human-in-the-loop training for AI agents
- Pre-sale/Post-sale support (Sales CRM integration via API)
- **Onboarding Sequence Templates:** Template-based onboarding for law firms (pre-onboarding, onboarding call, post-onboarding 90 days)
- **JTBD Integration:** Jobs To Be Done tracking with RevOps and time tracking
- **Internal Ops Integration:** RevOps tracking, time tracking, task management, performance analytics
- **Law Firm Onboarding Flow:** 4-phase, 5-step onboarding journey with progress tracking
- **Customer Success Features:** Health scoring, churn risk detection, renewal orchestration, expansion triggers
- **Usage Analytics:** Feature adoption tracking, usage patterns, churn prediction
- **CSAT/NPS Auto-Survey:** Automated post-resolution feedback loops
- **Trend Analysis:** Common pain points and product feedback aggregation
- **Success Playbooks:** Template sequences for legal upsell and automated workflows
- **Master Dashboard:** Unified dashboard with Grafana and AI insights for CSMs
```

---

## Update 6: Core Responsibilities Section Update

### Add to Core Responsibilities:

```markdown
### **Core Responsibilities**

- **Support Tickets:** Full lifecycle ticket management
- **Shared Inbox:** HelpScout-like interface, unified inbox for all customer communications
- **Knowledge Base:** Article management, search, categories (customer-facing and internal)
- **SLA Management:** SLA tracking, response time monitoring, escalations
- **Customer Success:** Proactive customer health monitoring, churn risk detection, onboarding
- **Onboarding Management:** 
  - Pre-onboarding preparation (CSM groundwork prep)
  - Onboarding call workflow (white-glove 45-minute call)
  - Post-onboarding support (first 90 days with AI agent + CSM team)
  - Template-based onboarding sequences
  - JTBD tracking and analytics
- **AI Digital Agents:** Customer Success Agent, Support Agent, Solutions Engineer Agent (all powered by "Benjamin" persona)
- **Multi-Channel Support:** Email, SMS, Calls, Web Chat, Facebook, Forms
- **Customer Portal Integration:** Self-service portal, ticket submission, KB access (via API, no LLM access)
- **CSAT/NPS Surveys:** Customer satisfaction tracking and analysis
- **Team Collaboration:** Activity feeds, performance dashboards, team channels
- **Analytics & Reporting:** Agent performance, CSAT scores, SLA compliance
- **RevOps Integration:** Revenue attribution, activity tracking, performance metrics
- **Time Tracking:** Automatic and manual time tracking with JTBD context
- **Task Management:** Auto-create tasks for churn risk, follow-ups, milestones
```

---

## Files to Update

1. **TrueVow_PRD.md** - Add/update CS-Support Service section (around line 11226)
2. **TRUEVOW_COMPLETE_SYSTEM_DOCUMENTATION.txt** - Update CS-Support architecture section
3. **TrueVow-Complete System-Technical-Documentation-for-Developers.md** - Add implementation details

---

**Status:** Ready to apply updates
