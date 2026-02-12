# CS-Support Service: Commonalities Analysis with Sales CRM Service

**Date:** January 8, 2026  
**Purpose:** Identify commonalities between Sales CRM Service and CS-Support Service, especially regarding AI agents framework, JBTD framework, RevOps integration, and human roles/job responsibilities.

---

## Executive Summary

After reviewing the Sales CRM Service PRD and Implementation Plan, I've identified **critical commonalities** that should be implemented in the CS-Support Service to ensure consistency, maintainability, and proper integration with TrueVow's organizational structure and RevOps system.

---

## 1. AI Agent Framework Architecture

### 1.1 Agent Configuration System

**From Sales CRM:**
- Agent metadata (name, type, status, is_active)
- Brief configuration (role, JTBD, context, guardrails, steps, outcomes)
- Knowledge base (documents, text content, embeddings)
- LLM configuration (model, temperature, max_tokens, system_prompt)
- Performance metrics (execution time, token usage, success rate)

**To Add to CS-Support PRD:**
- **Section 8.1.1: Agent Configuration System**
  - Database table: `support_llm_agents` (mirror of `sales_llm_agents`)
  - Configuration UI for managing agent briefs
  - Knowledge base management per agent
  - LLM model selection per agent (Claude vs Kimi)
  - Performance tracking and metrics

### 1.2 Multi-Agent Orchestration

**From Sales CRM:**
- Sequential Pattern: Agent A → Agent B → Agent C (context passing)
- Parallel Pattern: Multiple agents simultaneously (independent)
- Conditional Pattern: Route based on conditions
- Silo Pattern: Independent agents (no context sharing)
- Context Manager: Extraction, summarization, caching, passing

**To Add to CS-Support PRD:**
- **Section 8.1.2: Multi-Agent Orchestration**
  - Orchestration engine for CS-Support agents
  - Context passing between agents (e.g., Customer Support → Solutions Engineer)
  - Parallel processing for independent tasks
  - Conditional routing based on ticket complexity

### 1.3 Error Handling & Resilience

**From Sales CRM:**
- Circuit breakers (per LLM provider)
- Retry logic (exponential backoff)
- Fallback agents (backup workflows)
- Dead letter queue (failed executions)
- State recovery (resume from checkpoints)

**To Add to CS-Support PRD:**
- **Section 8.1.4: Error Handling & Resilience**
  - Circuit breakers for Claude/Kimi
  - Retry logic for failed agent executions
  - Fallback to human agents on critical failures
  - Dead letter queue for failed ticket resolutions
  - State recovery for long-running agent workflows

### 1.4 Human Training & Feedback System

**From Sales CRM:**
- Feedback UI (corrections, explanations)
- Correction replay (training examples)
- Learning engine (update briefs, knowledge base)
- Training data collection (tagged corrections)
- A/B testing (test improvements)

**To Add to CS-Support PRD:**
- **Section 8.1.5: Human Training & Feedback System**
  - Feedback UI for support agents to correct AI responses
  - Training data collection from corrections
  - Continuous learning from human feedback
  - A/B testing for agent improvements
  - Performance improvement tracking

### 1.5 Agent State Management

**From Sales CRM:**
- Conversation state (per lead/contact)
- Workflow state (progress tracking)
- State checkpoints (before critical operations)
- State recovery (restore from checkpoints)

**To Add to CS-Support PRD:**
- **Section 8.1.6: Agent State Management**
  - Conversation state per ticket/customer
  - Workflow state for multi-step resolutions
  - State checkpoints before critical actions
  - State recovery for interrupted workflows

### 1.6 Rate Limiting & Cost Control

**From Sales CRM:**
- Per-agent rate limits (calls/hour)
- Token budgets (daily limits)
- Cost monitoring (per agent, per customer)
- Usage tracking (execution frequency, success rate)

**To Add to CS-Support PRD:**
- **Section 8.1.7: Rate Limiting & Cost Control**
  - Per-agent rate limits (e.g., Customer Support Agent: 100 tickets/hour)
  - Token budgets per agent (daily limits)
  - Cost monitoring per agent, per ticket
  - Usage tracking and optimization

