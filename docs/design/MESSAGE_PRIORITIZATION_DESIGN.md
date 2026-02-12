# Message Prioritization & Mobile UX Design
**Based on Slack Mobile Redesign Case Study**

**Date:** January 24, 2026  
**Status:** Design Proposal

## 🎯 Core Problem Identified

**Problem Statement:** Users receive too many notifications for messages that are not important to their work, making them feel unproductive on mobile.

**Root Cause:** Lack of prioritization for notifications - users can't set criteria to prioritize important messages.

## ✅ What We Already Have

1. **@Mentions** - Implemented with notifications
2. **AI Triage** - Can classify and prioritize messages
3. **Unified Inbox** - Multi-context inbox (cs, sales, ops, etc.)
4. **Mobile-First Design** - Responsive with card view
5. **Advanced Search** - Filter by various criteria

## 🚀 Proposed Features

### 1. User Notification Prioritization Settings

**Location:** Settings → Notifications → Prioritization

**Features:**
- **My Keywords**: Get notified whenever someone mentions specific keywords
  - Example: "urgent", "escalation", "bug", customer name
  - Use case: CS agents want to know when urgent issues come in
- **My Contacts**: Prioritize messages from specific contacts/customers
  - VIP customers, key stakeholders, team members
  - Use case: Prioritize messages from high-value customers
- **My Channels**: Show every message in these channels (full notifications)
  - Critical channels like #urgent, #escalations
  - Use case: Don't miss anything in critical channels
- **Priority-Based Filtering**: Auto-prioritize based on ticket priority
  - Urgent/High priority tickets always notify
  - Low priority can be batched

**Implementation:**
- New table: `cs_user_notification_preferences`
- Settings UI in `/settings/notifications`
- Integration with notification service

### 2. "Reply Later" Feature

**Purpose:** Allow users to defer messages for later action, keeping the inbox clean.

**Features:**
- Button on conversation cards: "Reply Later"
- Messages marked as "Reply Later" are:
  - Hidden from main inbox (or shown in separate section)
  - Accessible via "Reply Later" filter/tab
  - Can be scheduled for reminder
- Integration with mentions: If you're mentioned, you can't "reply later" (must be urgent)

**Implementation:**
- Add `reply_later_at` timestamp to `cs_conversations` or `cs_tickets`
- Add filter to inbox API
- UI button in `InboxList` and `ConversationDetail`

### 3. Thread-Based Home View (Optional)

**Concept:** Show updates in a feed format similar to social media, making it easier to scan and reply.

**Features:**
- Home screen shows conversation updates in chronological order
- Each update shows:
  - Customer name/email
  - Channel icon
  - Last message preview
  - Unread count
  - Quick actions (Reply, Reply Later, Assign)
- Grouped by conversation thread
- Swipe gestures for quick actions

**Consideration:** This might be too different from current inbox design. Could be an alternative view option.

### 4. Customize Home Settings

**Location:** Settings → Customize Home

**Features:**
- **Home Display Options:**
  - Show full messages vs. previews only
  - Group by: Channel, Priority, Status, Assigned
  - Default sort: Newest, Priority, Unread
- **Refresh Settings:**
  - Auto-refresh interval
  - Clean up old messages (archive after X days)
- **Quick Filters:**
  - Show only unread
  - Show only assigned to me
  - Show only urgent/high priority

### 5. Bottom Navigation (Mobile)

**Pattern:** Bottom tab bar for mobile (similar to images provided)

**Tabs:**
- **Home**: Main inbox feed
- **Channels**: Channel-based view (if we add channels)
- **Mentions**: Dedicated mentions & reactions feed
- **You**: Profile, settings, preferences

**Benefits:**
- Easier thumb navigation on mobile
- Consistent with modern mobile app patterns
- Better discoverability of features

**Consideration:** This would require significant UI restructure. Could be Phase 2.

## 📋 Implementation Priority

### Phase 1: High Value, Low Effort (1-2 days)
1. ✅ **"Reply Later" Feature**
   - Simple timestamp field
   - Filter in inbox
   - Button in UI
   - High user value

2. ✅ **Notification Prioritization Settings**
   - Keywords, Contacts, Channels
   - Settings UI
   - Integration with notification service
   - High user value

### Phase 2: Medium Priority (2-3 days)
3. **Customize Home Settings**
   - Display options
   - Refresh settings
   - Quick filters

### Phase 3: Future Consideration
4. **Thread-Based Home View** (if user feedback requests it)
5. **Bottom Navigation** (if we restructure mobile UI)

## 🎨 UI/UX Patterns from Article

### From Images Provided:
1. **Mentions Feed**: Dedicated tab showing all mentions and reactions
2. **Customize Home**: Settings page with prioritization options
3. **Reply Later Button**: Prominent button for deferring messages
4. **Bottom Navigation**: Four-tab structure (Home, Channels, Mentions, You)
5. **Thread View**: Conversation updates in feed format

## 🔗 Integration Points

### With Existing Features:
- **AI Triage**: Use AI classification to auto-prioritize (urgent = always notify)
- **@Mentions**: Mentions always bypass "Reply Later" and prioritization filters
- **Unified Inbox**: Prioritization works per context (cs, sales, etc.)
- **Analytics**: Track which prioritization settings improve productivity

### Database Schema:
```sql
-- User Notification Preferences
CREATE TABLE cs_user_notification_preferences (
    preference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Clerk user ID
    tenant_id UUID NOT NULL,
    
    -- Prioritization
    keywords TEXT[], -- Keywords to notify on
    priority_contacts TEXT[], -- Customer emails/IDs to prioritize
    priority_channels TEXT[], -- Channels to show all messages
    priority_levels TEXT[] DEFAULT ARRAY['urgent', 'high'], -- Priority levels to always notify
    
    -- Display Preferences
    show_full_messages BOOLEAN DEFAULT FALSE,
    group_by VARCHAR(50) DEFAULT 'channel', -- channel, priority, status, assigned
    default_sort VARCHAR(50) DEFAULT 'newest', -- newest, priority, unread
    auto_refresh_interval INT DEFAULT 30, -- seconds
    
    -- Reply Later
    reply_later_reminder_enabled BOOLEAN DEFAULT TRUE,
    reply_later_reminder_hours INT DEFAULT 24,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reply Later Tracking
ALTER TABLE cs_conversations ADD COLUMN reply_later_at TIMESTAMPTZ;
ALTER TABLE cs_conversations ADD COLUMN reply_later_by UUID; -- User who marked it
CREATE INDEX idx_conversations_reply_later ON cs_conversations(reply_later_at) WHERE reply_later_at IS NOT NULL;
```

## 📝 Next Steps

1. **Review with user**: Confirm which features are most valuable
2. **Start with Phase 1**: Implement "Reply Later" and basic prioritization
3. **User testing**: Get feedback on prioritization settings UI
4. **Iterate**: Add more customization based on usage patterns

## 🎯 Success Metrics

- **Reduced notification fatigue**: Users report fewer irrelevant notifications
- **Increased productivity**: Users feel more productive on mobile
- **Better engagement**: Users respond to important messages faster
- **Lower churn**: Users don't switch to competitor products
