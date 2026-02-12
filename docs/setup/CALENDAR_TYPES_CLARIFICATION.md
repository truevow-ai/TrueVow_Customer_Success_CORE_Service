# Calendar Types Clarification

**Date:** January 15, 2026  
**Status:** ✅ Clarification Document

---

## Overview

There are **two distinct types of "master calendars"** in the TrueVow system:

1. **Firm-Wide/Master Calendar** (Law Firm's Own Calendar)
2. **TrueVow Internal Master Calendar** (TrueVow's System Calendar)

This document clarifies when each is used and how they differ.

---

## 1. Firm-Wide/Master Calendar (Law Firm's Own)

### What It Is
- The law firm's **own shared calendar** (e.g., Google Calendar, Outlook Calendar)
- Used by the firm for internal scheduling and availability
- Managed by the law firm, not TrueVow
- Synced to TrueVow via OAuth

### When It's Used
- **During Onboarding:** Customer connects their firm's shared calendar via OAuth
- **For Scheduling:** TrueVow reads availability from the firm's calendar to schedule appointments
- **For Availability:** TrueVow checks the firm's calendar to determine when attorneys/staff are available
- **For Conflict Detection:** TrueVow checks the firm's calendar to avoid double-booking

### Examples
- "Smith & Associates - Main Calendar" (Google Calendar)
- "Law Firm - Shared Schedule" (Outlook Calendar)
- "Office Availability Calendar" (Google Calendar)

### Configuration
- **Set up during onboarding** (Step 3: Calendar & Email Integration)
- **OAuth connection** to the firm's calendar provider
- **Optional:** Not all firms need this - only if they want TrueVow to check their calendar for availability

---

## 2. TrueVow Internal Master Calendar (TrueVow's System Calendar)

### What It Is
- TrueVow's **system-level calendar** for managing appointments and availability
- Created and managed by TrueVow platform
- Used internally by TrueVow's scheduling system
- **Not** the law firm's calendar - it's TrueVow's own calendar

### When It's Used
- **For Appointment Scheduling:** When TrueVow schedules appointments (e.g., intake calls, consultations)
- **For Availability Management:** TrueVow uses this to track when appointments are scheduled
- **For System Operations:** TrueVow uses this for internal scheduling logic
- **For Multi-Tenant Coordination:** TrueVow may use this to coordinate across multiple law firms (if applicable)

### Examples
- "TrueVow - Appointment Calendar" (TrueVow's system calendar)
- "TrueVow - Availability Calendar" (TrueVow's system calendar)
- "TrueVow - Master Schedule" (TrueVow's system calendar)

### Configuration
- **Created automatically** by TrueVow platform during account setup
- **Not configured by customer** - this is internal to TrueVow
- **May be referenced** in onboarding but customer doesn't interact with it directly

---

## Key Differences

| Aspect | Firm-Wide Calendar | TrueVow Internal Master Calendar |
|--------|-------------------|----------------------------------|
| **Owner** | Law Firm | TrueVow |
| **Purpose** | Firm's own scheduling | TrueVow's appointment management |
| **Setup** | Customer connects via OAuth | Created automatically by TrueVow |
| **Visibility** | Customer can see/edit | Internal to TrueVow system |
| **Used For** | Availability checking, conflict detection | Appointment scheduling, system operations |
| **Configuration** | During onboarding (Step 3) | Automatic during account setup |

---

## When Each Is Used in Onboarding

### Pre-Onboarding Checklist
- **Firm-Wide Calendar:** Customer prepares information about their shared calendar
- **TrueVow Internal Master Calendar:** Not mentioned (automatic, no customer action needed)

### Onboarding Call (Step 3: Calendar & Email Integration)
- **Firm-Wide Calendar:** CSM helps customer connect their firm's calendar via OAuth
- **TrueVow Internal Master Calendar:** Created automatically in background (no customer action)

### Post-Onboarding
- **Firm-Wide Calendar:** Used for availability checking and scheduling
- **TrueVow Internal Master Calendar:** Used by TrueVow system for appointment management

---

## Updated Checklist Language

### In Pre-Onboarding Checklist
**Section 4: Calendar & Email Integration**

**Firm-Wide/Master Calendar (Law Firm's Own):**
- [ ] **Need Firm-Wide Calendar:** Yes / No
  - If Yes:
  - [ ] **Purpose:** Firm-wide availability / Shared scheduling / Other: _____
  - [ ] **Calendar Type:** Google / Outlook / Other: _____
  - [ ] **Who Manages:** _____ (Name, Email)

**Note:** TrueVow will also create its own internal master calendar automatically for appointment management. You don't need to configure this - it's handled by TrueVow's system.

---

## Implementation Notes

### For CS-Support Service
- **Firm-Wide Calendar:** Tracked in onboarding checklist, configured during onboarding call
- **TrueVow Internal Master Calendar:** Created by Platform Service automatically, not tracked in CS-Support onboarding

### For Platform Service
- **Firm-Wide Calendar:** OAuth connection, sync status, availability checking
- **TrueVow Internal Master Calendar:** Automatic creation during tenant setup, used for appointment scheduling

### For Onboarding Sequences
- **Milestone:** `master_calendar_configured` refers to **Firm-Wide Calendar** configuration
- **TrueVow Internal Master Calendar:** Not a milestone (automatic, no customer action)

---

## Summary

**Firm-Wide Calendar (Customer's):**
- ✅ Customer connects during onboarding
- ✅ Used for availability checking
- ✅ Tracked in onboarding checklist
- ✅ Milestone: `master_calendar_configured`

**TrueVow Internal Master Calendar (TrueVow's):**
- ✅ Created automatically by Platform Service
- ✅ Used for appointment scheduling
- ✅ Not tracked in onboarding checklist
- ✅ No customer action required

---

**Status:** ✅ Clarification Complete  
**Next:** Update Pre-Onboarding Checklist with this distinction
