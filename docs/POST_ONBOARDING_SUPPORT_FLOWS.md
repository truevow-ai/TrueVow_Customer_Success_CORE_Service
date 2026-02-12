# Post-Onboarding Support Flows Design

**Date:** January 15, 2026  
**Status:** 📋 Design Complete  
**Feature:** Post-Onboarding Support - Escalation Paths and Check-in Schedules

---

## Overview

This document defines the support flows and check-in schedules for customers after they complete the initial onboarding process. It covers escalation paths, proactive check-ins, health monitoring, and retention strategies.

---

## Post-Onboarding Timeline

### Phase 1: Immediate Post-Onboarding (Days 1-7)

**Focus:** Ensure successful go-live and initial usage

**Check-ins:**
- **Day 1:** Welcome call/email confirming go-live
- **Day 3:** Quick check-in (email/SMS) - "How's it going?"
- **Day 7:** First week review (call) - Usage review, questions, feedback

**Support Level:** High-touch, proactive

**Escalation Triggers:**
- No usage after 3 days → CSM outreach
- Error reports → Technical support
- Billing questions → Billing team
- Feature requests → Product team

---

### Phase 2: Early Adoption (Days 8-30)

**Focus:** Feature adoption, usage growth, issue resolution

**Check-ins:**
- **Day 14:** Mid-month check-in (email) - Usage patterns, questions
- **Day 30:** First month review (call) - Comprehensive review, success metrics

**Support Level:** Moderate-touch, responsive

**Escalation Triggers:**
- Low usage → CSM engagement campaign
- Technical issues → Solutions engineer
- Billing disputes → Billing team + CSM
- Churn risk detected → Head of CS escalation

---

### Phase 3: Established Customer (Days 31-90)

**Focus:** Optimization, expansion, retention

**Check-ins:**
- **Day 60:** Quarterly check-in (call) - Health review, expansion opportunities
- **Day 90:** End of quarter review (call) - Success metrics, renewal prep

**Support Level:** Standard-touch, scheduled

**Escalation Triggers:**
- Health score drops → CSM intervention
- Expansion interest → Sales team handoff
- Renewal concerns → Head of CS + CFO
- Service issues → Technical escalation

---

### Phase 4: Long-term Customer (90+ Days)

**Focus:** Retention, expansion, advocacy

**Check-ins:**
- **Monthly:** Health score review (automated)
- **Quarterly:** Scheduled check-in call
- **Annually:** Strategic review (Head of CS)

**Support Level:** Low-touch, as-needed

**Escalation Triggers:**
- Churn risk → Retention playbook
- Expansion opportunity → Sales team
- Strategic partnership → Executive team

---

## Escalation Paths

### 1. Technical Issues

#### Level 1: Support Agent (AI)
- **Handles:** Common issues, password resets, basic questions
- **Escalates to:** Solutions Engineer if unresolved in 24 hours

#### Level 2: Solutions Engineer
- **Handles:** Complex technical issues, API problems, integrations
- **Escalates to:** Engineering team if bug or system issue

#### Level 3: Engineering Team
- **Handles:** Bugs, system outages, critical technical issues
- **Response Time:** Urgent: 2 hours, High: 24 hours, Medium: 72 hours

**Escalation Criteria:**
- Issue affects multiple customers → Engineering
- Service outage → Engineering + Head of CS
- Data loss or security issue → Engineering + Security team

---

### 2. Billing Issues

#### Level 1: Support Agent (AI)
- **Handles:** General billing questions, invoice requests
- **Escalates to:** Billing team for all specific account questions

#### Level 2: Billing Team
- **Handles:** Account-specific billing, payment issues, refunds
- **Escalates to:** CSM for disputes or relationship issues

#### Level 3: CSM + Head of CS
- **Handles:** Billing disputes, relationship-threatening issues
- **Response Time:** 24 hours for disputes

**Escalation Criteria:**
- Payment failure → Billing team (immediate)
- Billing dispute → CSM + Billing team
- Refund request → CSM + Head of CS (if >$500)

---

### 3. Account Management

#### Level 1: Support Agent (AI)
- **Handles:** Account access, user management questions
- **Escalates to:** CSM for account changes

#### Level 2: CSM
- **Handles:** Account modifications, plan changes, user management
- **Escalates to:** Head of CS for plan downgrades or cancellations

#### Level 3: Head of CS
- **Handles:** Cancellations, downgrades, strategic account issues
- **Response Time:** 4 hours for cancellations

**Escalation Criteria:**
- Cancellation request → Head of CS (immediate)
- Plan downgrade → Head of CS + CFO
- Account security issue → Security team + Head of CS

---

### 4. Feature Requests