### 1.7 Agent Coordination & Conflict Resolution

**From Sales CRM:**
- Conflict detection (multiple agents on same resource)
- Lock management (resource locking)
- Priority queuing (high, medium, low)
- Handoff protocols (context passing, validation)

**To Add to CS-Support PRD:**
- **Section 8.1.8: Agent Coordination & Conflict Resolution**
  - Conflict detection (multiple agents working on same ticket)
  - Lock management for ticket assignments
  - Priority queuing for urgent tickets
  - Handoff protocols between agents (e.g., Support → Solutions Engineer)

### 1.8 Monitoring & Debugging

**From Sales CRM:**
- Execution tracing (end-to-end traces)
- Performance metrics (time, tokens, success rate)
- Error tracking (categorized errors, alerts)
- Debug mode (verbose logging, LLM call logs)

**To Add to CS-Support PRD:**
- **Section 8.1.9: Monitoring & Debugging**
  - Execution tracing for agent workflows
  - Performance metrics per agent
  - Error tracking and alerting
  - Debug mode for troubleshooting

### 1.9 Testing & Validation

**From Sales CRM:**
- Simulation mode (test without side effects)
- Test scenarios (happy paths, error paths)
- Validation rules (input/output validation)
- Sandbox environment (isolated testing)

**To Add to CS-Support PRD:**
- **Section 8.1.10: Testing & Validation**
  - Simulation mode for testing agents
  - Test scenarios for common support cases
  - Validation rules for agent outputs
  - Sandbox environment for agent testing

### 1.10 Human Override & Control

**From Sales CRM:**
- Pause agent (mid-execution)
- Manual intervention (take over conversation)
- Emergency stop (global or per-agent)
- Override decisions (with training data)

**To Add to CS-Support PRD:**
- **Section 8.1.11: Human Override & Control**
  - Pause agent mid-resolution
  - Manual intervention for complex cases
  - Emergency stop for critical issues
  - Override decisions with feedback collection

### 1.11 Data Quality & Validation

**From Sales CRM:**
- Input validation (required fields, formats)
- Output validation (expected format, data types)
- PII detection (identify and redact)
- Data sanitization (remove sensitive data)

**To Add to CS-Support PRD:**
- **Section 8.1.12: Data Quality & Validation**
  - Input validation for ticket data
  - Output validation for agent responses
  - PII detection and redaction
  - Data sanitization before LLM calls

---

## 2. Jobs-to-Be-Done (JTBD) Framework

### 2.1 JTBD Structure

**From Sales CRM:**
- Each agent has a "Brief Configuration" that includes:
  - **Role:** Agent's role and responsibilities
  - **JTBD:** Jobs-to-be-done (what job is the agent helping complete?)
  - **Context:** What context does the agent need?
  - **Guardrails:** What should the agent NOT do?
  - **Steps:** Step-by-step process
  - **Outcomes:** Expected outcomes

**To Add to CS-Support PRD:**
- **Section 8.1.1.3: Jobs-to-Be-Done (JTBD) Framework**
  - Each CS-Support agent must have a JTBD definition
  - JTBD structure:
    ```json
    {
      "role": "Customer Support Digital Agent",
      "jtbd": "Help customers resolve technical issues quickly and accurately",
      "context": "Ticket details, customer history, knowledge base",
      "guardrails": [
        "Do not make billing decisions without CSM approval",
        "Do not escalate to Solutions Engineer for simple issues",
        "Do not provide legal advice"
      ],
      "steps": [
        "1. Analyze ticket content",
        "2. Search knowledge base",
        "3. Generate response",
        "4. Escalate if needed"
      ],
      "outcomes": [
        "Ticket resolved",
        "Customer satisfied",
        "Response time < 1 hour"
      ]
    }
    ```
  - JTBD stored in `support_llm_agents.brief_config` (JSONB column)
  - JTBD used to generate system prompts for LLMs
  - JTBD updated based on human feedback and performance

### 2.2 JTBD Integration with Human Roles

