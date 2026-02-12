# Customer Portal - Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** January 6, 2026  
**Status:** Active Development  
**Owner:** TrueVow Product Team

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Personas](#user-personas)
4. [Business Objectives](#business-objectives)
5. [Features & Requirements](#features--requirements)
6. [Technical Architecture](#technical-architecture)
7. [Integration Requirements](#integration-requirements)
8. [User Stories & Use Cases](#user-stories--use-cases)
9. [Success Metrics](#success-metrics)
10. [Roadmap & Phases](#roadmap--phases)
11. [Non-Functional Requirements](#non-functional-requirements)
12. [Risk Assessment](#risk-assessment)
13. [Appendices](#appendices)

---

## Executive Summary

### Purpose
The TrueVow Customer Portal is a **law firm-facing web application** that provides attorneys, paralegals, and law firm staff with a unified interface to access and manage all TrueVow services. It serves as the primary customer touchpoint, replacing fragmented service access with a cohesive, subscription-based platform.

### Key Value Propositions
- **Unified Access:** Single dashboard for all TrueVow services (INTAKE, DRAFT, SETTLE, CONNECT, VERIFY)
- **Subscription-Based:** Pay-per-service model with clear upgrade paths
- **Team Collaboration:** Multi-user support with role-based access control
- **Professional UX:** Modern, intuitive interface designed for legal professionals
- **Self-Service:** Empowers law firms to manage their own accounts, teams, and services

### Current Status
- ✅ **Core Infrastructure:** Complete (Next.js 14, Clerk Auth, TypeScript)
- ✅ **Service Modules:** 5/5 services implemented (INTAKE, DRAFT, SETTLE, CONNECT, VERIFY)
- ✅ **User Management:** Team management, profiles, settings
- ✅ **Subscription System:** Access control and upgrade flows
- 🔄 **Enhancements:** Ongoing feature additions and optimizations

---

## Product Overview

### What It Is
The Customer Portal is a **Next.js-based web application** that serves as the customer-facing interface for TrueVow's suite of legal technology services. It is distinct from the SaaS Admin portal (internal TrueVow staff) and provides a focused, tenant-scoped experience for law firm users.

### What It Is Not
- ❌ **Not an internal admin tool** (that's the SaaS Admin portal)
- ❌ **Not a backend API** (that's the Tenant Application)
- ❌ **Not a mobile app** (web-first, responsive design)
- ❌ **Not a white-label solution** (TrueVow-branded)

### Target Users
- **Primary:** Attorneys and paralegals at law firms
- **Secondary:** Law firm administrators and staff
- **Tertiary:** Law firm IT administrators

### Key Differentiators
1. **Service Integration:** Seamless access to 5+ TrueVow services
2. **Subscription Flexibility:** Pay only for services you use
3. **Team Management:** Invite team members, assign service access
4. **Professional Design:** Built specifically for legal professionals
5. **Self-Service:** Minimal dependency on TrueVow support

---

## User Personas

### 1. **Attorney (Primary User)**
- **Role:** Senior attorney or partner
- **Goals:** Manage cases, validate documents, track settlements, refer clients
- **Pain Points:** Multiple tools, fragmented workflows, time-consuming tasks
- **Needs:** Quick access to services, clear dashboards, mobile-friendly
- **Usage:** Daily, 2-4 hours/day

### 2. **Paralegal (Power User)**
- **Role:** Legal assistant or paralegal
- **Goals:** Manage intake leads, draft documents, track referrals
- **Pain Points:** Manual data entry, repetitive tasks, lack of automation
- **Needs:** Efficient workflows, bulk operations, clear task lists
- **Usage:** Daily, 4-6 hours/day

### 3. **Law Firm Administrator**
- **Role:** Office manager or admin staff
- **Goals:** Manage team access, view billing, configure settings
- **Pain Points:** Complex permissions, unclear billing, team onboarding
- **Needs:** Simple team management, clear billing breakdown, easy settings
- **Usage:** Weekly, 1-2 hours/week

### 4. **Law Firm IT Admin**
- **Role:** IT administrator or technical contact
- **Goals:** Configure integrations, manage API keys, troubleshoot
- **Pain Points:** Complex setup, unclear documentation, integration issues
- **Needs:** Clear API documentation, integration guides, support access
- **Usage:** Monthly, 2-4 hours/month

---

## Business Objectives

### Primary Goals
1. **Increase Service Adoption:** Make it easy for law firms to discover and use TrueVow services
2. **Reduce Support Burden:** Enable self-service account and team management
3. **Improve Customer Satisfaction:** Provide a professional, intuitive user experience
4. **Enable Upselling:** Clear upgrade paths and service discovery
5. **Scale Operations:** Support growing number of law firm customers

### Success Criteria
- **Adoption Rate:** 80%+ of active law firms use at least 2 services
- **Support Tickets:** <5% of users require support for basic tasks
- **Customer Satisfaction:** NPS score >50
- **Upsell Rate:** 30%+ of customers upgrade to additional services within 6 months
- **Team Growth:** Average 3+ team members per law firm

---

## Features & Requirements

### 1. Authentication & User Management

#### 1.1 Authentication
- **Clerk Integration:** OAuth, email/password, magic links
- **Multi-Factor Authentication:** Optional 2FA support
- **Session Management:** Secure session handling, auto-logout
- **Password Recovery:** Email-based password reset flow
- **Social Login:** Optional Google/Microsoft login (future)

**Acceptance Criteria:**
- ✅ Users can sign up with email/password
- ✅ Users can sign in securely
- ✅ Password reset flow works end-to-end
- ✅ Sessions persist across browser restarts
- ✅ Auto-logout after 24 hours of inactivity

#### 1.2 User Profile Management
- **Profile Editing:** Name, email, phone, avatar
- **Password Change:** Secure password update flow
- **Notification Preferences:** Email, SMS, push notification toggles
- **API Key Management:** View and regenerate API keys
- **Account Settings:** Firm information, preferences

**Acceptance Criteria:**
- ✅ Users can update profile information
- ✅ Password change requires current password verification
- ✅ Notification preferences persist across sessions
- ✅ API keys are securely displayed and can be regenerated

#### 1.3 Team Management
- **Team Member List:** View all team members with roles
- **Invite Team Members:** Email-based invitation flow
- **Service Access Assignment:** Grant/revoke service access per team member
- **Role Management:** Assign roles (Attorney, Paralegal, Admin, Staff)
- **Remove Team Members:** Remove access with confirmation

**Acceptance Criteria:**
- ✅ Admins can invite team members via email
- ✅ Team members can be assigned to specific services
- ✅ Roles are enforced (Attorney > Paralegal > Staff)
- ✅ Removed team members lose access immediately

---

### 2. Service Modules

#### 2.1 INTAKE & Leads Service
**Purpose:** Manage client intake and lead tracking

**Features:**
- **Dashboard:** Stats cards (total leads, new today, converted, pending)
- **Leads List:** Filterable, searchable list of all leads
- **Lead Details:** View lead information, contact history, notes
- **Create Lead:** Manual lead creation form
- **Lead Status:** Track status (new, contacted, qualified, converted, lost)
- **Export:** Export leads to CSV (future)

**Acceptance Criteria:**
- ✅ Dashboard displays accurate statistics
- ✅ Leads list loads and filters correctly
- ✅ Users can create new leads
- ✅ Lead status can be updated
- ✅ Real-time updates when new leads arrive

**Subscription Required:** ✅ Yes

---

#### 2.2 DRAFT Validation Service
**Purpose:** Validate legal documents (complaints, motions, etc.)

**Features:**
- **Validation Dashboard:** Overview of validation history
- **Document Upload:** Upload documents for validation
- **Validation Rules:** View and manage validation rules (if admin)
- **Validation History:** View past validations with results
- **Rule Testing:** Test validation rules (if admin)
- **Health Check:** Service status indicator

**Acceptance Criteria:**
- ✅ Users can upload documents for validation
- ✅ Validation results display clearly
- ✅ Validation history is searchable
- ✅ Admin users can manage rules
- ✅ Service health is visible

**Subscription Required:** ✅ Yes

**Special Features:**
- **DRAFT Testing Portal:** Separate portal for testing validation rules (`/draft-testing`)

---

#### 2.3 SETTLE Data Bank Service
**Purpose:** AI-powered settlement estimates and data contribution

**Features:**
- **Dashboard:** Founding member status, stats (contributions, queries, approvals)
- **Query Settlement Range:** Get AI-powered settlement estimates
- **Contribute Case Data:** Submit case data for data bank
- **Reports:** Generate and download PDF reports
- **Founding Member Progress:** Track progress toward lifetime access (10 contributions)

**Acceptance Criteria:**
- ✅ Users can query settlement ranges with filters
- ✅ Estimates display with confidence levels
- ✅ Users can contribute case data (with PHI detection)
- ✅ Reports generate and download successfully
- ✅ Founding member progress tracks accurately

**Subscription Required:** ✅ Yes

**Special Features:**
- **PHI Detection:** Client-side detection of protected health information
- **Blockchain Verification:** Reports include blockchain verification status

---

#### 2.4 CONNECT Referrals Service
**Purpose:** Attorney referral network and payout tracking

**Features:**
- **Dashboard:** Referral stats (total, accepted, pending, payouts)
- **Referrals List:** View all referrals with status tracking
- **Create Referral:** Send referral to another attorney
- **Payouts Tracking:** View payout history and pending payouts
- **Referral Status:** Track status (pending, accepted, declined, completed)

**Acceptance Criteria:**
- ✅ Users can create and send referrals
- ✅ Referral status updates in real-time
- ✅ Payouts are tracked accurately
- ✅ Referral history is searchable
- ✅ Statistics display correctly

**Subscription Required:** ✅ Yes

---

#### 2.5 VERIFY Service
**Purpose:** Law firm registration and verification

**Features:**
- **Verification Dashboard:** View verification status
- **Registration Flow:** Complete law firm registration
- **Document Upload:** Upload verification documents
- **Status Tracking:** Track verification progress
- **Certificate Access:** View and download verification certificates

**Acceptance Criteria:**
- ✅ Users can view verification status
- ✅ Registration flow is clear and intuitive
- ✅ Documents upload successfully
- ✅ Status updates are visible
- ✅ Certificates are accessible

**Subscription Required:** ✅ Yes

---

### 3. Subscription & Billing

#### 3.1 Subscription Management
- **Service Status:** View subscription status for each service
- **Upgrade Prompts:** Clear upgrade CTAs when service unavailable
- **Billing Dashboard:** View usage, invoices, payment methods
- **Upgrade Flow:** Seamless upgrade to additional services
- **Downgrade Flow:** Handle service downgrades gracefully

**Acceptance Criteria:**
- ✅ Subscription status is accurate and up-to-date
- ✅ Upgrade prompts are clear and actionable
- ✅ Billing information displays correctly
- ✅ Upgrade flow completes successfully
- ✅ Unsubscribed services are hidden from navigation

#### 3.2 Usage Tracking
- **Service Usage:** Track API calls, document validations, queries
- **Usage Limits:** Display usage vs. limits for each service
- **Usage History:** View historical usage data
- **Alerts:** Notify when approaching usage limits

**Acceptance Criteria:**
- ✅ Usage data is accurate and updates in real-time
- ✅ Usage limits are clearly displayed
- ✅ Historical usage is accessible
- ✅ Alerts trigger at appropriate thresholds

---

### 4. Notifications & Communication

#### 4.1 Notifications Center
- **Notification List:** View all notifications with read/unread status
- **Notification Types:** Success, error, warning, info
- **Mark as Read:** Mark individual or all notifications as read
- **Clear Notifications:** Remove notifications
- **Action Links:** Navigate to relevant pages from notifications

**Acceptance Criteria:**
- ✅ Notifications display correctly
- ✅ Unread count is accurate
- ✅ Users can mark notifications as read
- ✅ Action links navigate correctly
- ✅ Notifications persist across sessions

#### 4.2 Messages Inbox
- **Messages List:** View all messages from TrueVow
- **Message Threading:** View conversation threads
- **Reply:** Reply to messages (future)
- **Mark as Read:** Mark messages as read

**Acceptance Criteria:**
- ✅ Messages display in chronological order
- ✅ Message threads are grouped correctly
- ✅ Unread count is accurate
- ✅ Messages persist across sessions

---

### 5. Navigation & UX

#### 5.1 Dashboard Layout
- **Sidebar Navigation:** Persistent sidebar with service links
- **Conditional Display:** Services only show when subscribed
- **Active State:** Highlight current page in navigation
- **User Menu:** Access profile, settings, sign out
- **Responsive Design:** Mobile-friendly layout

**Acceptance Criteria:**
- ✅ Navigation is intuitive and consistent
- ✅ Only subscribed services appear
- ✅ Active page is clearly indicated
- ✅ Mobile navigation works correctly
- ✅ User menu is accessible

#### 5.2 Home Dashboard
- **Overview Cards:** Quick stats for each subscribed service
- **Recent Activity:** Recent actions across services
- **Quick Actions:** Common actions (create lead, validate document, etc.)
- **Service Status:** Health indicators for each service

**Acceptance Criteria:**
- ✅ Overview cards display accurate data
- ✅ Recent activity is relevant and up-to-date
- ✅ Quick actions navigate correctly
- ✅ Service status is accurate

---

## Technical Architecture

### 3.1 Technology Stack

#### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.3+
- **Styling:** Tailwind CSS 3.4+
- **Icons:** Lucide React
- **State Management:** Zustand (client state), React Query (server state)
- **Forms:** React Hook Form (future)
- **Charts:** Recharts

#### Authentication
- **Provider:** Clerk 5.0+
- **Methods:** Email/password, OAuth (future)
- **Session:** Server-side session management
- **Multi-tenancy:** Tenant ID from Clerk metadata

#### API Integration
- **HTTP Client:** Axios
- **API Base:** Tenant Application (FastAPI) at `http://localhost:8000`
- **Platform Service:** SaaS Admin API for subscriptions
- **Service Clients:** Dedicated clients per service (INTAKE, DRAFT, SETTLE, CONNECT, VERIFY)

#### Development Tools
- **Testing:** Playwright for E2E tests
- **Linting:** ESLint with Next.js config
- **Type Checking:** TypeScript strict mode
- **Build:** Next.js production build

---

### 3.2 Architecture Patterns

#### Service Access Control Pattern
```typescript
// lib/subscriptions/service-access.ts
export async function hasServiceAccess(
  tenantId: string,
  service: ServiceName
): Promise<boolean> {
  const subscription = await getTenantSubscription(tenantId);
  return subscription.services[service] === true;
}
```

**Usage:**
- Navigation: Conditionally render service links
- Pages: Redirect to upgrade if not subscribed
- Components: Show upgrade prompts

#### API Client Pattern
```typescript
// lib/api/{service}-client.ts
export const {service}Client = {
  async getData(tenantId: string) {
    return await axios.get(`${API_URL}/api/v1/{service}/data`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }
};
```

**Benefits:**
- Centralized API logic
- Consistent error handling
- Type-safe requests/responses
- Easy to mock for testing

#### Server Component Pattern
```typescript
// app/(dashboard)/dashboard/{service}/page.tsx
export default async function ServicePage() {
  const { userId, sessionClaims } = auth();
  const tenantId = sessionClaims?.tenantId;
  
  // Fetch data server-side
  const data = await serviceClient.getData(tenantId);
  
  return <ServiceDashboard data={data} />;
}
```

**Benefits:**
- Better performance (no client-side loading)
- SEO-friendly
- Secure (API keys not exposed)

---

### 3.3 File Structure

```
Truevow-Customer-Portal/
├── app/
│   ├── (auth)/                    # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/               # Protected dashboard
│   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   └── dashboard/
│   │       ├── page.tsx           # Home dashboard
│   │       ├── intake/            # INTAKE service
│   │       ├── draft/             # DRAFT service
│   │       ├── settle/            # SETTLE service
│   │       ├── connect/           # CONNECT service
│   │       ├── verify/            # VERIFY service
│   │       ├── team/              # Team management
│   │       ├── notifications/     # Notifications center
│   │       ├── billing/           # Billing & subscriptions
│   │       └── settings/          # User settings
│   ├── certificates/              # Certificate pages
│   ├── draft-testing/             # DRAFT testing portal
│   ├── forgot-password/           # Password recovery
│   ├── globals.css                # Global styles
│   └── layout.tsx                 # Root layout
├── components/                     # Reusable components
│   ├── certificates/
│   ├── connect/
│   └── ServiceAccessGuard.tsx
├── lib/
│   ├── api/                       # API clients
│   │   ├── tenant-app-client.ts
│   │   ├── connect-client.ts
│   │   ├── settle-client.ts
│   │   └── draft-client.ts
│   └── subscriptions/
│       └── service-access.ts      # Subscription utilities
├── middleware.ts                   # Clerk authentication
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

### 3.4 Security Architecture

#### Authentication Flow
1. User signs in via Clerk
2. Clerk validates credentials
3. Session created with tenant ID in metadata
4. Middleware protects routes
5. Server components access tenant ID from session

#### Authorization Flow
1. User requests service page
2. Server checks subscription via Platform Service API
3. If subscribed: Render service page
4. If not: Redirect to billing with upgrade prompt

#### Data Isolation
- **Tenant Scoping:** All API calls include `X-Tenant-ID` header
- **Backend Validation:** Backend validates tenant ID on every request
- **No Cross-Tenant Access:** Frontend never exposes other tenants' data

#### API Security
- **API Keys:** Stored server-side, never exposed to client
- **HTTPS Only:** All API calls over HTTPS
- **Rate Limiting:** Backend enforces rate limits
- **Input Validation:** Client and server-side validation

---

## Integration Requirements

### 4.1 Tenant Application Backend

#### Base URL
- **Development:** `http://localhost:8000`
- **Production:** `https://api.truevow.com` (TBD)

#### Required Endpoints

**INTAKE Service:**
- `GET /api/v1/intake/stats` - Get intake statistics
- `GET /api/v1/intake/leads` - List leads
- `POST /api/v1/intake/leads` - Create lead
- `GET /api/v1/intake/leads/{id}` - Get lead details
- `PATCH /api/v1/intake/leads/{id}` - Update lead

**DRAFT Service:**
- `POST /api/v1/draft/validate` - Validate document
- `GET /api/v1/draft/history` - Get validation history
- `GET /api/v1/draft/rules` - List validation rules (admin)
- `POST /api/v1/draft/rules` - Create validation rule (admin)

**SETTLE Service:**
- `POST /api/v1/settle/query/estimate` - Query settlement range
- `POST /api/v1/settle/contribute` - Submit case data
- `GET /api/v1/settle/member-status` - Get founding member status
- `POST /api/v1/settle/reports/generate` - Generate report
- `GET /api/v1/settle/reports` - List reports
- `GET /api/v1/settle/reports/{id}/download` - Download report

**CONNECT Service:**
- `GET /api/v1/connect/stats` - Get referral stats
- `GET /api/v1/connect/referrals` - List referrals
- `POST /api/v1/connect/referrals` - Create referral
- `GET /api/v1/connect/payouts` - List payouts

**VERIFY Service:**
- `GET /api/v1/verify/status` - Get verification status
- `POST /api/v1/verify/register` - Register law firm
- `POST /api/v1/verify/documents` - Upload documents
- `GET /api/v1/verify/certificates` - List certificates

**Team Management:**
- `GET /api/v1/tenants/{id}/team` - List team members
- `POST /api/v1/tenants/{id}/team/invite` - Invite team member
- `DELETE /api/v1/tenants/{id}/team/{userId}` - Remove team member

**Notifications:**
- `GET /api/v1/tenants/{id}/notifications` - List notifications
- `PATCH /api/v1/tenants/{id}/notifications/{id}/read` - Mark as read

---

### 4.2 Platform Service (SaaS Admin)

#### Base URL
- **Development:** `http://localhost:3000`
- **Production:** `https://admin.truevow.com` (TBD)

#### Required Endpoints

**Subscriptions:**
- `GET /api/v1/tenants/{id}/subscription` - Get subscription status
  ```json
  {
    "tenantId": "uuid",
    "services": {
      "intake": true,
      "draft": true,
      "settle": false,
      "connect": false,
      "verify": false
    },
    "plan": "professional",
    "expiresAt": "2026-12-31T23:59:59Z"
  }
  ```

**Billing:**
- `GET /api/v1/tenants/{id}/billing/usage` - Get usage data
- `GET /api/v1/tenants/{id}/billing/invoices` - List invoices
- `GET /api/v1/tenants/{id}/billing/payment-methods` - List payment methods

---

### 4.3 Clerk Authentication

#### Configuration
- **Publishable Key:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Secret Key:** `CLERK_SECRET_KEY`
- **Sign-in URL:** `/sign-in`
- **Sign-up URL:** `/sign-up`
- **After Sign-in:** `/dashboard`
- **After Sign-up:** `/dashboard`

#### Tenant ID Mapping
- **Method:** Clerk Public Metadata
- **Key:** `tenantId`
- **Set By:** Platform Service on user creation
- **Access:** `sessionClaims?.tenantId`

---

### 4.4 Environment Variables

```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Tenant Application Backend
NEXT_PUBLIC_TENANT_APP_API_URL=http://localhost:8000
NEXT_PUBLIC_TENANT_APP_API_KEY=your_api_key

# Platform Service
NEXT_PUBLIC_PLATFORM_SERVICE_URL=http://localhost:3000
PLATFORM_SERVICE_API_KEY=your_api_key

# Service-Specific (Optional)
NEXT_PUBLIC_SETTLE_API_URL=http://localhost:8002
NEXT_PUBLIC_SETTLE_API_KEY=sk_test_...
```

---

## User Stories & Use Cases

### 5.1 Authentication & Onboarding

**US-001: User Sign Up**
- **As a** new law firm user
- **I want to** create an account
- **So that** I can access TrueVow services
- **Acceptance Criteria:**
  - User can sign up with email/password
  - User receives verification email
  - User is redirected to dashboard after sign-up
  - Tenant ID is assigned automatically

**US-002: User Sign In**
- **As a** returning user
- **I want to** sign in to my account
- **So that** I can access my services
- **Acceptance Criteria:**
  - User can sign in with email/password
  - User is redirected to dashboard
  - Session persists across browser restarts

**US-003: Password Recovery**
- **As a** user who forgot my password
- **I want to** reset my password
- **So that** I can regain access to my account
- **Acceptance Criteria:**
  - User can request password reset via email
  - Reset link expires after 1 hour
  - User can set new password
  - User is redirected to sign-in after reset

---

### 5.2 Service Access

**US-004: View Service Dashboard**
- **As a** subscribed user
- **I want to** view my service dashboard
- **So that** I can see my service statistics
- **Acceptance Criteria:**
  - Dashboard loads with accurate statistics
  - Service status is visible
  - Quick actions are accessible

**US-005: Upgrade to Service**
- **As a** user without a service subscription
- **I want to** upgrade to access a service
- **So that** I can use that service
- **Acceptance Criteria:**
  - Upgrade prompt is clear and actionable
  - Upgrade flow completes successfully
  - Service becomes accessible after upgrade

**US-006: Access Unsubscribed Service**
- **As a** user without a service subscription
- **I want to** be informed when I try to access an unsubscribed service
- **So that** I understand why I can't access it
- **Acceptance Criteria:**
  - User is redirected to billing with upgrade prompt
  - Upgrade prompt explains service benefits
  - User can complete upgrade from prompt

---

### 5.3 Team Management

**US-007: Invite Team Member**
- **As a** law firm administrator
- **I want to** invite team members
- **So that** they can access TrueVow services
- **Acceptance Criteria:**
  - Admin can invite via email
  - Team member receives invitation email
  - Team member can accept invitation
  - Team member gains access to assigned services

**US-008: Assign Service Access**
- **As a** law firm administrator
- **I want to** assign service access to team members
- **So that** they can use specific services
- **Acceptance Criteria:**
  - Admin can select services during invitation
  - Admin can update service access after invitation
  - Team member only sees assigned services
  - Changes take effect immediately

**US-009: Remove Team Member**
- **As a** law firm administrator
- **I want to** remove team members
- **So that** they lose access to services
- **Acceptance Criteria:**
  - Admin can remove team members
  - Confirmation dialog prevents accidental removal
  - Removed member loses access immediately
  - Removal is logged

---

### 5.4 Service-Specific Use Cases

**US-010: Create Lead (INTAKE)**
- **As a** paralegal
- **I want to** create a new lead
- **So that** I can track potential clients
- **Acceptance Criteria:**
  - Lead creation form is accessible
  - Form validates required fields
  - Lead is created successfully
  - Lead appears in leads list immediately

**US-011: Validate Document (DRAFT)**
- **As an** attorney
- **I want to** validate a legal document
- **So that** I can ensure it meets requirements
- **Acceptance Criteria:**
  - Document upload works correctly
  - Validation completes successfully
  - Results are clear and actionable
  - Validation history is saved

**US-012: Query Settlement Range (SETTLE)**
- **As an** attorney
- **I want to** query settlement ranges
- **So that** I can estimate case value
- **Acceptance Criteria:**
  - Query form is intuitive
  - Results display with confidence levels
  - Estimates are accurate
  - Reports can be generated

**US-013: Create Referral (CONNECT)**
- **As an** attorney
- **I want to** create a referral
- **So that** I can refer clients to other attorneys
- **Acceptance Criteria:**
  - Referral form is accessible
  - Referral is sent successfully
  - Referral status is trackable
  - Payouts are tracked

---

## Success Metrics

### 6.1 Adoption Metrics
- **Service Adoption Rate:** % of active users using each service
  - Target: 80%+ use at least 2 services
- **Feature Usage:** % of users using each feature
  - Target: 60%+ use team management
- **Daily Active Users (DAU):** Number of daily active users
  - Target: 70%+ of monthly active users

### 6.2 Engagement Metrics
- **Session Duration:** Average time per session
  - Target: 15+ minutes
- **Pages per Session:** Average pages viewed per session
  - Target: 5+ pages
- **Return Rate:** % of users who return within 7 days
  - Target: 60%+

### 6.3 Business Metrics
- **Support Ticket Reduction:** % reduction in support tickets
  - Target: 50%+ reduction
- **Upsell Rate:** % of users upgrading to additional services
  - Target: 30%+ within 6 months
- **Customer Satisfaction (NPS):** Net Promoter Score
  - Target: 50+

### 6.4 Technical Metrics
- **Page Load Time:** Average page load time
  - Target: <2 seconds
- **API Response Time:** Average API response time
  - Target: <500ms
- **Error Rate:** % of requests resulting in errors
  - Target: <1%
- **Uptime:** Service availability
  - Target: 99.9%+

---

## Roadmap & Phases

### Phase 1: Foundation (✅ Complete)
**Timeline:** December 2025  
**Status:** ✅ Complete

**Deliverables:**
- ✅ Next.js 14 setup with App Router
- ✅ Clerk authentication integration
- ✅ Dashboard layout with sidebar
- ✅ Basic navigation structure
- ✅ TypeScript + Tailwind CSS setup

---

### Phase 2: Core Services (✅ Complete)
**Timeline:** December 2025 - January 2026  
**Status:** ✅ Complete

**Deliverables:**
- ✅ INTAKE service integration
- ✅ DRAFT service integration
- ✅ SETTLE service integration
- ✅ CONNECT service integration
- ✅ VERIFY service integration
- ✅ Subscription-based access control
- ✅ Service access utilities

---

### Phase 3: User Management (✅ Complete)
**Timeline:** January 2026  
**Status:** ✅ Complete

**Deliverables:**
- ✅ Team management (invite, assign, remove)
- ✅ User profile management
- ✅ Password change flow
- ✅ Password recovery flow
- ✅ Settings page
- ✅ Notification preferences

---

### Phase 4: Notifications & Communication (✅ Complete)
**Timeline:** January 2026  
**Status:** ✅ Complete

**Deliverables:**
- ✅ Notifications center
- ✅ Messages inbox
- ✅ Notification types (success, error, warning, info)
- ✅ Mark as read functionality
- ✅ Action links in notifications

---

### Phase 5: Enhancements (🔄 In Progress)
**Timeline:** January 2026 - February 2026  
**Status:** 🔄 In Progress

**Planned Deliverables:**
- 🔄 Real-time notifications (WebSocket)
- 🔄 Advanced search across services
- 🔄 Bulk operations (bulk lead update, etc.)
- 🔄 Export functionality (CSV, PDF)
- 🔄 Mobile app (React Native)
- 🔄 API documentation portal
- 🔄 Integration marketplace

---

### Phase 6: Advanced Features (📅 Planned)
**Timeline:** February 2026 - March 2026  
**Status:** 📅 Planned

**Planned Deliverables:**
- 📅 Custom dashboards (user-configurable)
- 📅 Advanced analytics and reporting
- 📅 Workflow automation
- 📅 Third-party integrations (Zapier, etc.)
- 📅 White-label options (for enterprise)
- 📅 Multi-language support

---

## Non-Functional Requirements

### 7.1 Performance
- **Page Load Time:** <2 seconds for initial load
- **Time to Interactive:** <3 seconds
- **API Response Time:** <500ms for 95th percentile
- **Image Optimization:** All images optimized (WebP, lazy loading)
- **Code Splitting:** Route-based code splitting enabled

### 7.2 Scalability
- **Concurrent Users:** Support 1,000+ concurrent users
- **Database:** Handle 10,000+ law firms
- **API Rate Limiting:** 100 requests/minute per user
- **CDN:** Static assets served via CDN

### 7.3 Security
- **HTTPS Only:** All traffic over HTTPS
- **Authentication:** Clerk-based authentication with 2FA support
- **Authorization:** Role-based access control (RBAC)
- **Data Isolation:** Strict tenant data isolation
- **Input Validation:** Client and server-side validation
- **XSS Protection:** Content Security Policy (CSP) headers
- **CSRF Protection:** CSRF tokens for state-changing operations

### 7.4 Accessibility
- **WCAG 2.1 AA:** Meet WCAG 2.1 Level AA standards
- **Keyboard Navigation:** Full keyboard navigation support
- **Screen Readers:** Compatible with screen readers
- **Color Contrast:** Minimum 4.5:1 contrast ratio
- **Focus Indicators:** Clear focus indicators

### 7.5 Browser Support
- **Chrome:** Latest 2 versions
- **Firefox:** Latest 2 versions
- **Safari:** Latest 2 versions
- **Edge:** Latest 2 versions
- **Mobile:** iOS Safari 14+, Chrome Android (latest)

### 7.6 Responsive Design
- **Desktop:** 1920px, 1440px, 1280px breakpoints
- **Tablet:** 768px, 1024px breakpoints
- **Mobile:** 375px, 414px breakpoints
- **Touch Targets:** Minimum 44x44px touch targets

---

## Risk Assessment

### 8.1 Technical Risks

**Risk 1: API Dependency**
- **Description:** Customer Portal depends on Tenant Application backend
- **Impact:** High - Portal unusable if backend is down
- **Mitigation:** 
  - Implement graceful error handling
  - Show service status indicators
  - Cache critical data client-side
  - Implement retry logic with exponential backoff

**Risk 2: Authentication Issues**
- **Description:** Clerk authentication failures
- **Impact:** High - Users cannot access portal
- **Mitigation:**
  - Monitor Clerk service status
  - Implement fallback authentication (future)
  - Clear error messages for users
  - Support team escalation path

**Risk 3: Subscription Sync Issues**
- **Description:** Subscription status out of sync
- **Impact:** Medium - Users may see incorrect service access
- **Mitigation:**
  - Real-time subscription checks
  - Cache subscription status with TTL
  - Manual refresh option
  - Admin override capability

---

### 8.2 Business Risks

**Risk 4: Low Adoption**
- **Description:** Law firms don't adopt the portal
- **Impact:** High - Business objective not met
- **Mitigation:**
  - User onboarding flow
  - In-app tutorials and tooltips
  - Regular user feedback surveys
  - Continuous UX improvements

**Risk 5: Support Burden**
- **Description:** High support ticket volume
- **Impact:** Medium - Increased support costs
- **Mitigation:**
  - Comprehensive documentation
  - In-app help and tooltips
  - Self-service account management
  - Proactive user communication

---

### 8.3 Security Risks

**Risk 6: Data Breach**
- **Description:** Unauthorized access to tenant data
- **Impact:** Critical - Legal and financial consequences
- **Mitigation:**
  - Strict tenant data isolation
  - Regular security audits
  - Penetration testing
  - Incident response plan

**Risk 7: API Key Exposure**
- **Description:** API keys exposed in client-side code
- **Impact:** High - Unauthorized API access
- **Mitigation:**
  - Never expose API keys client-side
  - Server-side API calls only
  - Regular key rotation
  - Key usage monitoring

---

## Appendices

### Appendix A: Glossary

- **Tenant:** A law firm customer with a TrueVow account
- **Service:** A TrueVow product (INTAKE, DRAFT, SETTLE, CONNECT, VERIFY)
- **Subscription:** Active access to a service for a tenant
- **Team Member:** A user associated with a tenant
- **Service Access:** Permission for a team member to use a service
- **Platform Service:** Internal TrueVow service for managing tenants and subscriptions
- **Tenant Application:** Backend API service for multi-tenant operations

---

### Appendix B: API Response Examples

#### Subscription Status Response
```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "services": {
    "intake": true,
    "draft": true,
    "settle": false,
    "connect": false,
    "verify": false
  },
  "plan": "professional",
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

#### Team Member List Response
```json
{
  "members": [
    {
      "userId": "user_123",
      "email": "attorney@lawfirm.com",
      "name": "John Doe",
      "role": "attorney",
      "services": ["intake", "draft", "settle"],
      "joinedAt": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

### Appendix C: User Flow Diagrams

#### Sign-Up Flow
```
User visits /sign-up
  ↓
Fills sign-up form
  ↓
Clerk creates account
  ↓
Platform Service assigns tenant ID
  ↓
User redirected to /dashboard
  ↓
Onboarding flow (optional)
```

#### Service Access Flow
```
User clicks service link
  ↓
hasServiceAccess() checks subscription
  ↓
If subscribed: Show service page
If not: Redirect to /dashboard/billing?upgrade={service}
  ↓
User completes upgrade
  ↓
Service becomes accessible
```

---

### Appendix D: Related Documentation

- **Architecture Decision:** `ARCHITECTURE_DECISION.md` (Customer Portal repo)
- **Setup Guide:** `SETUP_COMPLETE.md` (Customer Portal repo)
- **Feature Implementation:** `COMPLETE_CUSTOMER_PORTAL_FEATURES.md` (Customer Portal repo)
- **Service Integration:** `SETTLE_INTEGRATION_COMPLETE.md`, `CONNECT_AND_SUBSCRIPTION_COMPLETE.md` (Customer Portal repo)
- **SaaS Admin Documentation:** `2025-TrueVow-SaaS-Administration/docs/`
- **Tenant Application Documentation:** `2025-TrueVow-Tenant-Application/docs/`

---

### Appendix E: Change Log

**Version 1.0 (January 6, 2026)**
- Initial PRD creation
- Comprehensive feature documentation
- Technical architecture defined
- User stories and use cases documented
- Roadmap and phases outlined

---

**Document Owner:** TrueVow Product Team  
**Last Updated:** January 6, 2026  
**Next Review:** February 6, 2026  
**Status:** Active Development

---

*This PRD is a living document and will be updated as the product evolves.*

