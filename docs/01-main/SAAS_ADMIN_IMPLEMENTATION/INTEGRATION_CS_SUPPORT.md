# CS-Support Integration Guide for SaaS Admin
**Date:** January 26, 2026  
**Purpose:** How to integrate SaaS Admin onboarding with CS-Support transfer API

---

## 🔗 Transfer API Integration

After customer accepts go-live, transfer them to CS-Support for post-onboarding management.

### API Endpoint

**URL:** `POST https://cs-support-service/api/v1/customers/transfer`

**Authentication:** API Key (set in environment variable `CS_SUPPORT_API_KEY`)

### Request Body

```typescript
{
  customer_id?: string,        // Optional: UUID (if not provided, will be generated)
  tenant_id: string,           // Required: UUID
  customer_email: string,       // Required: Email address
  go_live_date: string,         // Required: ISO timestamp
  onboarding_completed_at: string, // Required: ISO timestamp
  assigned_csm_id?: string,     // Optional: UUID (if not provided, will be auto-assigned)
  initial_health_score?: number, // Optional: 0-100 (if not provided, will be calculated)
  notes?: string,               // Optional: Transfer notes
  metadata?: Record<string, any> // Optional: Additional metadata
}
```

### Response

```typescript
{
  success: true,
  data: {
    customer_id: string,
    tenant_id: string,
    customer_email: string,
    assigned_csm_id: string | null,
    health_score: number | null,
    transferred_at: string,
    success: boolean
  }
}
```

### Error Responses

- `400` - Missing required fields
- `409` - Customer already transferred
- `500` - Server error

---

## 📝 Implementation Example

```typescript
// In law-firm-onboarding.ts or after go-live acceptance
import { createServerSupabase } from '@/lib/db/supabase'

async function transferCustomerToCSSupport(progressId: string) {
  const supabase = createServerSupabase()
  
  // Get onboarding progress
  const { data: progress } = await supabase
    .from('cs_customer_onboarding_progress')
    .select('*')
    .eq('progress_id', progressId)
    .single()

  if (!progress || progress.transfer_status === 'completed') {
    return { success: false, error: 'Already transferred or not found' }
  }

  // Update transfer status
  await supabase
    .from('cs_customer_onboarding_progress')
    .update({ transfer_status: 'in_progress' })
    .eq('progress_id', progressId)

  try {
    // Call CS-Support transfer API
    const response = await fetch('https://cs-support-service/api/v1/customers/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CS_SUPPORT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: progress.progress_id,
        tenant_id: progress.tenant_id,
        customer_email: progress.customer_email,
        go_live_date: progress.go_live_date || progress.completed_at,
        onboarding_completed_at: progress.completed_at,
        assigned_csm_id: progress.assigned_csm_id,
        notes: `Transferred from SaaS Admin after go-live acceptance`,
        metadata: {
          onboarding_progress_id: progress.progress_id,
          onboarding_phase: progress.onboarding_phase,
          onboarding_stage: progress.onboarding_stage,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Transfer failed')
    }

    const result = await response.json()

    // Update transfer status to completed
    await supabase
      .from('cs_customer_onboarding_progress')
      .update({
        transfer_status: 'completed',
        transferred_to_cs_support_at: new Date().toISOString(),
      })
      .eq('progress_id', progressId)

    return { success: true, data: result.data }
  } catch (error) {
    // Update transfer status to failed
    await supabase
      .from('cs_customer_onboarding_progress')
      .update({
        transfer_status: 'failed',
      })
      .eq('progress_id', progressId)

    throw error
  }
}
```

---

## 🔄 Transfer Workflow

```
1. Customer accepts go-live
   ↓
2. SaaS Admin: internal_status = 'onboarding_complete'
   ↓
3. SaaS Admin: onboarding_phase = 'completed'
   ↓
4. SaaS Admin: Call CS-Support transfer API
   ↓
5. CS-Support: Create cs_customer_post_onboarding record
   ↓
6. CS-Support: Assign CSM (auto-assign if not provided)
   ↓
7. CS-Support: Calculate initial health score
   ↓
8. CS-Support: Return transfer confirmation
   ↓
9. SaaS Admin: Update transfer_status = 'completed'
   ↓
10. Customer now managed by CS-Support (post-onboarding)
```

---

## ⚠️ Important Notes

1. **Idempotency:** CS-Support will reject if customer already transferred
2. **API Key:** Must be set in SaaS Admin environment variables
3. **Error Handling:** Always update transfer_status on success/failure
4. **Metadata:** Include onboarding_progress_id for reference

---

**Last Updated:** January 26, 2026