**From Sales CRM:**
- JTBD aligns with organizational roles (Sales Executive, Regional Sales Manager, etc.)
- Each human role has corresponding AI agents
- AI agents support human roles, not replace them

**To Add to CS-Support PRD:**
- **Section 8.1.1.3.1: JTBD Alignment with Human Roles**
  - Customer Support Digital Agent → Supports Support Agent (IC)
  - Customer Success Digital Agent → Supports CSM (IC)
  - Solutions Engineer Digital Agent → Supports Solutions Engineer (IC)
  - Escalation Monitoring Agent → Supports Support Manager
  - Knowledge Base Agent → Supports all support roles
  - Customer Health Agent → Supports CSM (IC)
  - Ticket Quality Agent → Supports Support Manager
  - JTBD must align with human job responsibilities from organizational structure

---

## 3. RevOps Integration

### 3.1 Activity Tracking

**From Sales CRM:**
- All agent activities logged
- Activity types: email sent, demo scheduled, lead qualified, etc.
- Activity scores assigned (1-50 points based on value)
- Activities mapped to organizational roles
- Activities feed into RevOps system

**To Add to CS-Support PRD:**
- **Section 8.8.5: Activity Tracking & RevOps Integration** (Already exists, but needs enhancement)
  - All CS-Support agent activities logged
  - Activity types: ticket resolved, customer onboarded, health check completed, etc.
  - Activity scores assigned (1-20 points based on value)
  - Activities mapped to organizational roles:
    - Customer Support Digital Agent → Support Agent (IC)
    - Customer Success Digital Agent → CSM (IC)
    - Solutions Engineer Digital Agent → Solutions Engineer (IC)
  - Activities feed into Internal Ops Service RevOps system

### 3.2 Revenue Attribution

**From Sales CRM:**
- Direct revenue: 100% credit (e.g., deal closed)
- Indirect revenue: Partial credit (e.g., lead qualified → 30% if deal closes)
- Attribution by role, by function, by team
- Revenue attribution reports

**To Add to CS-Support PRD:**
- **Section 8.8.5.1: Revenue Attribution**
  - Direct revenue: 100% credit (e.g., customer retained, upsell closed)
  - Indirect revenue: Partial credit (e.g., ticket resolved → 10% if customer retained)
  - Attribution by role:
    - CSM: 100% direct credit for upsells, retention
    - Support Agent: 10% indirect credit for customer retention
    - AI CS Assistant: 10% indirect credit for customer retention
  - Attribution by function (Customer Success Organization)
  - Revenue attribution reports via Internal Ops Service

### 3.3 Scoring System

**From Sales CRM:**
- Scoring matrix by activity type
- Role-based scoring
- Performance score = Sum of activity scores + Revenue attribution
- Scores calculated daily, weekly, monthly

**To Add to CS-Support PRD:**
- **Section 8.8.5.2: Scoring System**
  - Scoring matrix for CS-Support activities:
    - Ticket resolved: 1 point (Support Agent, AI Support Agent)
    - Customer onboarded: 10 points (CSM, AI CS Assistant)
    - Customer retained: 15 points (CSM), 10 points (Support Agent - indirect)
    - Upsell closed: 20 points (CSM)
  - Role-based scoring aligned with organizational structure
  - Performance score calculation
  - Score reporting via Internal Ops Service

---

## 4. Human Roles & Job Responsibilities

### 4.1 Organizational Structure Integration

**From Sales CRM:**
- Detailed role definitions for Revenue Organization
- Role-based activity mapping
- Role-based RevOps attribution
- Role-based performance tracking

**To Add to CS-Support PRD:**
- **Section 8.9: Human Roles & Job Responsibilities Integration**
  - Integration with TrueVow Organizational Roles & Structure (V01)
  - Customer Success Organization roles:
    - Head of Customer Success (VP CS)
    - Customer Success Manager (CSM) (IC)
    - Support Manager
    - Customer Solutions Engineer (Support Agent) (IC)
    - Security Manager, Security Specialists
    - Compliance Manager, Compliance Specialists
  - Role-based activity mapping
  - Role-based RevOps attribution
  - Role-based performance tracking

