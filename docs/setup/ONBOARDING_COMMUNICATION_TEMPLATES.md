# Onboarding Communication Templates

**Date:** January 15, 2026  
**Status:** ✅ Complete Design  
**Templates:** Email, SMS, In-App messages for all onboarding stages

---

## Overview

This document contains all communication templates for the three onboarding sequence templates:

1. **Law Firm Pre-Onboarding Preparation** (`law_firm_pre_onboarding`)
2. **Law Firm Onboarding Call** (`law_firm_onboarding_call`)
3. **Law Firm Post-Onboarding 90-Day Support** (`law_firm_post_onboarding_90_days`)

---

## Template 1: Pre-Onboarding Preparation

### Email 1: Pre-Onboarding Preparation Email (Day 0)

**Trigger:** CSM receives lead/prospect assignment  
**Sent By:** CSM (automated, but can be customized)  
**Timing:** Immediately after lead assignment

**Subject:** Preparing for Your TrueVow Onboarding Call

**Body:**
```
Hi [Customer Name],

Welcome to TrueVow! We're excited to help you get started with INTAKE.

I'm [CSM Name], your Customer Success Manager. I'll be guiding you through the onboarding process to ensure you get the most out of TrueVow.

Before we schedule your 45-minute onboarding call, please take a few minutes to prepare the following information. This will help us make the most of our time together:

📋 **Pre-Onboarding Checklist:**

1. **Firm Information**
   - Firm legal name
   - Practice areas
   - State(s) of practice
   - Firm timezone

2. **Team Member Information**
   - List of attorneys and staff who will use TrueVow
   - Email addresses for each team member
   - Roles and responsibilities
   - Calendar types (Google/Outlook)

3. **Phone Number Setup**
   - Decide: New Twilio number(s) or forward existing office line
   - Area code preferences (if new number)

4. **Calendar & Email Integration**
   - Prepare calendar account access for OAuth
   - Identify firm-wide calendar (if applicable)

5. **Compliance & Data Settings**
   - Review zero-knowledge architecture information
   - Decide on optional 7-day transcript access

📝 **Complete Checklist:** [Link to Pre-Onboarding Checklist]

Once you've completed the checklist, you can book your 45-minute onboarding call here:
📅 [Calendly Booking Link - Unlocked when checklist complete]

**What Happens Next:**
1. Complete the pre-onboarding checklist
2. Book your onboarding call (link unlocks when checklist is complete)
3. During the call, I'll help you set up your TrueVow profile
4. After the call, our team will configure your account
5. You'll receive a go-live notification when ready

**Questions?**
If you have any questions while preparing, please:
- Reply to this email
- Create a support ticket: [Support Portal Link]
- Call us: [Support Phone Number]

I look forward to helping you get started with TrueVow!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
[CSM Email] | [CSM Phone]
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[CSM Name]` - Assigned CSM's name
- `[CSM Email]` - CSM's email
- `[CSM Phone]` - CSM's phone
- `[Link to Pre-Onboarding Checklist]` - Link to checklist in customer portal
- `[Calendly Booking Link]` - Calendar booking link (unlocked when checklist complete)
- `[Support Portal Link]` - Link to support portal
- `[Support Phone Number]` - Support phone number

---

### SMS 1: Checklist Reminder (Day 2)

**Trigger:** Checklist not complete after 2 days  
**Sent By:** Automated system  
**Timing:** Day 2 after pre-onboarding email sent

**Message:**
```
Hi [Customer Name], this is [CSM Name] from TrueVow. Just checking in - have you had a chance to review the pre-onboarding checklist? Completing it will unlock your onboarding call booking. Questions? Reply here or email [CSM Email]. [Link to Checklist]
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[CSM Name]` - Assigned CSM's name
- `[CSM Email]` - CSM's email
- `[Link to Checklist]` - Link to checklist

---

### Email 2: Checklist Completion Confirmation (When Customer Books Call)

**Trigger:** Customer completes minimum required checklist items and books call  
**Sent By:** Automated system  
**Timing:** Immediately after booking confirmation

**Subject:** Onboarding Call Confirmed - [Date/Time]

