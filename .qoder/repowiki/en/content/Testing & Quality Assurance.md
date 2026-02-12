# Testing & Quality Assurance

<cite>
**Referenced Files in This Document**
- [jest.config.js](file://jest.config.js)
- [jest.setup.js](file://jest.setup.js)
- [package.json](file://package.json)
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts)
- [__tests__/utils/test-helpers.ts](file://__tests__/utils/test-helpers.ts)
- [lib/services/health-scoring.ts](file://lib/services/health-scoring.ts)
- [lib/repositories/tickets.ts](file://lib/repositories/tickets.ts)
- [lib/db/supabase.ts](file://lib/db/supabase.ts)
- [scripts/run-all-tests.ts](file://scripts/run-all-tests.ts)
- [scripts/test-reporting-system.ts](file://scripts/test-reporting-system.ts)
- [scripts/test-jtbd-integration.ts](file://scripts/test-jtbd-integration.ts)
- [docs/TESTING_GUIDE.md](file://docs/TESTING_GUIDE.md)
- [docs/TESTING_QUICK_START.md](file://docs/TESTING_QUICK_START.md)
- [docs/AUTOMATED_TESTING_COMPLETE.md](file://docs/AUTOMATED_TESTING_COMPLETE.md)
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
This document defines the comprehensive testing and quality assurance strategy for the CS Support Service. It covers unit and integration testing patterns, API endpoint validation, database interaction testing, and automated workflows. It also documents the Jest configuration, test helpers, and testing utilities, along with guidelines for writing effective tests, mocking strategies, test data management, performance and regression testing, and continuous integration practices.

## Project Structure
The testing ecosystem is organized around:
- Jest configuration and setup for unit and integration tests
- Test helpers for database seeding and cleanup
- Example service tests demonstrating mocking and assertion patterns
- Automated test runners for end-to-end and integration scenarios
- Extensive documentation for manual and automated testing

```mermaid
graph TB
subgraph "Testing Config"
JCFG["jest.config.js"]
JSET["jest.setup.js"]
PKG["package.json"]
end
subgraph "Test Utilities"
TH["__tests__/utils/test-helpers.ts"]
end
subgraph "Examples"
EX["__tests__/examples/service-example.test.ts"]
end
subgraph "Automated Workflows"
RUNALL["scripts/run-all-tests.ts"]
REP["scripts/test-reporting-system.ts"]
JTBD["scripts/test-jtbd-integration.ts"]
end
subgraph "Documentation"
TG["docs/TESTING_GUIDE.md"]
TQS["docs/TESTING_QUICK_START.md"]
ATC["docs/AUTOMATED_TESTING_COMPLETE.md"]
end
JCFG --> EX
JSET --> EX
PKG --> RUNALL
PKG --> REP
PKG --> JTBD
TH --> EX
RUNALL --> ATC
REP --> ATC
JTBD --> ATC
TG --> JCFG
TQS --> RUNALL
```

**Diagram sources**
- [jest.config.js](file://jest.config.js#L1-L40)
- [jest.setup.js](file://jest.setup.js#L1-L33)
- [package.json](file://package.json#L5-L26)
- [__tests__/utils/test-helpers.ts](file://__tests__/utils/test-helpers.ts#L1-L104)
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts#L1-L80)
- [scripts/run-all-tests.ts](file://scripts/run-all-tests.ts#L1-L230)
- [scripts/test-reporting-system.ts](file://scripts/test-reporting-system.ts#L1-L264)
- [scripts/test-jtbd-integration.ts](file://scripts/test-jtbd-integration.ts#L1-L501)
- [docs/TESTING_GUIDE.md](file://docs/TESTING_GUIDE.md#L1-L619)
- [docs/TESTING_QUICK_START.md](file://docs/TESTING_QUICK_START.md#L1-L220)
- [docs/AUTOMATED_TESTING_COMPLETE.md](file://docs/AUTOMATED_TESTING_COMPLETE.md#L1-L163)

**Section sources**
- [jest.config.js](file://jest.config.js#L1-L40)
- [jest.setup.js](file://jest.setup.js#L1-L33)
- [package.json](file://package.json#L5-L26)
- [docs/TESTING_GUIDE.md](file://docs/TESTING_GUIDE.md#L1-L619)
- [docs/TESTING_QUICK_START.md](file://docs/TESTING_QUICK_START.md#L1-L220)
- [docs/AUTOMATED_TESTING_COMPLETE.md](file://docs/AUTOMATED_TESTING_COMPLETE.md#L1-L163)

## Core Components
- Jest configuration and environment setup for Next.js and DOM simulation
- Test helpers for database seeding, cleanup, and Supabase mocking
- Example service tests demonstrating mocking Supabase client and service methods
- Automated test runners for integrated workflows and reporting systems
- Documentation for manual and automated testing procedures

Key capabilities:
- Unit tests for services and repositories with isolated mocking
- Integration tests for API endpoints and cross-service flows
- Automated end-to-end workflows for dialer, SMS, AI agents, and onboarding flows
- Comprehensive reporting and CI-friendly exit codes

**Section sources**
- [jest.config.js](file://jest.config.js#L9-L36)
- [jest.setup.js](file://jest.setup.js#L4-L25)
- [__tests__/utils/test-helpers.ts](file://__tests__/utils/test-helpers.ts#L67-L97)
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts#L9-L36)
- [scripts/run-all-tests.ts](file://scripts/run-all-tests.ts#L26-L47)
- [docs/TESTING_GUIDE.md](file://docs/TESTING_GUIDE.md#L138-L221)

## Architecture Overview
The testing architecture separates concerns across layers:
- Unit tests validate service logic in isolation using mocked database clients
- Integration tests validate API endpoints and repository interactions
- End-to-end tests orchestrate multi-step workflows and external integrations
- Automated runners aggregate results and produce structured reports

```mermaid
graph TB
UT["Unit Tests<br/>Service/Repository"]
IT["Integration Tests<br/>API Routes"]
E2E["End-to-End Tests<br/>Workflows & Integrations"]
AR["Automated Runners<br/>Master & Feature Scripts"]
DOCS["Docs & Guides"]
UT --> AR
IT --> AR
E2E --> AR
AR --> DOCS
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Detailed Component Analysis

### Jest Configuration and Setup
- Configuration loads Next.js-aware Jest and sets up jsdom environment
- Module name mapping resolves aliases consistently
- Coverage thresholds and collection targets are defined
- Setup mocks environment variables and Next.js router for client-side tests

```mermaid
flowchart TD
Start(["Load jest.config.js"]) --> NextJest["Initialize Next.Jest"]
NextJest --> CustomCfg["Apply custom config:<br/>setupFilesAfterEnv, testEnvironment,<br/>moduleNameMapper, testMatch,<br/>collectCoverageFrom, coverageThreshold,<br/>testTimeout"]
CustomCfg --> Export["Export merged config"]
```

**Diagram sources**
- [jest.config.js](file://jest.config.js#L3-L6)
- [jest.config.js](file://jest.config.js#L9-L36)

**Section sources**
- [jest.config.js](file://jest.config.js#L1-L40)
- [jest.setup.js](file://jest.setup.js#L4-L25)

### Test Helpers and Utilities
- Database helpers create and clean test data for tickets and team members
- Supabase client mock provides a fluent chain for select/update/delete operations
- Auth mock provides test user/session identifiers

```mermaid
flowchart TD
CreateTicket["createTestTicket(data)"] --> Supabase["createServerSupabase()"]
Supabase --> Insert["from('cs_tickets').insert(...)"]
Insert --> Select["select().single()"]
Select --> ReturnTicket["Return ticket data"]
CreateMember["createTestTeamMember(data)"] --> Supabase2["createServerSupabase()"]
Supabase2 --> Insert2["from('cs_team_members').insert(...)"]
Insert2 --> Select2["select().single()"]
Select2 --> ReturnMember["Return member data"]
Cleanup["cleanupTestData(tenantId)"] --> DelTickets["Delete cs_tickets by tenant_id"]
Cleanup --> DelMembers["Delete cs_team_members by user_id"]
```

**Diagram sources**
- [__tests__/utils/test-helpers.ts](file://__tests__/utils/test-helpers.ts#L11-L30)
- [__tests__/utils/test-helpers.ts](file://__tests__/utils/test-helpers.ts#L35-L51)
- [__tests__/utils/test-helpers.ts](file://__tests__/utils/test-helpers.ts#L56-L62)

**Section sources**
- [__tests__/utils/test-helpers.ts](file://__tests__/utils/test-helpers.ts#L1-L104)

### Example Service Test Pattern
- Demonstrates mocking the Supabase client and service methods
- Validates health score calculation boundaries and error handling
- Uses spy-based mocking for service method stubs

```mermaid
sequenceDiagram
participant T as "Test"
participant Svc as "HealthScoringService"
participant Repo as "TicketRepository"
participant Supa as "Supabase Client"
T->>Svc : calculateHealthScore(tenantId, customerEmail)
Svc->>Supa : from('cs_customer_health_scores').select().eq().single()
Supa-->>Svc : existing health record or null
Svc->>Repo : findByCustomerEmail(...)
Repo-->>Svc : tickets[]
Svc->>Svc : calculateEngagementScore(...)
Svc->>Svc : calculateUsageScore(...)
Svc->>Svc : calculateSupportScore(...)
Svc->>Svc : calculateBillingScore(...)
Svc->>Svc : calculateProductFitScore(...)
Svc->>Supa : upsert(...).select().single()
Supa-->>Svc : saved health score
Svc-->>T : HealthScore result
```

**Diagram sources**
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts#L23-L78)
- [lib/services/health-scoring.ts](file://lib/services/health-scoring.ts#L56-L188)

**Section sources**
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts#L1-L80)
- [lib/services/health-scoring.ts](file://lib/services/health-scoring.ts#L52-L188)

### API Endpoint Testing Patterns
- Mock authentication and repository dependencies
- Construct NextRequest instances for route handlers
- Assert response status and payload structure

```mermaid
sequenceDiagram
participant Client as "Test Client"
participant Route as "Route Handler"
participant Auth as "Clerk Auth"
participant Repo as "TicketRepository"
participant Supa as "Supabase Client"
Client->>Route : POST /api/v1/tickets
Route->>Auth : validate()
Auth-->>Route : {userId}
Route->>Repo : create(ticketData)
Repo->>Supa : from('cs_tickets').insert().select().single()
Supa-->>Repo : ticket
Repo-->>Route : ticket
Route-->>Client : 201 Created {data : ticket}
```

**Diagram sources**
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts#L238-L261)
- [lib/repositories/tickets.ts](file://lib/repositories/tickets.ts#L76-L86)

**Section sources**
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts#L224-L261)
- [lib/repositories/tickets.ts](file://lib/repositories/tickets.ts#L1-L247)

### Automated Testing Workflows
- Master runner aggregates multiple functional tests, captures durations, and writes markdown reports
- Feature-specific runners validate reporting system, JTBD integration, and dialer verification
- CI-friendly exit codes distinguish between failures and configuration skips

```mermaid
flowchart TD
Start(["npm run test:all"]) --> Runner["scripts/run-all-tests.ts"]
Runner --> Exec["execSync(npm run verify:dialer|test:sms|test:ai-agent|test:post-onboarding)"]
Exec --> Parse["Parse stdout/stderr for config errors"]
Parse --> Status{"Config error?"}
Status --> |Yes| Skip["Mark as SKIPPED"]
Status --> |No| Fail["Mark as FAILED"]
Status --> |No| Pass["Mark as PASSED"]
Skip --> Report["Generate Markdown Report"]
Pass --> Report
Fail --> Report
Report --> Exit["Exit with code 0/1"]
```

**Diagram sources**
- [scripts/run-all-tests.ts](file://scripts/run-all-tests.ts#L49-L119)
- [scripts/run-all-tests.ts](file://scripts/run-all-tests.ts#L161-L179)

**Section sources**
- [scripts/run-all-tests.ts](file://scripts/run-all-tests.ts#L1-L230)
- [package.json](file://package.json#L15-L25)
- [docs/AUTOMATED_TESTING_COMPLETE.md](file://docs/AUTOMATED_TESTING_COMPLETE.md#L1-L163)

### Reporting System Integration Tests
- Creates a report template, generates a report, retrieves it, lists reports, and validates scheduled templates
- Cleans up test data afterward

```mermaid
sequenceDiagram
participant Test as "Test Script"
participant Supa as "Supabase Client"
participant Gen as "ReportGeneratorService"
participant Sch as "ScheduledReportsService"
Test->>Supa : insert template
Supa-->>Test : template_id
Test->>Gen : generateReport(template_id, tenant, start, end, user)
Gen-->>Test : report_id
Test->>Gen : getReport(report_id)
Gen-->>Test : report
Test->>Gen : getReports(tenant)
Gen-->>Test : reports[]
Test->>Sch : getScheduledTemplates(tenant)
Sch-->>Test : templates[]
Test->>Supa : cleanup (delete template + reports)
```

**Diagram sources**
- [scripts/test-reporting-system.ts](file://scripts/test-reporting-system.ts#L19-L61)
- [scripts/test-reporting-system.ts](file://scripts/test-reporting-system.ts#L63-L100)
- [scripts/test-reporting-system.ts](file://scripts/test-reporting-system.ts#L102-L124)
- [scripts/test-reporting-system.ts](file://scripts/test-reporting-system.ts#L126-L144)
- [scripts/test-reporting-system.ts](file://scripts/test-reporting-system.ts#L146-L163)

**Section sources**
- [scripts/test-reporting-system.ts](file://scripts/test-reporting-system.ts#L1-L264)

### JTBD Integration End-to-End Tests
- Validates onboarding start with template_key, progress retrieval with JTBD, time tracking enrichment, milestone completion, default sequence fallback, and template_key lookup
- Handles optional external service availability gracefully

```mermaid
sequenceDiagram
participant Test as "JTBD Test"
participant Seq as "OnboardingSequencesService"
participant Supa as "Supabase Client"
Test->>Seq : startOnboarding(tenant, email, undefined, 'law_firm_pre_onboarding')
Seq->>Supa : select sequence by template_key
Supa-->>Seq : sequence with JTBD
Seq-->>Test : progress_id, sequence_id
Test->>Supa : select progress with sequence join
Supa-->>Test : progress + JTBD
Test->>Test : time tracking API (optional)
Test->>Seq : completeMilestone(...)
Seq-->>Test : updated progress
Test->>Supa : cleanup progress records
```

**Diagram sources**
- [scripts/test-jtbd-integration.ts](file://scripts/test-jtbd-integration.ts#L34-L83)
- [scripts/test-jtbd-integration.ts](file://scripts/test-jtbd-integration.ts#L88-L135)
- [scripts/test-jtbd-integration.ts](file://scripts/test-jtbd-integration.ts#L140-L210)
- [scripts/test-jtbd-integration.ts](file://scripts/test-jtbd-integration.ts#L215-L266)
- [scripts/test-jtbd-integration.ts](file://scripts/test-jtbd-integration.ts#L271-L309)
- [scripts/test-jtbd-integration.ts](file://scripts/test-jtbd-integration.ts#L314-L343)

**Section sources**
- [scripts/test-jtbd-integration.ts](file://scripts/test-jtbd-integration.ts#L1-L501)

## Dependency Analysis
- Services depend on repositories and Supabase client abstractions
- Repositories encapsulate database queries and are central to integration tests
- Automated runners depend on package scripts and environment variables
- Documentation guides complement the codebase with practical examples

```mermaid
graph LR
HS["HealthScoringService"] --> TR["TicketRepository"]
HS --> SR["Supabase Client"]
TR --> SR
RepoTests["Repository Tests"] --> TR
ServiceTests["Service Tests"] --> HS
APIRouteTests["API Route Tests"] --> HS
APIRouteTests --> TR
AutoRunners["Automated Runners"] --> HS
AutoRunners --> TR
```

**Diagram sources**
- [lib/services/health-scoring.ts](file://lib/services/health-scoring.ts#L14-L17)
- [lib/repositories/tickets.ts](file://lib/repositories/tickets.ts#L1-L2)
- [lib/db/supabase.ts](file://lib/db/supabase.ts#L1-L29)
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts#L6-L12)

**Section sources**
- [lib/services/health-scoring.ts](file://lib/services/health-scoring.ts#L1-L669)
- [lib/repositories/tickets.ts](file://lib/repositories/tickets.ts#L1-L247)
- [lib/db/supabase.ts](file://lib/db/supabase.ts#L1-L29)
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts#L1-L80)

## Performance Considerations
- Keep unit tests fast by mocking external dependencies and avoiding real network calls
- Use minimal test data and deterministic fixtures
- Parallelize independent tests where possible
- Prefer lightweight assertions and avoid heavy computations in tests
- Use coverage thresholds to maintain quality without sacrificing speed

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing environment variables cause tests to skip rather than fail
- Database connectivity problems during integration tests
- Authentication failures due to missing tokens or invalid headers
- External service unavailability (e.g., Twilio, Internal Ops) leading to warnings

Guidelines:
- Review the automated test report for detailed summaries and error messages
- Ensure required environment variables are present before running tests
- Validate database migrations and seed data for integration tests
- Use manual testing scripts for quick smoke checks

**Section sources**
- [scripts/run-all-tests.ts](file://scripts/run-all-tests.ts#L78-L104)
- [docs/AUTOMATED_TESTING_COMPLETE.md](file://docs/AUTOMATED_TESTING_COMPLETE.md#L104-L118)
- [docs/TESTING_QUICK_START.md](file://docs/TESTING_QUICK_START.md#L166-L198)

## Conclusion
The CS Support Service employs a pragmatic testing strategy with strong unit and integration coverage, robust automated workflows, and comprehensive documentation. The Jest configuration, test helpers, and example patterns provide a solid foundation for maintaining quality as the system evolves. Automated runners and CI-friendly exit codes streamline integration into development pipelines, while detailed reporting ensures visibility into test outcomes.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Writing Effective Tests
- Use descriptive test names and focus on one behavior per test
- Mock external dependencies to isolate units under test
- Maintain test independence and clean up state after each test
- Prefer fixtures and factories for consistent data setup

**Section sources**
- [docs/TESTING_GUIDE.md](file://docs/TESTING_GUIDE.md#L547-L585)

### Mocking Strategies
- Mock Supabase client methods to simulate database responses
- Spy on service methods to verify interactions without executing logic
- Use environment variable mocks for router and public keys

**Section sources**
- [__tests__/utils/test-helpers.ts](file://__tests__/utils/test-helpers.ts#L67-L97)
- [__tests__/examples/service-example.test.ts](file://__tests__/examples/service-example.test.ts#L9-L36)
- [jest.setup.js](file://jest.setup.js#L9-L25)

### Test Data Management
- Use helpers to create and clean test data
- Employ unique identifiers and tenant scoping to prevent collisions
- Clean up test data after each run to keep environments pristine

**Section sources**
- [__tests__/utils/test-helpers.ts](file://__tests__/utils/test-helpers.ts#L11-L62)

### Continuous Integration Testing
- Use the master runner to aggregate results and produce reports
- Configure environment variables for integrations requiring secrets
- Treat configuration-missing skips as non-failures in CI

**Section sources**
- [scripts/run-all-tests.ts](file://scripts/run-all-tests.ts#L160-L179)
- [docs/AUTOMATED_TESTING_COMPLETE.md](file://docs/AUTOMATED_TESTING_COMPLETE.md#L48-L66)

### Test Coverage Requirements
- Maintain global thresholds and service/repository coverage goals
- Generate and review coverage reports regularly
- Focus on high-priority areas first (authentication, billing, analytics)

**Section sources**
- [jest.config.js](file://jest.config.js#L27-L34)
- [docs/TESTING_GUIDE.md](file://docs/TESTING_GUIDE.md#L525-L544)