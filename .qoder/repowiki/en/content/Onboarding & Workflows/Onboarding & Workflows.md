# Onboarding & Workflows

<cite>
**Referenced Files in This Document**
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql)
- [011_law_firm_onboarding_flow.sql](file://database/migrations/011_law_firm_onboarding_flow.sql)
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql)
- [020_add_template_key_to_onboarding_sequences.sql](file://database/migrations/020_add_template_key_to_onboarding_sequences.sql)
- [032_separate_onboarding_from_csm.sql](file://database/migrations/032_separate_onboarding_from_csm.sql)
- [seed_onboarding_sequence_templates.sql](file://database/seed_onboarding_sequence_templates.sql)
- [seed_communication_templates.sql](file://database/seed_communication_templates.sql)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts)
- [post-onboarding-flows.ts](file://lib/services/post-onboarding-flows.ts)
- [post-onboarding-flows.ts](file://scripts/scheduled-jobs/post-onboarding-flows.ts)
- [onboarding-communication.ts](file://docs/01-main/SAAS_ADMIN_IMPLEMENTATION/services/onboarding-communication.ts)
- [onboarding-sequences.ts](file://docs/01-main/SAAS_ADMIN_IMPLEMENTATION/services/onboarding-sequences.ts)
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
This document explains the customer onboarding system and workflow automation for law firms, focusing on:
- Step-by-step onboarding sequences and progress tracking
- Milestone completion workflows and communication automation
- Onboarding template system and sequence execution logic
- Integration with customer success management (CSM) and post-onboarding flows
- Customization guidelines for sequences, steps, and automated notifications
- Examples of progress monitoring and completion analytics
- Troubleshooting and optimization recommendations

The system separates onboarding template design and orchestration from post-onboarding customer success management, enabling scalable automation and tenant-specific customization.

## Project Structure
The onboarding system spans database schemas, API endpoints, services, and documentation. Key areas:
- Database migrations define onboarding sequences, milestones, communications, law firm-specific steps, and success playbooks
- API endpoints expose dashboard data for post-onboarding CSM dashboards
- Services implement scheduled post-onboarding flows and integrate with communication templates
- Documentation outlines onboarding sequence and communication services used by SaaS Admin

```mermaid
graph TB
subgraph "Database"
OS["cs_onboarding_sequences"]
OM["cs_onboarding_milestones"]
OC["cs_onboarding_communications"]
OMC["cs_onboarding_milestone_completions"]
LFP["cs_onboarding_firm_profile"]
LFC["cs_onboarding_phone_config"]
LCCI["cs_onboarding_calendar_integrations"]
LCS["cs_onboarding_compliance_settings"]
OSC["cs_onboarding_step_completions"]
SP["cs_success_playbooks"]
PE["cs_playbook_executions"]
PSE["cs_playbook_step_executions"]
PT["cs_playbook_templates"]
PO["cs_playbook_outcomes"]
end
subgraph "API"
DASH["GET /api/v1/dashboard/onboarding"]
end
subgraph "Services"
POS["post-onboarding-flows (lib)"]
SCHED["post-onboarding-flows (scripts)"]
end
DASH --> OS
POS --> OC
SCHED --> OC
OS --> OM
OM --> OC
OM --> OMC
OS --> SP
SP --> PE
PE --> PSE
PE --> PO
OS --> LFP
OS --> LFC
OS --> LCCI
OS --> LCS
OS --> OSC
```

**Diagram sources**
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L8-L26)
- [011_law_firm_onboarding_flow.sql](file://database/migrations/011_law_firm_onboarding_flow.sql#L27-L158)
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql#L7-L198)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L23-L51)
- [post-onboarding-flows.ts](file://lib/services/post-onboarding-flows.ts#L1-L200)
- [post-onboarding-flows.ts](file://scripts/scheduled-jobs/post-onboarding-flows.ts#L1-L200)

**Section sources**
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L1-L255)
- [011_law_firm_onboarding_flow.sql](file://database/migrations/011_law_firm_onboarding_flow.sql#L1-L251)
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql#L1-L310)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L1-L60)

## Core Components
- Onboarding sequences: Tenant-aware templates with stages, milestones, and communication flows
- Milestones: Individual goals with trigger conditions and communication triggers
- Law firm onboarding: Phase-based steps (profile, phone config, integrations, compliance) with step completion tracking
- Post-onboarding dashboards: CSM-focused analytics for customers after onboarding
- Success playbooks: Automated, tenant-aware workflows with templated steps and outcomes
- Communication templates: Seeded templates for pre-onboarding, onboarding call, and post-onboarding touchpoints
- Scheduled flows: Background jobs orchestrating post-onboarding automation

**Section sources**
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L8-L99)
- [011_law_firm_onboarding_flow.sql](file://database/migrations/011_law_firm_onboarding_flow.sql#L26-L158)
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql#L7-L198)
- [seed_onboarding_sequence_templates.sql](file://database/seed_onboarding_sequence_templates.sql#L19-L81)
- [seed_communication_templates.sql](file://database/seed_communication_templates.sql#L7-L122)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L23-L51)

## Architecture Overview
The system is composed of:
- Data model: Sequence templates, milestones, law firm steps, communications, completions, and playbook execution
- API: Post-onboarding dashboard endpoint for CSM roles
- Services: Post-onboarding automation via scheduled jobs and runtime services
- Documentation: Onboarding sequence and communication services for SaaS Admin

```mermaid
sequenceDiagram
participant Client as "Client App"
participant API as "Dashboard API"
participant Supabase as "Supabase Client"
participant Service as "CustomerSuccessDashboardService"
Client->>API : GET /api/v1/dashboard/onboarding
API->>API : withTeamMember()
API->>Supabase : fetch tenant_id by clerk_user_id
Supabase-->>API : tenant_id
API->>Service : getDashboardData(tenantId)
Service-->>API : dashboard data (post-onboarding customers)
API-->>Client : successResponse(dashboardData)
```

**Diagram sources**
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L23-L51)

**Section sources**
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L1-L60)

## Detailed Component Analysis

### Onboarding Sequences and Milestones
- Sequences define stages, milestones, and communication flows; templates are tenant-aware and default-enabled
- Milestones capture required actions, trigger conditions, and channel-specific communication triggers
- Sequences link to law firm steps and communicate via seeded templates

```mermaid
erDiagram
CS_ONBOARDING_SEQUENCES {
uuid sequence_id PK
varchar name
text description
uuid tenant_id
boolean is_default
boolean is_active
jsonb stages
jsonb milestones
jsonb communication_flows
int estimated_duration_days
uuid created_by
timestamptz created_at
timestamptz updated_at
}
CS_ONBOARDING_MILESTONES {
uuid milestone_id PK
uuid sequence_id FK
varchar milestone_key
varchar milestone_name
text description
varchar stage
jsonb required_actions
jsonb trigger_conditions
boolean trigger_email
boolean trigger_sms
boolean trigger_call
uuid email_template_id
uuid sms_template_id
uuid call_script_id
int days_after_previous
int due_days_after_start
int order_index
timestamptz created_at
timestamptz updated_at
}
CS_ONBOARDING_COMMUNICATIONS {
uuid communication_id PK
uuid onboarding_progress_id FK
uuid milestone_id FK
uuid tenant_id
varchar customer_email
varchar communication_type
varchar direction
varchar status
varchar subject
text body
uuid template_id
varchar email_message_id
varchar sms_message_id
varchar call_sid
int call_duration_seconds
text call_recording_url
timestamptz scheduled_at
timestamptz sent_at
timestamptz delivered_at
timestamptz opened_at
timestamptz clicked_at
timestamptz replied_at
timestamptz completed_at
jsonb response_data
jsonb metadata
timestamptz created_at
timestamptz updated_at
}
CS_ONBOARDING_MILESTONE_COMPLETIONS {
uuid completion_id PK
uuid onboarding_progress_id FK
uuid milestone_id FK
uuid tenant_id
varchar customer_email
timestamptz completed_at
varchar completion_method
uuid completed_by
jsonb completion_data
boolean verified
timestamptz verified_at
uuid verified_by
timestamptz created_at
}
CS_ONBOARDING_SEQUENCES ||--o{ CS_ONBOARDING_MILESTONES : "contains"
CS_ONBOARDING_MILESTONES ||--o{ CS_ONBOARDING_COMMUNICATIONS : "triggers"
CS_ONBOARDING_MILESTONES ||--o{ CS_ONBOARDING_MILESTONE_COMPLETIONS : "completed"
```

**Diagram sources**
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L8-L163)

**Section sources**
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L8-L99)
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L101-L163)

### Law Firm Onboarding Flow
- Phases and steps track firm profile, phone configuration, calendar/email integrations, compliance settings, and step completions
- Progress includes phase tracking, internal status, and completion percentage
- Step completions record method, timestamps, and progress deltas

```mermaid
flowchart TD
Start(["Onboarding Progress Created"]) --> Phase1["Phase 1: Self-Serve Setup"]
Phase1 --> Step1["Step 1: Firm Profile"]
Step1 --> Step2["Step 2: Phone Configuration"]
Step2 --> Step3["Step 3: Calendar & Email Integrations"]
Step3 --> Step4["Step 4: Compliance Settings"]
Step4 --> Phase2["Phase 2: Internal Configuration"]
Phase2 --> Phase3["Phase 3: Go-Live"]
Phase3 --> Phase4["Phase 4: Success Call"]
Phase4 --> Completed["Completed"]
Step1 --> StepCompletion1["Record Step Completion"]
Step2 --> StepCompletion2["Record Step Completion"]
Step3 --> StepCompletion3["Record Step Completion"]
Step4 --> StepCompletion4["Record Step Completion"]
```

**Diagram sources**
- [011_law_firm_onboarding_flow.sql](file://database/migrations/011_law_firm_onboarding_flow.sql#L6-L158)

**Section sources**
- [011_law_firm_onboarding_flow.sql](file://database/migrations/011_law_firm_onboarding_flow.sql#L26-L158)

### Post-Onboarding Dashboards and CSM Integration
- The dashboard endpoint serves post-onboarding analytics to CSM roles
- Access is restricted to authorized roles; data is tenant-scoped

```mermaid
sequenceDiagram
participant CSM as "CSM User"
participant API as "Dashboard API"
participant DB as "Supabase"
participant SVC as "CustomerSuccessDashboardService"
CSM->>API : GET /api/v1/dashboard/onboarding
API->>DB : lookup tenant_id by user identity
DB-->>API : tenant_id
API->>SVC : getDashboardData(tenantId)
SVC-->>API : dashboard metrics
API-->>CSM : successResponse(dashboardData)
```

**Diagram sources**
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L23-L51)

**Section sources**
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L1-L60)

### Success Playbooks and Automated Workflows
- Playbooks define trigger conditions, steps, and execution windows
- Executions track status, progress, and outcomes
- Templates encapsulate personalized content and variables

```mermaid
classDiagram
class SuccessPlaybook {
+playbook_id
+tenant_id
+playbook_name
+playbook_category
+trigger_type
+trigger_conditions
+steps
+max_executions_per_customer
+execution_window_days
+cooldown_days
+is_active
+is_default
+metadata
}
class PlaybookExecution {
+execution_id
+playbook_id
+tenant_id
+customer_email
+status
+current_step_id
+current_step_order
+started_at
+completed_at
+paused_at
+paused_reason
+steps_completed
+steps_total
+completion_percentage
+execution_result
+execution_notes
+triggered_by
+trigger_event_id
+trigger_data
+metadata
}
class PlaybookStepExecution {
+step_execution_id
+execution_id
+step_id
+step_order
+step_type
+step_name
+step_config
+status
+scheduled_at
+started_at
+completed_at
+execution_result
+error_message
+retry_count
+metadata
}
class PlaybookTemplate {
+template_id
+playbook_id
+tenant_id
+template_name
+template_type
+subject
+body_text
+body_html
+variables
+personalization_enabled
+personalization_rules
+is_active
+is_default
+metadata
}
class PlaybookOutcome {
+outcome_id
+execution_id
+tenant_id
+customer_email
+outcome_type
+outcome_value
+outcome_description
+outcome_metrics
+attributed_to_playbook
+confidence_score
+outcome_date
+detected_at
+metadata
}
SuccessPlaybook "1" --> "many" PlaybookExecution : "creates"
PlaybookExecution "1" --> "many" PlaybookStepExecution : "runs"
SuccessPlaybook "1" --> "many" PlaybookTemplate : "owns"
PlaybookExecution "1" --> "many" PlaybookOutcome : "produces"
```

**Diagram sources**
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql#L7-L198)

**Section sources**
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql#L7-L198)

### Communication Templates and Automation
- Templates are seeded for pre-onboarding, onboarding call, and post-onboarding journeys
- They include variables, trigger types, and timing offsets
- Sequences reference templates to automate emails, SMS, and calls

```mermaid
flowchart TD
Seq["Sequence Template"] --> Milestone["Milestone"]
Milestone --> Trigger{"Trigger Conditions Met?"}
Trigger --> |Yes| Template["Select Communication Template"]
Template --> Send["Send Communication"]
Send --> Track["Log Communication & Status"]
Trigger --> |No| Wait["Wait / Reassess"]
```

**Diagram sources**
- [seed_communication_templates.sql](file://database/seed_communication_templates.sql#L7-L122)
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L66-L99)

**Section sources**
- [seed_onboarding_sequence_templates.sql](file://database/seed_onboarding_sequence_templates.sql#L19-L81)
- [seed_communication_templates.sql](file://database/seed_communication_templates.sql#L7-L122)
- [020_add_template_key_to_onboarding_sequences.sql](file://database/migrations/020_add_template_key_to_onboarding_sequences.sql#L1-L200)

### Post-Onboarding Automation and Scheduled Jobs
- Services and scripts coordinate post-onboarding automation
- They can evaluate completion events, schedule reminders, and trigger follow-ups

```mermaid
sequenceDiagram
participant Scheduler as "Scheduler Job"
participant Service as "post-onboarding-flows"
participant DB as "Onboarding Tables"
participant Templates as "Communication Templates"
Scheduler->>Service : evaluatePostOnboardingEvents()
Service->>DB : query pending milestones/completions
DB-->>Service : records requiring action
Service->>Templates : resolve template by key
Templates-->>Service : template content + variables
Service->>DB : create scheduled communications
Service-->>Scheduler : log execution results
```

**Diagram sources**
- [post-onboarding-flows.ts](file://lib/services/post-onboarding-flows.ts#L1-L200)
- [post-onboarding-flows.ts](file://scripts/scheduled-jobs/post-onboarding-flows.ts#L1-L200)

**Section sources**
- [post-onboarding-flows.ts](file://lib/services/post-onboarding-flows.ts#L1-L200)
- [post-onboarding-flows.ts](file://scripts/scheduled-jobs/post-onboarding-flows.ts#L1-L200)

## Dependency Analysis
- Sequences depend on milestones; milestones depend on communications and completions
- Law firm steps depend on progress tracking and step completion records
- Playbooks depend on templates and execution records
- Dashboard API depends on tenant-scoped data and CSM roles
- Communication automation depends on template keys and trigger configurations

```mermaid
graph LR
OS["cs_onboarding_sequences"] --> OM["cs_onboarding_milestones"]
OM --> OC["cs_onboarding_communications"]
OM --> OMC["cs_onboarding_milestone_completions"]
OS --> LFP["cs_onboarding_firm_profile"]
OS --> LFC["cs_onboarding_phone_config"]
OS --> LCCI["cs_onboarding_calendar_integrations"]
OS --> LCS["cs_onboarding_compliance_settings"]
OS --> OSC["cs_onboarding_step_completions"]
SP["cs_success_playbooks"] --> PE["cs_playbook_executions"]
PE --> PSE["cs_playbook_step_executions"]
SP --> PT["cs_playbook_templates"]
PE --> PO["cs_playbook_outcomes"]
DASH["/api/v1/dashboard/onboarding"] --> OS
```

**Diagram sources**
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L8-L163)
- [011_law_firm_onboarding_flow.sql](file://database/migrations/011_law_firm_onboarding_flow.sql#L26-L158)
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql#L7-L198)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L23-L51)

**Section sources**
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L1-L255)
- [011_law_firm_onboarding_flow.sql](file://database/migrations/011_law_firm_onboarding_flow.sql#L1-L251)
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql#L1-L310)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L1-L60)

## Performance Considerations
- Indexes on tenant-scoped fields and status filters improve query performance for dashboards and automation
- JSONB fields enable flexible schema evolution but require careful indexing and query planning
- RLS policies ensure tenant isolation; verify policy coverage for all relevant tables
- Scheduled jobs should batch operations and avoid redundant updates

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Access denied to dashboard: Ensure the user has the required CSM role and belongs to the correct tenant
- Missing communication logs: Verify template keys, trigger conditions, and milestone completion records
- Law firm step not progressing: Confirm step completion entries and progress percentage updates
- Playbook not executing: Check playbook activation, trigger conditions, and execution window settings
- Post-onboarding automation delays: Inspect scheduled job logs and template availability

**Section sources**
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L26-L30)
- [009_onboarding_sequences.sql](file://database/migrations/009_onboarding_sequences.sql#L165-L177)
- [011_law_firm_onboarding_flow.sql](file://database/migrations/011_law_firm_onboarding_flow.sql#L160-L167)
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql#L200-L224)

## Conclusion
The onboarding and workflow system provides a robust, tenant-aware framework for law firm onboarding, including structured sequences, milestones, law firm-specific steps, and automated communications. Post-onboarding dashboards and success playbooks enable effective customer success management. The separation of onboarding templates (SaaS Admin) from post-onboarding operations (CS-Support) supports scalability and customization.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Customization Playbook
- Define new sequence templates with stages, milestones, and communication flows
- Add or modify communication templates with variables and trigger rules
- Configure law firm step definitions and completion tracking
- Set up success playbooks with trigger conditions and step configurations
- Use dashboard endpoints to monitor progress and outcomes

**Section sources**
- [seed_onboarding_sequence_templates.sql](file://database/seed_onboarding_sequence_templates.sql#L19-L81)
- [seed_communication_templates.sql](file://database/seed_communication_templates.sql#L7-L122)
- [015_success_playbooks.sql](file://database/migrations/015_success_playbooks.sql#L7-L54)
- [route.ts](file://app/api/v1/dashboard/onboarding/route.ts#L23-L51)