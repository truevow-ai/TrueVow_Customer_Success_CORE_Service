# Pre-Onboarding Checklist for Law Firm Customers

**Date:** January 15, 2026  
**Status:** ✅ Complete Design  
**Template:** `law_firm_pre_onboarding`

---

## Overview

This checklist helps law firm customers prepare everything needed for a successful 45-minute onboarding call. Completing this checklist ensures the onboarding call is efficient and productive, allowing the CSM to help configure the account quickly.

**JTBD:** "Help me prepare everything needed for my onboarding call so I can get started quickly."

---

## Checklist Items

### ✅ Section 1: Firm Information

**Purpose:** Basic firm details needed for account setup

- [ ] **Firm Legal Name**
  - Full legal name as registered
  - Any DBA (Doing Business As) names
  
- [ ] **Primary Practice Areas**
  - List all practice areas (e.g., Personal Injury, Family Law, Criminal Defense)
  - Primary focus area
  - Any specializations
  
- [ ] **State(s) of Practice**
  - Primary state(s) where firm practices
  - Bar admission states for attorneys
  
- [ ] **Firm Timezone**
  - Primary timezone for business hours
  - Any multi-timezone considerations
  
- [ ] **Firm Address** (Optional)
  - Mailing address
  - Physical office location(s)

---

### ✅ Section 2: Team Member Information

**Purpose:** Identify all team members who will use TrueVow INTAKE

**For Each Attorney:**
- [ ] **Full Name**
- [ ] **Email Address** (for account access)
- [ ] **Role/Title** (e.g., Partner, Associate, Of Counsel)
- [ ] **Practice Areas/Specializations**
- [ ] **Bar Admission State(s)**
- [ ] **Calendar Type** (Google Calendar or Outlook/Microsoft 365)
- [ ] **Phone Number** (if they want individual number)

**For Each Staff Member:**
- [ ] **Full Name**
- [ ] **Email Address** (for account access)
- [ ] **Role/Title** (e.g., Paralegal, Legal Assistant, Receptionist)
- [ ] **Primary Responsibilities** (e.g., Intake, Scheduling, Client Communication)
- [ ] **Calendar Type** (Google Calendar or Outlook/Microsoft 365)
- [ ] **Phone Number** (if they want individual number)

**Team Structure:**
- [ ] **Total Number of Attorneys:** _____
- [ ] **Total Number of Staff:** _____
- [ ] **Primary Contact Person:** _____ (Name, Email, Phone)
- [ ] **Decision Maker:** _____ (Name, Email, Phone)

---

### ✅ Section 3: Phone Number Setup

**Purpose:** Determine phone number configuration for INTAKE

**Option A: New Twilio Number(s)**
- [ ] **Number of Phone Numbers Needed:**
  - [ ] English number: _____
  - [ ] Spanish number: _____ (if serving Spanish-speaking clients)
  - [ ] Additional numbers: _____ (if multiple attorneys need separate numbers)

- [ ] **Area Code Preference:**
  - [ ] Local area code (specify): _____
  - [ ] Toll-free number
  - [ ] No preference

**Option B: Forward Existing Office Line**
- [ ] **Current Office Phone Number:** _____
- [ ] **Phone Provider:** _____
- [ ] **Can Forward Calls:** Yes / No / Need to Check
- [ ] **Preferred Setup:** Forward all calls / Forward during business hours only

**Decision:**
- [ ] **Selected Option:** New Number(s) / Forward Existing / Both
- [ ] **Reason for Choice:** _____ (optional, helps CSM understand needs)

---

### ✅ Section 4: Calendar & Email Integration

**Purpose:** Prepare for calendar and email OAuth connections

**For Each Team Member (from Section 2):**
- [ ] **Email Account Type:**
  - [ ] Google Workspace (Gmail/Google Calendar)
  - [ ] Microsoft 365 (Outlook/Exchange)
  - [ ] Other: _____

- [ ] **Calendar Access:**
  - [ ] Has access to calendar account
  - [ ] Can grant OAuth permissions
  - [ ] Knows account password (for OAuth flow)

- [ ] **Multiple Calendars:**
  - [ ] Uses multiple calendars (e.g., personal + work)
  - [ ] Wants to sync all calendars
  - [ ] Wants to sync specific calendars only

