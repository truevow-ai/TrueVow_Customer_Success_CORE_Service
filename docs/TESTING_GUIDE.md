# CS-Support Service - Comprehensive Testing Guide

**Version:** 1.0  
**Date:** January 11, 2026  
**Status:** Testing Infrastructure Setup

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Testing Strategy](#testing-strategy)
3. [Test Setup](#test-setup)
4. [Unit Testing](#unit-testing)
5. [Integration Testing](#integration-testing)
6. [E2E Testing](#e2e-testing)
7. [API Testing](#api-testing)
8. [Database Testing](#database-testing)
9. [Test Utilities](#test-utilities)
10. [Running Tests](#running-tests)
11. [Test Coverage](#test-coverage)
12. [Best Practices](#best-practices)

---

## Testing Overview

### Testing Philosophy

The CS-Support Service follows a **pragmatic testing approach**:

- **Unit Tests**: Test individual functions and services in isolation
- **Integration Tests**: Test service interactions and API endpoints
- **E2E Tests**: Test complete user workflows
- **Manual Testing**: For complex scenarios and UI validation

### Testing Stack

- **Framework**: Jest (recommended) or Vitest
- **API Testing**: Manual scripts + Postman/Insomnia
- **Database Testing**: Direct SQL queries + Supabase test database
- **E2E Testing**: Manual workflows (Playwright/Cypress optional)

---

## Testing Strategy

### Test Pyramid

```
        /\
       /E2E\          (10%) - Critical user workflows
      /------\
     /Integration\    (30%) - Service interactions
    /------------\
   /   Unit Tests  \  (60%) - Individual functions
  /----------------\
```

### Priority Areas

1. **High Priority** (Must Test):
   - Authentication & Authorization
   - Ticket CRUD operations
   - Payment/Billing operations
   - Data validation & sanitization
   - Security-critical paths

2. **Medium Priority** (Should Test):
   - Service integrations
   - Analytics calculations
   - Report generation
   - Email/SMS sending

3. **Low Priority** (Nice to Have):
   - UI components
   - Helper utilities
   - Non-critical features

---

## Test Setup

### Prerequisites

1. **Environment Setup**:
   ```bash
   # Install dependencies
   npm install

   # Set up test environment
   cp .env.local .env.test.local
   ```

2. **Test Database**:
   - Use a separate Supabase project for testing
   - Or use test tenant isolation in main database
   - Run all migrations on test database

3. **Test Data**:
   - Seed test data: `database/seed.sql`
   - Use test fixtures for consistent data

### Test Configuration

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/api/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

---

## Unit Testing

### Service Tests

Example: `lib/services/__tests__/health-scoring.test.ts`

```typescript
import { HealthScoringService } from '../health-scoring'
import { createServerSupabase } from '@/lib/db/supabase'

jest.mock('@/lib/db/supabase')

describe('HealthScoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateHealthScore', () => {
    it('should calculate health score correctly', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { health_score: 75 },
        }),
      }

      ;(createServerSupabase as jest.Mock).mockResolvedValue(mockSupabase)

      const score = await HealthScoringService.calculateHealthScore('tenant-123')
      
      expect(score).toBeDefined()
      expect(score.health_score).toBeGreaterThanOrEqual(0)
      expect(score.health_score).toBeLessThanOrEqual(100)
    })
  })
})
```

### Repository Tests

Example: `lib/repositories/__tests__/tickets.test.ts`

```typescript
import { TicketRepository } from '../tickets'
import { createServerSupabase } from '@/lib/db/supabase'

jest.mock('@/lib/db/supabase')

describe('TicketRepository', () => {
  describe('create', () => {
    it('should create a ticket successfully', async () => {
      const ticketData = {
        tenant_id: 'tenant-123',
        customer_email: 'test@example.com',
        subject: 'Test Ticket',
        message: 'Test message',
        channel: 'email',
        status: 'open',
        priority: 'medium',
      }

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ticket_id: 'ticket-123', ...ticketData },
        }),
      }

      ;(createServerSupabase as jest.Mock).mockResolvedValue(mockSupabase)

      const ticket = await TicketRepository.create(ticketData)

      expect(ticket).toBeDefined()
      expect(ticket.ticket_id).toBe('ticket-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('cs_tickets')
    })
  })
})
```

---

## Integration Testing

### API Route Tests

Example: `app/api/v1/tickets/__tests__/route.test.ts`

```typescript
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'

jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/repositories/tickets')

describe('POST /api/v1/tickets', () => {
  it('should create a ticket', async () => {
    ;(auth as jest.Mock).mockResolvedValue({ userId: 'user-123' })

    const request = new NextRequest('http://localhost:3003/api/v1/tickets', {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: 'tenant-123',
        customer_email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
        channel: 'email',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data).toBeDefined()
    expect(data.data.ticket_id).toBeDefined()
  })
})
```

### Service Integration Tests

Example: `__tests__/integration/reporting.test.ts`

```typescript
import { ReportGeneratorService } from '@/lib/services/report-generator'
import { createServerSupabase } from '@/lib/db/supabase'

describe('Report Generation Integration', () => {
  it('should generate a complete report', async () => {
    // Setup test template
    const template = await createTestTemplate()
    
    // Generate report
    const report = await ReportGeneratorService.generateReport(
      template.template_id,
      'test-tenant-id',
      '2026-01-01T00:00:00Z',
      '2026-01-11T23:59:59Z'
    )

    expect(report).toBeDefined()
    expect(report.status).toBe('completed')
    expect(report.report_data.sections).toBeDefined()
  })
})
```

---

## E2E Testing

### Manual E2E Test Scenarios

#### Ticket Workflow

1. **Create Ticket**:
   - Navigate to `/dashboard/tickets/new`
   - Fill in ticket form
   - Submit ticket
   - Verify ticket appears in list

2. **Assign Ticket**:
   - Open ticket detail page
   - Click "Assign" button
   - Select team member
   - Verify assignment updates

3. **Resolve Ticket**:
   - Open assigned ticket
   - Add resolution message
   - Change status to "Resolved"
   - Verify CSAT survey is triggered

#### Onboarding Workflow

1. **Start Onboarding**:
   - Navigate to onboarding page
   - Complete Step 1 (Firm Profile)
   - Verify progress updates

2. **Complete All Steps**:
   - Complete Steps 2-5
   - Submit onboarding
   - Verify completion status

---

## API Testing

### Manual API Testing

Use Postman, Insomnia, or curl:

```bash
# Health Check
curl http://localhost:3003/api/v1/health

# Create Ticket
curl -X POST http://localhost:3003/api/v1/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenant_id": "tenant-123",
    "customer_email": "test@example.com",
    "subject": "Test Ticket",
    "message": "Test message",
    "channel": "email"
  }'
```

### Automated API Tests

Create `__tests__/api/tickets.test.ts`:

```typescript
describe('Tickets API', () => {
  const baseUrl = 'http://localhost:3003/api/v1'

  it('should create a ticket', async () => {
    const response = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({
        tenant_id: 'test-tenant',
        customer_email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
        channel: 'email',
      }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.data.ticket_id).toBeDefined()
  })
})
```

---

## Database Testing

### Test Database Setup

1. **Create Test Database**:
   ```sql
   -- Use separate Supabase project or test schema
   CREATE SCHEMA IF NOT EXISTS test;
   ```

2. **Run Migrations**:
   ```bash
   # Run all migrations on test database
   psql $TEST_DATABASE_URL < database/migrations/001_initial_schema.sql
   ```

3. **Seed Test Data**:
   ```bash
   psql $TEST_DATABASE_URL < database/seed.sql
   ```

### Database Test Utilities

Create `__tests__/utils/db-helpers.ts`:

```typescript
import { createServerSupabase } from '@/lib/db/supabase'

export async function createTestTicket(data?: Partial<any>) {
  const supabase = createServerSupabase()
  const { data: ticket } = await supabase
    .from('cs_tickets')
    .insert({
      tenant_id: 'test-tenant',
      customer_email: 'test@example.com',
      subject: 'Test Ticket',
      message: 'Test message',
      channel: 'email',
      status: 'open',
      ...data,
    })
    .select()
    .single()
  
  return ticket
}

export async function cleanupTestData() {
  const supabase = createServerSupabase()
  await supabase.from('cs_tickets').delete().eq('tenant_id', 'test-tenant')
}
```

---

## Test Utilities

### Mock Helpers

Create `__tests__/utils/mocks.ts`:

```typescript
export const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null }),
}

export const mockAuth = {
  userId: 'user-123',
  sessionId: 'session-123',
}
```

### Test Fixtures

Create `__tests__/fixtures/tickets.ts`:

```typescript
export const testTicket = {
  tenant_id: 'test-tenant',
  customer_email: 'test@example.com',
  subject: 'Test Ticket',
  message: 'Test message',
  channel: 'email',
  status: 'open',
  priority: 'medium',
}

export const testTickets = [
  testTicket,
  { ...testTicket, status: 'resolved' },
  { ...testTicket, priority: 'high' },
]
```

---

## Running Tests

### Test Commands

Add to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=__tests__"
  }
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tickets.test.ts
```

---

## Test Coverage

### Coverage Goals

- **Overall**: > 70%
- **Services**: > 80%
- **Repositories**: > 80%
- **API Routes**: > 60%
- **Utilities**: > 90%

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## Best Practices

### 1. Test Naming

- Use descriptive test names
- Follow pattern: `should [expected behavior] when [condition]`
- Example: `should return 404 when ticket does not exist`

### 2. Test Organization

- Group related tests with `describe` blocks
- Use `beforeEach` and `afterEach` for setup/cleanup
- Keep tests independent (no shared state)

### 3. Mocking

- Mock external dependencies (Supabase, API clients)
- Use real implementations for unit tests when possible
- Mock only what's necessary

### 4. Test Data

- Use factories/fixtures for test data
- Clean up test data after tests
- Use unique identifiers to avoid conflicts

### 5. Assertions

- Test one thing per test
- Use specific assertions
- Test both success and error cases

### 6. Performance

- Keep tests fast (< 100ms per test)
- Use parallel execution
- Avoid unnecessary database calls

---

## Testing Checklist

### Pre-Commit

- [ ] All unit tests pass
- [ ] No linting errors
- [ ] Code coverage maintained

### Pre-Deploy

- [ ] All tests pass
- [ ] Integration tests pass
- [ ] Manual E2E tests completed
- [ ] Performance tests passed

### Post-Deploy

- [ ] Smoke tests pass
- [ ] Critical workflows verified
- [ ] Monitoring alerts configured

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**End of Testing Guide**
