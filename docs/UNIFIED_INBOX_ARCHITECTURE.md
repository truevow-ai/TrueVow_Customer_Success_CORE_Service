# Unified Shared Inbox Architecture

**Date:** January 15, 2026  
**Status:** 🚧 In Progress - Architecture Design  
**Purpose:** Multi-team, multi-context unified inbox for Sales CRM, CS-Support, Internal Ops, and TrueVow Management

---

## Executive Summary

Designing a **unified shared inbox architecture** that serves multiple teams and contexts:
- **Sales CRM Team** - Lead communications, sales conversations
- **CS-Support Team** - Customer support tickets, help requests
- **Internal Ops Team** - Internal operations, HR, IT
- **TrueVow Management** - Cross-functional oversight, analytics
- **AI Agents** - Automated responses, triage, routing

**Key Integration:**
- Unified Voice (calling)
- Unified WebChat (live chat)
- Unified Dialer (outbound calling)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│              UNIFIED SHARED INBOX ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INBOX CONTEXTS                                │
├─────────────────────────────────────────────────────────────────┤
│  • Sales Context    - Lead conversations, sales pipeline        │
│  • CS Context       - Support tickets, customer issues          │
│  • Ops Context      - Internal operations, HR, IT               │
│  • Management       - Cross-functional oversight               │
│  • AI Agent Context - Automated triage, responses               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              UNIFIED INBOX CORE SERVICE                         │
│  (lib/services/unified-inbox-service.ts)                        │
├─────────────────────────────────────────────────────────────────┤
│  • Multi-context conversation management                        │
│  • Cross-team collaboration                                     │
│  • Context-aware routing                                        │
│  • Unified channel handling (email, SMS, chat, voice)          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              UNIFIED COMMUNICATION SERVICES                     │
├─────────────────────────────────────────────────────────────────┤
│  • Unified Voice Service    - Inbound/outbound calls           │
│  • Unified WebChat Service  - Live chat widget                 │
│  • Unified Dialer Service   - Outbound dialing                 │
│  • Unified Messaging Service - SMS, WhatsApp, Email            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              COLLABORATION & AI SERVICES                         │
├─────────────────────────────────────────────────────────────────┤
│  • Collision Detection      - Real-time collaboration          │
│  • Workflow Engine          - Automation builder               │
│  • AI Agent Framework       - Hybrid AI support                 │
│  • Beacon API               - Docs + Live Chat                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. **Inbox Contexts**

Each conversation belongs to a **context** that determines:
- Who can see it (permissions)
- How it's routed (routing rules)
- What actions are available (workflows)
- What metrics apply (analytics)

**Context Types:**
```typescript
type InboxContext = 
  | 'sales'      // Sales CRM conversations
  | 'cs'         // Customer support
  | 'ops'        // Internal operations
  | 'management' // Cross-functional
  | 'ai'         // AI agent conversations
```

### 2. **Unified Conversation Model**

All conversations, regardless of context, share:
- **Conversation ID** - Unique identifier
- **Context** - Which inbox context it belongs to
- **Channel** - email, sms, chat, voice, etc.
- **Participants** - Customer, team members, AI agents
- **Messages** - All messages in thread
- **Metadata** - Tags, notes, assignments, etc.

### 3. **Multi-Team Access**

**Team Roles:**
- **Sales Team** - Can access `sales` context + view `cs` context (read-only)
- **CS Team** - Can access `cs` context + view `sales` context (read-only)
- **Ops Team** - Can access `ops` context
- **Management** - Can access all contexts (read-only or full)
- **AI Agents** - Can access assigned contexts based on permissions

---

## Database Schema

### New Tables

#### 1. `unified_inbox_contexts`
```sql
CREATE TABLE unified_inbox_contexts (
    context_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('sales', 'cs', 'ops', 'management', 'ai')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID, -- NULL for system-wide contexts
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 2. `unified_conversation_contexts`
```sql
CREATE TABLE unified_conversation_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES cs_conversations(conversation_id),
    context_id UUID NOT NULL REFERENCES unified_inbox_contexts(context_id),
    context_type VARCHAR(50) NOT NULL,
    assigned_team VARCHAR(50), -- 'sales', 'cs', 'ops', etc.
    priority INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, context_id)
);
```

#### 3. `collision_detection`
```sql
CREATE TABLE collision_detection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES cs_conversations(conversation_id),
    user_id UUID NOT NULL, -- Clerk user ID
    team_member_id UUID REFERENCES cs_team_members(member_id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('viewing', 'typing', 'editing')),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);
