# Communication Templates - Quick Start Guide

**Date:** January 15, 2026

---

## 🚀 Quick Start

### 1. Templates Are Seeded ✅

All 13 communication templates have been seeded into the database:
- 9 Email templates
- 2 SMS templates  
- 1 In-app template
- 1 Call confirmation template

### 2. Use Templates in Code

#### Retrieve a Template
```typescript
import { CommunicationTemplatesService } from '@/lib/services/communication-templates'

const template = await CommunicationTemplatesService.getTemplateByKey(
  'pre_onboarding_email_1'
)
```

#### Render a Template
```typescript
const rendered = CommunicationTemplatesService.renderTemplate(template, {
  customer_name: 'John Smith',
  csm_name: 'Sarah Johnson',
  csm_email: 'sarah@truevow.com',
  // ... other variables
})
```

#### Send an Email Using Template
```typescript
import { CommunicationSenderService } from '@/lib/services/communication-sender'

const result = await CommunicationSenderService.sendEmail({
  templateKey: 'pre_onboarding_email_1',
  to: 'customer@example.com',
  variables: {
    customer_name: 'John Smith',
    csm_name: 'Sarah Johnson',
    // ... other variables
  },
  tenantId: 'tenant-uuid',
  customerEmail: 'customer@example.com',
})
```

### 3. Templates Auto-Integrated ✅

Templates are automatically used when onboarding milestones trigger communications. The `OnboardingSequencesService` will:
1. Look up the template by `milestone_key` or `sequence_template_key`
2. Render it with customer/CSM variables
3. Create a communication record
4. Send via email/SMS

---

## 📋 Available Templates

### Pre-Onboarding
- `pre_onboarding_email_1` - Preparation email
- `pre_onboarding_sms_1` - Checklist reminder SMS
- `pre_onboarding_email_2` - Call confirmation email

### Onboarding Call
- `onboarding_call_email_2` - Pre-call reminder
- `onboarding_call_email_3` - Post-call summary
- `onboarding_call_email_4` - Go-live notification

### Post-Onboarding (90 Days)
- `post_onboarding_email_2` - Week 1 check-in
- `post_onboarding_email_3` - Week 2 check-in
- `post_onboarding_email_4` - Month 1 summary
- `post_onboarding_email_5` - Month 2 check-in
- `post_onboarding_email_6` - Month 3 check-in
- `post_onboarding_sms_critical` - Critical issue SMS
- `post_onboarding_in_app_welcome` - AI agent welcome

---

## 🔧 API Endpoints

### List Templates
```
GET /api/v1/communication-templates
```

### Get Template
```
GET /api/v1/communication-templates/[templateKey]
```

### Render Template
```
POST /api/v1/communication-templates/[templateKey]/render
Body: { "variables": { ... } }
```

### Create Template
```
POST /api/v1/communication-templates
Body: { ... }
```

### Update Template
```
PUT /api/v1/communication-templates/[templateKey]
Body: { ... }
```

---

## ✅ Testing

Run the test suite:
```bash
npm run test:templates
```

---

## 📚 Full Documentation

- `docs/COMMUNICATION_TEMPLATES_IMPLEMENTATION_COMPLETE.md` - Complete implementation
- `docs/TESTING_COMMUNICATION_TEMPLATES.md` - Testing guide
- `docs/setup/ONBOARDING_COMMUNICATION_TEMPLATES.md` - Template design

---

**Status:** ✅ Ready to Use