#### Level 1: Support Agent (AI)
- **Handles:** Feature request collection, initial triage
- **Escalates to:** Product team via ticket system

#### Level 2: Product Team
- **Handles:** Feature evaluation, roadmap planning
- **Updates:** Customer via ticket system

**Escalation Criteria:**
- High-value customer request → Product team (priority)
- Multiple customers requesting → Product team (evaluation)
- Strategic feature → Product + Executive team

---

## Check-in Schedules

### Automated Check-ins

#### Health Score Monitoring
- **Frequency:** Daily
- **Trigger:** Health score drops below threshold
- **Action:** Automated email to CSM + customer notification
- **Escalation:** If health score < 40 → CSM call within 24 hours

#### Usage Monitoring
- **Frequency:** Weekly
- **Trigger:** Usage drops >50% week-over-week
- **Action:** Automated check-in email
- **Escalation:** If no usage for 7 days → CSM outreach

#### Milestone Tracking
- **Frequency:** On milestone completion
- **Trigger:** Customer completes onboarding milestone
- **Action:** Automated celebration email + next steps
- **Escalation:** If milestone overdue >14 days → CSM call

---

### Scheduled Check-ins

#### Week 1 Check-in (Day 7)
- **Type:** Call (30 minutes)
- **Attendees:** CSM + Customer
- **Agenda:**
  - Review first week usage
  - Answer questions
  - Address any issues
  - Set expectations for next week
- **Outcome:** Action items documented, next check-in scheduled

#### Month 1 Review (Day 30)
- **Type:** Call (45 minutes)
- **Attendees:** CSM + Customer (key stakeholders)
- **Agenda:**
  - Review first month metrics
  - Discuss feature adoption
  - Identify success stories
  - Address concerns
  - Plan for month 2
- **Outcome:** Success plan updated, expansion opportunities identified

#### Quarterly Review (Day 60, 90, etc.)
- **Type:** Call (60 minutes)
- **Attendees:** CSM + Customer (decision makers)
- **Agenda:**
  - Comprehensive health review
  - ROI discussion
  - Expansion opportunities
  - Renewal preparation
  - Strategic planning
- **Outcome:** Strategic plan, renewal timeline, expansion roadmap

---

### Proactive Outreach

#### Low Usage Alert
- **Trigger:** Usage <50% of expected for 7 days
- **Action:** CSM sends personalized email
- **Follow-up:** If no response in 3 days → CSM call
- **Goal:** Re-engage customer, identify blockers

#### Health Score Drop
- **Trigger:** Health score drops >10 points
- **Action:** CSM reviews account, sends check-in email
- **Follow-up:** If continues to drop → CSM call within 24 hours
- **Goal:** Identify and address issues early

#### Feature Not Adopted
- **Trigger:** Key feature not used after 30 days
- **Action:** CSM sends feature education email
- **Follow-up:** Offer training session or demo
- **Goal:** Increase feature adoption

#### Renewal Approaching
- **Trigger:** 60 days before renewal
- **Action:** CSM initiates renewal conversation
- **Follow-up:** 30 days before → Renewal proposal
- **Goal:** Secure renewal, identify expansion opportunities

---

## Support Flow Diagrams

### Standard Support Flow

```
Customer Issue
    ↓
Support Agent (AI) - First Response
    ↓
Can Resolve? → Yes → Resolve & Close
    ↓ No
Escalate to Appropriate Team
    ↓
Solutions Engineer / Billing / CSM
    ↓
Resolve & Follow-up
    ↓
Customer Satisfaction Check
```

### High-Priority Escalation Flow

```
Critical Issue Detected
    ↓
Immediate Escalation
    ↓
Head of CS Notified
    ↓
Appropriate Team Assigned
    ↓
Resolution within SLA
    ↓
Post-Incident Review
```

### Churn Risk Flow

```
Churn Risk Detected (Health Score < 40)
    ↓
CSM Alerted Immediately
    ↓
CSM Reviews Account (within 4 hours)
    ↓
Outreach Strategy Determined
    ↓
Personalized Intervention
    ↓
Monitor Health Score
    ↓
If Improves → Continue Monitoring
If Continues to Drop → Head of CS Escalation
```

---

## Communication Templates

### Check-in Email Templates

#### Week 1 Check-in
```
Subject: How's your first week with TrueVow going?

Hi {customer_name},

I wanted to check in and see how your first week with TrueVow has been. 

I see you've {usage_summary}. That's great!

Do you have any questions or need help with anything? I'm here to support you.

Let's schedule a quick call this week to review your progress and answer any questions. [Schedule Link]

Best regards,
{csm_name}
Customer Success Manager
```

