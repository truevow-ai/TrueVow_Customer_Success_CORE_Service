# CS-Support Onboarding Templates

**Date:** January 15, 2026  
**Status:** ⏳ Design Phase

---

## Overview

These are the **CS-Support onboarding templates** for law firm customers who have **already applied for INTAKE service** (handoff from Sales CRM). These templates support the customer success journey from application to first 90 days of usage.

**⚠️ NOTE:** These are NOT sales CRM templates. Sales CRM templates (compliance_magnet_loop, founder_authority_sprint, etc.) belong in the Sales CRM service, not CS-Support.

---

## Template 1: Law Firm Pre-Onboarding Preparation

**Template Key:** `law_firm_pre_onboarding`  
**JTBD:** "Help me prepare everything needed for a successful onboarding call."  
**Duration:** 3 days  
**Trigger:** After law firm applies for INTAKE service, lead/prospect handed to CSM

### Flow

1. **CSM Receives Lead** (from Sales CRM)
   - Law firm has applied for INTAKE service
   - Lead/prospect assigned to CSM

2. **CSM Sends Automated Email** (Day 0)
   - Subject: "Preparing for Your TrueVow Onboarding Call"
   - Content: Groundwork preparation checklist
   - Includes: What to gather, prepare, and have ready

3. **Customer Prepares Checklist Items** (Days 1-3)
   - Gathers required information
   - Prepares documents/access
   - Reviews preparation materials

4. **Customer Requests Calendar Booking** (Day 3+)
   - Customer confirms checklist complete
   - Books onboarding call via Calendly
   - CSM receives booking notification

### Checklist Items (To Be Designed)

- [ ] Firm information (name, practice areas, state, timezone)
- [ ] Team member list (attorneys, staff, roles, emails)
- [ ] Phone number preferences (new number vs. forwarding)
- [ ] Calendar access (Google/Outlook accounts)
- [ ] Compliance preferences (zero-knowledge settings)
- [ ] Any questions or concerns

### Communication Templates

- **Email 1:** Pre-onboarding preparation email (automated from CSM)
- **SMS 1:** Reminder to complete checklist (Day 2)
- **Email 2:** Checklist completion confirmation (when customer books call)

---

## Template 2: Law Firm Onboarding Call

**Template Key:** `law_firm_onboarding_call`  
**JTBD:** "Help me complete my profile setup with expert guidance."  
**Duration:** 1 day (45-minute call + configuration)  
**Trigger:** Customer books onboarding call after completing pre-onboarding checklist

### Flow

1. **Onboarding Call Scheduled** (Day 0)
   - Customer books 45-minute white-glove onboarding call
   - CSM receives booking notification
   - CSM prepares for call

2. **Onboarding Call** (Day 0, 45 minutes)
   - CSM helps fill in profile information:
     - Firm & Team Profile (Step 1)
     - Phone Number Setup (Step 2)
     - Calendar & Email Integration (Step 3)
     - Compliance & Data Settings (Step 4)
   - CSM answers questions
   - CSM provides guidance

3. **Post-Call Configuration** (Day 0, after call)
   - CSM marks call complete
   - Internal team configures account
   - Account ready for testing INTAKE

4. **Go-Live Notification** (Day 0-1)
   - System sends go-live notification
   - Customer can start testing INTAKE

### CSM Workflow (To Be Designed)

- **Pre-Call Preparation:**
  - Review customer application
  - Review pre-onboarding checklist completion
  - Prepare call agenda

- **During Call:**
  - Guide customer through profile setup
  - Fill in information together
  - Answer questions
  - Document any special requirements

- **Post-Call:**
  - Mark onboarding call complete
  - Update internal status
  - Trigger account configuration
  - Schedule follow-up if needed

### Communication Templates

- **Email 1:** Onboarding call confirmation (after booking)
- **Email 2:** Pre-call reminder (1 hour before)
- **Email 3:** Post-call summary (after call)
- **Email 4:** Go-live notification (when account ready)

---

## Template 3: Law Firm Post-Onboarding Support (First 90 Days)

**Template Key:** `law_firm_post_onboarding_90_days`  
**JTBD:** "Help me successfully use INTAKE and resolve any issues I face."  
**Duration:** 90 days  
**Trigger:** After onboarding call complete, account go-live

### Flow

1. **Go-Live** (Day 0)
   - Account configured and ready
   - Customer can start using INTAKE
   - First-line AI agent available

2. **First 30 Days** (Days 1-30)
   - Intensive support period
   - AI agent handles common questions
   - CSM team available for escalations
   - Weekly check-ins

3. **Days 31-60** (Days 31-60)
   - Continued support
   - AI agent primary support
   - CSM team for complex issues
   - Bi-weekly check-ins

4. **Days 61-90** (Days 61-90)
   - Transition to standard support
   - AI agent handles most issues
   - CSM team for critical issues
   - Monthly check-ins

### Support Structure

- **First-Line AI Agent:**
  - Available 24/7
  - Handles common questions
  - Provides instant responses
  - Escalates to CSM when needed

- **CSM Team:**
  - Assigned to customer
  - Handles complex issues
  - Proactive check-ins
  - Success monitoring

### Communication Templates

- **Email 1:** Welcome to INTAKE (go-live)
- **Email 2:** Week 1 check-in
- **Email 3:** Week 2 check-in
- **Email 4:** Month 1 summary
- **Email 5:** Month 2 check-in
- **Email 6:** Month 3 check-in
- **SMS:** Critical issue notifications
- **In-App:** AI agent chat interface

---

## Integration Points

### Sales CRM Service
- Receives lead/prospect after application
- Handoff webhook/API call

### Platform Service
- Account creation
- Calendar OAuth
- Phone number assignment

### Calendly
- Booking unlock
- Onboarding call scheduling

### AI Agent Service
- First-line support
- 24/7 availability
- Escalation to CSM

---

## Next Steps

1. **Design Pre-Onboarding Checklist** - Detailed items customer needs to prepare
2. **Design CSM Workflow** - Step-by-step guide for CSM during onboarding call
3. **Design Communication Templates** - Email, SMS, in-app messages
4. **Design AI Agent Prompts** - First-line support responses
5. **Design Post-Onboarding Support Flows** - Escalation paths, check-in schedules

---

**Status:** ⏳ Design Phase  
**Ready for:** Template content design and CSM workflow creation