**Body:**
```
Hi [Customer Name],

Great! I've received your onboarding call booking for:

📅 **Date:** [Call Date]
🕐 **Time:** [Call Time] ([Timezone])
⏱️ **Duration:** 45 minutes
🔗 **Meeting Link:** [Zoom/Meeting Link]

**What to Prepare:**
- Have your pre-onboarding checklist available
- Have calendar/email accounts ready for OAuth connection
- Have any questions ready

**What We'll Cover:**
1. Firm & Team Profile Setup
2. Phone Number Configuration
3. Calendar & Email Integration
4. Compliance & Data Settings
5. Review & Submit

**Before the Call:**
- Review your checklist one more time
- Make sure you have access to your calendar/email accounts
- Prepare any questions you have

I'm looking forward to helping you get started with TrueVow!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[Call Date]` - Scheduled call date
- `[Call Time]` - Scheduled call time
- `[Timezone]` - Customer's timezone
- `[Zoom/Meeting Link]` - Meeting link
- `[CSM Name]` - Assigned CSM's name

---

## Template 2: Onboarding Call

### Email 1: Onboarding Call Confirmation (After Booking)

**Note:** This is the same as "Email 2" from Pre-Onboarding template above. Reused here for consistency.

---

### Email 2: Pre-Call Reminder (1 Hour Before)

**Trigger:** 1 hour before scheduled onboarding call  
**Sent By:** Automated system  
**Timing:** 1 hour before call

**Subject:** Reminder: Your TrueVow Onboarding Call in 1 Hour

**Body:**
```
Hi [Customer Name],

Just a friendly reminder that your TrueVow onboarding call is in 1 hour:

📅 **Date:** [Call Date]
🕐 **Time:** [Call Time] ([Timezone])
🔗 **Meeting Link:** [Zoom/Meeting Link]

**Quick Checklist:**
- ✅ Pre-onboarding checklist completed
- ✅ Calendar/email accounts ready for OAuth
- ✅ Questions prepared

**What to Expect:**
- 45-minute guided setup session
- I'll help you fill in your profile information
- We'll configure your phone numbers and calendar integrations
- We'll review compliance settings
- You'll have time to ask questions

See you soon!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[Call Date]` - Scheduled call date
- `[Call Time]` - Scheduled call time
- `[Timezone]` - Customer's timezone
- `[Zoom/Meeting Link]` - Meeting link
- `[CSM Name]` - Assigned CSM's name

---

### Email 3: Post-Call Summary (After Call)

**Trigger:** CSM marks onboarding call complete  
**Sent By:** Automated system (triggered by CSM action)  
**Timing:** Immediately after call completion

**Subject:** Onboarding Call Complete - Next Steps

**Body:**
```
Hi [Customer Name],

Thank you for taking the time to complete your TrueVow onboarding call today! It was great working with you.

**What We Accomplished:**
✅ Firm & Team Profile Setup
✅ Phone Number Configuration
✅ Calendar & Email Integration
✅ Compliance & Data Settings
✅ Profile Submitted for Configuration

**What Happens Next:**
1. Our internal team will configure your account based on the information we collected
2. This typically takes 1-2 business days
3. You'll receive a go-live notification when your account is ready
4. You can then start testing TrueVow INTAKE

**Timeline:**
- **Account Configuration:** 1-2 business days
- **Go-Live Notification:** You'll receive an email when ready
- **Testing Period:** You can test INTAKE as soon as you receive the notification

**Support During Configuration:**
If you have any questions or need to make changes, please:
- Reply to this email
- Create a support ticket: [Support Portal Link]
- Call us: [Support Phone Number]

**Next Steps:**
- Keep an eye on your email for the go-live notification
- Prepare any questions you have about using INTAKE
- Review the TrueVow documentation: [Documentation Link]

I'll be here to help you throughout your first 90 days with TrueVow. Don't hesitate to reach out if you need anything!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
[CSM Email] | [CSM Phone]
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[CSM Name]` - Assigned CSM's name
- `[CSM Email]` - CSM's email
- `[CSM Phone]` - CSM's phone
- `[Support Portal Link]` - Link to support portal
- `[Support Phone Number]` - Support phone number
- `[Documentation Link]` - Link to TrueVow documentation

---

### Email 4: Go-Live Notification (When Account Ready)