```

#### 4. `workflow_definitions`
```sql
CREATE TABLE workflow_definitions (
    workflow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    context_type VARCHAR(50) NOT NULL, -- Which context this applies to
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('automatic', 'manual')),
    conditions JSONB NOT NULL, -- Array of condition objects
    actions JSONB NOT NULL, -- Array of action objects
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL,
    tenant_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 5. `workflow_executions`
```sql
CREATE TABLE workflow_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(workflow_id),
    conversation_id UUID NOT NULL REFERENCES cs_conversations(conversation_id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    triggered_by UUID, -- User ID or 'system'
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    execution_log JSONB DEFAULT '[]'::jsonb
);
```

---

## Service Architecture

### 1. Unified Inbox Service

**File:** `lib/services/unified-inbox-service.ts`

**Responsibilities:**
- Multi-context conversation management
- Context-aware filtering
- Cross-team collaboration
- Unified channel handling

**Key Methods:**
```typescript
class UnifiedInboxService {
  // Get conversations for a context
  static async getConversationsForContext(
    contextType: InboxContext,
    filters: ConversationFilters
  ): Promise<Conversation[]>
  
  // Assign conversation to context
  static async assignToContext(
    conversationId: string,
    contextId: string
  ): Promise<void>
  
  // Get available contexts for user
  static async getAvailableContexts(
    userId: string
  ): Promise<InboxContext[]>
  
  // Check if user can access conversation
  static async canAccessConversation(
    userId: string,
    conversationId: string
  ): Promise<boolean>
}
```

### 2. Collision Detection Service

**File:** `lib/services/collision-detection-service.ts`

**Responsibilities:**
- Track active viewers per conversation
- Track typing status
- Real-time updates via WebSocket/SSE
- Visual indicators

**Key Methods:**
```typescript
class CollisionDetectionService {
  // Mark user as viewing conversation
  static async markViewing(
    conversationId: string,
    userId: string
  ): Promise<void>
  
  // Mark user as typing
  static async markTyping(
    conversationId: string,
    userId: string
  ): Promise<void>
  
  // Get active users for conversation
  static async getActiveUsers(
    conversationId: string
  ): Promise<ActiveUser[]>
  
  // Cleanup stale activities
  static async cleanupStaleActivities(): Promise<void>
}
```

### 3. Beacon API Service

**File:** `lib/services/beacon-api-service.ts`

**Responsibilities:**
- KB article search
- Context-aware suggestions
- Article display (inline, sidebar, modal)
- Customer portal integration

**Key Methods:**
```typescript
class BeaconAPIService {
  // Search KB articles
  static async search(
    query: string,
    context?: PageContext
  ): Promise<KBArticle[]>
  
  // Get contextual suggestions
  static async suggest(
    context: PageContext
  ): Promise<KBArticle[]>
  
  // Display article
  static async getArticle(
    articleId: string,
    format: 'inline' | 'sidebar' | 'modal'
  ): Promise<KBArticle>
}
```

### 4. Workflow Engine

**File:** `lib/services/workflow-engine.ts`

**Responsibilities:**
- Execute workflows (automatic/manual)
- Condition evaluation
- Action execution
- Workflow logging

**Key Methods:**
```typescript
class WorkflowEngine {
  // Execute automatic workflow
  static async executeAutomatic(
    conversationId: string,
    trigger: WorkflowTrigger
  ): Promise<WorkflowExecution>
  
  // Execute manual workflow
  static async executeManual(
    workflowId: string,
    conversationId: string,
    userId: string
  ): Promise<WorkflowExecution>
  
  // Evaluate conditions
  static async evaluateConditions(
    conditions: Condition[],
    conversation: Conversation
  ): Promise<boolean>
  
  // Execute actions
  static async executeActions(
    actions: Action[],
    conversation: Conversation
  ): Promise<void>
}
```

---

## Integration Points

### 1. Unified Voice Integration

**Current:** `lib/services/unified-dialer-service.ts` exists

