# Resend Integration - Complete Implementation

**Date:** January 2026  
**Status:** ✅ Complete

---

## Overview

Complete implementation of Resend webhook integration and production-grade email features for CS Support Service, copied from Sales CRM service.

---

## ✅ Implemented Features

### 1. Resend Client Integration
**File:** `lib/integrations/resend.ts`

**Features:**
- ✅ Resend API client wrapper
- ✅ Email sending with threading support
- ✅ Signature verification for webhooks
- ✅ Error handling

### 2. Resend Webhook Handler
**File:** `app/api/webhooks/resend/route.ts`

**Features:**
- ✅ Signature verification (HMAC-SHA256)
- ✅ Email sent tracking
- ✅ Email delivered tracking
- ✅ Email opened tracking → conditional logic triggers
- ✅ Email clicked tracking → conditional logic triggers
- ✅ Email bounced handling → suppression list
- ✅ Spam complaint handling → suppression list
- ✅ Unsubscribe handling → suppression list

**Event Types Handled:**
- `email.sent`
- `email.delivered`
- `email.opened`
- `email.clicked`
- `email.bounced`
- `email.complained`
- `email.unsubscribed`

### 3. Unsubscribe Page
**File:** `app/unsubscribe/[token]/page.tsx`

**Features:**
- ✅ CAN-SPAM/GDPR compliant
- ✅ Mobile-responsive UI
- ✅ Token-based unsubscribe
- ✅ Success/error states
- ✅ User-friendly messaging

**API:** `app/api/v1/email/unsubscribe/[token]/route.ts`

### 4. Compliance Footer Auto-Append
**File:** `lib/services/email-compliance-footer.ts`

**Features:**
- ✅ Auto-append CAN-SPAM/GDPR footers
- ✅ Jurisdiction-specific disclaimers (US, EU, CA, UK, AU, GLOBAL)
- ✅ Plain text and HTML versions
- ✅ Unsubscribe link generation
- ✅ Company info inclusion

**Integration:** Automatically added to all emails via `EnhancedEmailService`

### 5. UTM Tracking
**File:** `lib/services/email-utm-tracking.ts`

**Features:**
- ✅ Add UTM parameters to all links
- ✅ HTML link parsing and replacement
- ✅ Campaign attribution
- ✅ Custom tracking parameters (lead_id, email_id, sequence_id)
- ✅ UTM extraction from URLs

**Integration:** Automatically added to all HTML emails

### 6. Rate Limiting
**File:** `lib/services/email-rate-limiter.ts`

**Features:**
- ✅ Per-domain rate limiting (300 emails/min default)
- ✅ Per-hour rate limiting (10,000 emails/hour)
- ✅ Per-day rate limiting (100,000 emails/day)
- ✅ Configurable limits
- ✅ Retry-after calculation

**Integration:** Checks before sending via `EnhancedEmailService`

### 7. Enhanced Email Service
**File:** `lib/services/enhanced-email-service.ts`

**Features:**
- ✅ Rate limiting check before sending
- ✅ UTM tracking auto-add to all links
- ✅ Compliance footer auto-append to all emails
- ✅ Unsubscribe token generation
- ✅ Rate limit recording after sending
- ✅ Personalization support
- ✅ Audit logging

---

## 📊 Database Schema

**Migration:** `database/migrations/018_resend_email_tracking.sql`

**Tables Created:**
- `cs_email_sends` - Track all emails sent
- `cs_email_events` - Track individual email events
- `cs_email_unsubscribes` - Track unsubscribe tokens
- `cs_email_suppressions` - Suppression list

---

## ⚖️ Legal Compliance