**Trigger:** Internal team marks account as `ready_for_success_call`  
**Sent By:** Automated system  
**Timing:** Immediately when account is ready

**Subject:** 🎉 Your TrueVow System is Ready!

**Body:**
```
Hi [Customer Name],

Great news! Your TrueVow account is now configured and ready to use.

🚀 **You can now start testing TrueVow INTAKE!**

**What You Can Do Now:**
✅ Test incoming calls with your new phone number
✅ Test calendar integration and scheduling
✅ Test intake workflows
✅ Explore TrueVow features

**Getting Started:**
1. **Login:** [Login Link]
2. **Test Phone Number:** [Phone Number]
3. **Documentation:** [Documentation Link]
4. **Support:** [Support Portal Link]

**First 90 Days Support:**
During your first 90 days, you have:
- ✅ Priority support from our CSM team
- ✅ 24/7 AI agent assistance
- ✅ Weekly check-ins (first 30 days)
- ✅ Proactive issue detection

**Need Help?**
- **AI Agent:** Available 24/7 in your dashboard
- **Support Tickets:** Create a ticket anytime
- **CSM:** [CSM Name] - [CSM Email] | [CSM Phone]

**What's Next:**
- Start testing INTAKE with test calls
- Set up your intake workflows
- Train your team on TrueVow features
- Monitor your first real calls

I'll be checking in with you regularly during your first 90 days. If you have any questions or run into any issues, don't hesitate to reach out!

Welcome to TrueVow! 🎉

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[Login Link]` - Link to TrueVow login
- `[Phone Number]` - Assigned phone number
- `[Documentation Link]` - Link to documentation
- `[Support Portal Link]` - Link to support portal
- `[CSM Name]` - Assigned CSM's name
- `[CSM Email]` - CSM's email
- `[CSM Phone]` - CSM's phone

---

## Template 3: Post-Onboarding 90-Day Support

### Email 1: Welcome to INTAKE (Go-Live)

**Note:** This is the same as "Email 4" from Onboarding Call template above. Reused here for consistency.

---

### Email 2: Week 1 Check-In (Day 7)

**Trigger:** 7 days after go-live  
**Sent By:** Automated system  
**Timing:** Day 7

**Subject:** Week 1 Check-In - How's TrueVow Working for You?

**Body:**
```
Hi [Customer Name],

It's been a week since you went live with TrueVow! I wanted to check in and see how things are going.

**Quick Questions:**
- How are you finding TrueVow so far?
- Have you had a chance to test INTAKE?
- Any questions or issues?

**Resources:**
- 📚 Documentation: [Documentation Link]
- 🎥 Video Tutorials: [Tutorials Link]
- 💬 AI Agent: Available 24/7 in your dashboard
- 🎫 Support: [Support Portal Link]

**I'm Here to Help:**
If you have any questions or need assistance, please don't hesitate to reach out:
- Email: [CSM Email]
- Phone: [CSM Phone]
- Support Ticket: [Support Portal Link]

I'll be checking in with you regularly during your first 90 days. Looking forward to hearing how TrueVow is helping your practice!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[Documentation Link]` - Link to documentation
- `[Tutorials Link]` - Link to video tutorials
- `[Support Portal Link]` - Link to support portal
- `[CSM Name]` - Assigned CSM's name
- `[CSM Email]` - CSM's email
- `[CSM Phone]` - CSM's phone

---

### Email 3: Week 2 Check-In (Day 14)

**Trigger:** 14 days after go-live  
**Sent By:** Automated system  
**Timing:** Day 14

**Subject:** Week 2 Check-In - TrueVow Progress Update

**Body:**
```
Hi [Customer Name],

We're two weeks in! I hope TrueVow is starting to become a natural part of your workflow.

**How Are Things Going?**
- Are you seeing value from TrueVow?
- Any features you'd like to explore more?
- Any challenges we can help with?

**Pro Tips:**
- 💡 Use the AI agent for quick questions (available 24/7)
- 💡 Review your intake analytics in the dashboard
- 💡 Customize your intake workflows to match your process
- 💡 Set up automated follow-ups for leads

**Support:**
Remember, I'm here to help:
- Email: [CSM Email]
- Phone: [CSM Phone]
- Support Ticket: [Support Portal Link]
- AI Agent: Available 24/7 in your dashboard

**Next Check-In:**
I'll be checking in with you again at the end of Month 1. In the meantime, don't hesitate to reach out if you need anything!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[CSM Name]` - Assigned CSM's name
- `[CSM Email]` - CSM's email
- `[CSM Phone]` - CSM's phone
- `[Support Portal Link]` - Link to support portal

