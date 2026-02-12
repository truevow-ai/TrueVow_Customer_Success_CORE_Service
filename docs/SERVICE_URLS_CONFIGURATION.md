# Service URLs Configuration

**Date:** January 15, 2026  
**Purpose:** Document service URL environment variables and their mappings

---

## Environment Variables in .env.local

Based on `.env.local` configuration:

```bash
# CS-Support Service (This Service)
CS_SUPPORT_SERVICE_URL=http://localhost:3007
CS_SUPPORT_SERVICE_PORT=3007
CS_SUPPORT_SERVICE_API_KEY=

# Platform Service
PLATFORM_SERVICE_URL=http://localhost:3000
PLATFORM_SERVICE_API_KEY=

# Sales CRM Service
SALES_CRM_SERVICE_URL=http://localhost:3006
SALES_CRM_SERVICE_API_KEY=

# Internal Ops Service
INTERNAL_OPS_SERVICE_URL=http://localhost:3005
INTERNAL_OPS_SERVICE_API_KEY=
# Alternative: SAAS_ADMIN_SERVICE_URL=http://localhost:3001
# Alternative: SAAS_ADMIN_SERVICE_API_KEY=...

# Tenant Service (Customer Portal / FastAPI Backend)
TENANT_APP_URL=http://localhost:8000
TENANT_APP_API_KEY=
# Alternative: FASTAPI_BACKEND_SERVICE_URL=http://localhost:8000
# Alternative: FASTAPI_BACKEND_SERVICE_API_KEY=
```

---

## Integration Client Mappings

### 1. Internal Ops Service Client

**File:** `lib/integrations/internal-ops-client.ts`

**Environment Variables (in priority order):**
1. `INTERNAL_OPS_SERVICE_URL` (primary)
2. `SAAS_ADMIN_SERVICE_URL` (fallback)
3. Default: `http://localhost:3001`

**API Key:**
1. `INTERNAL_OPS_SERVICE_API_KEY` (primary)
2. `SAAS_ADMIN_SERVICE_API_KEY` (fallback)
3. Default: empty string

---

### 2. Platform Service Client

**File:** `lib/integrations/platform-client.ts`

**Environment Variables:**
1. `PLATFORM_SERVICE_URL` (primary)
2. Default: `http://localhost:3000`

**API Key:**
1. `PLATFORM_SERVICE_API_KEY` (primary)
2. `SAAS_ADMIN_SERVICE_API_KEY` (fallback)
3. Default: empty string

---

### 3. Sales CRM Service Client

**File:** `lib/integrations/sales-client.ts`

**Environment Variables (in priority order):**
1. `SALES_CRM_SERVICE_URL` (primary - matches .env.local)
2. `SALES_SERVICE_URL` (fallback - legacy)
3. Default: `http://localhost:3002`

**API Key:**
1. `SALES_CRM_SERVICE_API_KEY` (primary - matches .env.local)
2. `SALES_SERVICE_API_KEY` (fallback - legacy)
3. Default: empty string

---

### 4. Tenant Service Client

**File:** `lib/integrations/tenant-client.ts`

**Environment Variables (in priority order):**
1. `TENANT_APP_URL` (primary - matches .env.local)
2. `FASTAPI_BACKEND_SERVICE_URL` (fallback - matches .env.local)
3. `TENANT_SERVICE_URL` (fallback - legacy)
4. Default: `http://localhost:8000`

**API Key:**
1. `TENANT_APP_API_KEY` (primary - matches .env.local)
2. `FASTAPI_BACKEND_SERVICE_API_KEY` (fallback - matches .env.local)
3. `TENANT_SERVICE_API_KEY` (fallback - legacy)
4. Default: empty string

---

## Service Ports (TrueVow Architecture)

According to TrueVow 5-Service Architecture:

- **Platform Service:** Port 3000
- **Sales CRM Service:** Port 3002 (but .env.local shows 3006 - may be different in dev)
- **CS-Support Service:** Port 3003 (but .env.local shows 3007 - may be different in dev)
- **Internal Ops Service:** Port 3001 or 3004 (but .env.local shows 3005 - may be different in dev)
- **Tenant Service:** Port 8000

**Note:** Development ports may differ from production ports. Always use environment variables.

---

## Recommended .env.local Configuration

```bash
# ============================================================================
# CS-SUPPORT SERVICE CONFIGURATION
# ============================================================================
CS_SUPPORT_SERVICE_NAME=truevow-cs-support-service
CS_SUPPORT_SERVICE_PORT=3007
CS_SUPPORT_ENVIRONMENT=development
CS_SUPPORT_SERVICE_URL=http://localhost:3007
CS_SUPPORT_SERVICE_API_KEY=your-api-key-here

# ============================================================================
# SERVICE-TO-SERVICE INTEGRATION URLs
# ============================================================================

# Platform Service (SaaS Admin)
PLATFORM_SERVICE_URL=http://localhost:3000
PLATFORM_SERVICE_API_KEY=your-api-key-here

# Sales CRM Service
SALES_CRM_SERVICE_URL=http://localhost:3006
SALES_CRM_SERVICE_API_KEY=your-api-key-here

# Internal Ops Service
INTERNAL_OPS_SERVICE_URL=http://localhost:3005
INTERNAL_OPS_SERVICE_API_KEY=your-api-key-here
# Alternative (if using SaaS Admin as Internal Ops):
# SAAS_ADMIN_SERVICE_URL=http://localhost:3001
# SAAS_ADMIN_SERVICE_API_KEY=your-api-key-here

# Tenant Service (Customer Portal / FastAPI Backend)
TENANT_APP_URL=http://localhost:8000
TENANT_APP_API_KEY=your-api-key-here
# Alternative:
# FASTAPI_BACKEND_SERVICE_URL=http://localhost:8000
# FASTAPI_BACKEND_SERVICE_API_KEY=your-api-key-here
```

---

## Integration Client Fallback Logic

All integration clients now support multiple environment variable names for flexibility:

1. **Primary variable** (matches .env.local naming)
2. **Alternative variable** (legacy or alternative naming)
3. **Default value** (development fallback)

This ensures compatibility with different naming conventions and allows gradual migration.

---

## Testing

To verify service URLs are correctly configured:

```typescript
// Check Internal Ops
console.log('Internal Ops URL:', process.env.INTERNAL_OPS_SERVICE_URL || process.env.SAAS_ADMIN_SERVICE_URL)

// Check Platform
console.log('Platform URL:', process.env.PLATFORM_SERVICE_URL)

// Check Sales CRM
console.log('Sales CRM URL:', process.env.SALES_CRM_SERVICE_URL || process.env.SALES_SERVICE_URL)

// Check Tenant
console.log('Tenant URL:', process.env.TENANT_APP_URL || process.env.FASTAPI_BACKEND_SERVICE_URL)
```

---

**Status:** ✅ **UPDATED**  
**All integration clients now use correct environment variable names matching .env.local**
