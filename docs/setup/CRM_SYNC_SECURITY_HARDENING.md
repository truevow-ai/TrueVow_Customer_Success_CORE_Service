# CRM Sync Security Hardening

## Overview

This document details the comprehensive security measures implemented to prevent prompt injection attacks, SQL injection, data corruption, and unauthorized access through the CRM sync API.

## Threat Model

### Potential Attacks
1. **Prompt Injection**: Malicious prompts to AI agents causing unauthorized CRM operations
2. **SQL Injection**: Malicious SQL in ticket data corrupting database
3. **XSS Attacks**: Malicious scripts in ticket content
4. **Command Injection**: System command execution through API
5. **Data Corruption**: Malicious data seeding to corrupt database
6. **Unauthorized Access**: Cross-tenant access or privilege escalation
7. **Rate Limit Abuse**: DDoS or brute force attacks
8. **SSRF Attacks**: Server-side request forgery through CRM API URL

## Security Protections Implemented

### 1. Input Validation & Sanitization ✅

**File:** `lib/utils/input-sanitization.ts`

- **String Sanitization**
  - Removes null bytes
  - Removes control characters
  - Enforces max length limits
  - Trims whitespace

- **Type-Specific Validation**
  - UUID validation (strict format checking)
  - Email validation (regex + sanitization)
  - Phone number validation (digits only, length check)

- **Injection Detection**
  - SQL injection pattern detection
  - XSS pattern detection
  - Command injection pattern detection
  - Throws errors on detection (fails safe)

- **Object Sanitization**
  - Recursively sanitizes nested objects
  - Prevents recursion depth attacks
  - Sanitizes all string values

**Usage:**
```typescript
// All inputs validated before use
const ticketId = validateTicketId(input) // Throws if invalid
const email = validateInput(email, 'email') // Throws if invalid
const sanitized = sanitizeString(text, 1000) // Max length enforced
```

### 2. Rate Limiting ✅

**File:** `lib/middleware/rate-limit.ts`

- **Per-User Rate Limits**
  - 10 requests per minute for sync operations
  - 30 requests per minute for status checks (read-only)
  - Keyed by user ID (prevents bypass)

- **Response Headers**
  - `X-RateLimit-Limit`: Max requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp
  - `Retry-After`: Seconds until retry allowed

- **429 Status Code**
  - Returns 429 Too Many Requests when limit exceeded
  - Includes retry-after information

**Protection Against:**
- DDoS attacks
- Brute force attempts
- Prompt injection loops
- Automated abuse

### 3. Permission Checks ✅

**File:** `app/api/v1/crm/sync/route.ts`

- **Role-Based Access Control**
  - Only specific roles can sync: `support_agent`, `support_manager`, `csm`, `solutions_engineer`
  - Other roles (e.g., `viewer`) cannot sync
  - Prevents privilege escalation

- **Action Validation**
  - Only allows: `create`, `update`, `sync_all`
  - Rejects unknown actions
  - Strict Zod schema validation

**Protection Against:**
- Unauthorized operations
- Privilege escalation
- Malicious action injection

### 4. Tenant Isolation ✅

**File:** `app/api/v1/crm/sync/route.ts`

- **Ticket Ownership Verification**
  - Verifies ticket belongs to user's tenant
  - Prevents cross-tenant access
  - Logs unauthorized attempts

- **Tenant Validation**
  - Team member tenant must match ticket tenant
  - Enforced on every operation
  - Audit logged on mismatch

**Protection Against:**
- Cross-tenant data access
- Data leakage
- Unauthorized ticket access

### 5. Audit Logging ✅

**File:** `lib/middleware/audit-log.ts`

- **Comprehensive Logging**
  - All sync operations logged
  - Includes: user ID, IP address, user agent, request body
  - Tracks success and failures
  - Stores in `cs_audit_logs` table

- **Security Events Logged**
  - Validation failures
  - Permission denials
  - Tenant mismatches
  - Rate limit violations
  - Errors and exceptions

- **Audit Trail**
  - Can trace all operations back to user
  - Includes timestamps
  - Immutable logs (future: blockchain)

**Protection Against:**
- Unauthorized access (detectable)
- Data corruption (traceable)
- Attack attribution

### 6. Request Timeouts ✅

**File:** `lib/services/crm-sync.ts`

- **10-Second Timeout**
  - All CRM API calls have 10-second timeout
  - Prevents hanging requests
  - Aborts on timeout

- **AbortController**
  - Uses modern AbortController API
  - Clean cancellation
  - Prevents resource exhaustion

**Protection Against:**
- Resource exhaustion
- Slowloris attacks
- Hanging requests

### 7. SSRF Protection ✅

**File:** `lib/services/crm-sync.ts`

- **URL Validation**
  - Only allows HTTPS URLs
  - Validates CRM API URL format
  - Prevents internal network access

- **Fixed API URL**
  - CRM API URL from environment variable
  - Not user-controllable
  - Prevents URL manipulation

**Protection Against:**
- Server-side request forgery
- Internal network scanning
- Metadata service attacks

### 8. Response Sanitization ✅

**File:** `lib/services/crm-sync.ts`

- **Output Sanitization**
  - All response data sanitized
  - Removes control characters
  - Enforces length limits
  - Validates data types

- **Error Message Sanitization**
  - Generic error messages to clients
  - Detailed errors logged server-side only
  - Prevents information leakage

**Protection Against:**
- Information disclosure
- Error-based attacks
- Response manipulation

### 9. Database Transaction Safety ✅

**File:** `lib/services/crm-sync.ts`

