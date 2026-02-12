# Service API Key Explanation

**Date:** January 15, 2026  
**Purpose:** Clarify how service-to-service API keys work

---

## How Service-to-Service API Keys Work

### The Key Concept

**Each service has ONE API key that OTHER services use to call it.**

### Example Flow

1. **Sales CRM calls CS-Support:**
   - Sales CRM sends: `CS_SUPPORT_SERVICE_API_KEY` (CS-Support's key)
   - CS-Support validates: "Is this my key? Yes → Allow"

2. **CS-Support calls Sales CRM:**
   - CS-Support sends: `SALES_CRM_SERVICE_API_KEY` (Sales CRM's key)
   - Sales CRM validates: "Is this my key? Yes → Allow"

---

## Answer to Your Question

**Q: Do I need to generate a separate API key for CS_SUPPORT_SERVICE_API_KEY, or is the same key that Sales module uses to connect to CS-Support the same?**

**A: The key that Sales module uses to connect to CS-Support IS CS-Support's own API key.**

### How It Works:

1. **CS-Support generates its own API key:**
   ```bash
   CS_SUPPORT_SERVICE_API_KEY=your-generated-key-here
   ```

2. **CS-Support stores this key in .env.local**

3. **CS-Support validates incoming requests:**
   - When Sales CRM (or any service) calls CS-Support
   - They send `CS_SUPPORT_SERVICE_API_KEY` in the header
   - CS-Support checks: "Does this match my CS_SUPPORT_SERVICE_API_KEY?"
   - If yes → Allow the request

4. **Sales CRM stores the same key:**
   - Sales CRM's .env.local has: `CS_SUPPORT_SERVICE_API_KEY=your-generated-key-here`
   - When Sales CRM calls CS-Support, it uses this key

---

## Current Implementation Issue

The API key middleware (`lib/middleware/api-key.ts`) currently only validates keys from OTHER services:

```typescript
const VALID_API_KEYS = [
  process.env.SALES_SERVICE_API_KEY,        // Sales CRM's key (for when Sales calls CS)
  process.env.PLATFORM_SERVICE_API_KEY,     // Platform's key (for when Platform calls CS)
  process.env.INTERNAL_OPS_SERVICE_API_KEY, // Internal Ops' key (for when Internal Ops calls CS)
  process.env.TENANT_SERVICE_API_KEY,      // Tenant's key (for when Tenant calls CS)
]
```

**This is WRONG!** It should validate CS-Support's own key when other services call it.

---

## Correct Implementation

CS-Support should validate its OWN key when other services call it:

```typescript
const VALID_API_KEYS = [
  process.env.CS_SUPPORT_SERVICE_API_KEY,  // CS-Support's OWN key (for when others call CS)
  // ... other keys if needed for backward compatibility
]
```

**Why?** Because:
- When Sales CRM calls CS-Support → Sales sends `CS_SUPPORT_SERVICE_API_KEY`
- CS-Support validates: "Is this my key? Yes → Allow"

---

## Recommended Setup

### 1. Generate CS-Support's API Key

Generate a secure random key (64 characters, hex):

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Using PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 2. Add to CS-Support's .env.local

```bash
# CS-Support Service's OWN API Key (other services use this to call CS-Support)
CS_SUPPORT_SERVICE_API_KEY=your-generated-key-here-64-chars
```

### 3. Share with Other Services

Add the same key to other services' .env.local files:

**Sales CRM Service .env.local:**
```bash
# CS-Support Service URL and Key (for calling CS-Support)
CS_SUPPORT_SERVICE_URL=http://localhost:3007
CS_SUPPORT_SERVICE_API_KEY=your-generated-key-here-64-chars  # Same key!
```

**Platform Service .env.local:**
```bash
# CS-Support Service URL and Key (for calling CS-Support)
CS_SUPPORT_SERVICE_URL=http://localhost:3007
CS_SUPPORT_SERVICE_API_KEY=your-generated-key-here-64-chars  # Same key!
```

**Internal Ops Service .env.local:**
```bash
# CS-Support Service URL and Key (for calling CS-Support)
CS_SUPPORT_SERVICE_URL=http://localhost:3007
CS_SUPPORT_SERVICE_API_KEY=your-generated-key-here-64-chars  # Same key!
```

---

## Summary

- ✅ **CS-Support generates ONE API key** (`CS_SUPPORT_SERVICE_API_KEY`)
- ✅ **Other services use this SAME key** to call CS-Support
- ✅ **CS-Support validates this key** when receiving requests
- ✅ **The key you have from Sales module IS CS-Support's key** (if it's the one Sales uses to call CS-Support)

**Action Required:** Update the API key middleware to validate `CS_SUPPORT_SERVICE_API_KEY` instead of (or in addition to) other services' keys.

---

**Status:** Ready for implementation
