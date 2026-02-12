# Support-Oriented FAQs - Summary

**Date:** January 15, 2026  
**Status:** ✅ Ready for Implementation  
**Purpose:** Comprehensive support FAQs for existing TrueVow customers

---

## Overview

Created **62 support-oriented FAQs** organized into **13 categories** to address questions from existing TrueVow customers. These complement the sales-oriented FAQs from the marketing website.

---

## Categories and FAQ Count

1. **Onboarding** (5 FAQs) - Getting started, setup, team members
2. **Technical** (6 FAQs) - Troubleshooting, errors, integrations
3. **Billing** (6 FAQs) - Invoices, payments, subscriptions
4. **Account** (5 FAQs) - Settings, access, team management
5. **INTAKE Service** (5 FAQs) - Intake-specific questions
6. **VERIFY Service** (5 FAQs) - Verification questions
7. **DRAFT Service** (5 FAQs) - Document generation questions
8. **SETTLE Service** (5 FAQs) - Settlement questions
9. **CONNECT Service** (5 FAQs) - Provider network questions
10. **Compliance** (5 FAQs) - Bar compliance, privacy, security
11. **Integrations** (4 FAQs) - Calendar, CMS, third-party tools
12. **Reporting** (3 FAQs) - Analytics, metrics, exports
13. **Escalation** (4 FAQs) - Support cases, response times

**Total: 62 Support-Oriented FAQs**

---

## Key Coverage Areas

### Service-Specific
Each TrueVow service has dedicated FAQs:
- How the service works
- Common use cases
- Troubleshooting
- Best practices

### Compliance & Security
Strong emphasis on:
- Bar compliance explanations
- Zero-knowledge principles
- Data security measures
- Privacy protections

### Practical Support
Addresses real customer needs:
- Step-by-step troubleshooting
- Account management
- Billing questions
- Technical issues

---

## Implementation

The full SQL file with all 62 FAQs is ready. Due to file size, it should be imported directly to the database.

**Import Command:**
```bash
psql -d your_database -f database/seed_support_faqs.sql
```

**Note:** The SQL file contains all 62 FAQs with proper categorization, keywords, intents, and metadata.

---

## Sample FAQs by Category

### Onboarding
- "How do I get started with TrueVow?"
- "How long does onboarding take?"
- "Can I change my intake script after onboarding?"

### Technical
- "My calls aren't routing correctly"
- "I'm getting an error when trying to access my account"
- "How do I integrate my phone system?"

### Billing
- "How do I view my invoices?"
- "I was charged incorrectly"
- "How do I update my payment method?"

### Service-Specific Examples

**INTAKE:**
- "How do I customize my intake questions?"
- "Where do I see new intake cases?"

**VERIFY:**
- "How does VERIFY work?"
- "How long does verification take?"

**DRAFT:**
- "How do I create a document with DRAFT?"
- "What document types does DRAFT support?"

**SETTLE:**
- "How does SETTLE help with settlement negotiations?"
- "Can SETTLE negotiate settlements automatically?" (clarifies it doesn't)

**CONNECT:**
- "How does CONNECT work?"
- "How do I find a medical provider?"

---

## Integration

These FAQs integrate with:
- ✅ `FAQRepositoryService` for search
- ✅ `Tier1FAQAgent` as first-choice responses
- ✅ `CustomerSupportChat` for support queries
- ✅ Admin UI for management

---

## Next Steps

1. **Import the SQL file** to populate support FAQs
2. **Test FAQ search** with customer support questions
3. **Monitor usage** to identify additional FAQs needed
4. **Iterate** based on actual customer questions

---

**File Location:** `database/seed_support_faqs.sql` (ready for import)  
**Total FAQs:** 62 support-oriented FAQs  
**Coverage:** Comprehensive support questions for existing customers
