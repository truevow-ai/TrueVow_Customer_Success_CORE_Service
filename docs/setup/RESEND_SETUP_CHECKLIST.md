# Resend Integration Setup Checklist

## ✅ Completed
- [x] Environment variables added to `.env.local`
- [x] Resend integration code implemented
- [x] Enhanced email service created
- [x] Webhook handler created
- [x] Unsubscribe page created

## 📋 Next Steps

### Step 1: Install Resend Package
```bash
npm install resend
```

### Step 2: Run Database Migration
Apply the email tracking tables migration:
```bash
# If using Supabase CLI
npx supabase migration up

# Or manually via psql
psql -d your_database -f database/migrations/018_resend_email_tracking.sql
```

### Step 3: Set Up Resend Webhook

**Option A: Via Resend Dashboard (Recommended)**
1. Go to [Resend Webhooks](https://resend.com/webhooks)
2. Click "Create Webhook"
3. Set endpoint: `https://yourdomain.com/api/webhooks/resend`
   - For local testing: Use ngrok or similar tunnel service
4. Select all email events:
   - ✅ email.sent
   - ✅ email.delivered
   - ✅ email.opened
   - ✅ email.clicked
   - ✅ email.bounced
   - ✅ email.complained
   - ✅ email.unsubscribed
5. Click "Create"
6. Copy the `signing_secret` (starts with `whsec_`)
7. Add to `.env.local`: `RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxx`

**Option B: Via Resend API**
```bash
# Create a temporary script or use curl
curl -X POST https://api.resend.com/webhooks \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://yourdomain.com/api/webhooks/resend",
    "events": [
      "email.sent",
      "email.delivered",
      "email.opened",
      "email.clicked",
      "email.bounced",
      "email.complained",
      "email.unsubscribed"
    ]
  }'
```

### Step 4: Verify Domain Authentication
1. Go to [Resend Domains](https://resend.com/domains)
2. Ensure `intakely.xyz` is verified
3. Check SPF, DKIM, and DMARC records are set up

### Step 5: Test the Integration

**Test 1: Send a Test Email**
```typescript
// Create a test script or use API
import { EnhancedEmailService } from '@/lib/services/enhanced-email-service'

const result = await EnhancedEmailService.sendEmail({
  to: 'your-test-email@example.com',
  subject: 'Test Email from CS Support',
  html: '<p>This is a test email.</p>',
  text: 'This is a test email.',
})
```

**Test 2: Verify Webhook**
1. Send a test email
2. Check Resend dashboard → Webhooks → Your webhook
3. Verify events are being received
4. Check your application logs for webhook processing

**Test 3: Test Unsubscribe**
1. Send an email with unsubscribe link
2. Click the unsubscribe link
3. Verify unsubscribe page loads
4. Verify email is added to suppression list

### Step 6: Update Existing Services (Optional)

You can now update existing services to use Resend instead of SendGrid:

1. **CSAT/NPS Surveys** (`lib/services/csat-nps-survey.ts`)
   - Replace SendGrid calls with `EnhancedEmailService`

2. **Onboarding Sequences** (`lib/services/onboarding-sequences.ts`)
   - Replace SendGrid calls with `EnhancedEmailService`

3. **Retention Campaigns** (`lib/services/renewal-orchestration.ts`)
   - Replace SendGrid calls with `EnhancedEmailService`

4. **Success Playbooks** (`lib/services/success-playbooks.ts`)
   - Replace SendGrid calls with `EnhancedEmailService`

## 🔍 Verification Checklist

- [ ] Resend package installed
- [ ] Database migration applied
- [ ] Webhook created in Resend dashboard
- [ ] `RESEND_WEBHOOK_SECRET` added to `.env.local`
- [ ] Domain verified in Resend
- [ ] Test email sent successfully
- [ ] Webhook events received
- [ ] Unsubscribe flow tested
- [ ] Email tracking tables populated

## 🚨 Troubleshooting

### Webhook Not Receiving Events
- Verify webhook endpoint is publicly accessible
- Check `RESEND_WEBHOOK_SECRET` matches the secret from Resend
- Verify signature verification is working
- Check application logs for errors

### Emails Not Sending
- Verify `RESEND_CS_SUPPORT_API_KEY` is correct
- Check domain is verified in Resend
- Verify rate limits are not exceeded
- Check application logs for errors

### Database Errors
- Ensure migration `018_resend_email_tracking.sql` is applied
- Verify tables exist: `cs_email_sends`, `cs_email_events`, `cs_email_unsubscribes`, `cs_email_suppressions`
- Check database connection

## 📚 Documentation

- [Resend Integration Complete](./RESEND_INTEGRATION_COMPLETE.md)
- [Resend API Documentation](https://resend.com/docs)
- [Resend Webhooks Guide](https://resend.com/docs/knowledge-base/forward-emails-with-resend-inbound)
