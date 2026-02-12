# AI Agent Services API

<cite>
**Referenced Files in This Document**
- [route.ts](file://app/api/v1/ai/support/respond/route.ts)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts)
- [route.ts](file://app/api/v1/ai/triage/route.ts)
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts)
- [route.ts](file://app/api/v1/ai-agents/guardrails/route.ts)
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

## Introduction
This document provides comprehensive API documentation for AI-powered customer service automation, covering:
- Support response generation with natural language processing and intelligent routing
- Case analysis and triage for automated categorization and prioritization
- Hybrid support coordination combining rule-based FAQ with LLM enhancement
- Guardrail configurations and content moderation for safe AI interactions

The APIs described here enable intelligent customer support automation, integrating sentiment-aware responses, confidence scoring, escalation detection, and contextual KB article suggestions.

## Project Structure
The AI agent services are implemented as Next.js API routes under `/api/v1/ai`. Each endpoint encapsulates a specific AI capability with standardized request validation, rate limiting, and authentication middleware.

```mermaid
graph TB
subgraph "AI Support APIs"
RESP["POST /ai/support/respond<br/>Generate Response"]
ANALYZE["POST /ai/support/analyze<br/>Ticket Analysis"]
TRIAGE["POST /ai/triage<br/>Message Triage"]
HYBRID["POST /ai/hybrid-support<br/>Hybrid Support Agent"]
GUARDRAILS["GET/POST /ai-agents/guardrails<br/>Guardrails Management"]
end
RESP --> |"Uses"| SUPPORT_AGENT["SupportAgent"]
ANALYZE --> |"Uses"| SUPPORT_AGENT
TRIAGE --> |"Uses"| AI_TRIAGE["AITriageService"]
HYBRID --> |"Uses"| HYBRID_AGENT["HybridSupportAgent"]
GUARDRAILS --> |"Uses"| GUARDRAILS_SERVICE["AIAgentGuardrailsService"]
RESP --> |"Repository Access"| TICKETS["TicketRepository"]
RESP --> |"Repository Access"| MESSAGES["MessageRepository"]
ANALYZE --> |"Repository Access"| TICKETS
TRIAGE --> |"Repository Access"| MESSAGES
```

**Diagram sources**
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L11-L16)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L11-L16)
- [route.ts](file://app/api/v1/ai/triage/route.ts#L3-L5)
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L10-L11)
- [route.ts](file://app/api/v1/ai-agents/guardrails/route.ts#L9-L10)

**Section sources**
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L1-L109)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L1-L70)
- [route.ts](file://app/api/v1/ai/triage/route.ts#L1-L45)
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L1-L79)
- [route.ts](file://app/api/v1/ai-agents/guardrails/route.ts#L1-L43)

## Core Components
This section documents the primary AI agent APIs, their request/response schemas, and integration patterns.

### Support Response Generation API
Generates AI-powered responses to support tickets with optional automatic sending and escalation detection.

**Endpoint**: `POST /api/v1/ai/support/respond`

**Request Schema**:
- ticket_id: string (UUID) - Required
- issue_type: enum ["password_reset","service_status","feature_request","billing","general"] - Optional
- auto_send: boolean - Optional, default false

**Response Schema**:
- response: string - Generated response text
- confidence: number - Confidence score (0-1)
- should_escalate: boolean - Whether escalation is recommended
- escalation_reason: string - Reason for escalation (if applicable)
- suggested_actions: array[string] - Action items suggested by AI
- kb_articles: array[string] - Knowledge base article references
- auto_sent: boolean - Whether message was automatically sent

**Processing Logic**:
1. Validates request payload and authenticates team member
2. Retrieves ticket details via TicketRepository
3. Builds AgentContext from ticket metadata
4. Calls SupportAgent.generateIssueResponse() or generateFirstResponse()
5. Optionally creates message and updates ticket status if auto_send is enabled

**Section sources**
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L18-L22)
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L37-L38)
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L46-L55)
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L57-L65)
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L67-L89)
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L91-L99)

### Support Ticket Analysis API
Analyzes tickets to provide triage information, sentiment insights, and categorization.

**Endpoint**: `POST /api/v1/ai/support/analyze`

**Request Schema**:
- ticket_id: string (UUID) - Required

**Response Schema**:
- sentiment: string - Sentiment classification
- priority: string - Priority recommendation
- category: string - Issue category
- confidence: number - Analysis confidence score
- keywords: array[string] - Extracted keywords
- suggested_actions: array[string] - Recommended actions

**Processing Logic**:
1. Validates request and authenticates team member
2. Retrieves ticket via TicketRepository
3. Builds AgentContext with tenant information
4. Calls SupportAgent.analyzeTicket() for comprehensive analysis

**Section sources**
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L18-L20)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L35-L36)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L44-L54)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L57-L58)

### AI Message Triage API
Analyzes incoming messages to provide triage classification and action suggestions.

**Endpoint**: `POST /api/v1/ai/triage`

**Request Schema**:
- message_id: string (UUID) - Required

**Response Schema**:
- triage: object - Triage classification result
- suggestion: object - Action suggestion for handling

