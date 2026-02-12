# Billing & Accounting Security Model

## Overview

**CRITICAL SECURITY REQUIREMENT**: Customer Success agents and AI agents **MUST NEVER** have direct access to billing, accounting, tenant app, intake, or draft services. All billing operations go through secure, validated CS Support API endpoints.

## Protected Systems

The following systems are **PROTECTED** and **NOT directly accessible** to AI agents or CS agents:

- ❌ **Platform Service** (billing/accounting) - NO direct access
- ❌ **Tenant App Service** - NO direct access
- ❌ **INTAKE Service** - NO direct access
- ❌ **DRAFT Service** - NO direct access
- ❌ **Any Accounting System** - NO direct access

## Security Architecture

### 1. Proxy Pattern

All billing operations use a **secure proxy pattern**:

```
AI Agent / CS Agent Request
    ↓
POST /api/v1/billing/operations (with team member auth)
    ↓
withTeamMember middleware validates authentication
    ↓
Permission check (CSM, Head of CS, Support Manager only)
    ↓
Tenant isolation check
    ↓
BillingProxyService.executeBillingOperation() (server-side)
    ↓
Uses PLATFORM_SERVICE_API_KEY (server-side only, never exposed)
    ↓
Makes HTTP call to Platform Service billing API
    ↓
Returns result to agent (no credentials exposed)
```

### 2. No Direct Access

**AI agents CANNOT:**
- ❌ Access Platform Service billing APIs directly
- ❌ See or use Platform Service API keys
- ❌ Make direct HTTP calls to billing systems
- ❌ Access tenant app, intake, or draft services
- ❌ Bypass authentication/authorization

**AI agents CAN:**
- ✅ Call CS Support API endpoints (`/api/v1/billing/operations`)
- ✅ Trigger billing operations through authenticated endpoints
- ✅ View billing information (read-only)
- ✅ Use their team member authentication context

### 3. Server-Side Execution

All actual billing API calls happen **server-side** in the CS Support service:

- Billing API key stored in `process.env.PLATFORM_SERVICE_API_KEY` (server-only)
- All operations in `BillingProxyService` (server-side)
- AI agents never see or access billing API keys
- All operations use service-level credentials

## Authorization Model

### Roles with Billing Access

**Can Modify Billing:**
- ✅ `csm` (Customer Success Manager)
- ✅ `head_of_cs` (Head of Customer Success)
- ✅ `support_manager` (Support Manager)

**Can View Billing (Read-Only):**
- ✅ All CS roles (for viewing only)

**Cannot Access Billing:**
- ❌ `support_agent` (cannot modify, can view)
- ❌ `solutions_engineer` (cannot modify, can view)
- ❌ Any other roles

### Permission Checks

```typescript
// Only specific roles can modify billing
const allowedRoles = ['csm', 'head_of_cs', 'support_manager']
if (!allowedRoles.includes(context.role)) {
  return errorResponse('Insufficient permissions', 403)
}
```

## Security Protections

### 1. Input Validation & Sanitization ✅

- **Amount Validation**
  - Must be between 0 and 1,000,000
  - Rounded to 2 decimal places
  - Prevents negative or excessive values

- **Discount Validation**
  - Must be between 0 and 100 percent
  - Prevents invalid discounts

- **String Sanitization**
  - All text fields sanitized
  - Max length limits enforced
  - Injection pattern detection

### 2. Rate Limiting ✅

- **Write Operations**: 5 requests per minute (strict)
- **Read Operations**: 30 requests per minute
- Per-user rate limiting
- Prevents abuse and prompt injection loops

### 3. Permission Checks ✅

- Role-based access control
- Only authorized roles can modify billing
- All roles can view (read-only)
- Prevents privilege escalation

### 4. Tenant Isolation ✅

- Verifies tenant matches user's tenant
- Prevents cross-tenant billing operations
- Logs unauthorized attempts
- Enforced on every operation

### 5. Audit Logging ✅

- All billing operations logged
- Includes: user ID, IP address, operation type, amounts
- Tracks success and failures
- Stores in `cs_audit_logs` table

### 6. Request Timeouts ✅

- 15-second timeout for billing operations
- Prevents resource exhaustion
- Uses AbortController

### 7. SSRF Protection ✅

- Validates Platform Service URL
- Only allows HTTPS (or localhost for dev)
- Fixed API URL from environment
- Prevents internal network access

### 8. Response Sanitization ✅

- All response data sanitized
- Payment method details masked
- Generic error messages
- No sensitive data exposure

## API Endpoints

### POST /api/v1/billing/operations
**Purpose:** Execute billing operations (discount, tier change, credit, refund)

**Security:**
- Rate limited: 5 requests/minute
- Requires: CSM, Head of CS, or Support Manager role
- Tenant isolation enforced
- Audit logged
- Input validated and sanitized

**Operations:**
- `add_discount` - Add percentage discount
- `remove_discount` - Remove discount
- `change_tier` - Change pricing tier
- `add_credit` - Add account credit
- `refund` - Process refund
- `update_payment_method` - Update payment method (future)

### GET /api/v1/billing/info
**Purpose:** Get billing information (read-only)

**Security:**
- Rate limited: 30 requests/minute
- Requires: Any authenticated team member
- Tenant isolation enforced
- Read-only access

## Billing Operations

### Add Discount
```typescript
POST /api/v1/billing/operations
{
  "operation": "add_discount",
  "tenantId": "uuid",
  "discountPercent": 10.5,
  "discountReason": "Customer retention discount",
  "ticketId": "uuid" // Optional: link to ticket
}
```

