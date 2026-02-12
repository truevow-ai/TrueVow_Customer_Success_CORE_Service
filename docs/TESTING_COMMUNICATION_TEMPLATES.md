# Testing Communication Templates

**Date:** January 15, 2026  
**Status:** ✅ Test Suite Created

---

## 📋 Overview

This document describes how to test the communication templates system, including template retrieval, rendering, and integration with onboarding sequences.

---

## 🧪 Test Suite

### Running Tests

```bash
npm run test:templates
```

This will run the comprehensive test suite that verifies:
1. ✅ Template retrieval by key
2. ✅ Template rendering with variables
3. ✅ Template lookup by sequence/milestone
4. ✅ All 13 templates exist in database
5. ✅ Variable validation (required variables)

---

## 📝 Test Script

**File:** `scripts/test-communication-templates.ts`

### Test Coverage

#### Test 1: Template Retrieval by Key
- Retrieves a template using `getTemplateByKey()`
- Verifies template structure and metadata
- Checks variable definitions

#### Test 2: Template Rendering with Variables
- Renders a template with test variables
- Verifies variable substitution
- Checks for unreplaced variables

#### Test 3: Template Lookup by Sequence
- Finds templates by `sequence_template_key`
- Filters by template type
- Lists all templates for a sequence

#### Test 4: Verify All Templates Exist
- Checks all 13 templates are in database:
  - `pre_onboarding_email_1`
  - `pre_onboarding_sms_1`
  - `pre_onboarding_email_2`
  - `onboarding_call_email_2`
  - `onboarding_call_email_3`
  - `onboarding_call_email_4`
  - `post_onboarding_email_2`
  - `post_onboarding_email_3`
  - `post_onboarding_email_4`
  - `post_onboarding_email_5`
  - `post_onboarding_email_6`
  - `post_onboarding_sms_critical`
  - `post_onboarding_in_app_welcome`

#### Test 5: Variable Validation
- Tests required variable validation
- Verifies error handling for missing variables

---

## 🔧 Manual Testing

### 1. Test Template API Endpoints

#### List Templates
```bash
curl -X GET "http://localhost:3003/api/v1/communication-templates" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Template by Key
```bash
curl -X GET "http://localhost:3003/api/v1/communication-templates/pre_onboarding_email_1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Render Template
```bash
curl -X POST "http://localhost:3003/api/v1/communication-templates/pre_onboarding_email_1/render" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "customer_name": "John Smith",
      "csm_name": "Sarah Johnson",
      "csm_email": "sarah@truevow.com"
    }
  }'
```

### 2. Test Template Integration with Onboarding

The templates are automatically integrated with the onboarding sequences service. When a milestone triggers a communication, the system will:

1. Look up the template by `milestone_key` or `sequence_template_key`
2. Render the template with customer and CSM variables
3. Create a communication record
4. Send via email/SMS (if configured)

To test this:
1. Start an onboarding sequence with `templateKey`
2. Complete a milestone that triggers a communication
3. Verify the communication record is created with the correct template
4. Check that the rendered content includes all variables

### 3. Test Email Sending

To test email sending with templates:

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

console.log('Communication ID:', result.communicationId)
console.log('Status:', result.status)
```

---

## ✅ Expected Results

### Successful Test Run

```
🧪 Communication Templates Test Suite
==================================================
Started at: 2026-01-15T...

📋 Test 1: Template Retrieval by Key
==================================================
✅ Template retrieved successfully
   Template Key: pre_onboarding_email_1
   Name: Pre-Onboarding Preparation Email
   Type: email
   Category: pre_onboarding
   Variables: 8 defined

🎨 Test 2: Template Rendering with Variables
==================================================
✅ Template rendered successfully
   Subject: Preparing for Your TrueVow Onboarding Call
   Body length: 2847 characters
✅ All variables appear to be replaced

🔍 Test 3: Template Lookup by Sequence
==================================================
✅ Found 3 templates for sequence
   1. Pre-Onboarding Preparation Email (pre_onboarding_email_1)
   2. Checklist Reminder SMS (pre_onboarding_sms_1)
   3. Checklist Completion Confirmation (pre_onboarding_email_2)

📦 Test 4: Verify All Templates Exist
==================================================
✅ pre_onboarding_email_1
✅ pre_onboarding_sms_1
✅ pre_onboarding_email_2
... (all 13 templates)

   Summary: 13/13 templates found

✅ Test 5: Variable Validation
==================================================
✅ Required variable validation works

==================================================
📊 Test Results Summary
==================================================
✅ Template Retrieval
✅ Template Rendering
✅ Template Lookup
✅ All Templates Exist
✅ Variable Validation

   Passed: 5/5
   Completed at: 2026-01-15T...

🎉 All tests passed!
```

---

## 🐛 Troubleshooting

### Template Not Found
- Verify the seed script ran successfully
- Check database connection
- Verify template_key spelling

### Variables Not Replaced
- Check variable keys match template definitions
- Verify all required variables are provided
- Check variable format: `[Variable Name]` in template body

### API Endpoints Not Working
- Verify server is running on port 3003
- Check authentication token is valid
- Verify middleware is configured correctly

---

## 📚 Related Documentation

- `docs/COMMUNICATION_TEMPLATES_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `docs/setup/ONBOARDING_COMMUNICATION_TEMPLATES.md` - Template design
- `lib/services/communication-templates.ts` - Template service
- `lib/services/communication-sender.ts` - Sender service

---

**Next Steps:**
- ✅ Test suite created
- ⏳ Run tests in CI/CD pipeline
- ⏳ Add integration tests for email sending
- ⏳ Add performance tests for template rendering
