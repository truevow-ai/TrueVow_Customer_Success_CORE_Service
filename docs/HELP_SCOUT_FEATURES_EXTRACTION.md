# Help Scout Features Extraction - Competitive Analysis

**Date:** January 15, 2026  
**Status:** Analysis Complete - Actionable Insights Identified

---

## Executive Summary

After analyzing Help Scout's interface screenshots, documentation, and feature descriptions, I've identified **15 critical features and enhancements** that would significantly improve competitive parity. These features are organized by priority and implementation complexity.

**Key Findings:**
- ✅ **Already Implemented:** Core inbox, tags, notes, AI triage, routing
- ⚠️ **Partially Implemented:** Workflows (basic), search (basic), analytics (basic)
- ❌ **Missing:** Collision detection, Beacon API, visual workflow builder, tag analytics, proactive messaging

---

## 🔴 **CRITICAL MISSING FEATURES** (High Priority)

### 1. **Collision Detection (Real-Time Collaboration Indicators)** ❌

**What Help Scout Has:**
- **Yellow indicator** in inbox list = another user has conversation open
- **Red indicator** = user is actively typing
- **Hover tooltip** shows which teammate is working on conversation
- **Profile pictures** in conversation header when multiple users viewing
- **Red border** around profile picture of user actively replying
- **Visible draft** when teammate is typing a reply

**Current State:**
- ❌ No real-time collaboration indicators
- ❌ No visual feedback when others are viewing/typing
- ⚠️ Polling exists but no collision detection UI

**Implementation Needed:**
```typescript
// New service: lib/services/collision-detection.ts
- Track active viewers per conversation
- Track typing status per conversation
- WebSocket/SSE for real-time updates
- UI indicators in ConversationDetail and InboxList
```

**Priority:** HIGH - Critical for team collaboration  
**Effort:** 3-4 days (WebSocket infrastructure + UI)

---

### 2. **Beacon API Integration (Docs + Live Chat)** ❌

**What Help Scout Has:**
- **`search` method:** Programmatically search Docs KB and display results in Beacon
- **`suggest` method:** Show curated article list based on user context
- **`article` method:** Open specific Docs article in Beacon (inline, sidebar, modal)
- **Context-aware suggestions:** Show articles based on current page/feature
- **Private Docs sites:** Access control for authenticated users only

**Current State:**
- ✅ Knowledge Base exists
- ✅ Customer Portal APIs exist
- ❌ No Beacon widget/component
- ❌ No Beacon JavaScript API
- ❌ No context-aware article suggestions

**Implementation Needed:**
```typescript
// New: components/customer-portal/Beacon.tsx
// New: lib/services/beacon-api.ts
- Beacon widget component (floating chat widget)
- search(query) - Search KB articles
- suggest(context) - Get contextual suggestions
- article(articleId, format) - Display article in widget
- Context detection (page URL, feature detection)
```

**Priority:** HIGH - Core customer-facing feature  
**Effort:** 5-6 days (Widget + API + Integration)

---

### 3. **Visual Workflow Builder** ❌

**What Help Scout Has:**
- **Visual "If... Then..." interface** for creating workflows
- **Condition builder:** Dropdowns for field selection, operators, values
- **Action builder:** Multiple actions in sequence (AND logic)
- **Automatic workflows:** Trigger on conditions (email received, tag added, etc.)
- **Manual workflows:** One-click execution from conversation
- **Complex conditions:** Multiple AND/OR logic

**Current State:**
- ✅ Basic routing rules exist (`ConversationRoutingService`)
- ✅ AI triage exists
- ❌ No visual workflow builder UI
- ❌ No manual workflow execution
- ❌ Workflows are code-based, not user-configurable

**Implementation Needed:**
```typescript
// New: app/(dashboard)/workflows/page.tsx (builder UI)
// New: lib/services/workflow-engine.ts (enhanced)
// New: database/migrations/028_workflows.sql
- Workflow definition table (conditions, actions)
- Visual builder component
- Workflow execution engine
- Manual workflow triggers
- Workflow testing/preview
```

**Priority:** HIGH - Major efficiency feature  
**Effort:** 7-8 days (Database + Engine + UI)

---

### 4. **Tag Analytics & Reporting** ⚠️

**What Help Scout Has:**
- **Tag usage table:** Shows count, percentage, delta (trend)
- **Tag filtering in reports:** Filter any report by tag
- **Tag trending:** See which tags are increasing/decreasing
- **Tag-based views:** Create custom views filtered by tags
- **Tag reporting:** "All Channels Report" includes tag analytics

**Current State:**
- ✅ Tags exist and work
- ✅ Basic analytics dashboard exists
- ❌ No tag-specific analytics
- ❌ No tag trending/delta calculations
- ❌ No tag-based report filtering

**Implementation Needed:**
```typescript
// Enhance: lib/services/analytics-service.ts
// New: app/api/v1/analytics/tags/route.ts
- Tag usage statistics
- Tag trending (delta calculations)
- Tag-based report filtering
- Tag analytics UI component
```