**Processing Logic**:
1. Validates request and authenticates team member
2. Retrieves message via MessageRepository
3. Calls AITriageService.analyzeMessage() for classification
4. Generates suggestion via AITriageService.generateSuggestion()

**Section sources**
- [route.ts](file://app/api/v1/ai/triage/route.ts#L8-L10)
- [route.ts](file://app/api/v1/ai/triage/route.ts#L23-L29)
- [route.ts](file://app/api/v1/ai/triage/route.ts#L31-L35)

### Hybrid Support Agent API
Processes customer queries through a two-tier architecture: rule-based FAQ + LLM enhancement.

**Endpoint**: `POST /api/v1/ai/hybrid-support`

**Request Schema**:
- query: string (1-1000 chars) - Required
- tenant_id: string (UUID) - Optional
- customer_context: object - Optional
  - customer_email: string (email) - Optional
  - customer_name: string - Optional
  - practice_area: string - Optional
  - health_score: number (0-100) - Optional
- conversation_history: array[{role: enum["user","assistant"], content: string}] - Optional
- enable_llm_enhancement: boolean - Optional, default true

**Response Schema**:
- success: boolean - Operation status
- data: object - Hybrid agent response
  - response: string - Generated response
  - confidence: number - Confidence score
  - kb_articles: array[string] - Knowledge base references
  - suggested_actions: array[string] - Actions suggested
  - tier_used: string - "rule_based" or "llm_enhanced"

**Processing Logic**:
1. Requires authentication (different from other endpoints)
2. Validates request schema with Zod
3. Maps snake_case API fields to camelCase agent interface
4. Calls HybridSupportAgent.processQuery() for processing

**Section sources**
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L14-L28)
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L40-L54)
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L56-L62)

### AI Agent Guardrails API
Manages guardrails and safety configurations for AI agents.

**Endpoints**:
- `GET /api/v1/ai-agents/guardrails` - Retrieve guardrails
- `POST /api/v1/ai-agents/guardrails` - Save guardrails configuration

**Request Schema** (POST):
- agent_id: string - Required
- agent_name: string - Required
- guardrails: object - Guardrails configuration

**Response Schema**:
- message: string - Operation result

**Processing Logic**:
1. Both endpoints require team member authentication
2. GET returns default guardrails for support_agent type
3. POST saves guardrails configuration with timestamps

**Section sources**
- [route.ts](file://app/api/v1/ai-agents/guardrails/route.ts#L13-L22)
- [route.ts](file://app/api/v1/ai-agents/guardrails/route.ts#L25-L42)

## Architecture Overview
The AI agent services follow a layered architecture with clear separation of concerns:

```mermaid
sequenceDiagram
participant Client as "Client Application"
participant API as "API Gateway"
participant Auth as "Authentication Middleware"
participant Validator as "Request Validator"
participant Service as "AI Service Layer"
participant Repo as "Data Repositories"
participant LLM as "Language Model Provider"
Client->>API : HTTP Request
API->>Auth : Verify Team Member
Auth-->>API : Authenticated Context
API->>Validator : Validate Request Schema
Validator-->>API : Validation Result
API->>Service : Invoke AI Service
Service->>Repo : Fetch Data (Tickets/Messages)
Repo-->>Service : Data Objects
Service->>LLM : Generate Response/Analysis
LLM-->>Service : AI Output
Service->>Repo : Persist Changes (Optional)
Repo-->>Service : Confirmation
Service-->>API : Response Data
API-->>Client : JSON Response
```

**Diagram sources**
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L24-L35)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L22-L33)
- [route.ts](file://app/api/v1/ai/triage/route.ts#L16-L21)
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L30-L38)

## Detailed Component Analysis

### Support Response Generation Flow
```mermaid
sequenceDiagram
participant Client as "Client"
participant Route as "Respond Route"
participant Agent as "SupportAgent"
participant Tickets as "TicketRepository"
participant Messages as "MessageRepository"
Client->>Route : POST /ai/support/respond
Route->>Route : Validate & Rate Limit
Route->>Tickets : findById(ticket_id)
Tickets-->>Route : Ticket Object
Route->>Agent : generateIssueResponse() or generateFirstResponse()
Agent->>Agent : Natural Language Processing
Agent-->>Route : Response Object
alt auto_send enabled
Route->>Messages : create(message)
Messages-->>Route : Message Created
Route->>Tickets : update(status : in_progress)
end
Route-->>Client : Response JSON
```

**Diagram sources**
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L24-L107)

### Ticket Analysis Flow
```mermaid
sequenceDiagram
participant Client as "Client"
participant Route as "Analyze Route"
participant Agent as "SupportAgent"
participant Tickets as "TicketRepository"
Client->>Route : POST /ai/support/analyze
Route->>Route : Validate Request
Route->>Tickets : findById(ticket_id)
Tickets-->>Route : Ticket Details
Route->>Agent : analyzeTicket(context)
Agent->>Agent : Sentiment & Category Analysis
Agent-->>Route : Analysis Result
Route-->>Client : Analysis JSON
```

**Diagram sources**
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L22-L68)

