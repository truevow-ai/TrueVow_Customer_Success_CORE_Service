# SaaS Admin Onboarding Module - Complete Implementation Guide
**Date:** January 26, 2026  
**Status:** 📦 **Ready for Implementation**  
**Purpose:** Complete onboarding module for SaaS Admin service

---

## 🎯 Overview

This document provides a complete implementation package for the onboarding module in SaaS Admin service. All onboarding functionality has been removed from CS-Support and needs to be implemented in SaaS Admin.

**Key Points:**
- Client Onboarding Managers work in SaaS Admin (no LLM intrusion)
- All onboarding tables are in SaaS Admin database
- After go-live acceptance, customers are transferred to CS-Support via API
- CS-Support only manages post-onboarding customers

---

## 📋 Implementation Checklist

### Phase 1: Database Setup ✅
- [x] Database schema created: `database/migrations/SAAS_ADMIN_ONBOARDING_SCHEMA.sql`
- [ ] Apply schema to SaaS Admin database
- [ ] Run seed data for onboarding sequence templates
- [ ] Set up RLS policies for `client_onboarding_manager` role

### Phase 2: Core Services
- [ ] Create `lib/services/onboarding-sequences.ts`
- [ ] Create `lib/services/law-firm-onboarding.ts`
- [ ] Create `lib/services/onboarding-dashboard.ts` (for onboarding managers)
- [ ] Create `lib/services/onboarding-communication.ts` (uses `cs_onboarding_communications`)

### Phase 3: API Endpoints
- [ ] Create `app/api/v1/onboarding/start/route.ts`
- [ ] Create `app/api/v1/onboarding/law-firm/step-1/route.ts`
- [ ] Create `app/api/v1/onboarding/law-firm/step-2/route.ts`
- [ ] Create `app/api/v1/onboarding/law-firm/step-3/route.ts`
- [ ] Create `app/api/v1/onboarding/law-firm/step-4/route.ts`
- [ ] Create `app/api/v1/onboarding/law-firm/step-5/route.ts`
- [ ] Create `app/api/v1/onboarding/law-firm/internal-status/route.ts`
- [ ] Create `app/api/v1/onboarding/law-firm/progress/route.ts`
- [ ] Create `app/api/v1/onboarding/milestone/complete/route.ts`
- [ ] Create `app/api/v1/onboarding/progress/route.ts`
- [ ] Create `app/api/v1/onboarding/sequences/templates/route.ts`
- [ ] Create `app/api/v1/onboarding/sequences/template/[templateKey]/route.ts`
- [ ] Create `app/api/v1/webhooks/platform/milestone/route.ts`
- [ ] Create `app/api/v1/dashboard/onboarding/route.ts` (for onboarding managers)

### Phase 4: UI Components
- [ ] Create onboarding dashboard component (shows active onboarding customers)
- [ ] Create onboarding form components (Steps 1-5)
- [ ] Create onboarding progress tracking UI
- [ ] Create internal status management UI

### Phase 5: Integration
- [ ] Integrate with CS-Support transfer API (`POST /api/v1/customers/transfer`)
- [ ] Set up webhook for platform milestone events
- [ ] Configure communication templates

---

## 📦 Files to Create

### Services (lib/services/)
1. `onboarding-sequences.ts` - Sequence management, milestone tracking
2. `law-firm-onboarding.ts` - Law firm onboarding workflow (Steps 1-5)
3. `onboarding-dashboard.ts` - Dashboard for onboarding managers
4. `onboarding-communication.ts` - Communication tracking (uses `cs_onboarding_communications`)

### API Endpoints (app/api/v1/onboarding/)
1. `start/route.ts` - Start onboarding sequence
2. `law-firm/step-1/route.ts` - Firm profile
3. `law-firm/step-2/route.ts` - Phone config
4. `law-firm/step-3/route.ts` - Calendar integration
5. `law-firm/step-4/route.ts` - Compliance settings
6. `law-firm/step-5/route.ts` - Review & submit
7. `law-firm/internal-status/route.ts` - Update internal status
8. `law-firm/progress/route.ts` - Get law firm progress
9. `milestone/complete/route.ts` - Complete milestone
10. `progress/route.ts` - Get onboarding progress
11. `sequences/templates/route.ts` - List templates
12. `sequences/template/[templateKey]/route.ts` - Get template by key

### Webhooks (app/api/v1/webhooks/)
1. `platform/milestone/route.ts` - Platform milestone webhook

### Dashboard (app/api/v1/dashboard/)
1. `onboarding/route.ts` - Onboarding manager dashboard

---

## 🔗 Integration Points

### CS-Support Transfer API
After customer accepts go-live, call CS-Support transfer API:

```typescript
POST https://cs-support-service/api/v1/customers/transfer
Headers: {
  'Authorization': 'Bearer <api-key>',
  'Content-Type': 'application/json'
}
Body: {
  "customer_id": "uuid",
  "tenant_id": "uuid",
  "customer_email": "customer@example.com",
  "go_live_date": "2026-01-26T10:00:00Z",
  "onboarding_completed_at": "2026-01-26T09:00:00Z",
  "assigned_csm_id": "uuid" (optional),
  "initial_health_score": 75 (optional),
  "notes": "Customer ready for CSM handoff",
  "metadata": {}
}
```

---

## 📝 Next Steps

1. **Review this implementation guide**
2. **Apply database schema** to SaaS Admin database
3. **Create services** (see implementation files below)
4. **Create API endpoints** (see implementation files below)
5. **Create UI components** (see implementation files below)
6. **Test integration** with CS-Support transfer API
7. **Set up webhooks** for platform milestone events

---

**Last Updated:** January 26, 2026  
**Status:** 📦 **Ready for SaaS Admin Implementation**
