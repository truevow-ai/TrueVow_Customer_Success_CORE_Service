# CS-Support Phone Number Integration with Sales CRM Service

**Date:** January 15, 2026  
**Status:** 📋 Integration Plan  
**Related:** Sales CRM Phone Number Assignment System

---

## 📋 Overview

The Sales CRM service has a built-in phone number assignment system that supports:
- **Pool numbers** for parallel dialing
- **Individual numbers** for direct calls

CS-Support service can now leverage this same infrastructure for CSM phone number management and customer communications.

---

## 🎯 Use Cases for CS-Support

### 1. CSM Direct Customer Calls
- CSMs making direct outbound calls to customers
- Individual phone numbers for consistent caller ID
- Better relationship building with personal numbers

### 2. Support Team Pool Numbers
- Shared numbers for support team calls
- Cost-effective for high-volume support
- Campaign/pod-level tracking

### 3. Onboarding Call Numbers
- Dedicated numbers for onboarding calls
- Consistent number for customer recognition
- Better call routing and tracking

---

## 🔧 Integration Approach

### Option 1: Direct Service Integration (Recommended) ✅

CS-Support can call the Sales CRM service's phone number API to get numbers:

```typescript
import { salesServiceClient } from '@/lib/integrations/sales-client'

// Get CSM's individual number for direct call
const { phone_number, number_type } = await salesServiceClient.getPhoneNumber({
  user_id: csmUserId,
  call_type: 'direct_call',
  service: 'cs_support', // Identify as CS-Support service
})

// Get pool number for support team calls
const { phone_number: poolNumber } = await salesServiceClient.getPhoneNumber({
  user_id: csmUserId,
  call_type: 'parallel_dialing',
  campaign_id: 'support_campaign',
  service: 'cs_support',
})
```

**Implementation Status:** ✅ Method added to `lib/integrations/sales-client.ts`

### Option 2: Shared Database Schema

Since both services use the same database, CS-Support can directly query the phone number tables:

```typescript
// Get CSM's individual number from profile
const { data: profile } = await supabase
  .from('user_profiles')
  .select('individual_phone_number, twilio_number_sid')
  .eq('user_id', csmUserId)
  .single()
```

---

## 📊 CSM Phone Number Management

### CSM Profile Configuration

CSMs can configure their individual phone number in their profile (similar to sales reps):

```typescript
POST /api/v1/users/[user_id]/phone-number
{
  "phone_number": "+1-234-567-8900",
  "twilio_number_sid": "PN123...",
  "virtual_number_provider": "twilio",
  "service": "cs_support" // Optional: identify as CS-Support
}
```

### Number Assignment Logic for CSMs

#### Direct Customer Call
```
CSM makes direct call → Uses individual number
Source: CSM's Twilio/virtual number from profile
Requirement: Number must be configured in profile
```

#### Support Pool Call
```
CSM uses support pool → Uses pool number
Priority:
1. Support campaign-specific number
2. Team-level number
3. Default support pool number
```

---

## 🔌 Integration Points

### 1. Communication Sender Service

Update `lib/services/communication-sender.ts` to use phone numbers:

```typescript
import { salesCrmClient } from '@/lib/integrations/sales-client'

// In sendSMS or sendCall methods
const phoneNumber = await salesCrmClient.getPhoneNumber({
  user_id: csmUserId,
  call_type: 'direct_call',
  service: 'cs_support',
})

// Use phoneNumber for outbound calls/SMS
```

### 2. Onboarding Call Service

Update onboarding call workflow to use CSM's individual number:

```typescript
// In onboarding-sequences.ts or law-firm-onboarding.ts
const csmPhoneNumber = await getCsmPhoneNumber(csmUserId)

// Use in communication templates
renderOptions.csm_phone = csmPhoneNumber
```

### 3. Support Ticket Callback

When CSM calls customer from support ticket:

```typescript
// In ticket service or inbox call handler
const phoneNumber = await salesCrmClient.getPhoneNumber({
  user_id: csmUserId,
  call_type: 'direct_call',
  service: 'cs_support',
  context: {
    ticket_id: ticketId,
    customer_id: customerId,
  },
})
```

---

## 📝 Database Schema

CS-Support can leverage the existing Sales CRM phone number schema:

