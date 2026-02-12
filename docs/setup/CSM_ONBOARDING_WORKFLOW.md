# CSM Onboarding Workflow

**Date:** January 15, 2026  
**Status:** ⏳ Design Phase

---

## Overview

This document outlines the **Customer Success Manager (CSM) workflow** for onboarding law firm customers who have applied for INTAKE service. This is the human-led, white-glove onboarding process that happens after the customer completes pre-onboarding preparation.

---

## Workflow Stages

### Stage 1: Lead Handoff (From Sales CRM)

**Trigger:** Law firm applies for INTAKE service

**CSM Actions:**
1. Receive lead/prospect assignment notification
2. Review customer application details
3. Review any notes from Sales CRM
4. Access customer profile in CS-Support dashboard

**System Actions:**
- Create onboarding progress record
- Assign CSM to customer
- Trigger pre-onboarding email

---

### Stage 2: Pre-Onboarding Preparation (Days 1-3)

**CSM Actions:**
1. **Send Pre-Onboarding Email** (Automated, but CSM can customize)
   - Subject: "Preparing for Your TrueVow Onboarding Call"
   - Include groundwork preparation checklist
   - Include calendar booking link (locked until checklist complete)

2. **Monitor Checklist Completion**
   - Track customer progress
   - Send reminders if needed (Day 2)
   - Answer questions via support ticket

3. **Prepare for Onboarding Call**
   - Review customer application
   - Review checklist completion status
   - Prepare call agenda
   - Review any special requirements

**Customer Actions:**
- Receive pre-onboarding email
- Complete preparation checklist
- Gather required information
- Book onboarding call when ready

**System Actions:**
- Send pre-onboarding email (automated)
- Track checklist completion
- Unlock calendar booking when checklist complete
- Send booking confirmation

---

### Stage 3: Onboarding Call (45 Minutes)

**Pre-Call Preparation (15 minutes before):**

**CSM Checklist:**
- [ ] Review customer application
- [ ] Review pre-onboarding checklist completion
- [ ] Review any support tickets or questions
- [ ] Prepare call agenda
- [ ] Have CS-Support dashboard open
- [ ] Have onboarding form ready to fill together

**Call Agenda (45 minutes):**

1. **Introduction (5 minutes)**
   - Welcome customer
   - Confirm call purpose
   - Set expectations

2. **Firm & Team Profile (10 minutes)**
   - Collect firm information:
     - Firm name
     - Practice areas
     - State
     - Timezone
   - Collect team member information:
     - Per attorney/staff: Name, role, email, specialization
     - Calendar type (Google/Outlook)
   - CSM fills in form together with customer
   - **API:** `POST /api/v1/onboarding/law-firm/step-1`

3. **Phone Number Setup (10 minutes)**
   - Discuss phone number options:
     - New Twilio number(s) (English + Spanish)
     - Forward existing office line
   - Help customer choose best option
   - CSM fills in form
   - **API:** `POST /api/v1/onboarding/law-firm/step-2`

4. **Calendar & Email Integration (10 minutes)**
   - Guide customer through OAuth connection
   - For each team member: Connect Google/Outlook
   - Validate connections
   - Configure master calendar if needed
   - CSM assists with any issues
   - **API:** `POST /api/v1/onboarding/law-firm/step-3`

5. **Compliance & Data Settings (5 minutes)**
   - Explain zero-knowledge default
   - Discuss optional 7-day transcript opt-in
   - Get explicit consent if opting in
   - CSM fills in form
   - **API:** `POST /api/v1/onboarding/law-firm/step-4`

6. **Review & Submit (5 minutes)**
   - Review all information together
   - Confirm accuracy
   - Submit onboarding form
   - **API:** `POST /api/v1/onboarding/law-firm/step-5`

7. **Next Steps (5 minutes)**
   - Explain what happens next (account configuration)
   - Set expectations for go-live timeline
   - Answer any questions
   - Schedule follow-up if needed

**Post-Call Actions:**

**CSM Actions:**
1. Mark onboarding call complete
2. Update internal status: `internal_status = "configuring"`
3. Create internal ticket for account configuration team
4. Send post-call summary email
5. Document any special requirements or notes

**System Actions:**
- Lock onboarding form
- Set `status = "submitted_for_config"`
- Set `onboarding_phase = "phase_2_internal_config"`
- Create support ticket for configuration team
- Send post-call summary email

