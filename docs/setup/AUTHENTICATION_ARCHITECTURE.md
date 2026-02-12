# Authentication Architecture - Clerk-Based

**Date:** January 10, 2026  
**Status:** ✅ Implemented

## Overview

This service uses **Clerk** as the primary authentication framework. All authentication and authorization is handled in application code, not at the database level.

## Architecture Decision

**Why Clerk for Everything:**
- ✅ Single source of truth for authentication
- ✅ Consistent user experience across all services
- ✅ Better integration with Next.js
- ✅ Simpler to manage and maintain
- ✅ No need to sync user data between Clerk and Supabase Auth

## How It Works

### 1. Authentication Flow
```
User → Clerk Login → Clerk Session → Application Code → Database
```

1. User logs in via Clerk
2. Clerk validates credentials and creates session
3. Application code (middleware) checks Clerk session
4. Application code enforces authorization rules
5. Database operations use service role (bypasses RLS)

### 2. Authorization Flow
```
Request → Auth Middleware → Check Clerk Session → Check Role/Permissions → Allow/Deny
```

All authorization is handled in application code using:
- `lib/middleware/auth.ts` - Authentication middleware
- `lib/utils/roles.ts` - Role definitions and permissions
- `lib/services/user-mapping.ts` - Maps Clerk users to team members

### 3. Database Access

**Service Role for All Operations:**
- All repositories use `createServerSupabase()` which uses service role
- Service role bypasses RLS policies
- Access control enforced in application code before database queries

**Why This Approach:**
- ✅ Full control over access logic in application code
- ✅ Easier to debug and maintain
- ✅ Can implement complex business rules
- ✅ RLS policies remain as defense-in-depth safety net

## Security Layers

### Layer 1: Clerk Authentication
- User must be authenticated via Clerk
- Session validated on every request

### Layer 2: Application Authorization
- Middleware checks user role and permissions
- Business logic enforces access rules
- Repository methods respect authorization

### Layer 3: Database RLS (Defense-in-Depth)
- RLS policies exist but are bypassed by service role
- Provides safety net if service role is compromised
- Can be enabled for direct database access scenarios

## Code Examples

### API Route with Auth
```typescript
import { withTeamMember } from '@/lib/middleware/auth'
import { TicketRepository } from '@/lib/repositories/tickets'

export const GET = withTeamMember(async (req, context) => {
  // context.userId - Clerk user ID
  // context.role - User's role
  // context.teamMemberId - Team member ID
  
  // Repository automatically uses service role
  const tickets = await TicketRepository.findAll()
  return Response.json({ tickets })
})
```

### Repository Method
```typescript
// lib/repositories/tickets.ts
static async findAll() {
  // Uses service role - bypasses RLS
  // Access control already enforced by middleware
  const supabase = createServerSupabase()
  const { data } = await supabase.from('cs_tickets').select('*')
  return data
}
```

## Role-Based Access Control

### Roles Hierarchy
1. `support_agent` - Basic support operations
2. `solutions_engineer` - Technical support
3. `csm` - Customer success management
4. `support_manager` - Team management
5. `head_of_cs` - Full access

### Permission Checks
```typescript
// Check if user can perform action
if (!canPerformAction(userRole, 'view_analytics')) {
  throw new Error('Unauthorized')
}

// Require specific role
await requireRole('support_manager')

// Require permission
await requirePermission('manage_team')
```

## Environment Variables

Required environment variables:
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase (Service Role)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=  # Used for all server-side operations
```

## Benefits of This Approach

1. **Single Auth System**: Clerk handles everything
2. **Flexible Authorization**: Complex rules in application code
3. **Easy Debugging**: All logic in one place
4. **Better Performance**: No RLS overhead
5. **Consistent**: Same pattern across all services

## RLS Policies

RLS policies are still created and enabled, but:
- Not actively enforced (service role bypasses them)
- Serve as defense-in-depth safety net
- Can be enabled for direct database access
- Document intended access patterns

## Migration Path

If you ever need to enable RLS:
1. Switch repositories to use anon key
2. Set Clerk user ID in session before queries
3. RLS policies will automatically enforce access

---

**Status:** ✅ Implemented  
**Auth Framework:** Clerk  
**Database Access:** Service Role  
**Access Control:** Application Code
