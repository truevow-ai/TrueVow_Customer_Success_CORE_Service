# CS-Support Service Documentation Updates

**Date:** January 15, 2026  
**Purpose:** Summary of updates needed in main TrueVow documentation

---

## Updates Required

### 1. Onboarding Templates (CRITICAL UPDATE)

**Current State (WRONG):**
- Documentation may reference sales CRM templates (compliance_magnet_loop, founder_authority_sprint, etc.)
- These belong in Sales CRM Service, NOT CS-Support

**Correct State:**
- CS-Support has 3 onboarding templates:
  1. `law_firm_pre_onboarding` - Pre-onboarding preparation (3 days)
  2. `law_firm_onboarding_call` - Onboarding call workflow (1 day)
  3. `law_firm_post_onboarding_90_days` - First 90 days support (90 days)

**Flow:**
1. Law firm applies for INTAKE service (Sales CRM)
2. Lead/prospect handed to CSM
3. CSM sends automated email about preparing groundwork
4. Customer prepares checklist items
5. Customer requests calendar booking for onboarding call
6. Onboarding call: CSM helps fill in profile information
7. After call: Account configuration, ready for testing INTAKE
8. Post-onboarding: First 90 days support with AI agent + CSM team

---

### 2. JTBD Integration

**New Feature:**
- JTBD (Jobs To Be Done) integrated with RevOps and time tracking
- All onboarding activities report to RevOps with JTBD context
- Time tracking automatically enriched with JTBD for onboarding activities

**Benefits:**
- Track revenue by JTBD
- Measure CSM performance by JTBD type
- Resource allocation tracking by JTBD
- Performance analytics by customer goal

---

### 3. Internal Ops Service Integration

**New Integration:**
- RevOps activity tracking (ticket resolution, onboarding, support calls)
- Time tracking (automatic and manual)
- Task management (churn risk tasks, follow-up tasks)
- Performance metrics (individual and team)
- HR/Resource activity mapping

**Phase 1 (Implemented):**
- ✅ JTBD RevOps reporting
- ✅ JTBD time tracking enrichment

**Phase 1 (Planned):**
- ⏳ Ticket resolved → RevOps activity
- ⏳ Support call → Time tracking
- ⏳ Churn risk identified → Task creation

---

## Sections to Update in Main Documentation

### TrueVow PRD
- **Section:** CS-Support Service / Customer Support
- **Update:** Onboarding templates section (remove sales CRM references)
- **Add:** JTBD integration section
- **Add:** Internal Ops Service integration section

### TrueVow Complete System Documentation
- **Section:** CS-Support Service Architecture
- **Update:** Onboarding flow (correct flow: pre-onboarding → call → post-onboarding)
- **Add:** JTBD integration architecture
- **Add:** Internal Ops Service integration points

### TrueVow Technical Documentation
- **Section:** CS-Support Service Implementation
- **Update:** Onboarding sequence templates (correct templates)
- **Add:** JTBD integration implementation
- **Add:** Internal Ops Service API integration details

---

## Key Points to Emphasize

1. **CS-Support vs Sales CRM:**
   - CS-Support handles onboarding AFTER application (post-sale)
   - Sales CRM handles pre-sale onboarding sequences
   - Clear separation of concerns

2. **Onboarding Flow:**
   - Pre-onboarding: CSM sends prep email, customer prepares
   - Onboarding call: White-glove 45-minute call with CSM
   - Post-onboarding: First 90 days with AI agent + CSM support

3. **JTBD Integration:**
   - All activities tracked with JTBD context
   - Enables performance analytics by customer goal
   - Revenue attribution by JTBD

4. **Internal Ops Integration:**
   - Pre-built integrations for RevOps, time tracking, tasks
   - Automatic revenue attribution
   - Performance metrics and analytics

---

**Status:** Ready for documentation updates