---

### Stage 4: Account Configuration (Internal)

**CSM Actions:**
1. Monitor configuration progress
2. Answer questions from configuration team
3. Update customer if timeline changes
4. Mark ready when configuration complete

**Configuration Team Actions:**
1. Configure tenant based on onboarding data
2. Set up phone numbers
3. Configure calendar integrations
4. Set compliance settings
5. Test account setup
6. Mark `internal_status = "ready_for_success_call"`

**System Actions:**
- Track configuration progress
- Send go-live notification when ready
- Unlock testing access

---

### Stage 5: Go-Live & Testing

**Trigger:** `internal_status = "ready_for_success_call"`

**System Actions:**
- Send SMS/Email: "Your TrueVow system is ready! Start testing INTAKE."
- Unlock INTAKE testing access
- Set `onboarding_phase = "phase_3_go_live"`

**CSM Actions:**
1. Monitor customer testing activity
2. Answer questions via support tickets
3. Provide guidance if needed
4. Confirm successful testing

**Customer Actions:**
- Receive go-live notification
- Start testing INTAKE
- Report any issues
- Confirm successful setup

---

### Stage 6: Post-Onboarding Support (First 90 Days)

**CSM Actions:**

**Days 1-30 (Intensive Support):**
- Monitor customer activity daily
- Respond to support tickets within SLA
- Weekly check-in calls/emails
- Proactive issue detection
- Escalate to AI agent for common questions

**Days 31-60 (Continued Support):**
- Monitor customer activity weekly
- Respond to support tickets within SLA
- Bi-weekly check-ins
- AI agent handles most questions
- CSM for complex issues

**Days 61-90 (Transition Support):**
- Monitor customer activity monthly
- Respond to support tickets within SLA
- Monthly check-ins
- AI agent primary support
- CSM for critical issues only

**AI Agent Actions:**
- Available 24/7
- Handle common questions instantly
- Escalate to CSM when needed
- Learn from interactions
- Provide proactive tips

**System Actions:**
- Track support tickets
- Monitor usage patterns
- Calculate health scores
- Detect churn risk
- Generate support reports

---

## CSM Dashboard Views

### Onboarding Pipeline View
- List of customers in each onboarding stage
- Filter by: Pre-onboarding, Onboarding call, Configuration, Go-live
- Sort by: Date, Priority, Status

### Customer Detail View
- Customer profile
- Onboarding progress
- Checklist completion
- Support tickets
- Activity timeline
- Notes and comments

### Post-Onboarding Support View
- Customers in first 90 days
- Support ticket queue
- Health scores
- Usage metrics
- Churn risk indicators

---

## Communication Templates

### Pre-Onboarding Email
**Subject:** "Preparing for Your TrueVow Onboarding Call"

**Body:**
```
Hi [Customer Name],

Welcome to TrueVow! We're excited to help you get started with INTAKE.

Before we schedule your onboarding call, please prepare the following:

[Checklist Items]

Once you've completed the checklist, you can book your 45-minute onboarding call here:
[Calendly Link]

If you have any questions, please reply to this email or create a support ticket.

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
```

### Onboarding Call Confirmation
**Subject:** "Confirmed: Your TrueVow Onboarding Call - [Date/Time]"

### Post-Call Summary
**Subject:** "Onboarding Call Complete - Next Steps"

### Go-Live Notification
**Subject:** "Your TrueVow System is Ready!"

---

## Success Metrics

### Onboarding Metrics
- Time from application to onboarding call: Target < 5 days
- Onboarding call completion rate: Target 100%
- Time from call to go-live: Target < 2 days
- Customer satisfaction (post-call survey): Target > 4.5/5

### Post-Onboarding Metrics
- First 30 days support ticket volume: Track
- AI agent resolution rate: Target > 80%
- CSM escalation rate: Target < 20%
- Customer health score: Target > 70
- 90-day retention rate: Target > 95%

---

## Next Steps

1. **Design Pre-Onboarding Checklist** - Detailed items
2. **Create Communication Templates** - Email, SMS content
3. **Design CSM Dashboard** - UI/UX for workflow
4. **Design AI Agent Prompts** - First-line support
5. **Create Training Materials** - CSM onboarding guide

---

**Status:** ⏳ Design Phase  
**Ready for:** Detailed checklist design and template content creation