**Implemented:**
- ✅ CAN-SPAM footer auto-append
- ✅ Jurisdiction-specific disclaimers (US, EU, CA, UK, AU)
- ✅ Unsubscribe page
- ✅ Suppression list management
- ✅ Audit logs (via email_sends table)

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install resend
```

### 2. Environment Variables

Add to `.env.local`:
```bash
RESEND_CS_SUPPORT_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=support@truevow.com
RESEND_FROM_NAME=TrueVow Support
NEXT_PUBLIC_APP_URL=https://yourdomain.com
RESEND_WEBHOOK_ENDPOINT=https://yourdomain.com/api/webhooks/resend
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxx  # Will be provided by Resend when creating webhook
```

**Note:** The code also supports `RESEND_API_KEY` as a fallback for backward compatibility.

### 3. Database Migration

Run the migration:
```bash
# Apply migration
npx supabase migration up
# or
psql -d your_database -f database/migrations/018_resend_email_tracking.sql
```

### 4. Domain Authentication

Add TXT records to your domain:
- **SPF:** `v=spf1 include:resend.com ~all`
- **DKIM:** (Provided by Resend)
- **DMARC:** `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com`

### 5. Webhook Configuration

**Option A: Via Resend Dashboard (Recommended)**
1. Go to [Resend Webhooks Dashboard](https://resend.com/webhooks)
2. Click "Create Webhook"
3. Set endpoint: `https://yourdomain.com/api/webhooks/resend`
4. Select all email events
5. Copy the `signing_secret` from the response
6. Add to `.env.local`: `RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxx`

**Option B: Via Resend API**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_CS_SUPPORT_API_KEY);

const { data, error } = await resend.webhooks.create({
  endpoint: process.env.RESEND_WEBHOOK_ENDPOINT || 'https://yourdomain.com/api/webhooks/resend',
  events: ['email.sent', 'email.delivered', 'email.opened', 'email.clicked', 
           'email.bounced', 'email.complained', 'email.unsubscribed'],
});

// Response includes signing_secret
// Add to .env.local: RESEND_WEBHOOK_SECRET=data.signing_secret
```

---

## 📈 Usage

### Send Email via Enhanced Service

```typescript
import { EnhancedEmailService } from '@/lib/services/enhanced-email-service'

const response = await EnhancedEmailService.sendEmail({
  to: 'customer@example.com',
  subject: 'Support Ticket Update',
  html: '<p>Your ticket has been updated.</p>',
  text: 'Your ticket has been updated.',
  utmSource: 'cs-support',
  utmCampaign: 'ticket-update',
  leadId: 'lead_123',
  jurisdiction: 'US',
})
```

### Check Rate Limit

```typescript
import { EmailRateLimiterService } from '@/lib/services/email-rate-limiter'

const rateLimit = await EmailRateLimiterService.checkRateLimit('truevow.com')
if (!rateLimit.allowed) {
  console.log(`Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds.`)
}
```

---

## 🔄 Integration with Existing Services

The Resend integration can be used alongside or as a replacement for SendGrid:

- **Current:** SendGrid is still used for inbox email sending
- **New:** Resend can be used for:
  - Survey emails (CSAT/NPS)
  - Onboarding sequences
  - Retention campaigns
  - Success playbooks
  - Any bulk email operations

To switch existing services to use Resend, update:
- `lib/services/csat-nps-survey.ts` - Replace SendGrid with EnhancedEmailService
- `lib/services/onboarding-sequences.ts` - Replace SendGrid with EnhancedEmailService
- `lib/services/renewal-orchestration.ts` - Replace SendGrid with EnhancedEmailService
- `lib/services/success-playbooks.ts` - Replace SendGrid with EnhancedEmailService

---

## 📋 Next Steps

1. **Update Existing Services** - Replace SendGrid calls with EnhancedEmailService where appropriate
2. **Test Webhook** - Send test emails and verify webhook events are received
3. **Monitor Rate Limits** - Monitor email sending rates and adjust limits as needed
4. **Grafana Dashboard** - Visualize email metrics (sends, opens, clicks, bounces)

---

**Status:** Production-ready for Resend integration ✅