**Priority:** MEDIUM-HIGH - Important for insights  
**Effort:** 2-3 days (Analytics + UI)

---

### 5. **Advanced Search with Tag Operators** ⚠️

**What Help Scout Has:**
- **Tag search syntax:** `tag:shipping` to filter by tag
- **Visual tag pills:** Green highlighted pills for recognized operators
- **Multi-criteria search:** Combine tag: with other filters
- **Recent searches:** Quick access to recent search queries
- **Search result counts:** "11 Conversations, 0 Customers"

**Current State:**
- ✅ Basic search exists
- ✅ Tag filtering exists (but not with `tag:` syntax)
- ❌ No search operator syntax
- ❌ No visual search query builder
- ❌ No recent searches

**Implementation Needed:**
```typescript
// Enhance: lib/services/search-service.ts
// Enhance: components/inbox/SearchBar.tsx
- Parse search operators (tag:, status:, assigned:, etc.)
- Visual query builder
- Recent searches storage
- Search syntax highlighting
```

**Priority:** MEDIUM - UX improvement  
**Effort:** 2-3 days (Parser + UI)

---

## 🟡 **IMPORTANT ENHANCEMENTS** (Medium Priority)

### 6. **Proactive Messages (In-App Notifications)** ⚠️

**What Help Scout Has:**
- **Targeted in-app messages:** Show messages based on user context
- **Use cases:** Onboarding, feature announcements, promotions, trial signups
- **Context-aware:** Messages appear where users need them
- **Team-specific:** Sales, CS, Marketing can create messages
- **Quick creation:** "Just a few minutes" to create and publish

**Current State:**
- ✅ Onboarding sequences exist (backend)
- ✅ Communication templates exist
- ❌ No in-app message delivery system
- ❌ No customer-facing message widget
- ❌ No proactive message management UI

**Implementation Needed:**
```typescript
// New: lib/services/proactive-messaging.ts
// New: components/customer-portal/ProactiveMessage.tsx
// New: app/(dashboard)/messages/page.tsx
- Message targeting rules
- In-app message delivery
- Message scheduling
- Message analytics
```

**Priority:** MEDIUM - Customer engagement  
**Effort:** 4-5 days (Service + Widget + Management UI)

---

### 7. **Custom Report Views** ⚠️

**What Help Scout Has:**
- **"Create a new report view"** dialog
- **Condition builder:** "Tag is shipping", "Status is Active"
- **Combinable conditions:** "+ AND" button for multiple filters
- **Saved views:** Save custom filtered views
- **View dropdown:** Quick access to saved views

**Current State:**
- ✅ Analytics dashboard exists
- ✅ Basic filtering exists
- ❌ No custom view builder
- ❌ No saved views
- ❌ No view management

**Implementation Needed:**
```typescript
// New: lib/services/report-views.ts
// Enhance: app/(dashboard)/analytics/page.tsx
- Custom view definition
- View builder UI
- Saved views storage
- View sharing
```

**Priority:** MEDIUM - Analytics flexibility  
**Effort:** 3-4 days (Service + UI)

---

### 8. **Macros (One-Click Automation)** ❌

**What Help Scout Has:**
- **One-click actions:** Predefined set of actions executed together
- **Example:** Assign + Tag + Reply + Close (all in one click)
- **Macro library:** Team can create and share macros
- **Macro button:** Visible in conversation toolbar
- **Manual workflow execution:** Similar concept

**Current State:**
- ✅ Individual actions exist (assign, tag, reply, close)
- ❌ No macro system
- ❌ No one-click multi-action execution
- ❌ No macro library

**Implementation Needed:**
```typescript
// New: lib/services/macros-service.ts
// New: database/migrations/029_macros.sql
// Enhance: components/inbox/ConversationDetail.tsx
- Macro definition (actions array)
- Macro execution engine
- Macro library UI
- Macro button in conversation toolbar
```

**Priority:** MEDIUM - Efficiency feature  
**Effort:** 3-4 days (Service + UI)

---

### 9. **AI Answers Integration with Docs** ⚠️

**What Help Scout Has:**
- **AI Answers + Docs:** AI uses Docs content to answer questions
- **Instant answers:** No searching, no waiting
- **24/7 support:** Answers available anytime
- **Context-aware:** Shows right Docs articles at right time
- **Onboarding help:** Guides new users with relevant articles

**Current State:**
- ✅ Knowledge Base exists
- ✅ Hybrid AI Agent exists (Tier 1 FAQ + Tier 2 LLM)
- ⚠️ KB integration exists but could be enhanced
- ❌ No dedicated "AI Answers" feature in customer portal
- ❌ No Beacon integration with AI Answers

**Implementation Needed:**
```typescript
// Enhance: lib/ai/hybrid-support-agent.ts
// Enhance: components/customer-portal/Beacon.tsx
- Enhanced KB search in AI agent
- AI Answers widget in Beacon
- Instant answer display
- Article recommendations
```

**Priority:** MEDIUM - Self-service enhancement  
**Effort:** 2-3 days (Enhancement)

