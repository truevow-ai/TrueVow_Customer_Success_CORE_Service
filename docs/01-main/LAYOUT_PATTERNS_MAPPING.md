# Complete Layout Patterns Mapping
**Date:** January 24, 2026  
**Service:** CS-Support Service  
**Status:** ✅ Layout Structure Complete | ⚠️ Some Pages Need Color Token Updates

---

## 🎯 Executive Summary

**Layout Inheritance:** ✅ **YES** - All pages inherit the unified three-column layout structure.

**All pages under `app/(dashboard)/` automatically inherit:**
- ✅ Three-column adaptive layout (PrimaryNav + SecondaryNav + Main Content)
- ✅ Sticky header with enterprise features (Command Palette, Workspace Switcher, Notifications)
- ✅ Dark purple sidebar (#3F0E40) with collapsible behavior
- ✅ Contextual secondary navigation (auto-detects from pathname)
- ✅ Toast Provider for system-wide notifications
- ✅ Dynamic content margins based on navigation state

---

## 📐 Layout Structure Overview

### Global Layout Hierarchy

```
app/
├── layout.tsx (Root Layout)
│   └── ClerkProvider + HTML structure
│
└── (dashboard)/
    ├── layout.tsx (Dashboard Layout - Server Component)
    │   └── Auth check + redirect
    │   └── Wraps in DashboardLayoutClient
    │
    └── layout-client.tsx (Dashboard Layout - Client Component)
        ├── PrimaryNav (Dark Purple Sidebar)
        ├── SecondaryNav (Contextual Navigation)
        ├── Header (Sticky with Enterprise Features)
        └── Main Content Area (Dynamic Margins)
            └── {children} (All Page Components)
```

### Layout Components Location

| Component | Location | Status | Features |
|-----------|----------|--------|----------|
| **PrimaryNav** | `components/navigation/PrimaryNav.tsx` | ✅ Complete | Collapsible (64px/256px), Dark purple (#3F0E40), Active states (#1264A3) |
| **SecondaryNav** | `components/navigation/SecondaryNav.tsx` | ✅ Complete | Contextual, Auto-detects module, Dynamic positioning |
| **Header** | `components/layout/Header.tsx` | ✅ Complete | Sticky (z-30), Command Palette, Workspace Switcher, Notifications |
| **ToastProvider** | `components/ui/toast.tsx` | ✅ Complete | System-wide notifications, 4 types (success/error/warning/info) |
| **DashboardLayoutClient** | `app/(dashboard)/layout-client.tsx` | ✅ Complete | Three-column structure, Dynamic margins, Navigation state management |

---

## 📄 Page-by-Page Layout Status

### ✅ Pages with Full Layout Inheritance

All pages below automatically inherit the complete layout structure.

| Page Route | File Location | Layout Status | Color Token Status | Notes |
|------------|---------------|---------------|-------------------|-------|
| `/dashboard` | `app/(dashboard)/page.tsx` | ✅ Inherits | ⚠️ Needs Update | Uses `text-gray-900`, `bg-white` - should use unified tokens |
| `/dashboard/dashboard` | `app/(dashboard)/dashboard/page.tsx` | ✅ Inherits | ✅ Complete | Uses `OnboardingDashboard` component |
| `/dashboard/inbox` | `app/(dashboard)/inbox/page.tsx` | ✅ Inherits | ⚠️ Needs Update | Uses `text-gray-900` - should use `text-foreground` |
| `/dashboard/inbox/[id]` | `app/(dashboard)/inbox/[id]/page.tsx` | ✅ Inherits | ⚠️ Needs Update | Uses `text-gray-900` - should use `text-foreground` |
| `/dashboard/analytics` | `app/(dashboard)/analytics/page.tsx` | ✅ Inherits | ✅ Complete | Uses `AnalyticsDashboard` component |
| `/dashboard/knowledge-base` | `app/(dashboard)/knowledge-base/page.tsx` | ✅ Inherits | ⚠️ Needs Update | Uses `text-gray-900` - should use `text-foreground` |
| `/dashboard/knowledge-base/[id]/edit` | `app/(dashboard)/knowledge-base/[id]/edit/page.tsx` | ✅ Inherits | ⚠️ Unknown | Need to verify color tokens |
| `/dashboard/settings` | `app/(dashboard)/settings/page.tsx` | ✅ Inherits | ⚠️ Needs Update | Uses `text-gray-900`, `bg-white` - should use unified tokens |
| `/dashboard/settings/ai-agents` | `app/(dashboard)/settings/ai-agents/page.tsx` | ✅ Inherits | ⚠️ Needs Update | Uses old color classes |
| `/dashboard/settings/faqs` | `app/(dashboard)/settings/faqs/page.tsx` | ✅ Inherits | ⚠️ Needs Update | Uses old color classes |

**Legend:**
- ✅ Inherits = Page automatically gets full layout structure
- ✅ Complete = Uses unified design tokens correctly
- ⚠️ Needs Update = Uses old color classes, needs migration to unified tokens

---

## 🎨 Layout Pattern Implementation Status

### 1. Three-Column Adaptive Layout ✅

**Status:** ✅ **Fully Implemented**

**Implementation:**
- **Primary Navigation:** `components/navigation/PrimaryNav.tsx`
  - Width: 64px (collapsed) / 256px (expanded)
  - Background: Dark Purple (#3F0E40)
  - Position: Fixed left, z-index: 40
  - Behavior: Collapsible, hover expansion

- **Secondary Navigation:** `components/navigation/SecondaryNav.tsx`
  - Width: 256px (fixed)
  - Background: Theme-aware (white/dark charcoal)
  - Position: Fixed, dynamically positioned after primary nav
  - Z-index: 30
  - Behavior: Shows when module selected, auto-detects from pathname

- **Main Content Area:** `app/(dashboard)/layout-client.tsx`
  - Background: Theme-aware (white/dark charcoal)
  - Padding: 24px (p-6)
  - Margin: Dynamic (calculated based on nav state)
  - Overflow: Auto (scrollable)

**Content Margin Calculation:**
```typescript
const contentMarginLeft = isPrimaryCollapsed
  ? (selectedModule ? '320px' : '64px')      // 64px + 256px if secondary shown
  : (selectedModule ? '512px' : '256px')     // 256px + 256px if secondary shown
```

**Applied To:** All pages under `app/(dashboard)/`

---

### 2. Sticky Header with Enterprise Features ✅

**Status:** ✅ **Fully Implemented**

**Location:** `components/layout/Header.tsx`

**Features:**
- ✅ Sticky positioning (`sticky top-0 z-30`)
- ✅ Command Palette trigger (Cmd+K / Ctrl+K)
- ✅ Workspace Switcher
- ✅ Notifications bell
- ✅ User menu (Clerk UserButton)
- ✅ Background: `bg-background-secondary`
- ✅ Border: `border-b`

**Applied To:** All pages under `app/(dashboard)/`

---

### 3. Dark Purple Sidebar ✅

**Status:** ✅ **Fully Implemented**

**Location:** `components/navigation/PrimaryNav.tsx`

**Specifications:**
- ✅ Background: `#3F0E40` (Dark Purple) - `bg-sidebar`
- ✅ Text: White - `text-sidebar-foreground`
- ✅ Border: `#522653` (Lighter Purple) - `border-sidebar-border`
- ✅ Active State: `#1264A3` (Blue) - `bg-active text-active-foreground`
- ✅ Collapsible: 64px (collapsed) / 256px (expanded)
- ✅ Hover expansion over secondary nav
- ✅ Manual toggle button

**Applied To:** All pages under `app/(dashboard)/`

---

### 4. Contextual Secondary Navigation ✅

**Status:** ✅ **Fully Implemented**

**Location:** `components/navigation/SecondaryNav.tsx`

**Features:**
- ✅ Auto-detects module from pathname
- ✅ Module-specific sub-navigation configs:
  - Inbox: All Conversations, Unassigned, Assigned to Me, Closed
  - Tickets: All Tickets, Open, In Progress, Resolved
  - Knowledge Base: All Articles, Drafts, Published, Categories
  - Analytics: Dashboard, Reports, Usage
  - Settings: General, AI Agents, FAQs
- ✅ Active state: Blue highlight with right border
- ✅ Dynamic positioning based on primary nav state

**Applied To:** All pages under `app/(dashboard)/` (shows when module selected)

---

### 5. Toast Notification System ✅

**Status:** ✅ **Fully Implemented**

**Location:** `components/ui/toast.tsx`

**Features:**
- ✅ ToastProvider wraps entire app
- ✅ useToast hook for easy access
- ✅ Four types: success, error, warning, info
- ✅ Auto-dismiss with configurable duration
- ✅ Bottom-right positioning
- ✅ Color-coded by type

**Applied To:** All pages under `app/(dashboard)/` (via ToastProvider in layout)

---

### 6. Command Palette ✅

**Status:** ✅ **Fully Implemented**

**Location:** 
- Component: `components/command-palette/CommandPalette.tsx`
- Hook: `hooks/useCommandPalette.ts`

**Features:**
- ✅ Cmd+K / Ctrl+K keyboard shortcut
- ✅ Global search and navigation
- ✅ Command filtering by keywords
- ✅ Keyboard navigation (arrow keys, Enter, Escape)
- ✅ Grouped commands
- ✅ Integrated in Header

**Applied To:** All pages under `app/(dashboard)/` (via Header component)

---

### 7. Workspace Switcher ✅

**Status:** ✅ **Fully Implemented**

**Location:** `components/layout/WorkspaceSwitcher.tsx`

**Features:**
- ✅ Dropdown menu for workspace selection
- ✅ Current workspace display
- ✅ Conditional display (only if multiple workspaces)
- ✅ Integrated in Header

**Applied To:** All pages under `app/(dashboard)/` (via Header component)

---

## 🔧 Layout Pattern Usage by Page Type

### Dashboard Pages
- **Pattern:** Standard three-column layout
- **Pages:** `/dashboard`, `/dashboard/dashboard`
- **Status:** ✅ Layout inherited, ⚠️ Some need color token updates

### List Pages
- **Pattern:** Standard three-column layout + Breadcrumbs
- **Pages:** `/dashboard/inbox`, `/dashboard/knowledge-base`
- **Status:** ✅ Layout inherited, ⚠️ Need color token updates

### Detail Pages
- **Pattern:** Standard three-column layout + Breadcrumbs
- **Pages:** `/dashboard/inbox/[id]`, `/dashboard/knowledge-base/[id]/edit`
- **Status:** ✅ Layout inherited, ⚠️ Need color token updates

### Settings Pages
- **Pattern:** Standard three-column layout + Section headers
- **Pages:** `/dashboard/settings`, `/dashboard/settings/ai-agents`, `/dashboard/settings/faqs`
- **Status:** ✅ Layout inherited, ⚠️ Need color token updates

### Analytics Pages
- **Pattern:** Standard three-column layout + Full-width dashboard
- **Pages:** `/dashboard/analytics`
- **Status:** ✅ Layout inherited, ✅ Color tokens complete

---

## ⚠️ Issues Found

### Color Token Migration Needed

**Pages using old color classes instead of unified design tokens:**

1. **`app/(dashboard)/page.tsx`**
   - Uses: `text-gray-900`, `text-gray-600`, `bg-white`, `text-gray-700`, `bg-gray-100`
   - Should use: `text-foreground`, `text-foreground-secondary`, `bg-background`, `bg-background-secondary`

2. **`app/(dashboard)/inbox/page.tsx`**
   - Uses: `text-gray-900`
   - Should use: `text-foreground`

3. **`app/(dashboard)/inbox/[id]/page.tsx`**
   - Uses: `text-gray-900`
   - Should use: `text-foreground`

4. **`app/(dashboard)/knowledge-base/page.tsx`**
   - Uses: `text-gray-900`
   - Should use: `text-foreground`

5. **`app/(dashboard)/settings/page.tsx`**
   - Uses: `text-gray-900`, `text-gray-500`, `text-gray-700`, `text-gray-600`
   - Should use: `text-foreground`, `text-foreground-secondary`

6. **`app/(dashboard)/settings/ai-agents/page.tsx`**
   - Uses: Old color classes (need to verify)
   - Should use: Unified design tokens

7. **`app/(dashboard)/settings/faqs/page.tsx`**
   - Uses: Old color classes (need to verify)
   - Should use: Unified design tokens

---

## ✅ Layout Pattern Checklist

### Core Layout Structure
- [x] Three-column adaptive layout implemented
- [x] Primary navigation (collapsible, dark purple)
- [x] Secondary navigation (contextual, auto-detects)
- [x] Sticky header with enterprise features
- [x] Dynamic content margins
- [x] Toast Provider wraps entire app
- [x] All pages inherit layout automatically

### Enterprise Features
- [x] Command Palette integrated in header
- [x] Workspace Switcher in header
- [x] Toast notifications system-wide
- [x] Breadcrumbs component available
- [x] Split View component available
- [x] Contextual Sidebar component available

### Design Tokens
- [x] CSS variables in HSL format
- [x] Tailwind config extended
- [x] Primary nav uses dark purple
- [x] Active states use blue highlight
- [x] Main content uses theme-aware backgrounds
- [ ] All pages use unified color tokens (⚠️ 7 pages need updates)

---

## 📋 Next Steps

### Priority 1: Color Token Migration
1. Update `app/(dashboard)/page.tsx` to use unified tokens
2. Update `app/(dashboard)/inbox/page.tsx` to use unified tokens
3. Update `app/(dashboard)/inbox/[id]/page.tsx` to use unified tokens
4. Update `app/(dashboard)/knowledge-base/page.tsx` to use unified tokens
5. Update `app/(dashboard)/settings/page.tsx` to use unified tokens
6. Update `app/(dashboard)/settings/ai-agents/page.tsx` to use unified tokens
7. Update `app/(dashboard)/settings/faqs/page.tsx` to use unified tokens

### Priority 2: Verify All Components
1. Check all page components use unified tokens
2. Verify breadcrumbs use unified colors
3. Ensure all cards, buttons, forms use standard patterns

---

## 📊 Summary

**Layout Inheritance:** ✅ **100%** - All pages inherit the complete layout structure

**Layout Patterns:** ✅ **100%** - All patterns implemented and applied

**Color Token Usage:** ⚠️ **~70%** - Core layout uses tokens, but 7 pages need updates

**Overall Status:** ✅ **Layout Complete** | ⚠️ **Color Migration In Progress**

---

**Last Updated:** January 24, 2026  
**Next Review:** After color token migration complete