**Firm-Wide/Master Calendar (Law Firm's Own):**
- [ ] **Need Firm-Wide Calendar:** Yes / No
  - If Yes:
  - [ ] **Purpose:** Firm-wide availability / Shared scheduling / Other: _____
  - [ ] **Calendar Type:** Google / Outlook / Other: _____
  - [ ] **Who Manages:** _____ (Name, Email)

**Note:** TrueVow will also create its own internal master calendar automatically for appointment management. You don't need to configure this - it's handled by TrueVow's system. (See `docs/setup/CALENDAR_TYPES_CLARIFICATION.md` for details)

**Calendar Sync Preferences:**
- [ ] **Sync Frequency:** Real-time / Every 15 minutes / Every hour
- [ ] **Two-Way Sync:** Yes (bidirectional) / No (read-only)
- [ ] **Business Hours Only:** Yes / No
  - If Yes: Business hours: _____ to _____ (timezone: _____)

---

### ✅ Section 5: Compliance & Data Settings

**Purpose:** Understand and configure compliance settings

**Zero-Knowledge Architecture (Default):**
- [ ] **Understood:** TrueVow uses zero-knowledge architecture by default
  - Audio never leaves TrueVow servers
  - Transcripts stored securely
  - No third-party access to audio/transcripts

- [ ] **Questions About Zero-Knowledge:** _____ (optional)

**Optional 7-Day Transcript Access:**
- [ ] **Want 7-Day Transcript Access:** Yes / No / Need More Information
  - If Yes:
  - [ ] **Understood:** This is optional and requires explicit opt-in
  - [ ] **Use Case:** _____ (optional, helps CSM understand need)
  - [ ] **Consent Given:** Yes / No

**Data Retention:**
- [ ] **Understood:** TrueVow complies with data retention policies
- [ ] **Questions About Data Retention:** _____ (optional)

**Bar Compliance:**
- [ ] **State Bar Requirements:** _____ (if any specific requirements)
- [ ] **Compliance Questions:** _____ (optional)

---

### ✅ Section 6: Additional Information & Questions

**Purpose:** Capture any special requirements or questions

**Special Requirements:**
- [ ] **Integration Needs:**
  - [ ] CRM integration (specify): _____
  - [ ] Case management system (specify): _____
  - [ ] Other integrations: _____

- [ ] **Custom Workflows:**
  - [ ] Specific intake process: _____
  - [ ] Custom routing rules: _____
  - [ ] Special handling for certain call types: _____

- [ ] **Multi-Location Setup:**
  - [ ] Multiple office locations: Yes / No
  - [ ] If Yes: Number of locations: _____
  - [ ] If Yes: Locations: _____

**Questions for CSM:**
- [ ] **Questions About TrueVow INTAKE:** _____
- [ ] **Questions About Setup Process:** _____
- [ ] **Questions About Pricing/Billing:** _____
- [ ] **Other Questions:** _____

**Timeline Expectations:**
- [ ] **Desired Go-Live Date:** _____ (if applicable)
- [ ] **Urgency Level:** High / Medium / Low
- [ ] **Reason for Urgency:** _____ (optional)

---

## Checklist Completion

### Completion Criteria

**Minimum Required (Must Complete Before Booking Call):**
- ✅ Section 1: Firm Information (all items)
- ✅ Section 2: Team Member Information (at least 1 attorney)
- ✅ Section 3: Phone Number Setup (decision made)
- ✅ Section 4: Calendar & Email Integration (at least 1 team member's calendar info)

**Recommended (Complete for Best Experience):**
- ✅ Section 5: Compliance & Data Settings (reviewed and understood)
- ✅ Section 6: Additional Information & Questions (any special requirements noted)

### Completion Status

- [ ] **All Minimum Required Items Complete**
- [ ] **All Recommended Items Complete**
- [ ] **Ready to Book Onboarding Call**

**Completion Date:** _____  
**Completed By:** _____ (Name, Email)

---

## Next Steps After Checklist Completion

1. **Book Onboarding Call**
   - Calendar booking link will be unlocked
   - Select preferred date/time (45-minute slot)
   - CSM will receive booking notification

2. **Prepare for Call**
   - Have checklist available during call
   - Have calendar/email accounts ready for OAuth
   - Have any questions ready

3. **During Call**
   - CSM will guide you through profile setup
   - CSM will help configure account
   - CSM will answer any questions

4. **After Call**
   - Account will be configured internally
   - You'll receive go-live notification
   - You can start testing INTAKE

---

## Support & Questions

**If you need help completing the checklist:**

- **Email:** support@truevow.com
- **Support Ticket:** Create ticket in CS-Support portal
- **Phone:** [Support Phone Number]

**Common Questions:**

**Q: Do I need to complete everything before booking?**  
A: No, only the minimum required items. Recommended items can be discussed during the call.

**Q: What if I don't know some information?**  
A: That's okay! You can mark items as "Need to check" and we'll help you during the call.

**Q: Can I change information after onboarding?**  
A: Yes, you can update most information after onboarding through your account settings.

**Q: How long does the onboarding call take?**  
A: The call is scheduled for 45 minutes, but we'll work at your pace.

---

## Checklist Tracking

**System Tracking:**
- Checklist completion is tracked in CS-Support system
- Progress is visible to your assigned CSM
- Calendar booking unlocks automatically when minimum items complete

**CSM Visibility:**
- CSM can see which items are complete
- CSM can see which items need attention
- CSM will prepare for call based on your checklist status

---

## Template Integration

This checklist integrates with the `law_firm_pre_onboarding` onboarding sequence template:

- **Template Key:** `law_firm_pre_onboarding`
- **JTBD:** "Help me prepare everything needed for my onboarding call so I can get started quickly."
- **Duration:** 3 days (typical completion time)
- **Trigger:** After law firm applies for INTAKE service

**Database Storage:**
- Checklist items stored in `cs_onboarding_progress.checklist_items` (JSONB)
- Completion status tracked in `cs_onboarding_progress.checklist_completed`
- Progress visible in CSM dashboard

---

**Status:** ✅ Complete  
**Ready for:** Implementation in onboarding sequence stages and CSM dashboard