### Message Triage Flow
```mermaid
sequenceDiagram
participant Client as "Client"
participant Route as "Triage Route"
participant Triage as "AITriageService"
participant Messages as "MessageRepository"
Client->>Route : POST /ai/triage
Route->>Route : Validate Request
Route->>Messages : findById(message_id)
Messages-->>Route : Message Object
Route->>Triage : analyzeMessage(message)
Triage-->>Route : Triage Classification
Route->>Triage : generateSuggestion(message, triage)
Triage-->>Route : Action Suggestion
Route-->>Client : Combined Result
```

**Diagram sources**
- [route.ts](file://app/api/v1/ai/triage/route.ts#L16-L44)

### Hybrid Support Processing Flow
```mermaid
flowchart TD
Start([Request Received]) --> Validate["Validate Request Schema"]
Validate --> MapFields["Map Snake Case to Camel Case"]
MapFields --> CheckEnhancement{"Enable LLM Enhancement?"}
CheckEnhancement --> |Yes| RuleBased["Tier 1: Rule-Based FAQ"]
CheckEnhancement --> |No| DirectLLM["Direct LLM Processing"]
RuleBased --> LLMEnhance["Tier 2: LLM Enhancement"]
LLMEnhance --> Combine["Combine Results"]
DirectLLM --> Combine
Combine --> GenerateKB["Generate KB Article Suggestions"]
GenerateKB --> Return["Return Hybrid Response"]
Return --> End([Complete])
```

**Diagram sources**
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L30-L62)

## Dependency Analysis
The AI agent services demonstrate clean dependency inversion with clear interfaces:

```mermaid
graph TB
subgraph "API Layer"
RESP_ROUTE["Support Respond Route"]
ANALYZE_ROUTE["Support Analyze Route"]
TRIAGE_ROUTE["Message Triage Route"]
HYBRID_ROUTE["Hybrid Support Route"]
GUARDRAILS_ROUTE["Guardrails Route"]
end
subgraph "Service Layer"
SUPPORT_AGENT["SupportAgent"]
AI_TRIAGE["AITriageService"]
HYBRID_AGENT["HybridSupportAgent"]
GUARDRAILS_SERVICE["AIAgentGuardrailsService"]
end
subgraph "Repository Layer"
TICKETS["TicketRepository"]
MESSAGES["MessageRepository"]
end
RESP_ROUTE --> SUPPORT_AGENT
ANALYZE_ROUTE --> SUPPORT_AGENT
TRIAGE_ROUTE --> AI_TRIAGE
HYBRID_ROUTE --> HYBRID_AGENT
GUARDRAILS_ROUTE --> GUARDRAILS_SERVICE
RESP_ROUTE --> TICKETS
RESP_ROUTE --> MESSAGES
ANALYZE_ROUTE --> TICKETS
TRIAGE_ROUTE --> MESSAGES
```

**Diagram sources**
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L11-L16)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L11-L16)
- [route.ts](file://app/api/v1/ai/triage/route.ts#L3-L5)
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L10-L11)
- [route.ts](file://app/api/v1/ai-agents/guardrails/route.ts#L9-L10)

**Section sources**
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L11-L16)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L11-L16)
- [route.ts](file://app/api/v1/ai/triage/route.ts#L3-L5)
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L10-L11)
- [route.ts](file://app/api/v1/ai-agents/guardrails/route.ts#L9-L10)

## Performance Considerations
- Rate limiting is implemented at the route level to prevent abuse
- Request validation occurs before any business logic to minimize unnecessary processing
- Repository pattern ensures efficient data access and potential caching opportunities
- Hybrid agent supports disabling LLM enhancement for cost optimization
- Response objects include confidence scores to enable client-side optimization

## Troubleshooting Guide
Common error scenarios and resolution strategies:

**Authentication Failures**
- Symptom: 401 Unauthorized responses
- Cause: Missing or invalid authentication credentials
- Resolution: Ensure proper authentication middleware is configured

**Validation Errors**
- Symptom: 400 Bad Request with validation details
- Cause: Invalid request schema or missing required fields
- Resolution: Review request payload against documented schemas

**Resource Not Found**
- Symptom: 404 responses for tickets/messages
- Cause: Invalid UUID or deleted resources
- Resolution: Verify resource IDs exist in the system

**Service Errors**
- Symptom: 500 Internal Server Error
- Cause: LLM provider issues or repository failures
- Resolution: Check service logs and retry after cooldown period

**Section sources**
- [route.ts](file://app/api/v1/ai/support/respond/route.ts#L100-L105)
- [route.ts](file://app/api/v1/ai/support/analyze/route.ts#L61-L66)
- [route.ts](file://app/api/v1/ai/triage/route.ts#L41-L43)
- [route.ts](file://app/api/v1/ai/hybrid-support/route.ts#L63-L77)

## Conclusion
The AI agent services provide a robust foundation for customer service automation with clear separation of concerns, comprehensive request validation, and extensible architecture. The APIs support both individual capabilities (response generation, analysis, triage) and integrated solutions (hybrid support) while maintaining security through authentication and guardrails. The modular design enables easy extension for additional AI capabilities and integration with existing customer support workflows.