### 4.2 Role-Based Activity Mapping

**From Sales CRM:**
- Each activity mapped to specific role
- Activities tracked by role
- Performance compared by role
- Role-based dashboards

**To Add to CS-Support PRD:**
- **Section 8.9.1: Role-Based Activity Mapping**
  - CSM activities: Account management, onboarding, upsells, retention
  - Support Agent activities: Ticket resolution, billing support, escalation
  - Solutions Engineer activities: Technical troubleshooting, configuration
  - Activities tracked by role
  - Performance compared by role
  - Role-based dashboards

### 4.3 Time Allocation Tracking

**From Sales CRM:**
- Role-based time allocation (e.g., Sales Executive: 25% Prospecting, 40% Sales Cycle)
- Time allocation feeds into RevOps
- Timezone-aware scheduling

**To Add to CS-Support PRD:**
- **Section 8.9.2: Time Allocation Tracking**
  - CSM time allocation: 30% Account Management, 20% Onboarding, 15% Dispute Handling, etc.
  - Support Agent time allocation: 50% Technical Support, 20% Billing Support, etc.
  - Time allocation feeds into Internal Ops Service
  - Timezone-aware scheduling (PKT vs USA timezones)

---

## 5. Customer-Facing Personas

### 5.1 Persona Design Philosophy

**From Sales CRM:**
- Customers interact with friendly, human-like agents with real names
- Primary persona: "Sarah" (consistent point of contact)
- Internal agents work behind the scenes
- Persona maintains context and relationship continuity

**Already in CS-Support PRD:**
- **Section 8.7: Customer-Facing Personas** (Already exists)
  - Primary persona: "Benjamin" (consistent point of contact)
  - Internal agents work behind the scenes
  - Persona maintains context and relationship continuity

**Enhancement Needed:**
- Add voice persona integration (Cartesia voice profiles)
- Add persona consistency across channels (email, SMS, chat, calls)
- Add persona memory and context continuity

---

## 6. Database Schema Commonalities

### 6.1 Agent Configuration Table

