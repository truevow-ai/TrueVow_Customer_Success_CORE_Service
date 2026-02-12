# Customer Success Integration

<cite>
**Referenced Files in This Document**
- [CSM_ONBOARDING_WORKFLOW.md](file://docs/setup/CSM_ONBOARDING_WORKFLOW.md)
- [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md)
- [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md)
- [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md)
- [onboarding-dashboard.ts](file://lib/services/onboarding-dashboard.ts)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts)
- [OnboardingDashboard.tsx](file://components/cs-support/dashboard/OnboardingDashboard.tsx)
- [page.tsx](file://app/(dashboard)/dashboard/page.tsx)
- [Sidebar.tsx](file://components/layout/Sidebar.tsx)
- [time-tracking/route.ts](file://app/api/v1/integrations/internal-ops/time-tracking/route.ts)
- [onboarding-sequences.ts](file://docs/01-main/SAAS_ADMIN_IMPLEMENTATION/services/onboarding-sequences.ts)
- [tickets.ts](file://lib/repositories/tickets.ts)
- [renewal-orchestration.ts](file://lib/services/renewal-orchestration.ts)
- [health-scoring.ts](file://lib/services/health-scoring.ts)
- [internal-ops-client.ts](file://lib/integrations/internal-ops-client.ts)
- [cs_onboarding_firm_profile](file://database/migrations/011_law_firm_onboarding_flow.sql)
- [cs_onboarding_phone_config](file://database/migrations/011_law_firm_onboarding_flow.sql)
- [cs_onboarding_calendar_integrations](file://database/migrations/011_law_firm_onboarding_flow.sql)
- [cs_onboarding_compliance_settings](file://database/migrations/011_law_firm_onboarding_flow.sql)
- [cs_onboarding_step_completions](file://database/migrations/011_law_firm_onboarding_flow.sql)
- [cs_customer_onboarding_progress](file://database/migrations/011_law_firm_onboarding_flow.sql)
- [post-onboarding-flows.ts](file://scripts/scheduled-jobs/post-onboarding-flows.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the customer success integration within the onboarding system, focusing on CSM (Customer Success Manager) assignment workflows, internal status tracking, success metrics, and law firm-specific onboarding processes. It also covers compliance requirements, integration with customer profiles and subscription management, success dashboard reporting, internal operations integration, time tracking, and performance monitoring. Practical examples demonstrate configuring CSM assignments, setting up success milestones, and managing customer health indicators. Finally, it addresses integration troubleshooting, data synchronization issues, and optimization strategies for customer success workflows.

## Project Structure
The customer success integration spans documentation, backend services, API endpoints, UI dashboards, and database schemas tailored for law firm onboarding. Key areas include:
- Law firm onboarding flow with five self-serve steps and internal configuration phases
- CSM dashboard for onboarding visibility and metrics
- Internal operations integration for RevOps, time tracking, and performance analytics
- Health scoring and renewal orchestration services
- Database schema supporting onboarding progress, compliance, and integrations

```mermaid
graph TB
subgraph "Documentation"
WF["CSM Onboarding Workflow<br/>docs/setup/CSM_ONBOARDING_WORKFLOW.md"]
LF["Law Firm Onboarding Flow<br/>docs/setup/LAW_FIRM_ONBOARDING_FLOW.md"]
DASH["CSM Dashboard Implementation<br/>docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md"]
OPS["Internal Ops Integration Plan<br/>docs/INTERNAL_OPS_INTEGRATION_PLAN.md"]
end
subgraph "Backend Services"
SVC["Onboarding Dashboard Service<br/>lib/services/onboarding-dashboard.ts"]
SEQ["Onboarding Sequences<br/>docs/01-main/SAAS_ADMIN_IMPLEMENTATION/services/onboarding-sequences.ts"]
HEALTH["Health Scoring<br/>lib/services/health-scoring.ts"]
RENEW["Renewal Orchestration<br/>lib/services/renewal-orchestration.ts"]
TICK["Tickets Repository<br/>lib/repositories/tickets.ts"]
end
subgraph "API Layer"
API["Onboarding Dashboard API<br/>app/api/v1/dashboard/onboarding/route.ts"]
TIME["Internal Ops Time Tracking<br/>app/api/v1/integrations/internal-ops/time-tracking/route.ts"]
end
subgraph "UI Components"
UI["Onboarding Dashboard Component<br/>components/cs-support/dashboard/OnboardingDashboard.tsx"]
PAGE["Dashboard Page<br/>app/(dashboard)/dashboard/page.tsx"]
NAV["Sidebar Navigation<br/>components/layout/Sidebar.tsx"]
end
subgraph "Database Schema"
FIRM["cs_onboarding_firm_profile"]
PHONE["cs_onboarding_phone_config"]
CALENDAR["cs_onboarding_calendar_integrations"]
COMPL["cs_onboarding_compliance_settings"]
STEP["cs_onboarding_step_completions"]
PROG["cs_customer_onboarding_progress"]
end
WF --> LF
LF --> SVC
SVC --> API
API --> UI
UI --> PAGE
PAGE --> NAV
LF --> FIRM
LF --> PHONE
LF --> CALENDAR
LF --> COMPL
LF --> STEP
LF --> PROG
OPS --> SVC
OPS --> TIME
OPS --> TICK
OPS --> RENEW
OPS --> HEALTH
```

**Diagram sources**
- [CSM_ONBOARDING_WORKFLOW.md](file://docs/setup/CSM_ONBOARDING_WORKFLOW.md#L1-L327)
- [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md#L1-L271)
- [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md#L1-L319)
- [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L1-L522)
- [onboarding-dashboard.ts](file://lib/services/onboarding-dashboard.ts#L1-L319)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L1-L73)
- [OnboardingDashboard.tsx](file://components/cs-support/dashboard/OnboardingDashboard.tsx#L1-L121)
- [page.tsx](file://app/(dashboard)/dashboard/page.tsx#L1-L134)
- [Sidebar.tsx](file://components/layout/Sidebar.tsx#L1-L146)
- [cs_onboarding_firm_profile](file://database/migrations/011_law_firm_onboarding_flow.sql#L119-L144)
- [cs_onboarding_phone_config](file://database/migrations/011_law_firm_onboarding_flow.sql#L125-L129)
- [cs_onboarding_calendar_integrations](file://database/migrations/011_law_firm_onboarding_flow.sql#L130-L134)
- [cs_onboarding_compliance_settings](file://database/migrations/011_law_firm_onboarding_flow.sql#L135-L139)
- [cs_onboarding_step_completions](file://database/migrations/011_law_firm_onboarding_flow.sql#L140-L144)
- [cs_customer_onboarding_progress](file://database/migrations/011_law_firm_onboarding_flow.sql#L147-L151)

**Section sources**
- [CSM_ONBOARDING_WORKFLOW.md](file://docs/setup/CSM_ONBOARDING_WORKFLOW.md#L1-L327)
- [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md#L1-L271)
- [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md#L1-L319)
- [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L1-L522)

## Core Components
- Law Firm Onboarding Flow: Implements five self-serve steps with progress tracking, internal configuration phases, automated go-live notifications, and success call tracking. See [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md#L1-L271).
- CSM Dashboard: Provides onboarding pipeline views, customer detail insights, and post-onboarding support metrics. See [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md#L1-L319).
- Internal Ops Integration: Enables RevOps activity logging, time tracking enrichment, task automation for churn risk, and performance analytics. See [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L1-L522).
- Health Scoring and Renewal Orchestration: Calculates customer health scores and detects renewal risks to trigger tasks and alerts. See [health-scoring.ts](file://lib/services/health-scoring.ts#L1-L200) and [renewal-orchestration.ts](file://lib/services/renewal-orchestration.ts#L1-L200).
- Database Schema: Supports onboarding progress, compliance settings, calendar integrations, and step completions. See [cs_onboarding_firm_profile](file://database/migrations/011_law_firm_onboarding_flow.sql#L119-L144) and related tables.

**Section sources**
- [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md#L1-L271)
- [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md#L1-L319)
- [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L1-L522)
- [health-scoring.ts](file://lib/services/health-scoring.ts#L1-L200)
- [renewal-orchestration.ts](file://lib/services/renewal-orchestration.ts#L1-L200)

## Architecture Overview
The customer success integration follows a layered architecture:
- Documentation layer defines workflows, compliance, and metrics.
- Backend services encapsulate onboarding, health scoring, renewal orchestration, and internal ops integrations.
- API layer exposes endpoints for dashboard data retrieval and internal ops time tracking.
- UI layer presents actionable dashboards and navigation for CSMs.
- Database layer persists onboarding progress, compliance, integrations, and step completions.

```mermaid
graph TB
CSM["CSM"]
Portal["Customer Portal"]
API["Onboarding Dashboard API"]
Service["Onboarding Dashboard Service"]
DB["Onboarding Progress Tables"]
Health["Health Scoring Service"]
Renewal["Renewal Orchestration Service"]
InternalOps["Internal Ops Service"]
CSM --> Portal
Portal --> API
API --> Service
Service --> DB
Service --> Health
Service --> Renewal
Service --> InternalOps
```

**Diagram sources**
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L1-L73)
- [onboarding-dashboard.ts](file://lib/services/onboarding-dashboard.ts#L1-L319)
- [health-scoring.ts](file://lib/services/health-scoring.ts#L1-L200)
- [renewal-orchestration.ts](file://lib/services/renewal-orchestration.ts#L1-L200)
- [internal-ops-client.ts](file://lib/integrations/internal-ops-client.ts#L336-L404)

## Detailed Component Analysis

### Law Firm Onboarding Workflow
The workflow is human-led and structured across six stages:
- Lead handoff from sales CRM with CSM assignment and pre-onboarding email trigger.
- Pre-onboarding preparation with checklist tracking and calendar booking unlock.
- 45-minute onboarding call covering firm/team profile, phone number setup, calendar/email integration, compliance/data settings, review/submit, and next steps.
- Internal configuration phase with status updates and ticket creation for configuration team.
- Automated go-live notification and unlock of success call booking.
- Post-onboarding support with intensive support for 30 days, continued support for 30 days, and transition support for 30 days, with AI agent escalation and health scoring.

```mermaid
flowchart TD
Start(["Lead Handoff"]) --> Prep["Pre-Onboarding Preparation"]
Prep --> Call["45-Minute Onboarding Call"]
Call --> Config["Internal Configuration"]
Config --> Live["Go-Live & Testing"]
Live --> Post["Post-Onboarding Support (90 Days)"]
Post --> End(["Completed"])
```

**Diagram sources**
- [CSM_ONBOARDING_WORKFLOW.md](file://docs/setup/CSM_ONBOARDING_WORKFLOW.md#L16-L235)

**Section sources**
- [CSM_ONBOARDING_WORKFLOW.md](file://docs/setup/CSM_ONBOARDING_WORKFLOW.md#L1-L327)

### Law Firm Onboarding Flow Implementation
The implementation includes:
- Five self-serve steps with progress tracking and storage in dedicated tables.
- Internal status tracking for configuration phases.
- Automated go-live notifications via Twilio/SendGrid.
- Success call scheduling and completion tracking.
- Compliance guardrails ensuring sensitive data is not stored.
- Integration points with platform services, Twilio, SendGrid, and Calendly.

```mermaid
erDiagram
CS_CUSTOMER_ONBOARDING_PROGRESS {
enum onboarding_phase
enum internal_status
int onboarding_completion_percentage
}
CS_ONBOARDING_FIRM_PROFILE {
string firm_name
string[] practice_areas
string state
string timezone
json[] attorneys_staff
}
CS_ONBOARDING_PHONE_CONFIG {
enum setup_method
string[] twilio_numbers
string carrier_detection
}
CS_ONBOARDING_CALENDAR_INTEGRATIONS {
string encrypted_oauth_token
enum calendar_type
boolean master_calendar
}
CS_ONBOARDING_COMPLIANCE_SETTINGS {
boolean zero_knowledge_default
boolean transcript_opt_in
datetime consent_timestamp
}
CS_ONBOARDING_STEP_COMPLETIONS {
int step_number
int completion_percentage
json completion_data
}
CS_CUSTOMER_ONBOARDING_PROGRESS ||--|| CS_ONBOARDING_FIRM_PROFILE : "stores"
CS_CUSTOMER_ONBOARDING_PROGRESS ||--o{ CS_ONBOARDING_PHONE_CONFIG : "stores"
CS_CUSTOMER_ONBOARDING_PROGRESS ||--o{ CS_ONBOARDING_CALENDAR_INTEGRATIONS : "stores"
CS_CUSTOMER_ONBOARDING_PROGRESS ||--o{ CS_ONBOARDING_COMPLIANCE_SETTINGS : "stores"
CS_CUSTOMER_ONBOARDING_PROGRESS ||--o{ CS_ONBOARDING_STEP_COMPLETIONS : "tracks"
```

**Diagram sources**
- [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md#L117-L151)
- [cs_onboarding_firm_profile](file://database/migrations/011_law_firm_onboarding_flow.sql#L119-L124)
- [cs_onboarding_phone_config](file://database/migrations/011_law_firm_onboarding_flow.sql#L125-L129)
- [cs_onboarding_calendar_integrations](file://database/migrations/011_law_firm_onboarding_flow.sql#L130-L134)
- [cs_onboarding_compliance_settings](file://database/migrations/011_law_firm_onboarding_flow.sql#L135-L139)
- [cs_onboarding_step_completions](file://database/migrations/011_law_firm_onboarding_flow.sql#L140-L144)
- [cs_customer_onboarding_progress](file://database/migrations/011_law_firm_onboarding_flow.sql#L147-L151)

**Section sources**
- [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md#L1-L271)

### CSM Dashboard Implementation
The dashboard aggregates onboarding progress, health scores, milestone statistics, and communication activity. It provides:
- Summary cards for total active, completed, at-risk customers, average progress, and average health score.
- Active customers list with progress bars, health scores, and communication counts.
- At-risk customers highlighting requiring attention.
- Milestone statistics and communication activity metrics.
- UI components integrated into the main dashboard page with sidebar navigation.

```mermaid
sequenceDiagram
participant User as "CSM"
participant Page as "Dashboard Page"
participant Comp as "OnboardingDashboard Component"
participant API as "Onboarding Dashboard API"
participant Service as "OnboardingDashboardService"
User->>Page : Navigate to /dashboard/dashboard
Page->>Comp : Render component
Comp->>API : GET /api/v1/dashboard/onboarding
API->>Service : getDashboardData(tenantId)
Service-->>API : Aggregated metrics and lists
API-->>Comp : JSON response
Comp-->>User : Render dashboard with metrics
```

**Diagram sources**
- [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md#L200-L221)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L46-L72)
- [onboarding-dashboard.ts](file://lib/services/onboarding-dashboard.ts#L18-L31)

**Section sources**
- [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md#L1-L319)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L1-L73)
- [OnboardingDashboard.tsx](file://components/cs-support/dashboard/OnboardingDashboard.tsx#L1-L121)
- [page.tsx](file://app/(dashboard)/dashboard/page.tsx#L1-L134)
- [Sidebar.tsx](file://components/layout/Sidebar.tsx#L1-L146)

### Internal Ops Integration
The integration enables:
- RevOps activity logging for ticket resolutions with revenue attribution.
- Time tracking enrichment with JTBD metadata for onboarding activities.
- Task automation for churn risk identification.
- Performance analytics and revenue attribution by JTBD.

```mermaid
sequenceDiagram
participant TicketRepo as "Tickets Repository"
participant InternalOps as "Internal Ops Service"
participant Client as "Internal Ops Client"
TicketRepo->>TicketRepo : updateStatus(resolved/closed)
TicketRepo->>InternalOps : logRevOpsActivity(ticket_resolved)
InternalOps-->>TicketRepo : activity_id
Note over TicketRepo,InternalOps : Revenue attribution type "retention"
```

**Diagram sources**
- [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L33-L80)
- [tickets.ts](file://lib/repositories/tickets.ts#L39-L59)
- [internal-ops-client.ts](file://lib/integrations/internal-ops-client.ts#L336-L404)

**Section sources**
- [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L1-L522)
- [tickets.ts](file://lib/repositories/tickets.ts#L39-L59)
- [internal-ops-client.ts](file://lib/integrations/internal-ops-client.ts#L336-L404)

### Health Scoring and Renewal Orchestration
Health scoring calculates customer health indicators, while renewal orchestration detects risk signals and creates tasks for CSMs. These services feed into the dashboard and internal ops integrations.

```mermaid
flowchart TD
Health["Health Scoring Service"] --> Dashboard["Onboarding Dashboard"]
Renewal["Renewal Orchestration Service"] --> Tasks["Internal Ops Tasks"]
Dashboard --> InternalOps["Internal Ops Analytics"]
Tasks --> InternalOps
```

**Diagram sources**
- [health-scoring.ts](file://lib/services/health-scoring.ts#L1-L200)
- [renewal-orchestration.ts](file://lib/services/renewal-orchestration.ts#L1-L200)
- [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md#L20-L31)

**Section sources**
- [health-scoring.ts](file://lib/services/health-scoring.ts#L1-L200)
- [renewal-orchestration.ts](file://lib/services/renewal-orchestration.ts#L1-L200)

### Success Metrics Integration
Success metrics include onboarding timelines, completion rates, AI agent resolution targets, CSM escalation thresholds, health score targets, and retention rates. These metrics are surfaced in the dashboard and used for performance monitoring and optimization.

**Section sources**
- [CSM_ONBOARDING_WORKFLOW.md](file://docs/setup/CSM_ONBOARDING_WORKFLOW.md#L298-L312)
- [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md#L174-L198)

## Dependency Analysis
The integration exhibits strong cohesion within services and clear separation of concerns:
- Onboarding dashboard service depends on database tables for progress, milestones, communications, and health scores.
- Internal ops integration depends on the internal ops client and triggers from tickets, calls, and renewal orchestration.
- Law firm onboarding flow depends on API endpoints for each step and database tables for persistence.

```mermaid
graph LR
DashboardService["OnboardingDashboardService"] --> DBTables["Onboarding Progress Tables"]
DashboardService --> HealthService["Health Scoring Service"]
DashboardService --> RenewalService["Renewal Orchestration Service"]
InternalOpsPlan["Internal Ops Integration Plan"] --> TicketsRepo["Tickets Repository"]
InternalOpsPlan --> TimeTrackingAPI["Time Tracking API"]
InternalOpsPlan --> RenewalService
InternalOpsPlan --> HealthService
LFWorkflow["Law Firm Onboarding Flow"] --> APISelfServe["Self-Serve APIs"]
LFWorkflow --> DBTables
```

**Diagram sources**
- [onboarding-dashboard.ts](file://lib/services/onboarding-dashboard.ts#L18-L31)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L46-L72)
- [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L33-L80)
- [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md#L96-L115)

**Section sources**
- [onboarding-dashboard.ts](file://lib/services/onboarding-dashboard.ts#L1-L319)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L1-L73)
- [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L1-L522)
- [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md#L96-L115)

## Performance Considerations
- Dashboard rendering performance: Optimize database queries and caching for aggregated metrics and lists.
- Real-time updates: Consider WebSocket connections or periodic polling for live dashboard updates.
- Time tracking efficiency: Batch track activities to reduce API overhead.
- Health scoring and renewal orchestration: Cache results and use background jobs for heavy computations.
- UI responsiveness: Implement skeleton loaders and error boundaries for dashboard components.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Dashboard data not loading:
  - Verify API endpoint authentication and tenant isolation.
  - Check database connectivity and table permissions.
  - Validate service method signatures and error handling.
- Internal ops integration failures:
  - Confirm API key or JWT authentication for internal ops client.
  - Validate activity metadata and revenue attribution types.
  - Review webhook endpoints for call and email tracking.
- Onboarding step failures:
  - Ensure input validation and sanitization for each step.
  - Check OAuth token encryption and calendar integration status.
  - Verify Twilio/SendGrid credentials and message templates.
- Compliance violations:
  - Audit stored data against compliance guardrails.
  - Implement auto-purge policies for tickets and screenshots.
- Scheduled job issues:
  - Validate cron job configuration and environment variables.
  - Monitor logs for errors and retry mechanisms.

**Section sources**
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L46-L72)
- [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L445-L465)
- [LAW_FIRM_ONBOARDING_FLOW.md](file://docs/setup/LAW_FIRM_ONBOARDING_FLOW.md#L215-L246)
- [post-onboarding-flows.ts](file://scripts/scheduled-jobs/post-onboarding-flows.ts#L1-L200)

## Conclusion
The customer success integration delivers a robust, law firm-focused onboarding system with clear CSM workflows, comprehensive internal status tracking, and success metrics. The CSM dashboard provides actionable insights, while internal ops integration ensures revenue attribution, time tracking, and performance monitoring. Compliance guardrails protect sensitive data, and the modular architecture supports scalability and maintenance. By following the documented workflows, configurations, and troubleshooting steps, teams can optimize customer success outcomes and streamline operational efficiency.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Examples and How-To Guides
- Configure CSM assignments:
  - Assign leads from sales CRM to CSMs and trigger pre-onboarding emails.
  - Update internal status during configuration and success call phases.
  - Reference: [CSM_ONBOARDING_WORKFLOW.md](file://docs/setup/CSM_ONBOARDING_WORKFLOW.md#L16-L147)
- Set up success milestones:
  - Define milestones in onboarding sequences and create follow-up tasks for churn risk.
  - Reference: [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L136-L182), [onboarding-sequences.ts](file://docs/01-main/SAAS_ADMIN_IMPLEMENTATION/services/onboarding-sequences.ts#L1-L200)
- Manage customer health indicators:
  - Calculate health scores and detect renewal risks to create tasks.
  - Reference: [health-scoring.ts](file://lib/services/health-scoring.ts#L1-L200), [renewal-orchestration.ts](file://lib/services/renewal-orchestration.ts#L1-L200)
- Integrate with customer profiles and subscriptions:
  - Use onboarding progress tables to manage profile data and compliance settings.
  - Reference: [cs_onboarding_firm_profile](file://database/migrations/011_law_firm_onboarding_flow.sql#L119-L124), [cs_customer_onboarding_progress](file://database/migrations/011_law_firm_onboarding_flow.sql#L147-L151)
- Enable success dashboard reporting:
  - Build dashboard components and API endpoints for metrics aggregation.
  - Reference: [CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md](file://docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md#L1-L319)
- Internal ops integration, time tracking, and performance monitoring:
  - Log RevOps activities, enrich time tracking with JTBD, and automate tasks for churn risk.
  - Reference: [INTERNAL_OPS_INTEGRATION_PLAN.md](file://docs/INTERNAL_OPS_INTEGRATION_PLAN.md#L1-L522), [internal-ops-client.ts](file://lib/integrations/internal-ops-client.ts#L336-L404)

[No sources needed since this section aggregates previously cited references]