- **Atomic Operations**
  - Sync status updates are atomic
  - Prevents partial state corruption
  - Uses Supabase transactions

- **Data Validation**
  - Validates data before database writes
  - Type checking
  - Constraint validation

**Protection Against:**
- Data corruption
- Partial updates
- Inconsistent state

### 10. Schema Validation ✅

**File:** `app/api/v1/crm/sync/route.ts`

- **Zod Schema**
  - Strict schema validation
  - Rejects unknown fields (`.strict()`)
  - Type checking
  - Format validation

- **Multiple Validation Layers**
  - Zod schema validation
  - Custom input sanitization
  - Type-specific validation
  - Business rule validation

**Protection Against:**
- Malformed requests
- Type confusion
- Schema pollution

## Security Flow

```
AI Agent Request
    ↓
1. Rate Limit Check (10/min)
    ↓
2. Authentication (withTeamMember)
    ↓
3. Input Sanitization (all fields)
    ↓
4. Schema Validation (Zod)
    ↓
5. Permission Check (role-based)
    ↓
6. Tenant Isolation (ticket ownership)
    ↓
7. Audit Logging (before operation)
    ↓
8. Server-Side CRM Call (with timeout)
    ↓
9. Response Sanitization
    ↓
10. Audit Logging (after operation)
    ↓
Response to AI Agent
```

## Attack Scenarios & Mitigations

### Scenario 1: Prompt Injection to Create Cases
**Attack:** Malicious prompt makes AI agent call sync API repeatedly

**Mitigation:**
- ✅ Rate limiting (10/min) prevents rapid requests
- ✅ Permission checks (only authorized roles)
- ✅ Audit logging (detects patterns)
- ✅ Input validation (rejects malicious data)

### Scenario 2: SQL Injection in Ticket Data
**Attack:** Malicious SQL in ticket subject/body

**Mitigation:**
- ✅ Input sanitization (removes SQL patterns)
- ✅ Parameterized queries (Supabase uses prepared statements)
- ✅ SQL injection detection (pattern matching)
- ✅ Database constraints (type safety)

### Scenario 3: Cross-Tenant Access
**Attack:** AI agent tries to sync another tenant's ticket

**Mitigation:**
- ✅ Tenant isolation (verifies ticket ownership)
- ✅ Team member validation (checks tenant match)
- ✅ Audit logging (logs unauthorized attempts)
- ✅ Error messages (don't reveal other tenants)

### Scenario 4: Data Corruption
**Attack:** Malicious data seeding to corrupt database

**Mitigation:**
- ✅ Input validation (rejects invalid data)
- ✅ Type checking (ensures correct types)
- ✅ Length limits (prevents oversized data)
- ✅ Transaction safety (atomic operations)
- ✅ Database constraints (enforced at DB level)

### Scenario 5: SSRF Attack
**Attack:** Manipulate CRM API URL to access internal services

**Mitigation:**
- ✅ Fixed API URL (from env, not user-controlled)
- ✅ HTTPS-only validation
- ✅ Request timeouts (prevent hanging)
- ✅ URL validation (format checking)

## Monitoring & Detection

### Audit Log Analysis
- Monitor for:
  - High rate of validation failures
  - Tenant mismatch attempts
  - Permission denials
  - Unusual patterns

### Rate Limit Monitoring
- Alert on:
  - Sustained rate limit violations
  - Multiple users hitting limits
  - Unusual request patterns

### Error Monitoring
- Track:
  - CRM API errors
  - Timeout errors
  - Validation failures
  - Database errors

## Best Practices

1. **Never Trust Input**
   - Always validate and sanitize
   - Use type checking
   - Enforce length limits

2. **Defense in Depth**
   - Multiple validation layers
   - Fail-safe defaults
   - Principle of least privilege

3. **Audit Everything**
   - Log all operations
   - Track security events
   - Monitor for anomalies

4. **Rate Limit Aggressively**
   - Low limits for write operations
   - Higher limits for reads
   - Per-user limits

5. **Sanitize Outputs**
   - Don't expose internal details
   - Generic error messages
   - Validate response data

## Testing Security

### Penetration Testing Checklist
- [ ] Test SQL injection in all input fields
- [ ] Test XSS in ticket content
- [ ] Test command injection
- [ ] Test rate limit bypass
- [ ] Test cross-tenant access
- [ ] Test privilege escalation
- [ ] Test SSRF attacks
- [ ] Test prompt injection
- [ ] Test data corruption attempts
- [ ] Test audit log integrity

## Future Enhancements

1. **Anomaly Detection**
   - ML-based detection of unusual patterns
   - Automatic blocking of suspicious requests
   - Real-time alerts

2. **Request Signing**
   - Cryptographic request signatures
   - Prevents request tampering
   - Nonce/timestamp validation

3. **IP Whitelisting**
   - Optional IP restrictions
   - Geo-blocking
   - VPN detection

4. **Circuit Breaker**
   - Automatic service degradation
   - Prevents cascade failures
   - Health check integration

5. **Enhanced Audit**
   - Blockchain-based audit logs
   - Immutable records
   - Compliance reporting

## Summary

The CRM sync API is now hardened against:
- ✅ Prompt injection attacks
- ✅ SQL injection
- ✅ XSS attacks
- ✅ Command injection
- ✅ Data corruption
- ✅ Unauthorized access
- ✅ Rate limit abuse
- ✅ SSRF attacks

All operations are:
- ✅ Validated and sanitized
- ✅ Rate limited
- ✅ Permission checked
- ✅ Tenant isolated
- ✅ Audit logged
- ✅ Timeout protected
- ✅ Response sanitized