**Enhancement:**
- Add voice conversations to unified inbox
- Track call status in collision detection
- Integrate call recordings into conversation thread

### 2. Unified WebChat Integration

**New:** `lib/services/unified-webchat-service.ts`

**Features:**
- Live chat widget for customer portal
- Real-time chat in unified inbox
- Chat history in conversation thread
- Integration with Beacon API

### 3. Unified Dialer Integration

**Current:** `lib/services/unified-dialer-service.ts` exists

**Enhancement:**
- Show dialer in unified inbox UI
- Track dialer activity in collision detection
- Link dialer calls to conversations

---

## UI Components

### 1. Unified Inbox List

**File:** `components/unified-inbox/InboxList.tsx`

**Features:**
- Context switcher (Sales, CS, Ops, Management)
- Multi-context view (all contexts)
- Collision detection indicators
- Context-aware filtering

### 2. Conversation Detail (Enhanced)

**File:** `components/unified-inbox/ConversationDetail.tsx`

**Enhancements:**
- Collision detection UI (active users, typing indicators)
- Context badge
- Workflow execution indicators
- Unified voice/webchat/dialer integration

### 3. Beacon Widget

**File:** `components/customer-portal/Beacon.tsx`

**Features:**
- Floating chat widget
- KB search
- Context-aware suggestions
- Article display

### 4. Workflow Builder

**File:** `components/workflows/WorkflowBuilder.tsx`

**Features:**
- Visual "If... Then..." builder
- Condition builder
- Action builder
- Workflow testing

---

## API Endpoints

### Unified Inbox
- `GET /api/v1/unified-inbox` - Get conversations (with context filter)
- `GET /api/v1/unified-inbox/contexts` - Get available contexts
- `POST /api/v1/unified-inbox/[id]/assign-context` - Assign to context

### Collision Detection
- `POST /api/v1/collision/[id]/viewing` - Mark as viewing
- `POST /api/v1/collision/[id]/typing` - Mark as typing
- `GET /api/v1/collision/[id]/active` - Get active users
- `WS /api/v1/collision/ws` - WebSocket for real-time updates

### Beacon API
- `POST /api/v1/beacon/search` - Search KB articles
- `POST /api/v1/beacon/suggest` - Get contextual suggestions
- `GET /api/v1/beacon/article/[id]` - Get article

### Workflows
- `GET /api/v1/workflows` - List workflows
- `POST /api/v1/workflows` - Create workflow
- `POST /api/v1/workflows/[id]/execute` - Execute workflow
- `GET /api/v1/workflows/[id]/executions` - Get execution history

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. ✅ Database schema (contexts, collision detection, workflows)
2. ✅ Unified Inbox Service (core service)
3. ✅ Context management
4. ✅ Basic multi-context UI

### Phase 2: Collaboration (Week 2-3)
1. ✅ Collision Detection Service
2. ✅ Real-time updates (WebSocket/SSE)
3. ✅ UI indicators
4. ✅ Integration with existing features

### Phase 3: Automation (Week 3-4)
1. ✅ Workflow Engine
2. ✅ Visual Workflow Builder
3. ✅ Workflow execution
4. ✅ Workflow testing

### Phase 4: Customer Experience (Week 4-5)
1. ✅ Beacon API Service
2. ✅ Beacon Widget
3. ✅ KB integration
4. ✅ Context-aware suggestions

### Phase 5: Integration (Week 5-6)
1. ✅ Unified Voice integration
2. ✅ Unified WebChat integration
3. ✅ Unified Dialer integration
4. ✅ End-to-end testing

---

## Security & Permissions

### Context-Based Access Control

**RLS Policies:**
- Users can only see conversations in contexts they have access to
- Management can see all contexts (read-only or full based on role)
- AI agents can access based on assigned permissions

**Permission Model:**
```typescript
interface ContextPermission {
  contextType: InboxContext
  access: 'read' | 'write' | 'admin'
  teams: string[] // Which teams can access
}
```

---

## Next Steps

1. **Create database migrations** for new tables
2. **Implement Unified Inbox Service** (core service)
3. **Implement Collision Detection Service** (real-time collaboration)
4. **Create UI components** for multi-context inbox
5. **Integrate existing services** (voice, dialer, messaging)

---

**Status:** Architecture Design Complete - Ready for Implementation  
**Last Updated:** January 15, 2026
