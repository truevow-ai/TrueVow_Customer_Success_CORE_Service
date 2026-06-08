# ADR: Scope-Aware Auth Architecture

**Date:** 2026-03-02
**Status:** Accepted
**Version:** 1.0.0

---

## Context

TrueVow operates multiple microservices serving different user populations:

1. **Internal users** - TrueVow employees (support agents, CSMs, managers, directors)
2. **Tenant users** - Law firm employees (admins, billing admins, members, viewers)

Previously, authentication used a single role claim model that couldn't distinguish between these populations, leading to:
- Confusion between `org_id` (Clerk organization) and `tenant_id` (data tenant)
- Mixed HR/tenant auth contexts
- No scope validation at the JWT level
- Difficulty implementing proper access control

---

## Decision

Implement a **scope-aware auth model** where:

1. Every JWT contains a `scope` claim: either `internal` or `tenant`
2. JWT claims are scope-specific:
   - Internal: `internal_role`, `internal_function`
   - Tenant: `tenant_id`, `tenant_role`
3. JWTs with mixed claims (both internal and tenant) are **rejected**
4. JWTs without scope are **rejected**
5. Permissions are fetched from the database (not stored in JWT)

### JWT Claim Schema

```json
{
  "scope": "internal" | "tenant",
  
  // IF scope = "internal":
  "internal_role": "director",
  "internal_function": "platform",
  
  // IF scope = "tenant":
  "tenant_id": "uuid",
  "tenant_role": "admin"
}
```

### Critical Rules

| Rule | Enforcement |
|------|-------------|
| Never mix scopes | JWT validation rejects mixed claims |
| Never accept missing scope | JWT validation requires scope claim |
| DB is source of truth | Permissions fetched from `tenant_role_permissions` or `hr_role_permissions` |
| Each service verifies locally | No auth gateway; each service validates JWT directly |

---

## Implementation

### New Files

| File | Purpose |
|------|---------|
| `lib/security/jwt-claims.ts` | JWT schema, validation functions |
| `lib/security/authorization.ts` | UserContext classes, permission checking |
| `lib/security/index.ts` | Module exports |
| `lib/security/examples.ts` | API route patterns |
| `database/migrations/038_tenant_rbac_schema.sql` | Tenant RBAC tables |

### Updated Files

| File | Changes |
|------|---------|
| `lib/middleware/auth.ts` | Added scope-aware exports, marked legacy functions deprecated |
| `lib/services/user-mapping.ts` | Added scope support, marked legacy functions deprecated |

### UserContext Classes

```typescript
// Internal user (TrueVow employee)
class InternalUserContext {
  userId: string
  email: string
  scope: 'internal'
  internalRole: InternalRole
  internalFunction: InternalFunction
  hasPermission(permission: Permission): Promise<boolean>
}

// Tenant user (Law firm user)
class TenantUserContext {
  userId: string
  email: string
  scope: 'tenant'
  tenantId: string
  tenantRole: TenantRole
  hasPermission(permission: TenantPermission): Promise<boolean>
}
```

### API Route Patterns

```typescript
// Dual-scope endpoint
export const GET = withAuth(async (req, context: UserContext) => {
  if (context.isInternal()) {
    // Internal logic
  } else {
    // Tenant logic (filter by context.tenantId)
  }
})

// Internal-only endpoint
export const GET = withInternalAuth(async (req, context: InternalUserContext) => {
  // Only TrueVow employees
})

// Tenant-only endpoint
export const GET = withTenantAuth(async (req, context: TenantUserContext) => {
  // Only tenant users
})

// With permission check
export const POST = withInternalPermission(
  [Permission.MANAGE_ESCALATIONS],
  async (req, context) => { /* ... */ }
)
```

---

## Database Schema

### New Tables

| Table | Purpose |
|-------|---------|
| `tenant_roles` | Role definitions for tenant users |
| `tenant_permissions` | Permission definitions |
| `tenant_role_permissions` | Role→permission mapping |
| `tenant_users` | User→tenant membership |
| `auth_audit_log` | Auth event logging |
| `hr_role_permissions` | Internal role→permission mapping |

### Key Constraints

- Tenant services MUST NOT query `hr_employees`, `hr_roles`, `hr_functions`
- Internal services MUST NOT query `tenant_users`, `tenant_roles`

---

## Migration Path

### For Existing Routes

1. **Identify endpoint type**: 
   - Internal-only? → Use `withInternalAuth`
   - Tenant-only? → Use `withTenantAuth`
   - Both? → Use `withAuth` with scope branching

2. **Update imports**:
   ```typescript
   // Old
   import { withTeamMember, AuthContext } from '@/lib/middleware/auth'
   
   // New
   import { withAuth, UserContext } from '@/lib/security'
   ```

3. **Update context usage**:
   - `context.teamMemberId` → `context.userId` or `context.tenantId`
   - `context.role` → `context.internalRole` or `context.tenantRole`

4. **Add permission checks**:
   ```typescript
   // Instead of checking role directly
   if (context.role === 'manager') { }
   
   // Check permission
   if (await context.hasPermission(Permission.MANAGE_USERS)) { }
   ```

---

## Clerk Configuration

### JWT Template

Create "truevow-v1" JWT template in Clerk Dashboard:

**For Internal Users:**
```json
{
  "scope": "internal",
  "internal_role": "user.public_metadata.role",
  "internal_function": "user.public_metadata.function"
}
```

**For Tenant Users:**
```json
{
  "scope": "tenant",
  "tenant_id": "organization.public_metadata.tenant_id",
  "tenant_role": "organization_membership.public_metadata.role"
}
```

---

## Testing

Run tests with:
```bash
npx jest __tests__/security/
```

Key test cases:
- ✅ Reject JWT without scope
- ✅ Reject JWT with mixed scopes
- ✅ Validate internal JWT claims
- ✅ Validate tenant JWT claims
- ✅ Permission checking for each role

---

## Consequences

### Positive
- Clear separation between internal and tenant auth
- Type-safe user contexts with TypeScript
- Permission-based access control
- Audit logging built-in
- Backward compatible (legacy functions still work)

### Negative
- Requires Clerk JWT template configuration
- Requires database migration
- Existing routes need migration

### Risks
- JWT template misconfiguration could lock out users
- Database migration must run before code deploy

---

## Sign-Off

- [x] Implemented authorization module
- [x] Created JWT claims validation
- [x] Updated auth middleware
- [x] Created database migration
- [x] Added unit tests
- [x] Created example patterns

**Next Steps:**
1. Configure Clerk JWT templates
2. Run database migration
3. Migrate existing API routes
4. Deploy to staging for testing