### Change Tier
```typescript
POST /api/v1/billing/operations
{
  "operation": "change_tier",
  "tenantId": "uuid",
  "newTier": "enterprise",
  "ticketId": "uuid" // Optional
}
```

### Add Credit
```typescript
POST /api/v1/billing/operations
{
  "operation": "add_credit",
  "tenantId": "uuid",
  "creditAmount": 100.00,
  "creditReason": "Service credit for downtime",
  "ticketId": "uuid" // Optional
}
```

### Process Refund
```typescript
POST /api/v1/billing/operations
{
  "operation": "refund",
  "tenantId": "uuid",
  "refundAmount": 50.00,
  "refundReason": "Refund for cancelled service",
  "ticketId": "uuid" // Optional
}
```

## Security Flow

```
AI Agent Request
    ↓
1. Rate Limit Check (5/min) ← Prevents abuse
    ↓
2. Authentication (withTeamMember) ← Validates user
    ↓
3. Input Sanitization ← Prevents injection
    ↓
4. Permission Check (CSM/Head/Manager only) ← Prevents escalation
    ↓
5. Tenant Isolation ← Prevents cross-tenant
    ↓
6. Amount Validation ← Prevents invalid amounts
    ↓
7. Audit Logging (before) ← Tracks actions
    ↓
8. Server-Side Billing Call ← Executes securely
    ↓
9. Response Sanitization ← Cleans output
    ↓
10. Audit Logging (after) ← Completes audit trail
    ↓
Response to AI Agent (sanitized, no credentials)
```

## Attack Mitigations

### Prompt Injection to Modify Billing
**Mitigation:**
- ✅ Rate limiting (5/min) prevents rapid requests
- ✅ Permission checks (only authorized roles)
- ✅ Amount validation (prevents excessive values)
- ✅ Audit logging (detects patterns)

### SQL Injection in Billing Data
**Mitigation:**
- ✅ Input sanitization (removes SQL patterns)
- ✅ Parameterized queries (Supabase)
- ✅ Type validation (amounts are numbers)

### Unauthorized Billing Modifications
**Mitigation:**
- ✅ Permission checks (role-based)
- ✅ Tenant isolation (can only modify own tenant)
- ✅ Audit logging (all operations tracked)

### Cross-Tenant Billing Access
**Mitigation:**
- ✅ Tenant verification (matches user tenant)
- ✅ Logs unauthorized attempts
- ✅ Returns 403 on mismatch

### Data Corruption
**Mitigation:**
- ✅ Amount validation (0-1,000,000 range)
- ✅ Discount validation (0-100 percent)
- ✅ Type checking (numbers are numbers)
- ✅ Transaction safety (atomic operations)

## Environment Variables

```env
# Server-side only - never exposed to clients or AI agents
PLATFORM_SERVICE_URL=https://api.truevow.com
PLATFORM_SERVICE_API_KEY=your_platform_service_api_key
```

## UI Component

**File:** `components/billing/BillingOperations.tsx`

- Integrated into CustomerProfile component
- Shows current billing info
- Provides forms for billing operations
- Only shows for authorized roles
- Mobile-responsive

## Best Practices

1. **Never Expose Billing API Keys**
   - Keep in environment variables only
   - Never in code, logs, or API responses
   - Server-side only

2. **Always Use Authorization Middleware**
   - All billing endpoints use `withTeamMember`
   - Permission checks for write operations
   - Tenant isolation enforced

3. **Server-Side Execution Only**
   - Billing operations in service layer
   - Never in client-side code
   - Never in AI agent code directly

4. **Strict Rate Limiting**
   - 5 requests/minute for write operations
   - Prevents abuse and prompt injection loops

5. **Comprehensive Audit Logging**
   - Log all billing operations
   - Track amounts, reasons, users
   - Detect anomalies

6. **Amount Validation**
   - Enforce reasonable limits
   - Round to 2 decimals
   - Validate ranges

## Testing Security

To verify AI agents cannot access billing directly:

1. ✅ Check that `PLATFORM_SERVICE_API_KEY` is never in client-side code
2. ✅ Verify all billing endpoints require `withTeamMember` auth
3. ✅ Confirm billing API key is only used in server-side code
4. ✅ Test that API responses never include billing credentials
5. ✅ Verify permission checks block unauthorized roles
6. ✅ Test tenant isolation (cannot modify other tenants)
7. ✅ Test rate limiting (5 requests/minute enforced)
8. ✅ Test amount validation (rejects invalid amounts)

## Summary

**Question:** How do CS agents modify billing if they can't access billing systems directly?

**Answer:**
- CS agents call CS Support API endpoints (`/api/v1/billing/operations`)
- CS Support service (server-side) makes the actual billing API calls
- Billing API key is stored server-side and never exposed
- CS agents get results but never see credentials or make direct billing calls
- Only authorized roles (CSM, Head of CS, Support Manager) can modify billing
- All operations are validated, authorized, rate-limited, and audit-logged

This is a **secure proxy pattern** - CS agents and AI agents go through the CS Support service, which acts as a secure gateway to billing/accounting systems.

## Protected Systems Summary

| System | Direct Access | Proxy Access | Notes |
|--------|--------------|--------------|-------|
| Platform Service (Billing) | ❌ NO | ✅ Yes (via CS Support API) | Server-side only |
| Tenant App Service | ❌ NO | ✅ Yes (via CS Support API) | Server-side only |
| INTAKE Service | ❌ NO | ✅ Yes (via CS Support API) | Server-side only |
| DRAFT Service | ❌ NO | ✅ Yes (via CS Support API) | Server-side only |
| Intakely CRM | ❌ NO | ✅ Yes (via CS Support API) | Server-side only |

**All external systems are accessed through CS Support service proxy with proper security controls.**