---

### 10. **Private Docs Collections** ❌

**What Help Scout Has:**
- **Private collections:** Internal documentation for team only
- **Access control:** Only authenticated/logged-in users can see
- **Beacon integration:** Private Docs accessible via Beacon for authenticated users
- **Use cases:** Internal processes, sensitive information, team guides

**Current State:**
- ✅ Knowledge Base exists
- ✅ Article visibility controls exist (published/draft)
- ❌ No private collections concept
- ❌ No access control based on authentication
- ❌ No team-only documentation

**Implementation Needed:**
```typescript
// Enhance: database/migrations/030_private_collections.sql
// Enhance: lib/repositories/kb.ts
// Enhance: app/api/v1/kb/articles/route.ts
- Collection visibility (public/private)
- Access control checks
- Private collection UI
- Beacon access control
```

**Priority:** MEDIUM - Security feature  
**Effort:** 2-3 days (Database + Access Control)

---

## 🟢 **NICE TO HAVE** (Lower Priority)

### 11. **Mobile SDK for Beacon** ❌

**Priority:** LOW  
**Effort:** 5-7 days (iOS + Android SDKs)

### 12. **Light Users Role** ❌

**Priority:** MEDIUM  
**Effort:** 2-3 days (Role system enhancement)

### 13. **Conversation Forwarding Outside System** ⚠️

**Priority:** LOW  
**Effort:** 1-2 days (Email forwarding)

### 14. **Saved Replies Templates for Notes** ⚠️

**Priority:** LOW  
**Effort:** 1-2 days (Template system enhancement)

### 15. **Multi-Inbox Management** ⚠️

**Priority:** MEDIUM  
**Effort:** 3-4 days (Inbox management UI)

---

## Implementation Priority Matrix

### Phase 1: Critical Collaboration (Week 1-2)
1. ✅ Collision Detection (3-4 days)
2. ✅ Beacon API Integration (5-6 days)

### Phase 2: Automation & Efficiency (Week 3-4)
3. ✅ Visual Workflow Builder (7-8 days)
4. ✅ Macros System (3-4 days)

### Phase 3: Analytics & Insights (Week 5)
5. ✅ Tag Analytics (2-3 days)
6. ✅ Custom Report Views (3-4 days)
7. ✅ Advanced Search Operators (2-3 days)

### Phase 4: Customer Experience (Week 6-7)
8. ✅ Proactive Messages (4-5 days)
9. ✅ AI Answers Enhancement (2-3 days)
10. ✅ Private Docs Collections (2-3 days)

---

## Key Insights from Images

### Image 1: Inbox List View
- **Tags are prominent:** Color-coded, multiple tags per conversation
- **@Mentions visible:** "@josie", "@ben" shown in conversation previews
- **AI Drafts tag:** "ai-drafts" tag indicates AI involvement
- **Channel icons:** Facebook Messenger icon visible
- **Time indicators:** "5 hours" badges for recency

### Image 2: Beacon + Docs Categories
- **Organized structure:** 6 main categories with article counts
- **Clear descriptions:** Each category explains its purpose
- **Icon-based navigation:** Visual icons for quick recognition

### Image 3: Search Interface
- **Tag operator syntax:** `tag:shipping` with green highlight
- **Result categorization:** "11 Conversations, 0 Customers"
- **Recent searches:** "Recent" tab for quick access

### Image 4: Report View Builder
- **Visual condition builder:** Dropdowns for field, operator, value
- **Combinable conditions:** "+ AND" for multiple filters
- **Save functionality:** Prominent save button

### Image 5: Conversation Detail
- **Workflow indicator:** "VIP Tags was run" shows automation execution
- **Lightning bolt icon:** Visual indicator for automations
- **Customer properties:** Custom fields (Billing Profile, Customer Since, etc.)
- **Tags visible:** "vip x" tag with remove option

### Image 6: Tag Analytics Table
- **Usage metrics:** Count, percentage, delta
- **Trend indicators:** Green (up), red (down)
- **"Show all" link:** Pagination for many tags

### Image 7: Workflow Configuration
- **If/Then structure:** Clear condition → action flow
- **Multiple actions:** AND logic between actions
- **Edit buttons:** Easy modification

### Image 8: Reports Dashboard
- **Channel filtering:** "All", "Email", "Chat", "Phone" tabs
- **Key metrics:** "Total Conversations: 28" with trend
- **Views dropdown:** Custom view management

---

## Recommendations

### Immediate Actions (This Week)
1. **Implement Collision Detection** - Critical for team collaboration
2. **Start Beacon API** - Core customer-facing feature

### Next Sprint (Week 2-3)
3. **Visual Workflow Builder** - Major efficiency gain
4. **Tag Analytics** - Important for insights

### Future Enhancements
5. **Proactive Messages** - Customer engagement
6. **Macros** - Efficiency feature
7. **Custom Report Views** - Analytics flexibility

---

**Status:** Analysis Complete - Ready for Implementation Planning  
**Last Updated:** January 15, 2026