**Table:** `user_profiles` (or similar)
- `individual_phone_number` - CSM's Twilio/virtual number
- `twilio_number_sid` - Twilio number SID
- `virtual_number_provider` - Provider ('twilio' or 'other')
- `service_type` - Optional: 'sales' or 'cs_support'

**Pool Numbers:**
- Managed by Sales CRM service
- CS-Support can request pool numbers via API
- Campaign/pod-level tracking

---

## 🚀 Implementation Steps

### Phase 1: Direct Integration (Quick Win)

1. **Add Sales CRM Client Method**
   ```typescript
   // In lib/integrations/sales-client.ts
   async getPhoneNumber(options: {
     user_id: string
     call_type: 'direct_call' | 'parallel_dialing'
     service?: 'sales' | 'cs_support'
     campaign_id?: string
   }): Promise<string>
   ```

2. **Update Communication Sender**
   - Add phone number retrieval for SMS/calls
   - Use CSM's individual number for direct calls
   - Use pool number for support campaigns

3. **Update Onboarding Sequences**
   - Get CSM phone number from profile or Sales CRM service
   - Include in communication template variables

### Phase 2: CSM Profile Management

1. **Add Phone Number Configuration UI**
   - Settings page for CSMs to add individual number
   - Validation for phone number format
   - Twilio number selection

2. **Update CSM Profile Service**
   - Store individual phone number
   - Link to Twilio number SID
   - Validate number availability

### Phase 3: Support Pool Management

1. **Create Support Pool Numbers**
   - Define support campaign numbers
   - Configure team-level numbers
   - Set up default support pool

2. **Integrate Pool Number Assignment**
   - Request pool numbers from Sales CRM service
   - Track usage by support team
   - Monitor call volume and costs

---

## 🔗 API Endpoints to Leverage

### Sales CRM Service Endpoints

```
GET /api/v1/users/[user_id]/phone-number
POST /api/v1/users/[user_id]/phone-number
GET /api/v1/phone-numbers/pool?campaign_id=...
```

### CS-Support Service Endpoints (New)

```
GET /api/v1/csms/[csm_id]/phone-number
POST /api/v1/csms/[csm_id]/phone-number
GET /api/v1/support/phone-numbers/pool
```

---

## 📊 Benefits

### For CSMs
- ✅ Personal phone number for direct customer calls
- ✅ Consistent caller ID for relationship building
- ✅ Easy number management in profile

### For Support Team
- ✅ Shared pool numbers for cost efficiency
- ✅ Campaign-level tracking
- ✅ Better call routing and analytics

### For System
- ✅ Unified phone number management
- ✅ Shared infrastructure (cost savings)
- ✅ Consistent number assignment logic
- ✅ Better tracking and reporting

---

## 🔄 Migration Path

### Existing CSMs
1. CSMs can optionally add individual numbers to their profiles
2. System falls back to pool numbers if individual number not configured
3. Gradual migration as CSMs configure numbers

### New CSMs
1. Prompt to configure individual number during onboarding
2. Default to pool number if not configured
3. Easy upgrade path to individual number

---

## 📚 Related Documentation

- **Sales CRM:** `docs/sales-ops/SALES_NUMBER_ASSIGNMENT.md`
- **Sales Number Service:** `lib/services/sales-dialer-number-service.ts` (in Sales CRM)
- **Database Schema:** `supabase/migrations/018_user_profile_phone_numbers.sql` (in Sales CRM)
- **CS-Support Communication:** `lib/services/communication-sender.ts`
- **Onboarding Sequences:** `lib/services/onboarding-sequences.ts`

---

## ✅ Next Steps

1. **Review Sales CRM Phone Number Service**
   - Understand API structure
   - Review database schema
   - Identify integration points

2. **Create Integration Client**
   - Add phone number methods to `sales-client.ts`
   - Handle service identification ('cs_support')
   - Add error handling and fallbacks

3. **Update Communication Services**
   - Integrate phone number retrieval
   - Update SMS/call sending logic
   - Add phone number to template variables

4. **Add CSM Profile Management**
   - Create phone number configuration UI
   - Add validation and Twilio integration
   - Update profile service

5. **Test Integration**
   - Test direct call number assignment
   - Test pool number assignment
   - Verify call routing and tracking

---

**Status:** 📋 Ready for Implementation  
**Priority:** Medium (can leverage existing infrastructure)  
**Dependencies:** Sales CRM Phone Number Service (already built)
