# Customer Success & Customer Support Service - Product Requirements Document (PRD)

**Version:** 1.2  
**Date:** January 15, 2026  
**Status:** Active Development - Recent Implementations Complete  
**Owner:** TrueVow Product Team  
**Service:** CS-Support Service (Port 3003)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Service Architecture Context](#service-architecture-context)
4. [User Personas](#user-personas)
5. [Business Objectives](#business-objectives)
6. [Features & Requirements](#features--requirements)
7. [AI Digital Agents Module](#8-ai-digital-agents-module)
8. [AI Agent Framework & Architecture](#89-ai-agent-framework--architecture)
9. [Human Roles & Job Responsibilities Integration](#810-human-roles--job-responsibilities-integration)
10. [Shared Inbox Migration](#shared-inbox-migration)
11. [Technical Architecture](#technical-architecture)
12. [Integration Requirements](#integration-requirements)
11. [User Stories & Use Cases](#user-stories--use-cases)
12. [Success Metrics](#success-metrics)
13. [Roadmap & Phases](#roadmap--phases)
14. [Non-Functional Requirements](#non-functional-requirements)
15. [Risk Assessment](#risk-assessment)
16. [Appendices](#appendices)

---

## Executive Summary

### Purpose
The **Customer Success & Customer Support (CS-Support) Service** is a dedicated service within TrueVow's 5-service architecture that handles all customer-facing support operations, customer success initiatives, and multi-channel communication management. It serves as the central hub for customer interactions, support ticket management, knowledge base, and team collaboration for the support organization.

### Key Value Propositions
- **Unified Customer Support:** Single platform for all customer support operations
- **Multi-Channel Communication:** Email, SMS, WhatsApp, Chat, Calls, Facebook, Forms in one inbox
- **AI-Powered Support:** Intelligent response suggestions and auto-analysis
- **Team Collaboration:** Real-time collaboration, activity feeds, performance tracking
- **Customer Success:** Proactive customer health monitoring and success initiatives
- **Cost Savings:** Built in-house, replacing third-party solutions (HelpScout, Crisp, Intercom)

### Current Status
- ✅ **Shared Inbox Module:** Production-ready (100% complete, 25+ features)
- ✅ **Location:** Currently in SaaS Admin (`/customer-support/inbox`)
- 🔄 **Migration:** Planned to CS-Support Service (this PRD)
- ✅ **New Service:** CS-Support Service repository created and active
- ✅ **Onboarding System:** Complete (Communication templates, sequences, progress tracking)
- ✅ **Unified Dialer Service:** Complete (Permissions, phone pools, settings page)
- ✅ **Phone Number Integration:** Complete (Sales CRM integration, CSM management)
- ✅ **CSM Dashboard:** Complete (Onboarding workflow visualization)
- ✅ **JTBD Integration:** Complete (RevOps reporting, time tracking enrichment)

---

## Product Overview

### What It Is
The CS-Support Service is a **Next.js-based web application** (or FastAPI backend + Next.js frontend) that provides:
1. **Shared Inbox:** Unified inbox for all customer communications
2. **Support Ticket Management:** Full lifecycle ticket management
3. **Knowledge Base:** Customer-facing and internal knowledge base
4. **Customer Success:** Proactive customer health and success tracking
5. **Team Collaboration:** Support team collaboration tools
6. **Analytics & Reporting:** Support metrics, CSAT, NPS, SLA tracking

### What It Is Not
- ❌ **Not a sales tool** (that's Sales-CRM Service)
- ❌ **Not an internal operations tool** (that's Internal Ops Service)
- ❌ **Not a customer portal** (that's Customer Portal for law firms)
- ❌ **Not a third-party solution** (built in-house)

### Target Users
- **Primary:** Customer Support team members
- **Secondary:** Customer Success managers
- **Tertiary:** Sales team (for first-touch communications via API)
- **Quaternary:** Management (for analytics and reporting)

### Key Differentiators
1. **In-House Built:** No monthly SaaS fees, full control
2. **Multi-Channel Unified:** All channels in one inbox
3. **AI-Powered:** Intelligent suggestions and auto-analysis
4. **Team Collaboration:** Built-in collaboration features
5. **Customer Success Integration:** Proactive customer health monitoring

---

## Service Architecture Context

### TrueVow 5-Service Architecture

The CS-Support Service is part of TrueVow's enterprise architecture:

```
┌─────────────────────────────────────────────────────────────┐
│              TRUEVOW 5-SERVICE ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────┘

1. Platform Service (Port 3000)
   - Tenant management
   - Billing & subscriptions
   - System configuration
   - Frontend: Standalone Next.js app

2. Sales-CRM Service (Port 3002)
   - Pipeline management
   - Lead qualification
   - Demos & onboarding
   - Frontend: Standalone Next.js app

3. CS-Support Service (Port 3003) ⭐ THIS SERVICE
   - Support tickets
   - Shared Inbox
   - Knowledge Base
   - Customer Success
   - SLA tracking
   - Frontend: Standalone Next.js app (THIS SERVICE)

4. Internal Ops Service (Port 3004)
   - Internal operations
   - HR, IT, Admin
   - Internal shared inbox
   - Frontend: Standalone Next.js app

5. Tenant Application (Port 8000)
   - Multi-tenant backend
   - INTAKE, DRAFT, SETTLE, CONNECT, VERIFY APIs
   - Frontend: Customer Portal (separate Next.js app)

6. SaaS Admin (Port 3001) - Centralized Admin Dashboard
   - Centralized authentication (Clerk)
   - Admin dashboard
   - System configuration
   - Frontend: Standalone Next.js app
```

---

## 🏛️ **STANDALONE SERVICE ARCHITECTURE WITH CLERK AUTHENTICATION**

### **1. Standalone Service Structure** ✅

**CS-Support Service is a completely standalone service:**

```
┌─────────────────────────────────────────────────────────────────┐
│         CS-SUPPORT SERVICE (Standalone)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Repository: TrueVow-CS-Support/                          │  │
│  │  - Separate codebase                                     │  │
│  │  - Independent version control                           │  │
│  │  - Own deployment pipeline                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend + Backend: Next.js Application (Full-Stack)   │  │
│  │  - Port: 3003                                           │  │
│  │  - URL: support.truevow.com                            │  │
│  │  - Clerk authentication integrated                      │  │
│  │  - No dependency on SaaS Admin                           │  │
│  │                                                          │  │
│  │  Frontend (App Router):                                 │  │
│  │  - app/(dashboard)/inbox/                              │  │
│  │  - app/(dashboard)/tickets/                            │  │
│  │  - app/(dashboard)/kb/                                 │  │
│  │  - app/(dashboard)/analytics/                          │  │
│  │                                                          │  │
│  │  Backend (API Routes):                                  │  │
│  │  - app/api/v1/tickets/                                 │  │
│  │  - app/api/v1/inbox/                                   │  │
│  │  - app/api/v1/kb/                                      │  │
│  │  - app/api/v1/ai/                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            │ Database Connection                │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database: Supabase (PostgreSQL)                        │  │
│  │  - Schema: cs_support                                   │  │
│  │  - Isolated schema (or separate database)                │  │
│  │  - Own migrations                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Deployment: Independent                                │  │
│  │  - Separate deployment pipeline                         │  │
│  │  - Independent scaling                                  │  │
│  │  - Own monitoring and logging                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Clerk Authentication
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CLERK AUTHENTICATION SERVICE                │
│              (Shared Across All Services)                      │
│                                                                 │
│  - Single Clerk application/organization                       │
│  - All services use same Clerk app                             │
│  - SSO across services                                          │
│  - Independent token verification per service                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- ✅ **Separate Repository:** `TrueVow-CS-Support/`
- ✅ **Separate Frontend + Backend:** Next.js full-stack app (Port 3003)
- ✅ **Separate Database:** Supabase with schema isolation (or separate database)
- ✅ **Separate Deployment:** Independent deployment pipeline
- ✅ **No Dependency on SaaS Admin:** Completely standalone

**Service Structure:**
```
TrueVow-CS-Support/ (Standalone Repository)
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── inbox/                # Shared Inbox UI
│   │   │   ├── page.tsx         # Inbox list page
│   │   │   └── [id]/page.tsx    # Conversation detail page
│   │   ├── tickets/              # Ticket management UI
│   │   ├── kb/                   # Knowledge Base UI
│   │   ├── analytics/            # Analytics dashboard UI
│   │   └── settings/             # Settings page
│   ├── api/                      # API routes (Backend)
│   │   └── v1/                   # API v1 endpoints
│   │       ├── tickets/          # Ticket API
│   │       ├── inbox/            # Inbox API
│   │       ├── kb/               # Knowledge Base API
│   │       ├── ai/               # AI Agent API
│   │       └── analytics/        # Analytics API
│   └── (auth)/                   # Authentication pages
│       ├── sign-in/              # Sign in page
│       └── sign-up/              # Sign up page
├── components/                   # React components
│   ├── inbox/                    # Inbox components
│   ├── tickets/                  # Ticket components
│   ├── kb/                       # KB components
│   └── shared/                   # Shared components
├── lib/                          # Utilities, API clients
│   ├── integrations/             # External service clients
│   │   ├── sendgrid.ts           # SendGrid client
│   │   ├── twilio.ts             # Twilio client
│   │   ├── anthropic.ts          # Claude client
│   │   └── kimi.ts                # Kimi client
│   └── utils/                    # Utility functions
├── public/                       # Static assets
├── middleware.ts                 # Clerk middleware
├── package.json                  # Dependencies (including Clerk)
└── .env.local                    # Environment variables
```

---

### **2. Clerk Authentication - How It Works** 🔐

**Clerk is centralized, but each service uses it independently:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLERK = Centralized Security Guard           │
│              (One Clerk Account/Organization)                    │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ↓                   ↓                   ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Each Service │   │ Each Service │   │ Each Service │
│ = Own Front  │   │ = Own Front  │   │ = Own Front  │
│    Door      │   │    Door      │   │    Door      │
│              │   │              │   │              │
│ Uses Clerk   │   │ Uses Clerk   │   │ Uses Clerk   │
│ SDK Directly │   │ SDK Directly │   │ SDK Directly │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        │                   │                   │
        ↓                   ↓                   ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ JWT Tokens   │   │ JWT Tokens   │   │ JWT Tokens   │
│ Work         │   │ Work         │   │ Work         │
│ Everywhere   │   │ Everywhere   │   │ Everywhere   │
└──────────────┘   └──────────────┘   └──────────────┘
```

**How It Works:**

1. **User logs in via CS-Support Service frontend** → Clerk login page
2. **Clerk validates credentials** → Creates JWT token
3. **Clerk redirects back to CS-Support Service** → With JWT token in session
4. **CS-Support Service validates token** → Using Clerk's public key (no need to ask SaaS Admin)

**Key Points:**
- ✅ **CS-Support Service uses Clerk SDK directly** (installed via `npm install @clerk/nextjs`)
- ✅ **No dependency on SaaS Admin** — CS-Support Service authenticates users directly with Clerk
- ✅ **Same users, different services** — Users can access multiple services with same credentials (SSO)
- ✅ **Independent deployment** — CS-Support Service can be deployed without affecting other services

---

### **3. Shared Clerk Application (Approach 1 - Recommended)** ✅

**One Clerk application/organization for all services:**

```
┌─────────────────────────────────────────────────────────────────┐
│              CLERK APPLICATION (Shared)                          │
│                                                                 │
│  Application Name: TrueVow Enterprise                          │
│  Organization: TrueVow                                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Redirect URLs Configured:                               │  │
│  │  - support.truevow.com/* (CS-Support Service)            │  │
│  │  - sales.truevow.com/* (Sales-CRM Service)              │  │
│  │  - internal.truevow.com/* (Internal Ops Service)        │  │
│  │  - admin.truevow.com/* (Platform Service)               │  │
│  │  - portal.truevow.com/* (Tenant Service)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Users:                                                   │  │
│  │  - Support agents                                        │  │
│  │  - Customer Success Managers (CSMs)                     │  │
│  │  - Sales executives                                      │  │
│  │  - Administrators                                        │  │
│  │  - Platform engineers                                    │  │
│  │  - All TrueVow employees                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Benefits:                                                      │
│  ✅ Single sign-on (SSO) across all services                    │
│  ✅ Unified user management                                    │
│  ✅ Same credentials work everywhere                           │
│  ✅ Centralized user administration                            │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits of Shared Clerk Application:**
- ✅ **Single Sign-On (SSO):** Users sign in once, access all services
- ✅ **Unified User Management:** One place to manage all users
- ✅ **Same Credentials:** Users use same email/password everywhere
- ✅ **Centralized Administration:** Admins manage users in one place

---

### **4. Authentication Flow Diagram** 🔄

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER BROWSER                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 1. Navigate to support.truevow.com
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         CS-SUPPORT FRONTEND (Next.js)                           │
│         Port: 3003                                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ClerkProvider (from @clerk/nextjs)                      │  │
│  │  - Wraps entire app                                      │  │
│  │  - Manages authentication state                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            │ 2. Check auth status              │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  useAuth() hook                                           │  │
│  │  - isSignedIn: false                                      │  │
│  │  - Redirect to Clerk sign-in                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            │ 3. Redirect to Clerk              │
│                            ↓                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    CLERK AUTHENTICATION                        │
│              (Shared Application)                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. User enters credentials                              │  │
│  │  2. Clerk validates credentials                          │  │
│  │  3. Clerk generates JWT token                           │  │
│  │  4. Clerk redirects back to CS-Support                 │  │
│  │     with JWT token in session                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 4. JWT Token returned
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         CS-SUPPORT FRONTEND (Next.js)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  useAuth() hook                                           │  │
│  │  - isSignedIn: true                                       │  │
│  │  - user: { id, email, firstName, ... }                    │  │
│  │  - getToken(): async () => "eyJhbGc..."                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            │ 5. API Request with JWT           │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Route Handler (Next.js API Route)                  │  │
│  │  export async function GET(request: Request) {          │  │
│  │    const { userId } = await auth()                       │  │
│  │    if (!userId) return new Response('Unauthorized', {    │  │
│  │      status: 401                                         │  │
│  │    })                                                    │  │
│  │    // Process request with authenticated user            │  │
│  │    return Response.json({ tickets: [...] })              │  │
│  │  }                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 6. Database Query
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         DATABASE (Supabase PostgreSQL)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Query: SELECT * FROM support_tickets                   │  │
│  │  WHERE assigned_to = userId                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 7. Return data
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         CS-SUPPORT FRONTEND (Next.js)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Display Inbox                                            │  │
│  │  {tickets.map(ticket => <TicketCard {...ticket} />)}    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ **No SaaS Admin involvement** — Frontend and backend communicate directly with Clerk
- ✅ **Direct Clerk integration** — CS-Support Service uses Clerk SDK independently
- ✅ **Token verification** — Backend verifies tokens directly with Clerk API
- ✅ **Independent authentication** — No dependency on other services

---

### **5. Code Examples** 💻

#### **Frontend: Next.js + Clerk Integration**

**Installation:**
```bash
npm install @clerk/nextjs
```

**Environment Variables (`.env.local`):**
```env
# Clerk Authentication (Shared Application)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# CS-Support Service Configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL=postgresql://...

# LLM API Keys (ONLY in CS-Support Service)
ANTHROPIC_API_KEY=sk-ant-...
KIMI_API_KEY=...

# External Services
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

**App Layout (`app/layout.tsx`):**
```typescript
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**Middleware (`middleware.ts`):**
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**Protected Route (`app/(dashboard)/inbox/page.tsx`):**
```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { InboxList } from '@/components/inbox/InboxList'

export default async function InboxPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  // User is authenticated - show inbox
  return <InboxList userId={userId} />
}
```

**API Route (`app/api/v1/tickets/route.ts`):**
```typescript
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  // Verify authentication (no SaaS Admin needed)
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Get tickets for authenticated user
  const tickets = await db.query(
    'SELECT * FROM support_tickets WHERE assigned_to = $1',
    [userId]
  )
  
  return NextResponse.json({ tickets })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  const body = await request.json()
  
  // Create ticket
  const ticket = await db.query(
    'INSERT INTO support_tickets (subject, message, created_by) VALUES ($1, $2, $3) RETURNING *',
    [body.subject, body.message, userId]
  )
  
  return NextResponse.json({ ticket: ticket[0] })
}
```

**Component Example (`components/inbox/InboxList.tsx`):**
```typescript
'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export function InboxList({ userId }: { userId: string }) {
  const { user, isLoaded } = useUser()
  const [tickets, setTickets] = useState([])
  
  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/v1/tickets')
        .then(res => res.json())
        .then(data => setTickets(data.tickets))
    }
  }, [user, isLoaded])
  
  if (!isLoaded) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <h2>Your Inbox</h2>
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} {...ticket} />
      ))}
    </div>
  )
}
```

---

### **6. Environment Variable Configuration** ⚙️

#### **Frontend + Backend Environment Variables (`.env.local`):**

```env
# Clerk Authentication (Shared Application - Approach 1)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# CS-Support Service Configuration
SERVICE_NAME=truevow-cs-support-service
SERVICE_PORT=3003
NEXT_PUBLIC_APP_URL=https://support.truevow.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_SCHEMA=cs_support

# LLM API Keys (ONLY in CS-Support Service - Critical Security)
ANTHROPIC_API_KEY=sk-ant-...
KIMI_API_KEY=...

# External Services
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Voice AI (Deepgram, Cartesia)
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...

# Service-to-Service API Keys (for calling other services)
SALES_SERVICE_API_KEY=...
PLATFORM_SERVICE_API_KEY=...
INTERNAL_OPS_SERVICE_API_KEY=...
TENANT_SERVICE_API_KEY=...

# CS-Support Service API Key (for other services to call us)
CS_SUPPORT_SERVICE_API_KEY=...
```

---

### **7. No Dependency on SaaS Admin** ✅

**Key Points:**

1. **✅ Direct Clerk Integration:**
   - CS-Support Service uses Clerk SDK directly
   - No need to go through SaaS Admin
   - Frontend and backend communicate directly with Clerk

2. **✅ Independent Authentication:**
   - Each service authenticates users independently
   - Token verification happens directly with Clerk API
   - No SaaS Admin involvement in authentication flow

3. **✅ Independent Deployment:**
   - CS-Support Service can be deployed independently
   - No dependency on SaaS Admin being available
   - Can scale independently

4. **✅ Service-to-Service Communication:**
   - Uses API keys (not Clerk tokens) for service-to-service calls
   - Service-to-service authentication is separate from user authentication
   - Example: Sales Service calls CS-Support Service using API key

**Service-to-Service vs User Authentication:**

```
┌─────────────────────────────────────────────────────────┐
│              TWO AUTHENTICATION TYPES                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. USER AUTHENTICATION (Clerk)                         │
│     Frontend → Backend                                   │
│     User signs in → Gets JWT → Calls API                │
│     NO SAAS ADMIN NEEDED                                │
│                                                          │
│  2. SERVICE-TO-SERVICE (API Keys)                      │
│     Service A → Service B                               │
│     Uses X-API-Key header                               │
│     NO SAAS ADMIN NEEDED                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### **8. User Mapping** 👥

**Clerk User → Support Team Member Mapping:**

```typescript
// Database Schema (Prisma example)
model SupportTeamMember {
  id            String   @id @default(uuid())
  clerkUserId   String   @unique @map("clerk_user_id")
  firstName     String
  lastName      String
  email         String   @unique
  role          String   // 'support_agent', 'csm', 'support_manager', 'head_of_cs'
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("support_team_members")
}

// API Route Helper
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function getCurrentTeamMember() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }
  
  // Map Clerk user ID to support team member
  const teamMember = await db.supportTeamMember.findUnique({
    where: { clerkUserId: userId }
  })
  
  return teamMember
}
```

---

### **9. Summary** 📋

**CS-Support Service Architecture:**

- ✅ **Standalone Service:** Separate repository, frontend, backend, database
- ✅ **Clerk Authentication:** Direct integration, no SaaS Admin dependency
- ✅ **Shared Clerk App (Approach 1):** SSO across all services
- ✅ **Independent Deployment:** Can deploy without affecting other services
- ✅ **Service Isolation:** Complete independence from other services
- ✅ **LLM Isolation:** Only CS-Support Service has LLM access (critical security)

**Key Benefits:**

- ✅ **No SaaS Admin Dependency:** Authenticates users directly with Clerk
- ✅ **SSO:** Users can access multiple services with same credentials
- ✅ **Scalability:** Can scale independently
- ✅ **Security:** Proper authentication and authorization, LLM isolation
- ✅ **Maintainability:** Clear separation of concerns

---

**This architecture ensures CS-Support Service is completely standalone while maintaining unified authentication through Clerk (Approach 1: Shared Application).**

### CS-Support Service Responsibilities

**Core Responsibilities:**
- ✅ **Support Tickets:** Full lifecycle ticket management (creation, assignment, resolution)
- ✅ **Shared Inbox:** HelpScout-like interface, unified inbox for all customer communications
- ✅ **Knowledge Base:** Article management, search, categories (customer-facing and internal)
- ✅ **SLA Management:** SLA tracking, response time monitoring, escalations
- ✅ **Multi-Channel Support:** Email, SMS, WhatsApp (via Twilio), Facebook, Chatbot, Forms
- ✅ **Customer Portal:** Self-service portal, ticket submission, KB access
- ✅ **CSAT/NPS Surveys:** Customer satisfaction tracking and analysis
- ✅ **Customer Success:** Proactive customer health monitoring and success initiatives
- ✅ **Automation Rules:** Auto-assignment, auto-responses, workflow automation
- ✅ **Support Analytics:** Ticket volume, resolution time, CSAT scores, agent performance
- ✅ **Support Reporting:** Agent performance reports, SLA compliance reports

**Users:**
- **Support Team:** Support Agents, Support Manager (primary users)
- **Customer Success Team:** CSMs (Customer Success Managers), Head of CS
- **Sales Team:** Sales Representatives (via API for first-touch communications)
- **Management:** For analytics and reporting

**Key Features:**
- HelpScout-like shared inbox (multi-channel unified interface)
- Multi-channel support (Email, SMS, WhatsApp (via Twilio), Facebook, Chatbot, Forms)
- AI-powered responses (Claude for general, Kimi for specialized)
- Team collaboration (activity feeds, performance dashboards, team channels)
- Performance analytics (agent metrics, CSAT, SLA compliance)
- Customer self-service portal
- Knowledge base with search
- SLA tracking and escalations

---

## User Personas

### 1. **Support Agent (Customer Solutions Engineer) (Primary User)**
- **Role:** Customer support representative, technical support, first line
- **Type:** Individual Contributor (IC) - No direct reports
- **Goals:** Resolve customer issues quickly, maintain high CSAT scores, escalate appropriately
- **Pain Points:** Multiple tools, fragmented workflows, repetitive questions, unclear escalation paths
- **Needs:** Unified inbox, AI suggestions, quick access to KB, collaboration tools, clear escalation process
- **Usage:** Daily, 6-8 hours/day
- **Work Schedule:** Evening/Night (6 PM - 2 AM PKT) to match USA business hours
- **Key Responsibilities:**
  - Technical Support: 50% (60 hours/month)
  - Billing Support: 20% (24 hours/month) - View only, escalates to CSM for decisions
  - Documentation: 15% (18 hours/month)
  - Escalation: 10% (12 hours/month) - Escalates to CSM when escalation countdown starts (24-48 hours)
  - Reporting: 5% (6 hours/month)
- **AI + Human Workflow:**
  - AI Support Agent handles first contact
  - Human Support Agent takes over for complex issues
  - CSM monitors conversations and intervenes when escalated
- **Decision Authority:**
  - None (view only, escalates to CSM)
- **Escalation Triggers:**
  - Time-based: Issue unresolved after 24-48 hours
  - Complexity-based: Support Agent identifies need for CSM
  - Billing decision: Refund, dispute, subscription change needed

### 2. **Support Manager**
- **Role:** Support team manager
- **Reports To:** Head of Customer Success
- **Direct Reports:** Customer Solutions Engineers (Support Agents)
- **Goals:** Monitor team performance, ensure SLA compliance, improve processes, manage support team
- **Pain Points:** Lack of visibility, manual reporting, difficult to track metrics
- **Needs:** Performance dashboards, SLA tracking, analytics, team management, escalation oversight
- **Usage:** Daily, 2-4 hours/day
- **Key Responsibilities:**
  - Team management (daily standups, coaching)
  - SLA compliance monitoring
  - Performance tracking
  - Escalation oversight
  - Process improvement

### 3. **Customer Success Manager (CSM)**
- **Role:** Customer success specialist, head of assigned accounts
- **Goals:** Proactive customer health monitoring, reduce churn, increase expansion, account ownership
- **Pain Points:** Reactive support, no visibility into customer health, manual tracking
- **Needs:** Customer health scores, proactive alerts, success playbooks, expansion tracking, account management tools
- **Usage:** Daily, 4-6 hours/day
- **Account Assignment:**
  - Premium/Founding Member: Dedicated CSM (1:20-30 ratio), no transition
  - Standard/INTAKE User: Onboarding CSM (first 3 months), then support pool with CSM monitoring (1:50-75 ratio)
  - Free Tier: Support pool only, CSM on escalation
- **Key Responsibilities:**
  - Account management (30% time)
  - Customer onboarding (20% time)
  - Dispute handling (15% time)
  - Refund management (10% time)
  - Billing operations (10% time)
  - Team coordination (10% time)
  - Reporting (5% time)
- **Decision Authority:**
  - Customer onboarding
  - Dispute handling
  - Subscription changes (Free/Standard/INTAKE User)
  - Refund requests < $100

### 4. **Sales Representative (Secondary User)**
- **Role:** Sales team member
- **Goals:** Respond to first-touch inquiries, convert leads
- **Pain Points:** First-touch inquiries go to support, no visibility into pre-sale conversations
- **Needs:** Access to pre-sale conversations, ability to respond, convert to leads
- **Usage:** Daily, 1-2 hours/day (via Sales CRM Service API)

### 5. **Head of Customer Success (VP CS)**
- **Role:** Customer Success Organization leader
- **Reports To:** CEO/COO
- **Direct Reports:** CSMs (by region), Support Manager, Security Manager, Compliance Manager
- **Goals:** Oversee customer success strategy, team performance, retention, customer satisfaction
- **Pain Points:** Lack of visibility into customer health, team performance, revenue attribution
- **Needs:** Executive dashboards, team performance metrics, customer health trends, RevOps integration
- **Usage:** Daily, 2-3 hours/day
- **Work Schedule:** Flexible (2 PM - 10 PM PKT) to cover both day and evening teams
- **Key Responsibilities:**
  - Customer success strategy
  - Team management
  - Customer satisfaction oversight
  - Cross-functional collaboration (Sales, Platform, Finance)
  - Strategic planning
- **Decision Authority:**
  - Customer onboarding strategy
  - Dispute handling (approval)
  - Refund requests $100-$500
  - Support team hiring
  - Customer success initiatives

---

## Business Objectives

### Primary Goals
1. **Improve Customer Satisfaction:** Reduce response times, increase CSAT scores
2. **Increase Efficiency:** Reduce support ticket volume through self-service and AI
3. **Reduce Costs:** Replace third-party solutions (HelpScout, Crisp, Intercom)
4. **Enable Customer Success:** Proactive customer health monitoring and intervention
5. **Support Sales:** Enable Sales team to handle first-touch communications

### Success Criteria
- **CSAT Score:** >4.5/5.0 (90%+ satisfaction) - Target from organizational structure
- **NPS Score:** >50 - Target from organizational structure
- **Churn Rate:** <5% monthly - Target from organizational structure
- **First Response Time:** <2 hours (90th percentile)
- **Resolution Time:** <24 hours (90th percentile)
- **SLA Compliance:** >95% of tickets within SLA
- **Self-Service Rate:** 40%+ of inquiries resolved via KB
- **Cost Savings:** $1,000+/month vs. third-party solutions
- **Support Ticket Volume:** Track and reduce through self-service and AI
- **Account Expansion Rate:** Track upsell opportunities and expansion
- **Customer Health Score:** Monitor and improve customer health trends

---

## Features & Requirements

### 1. Shared Inbox (Core Feature)

#### 1.1 Unified Inbox View
- **Inbox List:** All conversations in one place
- **Filtering:** By status, channel, assignee, stage (pre-sale/post-sale), priority
- **Search:** Full-text search across conversations
- **Sorting:** By date, priority, status, assignee
- **Real-time Updates:** Polling or WebSocket for live updates
- **Keyboard Shortcuts:** Power user shortcuts for efficiency

**Acceptance Criteria:**
- ✅ Inbox loads with all conversations
- ✅ Filters work correctly (status, channel, assignee, stage)
- ✅ Search returns relevant results
- ✅ Real-time updates reflect new messages
- ✅ Keyboard shortcuts are functional

#### 1.2 Conversation Detail View
- **Thread View:** Full conversation thread with threading
- **Customer Profile:** Customer details sidebar
- **Reply Form:** Rich text editor with AI suggestions
- **Internal Notes:** Private notes visible only to team
- **Attachments:** View and download attachments
- **Activity Timeline:** All actions on the conversation
- **Participants:** Add/remove participants
- **Escalation:** Escalate to manager or specialist

**Acceptance Criteria:**
- ✅ Conversation thread displays correctly
- ✅ Customer profile shows accurate information
- ✅ Reply form works with rich text and AI suggestions
- ✅ Internal notes are private and searchable
- ✅ Attachments can be viewed and downloaded
- ✅ Activity timeline shows all actions
- ✅ Participants can be added/removed
- ✅ Escalation flow works correctly

#### 1.3 Multi-Channel Support
- **Email:** SendGrid integration, email threading
- **SMS:** Twilio SMS integration, SMS threading
- **WhatsApp:** Twilio WhatsApp Business API integration, WhatsApp threading (alternative to SMS)
- **Calls:** Twilio call integration, call logging
- **Web Chat:** Chat widget integration, real-time chat
- **Facebook Messenger:** Facebook integration, message threading
- **Forms:** Contact forms, demo requests, form submissions

**Acceptance Criteria:**
- ✅ All channels create tickets in unified inbox
- ✅ Channel-specific threading works correctly
- ✅ Messages are properly attributed to channels
- ✅ Channel icons and labels are accurate
- ✅ Webhooks receive and process messages correctly

---

### 2. Support Ticket Management

#### 2.1 Ticket Lifecycle
- **Create:** Auto-create from channels or manual creation
- **Assign:** Auto-assign or manual assignment
- **Status:** Open, Pending, Resolved, Closed
- **Priority:** Low, Medium, High, Urgent
- **Tags:** Custom tags for categorization
- **SLA Tracking:** Automatic SLA tracking and alerts
- **Resolution:** Mark as resolved with notes
- **Reopen:** Reopen closed tickets

**Acceptance Criteria:**
- ✅ Tickets are created automatically from channels
- ✅ Assignment works (auto and manual)
- ✅ Status updates are tracked and logged
- ✅ Priority levels are enforced
- ✅ Tags can be added and filtered
- ✅ SLA tracking is accurate
- ✅ Resolution flow works correctly
- ✅ Tickets can be reopened

#### 2.2 Ticket Routing & Automation
- **Auto-Assignment:** Rules-based auto-assignment
- **Round-Robin:** Distribute tickets evenly
- **Skill-Based:** Assign based on agent skills
- **Workload-Based:** Assign based on current workload
- **Escalation Rules:** Automatic escalation based on SLA
- **Tagging Rules:** Auto-tag based on content
- **Status Rules:** Auto-update status based on conditions

**Acceptance Criteria:**
- ✅ Auto-assignment rules work correctly
- ✅ Round-robin distributes evenly
- ✅ Skill-based assignment matches skills
- ✅ Workload-based assignment considers capacity
- ✅ Escalation rules trigger correctly
- ✅ Tagging rules apply tags automatically
- ✅ Status rules update status automatically

---

### 3. AI-Powered Support

#### 3.1 AI Response Suggestions
- **Auto-Analysis:** Analyze incoming messages automatically
- **Confidence Levels:** High (≥80%), Medium (50-80%), Low (<50%)
- **Response Suggestions:** Context-aware response suggestions
- **Knowledge Base Integration:** Reference relevant KB articles
- **Multi-LLM Support:** Claude for general, Kimi for specialized
- **Empathy Detection:** Detect customer sentiment and adjust tone

**AI + Human Hybrid Model:**
- **AI Support Agent:** First contact (chat, email), common issue resolution, FAQ responses, ticket routing, low-level fixes
- **Human Support Agent:** Complex technical issues, escalated tickets, billing questions (view only), escalates to CSM for billing decisions
- **Workflow:** Customer Issue → AI Support Agent (First Contact) → Human Support Agent (If complex) → CSM (If billing decision)

**Acceptance Criteria:**
- ✅ Auto-analysis runs on new messages
- ✅ Confidence levels are accurate
- ✅ Response suggestions are relevant
- ✅ KB articles are referenced correctly
- ✅ Multi-LLM support works
- ✅ Empathy detection adjusts tone appropriately
- ✅ AI Support Agent handles first contact correctly
- ✅ Human Support Agent takes over for complex issues
- ✅ Escalation to CSM works for billing decisions

#### 3.2 Auto-Response
- **High Confidence Auto-Fill:** Auto-fill reply box for high confidence
- **Medium Confidence Suggestions:** Show suggestion card
- **Low Confidence Escalation:** Flag for manual review
- **Template Matching:** Match to email templates
- **Sentiment Analysis:** Detect urgency and sentiment

**Acceptance Criteria:**
- ✅ High confidence auto-fills correctly
- ✅ Medium confidence shows suggestions
- ✅ Low confidence flags for review
- ✅ Template matching works
- ✅ Sentiment analysis is accurate

---

### 4. Knowledge Base

#### 4.1 Article Management
- **Create Articles:** Create KB articles with rich text
- **Categorize:** Organize by categories and tags
- **Search:** Full-text search across articles
- **Version Control:** Track article versions
- **Publishing:** Draft, review, publish workflow
- **Analytics:** View article views and helpfulness

**Acceptance Criteria:**
- ✅ Articles can be created and edited
- ✅ Categorization works correctly
- ✅ Search returns relevant articles
- ✅ Version history is tracked
- ✅ Publishing workflow works
- ✅ Analytics are accurate

#### 4.2 Customer Self-Service Portal
- **Public KB:** Customer-facing knowledge base
- **Article Search:** Search for help articles
- **Submit Ticket:** Submit ticket from portal
- **Track Tickets:** View ticket status
- **Community Forum:** User community (future)

**Acceptance Criteria:**
- ✅ Public KB is accessible to customers
- ✅ Article search works
- ✅ Ticket submission creates ticket
- ✅ Ticket tracking shows status
- ✅ Portal is mobile-friendly

---

### 5. Team Collaboration

#### 5.1 Activity Feed
- **Activity Timeline:** All team activities in one place
- **Activity Types:** Ticket creation, assignment, resolution, messages, status changes, SLA breaches
- **Filtering:** By activity type, agent, ticket, date
- **Real-time Updates:** Live activity feed
- **Notifications:** Notify on important activities

**Acceptance Criteria:**
- ✅ Activity feed shows all activities
- ✅ Filtering works correctly
- ✅ Real-time updates are accurate
- ✅ Notifications trigger appropriately

#### 5.2 Team Performance Dashboard
- **Agent Metrics:** Tickets assigned, resolved, response times
- **CSAT Scores:** Customer satisfaction per agent
- **SLA Compliance:** SLA compliance rates
- **Performance Rankings:** Agent performance rankings
- **Charts & Visualizations:** Performance charts

**Acceptance Criteria:**
- ✅ Agent metrics are accurate
- ✅ CSAT scores are calculated correctly
- ✅ SLA compliance is tracked
- ✅ Rankings are fair and accurate
- ✅ Charts display correctly

#### 5.3 Team Channels
- **Real-time Chat:** Team chat channels
- **Channel Management:** Create, join, leave channels
- **Message Reactions:** React to messages
- **Pins:** Pin important messages
- **WebSocket:** Real-time messaging

**Acceptance Criteria:**
- ✅ Team chat works in real-time
- ✅ Channel management is functional
- ✅ Reactions and pins work
- ✅ WebSocket connection is stable

---

### 6. Customer Success

#### 6.1 Customer Health Scoring
- **Health Score:** Calculate customer health score
- **Health Factors:** Usage, support tickets, NPS, payment status, engagement
- **Health Levels:** Healthy, At Risk, Critical
- **Alerts:** Alert on health score changes
- **Trends:** Track health score over time

**Acceptance Criteria:**
- ✅ Health scores are calculated accurately
- ✅ Health factors are weighted correctly
- ✅ Health levels are accurate
- ✅ Alerts trigger appropriately
- ✅ Trends are visible

#### 6.2 Proactive Outreach
- **At-Risk Alerts:** Alert on at-risk customers
- **Success Playbooks:** Automated success playbooks
- **Engagement Tracking:** Track customer engagement
- **Expansion Opportunities:** Identify upsell opportunities
- **Renewal Tracking:** Track renewal dates and risk
- **Account Management:** CSM as head of accounts (account ownership model)
- **Monthly Health Checks:** For Standard/INTAKE User accounts post-onboarding
- **Escalation Mechanism:** CSM intervenes when escalated (24-48 hour countdown)

**Account Assignment Model:**
- **Premium/Founding Member:** Dedicated CSM (1:20-30 ratio), no transition
- **Standard/INTAKE User:** Onboarding CSM (first 3 months), then support pool with CSM monitoring (1:50-75 ratio)
- **Free Tier:** Support pool only, CSM on escalation

**Escalation Process:**
```
Customer Issue
    ↓
Support Agent (First Line)
    ↓ (if unresolved after 24-48 hours)
Escalation Countdown Starts
    ↓
CSM Notified (Account Owner)
    ↓
CSM Joins Conversation
    ↓
CSM Resolves Issue
```

**Acceptance Criteria:**
- ✅ At-risk alerts are timely
- ✅ Success playbooks execute correctly
- ✅ Engagement tracking is accurate
- ✅ Expansion opportunities are identified
- ✅ Renewal tracking is accurate
- ✅ Account assignment model works correctly
- ✅ Escalation mechanism triggers appropriately
- ✅ CSM capacity planning is accurate

---

### 7. Analytics & Reporting

#### 7.1 Support Metrics
- **Ticket Volume:** Total tickets, tickets by channel, tickets by status
- **Response Times:** First response time, average response time
- **Resolution Times:** Average resolution time, resolution time by priority
- **SLA Compliance:** SLA compliance rates, SLA breaches
- **Channel Performance:** Performance by channel
- **Agent Performance:** Individual agent metrics

**Acceptance Criteria:**
- ✅ All metrics are calculated correctly
- ✅ Metrics update in real-time
- ✅ Historical data is available
- ✅ Comparisons work (period over period)

#### 7.2 Customer Satisfaction
- **CSAT Scores:** Customer satisfaction scores
- **NPS Scores:** Net Promoter Score
- **Survey Responses:** Survey response rates
- **Sentiment Analysis:** Customer sentiment trends
- **Feedback Analysis:** Analyze customer feedback

**Acceptance Criteria:**
- ✅ CSAT scores are accurate
- ✅ NPS scores are calculated correctly
- ✅ Survey responses are tracked
- ✅ Sentiment analysis is accurate
- ✅ Feedback analysis provides insights

---

### 8. AI Digital Agents Module

#### 8.1 Overview

The CS-Support Service includes a comprehensive **AI Digital Agents Module** that provides intelligent, automated assistance across all customer success and support functions. These agents act as **always-on, data-driven teammates** that support (not replace) human CSMs and Support Agents across the customer lifecycle.

**Core Principle:** AI agents are workflow + insight layers that watch customers 24/7, handle repetitive engagement, and give human CSMs/Support Agents the right signal, at the right time, with the right recommended next step.

**Important Distinction:**
- **Internal Designations:** Technical names (Customer Success Digital Agent, Customer Support Digital Agent, etc.) are for **internal use only** - job descriptions, task assignments, system architecture, and team organization
- **Customer-Facing Personas:** When customers interact with agents, they encounter **human names** (e.g., "I'm Benjamin, how can I help you?") - friendly, approachable, and human-like
- **Persona Mapping:** Each internal agent type can have multiple customer-facing personas with different names for variety and personalization

**Realistic Assessment:**
- ✅ **Feasible to Build:** All agents are built on proven LLM technology (Claude, Kimi) with clear workflows
- ✅ **Functional with Human-in-the-Loop:** Human oversight ensures quality, with continuous training from feedback
- ✅ **Voice Capabilities:** Customer-facing agents (Support, Solutions Engineer) will have voice capabilities via Deepgram (speech-to-text) and Cartesia (text-to-speech)
- ✅ **Voice Orchestration:** Adopts unified voice orchestration architecture from Sales CRM Service with isolated STT service instances
- ✅ **Continuous Learning:** Agents learn from human corrections, customer feedback, and success patterns
- ✅ **Strategic Value:** Scale CS/Support without headcount explosion, offload repetitive work, provide insights

**Agent Architecture:**
- **Multi-LLM Support:** Claude (general), Kimi (specialized)
- **Voice Capabilities:** Deepgram (STT), Cartesia (TTS) for customer-facing agents
- **Voice Orchestration:** Unified voice service architecture with isolated STT instances per service (following Sales CRM pattern)
- **Customer-Facing Personas:** Human names (Benjamin, Sarah, Alex, etc.) for customer interactions
- **Confidence-Based Actions:** High (≥80%), Medium (50-80%), Low (<50%)
- **Human Oversight:** All agents have human oversight and escalation paths
- **Activity Tracking:** All agent activities tracked for RevOps attribution
- **Continuous Learning:** Agents learn from human interactions, feedback, and success patterns

---

#### 8.2 Customer Success Digital Agent

**Purpose:** Act as an always-on, data-driven teammate that supports (not replaces) human CSMs across the customer lifecycle for Standard/INTAKE User accounts.

**Core Responsibilities:**

##### 8.2.1 Proactive Monitoring and Alerts
- **Track Product Usage:** Monitor logins, feature adoption, service usage (INTAKE, SETTLE, DRAFT, CONNECT)
- **Support Activity Analysis:** Track support ticket volume, resolution times, escalation patterns
- **Churn Risk Detection:** Spot churn risks using signals like usage drops, payment issues, low engagement
- **Expansion Opportunities:** Identify upsell/expansion opportunities based on usage patterns and feature gaps
- **Alert CSM:** Ping human CSM with recommended actions when risks or opportunities are detected
- **Real-time Dashboards:** Provide CSM with real-time customer health dashboards

**Example Workflow:**
```
Customer Usage Drop Detected
    ↓
AI CS Agent Analyzes: Login frequency, feature usage, support tickets
    ↓
Identifies: No logins in 7 days, feature X not used, support ticket unresolved
    ↓
Calculates: Churn risk score = 75% (High Risk)
    ↓
Alerts CSM: "Customer at risk - recommend proactive outreach"
    ↓
Suggests Action: "Send personalized check-in email, offer training session"
```

##### 8.2.2 Personalized Onboarding and Guidance
- **Guided Setup Flows:** Guide new users through account setup, service configuration, team member invitations
- **In-App Tours:** Provide interactive product tours tailored to user role (Attorney, Paralegal, Admin)
- **Training Content Delivery:** Deliver training materials tailored to practice area, county, and user behavior
- **Progress Tracking:** Track onboarding progress, identify blockers, suggest next steps
- **Reduce Time-to-Value:** Help customers achieve first value (first booking, first report, first document) faster
- **Setup Error Prevention:** Catch common setup errors before they cause issues

**Example Workflow:**
```
New Customer Onboarded (Standard Tier)
    ↓
AI CS Agent: Sends welcome email with personalized setup guide
    ↓
Day 1: Guides through account setup, team member invitations
    ↓
Day 3: Delivers practice-area-specific training content
    ↓
Day 7: Checks progress, identifies if first booking completed
    ↓
If Not: Sends reminder with step-by-step guide
    ↓
Day 14: Confirms first value achieved, offers next steps
```

##### 8.2.3 Frontline Q&A and Support Triage
- **Common Questions:** Answer "how do I...?" questions in chat, email, or in-product
- **Help Center Integration:** Surface relevant KB articles based on question context
- **Support Triage:** Route complex issues to right human owner (CSM, Support Agent, Solutions Engineer) with context attached
- **Context Preservation:** Maintain conversation context when escalating to humans
- **Self-Service Enablement:** Encourage self-service by providing relevant resources

**Example Workflow:**
```
Customer Asks: "How do I set up automated booking reminders?"
    ↓
AI CS Agent: Analyzes question, searches KB
    ↓
Finds: Relevant KB article "Setting Up Booking Reminders"
    ↓
Responds: Provides step-by-step guide with article link
    ↓
If Customer Needs More Help: Routes to Support Agent with full context
```

##### 8.2.4 Workflow and Process Automation
- **Automated Follow-ups:** Draft and send check-in emails after milestones (go-live, renewal date approaching, feature not used yet)
- **Reminder Scheduling:** Schedule calls, training sessions, health checks based on customer lifecycle stage
- **CRM Integration:** Log notes, tasks, and activities into Sales-CRM Service automatically
- **Task Creation:** Create tasks for CSM based on customer signals (e.g., "Follow up on unused feature X")
- **Meeting Preparation:** Generate customer briefing documents before scheduled calls

**Example Workflow:**
```
Renewal Date Approaching (30 days out)
    ↓
AI CS Agent: Generates renewal check-in email
    ↓
Includes: Usage summary, value delivered, renewal benefits
    ↓
Schedules: CSM call reminder (14 days before renewal)
    ↓
Creates Task: "Prepare renewal proposal for Customer X"
    ↓
Logs Activity: "Renewal outreach initiated" in CRM
```

##### 8.2.5 Health Scoring and Reporting
- **Continuous Health Scoring:** Update account health scores using signals:
  - Usage depth (how many features used, how often)
  - NPS scores (if available)
  - Support ticket volume and resolution
  - Contract data (tier, renewal date, payment status)
  - Engagement metrics (logins, feature adoption)
- **Auto-Generate Reports:** Generate QBR (Quarterly Business Review) decks or success summaries for CSMs
- **Trend Analysis:** Identify health trends (improving, declining, stable)
- **Predictive Analytics:** Predict churn risk, expansion opportunities, upsell potential

**Example Workflow:**
```
Monthly Health Check (Standard/INTAKE User Account)
    ↓
AI CS Agent: Calculates health score from multiple signals
    ↓
Signals: Usage (8/10), Support (7/10), Payment (10/10), Engagement (6/10)
    ↓
Health Score: 7.75/10 (Healthy)
    ↓
Generates Report: "Customer health stable, opportunity to expand feature usage"
    ↓
Suggests Action: "Recommend SETTLE service if not using, offer training"
    ↓
Sends to CSM: Health report with recommended next steps
```

**Human Oversight & Training:**
- **CSM Monitors:** All AI CS Agent interactions visible in CSM dashboard
- **CSM Intervenes:** When complex accounts need attention, escalations occur, or strategic decisions required
- **CSM Reviews:** Automated onboarding progress, health reports, proactive campaigns
- **CSM Approves:** High-value actions (upsell offers, renewal proposals, strategic outreach)
- **Continuous Training:** CSM feedback on agent actions improves future recommendations
- **Human-in-the-Loop:** All critical decisions require human approval

**Workflow:**
```
New Customer (Standard/INTAKE User)
    ↓
AI CS Assistant (Automated Onboarding)
    ↓
CSM Monitors/Intervenes (If needed)
    ↓
Account Active (After 3 months)
    ↓
Transition to Support Pool (CSM Monitoring)
    ↓
AI CS Assistant (Monthly Health Checks)
```

**Account Assignment:**
- **Premium/Founding Member:** Human CSM only (no AI CS Assistant)
- **Standard/INTAKE User:** AI CS Assistant (first 3 months), then support pool with CSM monitoring
- **Free Tier:** Support pool only (no AI CS Assistant)

**RevOps Attribution:**
- **Customer Onboarded:** 10 points (indirect revenue: 10% credit if customer retained)
- **Customer Retained:** 15 points (indirect revenue: 10% credit)
- **Health Check Completed:** 2 points
- **Proactive Outreach Sent:** 1 point

**Acceptance Criteria:**
- ✅ Automated onboarding sequences execute correctly
- ✅ Training materials are delivered on schedule
- ✅ Progress tracking is accurate
- ✅ At-risk customers are identified correctly
- ✅ Health check reminders are sent appropriately
- ✅ CSM can monitor and intervene when needed
- ✅ All activities are tracked for RevOps attribution

---

#### 8.3 Customer Support Digital Agent

**Purpose:** Act as the first line of defense, handling routine inquiries and triaging complex issues to human agents, with voice capabilities for phone and chat interactions.

**Core Responsibilities:**

##### 8.3.1 First Contact and Voice Interactions
- **Multi-Channel First Contact:** Handle first contact via chat, email, SMS, WhatsApp, phone (voice), web chat
- **Voice Capabilities:** 
  - **Deepgram Integration:** Speech-to-text for phone calls and voice chat
  - **Cartesia Integration:** Text-to-speech for natural voice responses
  - **Voice Conversation Handling:** Understand customer intent from voice, respond naturally
- **Customer Greeting:** Greet customers warmly, understand their issues, set expectations
- **Initial Response:** Provide immediate acknowledgment and initial guidance
- **Context Gathering:** Collect relevant information (account details, issue description, priority)

**Example Voice Workflow:**
```
Customer Calls Support Line
    ↓
Benjamin (Voice): "Hello! I'm Benjamin, your digital agent. How can I help you today?"
    ↓
Customer: "I can't log into my account"
    ↓
Deepgram (STT): Converts speech to text
    ↓
[Behind the scenes: Customer Support Digital Agent analyzes issue, checks account status]
    ↓
Benjamin (Cartesia TTS): "I can help with that, [Customer Name]. Let me verify your account. Can you provide your email?"
    ↓
Customer: Provides email
    ↓
[Behind the scenes: Customer Support Digital Agent checks account, identifies password reset needed]
    ↓
Benjamin (Cartesia TTS): "I see your account is active. I'll send you a password reset link right away. Check your email in 2 minutes."
    ↓
Resolves Issue: Sends password reset email, closes ticket
[Customer always experiences Benjamin, but internal agents power the capabilities]
```

##### 8.3.2 Common Issue Resolution
- **Routine Issue Handling:** Resolve common issues automatically:
  - Password resets, account access issues
  - Billing questions (view-only, escalate decisions to CSM)
  - Feature questions ("How do I...?")
  - Service status inquiries
  - Basic troubleshooting
- **FAQ Responses:** Answer frequently asked questions with accurate, up-to-date information
- **KB Article Integration:** Provide relevant KB article links with explanations
- **Auto-Resolution:** Auto-close tickets when issues are resolved
- **Customer Confirmation:** Confirm resolution with customer before closing

**Example Workflow:**
```
Customer Email: "How do I export my reports?"
    ↓
AI Support Agent: Analyzes question, searches KB
    ↓
Finds: KB article "Exporting SETTLE Reports"
    ↓
Responds: "You can export reports by clicking the Export button in the top right. Here's a detailed guide: [KB link]"
    ↓
If Customer Confirms: "That worked, thanks!" → Auto-closes ticket
    ↓
If Customer Needs More Help: Escalates to Human Support Agent
```

##### 8.3.3 Intelligent Ticket Triage
- **Smart Categorization:** Categorize tickets by type (technical, billing, feature request, bug), priority (Low, Medium, High, Urgent), complexity (Simple, Moderate, Complex)
- **Intelligent Routing:** Route tickets to appropriate agents based on:
  - Issue type and complexity
  - Agent expertise and availability
  - Customer tier (Premium gets priority routing)
  - SLA requirements
- **SLA Management:** Set SLA expectations based on priority and customer tier
- **Duplicate Detection:** Identify duplicate tickets and merge or link them
- **Context Preservation:** Attach full conversation context when routing

**Example Workflow:**
```
New Ticket Created: "API integration not working"
    ↓
AI Support Agent: Analyzes ticket
    ↓
Categorizes: Technical, High Priority, Complex
    ↓
Identifies: Requires Solutions Engineer expertise
    ↓
Routes To: Solutions Engineer Agent (AI) first, then Human if needed
    ↓
Attaches Context: Customer tier, previous tickets, account details
```

##### 8.3.4 Response Suggestions and Context
- **Context-Aware Suggestions:** Generate response suggestions for human agents based on:
  - Customer history and context
  - Similar past resolutions
  - Relevant KB articles
  - Best practices
- **Multi-LLM Support:** Use Claude for general responses, Kimi for technical issues
- **Confidence Scoring:** Provide confidence scores for suggestions (High/Medium/Low)
- **Escalation Recommendations:** Suggest when to escalate to CSM or Engineering

**Example Workflow:**
```
Human Support Agent Opens Ticket
    ↓
AI Support Agent: Analyzes ticket, customer history, similar tickets
    ↓
Generates Suggestions: 
  - High Confidence (85%): "This is a known issue. Solution: [steps]"
  - Medium Confidence (65%): "Similar issue resolved before. Try: [approach]"
  - Low Confidence (40%): "Complex issue. Recommend escalating to Solutions Engineer"
    ↓
Human Agent: Reviews suggestions, uses or modifies as needed
    ↓
AI Agent: Learns from human agent's final response
```

**Human Oversight & Training:**
- **Human Support Agent Monitors:** All AI Support Agent interactions visible in dashboard
- **Human Support Agent Takes Over:** For complex issues, billing decisions, customer complaints
- **Human Support Agent Reviews:** AI responses before sending (optional for high confidence, required for medium/low)
- **Human Support Agent Approves:** Ticket assignments, auto-resolutions, escalations
- **Continuous Training:** Human agent corrections improve AI agent accuracy
- **Voice Quality Monitoring:** Human agents review voice interactions for quality assurance

**Workflow:**
```
Customer Issue
    ↓
AI Support Agent (First Contact)
    ↓
Common Issue? → Resolve Automatically
    ↓
Complex Issue? → Escalate to Human Support Agent
    ↓
Human Support Agent (Takes Over)
    ↓
Billing Decision? → Escalate to CSM
```

**Confidence Levels:**
- **High (≥80%):** Auto-resolve and respond
- **Medium (50-80%):** Suggest response, require human approval
- **Low (<50%):** Escalate to human agent immediately

**RevOps Attribution:**
- **Support Ticket Resolved:** 1 point (indirect revenue: 10% credit if customer retained)
- **First Contact Handled:** 0.5 points
- **Ticket Triage Completed:** 0.3 points

**Acceptance Criteria:**
- ✅ First contact is handled correctly
- ✅ Common issues are resolved automatically
- ✅ Ticket triage is accurate
- ✅ Escalation to human agents works correctly
- ✅ Response suggestions are relevant
- ✅ All activities are tracked for RevOps attribution

---

#### 8.4 Solutions Engineer Digital Agent

**Purpose:** Provide technical troubleshooting, complex issue analysis, and solution recommendations with voice capabilities for technical support calls.

**Core Responsibilities:**

##### 8.4.1 Technical Troubleshooting and Voice Support
- **Technical Issue Analysis:** Analyze technical issues:
  - API errors and integration problems
  - Configuration issues
  - Service connectivity problems
  - Data synchronization issues
- **Voice Technical Support:** Handle technical support calls with voice capabilities:
  - **Deepgram Integration:** Speech-to-text for technical conversations
  - **Cartesia Integration:** Text-to-speech for technical explanations
  - **Technical Voice Responses:** Explain technical concepts clearly in voice
- **Step-by-Step Troubleshooting:** Provide guided troubleshooting steps
- **Root Cause Analysis:** Identify root causes using technical logs, error messages, system state
- **Solution Validation:** Test solutions in staging before recommending to customers

**Example Voice Workflow (Technical Issue):**
```
Customer Calls: "My API integration stopped working"
    ↓
Benjamin (Voice): "Hi, I'm Benjamin. I can help troubleshoot that. Let me gather some information."
    ↓
Deepgram (STT): Converts technical conversation to text
    ↓
[Behind the scenes: Solutions Engineer Digital Agent asks diagnostic questions, checks API logs]
    ↓
Identifies: API key expired, authentication failing
    ↓
Benjamin (Cartesia TTS): "I found the issue. Your API key expired. Let me guide you through renewing it step by step."
    ↓
Provides: Step-by-step voice instructions
[Behind the scenes: Solutions Engineer Digital Agent provides technical guidance]
    ↓
Customer: Follows steps, confirms resolution
    ↓
Benjamin: Validates fix, closes ticket
[Customer experiences Benjamin throughout, but Solutions Engineer Digital Agent powers the technical expertise]
```

##### 8.4.2 Complex Issue Analysis
- **Multi-Step Problem Breakdown:** Analyze complex issues by breaking them into components
- **Dependency Mapping:** Identify dependencies and relationships between system components
- **Comprehensive Analysis Reports:** Generate detailed analysis reports with:
  - Problem description
  - Root cause analysis
  - Impact assessment
  - Recommended solutions
  - Escalation paths if needed
- **Pattern Recognition:** Identify patterns in technical issues across customers
- **Predictive Analysis:** Predict potential issues before they occur

**Example Workflow:**
```
Complex Issue: "Multiple customers reporting SETTLE service slowdown"
    ↓
AI Solutions Engineer: Analyzes issue across multiple tickets
    ↓
Identifies Pattern: All affected customers in same region, same time
    ↓
Root Cause: Regional infrastructure issue, not customer-specific
    ↓
Generates Report: 
  - Problem: Regional SETTLE service degradation
  - Root Cause: Infrastructure issue in Region X
  - Impact: 15 customers affected
  - Recommendation: Escalate to Platform Engineering
    ↓
Routes to: Platform Service Engineering Team
```

##### 8.4.3 Solution Recommendations and Documentation
- **Technical Solution Recommendations:** Provide validated technical solutions with:
  - Code examples (if applicable)
  - Configuration changes
  - Workarounds
  - Best practices
- **Technical Documentation Reference:** Reference relevant technical documentation
- **Solution Testing:** Validate solutions before recommending
- **Knowledge Base Integration:** Update KB with new solutions and patterns

##### 8.4.4 Knowledge Base Maintenance
- **Gap Identification:** Identify gaps in technical documentation from customer questions
- **Article Suggestions:** Suggest new technical articles based on recurring issues
- **Article Updates:** Update existing articles with new solutions and patterns
- **Accuracy Review:** Review technical article accuracy and relevance
- **Documentation Generation:** Generate technical documentation from resolved issues

**Human Oversight & Training:**
- **Human Solutions Engineer Reviews:** All technical recommendations, especially complex ones
- **Human Solutions Engineer Approves:** Complex solutions, code changes, configuration recommendations
- **Human Solutions Engineer Validates:** Technical analysis, root cause identification
- **Human Solutions Engineer Escalates:** To Platform Engineering when infrastructure issues identified
- **Continuous Training:** Human engineer corrections improve AI agent technical accuracy
- **Voice Quality Monitoring:** Human engineers review voice technical interactions for accuracy

**Workflow:**
```
Technical Issue
    ↓
AI Solutions Engineer (Analysis)
    ↓
Simple Issue? → Provide Solution
    ↓
Complex Issue? → Escalate to Human Solutions Engineer
    ↓
Human Solutions Engineer (Review/Approve)
    ↓
Engineering Required? → Escalate to Platform Team
```

**Confidence Levels:**
- **High (≥80%):** Provide solution with human review
- **Medium (50-80%):** Suggest solution, require human approval
- **Low (<50%):** Escalate to human Solutions Engineer immediately

**RevOps Attribution:**
- **Technical Issue Resolved:** 2 points (indirect revenue: 10% credit if customer retained)
- **Complex Issue Analyzed:** 1 point
- **Solution Recommended:** 0.5 points

**Acceptance Criteria:**
- ✅ Technical troubleshooting is accurate
- ✅ Complex issues are analyzed correctly
- ✅ Solution recommendations are validated
- ✅ Escalation to human Solutions Engineer works
- ✅ Technical documentation is maintained
- ✅ All activities are tracked for RevOps attribution

---

#### 8.5 Additional Digital Agents (Recommended)

Based on the CS-Support Service requirements and organizational structure, the following additional digital agents are recommended:

##### 8.5.1 Escalation Monitoring Agent

**Purpose:** Monitor escalation triggers, manage escalation workflows, and ensure timely CSM intervention.

**Key Responsibilities:**
- Monitor 24-48 hour escalation countdowns
- Track unresolved tickets
- Alert CSM when escalation triggers
- Manage escalation workflows
- Ensure SLA compliance for escalations

**Human Oversight:**
- **Support Manager monitors** escalation patterns
- **CSM receives** escalation alerts
- **Head of CS reviews** escalation trends

**RevOps Attribution:**
- **Escalation Managed:** 0.5 points
- **SLA Compliance Maintained:** 1 point

**Acceptance Criteria:**
- ✅ Escalation countdowns are tracked accurately
- ✅ CSM alerts are sent on time
- ✅ Escalation workflows are managed correctly
- ✅ SLA compliance is monitored

##### 8.5.2 Knowledge Base Agent

**Purpose:** Maintain and optimize the knowledge base, identify content gaps, and improve article effectiveness.

**Key Responsibilities:**
- Identify knowledge gaps from customer questions
- Suggest new KB articles
- Update existing articles based on feedback
- Analyze article effectiveness
- Optimize article discoverability

**Human Oversight:**
- **Support Manager reviews** KB article suggestions
- **Support Agents approve** article updates
- **Head of CS reviews** KB strategy

**RevOps Attribution:**
- **KB Article Created:** 2 points
- **KB Article Updated:** 1 point
- **KB Gap Identified:** 0.5 points

**Acceptance Criteria:**
- ✅ Knowledge gaps are identified correctly
- ✅ Article suggestions are relevant
- ✅ Article updates are accurate
- ✅ Article effectiveness is tracked

##### 8.5.3 Customer Health Agent

**Purpose:** Continuously monitor customer health scores, identify at-risk customers, and trigger proactive interventions.

**Key Responsibilities:**
- Monitor customer health scores in real-time
- Identify health score drops
- Trigger proactive outreach campaigns
- Analyze health trends
- Generate health reports for CSMs

**Human Oversight:**
- **CSM reviews** health alerts
- **CSM approves** proactive campaigns
- **Head of CS reviews** health trends

**RevOps Attribution:**
- **Health Alert Generated:** 1 point
- **Proactive Campaign Triggered:** 2 points
- **Health Report Generated:** 0.5 points

**Acceptance Criteria:**
- ✅ Health scores are monitored accurately
- ✅ At-risk customers are identified correctly
- ✅ Proactive campaigns are triggered appropriately
- ✅ Health reports are generated on schedule

##### 8.5.4 Ticket Quality Agent

**Purpose:** Ensure ticket quality, completeness, and proper categorization for efficient resolution.

**Key Responsibilities:**
- Validate ticket completeness
- Ensure proper categorization
- Check for duplicate tickets
- Validate ticket metadata
- Suggest ticket improvements

**Human Oversight:**
- **Support Agents review** quality suggestions
- **Support Manager monitors** quality trends
- **Head of CS reviews** quality metrics

**RevOps Attribution:**
- **Ticket Quality Validated:** 0.3 points
- **Duplicate Detected:** 0.5 points
- **Ticket Improved:** 0.2 points

**Acceptance Criteria:**
- ✅ Ticket quality is validated correctly
- ✅ Duplicate detection works accurately
- ✅ Categorization is accurate
- ✅ Ticket improvements are suggested appropriately

---

#### 8.6 Strategic Value to the Organization

##### 8.6.1 Scaling CS/Support Without Headcount Explosion
- **Efficiency Gains:** Let a smaller team manage more accounts by offloading repetitive work
- **Focus on High-Value Activities:** CSMs focus on complex relationships, negotiations, high-value customers
- **Support Agents Focus:** On complex issues, escalations, relationship building
- **Cost Savings:** Reduce need for additional headcount while scaling customer base
- **24/7 Coverage:** AI agents provide always-on support without requiring 24/7 human coverage

##### 8.6.2 Product and Roadmap Insights
- **Pattern Aggregation:** Aggregate patterns from conversations and usage data
- **Pain Point Identification:** Highlight recurring pain points and feature gaps
- **Structured Insights:** Feed structured insights back to Product and Leadership teams
- **Usage Analytics:** Identify underutilized features, popular features, feature requests
- **Customer Feedback Analysis:** Analyze customer feedback for product improvement opportunities

##### 8.6.3 Revenue Operations Integration
- **Activity Attribution:** Track all agent activities for RevOps attribution
- **Revenue Impact:** Measure indirect revenue contribution from agent activities
- **Performance Metrics:** Compare AI vs Human performance for optimization
- **Cost Efficiency:** Track cost per resolution, cost per customer, ROI

**In Summary:** AI Digital Agents are workflow + insight layers that watch customers 24/7, handle repetitive engagement, and give human CSMs/Support Agents the right signal, at the right time, with the right recommended next step.

---

#### 8.7 Customer-Facing Personas

##### 8.7.1 Persona Design Philosophy

**Core Principle:** Customers interact with friendly, human-like agents with real names, not technical designations.

**Persona Characteristics:**
- **Human Names:** Use real, friendly names (Benjamin, Sarah, Alex, Emma, etc.)
- **Consistent Identity:** Each persona maintains consistent personality, tone, and expertise
- **Natural Introductions:** "I'm [Name], how can I help you?" or "Hi, I'm [Name], your digital agent"
- **Professional Yet Friendly:** Balance professionalism with approachability
- **Context Awareness:** Persona adapts to customer context (tier, history, urgency)

##### 8.7.2 Persona Mapping to Internal Agents

**Primary Customer-Facing Persona:**
- **Benjamin:** The consistent, primary point of contact for each law firm customer
  - Handles all customer interactions (support, technical, onboarding, billing questions)
  - Maintains relationship continuity across all touchpoints
  - Builds familiarity and trust with consistent identity
  - Remembers previous conversations and context
  - Acts as the "face" of TrueVow support for each customer

**Internal Agent Support Behind Benjamin:**
- **Customer Support Digital Agent:** Powers Benjamin's support interactions
- **Solutions Engineer Digital Agent:** Powers Benjamin's technical troubleshooting
- **Customer Success Digital Agent:** Powers Benjamin's onboarding and proactive outreach
- **All agents work together** to provide Benjamin with the knowledge and capabilities needed

**Design Rationale:**
- **Relationship Building:** Customers build a relationship with Benjamin, not multiple personas
- **Context Continuity:** Benjamin remembers all previous interactions, creating seamless experience
- **Personal Touch:** Feels like talking to a real person who knows your account
- **Reduced Confusion:** No "who am I talking to?" moments
- **Trust Building:** Consistent identity builds trust over time

**Note:** Benjamin is the customer-facing persona, but internally, multiple specialized AI agents (Support, Solutions Engineer, Customer Success) work together to power Benjamin's capabilities. Customers always interact with Benjamin, but behind the scenes, the right internal agent handles the specific task.

##### 8.7.3 Persona Configuration

**Benjamin Configuration:**
- **Name:** Benjamin (consistent across all interactions)
- **Greeting Style:** "Hi! I'm Benjamin, your digital agent. How can I help you today?" or "I'm Benjamin, how can I help you?"
- **Tone:** Professional yet friendly, adaptable to context (support, technical, onboarding)
- **Expertise Areas:** All areas (support, technical, onboarding, billing) - powered by internal specialized agents
- **Voice Profile:** Consistent Cartesia voice profile for all voice interactions
- **Customer Assignment:** Each law firm customer is assigned to Benjamin as their primary contact
- **Context Memory:** Benjamin remembers all previous interactions with each customer

**Benjamin's Capabilities (Powered by Internal Agents):**
- **General Support:** Powered by Customer Support Digital Agent
- **Technical Troubleshooting:** Powered by Solutions Engineer Digital Agent
- **Onboarding & Success:** Powered by Customer Success Digital Agent
- **Billing Questions:** Powered by Customer Support Digital Agent (view-only, escalates decisions to CSM)

**Customer Assignment Logic:**
- **Consistent Assignment:** Each law firm customer is always assigned to Benjamin
- **No Rotation:** Customers don't switch between personas - Benjamin is their consistent contact
- **Load Balancing:** Behind the scenes, multiple Benjamin instances handle different customers, but each customer always sees "Benjamin"
- **Context Preservation:** Benjamin maintains full conversation history and context for each customer

##### 8.7.4 Persona Examples

**Example 1: Benjamin (Support Interaction)**
```
Customer: [Initiates chat]
Benjamin: "Hi! I'm Benjamin, your digital agent. How can I help you today?"
Customer: "I need help with my account"
Benjamin: "I'd be happy to help! What specifically do you need assistance with?"
[Behind the scenes: Customer Support Digital Agent powers Benjamin's response]
```

**Example 2: Benjamin (Technical Support)**
```
Customer: [Calls technical support]
Benjamin: "Hello, I'm Benjamin. What can I help you with today?"
Customer: "My API integration isn't working"
Benjamin: "I can help troubleshoot that. Let me gather some information to get started."
[Behind the scenes: Solutions Engineer Digital Agent powers Benjamin's technical troubleshooting]
```

**Example 3: Benjamin (Onboarding)**
```
Customer: [Receives onboarding email]
Benjamin: "Hi [Customer Name], I'm Benjamin, your digital agent. I'm here to help you get started with TrueVow. Let's begin with setting up your account!"
[Behind the scenes: Customer Success Digital Agent powers Benjamin's onboarding guidance]
```

**Example 4: Benjamin (Follow-up Conversation)**
```
Customer: [Returns after previous interaction]
Benjamin: "Hi [Customer Name]! Good to talk with you again. I remember we were working on [previous issue]. How can I help you today?"
[Benjamin maintains context from all previous interactions]
```

##### 8.7.5 Persona Consistency

**Maintaining Benjamin's Identity:**
- **Consistent Name:** Always "Benjamin" - never changes
- **Consistent Identity:** Each law firm customer always interacts with Benjamin
- **Conversation Memory:** Benjamin remembers all previous interactions with each customer
- **Context Continuity:** Benjamin maintains full context across all touchpoints (chat, email, phone, onboarding)
- **Relationship Building:** Benjamin builds a relationship with each customer over time
- **Smooth Handoffs:** When escalating to human, Benjamin introduces: "Let me connect you with [Human Name], who can help with this. I'll be here if you need anything else."
- **Analytics:** Track Benjamin's interactions per customer for relationship insights

**Benefits of Single Persona Approach:**
- **Familiarity:** Customers know they're always talking to Benjamin
- **Trust:** Consistent identity builds trust over time
- **Efficiency:** No need to re-explain context - Benjamin remembers
- **Personal Touch:** Feels like a real relationship, not a rotating support queue
- **Reduced Friction:** No confusion about "who am I talking to?"

---

#### 8.8 AI Agent Architecture

##### 8.8.0 Critical Security: LLM Isolation Policy

**🚨 CRITICAL SECURITY REQUIREMENT - NO EXCEPTIONS**

**LLM Access Restriction:**
- ✅ **CS-Support Service:** Has direct LLM access (Claude, Kimi) - **ONLY SERVICE WITH LLM ACCESS FOR SUPPORT**
- ✅ **Sales-CRM Service:** Has direct LLM access (Claude, Kimi) - **ONLY SERVICE WITH LLM ACCESS FOR SALES**
- ❌ **Customer Portal (Tenant App Service):** **NO LLM ACCESS** - Must call CS-Support Service APIs
- ❌ **Platform Service:** **NO LLM ACCESS**
- ❌ **Internal Ops Service:** **NO LLM ACCESS**
- ❌ **Any Other Microservice:** **NO LLM ACCESS**

**Security Rationale:**
- **Attack Surface Reduction:** Limiting LLM connectivity to only 2 services reduces potential breach vectors
- **Compliance Isolation:** Customer Portal (Tenant App) maintains compliance by not having LLM connectivity
- **Data Isolation:** LLM API keys and credentials only exist in CS-Support and Sales-CRM services
- **Audit Trail:** All LLM interactions centralized in CS-Support Service for security auditing
- **Access Control:** LLM access controlled through service-level authentication, not distributed

**Architecture Pattern:**
```
Customer Portal (Tenant App Service)
    ↓ (API Call - NO LLM)
CS-Support Service
    ↓ (LLM API Call)
Claude/Kimi LLM
```

**NOT ALLOWED:**
```
Customer Portal (Tenant App Service)
    ↓ (Direct LLM Call - BLOCKED)
Claude/Kimi LLM
```

**Implementation Requirements:**
- **API Gateway:** Customer Portal must call CS-Support Service APIs for any AI agent interactions
- **No LLM SDKs:** Customer Portal must NOT include Claude/Kimi SDKs or API keys
- **Service-to-Service Auth:** CS-Support Service validates API key from Customer Portal
- **Environment Variables:** LLM API keys only in CS-Support Service `.env` files
- **Code Review:** Enforce no LLM imports in Customer Portal codebase
- **CI/CD Checks:** Automated checks to prevent LLM SDK imports in non-authorized services

**Customer Portal Integration Pattern:**
```typescript
// Customer Portal (Tenant App Service)
// ✅ CORRECT: Call CS-Support Service API
import { CSSupportClient } from '@/lib/integrations/cs-support'

const client = new CSSupportClient(process.env.CS_SUPPORT_API_URL, process.env.CS_SUPPORT_API_KEY)
const response = await client.chatWithBenjamin(customerId, message)

// ❌ WRONG: Direct LLM call (BLOCKED)
import Anthropic from '@anthropic-ai/sdk' // NOT ALLOWED
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) // NOT ALLOWED
```

**CS-Support Service Implementation:**
```typescript
// CS-Support Service
// ✅ CORRECT: Direct LLM access allowed
import Anthropic from '@anthropic-ai/sdk'
import { KimiClient } from '@/lib/integrations/kimi'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const kimi = new KimiClient({ apiKey: process.env.KIMI_API_KEY })
```

**Security Monitoring:**
- **LLM API Key Monitoring:** Alert on unauthorized LLM API key usage
- **Service Access Logs:** Log all LLM API calls with service identification
- **Anomaly Detection:** Detect LLM calls from non-authorized services
- **Audit Trail:** All LLM interactions logged with service, user, and timestamp

**Compliance Impact:**
- **Tenant App Compliance:** Customer Portal maintains compliance by isolating LLM connectivity
- **Data Residency:** LLM interactions contained within CS-Support Service boundaries
- **Privacy:** Customer data only flows to LLMs through controlled CS-Support Service endpoints

---

##### 8.8.1 Multi-LLM Support

**Claude (General Purpose):**
- Customer Success Digital Agent
- Customer Support Digital Agent
- General conversation handling
- Response generation
- Sentiment analysis

**Kimi (Specialized):**
- Solutions Engineer Digital Agent
- Technical troubleshooting
- Complex issue analysis
- Technical documentation generation
- Code analysis

**LLM Selection Logic:**
- Route to Claude for general support and customer success tasks
- Route to Kimi for technical and complex issues
- Fallback to Claude if Kimi unavailable
- Log LLM usage for cost tracking

##### 8.8.2 Voice Capabilities Architecture

**Deepgram Integration (Speech-to-Text):**
- **Purpose:** Convert customer voice (phone calls, voice chat) to text for AI processing
- **Use Cases:** 
  - Phone support calls
  - Voice chat interactions
  - Voicemail transcription
- **Configuration:**
  - Language: English (US)
  - Model: Nova-2 (latest, most accurate)
  - Real-time streaming for live conversations
  - Post-call transcription for analysis
- **Integration Points:**
  - Twilio phone integration
  - Web chat voice integration
  - Voicemail processing

**Cartesia Integration (Text-to-Speech):**
- **Purpose:** Convert AI agent text responses to natural voice for customer interactions
- **Use Cases:**
  - Phone support responses
  - Voice chat responses
  - Automated voice messages
- **Configuration:**
  - Voice: Natural, professional tone
  - Language: English (US)
  - Model: High-quality, low-latency for real-time
- **Integration Points:**
  - Twilio phone integration
  - Web chat voice integration
  - Automated voice notifications

**Voice Workflow:**
```
Customer Voice Input
    ↓
Deepgram (STT): Converts speech to text
    ↓
AI Agent: Processes text, generates response
    ↓
Cartesia (TTS): Converts response to voice (with persona name)
    ↓
Customer: Hears natural voice response: "I'm [Persona Name], I can help with that..."
```

**Persona Voice Integration:**
- Each persona has a consistent voice profile in Cartesia
- Voice matches persona characteristics (friendly, professional, technical)
- Persona introduces themselves by name in voice interactions
- Consistent voice experience across all interactions with same persona

**Voice Quality Assurance:**
- Human agents review voice interactions for quality
- Monitor voice accuracy, naturalness, customer satisfaction
- Continuous improvement based on feedback

##### 8.8.3 Confidence-Based Actions

**High Confidence (≥80%):**
- Auto-resolve common issues
- Auto-fill response suggestions
- Auto-assign tickets
- Execute automated workflows

**Medium Confidence (50-80%):**
- Suggest responses (require human approval)
- Suggest ticket assignments (require human approval)
- Flag for human review
- Provide recommendations

**Low Confidence (<50%):**
- Escalate to human immediately
- Flag for manual review
- Request additional context
- Do not auto-resolve

##### 8.8.4 Human Oversight & Escalation

**Escalation Triggers:**
- Low confidence (<50%)
- Complex issues (multi-step, technical)
- Billing decisions
- Customer complaints
- SLA breaches
- Escalation countdown (24-48 hours)

**Human Review Requirements:**
- All high-confidence auto-resolutions reviewed (sampling)
- All medium-confidence suggestions require approval
- All low-confidence issues require human handling
- All billing-related decisions require CSM approval

##### 8.8.5 Activity Tracking & RevOps Integration

**Activity Tracking:**
- All agent activities logged
- Activity types: ticket resolved, customer onboarded, health check completed, etc.
- Activity scores assigned (1-20 points based on value)
- Activities linked to customers and revenue
- **Role-Based Activity Mapping:** Activities mapped to organizational roles (CSM, Support Agent, Solutions Engineer)

**RevOps Attribution:**
- **Direct Revenue:** 100% credit (e.g., CSM closes upsell, CSM retains customer)
- **Indirect Revenue:** Partial credit (e.g., Support Agent resolves ticket → 10% if customer retained)
- **Attribution by Role:**
  - **CSM (Customer Success Manager):** 100% direct credit for upsells, 100% direct credit for retention
  - **Support Agent (Customer Solutions Engineer):** 10% indirect credit for customer retention
  - **AI CS Assistant:** 10% indirect credit for customer retention
  - **AI Support Agent:** 10% indirect credit for customer retention (if customer retained)
- **Attribution by Function:** Activities attributed to Customer Success Organization
- Activity scores tracked for performance metrics
- AI vs Human performance comparison

**Scoring System:**
- **Scoring Matrix:**
  - Ticket resolved: 1 point (Support Agent, AI Support Agent)
  - Customer onboarded: 10 points (CSM, AI CS Assistant)
  - Customer retained: 15 points (CSM), 10 points (Support Agent - indirect)
  - Upsell closed: 20 points (CSM)
- **Role-Based Scoring:** Scores aligned with organizational structure
- **Performance Score:** Sum of activity scores + Revenue attribution
- **Score Calculation:** Daily, weekly, monthly

**Integration Points:**
- Internal Ops Service (RevOps tools) - All activities sent to Internal Ops Service
- Platform Service (usage metrics)
- Sales-CRM Service (customer data)

##### 8.8.6 Continuous Learning & Human-in-the-Loop Training

**Human-in-the-Loop Training Mechanisms:**
- **Feedback Loops:** Human agents provide feedback on AI agent actions (correct, incorrect, needs improvement)
- **Correction Learning:** AI agents learn from human corrections and adjust future responses
- **Pattern Recognition:** AI agents identify successful patterns from human agent interactions
- **Quality Monitoring:** Human agents review AI agent interactions for quality assurance
- **Continuous Improvement:** Regular model fine-tuning based on human feedback and success patterns

**Training Data Sources:**
- Human agent corrections and feedback
- Customer satisfaction scores (CSAT, NPS)
- Resolution success rates
- Escalation patterns (what gets escalated, why)
- KB article effectiveness
- Voice interaction quality scores

**Model Updates:**
- Regular fine-tuning based on feedback (monthly or quarterly)
- A/B testing of different approaches
- Performance monitoring and optimization
- Retraining on successful patterns
- Version control for model updates

**Learning Mechanisms:**
- Human feedback on AI responses
- Customer satisfaction scores
- Resolution success rates
- Escalation patterns
- KB article effectiveness

**Model Updates:**
- Regular fine-tuning based on feedback
- A/B testing of different approaches
- Performance monitoring and optimization
- Retraining on successful patterns

---

#### 8.9 AI Agent Framework & Architecture

##### 8.9.1 Agent Configuration System

**Purpose:** Centralized system for configuring, managing, and controlling AI agents with comprehensive settings and briefs.

**Agent Configuration Database:**
```sql
CREATE TABLE support_llm_agents (
    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(255) NOT NULL UNIQUE,
    agent_type VARCHAR(100) NOT NULL CHECK (agent_type IN (
        'customer_support', 'customer_success', 'solutions_engineer',
        'escalation_monitoring', 'knowledge_base', 'customer_health', 'ticket_quality'
    )),
    status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'testing', 'maintenance')) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    brief_config JSONB NOT NULL, -- Role, JTBD, context, guardrails, steps, outcomes, service_stage, truevow_service
    knowledge_base JSONB, -- Documents, text content, embeddings, update schedule
    llm_config JSONB NOT NULL, -- Model, temperature, max_tokens, system_prompt
    performance_metrics JSONB, -- Execution time, token usage, success rate
    -- Service-Specific Fields
    service_stage VARCHAR(50) CHECK (service_stage IN ('Pre-sale', 'Post-sale', 'Retention', NULL)),
    truevow_service VARCHAR(50) CHECK (truevow_service IN ('INTAKE', 'DRAFT', 'VERIFY', 'SETTLE', 'CONNECT', 'ALL', NULL)),
    role_responsibilities JSONB, -- Mapping of roles to responsibilities per service
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_support_llm_agents_status ON support_llm_agents(status);
CREATE INDEX idx_support_llm_agents_type ON support_llm_agents(agent_type);
CREATE INDEX idx_support_llm_agents_active ON support_llm_agents(is_active);
CREATE INDEX idx_support_llm_agents_service ON support_llm_agents(truevow_service);
CREATE INDEX idx_support_llm_agents_service_stage ON support_llm_agents(service_stage);
```

**Agent Toggle On/Off Functionality:**
- **Per-Agent Toggle:** Each agent has an `is_active` boolean flag
- **Global Toggle:** System-wide agent enable/disable
- **Scheduled Toggle:** Schedule agents to be active/inactive at specific times
- **Conditional Toggle:** Enable/disable agents based on conditions (e.g., business hours, load)
- **Emergency Stop:** Immediate global or per-agent shutdown capability
- **Toggle UI:** Admin interface for toggling agents on/off with confirmation

**Configurable Brief System:**
- **Brief Structure (JSONB):**
  ```json
  {
    "role": "Customer Support Digital Agent",
    "jtbd": "Help customers resolve technical issues quickly and accurately",
    "context": {
      "required": ["ticket_details", "customer_history", "knowledge_base"],
      "optional": ["similar_tickets", "customer_tier", "sla_requirements"]
    },
    "guardrails": [
      "Do not make billing decisions without CSM approval",
      "Do not escalate to Solutions Engineer for simple issues",
      "Do not provide legal advice",
      "Always maintain professional tone",
      "Do not share internal processes with customers"
    ],
    "steps": [
      "1. Analyze ticket content and customer history",
      "2. Search knowledge base for relevant solutions",
      "3. Generate response with confidence score",
      "4. If confidence < 50%, escalate to human agent",
      "5. If confidence >= 80%, auto-resolve with customer confirmation",
      "6. Log activity for RevOps attribution"
    ],
    "outcomes": [
      "Ticket resolved",
      "Customer satisfied (CSAT > 4.0)",
      "Response time < 1 hour",
      "No escalation required"
    ]
  }
  ```
- **Brief Editor UI:** Rich text editor for editing agent briefs
- **Brief Versioning:** Track brief changes with version history
- **Brief Validation:** Validate brief structure before saving
- **Brief Testing:** Test brief changes in sandbox before deploying

**Knowledge Base Management:**
- **Document Storage:** Store documents, text content, and embeddings per agent
- **Update Schedule:**
  - **Daily Updates:** Automatic daily sync of KB articles
  - **Weekly Updates:** Weekly review and update of agent knowledge
  - **On-Demand Updates:** Manual trigger for immediate updates
  - **Update Notifications:** Alert agents when KB is updated
- **Knowledge Base Structure:**
  ```json
  {
    "documents": [
      {
        "id": "doc_123",
        "title": "API Integration Guide",
        "content": "...",
        "embeddings": [...],
        "last_updated": "2026-01-08T10:00:00Z",
        "source": "knowledge_base",
        "tags": ["api", "integration", "technical"]
      }
    ],
    "text_content": [
      {
        "id": "text_456",
        "content": "Common troubleshooting steps...",
        "embeddings": [...],
        "last_updated": "2026-01-08T10:00:00Z"
      }
    ],
    "update_schedule": {
      "daily": true,
      "weekly": true,
      "on_demand": true
    }
  }
  ```
- **Embedding Management:** Generate and update embeddings when KB changes
- **KB Search:** Semantic search across agent knowledge base
- **KB Analytics:** Track which KB articles are most useful

**On-Demand Agent Creation:**
- **Agent Creation UI:** Admin interface for creating new agents
- **Agent Templates:** Pre-configured templates for common agent types
- **Quick Setup:** Wizard-based agent creation with guided steps
- **Custom Agents:** Create custom agents with unique configurations
- **Agent Cloning:** Clone existing agents as starting point
- **Validation:** Validate agent configuration before activation

**LLM Configuration:**
- **Model Selection:** Choose Claude or Kimi per agent
- **Temperature:** Configure temperature (0.0-1.0) for response creativity
- **Max Tokens:** Set maximum tokens per response
- **System Prompt:** Custom system prompt per agent
- **Fallback Logic:** Configure fallback to alternative LLM if primary fails
- **Cost Tracking:** Track token usage and costs per agent

##### 8.9.2 Multi-Agent Orchestration

**Purpose:** Coordinate multiple agents working together on complex tasks with context passing and token optimization.

**Orchestration Patterns:**

1. **Sequential Pattern:**
   - Agent A → Agent B → Agent C (context passing)
   - Example: Customer Support Agent → Solutions Engineer Agent → Knowledge Base Agent
   - Context flows from one agent to the next
   - Each agent adds to the context

2. **Parallel Pattern:**
   - Multiple agents work simultaneously (independent)
   - Example: Customer Health Agent and Ticket Quality Agent analyze same ticket
   - Results combined after all agents complete
   - No context sharing during execution

3. **Conditional Pattern:**
   - Route based on conditions
   - Example: If ticket complexity = "high" → Solutions Engineer Agent, else → Customer Support Agent
   - Dynamic routing based on ticket attributes
   - Fallback routes for edge cases

4. **Silo Pattern:**
   - Independent agents (no context sharing)
   - Example: Escalation Monitoring Agent works independently
   - No coordination needed
   - Isolated execution

**Context Manager:**
- **Context Extraction:** Extract only relevant data for next agent
- **Context Summarization:** Summarize context to optimize token usage
- **Context Caching:** Cache frequently accessed context
- **Context Passing:** Formulate context for next agent in chain
- **Token Optimization:**
  - Remove irrelevant information
  - Summarize long conversations
  - Compress context while preserving key information
  - Track token usage per agent

**Orchestration Engine:**
```typescript
interface OrchestrationConfig {
  pattern: 'sequential' | 'parallel' | 'conditional' | 'silo'
  agents: string[] // Agent IDs
  context_passing: boolean
  token_limit?: number
  timeout?: number
  fallback_agent?: string
}

class OrchestrationEngine {
  async execute(config: OrchestrationConfig, input: any): Promise<any> {
    // Execute orchestration pattern
    // Manage context passing
    // Optimize token usage
    // Handle errors and fallbacks
  }
}
```

##### 8.9.3 Jobs-to-Be-Done (JTBD) Framework

**Purpose:** Define what job each agent is helping complete, ensuring clear role definition and expected outcomes aligned with TrueVow's services and customer journey.

**JTBD Structure:**
- **Role:** Agent's role and responsibilities
- **JTBD:** Jobs-to-be-done (what job is the agent helping complete?)
- **Service Stage:** Pre-sale, Post-sale (INTAKE, DRAFT, VERIFY, SETTLE, CONNECT), Retention
- **TrueVow Service:** Which TrueVow service(s) this JTBD relates to
- **Context:** What context does the agent need?
- **Guardrails:** What should the agent NOT do?
- **Steps:** Step-by-step process
- **Outcomes:** Expected outcomes
- **Role Responsibilities:** Mapping to organizational roles

**JTBD Integration:**
- **Brief Configuration:** JTBD stored in `brief_config` JSONB column
- **System Prompt Generation:** JTBD used to generate LLM system prompts
- **Performance Measurement:** Outcomes used to measure agent success
- **Human Training:** JTBD guides human feedback and corrections
- **Service-Specific Mapping:** JTBD mapped to TrueVow services (INTAKE, DRAFT, VERIFY, SETTLE, CONNECT)

**TrueVow Service Structure & Rollout Timeline:**
- **INTAKE (Benjamin):** Primary service, available now
- **SETTLE:** Coming Q3 2026
- **DRAFT:** Coming Q4 2026
- **CONNECT:** Coming Q1 2027
- **VERIFY:** Integrated with INTAKE (enhanced with DRAFT)

**Customer Journey Stages:**

**PRE-SALE STAGES:**
1. **Awareness** → "Help me understand if I have a problem"
2. **Consideration** → "Help me evaluate if TrueVow's services solve my problems"
3. **Decision** → "Help me make the right decision to purchase"
4. **Onboarding** → "Help me get started quickly (6-hour SLA)"

**POST-SALE SERVICE STAGES:**
5. **INTAKE** → "Help me capture and process client intake efficiently"
6. **DRAFT** → "Help me draft legal documents quickly and accurately" (Q4 2026)
7. **VERIFY** → "Help me verify information and documents accurately" (Integrated with INTAKE)
8. **SETTLE** → "Help me manage settlement processes efficiently" (Q3 2026)
9. **CONNECT** → "Help me maintain strong client relationships" (Q1 2027)

**GROWTH STAGES:**
10. **Retention & Expansion** → "Help me succeed and expand service usage"

**JTBD Alignment with Human Roles:**
- **Customer Support Digital Agent:** Supports Support Agent (IC) role
- **Customer Success Digital Agent:** Supports CSM (IC) role
- **Solutions Engineer Digital Agent:** Supports Solutions Engineer (IC) role
- **Escalation Monitoring Agent:** Supports Support Manager role
- **Knowledge Base Agent:** Supports all support roles
- **Customer Health Agent:** Supports CSM (IC) role
- **Ticket Quality Agent:** Supports Support Manager role

**Service-Specific JTBD Examples:**

**Customer Support Digital Agent - INTAKE Service JTBD:**
```json
{
  "role": "Customer Support Digital Agent",
  "jtbd": "Help customers resolve INTAKE service issues quickly and accurately, ensuring Benjamin (intake system) operates smoothly",
  "service_stage": "Post-sale",
  "truevow_service": "INTAKE",
  "service_status": "Available Now",
  "context": {
    "required": ["ticket_details", "customer_history", "intake_configuration", "benjamin_logs"],
    "optional": ["similar_tickets", "customer_tier", "sla_requirements", "practice_area"]
  },
  "guardrails": [
    "Do not make billing decisions without CSM approval",
    "Do not escalate to Solutions Engineer for simple INTAKE configuration issues",
    "Do not provide legal advice",
    "Do not modify Benjamin FSM logic (deterministic system)"
  ],
  "steps": [
    "1. Analyze ticket content related to INTAKE service",
    "2. Check Benjamin (intake system) configuration and logs",
    "3. Search knowledge base for INTAKE-specific solutions",
    "4. Verify phone forwarding, calendar integration, practice-specific scripts",
    "5. Generate response with confidence score",
    "6. If confidence < 50%, escalate to Solutions Engineer",
    "7. If confidence >= 80%, auto-resolve with customer confirmation",
    "8. Log activity for RevOps attribution (INTAKE service)"
  ],
  "outcomes": [
    "INTAKE service issue resolved within SLA",
    "Benjamin (intake system) operating correctly",
    "Customer satisfied (CSAT > 4.0)",
    "Response time < 1 hour",
    "No unnecessary escalations"
  ],
  "role_responsibilities": {
    "Support Agent (IC)": "Primary handler for INTAKE support tickets",
    "Solutions Engineer (IC)": "Escalation for complex INTAKE configuration issues"
  },
  "revops_attribution": {
    "points": 1,
    "service": "INTAKE",
    "indirect_revenue": true,
    "credit_percentage": 10
  }
}
```

**Customer Support Digital Agent - SETTLE Service JTBD:**
```json
{
  "role": "Customer Support Digital Agent",
  "jtbd": "Help customers resolve SETTLE service issues, ensuring settlement tracking and negotiation support work correctly",
  "service_stage": "Post-sale",
  "truevow_service": "SETTLE",
  "service_status": "Coming Q3 2026",
  "context": {
    "required": ["ticket_details", "customer_history", "settle_configuration", "settlement_data"],
    "optional": ["similar_tickets", "customer_tier", "sla_requirements", "practice_area"]
  },
  "guardrails": [
    "Do not make billing decisions without CSM approval",
    "Do not provide legal advice on settlements",
    "Do not modify settlement calculations",
    "Always escalate Founding Member data contribution questions to CSM"
  ],
  "steps": [
    "1. Analyze ticket content related to SETTLE service",
    "2. Check SETTLE service configuration and settlement data",
    "3. Search knowledge base for SETTLE-specific solutions",
    "4. Verify settlement tracking, negotiation workflows",
    "5. Generate response with confidence score",
    "6. If confidence < 50%, escalate to Solutions Engineer",
    "7. If confidence >= 80%, auto-resolve with customer confirmation",
    "8. Log activity for RevOps attribution (SETTLE service)"
  ],
  "outcomes": [
    "SETTLE service issue resolved within SLA",
    "Settlement tracking working correctly",
    "Customer satisfied (CSAT > 4.0)",
    "Response time < 1 hour"
  ],
  "role_responsibilities": {
    "Support Agent (IC)": "Primary handler for SETTLE support tickets",
    "Solutions Engineer (IC)": "Escalation for complex SETTLE configuration issues"
  },
  "revops_attribution": {
    "points": 1,
    "service": "SETTLE",
    "indirect_revenue": true,
    "credit_percentage": 10
  }
}
```

**Customer Success Digital Agent - Service Adoption JTBD:**
```json
{
  "role": "Customer Success Digital Agent",
  "jtbd": "Proactively guide customers through TrueVow service adoption (INTAKE → SETTLE → DRAFT → CONNECT), monitor service usage, and identify expansion opportunities",
  "service_stage": "Post-sale, Retention",
  "truevow_service": "All Services",
  "service_adoption_funnel": {
    "entry_point": "INTAKE (Available Now)",
    "early_adopters": "INTAKE + SETTLE (Q3 2026)",
    "power_users": "INTAKE + SETTLE + DRAFT (Q4 2026)",
    "complete_suite": "INTAKE + SETTLE + DRAFT + VERIFY + CONNECT (Q1 2027)"
  },
  "context": {
    "required": ["customer_health_score", "service_usage_data", "onboarding_progress", "service_adoption_status"],
    "optional": ["customer_tier", "contract_details", "support_history", "practice_area"]
  },
  "guardrails": [
    "Do not make billing or contract decisions",
    "Do not promise features not in contract",
    "Always escalate billing disputes to CSM",
    "Do not push services not yet available (respect rollout timeline)"
  ],
  "steps": [
    "1. Monitor customer service adoption (INTAKE → SETTLE → DRAFT → CONNECT)",
    "2. Identify customers ready for next service (e.g., INTAKE users ready for SETTLE)",
    "3. Monitor customer health scores daily",
    "4. Identify health score drops or at-risk signals",
    "5. Generate proactive outreach recommendations for service expansion",
    "6. Guide customers through service onboarding milestones",
    "7. Track service usage and adoption metrics",
    "8. Log activities for RevOps attribution (service-specific)"
  ],
  "outcomes": [
    "Customer adopts multiple TrueVow services",
    "Service adoption progression: INTAKE → SETTLE → DRAFT → CONNECT",
    "Customer health score maintained or improved",
    "Onboarding completed within 30 days",
    "At-risk customers identified and addressed",
    "Customer retention improved",
    "Service expansion opportunities identified"
  ],
  "role_responsibilities": {
    "CSM (IC)": "Primary handler for service adoption and customer success",
    "Support Agent (IC)": "Support for service-specific technical issues"
  },
  "revops_attribution": {
    "upsell_closed": {
      "points": 20,
      "service": "Any",
      "direct_revenue": true,
      "credit_percentage": 100
    },
    "customer_retained": {
      "points": 15,
      "service": "Any",
      "direct_revenue": true,
      "credit_percentage": 100
    },
    "service_adoption": {
      "points": 10,
      "service": "Any",
      "indirect_revenue": true,
      "credit_percentage": 10
    }
  }
}
```

**Solutions Engineer Digital Agent - Service Integration JTBD:**
```json
{
  "role": "Solutions Engineer Digital Agent",
  "jtbd": "Help customers integrate and configure TrueVow services (INTAKE, SETTLE, DRAFT, VERIFY, CONNECT), troubleshoot technical issues, and optimize service performance",
  "service_stage": "Post-sale",
  "truevow_service": "All Services",
  "context": {
    "required": ["ticket_details", "service_configuration", "technical_logs", "integration_status"],
    "optional": ["customer_history", "similar_issues", "practice_area", "service_version"]
  },
  "guardrails": [
    "Do not modify Benjamin FSM logic (deterministic system)",
    "Do not provide legal advice",
    "Do not make billing decisions",
    "Always test solutions in staging before recommending"
  ],
  "steps": [
    "1. Analyze technical issue related to TrueVow service",
    "2. Check service configuration, logs, and integration status",
    "3. Identify root cause (INTAKE phone forwarding, SETTLE data sync, DRAFT template issues, etc.)",
    "4. Search knowledge base for technical solutions",
    "5. Generate technical solution with step-by-step instructions",
    "6. Validate solution in staging environment",
    "7. Provide solution to customer with confidence score",
    "8. If confidence < 50%, escalate to human Solutions Engineer",
    "9. Log activity for RevOps attribution (service-specific)"
  ],
  "outcomes": [
    "Service integration/configuration issue resolved",
    "Service performance optimized",
    "Customer satisfied (CSAT > 4.0)",
    "Technical solution validated before deployment",
    "Response time < 2 hours for complex issues"
  ],
  "role_responsibilities": {
    "Solutions Engineer (IC)": "Primary handler for technical service issues",
    "Support Agent (IC)": "Support for simple configuration questions"
  },
  "revops_attribution": {
    "points": 2,
    "service": "Any",
    "indirect_revenue": true,
    "credit_percentage": 10
  }
}
```

**Service-Specific Support Mapping:**

**INTAKE Service Support (Available Now):**
- **Primary Issues:** Phone forwarding, calendar integration, practice-specific scripts, Benjamin FSM configuration, intake call quality
- **Support Agents:** Customer Support Digital Agent (first contact), Solutions Engineer Digital Agent (technical)
- **Knowledge Base:** INTAKE configuration guides, practice-specific setup (PI, Family Law, Immigration), Benjamin troubleshooting
- **RevOps Attribution:** 1 point per ticket resolved (10% indirect credit if customer retained)
- **Practice Areas:** Personal Injury (PI), Family Law, Immigration, etc.

**SETTLE Service Support (Coming Q3 2026):**
- **Primary Issues:** Settlement tracking, negotiation workflows, data synchronization, Founding Member data contribution
- **Support Agents:** Customer Support Digital Agent (first contact), Solutions Engineer Digital Agent (technical)
- **Knowledge Base:** SETTLE configuration guides, settlement tracking setup, negotiation workflows
- **RevOps Attribution:** 1 point per ticket resolved (10% indirect credit if customer retained)
- **Service Status:** Coming Q3 2026 - Support agents prepared but service not yet available

**DRAFT Service Support (Coming Q4 2026):**
- **Primary Issues:** Document template configuration, practice-specific templates, automated generation, VERIFY integration
- **Support Agents:** Customer Support Digital Agent (first contact), Solutions Engineer Digital Agent (technical)
- **Knowledge Base:** DRAFT configuration guides, template management, document generation workflows
- **RevOps Attribution:** 1 point per ticket resolved (10% indirect credit if customer retained)
- **Service Status:** Coming Q4 2026 - Support agents prepared but service not yet available

**VERIFY Service Support (Integrated with INTAKE, Enhanced with DRAFT):**
- **Primary Issues:** Information verification, document verification, integration with INTAKE and DRAFT
- **Support Agents:** Customer Support Digital Agent (first contact), Solutions Engineer Digital Agent (technical)
- **Knowledge Base:** VERIFY configuration guides, verification workflows, integration setup
- **RevOps Attribution:** 1 point per ticket resolved (10% indirect credit if customer retained)
- **Integration:** VERIFY integrated with INTAKE, enhanced when DRAFT launches (Q4 2026)

**CONNECT Service Support (Coming Q1 2027):**
- **Primary Issues:** Multi-channel client communication, relationship management, communication workflows
- **Support Agents:** Customer Support Digital Agent (first contact), Solutions Engineer Digital Agent (technical)
- **Knowledge Base:** CONNECT configuration guides, communication setup, relationship management
- **RevOps Attribution:** 1 point per ticket resolved (10% indirect credit if customer retained)
- **Service Status:** Coming Q1 2027 - Support agents prepared but service not yet available

**Service Adoption Funnel Support:**
- **Entry Point:** INTAKE (Benjamin) - Primary service support (Available Now)
- **Early Adopters:** INTAKE + SETTLE support (Q3 2026)
- **Power Users:** INTAKE + SETTLE + DRAFT support (Q4 2026)
- **Complete Suite:** All services support (Q1 2027)
- **Founding Members:** All services + community contribution + exclusive pricing support

**Customer Journey & Service Stage Mapping:**

**Pre-Sale Stages:**
- **Awareness:** General TrueVow information, INTAKE service overview
- **Consideration:** INTAKE (Benjamin) as primary service, future services (SETTLE, DRAFT, CONNECT) mentioned
- **Decision:** INTAKE-focused onboarding, 6-hour SLA emphasis
- **Onboarding:** INTAKE configuration (phone forwarding, calendar, practice-specific scripts)

**Post-Sale Service Stages:**
- **INTAKE Stage:** Support for INTAKE service issues, Benjamin configuration, practice-specific setup
- **SETTLE Stage (Q3 2026):** Support for SETTLE service issues, settlement tracking, negotiation workflows
- **DRAFT Stage (Q4 2026):** Support for DRAFT service issues, template configuration, document generation
- **VERIFY Stage:** Support for VERIFY service issues, verification workflows, INTAKE/DRAFT integration
- **CONNECT Stage (Q1 2027):** Support for CONNECT service issues, multi-channel communication, relationship management

**Retention & Expansion Stage:**
- **Service Adoption:** Guide customers through service adoption funnel (INTAKE → SETTLE → DRAFT → CONNECT)
- **Expansion Opportunities:** Identify customers ready for next service
- **Health Monitoring:** Monitor customer health across all services
- **Retention:** Proactive outreach for at-risk customers

##### 8.9.4 Error Handling & Resilience

**Purpose:** Ensure agents handle errors gracefully and maintain system reliability.

**Circuit Breakers:**
- **Per-LLM Provider:** Separate circuit breakers for Claude and Kimi
- **Failure Threshold:** Open circuit after N consecutive failures
- **Recovery:** Half-open state for testing before full recovery
- **Monitoring:** Track circuit breaker state and failures

**Retry Logic:**
- **Exponential Backoff:** Retry with increasing delays (1s, 2s, 4s, 8s)
- **Max Retries:** Configurable max retry attempts (default: 3)
- **Retry Conditions:** Retry on transient errors (timeout, rate limit)
- **No Retry:** Don't retry on permanent errors (invalid input, auth failure)

**Fallback Agents:**
- **Primary Agent Failure:** Fallback to alternative agent
- **LLM Failure:** Fallback to alternative LLM provider
- **Backup Workflows:** Predefined backup workflows for critical paths
- **Human Escalation:** Escalate to human agent if all fallbacks fail

**Dead Letter Queue (DLQ):**
- **Failed Executions:** Store failed agent executions in DLQ
- **Retry Later:** Retry failed executions after investigation
- **Manual Review:** Human review of DLQ items
- **Error Analysis:** Analyze DLQ patterns for system improvements

**State Recovery:**
- **Checkpoints:** Save state before critical operations
- **Resume from Checkpoint:** Resume from last checkpoint on failure
- **State Validation:** Validate state before resuming
- **Recovery UI:** Admin interface for manual state recovery

##### 8.9.5 Human Training & Feedback System

**Purpose:** Enable human agents to train AI agents through feedback and corrections.

**Feedback UI:**
- **Correction Interface:** UI for human agents to correct AI responses
- **Feedback Types:**
  - Response correction (wrong answer)
  - Escalation correction (should/shouldn't escalate)
  - Tone correction (too formal/casual)
  - Accuracy correction (incorrect information)
- **Explanation Field:** Human agents can explain why correction is needed
- **Tagging:** Tag feedback by type, severity, category

**Correction Replay:**
- **Training Examples:** Convert corrections into training examples
- **Replay System:** Replay corrections to improve agent behavior
- **Learning Engine:** Update agent briefs and knowledge base based on feedback
- **A/B Testing:** Test improvements before full deployment

**Training Data Collection:**
- **Tagged Corrections:** Store all corrections with tags and metadata
- **Feedback Analytics:** Analyze feedback patterns
- **Quality Metrics:** Track improvement over time
- **Feedback Loop:** Continuous improvement based on feedback

**Learning Engine:**
- **Brief Updates:** Update agent briefs based on feedback
- **Knowledge Base Updates:** Update KB with new information from corrections
- **Guardrail Updates:** Refine guardrails based on feedback
- **Performance Improvement:** Measure improvement after training

##### 8.9.6 Agent State Management

**Purpose:** Manage agent state across conversations and workflows.

**Conversation State:**
- **Per-Ticket State:** Maintain state for each ticket/customer
- **State Storage:** Store state in database or cache
- **State Structure:**
  ```json
  {
    "ticket_id": "ticket_123",
    "customer_id": "customer_456",
    "conversation_history": [...],
    "current_step": "analyzing_issue",
    "context": {...},
    "metadata": {...}
  }
  ```
- **State Persistence:** Persist state across agent restarts

**Workflow State:**
- **Multi-Step Workflows:** Track progress through multi-step processes
- **Step Completion:** Mark steps as complete
- **Workflow Recovery:** Resume workflows from last completed step
- **Workflow Timeout:** Handle workflow timeouts gracefully

**State Checkpoints:**
- **Before Critical Operations:** Save state before critical actions
- **Checkpoint Frequency:** Configurable checkpoint frequency
- **State Validation:** Validate state before checkpoints
- **Recovery from Checkpoints:** Restore state from checkpoints on failure

**State Recovery:**
- **Automatic Recovery:** Automatically recover from last checkpoint
- **Manual Recovery:** Admin interface for manual state recovery
- **State Validation:** Validate recovered state
- **Recovery Logging:** Log all recovery operations

##### 8.9.7 Rate Limiting & Cost Control

**Purpose:** Control agent execution frequency and LLM costs.

**Per-Agent Rate Limits:**
- **Calls per Hour:** Limit agent executions per hour (e.g., Customer Support Agent: 100 tickets/hour)
- **Calls per Day:** Daily execution limits
- **Burst Limits:** Allow short bursts above hourly limit
- **Rate Limit UI:** Admin interface for configuring rate limits

**Token Budgets:**
- **Daily Token Limits:** Set daily token budgets per agent
- **Monthly Token Limits:** Set monthly token budgets
- **Cost Alerts:** Alert when approaching token budget
- **Budget Enforcement:** Stop agent execution when budget exceeded

**Cost Monitoring:**
- **Per-Agent Costs:** Track costs per agent
- **Per-Ticket Costs:** Track costs per ticket resolution
- **Per-Customer Costs:** Track costs per customer
- **Cost Dashboards:** Visualize costs across agents and time periods

**Usage Tracking:**
- **Execution Frequency:** Track how often each agent executes
- **Success Rate:** Track success rate per agent
- **Token Usage:** Track token usage per agent
- **Cost Optimization:** Identify opportunities to reduce costs

##### 8.9.8 Agent Coordination & Conflict Resolution

**Purpose:** Prevent conflicts when multiple agents work on the same resource.

**Conflict Detection:**
- **Resource Locking:** Lock tickets when agent is working on them
- **Conflict Alerts:** Alert when multiple agents attempt to work on same resource
- **Conflict Resolution:** Automatic resolution based on priority rules
- **Conflict Logging:** Log all conflicts for analysis

**Lock Management:**
- **Ticket Locks:** Lock tickets during agent execution
- **Lock Timeout:** Release locks after timeout
- **Lock Ownership:** Track which agent owns each lock
- **Lock UI:** Admin interface for viewing and managing locks

**Priority Queuing:**
- **High Priority:** Urgent tickets processed first
- **Medium Priority:** Normal tickets processed next
- **Low Priority:** Low-priority tickets processed last
- **Priority Rules:** Configurable priority rules

**Handoff Protocols:**
- **Context Passing:** Pass full context when handing off between agents
- **Handoff Validation:** Validate context before handoff
- **Handoff Logging:** Log all handoffs for audit trail
- **Handoff UI:** Visualize agent handoffs in UI

##### 8.9.9 Monitoring & Debugging

**Purpose:** Monitor agent performance and debug issues.

**Execution Tracing:**
- **End-to-End Traces:** Trace agent execution from start to finish
- **Trace Storage:** Store traces for analysis
- **Trace Visualization:** Visualize traces in UI
- **Trace Search:** Search traces by agent, ticket, customer, time

**Performance Metrics:**
- **Execution Time:** Track time per agent execution
- **Token Usage:** Track tokens per execution
- **Success Rate:** Track success rate per agent
- **Cost per Execution:** Track cost per execution

**Error Tracking:**
- **Categorized Errors:** Categorize errors by type
- **Error Alerts:** Alert on critical errors
- **Error Analytics:** Analyze error patterns
- **Error Resolution:** Track error resolution time

**Debug Mode:**
- **Verbose Logging:** Enable verbose logging for debugging
- **LLM Call Logs:** Log all LLM API calls
- **Context Logs:** Log context passed between agents
- **Debug UI:** Admin interface for viewing debug logs

##### 8.9.10 Testing & Validation

**Purpose:** Test agents before deployment and validate their behavior.

**Simulation Mode:**
- **Test Without Side Effects:** Test agents without affecting production
- **Mock Data:** Use mock data for testing
- **Simulation UI:** UI for running simulations
- **Simulation Results:** View simulation results and metrics

**Test Scenarios:**
- **Happy Paths:** Test successful agent executions
- **Error Paths:** Test error handling and recovery
- **Edge Cases:** Test edge cases and boundary conditions
- **Load Testing:** Test agent performance under load

**Validation Rules:**
- **Input Validation:** Validate agent inputs
- **Output Validation:** Validate agent outputs
- **Format Validation:** Validate response formats
- **Content Validation:** Validate response content

**Sandbox Environment:**
- **Isolated Testing:** Test agents in isolated environment
- **Production-Like:** Sandbox mirrors production environment
- **Test Data:** Use test data in sandbox
- **Sandbox UI:** Admin interface for managing sandbox

##### 8.9.11 Human Override & Control

**Purpose:** Enable human agents to override and control AI agents.

**Pause Agent:**
- **Mid-Execution Pause:** Pause agent during execution
- **Pause UI:** UI for pausing agents
- **Pause State:** Save state when pausing
- **Resume:** Resume agent from paused state

**Manual Intervention:**
- **Take Over Conversation:** Human agent takes over from AI agent
- **Context Preservation:** Preserve AI agent context for human
- **Handoff UI:** UI for smooth handoff
- **Handoff Logging:** Log all handoffs

**Emergency Stop:**
- **Global Stop:** Stop all agents immediately
- **Per-Agent Stop:** Stop specific agent immediately
- **Stop UI:** UI for emergency stop
- **Stop Confirmation:** Require confirmation for emergency stop

**Override Decisions:**
- **Override AI Decision:** Human agent overrides AI agent decision
- **Override Logging:** Log all overrides
- **Override Analytics:** Analyze override patterns
- **Training Data:** Use overrides as training data

##### 8.9.12 Data Quality & Validation

**Purpose:** Ensure data quality in agent inputs and outputs.

**Input Validation:**
- **Required Fields:** Validate required fields are present
- **Format Validation:** Validate data formats (email, phone, etc.)
- **Type Validation:** Validate data types
- **Range Validation:** Validate data ranges

**Output Validation:**
- **Expected Format:** Validate output matches expected format
- **Data Types:** Validate output data types
- **Content Validation:** Validate output content
- **Completeness:** Validate output is complete

**PII Detection:**
- **Identify PII:** Detect personally identifiable information
- **Redaction:** Redact PII before LLM calls
- **PII Logging:** Log PII detection for audit
- **Compliance:** Ensure PII handling complies with regulations

**Data Sanitization:**
- **Remove Sensitive Data:** Remove sensitive data before LLM calls
- **Sanitization Rules:** Configurable sanitization rules
- **Sanitization Logging:** Log all sanitization operations
- **Data Quality Metrics:** Track data quality metrics

##### 8.9.13 Agent Performance Monitoring

**Metrics:**
- Resolution rate (AI vs Human)
- Average resolution time
- Customer satisfaction (CSAT)
- Escalation rate
- Cost per resolution
- Token usage per resolution
- Success rate per agent
- Error rate per agent

**Dashboards:**
- Agent performance dashboard
- AI vs Human comparison
- Cost tracking dashboard
- Quality metrics dashboard
- Error rate dashboard
- Token usage dashboard

##### 8.9.14 Agent Testing & Validation

**Testing:**
- Unit tests for agent logic
- Integration tests for workflows
- E2E tests for complete flows
- Performance tests for scalability
- Load tests for high-volume scenarios
- Stress tests for error conditions

**Validation:**
- Response quality validation
- Escalation accuracy validation
- Cost efficiency validation
- Customer satisfaction validation
- JTBD outcome validation
- Guardrail compliance validation

---

#### 8.10 Human Roles & Job Responsibilities Integration

##### 8.10.1 Organizational Structure Integration

**Purpose:** Integrate CS-Support Service agents with TrueVow's Organizational Roles & Structure (V01) for proper role-based activity mapping, attribution, and performance tracking.

**Customer Success Organization Roles:**

1. **Head of Customer Success (VP CS):**
   - **Role:** Customer success strategy, team management, customer health oversight
   - **AI Support:** Escalation Monitoring Agent, Customer Health Agent
   - **RevOps Attribution:** Strategic oversight activities

2. **Customer Success Manager (CSM) (IC):**
   - **Role:** Account management, customer onboarding, dispute handling, refund management, billing operations
   - **AI Support:** Customer Success Digital Agent
   - **Time Allocation:**
     - 30% Account Management
     - 20% Customer Onboarding
     - 15% Dispute Handling
     - 10% Refund Management
     - 10% Billing Operations
     - 10% Team Coordination
     - 5% Reporting
   - **RevOps Attribution:**
     - Upsell closed: 20 points (direct revenue)
     - Customer retained: 15 points (direct revenue)
     - Customer onboarded: 10 points

3. **Support Manager:**
   - **Role:** Team management, support operations oversight
   - **AI Support:** Escalation Monitoring Agent, Ticket Quality Agent
   - **RevOps Attribution:** Team management activities

4. **Customer Solutions Engineer (Support Agent) (IC):**
   - **Role:** Technical support, billing support, documentation, escalation
   - **AI Support:** Customer Support Digital Agent, Solutions Engineer Digital Agent
   - **Time Allocation:**
     - 50% Technical Support
     - 20% Billing Support
     - 15% Documentation
     - 10% Escalation
     - 5% Reporting
   - **RevOps Attribution:**
     - Support ticket resolved: 1 point
     - Customer retained: 10 points (indirect credit if customer retained)

5. **Security Manager & Security Specialists:**
   - **Role:** Security operations, compliance monitoring
   - **AI Support:** (Future: Security Compliance Agent)

6. **Compliance Manager & Compliance Specialists:**
   - **Role:** Compliance operations, regulatory monitoring
   - **AI Support:** (Future: Compliance Monitoring Agent)

##### 8.10.2 Role-Based Activity Mapping

**Purpose:** Map all agent activities to organizational roles for proper attribution and performance tracking.

**Activity Mapping Structure:**
```json
{
  "activity_id": "act_123",
  "agent_id": "agent_customer_support",
  "activity_type": "ticket_resolved",
  "role_mapping": {
    "primary_role": "Customer Solutions Engineer (Support Agent)",
    "function": "Customer Success Organization",
    "reports_to": "Support Manager"
  },
  "attribution": {
    "direct_revenue": false,
    "indirect_revenue": true,
    "credit_percentage": 10,
    "points": 1
  }
}
```

**Activity Types by Role:**

**Customer Success Manager (CSM) Activities:**
- Account management (30% time allocation)
- Customer onboarding (20% time allocation) → 10 points
- Dispute handling (15% time allocation)
- Refund management (10% time allocation)
- Billing operations (10% time allocation)
- Team coordination (10% time allocation)
- Reporting (5% time allocation)
- Upsell closed → 20 points (direct revenue)
- Customer retained → 15 points (direct revenue)

**Support Agent (Customer Solutions Engineer) Activities:**
- Technical support (50% time allocation) → 1 point per ticket resolved
- Billing support (20% time allocation)
- Documentation (15% time allocation)
- Escalation (10% time allocation)
- Reporting (5% time allocation)
- Customer retained → 10 points (indirect credit if customer retained)

**Solutions Engineer Activities:**
- Technical troubleshooting → 2 points per complex issue resolved
- Configuration assistance → 1 point per configuration
- Integration support → 3 points per integration completed

**AI Agent Activities:**
- **AI CS Assistant:** Customer onboarded → 10 points (10% indirect credit if customer retained)
- **AI Support Agent:** Ticket resolved → 1 point (10% indirect credit if customer retained)
- **AI Solutions Engineer:** Technical issue resolved → 2 points

##### 8.10.3 Time Allocation Tracking

**Purpose:** Track time allocation by role to ensure alignment with organizational structure and feed into RevOps.

**Time Allocation by Role:**

**Customer Success Manager (CSM):**
- 30% Account Management
- 20% Customer Onboarding
- 15% Dispute Handling
- 10% Refund Management
- 10% Billing Operations
- 10% Team Coordination
- 5% Reporting

**Support Agent (Customer Solutions Engineer):**
- 50% Technical Support
- 20% Billing Support
- 15% Documentation
- 10% Escalation
- 5% Reporting

**Integration with Internal Ops Service:**
- Time allocation data sent to Internal Ops Service
- Time allocation feeds into RevOps scoring
- Time allocation used for performance metrics
- Timezone-aware scheduling (PKT vs USA timezones)

**Time Allocation Tracking:**
- Track time spent per activity type
- Track time allocation by role
- Track time allocation by function (Customer Success Organization)
- Validate time allocation against role requirements
- Generate time allocation reports

##### 8.10.4 Role-Based Performance Tracking

**Purpose:** Track performance by role for proper evaluation and optimization.

**Performance Metrics by Role:**

**CSM Performance:**
- Upsells closed (direct revenue)
- Customer retention rate (direct revenue)
- Customer onboarding completion rate
- Account health scores
- Time allocation compliance

**Support Agent Performance:**
- Tickets resolved per day
- Average resolution time
- Customer satisfaction (CSAT)
- Escalation rate
- Time allocation compliance

**Role-Based Dashboards:**
- Individual role dashboard (CSM, Support Agent, etc.)
- Team dashboard (Customer Success Organization)
- Function dashboard (Customer Success vs Platform vs Revenue)
- Performance comparison by role

**Performance Reporting:**
- Individual performance reports (by role)
- Team performance reports (by function)
- Role-based performance comparison
- Performance trends over time

##### 8.10.5 Integration with Internal Ops Service RevOps

**Purpose:** Integrate CS-Support Service activities with Internal Ops Service RevOps system for comprehensive revenue operations tracking.

**Activity Logging:**
- All CS-Support activities logged to Internal Ops Service
- Activities include role mapping information
- Activities include attribution details
- Activities include time allocation data

**RevOps Integration:**
- Activities sent to Internal Ops Service via API
- Internal Ops Service processes activities for RevOps scoring
- RevOps attribution calculated by Internal Ops Service
- RevOps reports generated by Internal Ops Service

**API Integration:**
```typescript
// CS-Support Service → Internal Ops Service
POST /api/v1/revops/activities
{
  "activity_id": "act_123",
  "service": "cs-support",
  "agent_id": "agent_customer_support",
  "activity_type": "ticket_resolved",
  "role_mapping": {
    "primary_role": "Customer Solutions Engineer (Support Agent)",
    "function": "Customer Success Organization"
  },
  "attribution": {
    "points": 1,
    "indirect_revenue": true,
    "credit_percentage": 10
  },
  "timestamp": "2026-01-08T10:00:00Z"
}
```

**RevOps Reports:**
- Individual performance reports (by role)
- Team performance reports (by function)
- Revenue attribution reports (by role, by function)
- Activity-to-revenue correlation reports
- AI vs Human performance comparison (by role)

---

## Shared Inbox Migration

### Migration Overview

The Shared Inbox module is currently in the SaaS Admin repository and needs to be migrated to the CS-Support Service.

**Current Location:**
- Repository: `2025-TrueVow-SaaS-Administration/`
- Path: `app/(dashboard)/customer-support/inbox/`
- Status: ✅ Production-ready (100% complete)

**Target Location:**
- Repository: `TrueVow-CS-Support/` (NEW - TO BE CREATED)
- Path: `app/(dashboard)/inbox/`
- Status: 🔄 Migration planned

---

### What to Migrate

#### 1. UI Pages
- ✅ `app/(dashboard)/customer-support/inbox/page.tsx` → `app/(dashboard)/inbox/page.tsx`
- ✅ `app/(dashboard)/customer-support/inbox/[id]/page.tsx` → `app/(dashboard)/inbox/[id]/page.tsx`
- ✅ `app/(dashboard)/customer-support/activity-feed/page.tsx` → `app/(dashboard)/activity-feed/page.tsx`
- ✅ `app/(dashboard)/customer-support/team-performance/page.tsx` → `app/(dashboard)/team-performance/page.tsx`

#### 2. API Endpoints
- ✅ `app/api/v1/support/email/**` → `app/api/v1/email/`
- ✅ `app/api/v1/support/tickets/**` → `app/api/v1/tickets/`
- ✅ `app/api/v1/support/activity-feed/**` → `app/api/v1/activity-feed/`
- ✅ `app/api/v1/support/agent-performance/**` → `app/api/v1/agent-performance/`
- ✅ All other `app/api/v1/support/**` endpoints

#### 3. Database Tables
- ✅ `support_tickets`
- ✅ `support_messages`
- ✅ `support_team_activity_feed`
- ✅ `support_agent_performance_metrics`
- ✅ `support_email_logs`
- ✅ `support_notifications`
- ✅ All other `support_*` tables

#### 4. Components
- ✅ All support-related components
- ✅ Shared inbox components
- ✅ Team collaboration components
- ✅ Rich text editor components

#### 5. Utilities & Libraries
- ✅ API clients
- ✅ Email/SMS/Chat integrations
- ✅ AI integration code
- ✅ Utility functions

---

### Migration Enhancements

#### 1. Pre-Sale/Post-Sale Support
**Requirement:** Support Sales team access to first-touch communications

**Changes:**
- Add `stage` field to `support_tickets` (pre-sale, post-sale, converted)
- Add `source` field to `support_tickets` (lead, customer, internal)
- Add API filtering by stage and source
- Enable Sales CRM Service to access pre-sale conversations via API

**Database Migration:**
```sql
ALTER TABLE support_tickets ADD COLUMN stage VARCHAR(20) 
  CHECK (stage IN ('pre-sale', 'post-sale', 'converted'));
  
ALTER TABLE support_tickets ADD COLUMN source VARCHAR(50) 
  CHECK (source IN ('lead', 'customer', 'internal'));

CREATE INDEX idx_support_tickets_stage ON support_tickets(stage);
CREATE INDEX idx_support_tickets_source ON support_tickets(source);
```

**API Enhancement:**
```typescript
GET /api/v1/inbox
  Query params:
    - stage: 'pre-sale' | 'post-sale' | 'all'
    - source: 'lead' | 'customer' | 'all'
    - assigned_to: 'sales' | 'support' | 'all'
```

#### 2. Sales CRM Integration
**Requirement:** Sales team needs API access to pre-sale conversations

**Implementation:**
- Sales CRM Service calls CS-Support API
- Filter: `stage='pre-sale'`, `assigned_to='sales'`
- Sales can reply, assign, convert to lead
- Full conversation history preserved

**API Client (Sales CRM Service):**
```typescript
// lib/integrations/cs-support/client.ts
export class CSSupportClient {
  async getSalesInbox(filters?: {
    stage?: 'pre-sale'
    assigned_to?: 'sales'
  }) {
    return this.get('/api/v1/inbox', { params: filters })
  }
  
  async replyToConversation(conversationId: string, message: string) {
    return this.post(`/api/v1/inbox/${conversationId}/reply`, { message })
  }
  
  async convertToCustomer(conversationId: string, tenantId: string) {
    return this.post(`/api/v1/inbox/${conversationId}/convert`, { tenant_id: tenantId })
  }
}
```

---

### Migration Plan

#### Phase 1: Repository Setup (Week 1)
- ✅ Create `TrueVow-CS-Support` repository
- ✅ Set up Next.js 14 project structure
- ✅ Configure authentication (Clerk)
- ✅ Set up database connection
- ✅ Configure environment variables

#### Phase 2: Core Migration (Week 2-3)
- ✅ Migrate UI pages
- ✅ Migrate API endpoints
- ✅ Migrate components
- ✅ Update import paths
- ✅ Update routing

#### Phase 3: Database Migration (Week 3)
- ✅ Create database schema
- ✅ Migrate data (if needed)
- ✅ Add new fields (stage, source)
- ✅ Create indexes
- ✅ Test data integrity

#### Phase 4: Integration Updates (Week 4)
- ✅ Update Sales CRM Service integration
- ✅ Update Platform Service integration
- ✅ Update webhook endpoints
- ✅ Test all integrations
- ✅ Update documentation

#### Phase 5: Testing & Launch (Week 5)
- ✅ End-to-end testing
- ✅ Performance testing
- ✅ Security testing
- ✅ User acceptance testing
- ✅ Production deployment
- ✅ Monitor and fix issues

---

## Technical Architecture

### 3.1 Technology Stack

#### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.3+
- **Styling:** Tailwind CSS 3.4+
- **Icons:** Lucide React
- **State Management:** Zustand (client state), React Query (server state)
- **Forms:** React Hook Form
- **Rich Text:** Tiptap or similar
- **Charts:** Recharts

#### Backend (If Separate)
- **Framework:** FastAPI (Python) or Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma or SQLAlchemy
- **Caching:** Redis (optional)

#### Authentication
- **Provider:** Clerk 5.0+ (Centralized authentication, used independently by CS-Support Service)
- **Methods:** Email/password, SSO
- **Session:** Server-side session management (Clerk handles sessions)
- **RBAC:** Role-based access control (via Clerk metadata)
- **Architecture:** CS-Support Service uses Clerk SDK directly (no dependency on SaaS Admin)
- **Configuration:** Same Clerk application as other services (shared organization) OR separate Clerk app per service
- **JWT Validation:** CS-Support Service validates JWT tokens independently using Clerk's public key

#### Integrations
- **Email:** SendGrid
- **SMS:** Twilio
- **WhatsApp:** Twilio (WhatsApp Business API) - Alternative to SMS
- **Calls:** Twilio
- **Chat:** Custom widget or third-party
- **Facebook:** Facebook Graph API
- **AI:** Anthropic Claude, Kimi (via API)

#### Development Tools
- **Testing:** Playwright for E2E tests
- **Linting:** ESLint with Next.js config
- **Type Checking:** TypeScript strict mode
- **Build:** Next.js production build

---

### 3.2 Architecture Patterns

#### Service-Oriented Architecture
```
CS-Support Service (Port 3003)
  ├── Frontend (Next.js)
  ├── API Routes (Next.js API Routes)
  ├── Database (PostgreSQL/Supabase)
  └── Integrations (Email, SMS, WhatsApp, AI, etc.)

External Services:
  ├── Sales CRM Service → API calls for pre-sale conversations
  ├── Platform Service → Tenant/subscription data
  └── Customer Portal → Customer self-service portal
```

#### API-First Design
- All features exposed via REST API
- Sales CRM Service accesses via API
- Customer Portal accesses via API (future)
- Internal tools access via API

#### Multi-Tenant Support
- Support for multiple organizations (if needed)
- Tenant isolation at database level
- Tenant-scoped queries

---

### 3.3 Database Schema

#### Database: `support_db` (PostgreSQL)

**Core Tables:**

```sql
-- AI Agent Configuration
CREATE TABLE support_llm_agents (
    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(255) NOT NULL UNIQUE,
    agent_type VARCHAR(100) NOT NULL CHECK (agent_type IN (
        'customer_support', 'customer_success', 'solutions_engineer',
        'escalation_monitoring', 'knowledge_base', 'customer_health', 'ticket_quality'
    )),
    status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'testing', 'maintenance')) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    brief_config JSONB NOT NULL, -- Role, JTBD, context, guardrails, steps, outcomes
    knowledge_base JSONB, -- Documents, text content, embeddings, update schedule
    llm_config JSONB NOT NULL, -- Model, temperature, max_tokens, system_prompt
    performance_metrics JSONB, -- Execution time, token usage, success rate
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_support_llm_agents_status ON support_llm_agents(status);
CREATE INDEX idx_support_llm_agents_type ON support_llm_agents(agent_type);
CREATE INDEX idx_support_llm_agents_active ON support_llm_agents(is_active);

-- Support Tickets
CREATE TABLE support_tickets (
    ticket_id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(tenant_id),
    customer_id UUID,
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    subject VARCHAR(500),
    channel VARCHAR(50) CHECK (channel IN ('email', 'sms', 'whatsapp', 'call', 'chat', 'facebook', 'form')),
    status VARCHAR(50) CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    stage VARCHAR(20) CHECK (stage IN ('pre-sale', 'post-sale', 'converted')),
    source VARCHAR(50) CHECK (source IN ('lead', 'customer', 'internal')),
    -- Service-Specific Fields
    truevow_service VARCHAR(50) CHECK (truevow_service IN ('INTAKE', 'DRAFT', 'VERIFY', 'SETTLE', 'CONNECT', 'ALL', NULL)),
    service_stage VARCHAR(50) CHECK (service_stage IN ('Pre-sale', 'Post-sale', 'Retention', NULL)),
    service_adoption_status VARCHAR(50) CHECK (service_adoption_status IN (
        'intake_only', 'intake_settle', 'intake_settle_draft', 'complete_suite', 'founding_member', NULL
    )),
    practice_area VARCHAR(100), -- PI, Family Law, Immigration, etc.
    assigned_to UUID REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    sla_first_response_target TIMESTAMPTZ,
    sla_resolution_target TIMESTAMPTZ,
    tags TEXT[],
    metadata JSONB
);

CREATE INDEX idx_support_tickets_service ON support_tickets(truevow_service);
CREATE INDEX idx_support_tickets_service_stage ON support_tickets(service_stage);
CREATE INDEX idx_support_tickets_adoption_status ON support_tickets(service_adoption_status);
CREATE INDEX idx_support_tickets_practice_area ON support_tickets(practice_area);

-- Support Messages (Conversation Thread)
CREATE TABLE support_messages (
    message_id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(ticket_id),
    from_type VARCHAR(50) CHECK (from_type IN ('customer', 'agent', 'system')),
    from_user_id UUID REFERENCES users(user_id),
    body TEXT,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    in_reply_to UUID REFERENCES support_messages(message_id),
    references_header TEXT[]
);

-- Support Team Activity Feed
CREATE TABLE support_team_activity_feed (
    activity_id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(ticket_id),
    user_id UUID REFERENCES users(user_id),
    activity_type VARCHAR(100) CHECK (activity_type IN (
        'ticket_created',
        'ticket_assigned',
        'ticket_resolved',
        'ticket_closed',
        'message_sent',
        'status_changed',
        'priority_changed',
        'sla_breached',
        'escalated'
    )),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Agent Performance Metrics
CREATE TABLE support_agent_performance_metrics (
    metric_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    period_start DATE,
    period_end DATE,
    tickets_assigned INT DEFAULT 0,
    tickets_resolved INT DEFAULT 0,
    avg_response_time INTERVAL,
    avg_resolution_time INTERVAL,
    csat_score DECIMAL(3,2),
    sla_compliance_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Email Logs
CREATE TABLE support_email_logs (
    log_id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(ticket_id),
    message_id UUID REFERENCES support_messages(message_id),
    email_id VARCHAR(255),
    from_email VARCHAR(255),
    to_email VARCHAR(255),
    subject VARCHAR(500),
    status VARCHAR(50) CHECK (status IN ('sent', 'delivered', 'bounced', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Notifications
CREATE TABLE support_notifications (
    notification_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    ticket_id UUID REFERENCES support_tickets(ticket_id),
    type VARCHAR(50) CHECK (type IN ('assignment', 'sla_breach', 'escalation', 'mention')),
    title VARCHAR(255),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Base Articles
CREATE TABLE support_kb_articles (
    article_id UUID PRIMARY KEY,
    title VARCHAR(500),
    content TEXT,
    category VARCHAR(100),
    tags TEXT[],
    status VARCHAR(50) CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID REFERENCES users(user_id),
    views INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Knowledge Base Categories
CREATE TABLE support_kb_categories (
    category_id UUID PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    parent_category_id UUID REFERENCES support_kb_categories(category_id),
    order_index INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Health Scores
CREATE TABLE customer_health_scores (
    health_id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(tenant_id),
    health_score INT CHECK (health_score >= 0 AND health_score <= 100),
    health_level VARCHAR(50) CHECK (health_level IN ('healthy', 'at_risk', 'critical')),
    factors JSONB, -- { usage: 30, support_tickets: 20, nps: 25, payment: 15, engagement: 10 }
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    previous_score INT,
    trend VARCHAR(50) CHECK (trend IN ('improving', 'stable', 'declining'))
);

-- Indexes
CREATE INDEX idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_stage ON support_tickets(stage);
CREATE INDEX idx_support_tickets_source ON support_tickets(source);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX idx_support_activity_ticket ON support_team_activity_feed(ticket_id);
CREATE INDEX idx_support_activity_user ON support_team_activity_feed(user_id);
CREATE INDEX idx_support_activity_type ON support_team_activity_feed(activity_type);
CREATE INDEX idx_customer_health_tenant ON customer_health_scores(tenant_id);
CREATE INDEX idx_customer_health_level ON customer_health_scores(health_level);
```

**Database Location:**
- **Development:** Local PostgreSQL or Supabase
- **Production:** Supabase (PostgreSQL) or dedicated PostgreSQL instance
- **Schema:** `support` schema (or default `public` schema)

**Data Isolation:**
- **Multi-Tenant:** All queries scoped by `tenant_id` (if supporting multiple organizations)
- **Row-Level Security:** RLS policies enforce tenant isolation (if using Supabase)
- **Backup:** Daily automated backups
- **Retention:** Support ticket data retained per compliance requirements

---

### 3.4 File Structure

```
TrueVow-CS-Support/
├── app/
│   ├── (auth)/                    # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/               # Protected dashboard
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── inbox/                 # Shared Inbox
│   │   │   ├── page.tsx           # Inbox list
│   │   │   └── [id]/page.tsx     # Conversation detail
│   │   ├── activity-feed/         # Activity feed
│   │   ├── team-performance/      # Performance dashboard
│   │   ├── knowledge-base/        # Knowledge base
│   │   ├── customer-success/      # Customer success
│   │   └── settings/              # Settings
│   ├── api/
│   │   └── v1/
│   │       ├── inbox/             # Inbox API
│   │       ├── tickets/          # Tickets API
│   │       ├── email/             # Email API
│   │       ├── activity-feed/     # Activity feed API
│   │       └── agent-performance/ # Performance API
│   └── layout.tsx                 # Root layout
├── components/
│   ├── inbox/                     # Inbox components
│   ├── tickets/                   # Ticket components
│   ├── knowledge-base/            # KB components
│   └── shared/                    # Shared components
├── lib/
│   ├── api/                       # API clients
│   ├── integrations/              # Third-party integrations
│   │   ├── sendgrid/
│   │   ├── twilio/
│   │   └── ai/
│   └── utils/                     # Utility functions
├── middleware.ts                   # Clerk authentication
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

### 3.5 API Endpoints Specification

#### Inbox API (`/api/v1/inbox`)

```typescript
// Get inbox conversations
GET /api/v1/inbox
  Query params:
    - stage?: 'pre-sale' | 'post-sale' | 'all'
    - source?: 'lead' | 'customer' | 'all'
    - status?: 'open' | 'pending' | 'resolved' | 'closed' | 'all'
    - channel?: 'email' | 'sms' | 'whatsapp' | 'call' | 'chat' | 'facebook' | 'form' | 'all'
    - assigned_to?: string (user_id) | 'unassigned' | 'all'
    - priority?: 'low' | 'medium' | 'high' | 'urgent' | 'all'
    - search?: string (full-text search)
    - page?: number
    - per_page?: number (default: 50)
  Returns: { conversations: [], total: number, page: number, per_page: number }

// Get conversation detail
GET /api/v1/inbox/{id}
  Returns: { conversation: ConversationDetail }

// Reply to conversation
POST /api/v1/inbox/{id}/reply
  Body: { 
    message: string,
    is_internal?: boolean,
    assign_to?: string (user_id),
    tags?: string[]
  }
  Returns: { message: Message }

// Convert pre-sale to post-sale
POST /api/v1/inbox/{id}/convert
  Body: { tenant_id: string, converted_at?: string }
  Returns: { conversation: ConversationDetail }
```

#### Tickets API (`/api/v1/tickets`)

```typescript
// Create ticket
POST /api/v1/tickets
  Body: {
    tenant_id: string,
    customer_email: string,
    customer_name?: string,
    subject: string,
    channel: string,
    priority?: string,
    stage?: 'pre-sale' | 'post-sale',
    source?: 'lead' | 'customer' | 'internal'
  }
  Returns: { ticket: Ticket }

// Get ticket
GET /api/v1/tickets/{id}
  Returns: { ticket: TicketDetail }

// Update ticket
PUT /api/v1/tickets/{id}
  Body: {
    status?: string,
    priority?: string,
    assigned_to?: string,
    tags?: string[]
  }
  Returns: { ticket: Ticket }

// Resolve ticket
POST /api/v1/tickets/{id}/resolve
  Body: { resolution_notes?: string }
  Returns: { ticket: Ticket }

// Close ticket
POST /api/v1/tickets/{id}/close
  Body: { close_reason?: string }
  Returns: { ticket: Ticket }
```

#### Activity Feed API (`/api/v1/activity-feed`)

```typescript
// Get activity feed
GET /api/v1/activity-feed
  Query params:
    - ticket_id?: string
    - user_id?: string
    - activity_type?: string
    - start_date?: string (ISO 8601)
    - end_date?: string (ISO 8601)
    - page?: number
    - per_page?: number
  Returns: { activities: [], total: number }
```

#### Agent Performance API (`/api/v1/agent-performance`)

```typescript
// Get agent performance
GET /api/v1/agent-performance
  Query params:
    - user_id?: string
    - start_date?: string (ISO 8601)
    - end_date?: string (ISO 8601)
  Returns: { 
    agent_id: string,
    tickets_assigned: number,
    tickets_resolved: number,
    avg_response_time: string,
    avg_resolution_time: string,
    csat_score: number,
    sla_compliance_rate: number
  }

// Get team performance
GET /api/v1/agent-performance/team
  Query params:
    - start_date?: string (ISO 8601)
    - end_date?: string (ISO 8601)
  Returns: { agents: [], team_metrics: {} }
```

#### Knowledge Base API (`/api/v1/kb`)

```typescript
// List articles
GET /api/v1/kb/articles
  Query params:
    - category?: string
    - search?: string
    - status?: 'draft' | 'published' | 'archived'
  Returns: { articles: [] }

// Get article
GET /api/v1/kb/articles/{id}
  Returns: { article: ArticleDetail }

// Create article
POST /api/v1/kb/articles
  Body: {
    title: string,
    content: string,
    category: string,
    tags?: string[],
    status?: 'draft' | 'published'
  }
  Returns: { article: Article }

// Update article
PUT /api/v1/kb/articles/{id}
  Body: { title?, content?, category?, tags?, status? }
  Returns: { article: Article }

// Search articles
GET /api/v1/kb/search
  Query params:
    - q: string (search query)
    - limit?: number
  Returns: { articles: [] }
```

#### Customer Success API (`/api/v1/customer-success`)

```typescript
// Get customer health score
GET /api/v1/customer-success/health/{tenant_id}
  Returns: {
    tenant_id: string,
    health_score: number,
    health_level: string,
    factors: {},
    trend: string,
    calculated_at: string
  }

// Get at-risk customers
GET /api/v1/customer-success/at-risk
  Query params:
    - health_level?: 'at_risk' | 'critical'
    - limit?: number
  Returns: { customers: [] }

// Trigger success playbook
POST /api/v1/customer-success/playbooks/{playbook_id}/trigger
  Body: { tenant_id: string }
  Returns: { playbook_execution: {} }
```

---

### 3.6 Security Architecture

#### Authentication Flow
1. User signs in via Clerk
2. Clerk validates credentials
3. Session created with role in metadata
4. Middleware protects routes
5. Server components access role from session

#### Authorization Flow
1. User requests resource
2. Server checks RBAC permissions
3. If authorized: Return resource
4. If not: Return 403 Forbidden

#### Data Isolation
- **Tenant Scoping:** All queries scoped to tenant (if multi-tenant)
- **Role-Based Access:** Different views for different roles
- **No Cross-Tenant Access:** Frontend never exposes other tenants' data

#### API Security
- **API Keys:** Stored server-side, never exposed to client
- **HTTPS Only:** All API calls over HTTPS
- **Rate Limiting:** Backend enforces rate limits
- **Input Validation:** Client and server-side validation

#### LLM Isolation Security (Critical)

**🚨 CRITICAL SECURITY REQUIREMENT - NO EXCEPTIONS**

**Authorized LLM Access:**
- ✅ **CS-Support Service:** Only service with LLM access for customer support and success operations
- ✅ **Sales-CRM Service:** Only service with LLM access for sales operations
- ❌ **All Other Services:** NO LLM ACCESS (Customer Portal, Platform Service, Internal Ops Service)

**Security Controls:**
- **Environment Variable Isolation:** LLM API keys (Claude, Kimi) only in CS-Support Service `.env` files
- **Code Import Restrictions:** Automated CI/CD checks prevent LLM SDK imports in non-authorized services
- **Service-to-Service Authentication:** Customer Portal must use API keys to call CS-Support Service (no direct LLM access)
- **API Gateway Pattern:** All AI agent interactions from Customer Portal route through CS-Support Service APIs
- **Audit Logging:** All LLM API calls logged with service identification, user, timestamp, and request/response metadata

**Compliance Benefits:**
- **Attack Surface Reduction:** Limiting LLM connectivity to 2 services reduces breach vectors
- **Data Isolation:** Customer Portal maintains compliance by isolating LLM connectivity
- **Audit Trail:** Centralized LLM interaction logging in CS-Support Service
- **Access Control:** LLM access controlled through service-level authentication

**Implementation Enforcement:**
- **Pre-commit Hooks:** Block LLM SDK imports in Customer Portal codebase
- **CI/CD Pipeline:** Automated checks to prevent LLM API key usage in non-authorized services
- **Code Review:** Mandatory review for any LLM-related code changes
- **Security Monitoring:** Alert on unauthorized LLM API key usage or direct LLM calls from non-authorized services

**Customer Portal Integration Pattern:**
- Customer Portal calls CS-Support Service API endpoints (e.g., `/api/v1/ai/chat`, `/api/v1/ai/voice`)
- CS-Support Service handles all LLM interactions internally
- No LLM SDKs or API keys in Customer Portal codebase

---

## Organizational Structure Integration

### TrueVow Organizational Structure

The CS-Support Service integrates with TrueVow's organizational structure, specifically the **Customer Success Organization**:

**Customer Success Organization Structure:**
- **Head of Customer Success (VP CS):** Reports to CEO/COO, oversees customer success strategy
  - Direct Reports: CSMs (by region), Support Manager, Security Manager, Compliance Manager
  - Cross-Functional: Works with Sales, Platform, Finance
- **Customer Success Managers (CSMs):** Head of assigned accounts in a region, customer support incharge
  - Reports to: Head of Customer Success
  - Focus: Account ownership, customer onboarding, dispute handling, refund management, billing operations
  - Works with: Support Agents, Sales, Finance
- **Support Manager:** Manages support team, ensures SLA compliance
  - Reports to: Head of Customer Success
  - Direct Reports: Customer Solutions Engineers (Support Agents)
- **Customer Solutions Engineer (Support Agent):** Technical support, first line
  - Reports to: Support Manager
  - Type: Individual Contributor (IC) - No direct reports
  - Focus: Technical support, issue resolution, billing support (view only)
  - Escalates to: CSM for billing decisions, CSM when escalation countdown starts (24-48 hours)
- **Security Manager:** Security operations
  - Reports to: Head of Customer Success
  - Direct Reports: Security Specialists
- **Compliance Manager:** Compliance and audit operations
  - Reports to: Head of Customer Success
  - Direct Reports: Compliance Specialists

**Career Paths:**
- **IC Track:** Junior IC → IC → Senior IC → Principal IC → Distinguished IC
- **Manager Track:** Manager → Senior Manager → Director → VP → C-level

**CS-Support Service Career Paths:**
- **Support IC Track:** Junior Support Agent → Support Agent (IC) → Senior Support Agent (IC) → Principal Support Agent (IC)
- **Support Manager Track:** Support Agent → Support Manager → Head of Customer Success (VP CS) → Chief Customer Officer
- **CSM IC Track:** Junior CSM → CSM (IC) → Senior CSM (IC) → Principal CSM (IC)
- **CSM Manager Track:** CSM → Support Manager → Head of Customer Success (VP CS) → Chief Customer Officer

**Timezone Management:**
- **Evening/Night Shift (6 PM - 2 AM PKT):** Support Agents (USA customer-facing)
  - USA East Coast: 6 PM - 2 AM PKT (8 AM - 4 PM EST)
  - USA West Coast: 7 PM - 3 AM PKT (8 AM - 4 PM PST)
  - Peak Hours: 7 PM - 12 AM PKT (9 AM - 2 PM EST) - Highest customer activity
  - 24/7 Coverage: Shift rotation to ensure continuous support coverage
- **Flexible Shift (2 PM - 10 PM PKT):** CSMs, Head of CS (overlap with both teams)
  - Day Hours (2 PM - 6 PM PKT): Internal coordination, planning, documentation
  - Evening Hours (6 PM - 10 PM PKT): Customer interactions, account management (overlap with USA business hours)
  - USA Coverage: 6 PM - 10 PM PKT covers 8 AM - 12 PM EST (morning hours for USA customers)
- **Day Shift (9 AM - 6 PM PKT):** Internal teams (Platform, Finance)

**Role-Based Activity Tracking:**
- All support activities tracked by role
- Support ticket resolved: 1 point
- Customer onboarded: 10 points
- Customer retained: 15 points
- Upsell closed: 20 points
- AI Support activities tracked separately for comparison

**Performance Bonus Structure:**
- 50% target achievement
- 25% quality metrics
- 25% customer success metrics

**Time Allocation by Role:**

**CSM Time Allocation:**
- Account Management: 30% (24 hours/month)
- Customer Onboarding: 20% (16 hours/month)
- Dispute Handling: 15% (12 hours/month)
- Refund Management: 10% (8 hours/month)
- Billing Operations: 10% (8 hours/month)
- Team Coordination: 10% (8 hours/month)
- Reporting: 5% (4 hours/month)

**Support Agent Time Allocation:**
- Technical Support: 50% (60 hours/month)
- Billing Support: 20% (24 hours/month)
- Documentation: 15% (18 hours/month)
- Escalation: 10% (12 hours/month)
- Reporting: 5% (6 hours/month)

**Task Gauging:**
- Support ticket: 15-30 minutes/ticket (responded during USA business hours)
- Billing question: 10 minutes/question (responded during USA business hours)
- Escalation: 5 minutes/escalation (immediate response during USA business hours)
- Documentation: 30 minutes/article (can be done during non-peak hours)
- Account review: 1 hour/account/month (scheduled during USA business hours)
- Customer onboarding: 4 hours/customer (scheduled during USA business hours)
- Dispute handling: 30 minutes/dispute (can be done during day or evening hours)
- Refund request: 15 minutes/request (can be done during day or evening hours)

---

## Integration Requirements

### 4.1 Internal Ops Service Integration

#### Purpose
Integrate with Internal Ops Service for task management, time tracking, notifications, and RevOps tracking.

#### Integration Points

**From CS-Support Service to Internal Ops Service:**
- **Task Management:** Create tasks for follow-ups, escalations, customer success initiatives
- **Time Tracking:** Log time spent on support tickets, customer success activities
- **Notifications:** Send notifications for SLA breaches, escalations, customer health alerts
- **RevOps Tracking:** Report support activities, AI Support activities for revenue attribution

**From Internal Ops Service to CS-Support Service:**
- **RevOps Data:** Pull support activities, AI Support activities (all Customer Success Organization roles)
- **Task Assignments:** Receive task assignments related to customer support
- **Time Allocation:** Track time allocation by role (Support Agent, CSM, etc.)

**API Endpoints (Internal Ops Service):**
```typescript
// Create task from support ticket
POST /api/v1/tasks
  Body: { 
    title, 
    description, 
    assigned_to, 
    priority, 
    related_ticket_id,
    service: 'cs-support'
  }

// Log time for support activity
POST /api/v1/time/start
  Body: {
    activity_type: 'support_ticket',
    ticket_id: 'ticket_123',
    user_id: 'user_456'
  }

// Report support activity for RevOps
POST /api/v1/revops/activities
  Body: {
    activity_type: 'support_ticket_resolved',
    user_id: 'user_456',
    role: 'support_agent',
    points: 1,
    metadata: { ticket_id: 'ticket_123' }
  }
```

**RevOps Activity Types (CS-Support Service):**
- `support_ticket_resolved` (1 point)
- `customer_onboarded` (10 points)
- `customer_retained` (15 points)
- `upsell_closed` (20 points)
- `ai_support_activity` (tracked separately for AI vs Human comparison)

---

### 4.2 Sales CRM Service Integration

#### Purpose
Enable Sales team to access and respond to first-touch customer communications.

#### API Endpoints (CS-Support Service)
```typescript
// Get inbox with filtering
GET /api/v1/inbox
  Query params:
    - stage: 'pre-sale' | 'post-sale' | 'all'
    - assigned_to: 'sales' | 'support' | 'all'
    - source: 'lead' | 'customer' | 'all'
    - status: 'open' | 'closed' | 'all'

// Reply to conversation
POST /api/v1/inbox/{id}/reply
  Body: { message, is_internal, assign_to }

// Convert pre-sale to post-sale
POST /api/v1/inbox/{id}/convert
  Body: { tenant_id, converted_at }
```

#### Sales CRM Service Client
```typescript
// lib/integrations/cs-support/client.ts
export class CSSupportClient {
  constructor(private apiKey: string, private baseUrl: string) {}
  
  async getSalesInbox(filters?: {
    stage?: 'pre-sale'
    assigned_to?: 'sales'
    status?: 'open' | 'closed'
  }) {
    return this.get('/api/v1/inbox', { params: filters })
  }
  
  async replyToConversation(conversationId: string, message: string) {
    return this.post(`/api/v1/inbox/${conversationId}/reply`, { message })
  }
  
  async convertToCustomer(conversationId: string, tenantId: string) {
    return this.post(`/api/v1/inbox/${conversationId}/convert`, { tenant_id: tenantId })
  }
}
```

---

### 4.3 Platform Service Integration

#### Purpose
Get tenant and subscription information for customer context.

#### API Endpoints (Platform Service)
```typescript
// Get tenant information
GET /api/v1/tenants/{id}
  Returns: { tenantId, name, plan, services, ... }

// Get subscription status
GET /api/v1/tenants/{id}/subscription
  Returns: { services: { intake: boolean, ... }, plan, expiresAt }
```

#### CS-Support Service Client
```typescript
// lib/integrations/platform-service/client.ts
export class PlatformServiceClient {
  async getTenant(tenantId: string) {
    return this.get(`/api/v1/tenants/${tenantId}`)
  }
  
  async getSubscription(tenantId: string) {
    return this.get(`/api/v1/tenants/${tenantId}/subscription`)
  }
  
  async getTenantUsage(tenantId: string, startDate?: string, endDate?: string) {
    return this.get(`/api/v1/tenants/${tenantId}/usage`, { params: { startDate, endDate } })
  }
}
```

#### Billing Proxy Service ✅ (Implemented)

**Purpose:** Secure proxy for billing operations, preventing AI agent direct access to billing endpoints.

**File:** `app/api/v1/billing/operations/route.ts`

**Features:**
- Authorization (CSM, Head of CS, Support Manager only)
- Rate limiting (5 req/min for operations, 30 req/min for info)
- Secure proxy pattern
- Prevents AI agent direct access

**API Endpoints:**
- `POST /api/v1/billing/operations` - Billing operations (refunds, credits, etc.)
- `GET /api/v1/billing/info` - Billing information (read-only)

**Integration:**
- Calls Platform Service billing endpoints
- Adds security layer and authorization
- Rate limiting and audit logging

---

### 4.3.1 Sales CRM Service - Phone Number Integration ✅ (Implemented)

#### Purpose
Leverage Sales CRM phone number assignment system for CSM phone number management and customer communications.

#### Integration Points

**From CS-Support Service to Sales CRM Service:**
- **Phone Number Retrieval:** Get individual phone numbers for CSMs
- **Pool Number Access:** Get pool numbers for support team calls
- **Phone Number Updates:** Update CSM individual phone numbers

**API Endpoints (Sales CRM Service):**
```typescript
// Get phone number for user
GET /api/v1/users/{user_id}/phone-number
  Headers: {
    'X-Call-Type': 'direct_call' | 'parallel_dialing',
    'X-Service': 'cs_support',
    'X-Campaign-ID': 'campaign_id' (optional)
  }
  Returns: {
    phone_number: string,
    number_type: 'individual' | 'pool'
  }

// Update user's phone number
POST /api/v1/users/{user_id}/phone-number
  Body: {
    phone_number: string,
    twilio_number_sid?: string,
    virtual_number_provider: 'twilio' | 'other'
  }
```

#### CS-Support Service Client
```typescript
// lib/integrations/sales-client.ts
export class SalesServiceClient {
  async getPhoneNumber(options: {
    user_id: string
    call_type: 'direct_call' | 'parallel_dialing'
    service?: 'sales' | 'cs_support'
    campaign_id?: string
  }): Promise<{ phone_number: string; number_type: 'individual' | 'pool' }>
  
  async updatePhoneNumber(
    userId: string,
    phoneNumber: string,
    twilioNumberSid?: string,
    virtualNumberProvider: 'twilio' | 'other' = 'twilio'
  )
}
```

**Use Cases:**
- CSM direct customer calls (individual numbers)
- Support team pool calls (shared numbers)
- Onboarding call numbers
- Integration with unified dialer service

---

### 4.4 Tenant Application Integration

#### Purpose
Get tenant usage data, service status, and customer context for support tickets.

#### API Endpoints (Tenant Application)
```typescript
// Get tenant usage data
GET /api/v1/tenants/{id}/usage
  Returns: { intake_calls, draft_validations, settle_queries, ... }

// Get service status
GET /api/v1/tenants/{id}/services/status
  Returns: { intake: 'active', draft: 'active', ... }

// Get tenant configuration
GET /api/v1/tenants/{id}/config
  Returns: { firm_name, contact_info, settings, ... }
```

#### CS-Support Service Client
```typescript
// lib/integrations/tenant-app/client.ts
export class TenantAppClient {
  async getTenantUsage(tenantId: string) {
    return this.get(`/api/v1/tenants/${tenantId}/usage`)
  }
  
  async getServiceStatus(tenantId: string) {
    return this.get(`/api/v1/tenants/${tenantId}/services/status`)
  }
  
  async getTenantConfig(tenantId: string) {
    return this.get(`/api/v1/tenants/${tenantId}/config`)
  }
}
```

**Use Cases:**
- Display tenant usage in customer profile
- Identify service issues (e.g., INTAKE service down)
- Provide context for support tickets
- Track customer engagement metrics

---

### 4.4.1 Customer Portal Integration (Critical: LLM Isolation)

**🚨 CRITICAL SECURITY REQUIREMENT - NO EXCEPTIONS**

#### Purpose
Customer Portal (Tenant App Service) integrates with CS-Support Service for AI agent interactions (Benjamin), support ticket submission, and knowledge base access. **Customer Portal MUST NOT have direct LLM access.**

#### Security Requirements

**LLM Access Restriction:**
- ❌ **Customer Portal:** **NO LLM ACCESS** - Must call CS-Support Service APIs
- ✅ **CS-Support Service:** Has direct LLM access (Claude, Kimi) - **ONLY AUTHORIZED SERVICE**

**Implementation Pattern:**
```
Customer Portal (Tenant App Service)
    ↓ (API Call with Service-to-Service Auth)
    ↓ (NO LLM SDKs, NO LLM API Keys)
CS-Support Service
    ↓ (Direct LLM API Call)
Claude/Kimi LLM
```

#### CS-Support Service API Endpoints (For Customer Portal)

**AI Agent Chat (Benjamin):**
```typescript
// Chat with Benjamin (AI agent)
POST /api/v1/ai/chat
  Headers: {
    'X-Service-Auth': 'customer-portal-api-key',
    'X-Tenant-ID': 'tenant_123'
  }
  Body: {
    customer_id: 'customer_456',
    message: 'I need help with my account',
    channel: 'web_chat' | 'email' | 'sms'
  }
  Returns: {
    response: 'Hi! I'm Benjamin, your digital agent. How can I help you today?',
    conversation_id: 'conv_789',
    agent_name: 'Benjamin'
  }

// Get conversation history
GET /api/v1/ai/chat/{conversation_id}
  Headers: {
    'X-Service-Auth': 'customer-portal-api-key',
    'X-Tenant-ID': 'tenant_123'
  }
  Returns: {
    conversation: [
      { role: 'customer', message: '...', timestamp: '...' },
      { role: 'benjamin', message: '...', timestamp: '...' }
    ]
  }
```

**Voice AI Agent (Benjamin):**
```typescript
// Voice chat with Benjamin
POST /api/v1/ai/voice/start
  Headers: {
    'X-Service-Auth': 'customer-portal-api-key',
    'X-Tenant-ID': 'tenant_123'
  }
  Body: {
    customer_id: 'customer_456',
    audio_url: 'https://...' // Audio file URL
  }
  Returns: {
    transcription: 'I need help with my account',
    response: 'Hi! I'm Benjamin, your digital agent. How can I help you today?',
    audio_response_url: 'https://...', // Cartesia-generated audio
    conversation_id: 'conv_789'
  }
```

**Support Ticket Submission:**
```typescript
// Submit support ticket
POST /api/v1/tickets
  Headers: {
    'X-Service-Auth': 'customer-portal-api-key',
    'X-Tenant-ID': 'tenant_123'
  }
  Body: {
    customer_id: 'customer_456',
    subject: 'Account issue',
    message: 'I need help with...',
    priority: 'normal' | 'high' | 'urgent',
    category: 'technical' | 'billing' | 'general'
  }
  Returns: {
    ticket_id: 'ticket_123',
    status: 'open',
    assigned_to: 'Benjamin (AI Agent)'
  }
```

**Knowledge Base Access:**
```typescript
// Search knowledge base
GET /api/v1/kb/articles/search
  Headers: {
    'X-Service-Auth': 'customer-portal-api-key',
    'X-Tenant-ID': 'tenant_123'
  }
  Query params: {
    q: 'account setup',
    category?: 'technical' | 'billing' | 'general'
  }
  Returns: {
    articles: [
      { id: 'kb_1', title: '...', excerpt: '...', url: '...' }
    ]
  }
```

#### Customer Portal Client Implementation

**✅ CORRECT Implementation (No LLM Access):**
```typescript
// Customer Portal (Tenant App Service)
// lib/integrations/cs-support/client.ts

export class CSSupportClient {
  private apiUrl: string
  private apiKey: string

  constructor() {
    // ✅ CORRECT: API endpoint and service auth key (NOT LLM API keys)
    this.apiUrl = process.env.CS_SUPPORT_API_URL // e.g., 'https://cs-support.truevow.com'
    this.apiKey = process.env.CS_SUPPORT_SERVICE_AUTH_KEY // Service-to-service auth key
  }

  async chatWithBenjamin(customerId: string, message: string) {
    // ✅ CORRECT: Call CS-Support Service API (no direct LLM access)
    return this.post('/api/v1/ai/chat', {
      customer_id: customerId,
      message,
      channel: 'web_chat'
    }, {
      headers: {
        'X-Service-Auth': this.apiKey,
        'X-Tenant-ID': process.env.TENANT_ID
      }
    })
  }

  async submitTicket(customerId: string, subject: string, message: string) {
    // ✅ CORRECT: Call CS-Support Service API
    return this.post('/api/v1/tickets', {
      customer_id: customerId,
      subject,
      message
    }, {
      headers: {
        'X-Service-Auth': this.apiKey,
        'X-Tenant-ID': process.env.TENANT_ID
      }
    })
  }
}
```

**❌ WRONG Implementation (Direct LLM Access - BLOCKED):**
```typescript
// Customer Portal (Tenant App Service)
// ❌ WRONG: Direct LLM access (NOT ALLOWED)

import Anthropic from '@anthropic-ai/sdk' // ❌ NOT ALLOWED
import { KimiClient } from '@/lib/integrations/kimi' // ❌ NOT ALLOWED

const anthropic = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY // ❌ NOT ALLOWED - No LLM API keys in Customer Portal
})

const kimi = new KimiClient({ 
  apiKey: process.env.KIMI_API_KEY // ❌ NOT ALLOWED - No LLM API keys in Customer Portal
})
```

#### Service-to-Service Authentication

**CS-Support Service API Key Configuration:**
```typescript
// CS-Support Service validates Customer Portal requests
// middleware/auth.ts

export async function validateServiceAuth(req: Request) {
  const apiKey = req.headers.get('X-Service-Auth')
  const tenantId = req.headers.get('X-Tenant-ID')
  
  // Validate service auth key
  if (apiKey !== process.env.CUSTOMER_PORTAL_SERVICE_AUTH_KEY) {
    throw new Error('Invalid service authentication')
  }
  
  // Validate tenant ID
  if (!tenantId) {
    throw new Error('Tenant ID required')
  }
  
  return { apiKey, tenantId }
}
```

#### Environment Variables

**Customer Portal `.env` (NO LLM Keys):**
```bash
# ✅ CORRECT: Service-to-service auth (NOT LLM API keys)
CS_SUPPORT_API_URL=https://cs-support.truevow.com
CS_SUPPORT_SERVICE_AUTH_KEY=service_auth_key_123

# ❌ WRONG: LLM API keys (NOT ALLOWED)
# ANTHROPIC_API_KEY=sk-... # ❌ DO NOT ADD
# KIMI_API_KEY=... # ❌ DO NOT ADD
```

**CS-Support Service `.env` (Has LLM Keys):**
```bash
# ✅ CORRECT: LLM API keys only in CS-Support Service
ANTHROPIC_API_KEY=sk-...
KIMI_API_KEY=...

# ✅ CORRECT: Service auth key for Customer Portal
CUSTOMER_PORTAL_SERVICE_AUTH_KEY=service_auth_key_123
```

#### Security Enforcement

**Pre-commit Hooks (Customer Portal):**
```bash
# .husky/pre-commit
#!/bin/sh
# Block LLM SDK imports in Customer Portal

if grep -r "@anthropic-ai/sdk\|@kimi-ai/sdk" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .; then
  echo "❌ ERROR: LLM SDK imports detected in Customer Portal"
  echo "Customer Portal must NOT have direct LLM access"
  echo "Use CS-Support Service APIs instead"
  exit 1
fi
```

**CI/CD Pipeline Checks:**
```yaml
# .github/workflows/security-check.yml
- name: Check for LLM SDK imports
  run: |
    if grep -r "@anthropic-ai/sdk\|@kimi-ai/sdk" --include="*.ts" --include="*.tsx" .; then
      echo "❌ ERROR: LLM SDK imports detected"
      exit 1
    fi
```

**Code Review Checklist:**
- [ ] No LLM SDK imports (`@anthropic-ai/sdk`, `@kimi-ai/sdk`)
- [ ] No LLM API keys in environment variables
- [ ] All AI interactions use CS-Support Service APIs
- [ ] Service-to-service authentication implemented
- [ ] Tenant ID validation in place

#### Compliance Benefits

- **Attack Surface Reduction:** Customer Portal has no LLM connectivity, reducing breach vectors
- **Data Isolation:** LLM API keys and credentials only exist in CS-Support Service
- **Audit Trail:** All LLM interactions centralized in CS-Support Service for security auditing
- **Compliance Maintenance:** Customer Portal (Tenant App) maintains compliance by isolating LLM connectivity
- **Access Control:** LLM access controlled through service-level authentication

---

### 4.5 Third-Party Integrations

#### Email (SendGrid)
- **Webhook:** `POST /api/v1/email/webhook` - Receive incoming emails
- **Send Email:** `POST /api/v1/email/send` - Send outgoing emails
- **Configuration:** SendGrid API key in environment variables

#### SMS (Twilio)
- **Webhook:** `POST /api/v1/webhooks/sms` - Receive SMS messages
- **Send SMS:** `POST /api/v1/sms/send` - Send SMS messages
- **Configuration:** Twilio credentials in environment variables

#### WhatsApp (Twilio)
- **Webhook:** `POST /api/v1/webhooks/whatsapp` - Receive WhatsApp messages
- **Send WhatsApp:** `POST /api/v1/whatsapp/send` - Send WhatsApp messages
- **Configuration:** Twilio WhatsApp Business API credentials in environment variables
- **Alternative to SMS:** WhatsApp can be used as an alternative to SMS for customer communications, providing richer messaging capabilities

#### Calls (Twilio)
- **Webhook:** `POST /api/v1/calls/webhook` - Receive call events
- **Configuration:** Twilio credentials in environment variables

#### Voice Orchestration Architecture (Unified Service, Isolated Instances)

**Reference:** Sales CRM Service has implemented a unified voice orchestration architecture that CS-Support Service will adopt.

**Architecture Pattern:**
- **Unified Voice Service:** All services (Intake, Sales CRM, CS-Support) use the same voice orchestration service architecture
- **Isolated Instances:** Each service uses a **separate STT (Speech-to-Text) service instance** to maintain isolation
- **Service Isolation:** Intake service remains deterministic and AI/LLM-free, while Sales CRM and CS-Support use AI/LLM for call intelligence

**CS-Support Service Implementation:**
- **STT Service URL:** `CS_SUPPORT_STT_SERVICE_URL` (separate instance from Intake and Sales CRM)
- **Call Transcription Pipeline:** Integrates STT service with call intelligence
- **Features:**
  - Real-time call transcription
  - Post-call transcription
  - Automatic speaker diarization
  - Call intelligence (sentiment, objection detection)
  - CRM auto-update from call insights

**Architecture Diagram:**
```
┌─────────────────────────────────────┐
│      Intake Service (Core)          │
│  Deterministic - AI/LLM-Free         │
│                                      │
│  STT: localhost:8000                 │
│  Database: intake_db                 │
└─────────────────────────────────────┘
              ↓ (ISOLATED)
┌─────────────────────────────────────┐
│      Sales CRM Service               │
│  Uses AI/LLM for call intelligence   │
│                                      │
│  STT: localhost:8001 (SEPARATE)      │
│  Database: sales_crm_db              │
└─────────────────────────────────────┘
              ↓ (ISOLATED)
┌─────────────────────────────────────┐
│      CS-Support Service              │
│  Uses AI/LLM for call intelligence   │
│                                      │
│  STT: localhost:8002 (SEPARATE)      │
│  Database: cs_support_db             │
│                                      │
│  Features:                           │
│  - Support call transcription        │
│  - Customer sentiment analysis       │
│  - Issue detection & escalation      │
│  - Support quality scoring           │
└─────────────────────────────────────┘
```

**Configuration:**
```bash
# CS-Support STT Service (SEPARATE from Intake and Sales CRM)
CS_SUPPORT_STT_SERVICE_URL=http://localhost:8002
```

**Key Principles:**
1. **Service Isolation:** Each service has its own STT service instance (different URL/port)
2. **Unified Architecture:** All services follow the same voice orchestration pattern
3. **Intake Protection:** Intake service remains isolated and deterministic
4. **AI Intelligence:** Sales CRM and CS-Support can use AI/LLM for call intelligence without affecting Intake

**API Endpoints:**
- `POST /api/v1/calls/[call_id]/transcribe` - Transcribe call audio
- `GET /api/v1/calls/[call_id]/transcribe` - Get call transcript
- `POST /api/v1/calls/[call_id]/intelligence` - Analyze call for insights

**Note:** This architecture pattern was successfully implemented in Sales CRM Service (January 2026) and will be adopted by CS-Support Service following the same isolation principles.

#### AI (Anthropic Claude, Kimi)
- **API:** Direct API calls to Claude/Kimi
- **Configuration:** API keys in environment variables
- **Usage:** Response suggestions, auto-analysis, sentiment analysis

---

### 4.6 Service-to-Service Authentication

All service-to-service calls use API Key authentication:

**Headers:**
```http
X-API-Key: <service-b-api-key>
X-Service-Name: cs-support-service
X-Request-ID: <uuid>
X-Request-Timestamp: <iso-8601>
```

**Common Integration Patterns:**
1. **Create Task:** CS-Support → Internal Ops (create follow-up task)
2. **Log Time:** CS-Support → Internal Ops (log support activity time)
3. **Send Notification:** CS-Support → Internal Ops (notify on SLA breach)
4. **Get Tenant Context:** CS-Support → Platform Service (get tenant info)
5. **Report RevOps Activity:** CS-Support → Internal Ops (report support activities)
6. **Get Sales Inbox:** Sales CRM → CS-Support (get pre-sale conversations)

---

### 4.7 Environment Variables

```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Email (SendGrid)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=support@truevow.com

# SMS & Calls (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# AI
ANTHROPIC_API_KEY=sk-ant-...
KIMI_API_KEY=...

# Platform Service
PLATFORM_SERVICE_URL=http://localhost:3000
PLATFORM_SERVICE_API_KEY=...

# Sales CRM Service (for callbacks)
SALES_CRM_SERVICE_URL=http://localhost:3002
SALES_CRM_SERVICE_API_KEY=...

# Internal Ops Service (for tasks, time tracking, RevOps)
INTERNAL_OPS_SERVICE_URL=http://localhost:3001
INTERNAL_OPS_SERVICE_API_KEY=...

# Tenant Application (for tenant context)
TENANT_APP_URL=http://localhost:8000
TENANT_APP_API_KEY=...
```

---

## Decision-Making Authority

### Support & Customer Success Decisions

**Refund Authority by Amount:**
- **< $100:** CSM authority (no escalation required)
- **$100-$500:** Head of CS authority (CFO notification)
- **$500-$2,000:** Head of CS + CFO approval (CEO notification if available)
- **> $2,000:** Head of CS + CFO approval (CEO preferred if available)

**Subscription Changes:**
- **Free/Standard/INTAKE User:** CSM authority
- **Premium/Founding Member:** Head of CS authority
- **Custom Enterprise:** Head of CS + CFO approval

**Dispute Handling:**
- **All Disputes:** CSM authority (Head of CS review for complex cases)
- **No-Show Marking:** CSM authority (prevents billing)

**Escalation Authority:**
- **Support Agent:** Escalates to CSM for billing decisions, escalates when issue unresolved after 24-48 hours
- **CSM:** Escalates to Head of CS for complex cases
- **Head of CS:** Escalates to CFO for financial decisions, escalates to CEO for strategic decisions

---

## Communication Cadence

### Daily Standups (15 minutes)

**Support Team:**
- Support Manager → Customer Solutions Engineers
- Focus: Ticket volume, escalations, priorities, SLA status
- **No CEO required** - Autonomous operation

### Weekly Reviews (1 hour)

**Customer Success Review:**
- Head of CS → CSMs + Support Manager
- Focus: Customer health, churn, support metrics, account expansion
- **No CEO required** - Autonomous operation

### Bi-Weekly Cross-Functional Sync (2 hours)

**Attendees:**
- Head of Revenue
- Head of Customer Success
- Head of Platform
- CFO

**Agenda:**
1. Metrics review (all departments)
2. Cross-functional issues
3. Strategic priorities
4. Resource allocation
5. Escalations

**Decision Authority:**
- All Heads can make decisions within their authority
- Cross-functional decisions require consensus
- If CEO unavailable, Heads make decision or defer

### Monthly Strategic Review (3 hours)

**Attendees:**
- All Heads
- Key Managers
- CEO (if available, otherwise autonomous)

**Agenda:**
1. Strategic metrics review
2. Quarterly goals progress
3. Strategic initiatives
4. Budget review
5. Resource planning

---

## User Stories & Use Cases

### 5.1 Support Agent Use Cases

**US-001: View Inbox**
- **As a** support agent
- **I want to** view all customer conversations in one inbox
- **So that** I can see all incoming messages
- **Acceptance Criteria:**
  - Inbox displays all conversations
  - Filters work (status, channel, assignee)
  - Real-time updates show new messages
  - Unread count is accurate

**US-002: Respond to Customer**
- **As a** support agent
- **I want to** respond to customer messages with AI suggestions
- **So that** I can respond quickly and accurately
- **Acceptance Criteria:**
  - Reply form is accessible
  - AI suggestions appear
  - Rich text editor works
  - Message is sent successfully
  - Customer receives response

**US-003: Resolve Ticket**
- **As a** support agent
- **I want to** mark tickets as resolved
- **So that** I can track completed work
- **Acceptance Criteria:**
  - Resolve button is accessible
  - Resolution notes can be added
  - Ticket status updates to resolved
  - Customer is notified
  - Ticket moves to resolved view
  - Activity is logged for RevOps tracking (1 point)

**US-003A: Escalate to CSM**
- **As a** support agent
- **I want to** escalate tickets to CSM when needed
- **So that** billing decisions and complex issues are handled appropriately
- **Acceptance Criteria:**
  - Escalation button is accessible
  - Escalation triggers 24-48 hour countdown
  - CSM is notified automatically
  - Escalation reason is documented
  - CSM can join conversation

---

### 5.2 Sales Team Use Cases

**US-004: View Pre-Sale Conversations**
- **As a** sales representative
- **I want to** view pre-sale conversations via Sales CRM
- **So that** I can respond to first-touch inquiries
- **Acceptance Criteria:**
  - Sales CRM shows pre-sale conversations
  - Filtering works (stage='pre-sale')
  - Conversations load via API
  - Real-time updates work

**US-005: Respond to Lead**
- **As a** sales representative
- **I want to** respond to lead inquiries
- **So that** I can convert leads to customers
- **Acceptance Criteria:**
  - Reply form is accessible
  - Message is sent successfully
  - Response is tracked
  - Lead receives response

**US-006: Convert Lead to Customer**
- **As a** sales representative
- **I want to** convert a lead to a customer
- **So that** the conversation moves to support
- **Acceptance Criteria:**
  - Convert button is accessible
  - Conversion updates stage to 'post-sale'
  - Conversation moves to support view
  - Full history is preserved

---

### 5.3 Customer Success Use Cases

**US-007: Monitor Customer Health**
- **As a** customer success manager
- **I want to** monitor customer health scores
- **So that** I can identify at-risk customers
- **Acceptance Criteria:**
  - Health scores are visible
  - At-risk alerts trigger
  - Health trends are tracked
  - Customer details are accessible

**US-008: Proactive Outreach**
- **As a** customer success manager
- **I want to** proactively reach out to at-risk customers
- **So that** I can prevent churn
- **Acceptance Criteria:**
  - At-risk customers are identified
  - Outreach playbooks execute
  - Outreach is tracked
  - Success metrics improve

**US-009: Account Management**
- **As a** customer success manager
- **I want to** manage my assigned accounts
- **So that** I can ensure customer success and retention
- **Acceptance Criteria:**
  - Account list shows all assigned accounts
  - Account health scores are displayed
  - Monthly health checks are scheduled
  - Account transition (Standard/INTAKE User after 3 months) works correctly
  - CSM can monitor support pool conversations

**US-010: Handle Disputes**
- **As a** customer success manager
- **I want to** handle customer disputes
- **So that** I can resolve issues and prevent billing errors
- **Acceptance Criteria:**
  - Dispute handling form is accessible
  - No-show marking prevents billing
  - Dispute resolution is tracked
  - Customer is notified of resolution

---

## Success Metrics

### 6.1 Customer Satisfaction
- **CSAT Score:** Average customer satisfaction score
  - Target: >4.5/5.0 (90%+ satisfaction)
  - Alert Threshold: CSAT drop < 4.0 → Alert Head of CS
- **NPS Score:** Net Promoter Score
  - Target: >50
- **Churn Rate:** Monthly churn rate
  - Target: <5% monthly
  - Alert Threshold: Churn rate > 7% → Alert Head of CS + CFO
- **Response Time:** Average first response time
  - Target: <2 hours (90th percentile)
- **Resolution Time:** Average resolution time
  - Target: <24 hours (90th percentile)
- **Support Ticket Volume:** Total tickets per month
  - Alert Threshold: Support ticket volume increase > 50% → Alert Support Manager

### 6.2 Efficiency Metrics
- **Ticket Volume:** Total tickets per month
  - Target: Track and reduce through self-service
- **Self-Service Rate:** % of inquiries resolved via KB
  - Target: 40%+
- **AI Adoption:** % of responses using AI suggestions
  - Target: 60%+
- **SLA Compliance:** % of tickets within SLA
  - Target: >95%

### 6.3 Business Metrics
- **Cost Savings:** Monthly savings vs. third-party solutions
  - Target: $1,000+/month
- **Team Productivity:** Tickets per agent per day
  - Target: Increase by 20%+
- **Customer Retention:** Customer retention rate
  - Target: >90%

### 6.4 Technical Metrics
- **API Response Time:** Average API response time
  - Target: <500ms
- **Page Load Time:** Average page load time
  - Target: <2 seconds
- **Uptime:** Service availability
  - Target: 99.9%+
- **Error Rate:** % of requests resulting in errors
  - Target: <1%

---

## Roadmap & Phases

### Phase 1: Repository Setup & Migration (Weeks 1-5)
**Timeline:** January 2026 - February 2026  
**Status:** 📅 Planned

**Deliverables:**
- ✅ Create CS-Support Service repository
- ✅ Set up Next.js 14 project structure
- ✅ Migrate Shared Inbox UI pages
- ✅ Migrate API endpoints
- ✅ Migrate database schema
- ✅ Add pre-sale/post-sale support
- ✅ Update integrations
- ✅ Test migration

---

### Phase 2: Sales CRM Integration (Week 6)
**Timeline:** February 2026  
**Status:** 📅 Planned

**Deliverables:**
- ✅ Sales CRM API client
- ✅ Pre-sale conversation filtering
- ✅ Sales reply functionality
- ✅ Lead conversion flow
- ✅ Integration testing

---

### Phase 3: Customer Success Features (Weeks 7-8)
**Timeline:** February 2026 - March 2026  
**Status:** 📅 Planned

**Deliverables:**
- ✅ Customer health scoring
- ✅ Proactive alerts
- ✅ Success playbooks
- ✅ Engagement tracking
- ✅ Expansion opportunity identification

---

### Phase 4: Enhanced Analytics (Weeks 9-10)
**Timeline:** March 2026  
**Status:** 📅 Planned

**Deliverables:**
- ✅ Advanced analytics dashboard
- ✅ Custom reports
- ✅ Predictive analytics
- ✅ Trend analysis
- ✅ Export functionality

---

### Phase 5: Mobile App (Weeks 11-12)
**Timeline:** March 2026 - April 2026  
**Status:** 📅 Planned

**Deliverables:**
- ✅ Mobile app (React Native)
- ✅ Push notifications
- ✅ Mobile-optimized UI
- ✅ Offline support (future)

---

## Non-Functional Requirements

### 7.1 Performance
- **Page Load Time:** <2 seconds for initial load
- **Time to Interactive:** <3 seconds
- **API Response Time:** <500ms for 95th percentile
- **Real-time Updates:** <1 second latency
- **Search Performance:** <200ms for search queries

### 7.2 Scalability
- **Concurrent Users:** Support 100+ concurrent support agents
- **Ticket Volume:** Handle 10,000+ tickets per month
- **Message Volume:** Handle 50,000+ messages per month
- **API Rate Limiting:** 100 requests/minute per user
- **Database:** Handle 1M+ tickets, 10M+ messages

### 7.3 Security
- **HTTPS Only:** All traffic over HTTPS
- **Authentication:** Clerk-based authentication with 2FA
- **Authorization:** Role-based access control (RBAC)
- **Data Encryption:** Encrypt sensitive data at rest
- **Input Validation:** Client and server-side validation
- **XSS Protection:** Content Security Policy (CSP) headers
- **CSRF Protection:** CSRF tokens for state-changing operations

### 7.4 Reliability
- **Uptime:** 99.9%+ availability
- **Error Handling:** Graceful error handling
- **Retry Logic:** Automatic retry for failed operations
- **Backup:** Daily database backups
- **Disaster Recovery:** Recovery time <4 hours

### 7.5 Accessibility
- **WCAG 2.1 AA:** Meet WCAG 2.1 Level AA standards
- **Keyboard Navigation:** Full keyboard navigation support
- **Screen Readers:** Compatible with screen readers
- **Color Contrast:** Minimum 4.5:1 contrast ratio
- **Focus Indicators:** Clear focus indicators

---

## Risk Assessment

### 8.1 Technical Risks

**Risk 1: Migration Complexity**
- **Description:** Complex migration from SaaS Admin to CS-Support Service
- **Impact:** High - Could break existing functionality
- **Mitigation:**
  - Thorough testing before migration
  - Phased migration approach
  - Rollback plan
  - Monitor closely after migration

**Risk 2: Integration Dependencies**
- **Description:** Sales CRM Service depends on CS-Support API
- **Impact:** Medium - Sales team blocked if API is down
- **Mitigation:**
  - Robust API design
  - API versioning
  - Fallback mechanisms
  - API monitoring

**Risk 3: Data Migration Issues**
- **Description:** Data loss or corruption during migration
- **Impact:** Critical - Customer data at risk
- **Mitigation:**
  - Backup before migration
  - Data validation
  - Rollback capability
  - Test migration on staging

---

### 8.2 Business Risks

**Risk 4: User Adoption**
- **Description:** Support team doesn't adopt new service
- **Impact:** Medium - Business objective not met
- **Mitigation:**
  - User training
  - Gradual rollout
  - User feedback
  - Continuous improvement

**Risk 5: Performance Issues**
- **Description:** Service performance degrades under load
- **Impact:** High - Poor user experience
- **Mitigation:**
  - Load testing
  - Performance monitoring
  - Scalability planning
  - Caching strategies

---

### 8.3 Security Risks

**Risk 6: Data Breach**
- **Description:** Unauthorized access to customer data
- **Impact:** Critical - Legal and financial consequences
- **Mitigation:**
  - Strict access controls
  - Regular security audits
  - Penetration testing
  - Incident response plan

**Risk 7: API Security**
- **Description:** API vulnerabilities expose customer data
- **Impact:** High - Unauthorized API access
- **Mitigation:**
  - API authentication
  - Rate limiting
  - Input validation
  - Security testing

---

## RevOps Integration

### Overview

The CS-Support Service integrates with the Internal Ops Service's RevOps module to track and attribute revenue-generating activities from the Customer Success Organization.

### What Gets Tracked

**Support Activities:**
- Support ticket resolved: 1 point
- Customer onboarded: 10 points
- Customer retained: 15 points
- Upsell closed: 20 points

**AI Support Activities:**
- AI Support ticket resolved: 1 point (tracked separately for AI vs Human comparison)
- AI Support customer onboarded: 10 points
- AI Support customer retained: 15 points

**Role-Based Tracking:**
- All activities tracked by role (Support Agent, CSM, Support Manager, Head of CS)
- Activities mapped to Customer Success Organization roles
- Time allocation tracked by role (e.g., Support Agent: 60% ticket resolution, 20% customer onboarding, 20% training)

### Revenue Attribution

**Direct Revenue (100% credit):**
- CSM closes upsell
- Support Agent resolves critical issue leading to retention

**Indirect Revenue (Partial credit):**
- Support Agent helps customer (10% credit)
- AI CS Assistant onboards customer (10% credit)
- AI Support Agent resolves ticket (10% credit)

### Integration Flow

```
CS-Support Service
  ↓ (Support ticket resolved)
POST /api/v1/revops/activities
  Body: {
    activity_type: 'support_ticket_resolved',
    user_id: 'user_456',
    role: 'support_agent',
    points: 1,
    metadata: { ticket_id: 'ticket_123' }
  }
  ↓
Internal Ops Service (RevOps Module)
  ↓ (Tracks activity, calculates score, attributes revenue)
  ↓
Reports & Dashboards
  - Individual performance reports (by role)
  - Team performance reports (Customer Success Organization)
  - Revenue attribution reports
  - AI vs Human performance comparison
```

### Reports & Dashboards

**Individual Performance:**
- Support Agent performance (tickets resolved, CSAT scores, SLA compliance)
- CSM performance (customers onboarded, retained, upsells closed)
- Role-based performance metrics

**Team Performance:**
- Customer Success Organization performance
- Support team performance
- CSM team performance

**Revenue Attribution:**
- Revenue attributed to Support activities
- Revenue attributed to CSM activities
- AI vs Human performance comparison
- Activity-to-revenue correlation

---

## Appendices

### Appendix A: Glossary

- **Shared Inbox:** Unified inbox for all customer communications
- **Support Ticket:** A customer inquiry or issue
- **Pre-Sale:** Customer communication before purchase (lead)
- **Post-Sale:** Customer communication after purchase (customer)
- **SLA:** Service Level Agreement (response/resolution time targets)
- **CSAT:** Customer Satisfaction Score
- **NPS:** Net Promoter Score
- **KB:** Knowledge Base
- **CS-Support Service:** Customer Success & Customer Support Service
- **Customer Success Organization:** One of 4 TrueVow organizations (Revenue, CS, Platform, Finance)
- **RevOps:** Revenue Operations - tracking, scoring, and attributing revenue-generating activities
- **CSM:** Customer Success Manager
- **IC Track:** Individual Contributor career path (Junior IC → IC → Senior IC → Principal IC → Distinguished IC)
- **Manager Track:** Management career path (Manager → Senior Manager → Director → VP → C-level)
- **PKT:** Pakistan Time (timezone for TrueVow team members)

---

### Appendix B: API Response Examples

#### Inbox List Response
```json
{
  "conversations": [
    {
      "id": "conv_123",
      "subject": "Question about billing",
      "customer": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "channel": "email",
      "status": "open",
      "stage": "post-sale",
      "assigned_to": "agent_456",
      "priority": "medium",
      "last_message_at": "2026-01-06T10:00:00Z",
      "unread_count": 2
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 50
}
```

#### Conversation Detail Response
```json
{
  "id": "conv_123",
  "subject": "Question about billing",
  "customer": {
        "name": "John Doe",
        "email": "john@example.com",
        "tenant_id": "tenant_789"
      },
  "channel": "email",
  "status": "open",
  "stage": "post-sale",
  "assigned_to": "agent_456",
  "priority": "medium",
  "messages": [
    {
      "id": "msg_1",
      "body": "I have a question about my bill",
      "from": "customer",
      "created_at": "2026-01-06T09:00:00Z",
      "is_internal": false
    }
  ],
  "tags": ["billing", "urgent"],
  "sla": {
    "first_response_target": "2026-01-06T11:00:00Z",
    "resolution_target": "2026-01-07T09:00:00Z",
    "status": "on_track"
  }
}
```

---

### Appendix C: Related Documentation

**SaaS Admin Documentation:**
- **Shared Inbox Summary:** `SHARED_INBOX_MODULE_SUMMARY.md` (SaaS Admin)
- **Migration Recommendation:** `SHARED_INBOX_MIGRATION_RECOMMENDATION.md` (SaaS Admin)
- **Sales Access Analysis:** `SHARED_INBOX_SALES_ACCESS_ANALYSIS.md` (SaaS Admin)
- **5-Service Architecture:** `TRUEVOW_ENTERPRISE_ARCHITECTURE_5_SERVICES.md` (SaaS Admin)

**Tenant Application Documentation:**
- **TrueVow PRD:** `docs/project-rules/TrueVow_PRD.md` (Tenant App)
- **Complete System Documentation:** `docs/project-rules/TRUEVOW_COMPLETE_SYSTEM_DOCUMENTATION.txt` (Tenant App)
- **Technical Documentation:** `TrueVow-Complete System-Technical-Documentation-for-Developers.md` (Tenant App)

**Internal Ops Service Documentation:**
- **Organizational Roles:** `docs/TRUEVOW_ORGANIZATIONAL_ROLES_STRUCTURE_V01.md` (Internal Ops)
- **RevOps Tools Explained:** `docs/REVOPS_TOOLS_EXPLAINED.md` (Internal Ops)
- **RevOps Architecture:** `docs/REVOPS_ARCHITECTURE_PLACEMENT.md` (Internal Ops)

**Organizational Structure Documentation:**
- **Organizational Roles & Structure:** `2026-01-06-TrueVow-Organizational-Roles-Structure-V01.md` (TrueVow Documents)
  - Complete organizational structure (4 organizations, all roles)
  - Career paths (IC Track and Manager Track)
  - Timezone management (PKT/USA)
  - Time allocation by role
  - Decision-making authority
  - Account management strategy
  - AI + Human hybrid model
  - RevOps integration details

---

### Appendix D: Change Log

**Version 1.0 (January 6, 2026)**
- Initial PRD creation
- Comprehensive feature documentation
- Shared Inbox migration plan
- Sales CRM integration requirements
- Technical architecture defined
- User stories and use cases documented
- Roadmap and phases outlined

**Version 1.1 (January 6, 2026) - Enhanced with Organizational Structure Integration**
- Added Organizational Structure Integration section
- Added Customer Success Organization details
- Added RevOps Integration section
- Added Internal Ops Service integration requirements
- Added Tenant Application integration requirements
- Added role-based activity tracking details
- Added timezone management considerations
- Added performance bonus structure
- Enhanced integration requirements with all 5 services
- Added comprehensive glossary and related documentation

**Version 1.2 (January 6, 2026) - Enhanced with Complete Organizational Roles Integration**
- Added complete Customer Success Organization structure (Head of CS, CSMs, Support Manager, Support Agents, Security, Compliance)
- Added detailed job descriptions for all CS roles
- Added time allocation by role (CSM: 30% account management, 20% onboarding, etc.; Support Agent: 50% technical support, 20% billing support, etc.)
- Added task gauging (support ticket: 15-30 min, account review: 1 hour, etc.)
- Added account management strategy (Premium: 1:20-30, Standard/INTAKE User: 1:50-75, Free: support pool only)
- Added escalation mechanism (24-48 hour countdown, CSM intervention)
- Added decision-making authority (refund authority, subscription changes, dispute handling)
- Added communication cadence (daily standups, weekly reviews, bi-weekly syncs, monthly strategic reviews)
- Added AI + Human hybrid model details (AI Support Agent first contact, Human Support Agent complex issues, CSM billing decisions)
- Added career paths (Support IC Track, Support Manager Track, CSM IC Track, CSM Manager Track)
- Added timezone management details (Evening/Night shift for Support Agents, Flexible shift for CSMs)
- Added alert thresholds (CSAT < 4.0, Churn > 7%, Ticket volume increase > 50%)
- Enhanced user personas with role-specific details
- Added comprehensive account assignment and transition process

---

**Document Owner:** TrueVow Product Team  
**Last Updated:** January 6, 2026  
**Next Review:** February 6, 2026  
**Status:** Active Development

---

*This PRD is a living document and will be updated as the service evolves.*