---

### Email 4: Month 1 Summary (Day 30)

**Trigger:** 30 days after go-live  
**Sent By:** Automated system  
**Timing:** Day 30

**Subject:** Month 1 Summary - Your TrueVow Journey

**Body:**
```
Hi [Customer Name],

Congratulations on completing your first month with TrueVow! 🎉

**Your Month 1 Stats:**
- 📞 Total Calls: [Call Count]
- 📋 Intakes Completed: [Intake Count]
- ⏱️ Average Response Time: [Response Time]
- 📈 Usage Trend: [Trend Description]

**What's Working Well:**
Based on your usage, here's what we're seeing:
- ✅ [Positive Metric 1]
- ✅ [Positive Metric 2]
- ✅ [Positive Metric 3]

**Opportunities:**
- 💡 [Suggestion 1]
- 💡 [Suggestion 2]
- 💡 [Suggestion 3]

**Support Summary:**
- 🎫 Support Tickets: [Ticket Count]
- 🤖 AI Agent Resolutions: [AI Resolution Count]
- 👤 CSM Escalations: [Escalation Count]

**Next 30 Days:**
- We'll continue to support you with bi-weekly check-ins
- AI agent remains available 24/7
- CSM team available for complex issues

**Questions or Feedback?**
I'd love to hear about your experience so far:
- Email: [CSM Email]
- Phone: [CSM Phone]
- Support Ticket: [Support Portal Link]

Thank you for being a TrueVow customer. I'm excited to see your continued success!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[Call Count]` - Total calls in month 1
- `[Intake Count]` - Total intakes completed
- `[Response Time]` - Average response time
- `[Trend Description]` - Usage trend description
- `[Positive Metric 1-3]` - Positive metrics from analytics
- `[Suggestion 1-3]` - Suggestions based on usage
- `[Ticket Count]` - Support tickets in month 1
- `[AI Resolution Count]` - AI agent resolutions
- `[Escalation Count]` - CSM escalations
- `[CSM Name]` - Assigned CSM's name
- `[CSM Email]` - CSM's email
- `[CSM Phone]` - CSM's phone
- `[Support Portal Link]` - Link to support portal

---

### Email 5: Month 2 Check-In (Day 60)

**Trigger:** 60 days after go-live  
**Sent By:** Automated system  
**Timing:** Day 60

**Subject:** Month 2 Check-In - How Can We Help?

**Body:**
```
Hi [Customer Name],

You're two months into your TrueVow journey! I hope you're seeing great results.

**How's Everything Going?**
- Are you happy with TrueVow?
- Any features you'd like to explore?
- Any challenges we can help with?

**Support:**
- 🤖 AI Agent: Available 24/7 for quick questions
- 👤 CSM Team: Available for complex issues
- 🎫 Support Tickets: [Support Portal Link]

**Resources:**
- 📚 Documentation: [Documentation Link]
- 🎥 Video Tutorials: [Tutorials Link]
- 💡 Best Practices: [Best Practices Link]

**Next Check-In:**
I'll check in with you again at the end of Month 3. In the meantime, don't hesitate to reach out!

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[Support Portal Link]` - Link to support portal
- `[Documentation Link]` - Link to documentation
- `[Tutorials Link]` - Link to video tutorials
- `[Best Practices Link]` - Link to best practices
- `[CSM Name]` - Assigned CSM's name

---

### Email 6: Month 3 Check-In (Day 90)

**Trigger:** 90 days after go-live  
**Sent By:** Automated system  
**Timing:** Day 90

**Subject:** Month 3 Check-In - Transitioning to Standard Support