#### Month 1 Review
```
Subject: Your first month with TrueVow - Let's review together

Hi {customer_name},

Congratulations on completing your first month with TrueVow!

I'd love to schedule a call to:
- Review your usage and success metrics
- Discuss what's working well
- Address any questions or concerns
- Plan for continued success

[Schedule Link]

Looking forward to connecting!

Best regards,
{csm_name}
Customer Success Manager
```

#### Low Usage Alert
```
Subject: We noticed you haven't been using TrueVow - How can we help?

Hi {customer_name},

I noticed you haven't been using TrueVow recently. I want to make sure you're getting the most value from the platform.

Is there anything preventing you from using TrueVow? I'm here to help with:
- Training or onboarding support
- Technical issues
- Feature questions
- Best practices

Let's schedule a quick call to discuss: [Schedule Link]

Best regards,
{csm_name}
Customer Success Manager
```

---

## Success Metrics

### Check-in Effectiveness

- **Response Rate:** % of customers who respond to check-ins
- **Engagement Rate:** % of customers who schedule/attend calls
- **Issue Resolution:** % of issues resolved during check-ins
- **Satisfaction Score:** CSAT score for check-in interactions

### Escalation Metrics

- **Escalation Rate:** % of tickets escalated
- **Time to Escalate:** Average time before escalation
- **Resolution Time:** Time to resolve after escalation
- **Customer Satisfaction:** CSAT for escalated tickets

### Retention Metrics

- **Churn Rate:** % of customers who churn
- **Retention Rate:** % of customers retained
- **Expansion Rate:** % of customers who expand
- **Health Score Trend:** Average health score over time

---

## Automation Rules

### Rule 1: Health Score Drop Alert
```
IF health_score < 40 AND health_score_drop > 10
THEN
  - Send alert to CSM
  - Create task for CSM to review account
  - Send check-in email to customer
  - Schedule follow-up in 24 hours
```

### Rule 2: Low Usage Alert
```
IF usage_drop > 50% AND days_since_last_use > 7
THEN
  - Send low usage alert email
  - Create task for CSM outreach
  - Add to re-engagement campaign
```

### Rule 3: Renewal Reminder
```
IF days_until_renewal = 60
THEN
  - Send renewal reminder email
  - Create renewal task for CSM
  - Schedule renewal call
```

### Rule 4: Milestone Celebration
```
IF milestone_completed = TRUE
THEN
  - Send celebration email
  - Update health score (positive impact)
  - Trigger next milestone communication
```

---

## Integration Points

### 1. Onboarding Sequences Service
- Triggers post-onboarding check-ins
- Tracks milestone completions
- Manages communication schedules

### 2. Health Scoring Service
- Monitors customer health
- Triggers alerts on health drops
- Provides health context for check-ins

### 3. Usage Analytics Service
- Tracks feature adoption
- Identifies usage patterns
- Triggers low usage alerts

### 4. Communication Templates Service
- Provides check-in email templates
- Manages communication scheduling
- Tracks communication history

### 5. Ticket System
- Creates tickets for escalations
- Tracks issue resolution
- Measures support effectiveness

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Define escalation paths
- [ ] Create check-in schedules
- [ ] Design communication templates
- [ ] Set up automation rules

### Phase 2: Integration
- [ ] Integrate with health scoring
- [ ] Integrate with usage analytics
- [ ] Integrate with communication templates
- [ ] Integrate with ticket system

### Phase 3: Automation
- [ ] Implement automated check-ins
- [ ] Implement health score alerts
- [ ] Implement usage monitoring
- [ ] Implement escalation workflows

### Phase 4: Testing
- [ ] Test escalation paths
- [ ] Test check-in schedules
- [ ] Test communication templates
- [ ] Test automation rules

### Phase 5: Launch
- [ ] Train CSM team
- [ ] Launch with pilot customers
- [ ] Monitor effectiveness
- [ ] Refine based on feedback

---

## Next Steps

1. ✅ **Flow Design:** Complete (this document)
2. ⏳ **Template Creation:** Create communication templates for check-ins
3. ⏳ **Automation Setup:** Implement automation rules
4. ⏳ **Integration:** Integrate with existing services
5. ⏳ **Testing:** Test with pilot customers
6. ⏳ **Launch:** Full rollout to all customers

---

## Related Documentation

- `docs/CS_SUPPORT_SERVICE_PRD.md` - Product requirements
- `docs/CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.md` - Implementation plan
- `docs/COMMUNICATION_TEMPLATES_IMPLEMENTATION_COMPLETE.md` - Communication templates
- `docs/CSM_DASHBOARD_IMPLEMENTATION_COMPLETE.md` - CSM dashboard

---

**Status:** 📋 **Design Complete**  
**Ready for:** Implementation and template creation

---

**Last Updated:** January 15, 2026
