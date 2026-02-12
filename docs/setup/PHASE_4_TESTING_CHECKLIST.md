# Phase 4 - Inbox Module Testing Checklist

**Date:** January 11, 2026  
**Status:** Ready for Testing

## 🧪 Testing Instructions

### Prerequisites
1. ✅ Dev server running on port 3003 (`npm run dev`)
2. ✅ Database migrations applied (001-006)
3. ✅ Seed data loaded (`database/seed.sql`)
4. ✅ Clerk authentication configured
5. ✅ User logged in as team member

### Test Scenarios

#### 1. Inbox List Page (`/dashboard/inbox`)

**Test Cases:**
- [ ] Page loads without errors
- [ ] Conversations list displays correctly
- [ ] Channel icons show for each conversation (email, sms, call, etc.)
- [ ] Customer name/email displays correctly
- [ ] Subject line displays (or "No subject" if missing)
- [ ] Last message preview shows truncated message body
- [ ] Status badges display correctly (open, in_progress, etc.)
- [ ] Priority badges display correctly (low, medium, high, urgent)
- [ ] Unread count badge shows when > 0
- [ ] Last activity time displays correctly
- [ ] Assigned to shows team member name or "Unassigned"

**Filter Tests:**
- [ ] Channel filter works (email, sms, call, chat, facebook, form)
- [ ] Status filter works (open, in_progress, pending, resolved, closed)
- [ ] Assignment filter works (All, Unassigned, Assigned to Me)
- [ ] Clear filters button resets all filters

**Search Tests:**
- [ ] Search by customer email works
- [ ] Search by customer name works
- [ ] Search by subject works
- [ ] Search by message content works
- [ ] Search resets to page 1

**Pagination Tests:**
- [ ] Pagination controls appear when > 20 conversations
- [ ] Previous/Next buttons work
- [ ] Page numbers display correctly
- [ ] Clicking conversation row navigates to detail page

#### 2. Conversation Detail Page (`/dashboard/inbox/[id]`)

**Test Cases:**
- [ ] Page loads without errors
- [ ] Conversation header displays correctly
  - [ ] Channel icon shows
  - [ ] Subject displays
  - [ ] Customer name/email displays
  - [ ] Last activity time displays
  - [ ] Status badge displays
  - [ ] Priority badge displays
  - [ ] Tags display (if any)

**Message Thread Tests:**
- [ ] Messages display in chronological order
- [ ] Agent messages show with blue background
- [ ] Customer messages show with gray background
- [ ] System messages display correctly
- [ ] Internal notes show "Internal" badge
- [ ] Message timestamps display correctly
- [ ] Empty state shows "No messages yet" when no messages

**Reply Functionality:**
- [ ] Reply textarea accepts input
- [ ] Send button is disabled when textarea is empty
- [ ] Send button enables when text has content
- [ ] Reply sends successfully
- [ ] New message appears in thread after sending
- [ ] Textarea clears after successful send
- [ ] Error message shows if send fails

**Assignment Controls:**
- [ ] Assignment dropdown displays
- [ ] Can select team member from dropdown
- [ ] Assignment updates successfully
- [ ] UI reflects assignment change

**Status Controls:**
- [ ] Status dropdown displays
- [ ] Can change status (active, archived, closed)
- [ ] Status updates successfully
- [ ] UI reflects status change

**Placeholder Features:**
- [ ] Attach button displays (functionality not yet implemented)
- [ ] AI Suggest button displays (functionality not yet implemented)

#### 3. API Endpoints

**GET /api/v1/inbox**
- [ ] Returns 200 with conversations array
- [ ] Supports channel filter query param
- [ ] Supports status filter query param
- [ ] Supports assigned_to filter query param
- [ ] Supports search query param
- [ ] Returns pagination metadata
- [ ] Returns 403 if not authenticated
- [ ] Returns 403 if not team member

**GET /api/v1/inbox/[id]**
- [ ] Returns 200 with conversation, ticket, and messages
- [ ] Returns 404 if conversation not found
- [ ] Returns 403 if not authenticated
- [ ] Returns 403 if not team member

**PATCH /api/v1/inbox/[id]**
- [ ] Updates conversation status
- [ ] Updates assignment
- [ ] Updates tags
- [ ] Returns 200 with updated conversation
- [ ] Returns 403 if not authenticated
- [ ] Returns 403 if not team member

**POST /api/v1/inbox/[id]/reply**
- [ ] Creates new message
- [ ] Creates ticket if conversation has no ticket
- [ ] Links conversation to ticket
- [ ] Logs activity feed entry
- [ ] Returns 200 with new message
- [ ] Returns 400 if body is empty
- [ ] Returns 404 if conversation not found
- [ ] Returns 403 if not authenticated
- [ ] Returns 403 if not team member

## 🐛 Known Issues / Limitations

1. **Team Member Dropdown**: Assignment dropdown is empty - needs to fetch team members
2. **Assigned To Name**: Shows "null" - needs to fetch team member name from ID
3. **Tags**: Display only - add/edit functionality not yet implemented
4. **Notes**: Feature not yet implemented
5. **Attachments**: Placeholder only - functionality not yet implemented
6. **AI Suggestions**: Placeholder only - functionality not yet implemented
7. **Tenant Filtering**: Currently shows all conversations - may need tenant-based filtering

## ✅ Expected Behavior

### Inbox List
- Shows all conversations for the user's tenant (or all if tenant filtering not implemented)
- Displays most recent conversations first
- Shows unread count badge when > 0
- Filters and search work correctly
- Pagination works for large lists

### Conversation Detail
- Shows full conversation history
- Allows replying to conversations
- Allows assigning conversations
- Allows changing conversation status
- Updates in real-time after actions

## 📝 Test Results

**Tester:** _______________  
**Date:** _______________  
**Environment:** Development (localhost:3003)

### Results Summary
- Total Test Cases: ___
- Passed: ___
- Failed: ___
- Blocked: ___

### Issues Found
1. 
2. 
3. 

### Notes
_Add any additional observations or feedback here_