**Body:**
```
Hi [Customer Name],

Congratulations on completing your first 90 days with TrueVow! 🎉

**Your 90-Day Journey:**
- 📞 Total Calls: [Total Call Count]
- 📋 Intakes Completed: [Total Intake Count]
- ✅ Support Tickets Resolved: [Total Ticket Count]
- 📈 Usage Growth: [Growth Description]

**What's Next:**
You're now transitioning from intensive onboarding support to our standard support model:
- 🤖 AI Agent: Primary support (available 24/7)
- 👤 CSM Team: Available for critical issues
- 📅 Monthly Check-Ins: Instead of weekly/bi-weekly
- 🎫 Support Tickets: Always available

**Thank You:**
Thank you for being a TrueVow customer. I've enjoyed working with you during your first 90 days, and I'm excited to see your continued success!

**Support:**
- AI Agent: Available 24/7 in your dashboard
- Support Tickets: [Support Portal Link]
- CSM Team: Available for critical issues

**Feedback:**
I'd love to hear about your experience:
- Email: [CSM Email]
- Phone: [CSM Phone]
- Support Ticket: [Support Portal Link]

Best regards,
[CSM Name]
Customer Success Manager
TrueVow
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[Total Call Count]` - Total calls in 90 days
- `[Total Intake Count]` - Total intakes in 90 days
- `[Total Ticket Count]` - Total support tickets
- `[Growth Description]` - Usage growth description
- `[Support Portal Link]` - Link to support portal
- `[CSM Name]` - Assigned CSM's name
- `[CSM Email]` - CSM's email
- `[CSM Phone]` - CSM's phone

---

### SMS: Critical Issue Notifications

**Trigger:** Critical support ticket created or escalated  
**Sent By:** Automated system  
**Timing:** Immediately when critical issue detected

**Message:**
```
Hi [Customer Name], we've received your support ticket #[Ticket ID] and our team is working on it. You can track it here: [Ticket Link]. For urgent issues, call [Support Phone].
```

**Variables:**
- `[Customer Name]` - Customer's name
- `[Ticket ID]` - Support ticket ID
- `[Ticket Link]` - Link to support ticket
- `[Support Phone]` - Support phone number

---

## In-App Messages

### AI Agent Welcome Message (Go-Live)

**Trigger:** Customer first accesses dashboard after go-live  
**Display:** In-app chat interface

**Message:**
```
👋 Welcome to TrueVow! I'm your AI assistant, here to help 24/7.

I can help you with:
- Setting up intake workflows
- Understanding TrueVow features
- Troubleshooting issues
- Best practices

What would you like to know?
```

---

### AI Agent Proactive Tips (Days 1-30)

**Trigger:** Based on usage patterns and milestones  
**Display:** In-app chat interface

**Examples:**
- "💡 Tip: You can customize your intake questions in Settings > Intake Workflows"
- "💡 Tip: Set up automated follow-ups to never miss a lead"
- "💡 Tip: Review your intake analytics to see what's working best"

---

## Template Variables Reference

### Common Variables
- `[Customer Name]` - Customer's full name
- `[CSM Name]` - Assigned CSM's name
- `[CSM Email]` - CSM's email address
- `[CSM Phone]` - CSM's phone number
- `[Support Portal Link]` - Link to support portal
- `[Support Phone Number]` - Support phone number
- `[Documentation Link]` - Link to TrueVow documentation

### Dynamic Variables (Populated from System)
- `[Call Date]` - Scheduled call date
- `[Call Time]` - Scheduled call time
- `[Timezone]` - Customer's timezone
- `[Zoom/Meeting Link]` - Meeting link
- `[Login Link]` - Link to TrueVow login
- `[Phone Number]` - Assigned phone number
- `[Call Count]` - Total calls
- `[Intake Count]` - Total intakes
- `[Ticket Count]` - Support tickets
- `[Ticket ID]` - Support ticket ID
- `[Ticket Link]` - Link to support ticket

---

## Implementation Notes

### Database Storage
- Templates stored in `cs_communication_templates` table
- Variables replaced at send time
- Templates linked to onboarding sequences via `milestone_key` or `sequence_id`

### Sending Logic
- Email: Via Resend/SendGrid integration
- SMS: Via Twilio integration
- In-App: Via AI agent service

### Timing
- Automated triggers based on milestones and dates
- Manual triggers by CSM
- Customer actions (e.g., booking call)

---

**Status:** ✅ Complete  
**Ready for:** Implementation in communication service and database