**From Sales CRM:**
```sql
CREATE TABLE sales_llm_agents (
    agent_id UUID PRIMARY KEY,
    agent_name VARCHAR(255) NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'testing')),
    is_active BOOLEAN DEFAULT true,
    brief_config JSONB NOT NULL, -- Role, JTBD, context, guardrails, steps, outcomes
    knowledge_base JSONB, -- Documents, text content, embeddings
    llm_config JSONB, -- Model, temperature, max_tokens, system_prompt
    performance_metrics JSONB, -- Execution time, token usage, success rate
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**To Add to CS-Support PRD:**
- **Section 9.3.1: Agent Configuration Table**
  - Create `support_llm_agents` table (mirror of `sales_llm_agents`)
  - Same structure, adapted for CS-Support agents
  - Brief config includes JTBD framework

### 6.2 Activity Tracking Table

**From Sales CRM:**
- Activities logged to RevOps system (Internal Ops Service)
- Activity types, scores, attribution

**To Add to CS-Support PRD:**
- **Section 9.3.2: Activity Tracking Integration**
  - Activities logged to Internal Ops Service RevOps system
  - Activity types: ticket resolved, customer onboarded, etc.
  - Activity scores and attribution
  - Role-based activity mapping

---

## 7. Implementation Plan Commonalities

### 7.1 Agent Framework Implementation

**From Sales CRM Implementation Plan:**
- Phase 5: AI Digital Agents Module
  - 5.1: AI Agent Framework
  - 5.2: Sales AI Agents
  - 5.3: Advanced AI Agents

**To Add to CS-Support Implementation Plan:**
- **Phase 5: AI Digital Agents Module** (Already exists, but needs enhancement)
  - 5.1: AI Agent Framework (add JTBD, orchestration, error handling, etc.)
  - 5.2: CS-Support AI Agents (enhance with JTBD framework)
  - 5.3: Advanced AI Agents (add monitoring, debugging, testing)

### 7.2 RevOps Integration Implementation

**From Sales CRM Implementation Plan:**
- Phase 11: RevOps Integration
  - Activity tracking
  - Revenue attribution
  - Scoring system
  - Reporting

**To Add to CS-Support Implementation Plan:**
- **Phase 11: RevOps Integration** (New phase)
  - 11.1: Activity Tracking Integration
  - 11.2: Revenue Attribution Integration
  - 11.3: Scoring System Integration
  - 11.4: Reporting Integration

---

## 8. Summary of Additions to CS-Support PRD

### 8.1 New Sections to Add

1. **Section 8.1.1.3: Jobs-to-Be-Done (JTBD) Framework**
   - JTBD structure and definition
   - JTBD integration with agent briefs
   - JTBD alignment with human roles

2. **Section 8.1.2: Multi-Agent Orchestration** (Enhancement)
   - Orchestration patterns
   - Context management
   - Agent coordination

3. **Section 8.1.4-8.1.12: Agent Framework Components** (Enhancements)
   - Error handling & resilience
   - Human training & feedback
   - State management
   - Rate limiting & cost control
   - Agent coordination
   - Monitoring & debugging
   - Testing & validation
   - Human override & control
   - Data quality & validation

4. **Section 8.9: Human Roles & Job Responsibilities Integration** (New)
   - Organizational structure integration
   - Role-based activity mapping
   - Time allocation tracking
   - Role-based performance tracking

5. **Section 9.3.1: Agent Configuration Table** (New)
   - Database schema for agent configuration
   - JTBD storage in brief_config

6. **Section 9.3.2: Activity Tracking Integration** (New)
   - Integration with Internal Ops Service RevOps
   - Activity logging and attribution

### 8.2 Enhancements to Existing Sections

1. **Section 8.8.5: Activity Tracking & RevOps Integration** (Enhancement)
   - Add role-based activity mapping
   - Add revenue attribution details
   - Add scoring system details

2. **Section 8.7: Customer-Facing Personas** (Enhancement)
   - Add voice persona integration
   - Add persona consistency across channels
   - Add persona memory

---

## 9. Summary of Additions to CS-Support Implementation Plan

### 9.1 New Phases/Tasks

1. **Phase 5.1: AI Agent Framework** (Enhancement)
   - Add JTBD framework implementation
   - Add orchestration engine
   - Add error handling & resilience
   - Add human training system
   - Add monitoring & debugging

2. **Phase 11: RevOps Integration** (New Phase)
   - Activity tracking integration
   - Revenue attribution integration
   - Scoring system integration
   - Reporting integration

3. **Phase 12: Organizational Structure Integration** (New Phase)
   - Role-based activity mapping
   - Time allocation tracking
   - Role-based performance tracking

### 9.2 Enhancements to Existing Phases

1. **Phase 5.2: CS-Support AI Agents** (Enhancement)
   - Add JTBD definitions for each agent
   - Add role-based activity mapping
   - Add RevOps integration

2. **Phase 6: Customer Success Module** (Enhancement)
   - Add role-based performance tracking
   - Add time allocation tracking

---

## 10. Key Takeaways

1. **AI Agent Framework:** CS-Support Service needs the same comprehensive agent framework as Sales CRM Service, including JTBD, orchestration, error handling, and monitoring.

2. **JTBD Framework:** Critical for defining agent roles, responsibilities, and expected outcomes. Must be integrated into agent briefs and system prompts.

3. **RevOps Integration:** All agent activities must be tracked, scored, and attributed to human roles for proper performance measurement and revenue attribution.

4. **Human Roles Integration:** Agent activities must be mapped to organizational roles (CSM, Support Agent, Solutions Engineer) for proper attribution and performance tracking.

5. **Consistency:** CS-Support Service should mirror Sales CRM Service's agent framework architecture for maintainability and consistency across services.

---

## Next Steps

1. Update CS-Support PRD with new sections and enhancements
2. Update CS-Support Implementation Plan with new phases and tasks
3. Create database schema for agent configuration
4. Design JTBD framework structure
5. Plan RevOps integration with Internal Ops Service
