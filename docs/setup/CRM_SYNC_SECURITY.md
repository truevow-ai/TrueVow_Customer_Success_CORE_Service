# CRM Sync Security Model

## Overview

The CRM Sync feature is designed with a strict security model that **prevents AI agents and LLMs from having direct access to Intakely CRM**. All CRM operations go through authenticated CS Support API endpoints.

## Security Architecture

### 1. No Direct CRM Access for AI Agents

**AI agents CANNOT:**
- ❌ Access Intakely CRM API directly
- ❌ See or use Intakely CRM API keys
- ❌ Make direct HTTP calls to Intakely CRM
- ❌ Bypass authentication/authorization

**AI agents CAN:**
- ✅ Call CS Support API endpoints (`/api/v1/crm/sync`)
- ✅ Trigger sync operations through authenticated endpoints
- ✅ Receive sync status and results
- ✅ Use their team member authentication context

### 2. Server-Side CRM Operations

All actual CRM API calls happen **server-side** in the CS Support service:

```
AI Agent Request
    ↓
POST /api/v1/crm/sync (with team member auth)
    ↓
withTeamMember middleware validates authentication
    ↓
CRMSyncService.createCaseInCRM() (server-side)
    ↓
Uses INTAKELY_CRM_API_KEY (server-side only, never exposed)
    ↓
Makes HTTP call to Intakely CRM API
    ↓
Returns result to AI agent (no credentials exposed)
```

### 3. Authentication Flow

1. **AI Agent Authentication**
   - AI agents authenticate as team members via Clerk
   - They get a team member context with `userId` and `teamMemberId`
   - This is the same authentication used by human agents

2. **API Endpoint Protection**
   - All CRM sync endpoints use `withTeamMember` middleware
   - Requires valid Clerk authentication
   - Validates team member exists and has access

3. **Server-Side Execution**
   - Once authenticated, the request is processed server-side
   - CRM API key is stored in environment variables (never sent to client)
   - All CRM operations use service-level credentials

### 4. Credential Storage

**Intakely CRM API Key:**
- Stored in: `process.env.INTAKELY_CRM_API_KEY`
- Never exposed to:
  - Client-side code
  - AI agents
  - API responses
  - Error messages
- Only accessible to:
  - Server-side code in `CRMSyncService`
  - Environment variables (server-only)

## Implementation Details

### API Endpoints

#### POST /api/v1/crm/sync
```typescript
// Requires: withTeamMember authentication
// AI agents call this with their authenticated context
// Server-side: CRMSyncService uses INTAKELY_CRM_API_KEY
POST /api/v1/crm/sync
Headers: {
  Authorization: "Bearer <clerk_token>", // AI agent's auth token
  // NO Intakely CRM API key here!
}
Body: {
  ticket_id: "uuid",
  action: "create" | "update" | "sync_all"
}
```

#### GET /api/v1/crm/sync/status
```typescript
// Requires: withTeamMember authentication
// Returns sync status (no credentials)
GET /api/v1/crm/sync/status?ticket_id=uuid
Headers: {
  Authorization: "Bearer <clerk_token>", // AI agent's auth token
}
```

### Service Layer

```typescript
// lib/services/crm-sync.ts
export class CRMSyncService {
  // Server-side only - AI agents never see this
  private static crmApiKey = process.env.INTAKELY_CRM_API_KEY
  
  static async createCaseInCRM(ticketId: string) {
    // This runs server-side only
    // Uses INTAKELY_CRM_API_KEY from environment
    // AI agents cannot call this directly
    const response = await fetch(`${crmApiUrl}/v1/cases`, {
      headers: {
        'Authorization': `Bearer ${this.crmApiKey}`, // Server-side only
      },
    })
  }
}
```

## How It Works

### Scenario 1: AI Agent Wants to Create Case

1. **AI Agent** (with team member auth) calls:
   ```typescript
   POST /api/v1/crm/sync
   {
     ticket_id: "abc123",
     action: "create"
   }
   ```

2. **CS Support API** validates authentication via `withTeamMember`

3. **CS Support Service** (server-side) calls:
   ```typescript
   CRMSyncService.createCaseInCRM("abc123")
   // Uses INTAKELY_CRM_API_KEY from env (AI agent never sees this)
   ```

4. **Intakely CRM** receives request with service-level API key

5. **AI Agent** receives result (case ID, status) - no credentials

### Scenario 2: AI Agent Wants to Update Case

Same flow - AI agent calls CS Support API, server-side makes CRM call.

## Security Guarantees

✅ **AI agents cannot access Intakely CRM directly**
- No CRM API keys in AI agent code
- No direct HTTP calls to Intakely CRM
- All operations go through CS Support API

✅ **Server-side credential management**
- CRM API key stored in environment variables
- Never exposed in API responses
- Never logged or sent to client

✅ **Authentication required**
- All endpoints require team member authentication
- AI agents use same auth as human agents
- Tenant isolation enforced

✅ **Audit trail**
- All sync operations logged
- Can track which agent (AI or human) triggered sync
- Sync status stored in ticket metadata

## Environment Variables

```env
# Server-side only - never exposed to clients or AI agents
INTAKELY_CRM_API_KEY=your_crm_api_key_here
INTAKELY_CRM_API_URL=https://api.intakely.com
NEXT_PUBLIC_INTAKELY_CRM_URL=https://crm.intakely.com  # Public URL for links only
```

## Best Practices

1. **Never expose CRM API key**
   - Keep in environment variables only
   - Never in code, logs, or API responses
   - Use `NEXT_PUBLIC_` prefix only for public URLs (not API keys)

2. **Always use authentication middleware**
   - All CRM endpoints use `withTeamMember`
   - Validates team member exists
   - Enforces tenant isolation

3. **Server-side execution only**
   - CRM operations in service layer
   - Never in client-side code
   - Never in AI agent code directly

4. **Error handling**
   - Don't expose CRM API errors to clients
   - Log errors server-side
   - Return generic error messages

## Testing Security

To verify AI agents cannot access CRM directly:

1. ✅ Check that `INTAKELY_CRM_API_KEY` is never in client-side code
2. ✅ Verify all CRM endpoints require `withTeamMember` auth
3. ✅ Confirm CRM API key is only used in server-side code
4. ✅ Test that API responses never include CRM credentials
5. ✅ Verify AI agents can only call CS Support API endpoints

## Summary

**Question:** How do we create/update cases if AI agents can't access CRM?

**Answer:** 
- AI agents call CS Support API endpoints (`/api/v1/crm/sync`)
- CS Support service (server-side) makes the actual CRM API calls
- CRM API key is stored server-side and never exposed
- AI agents get results but never see credentials or make direct CRM calls

This is a **proxy pattern** - AI agents go through the CS Support service, which acts as a secure proxy to Intakely CRM.
