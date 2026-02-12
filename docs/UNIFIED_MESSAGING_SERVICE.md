# Unified Messaging Service

**Status:** ✅ Implemented  
**Purpose:** Unified SMS and WhatsApp messaging service for Sales CRM and CS-Support services

---

## Overview

The Unified Messaging Service provides a single interface for sending SMS (via Twilio) and WhatsApp (via Twilio WhatsApp Business API) messages. It can be used by both:
- **Sales CRM Service** - For sales outreach and customer communication
- **CS-Support Service** - For customer support and follow-ups

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Unified Messaging Service                     │
│  (lib/services/unified-messaging-service.ts)            │
│                                                         │
│  - SMS (via Twilio)                                     │
│  - WhatsApp (via Twilio WhatsApp Business API)         │
│  - Channel selection logic                              │
│  - Rich media support (WhatsApp)                        │
└─────────────────────────────────────────────────────────┘
              ↓                    ↓
┌─────────────────────┐  ┌─────────────────────┐
│  Sales CRM Service   │  │  CS-Support Service  │
│                      │  │                      │
│  - Sales outreach   │  │  - Support messages  │
│  - Lead follow-ups  │  │  - Customer updates   │
│  - Demo reminders   │  │  - Issue resolution  │
└─────────────────────┘  └─────────────────────┘
```

---

## Features

### 1. Unified Interface
- Single service handles both SMS and WhatsApp
- Consistent API for both channels
- Automatic channel selection

### 2. Channel Selection Logic
- **Contact Preference:** Use contact's preferred channel if set
- **Availability:** Check if contact has WhatsApp
- **Message Type:** Use WhatsApp for rich media, SMS for simple text
- **Fallback:** Fallback to SMS if WhatsApp unavailable

### 3. SMS Support (via Twilio)
- Text messages (up to 1600 characters)
- Delivery status tracking
- Bulk messaging

### 4. WhatsApp Support (via Twilio WhatsApp Business API)
- Text messages (up to 4096 characters)
- Rich media (images, documents, videos)
- Message templates (for first contact)
- Free-form messages (after initial template)
- Read receipts
- Interactive messages (buttons, lists, quick replies)

---

## Usage

### Sales CRM Service

```typescript
import { getUnifiedMessagingService } from '@/lib/services/unified-messaging-service';

const messagingService = getUnifiedMessagingService();

// Send SMS
await messagingService.sendMessage({
  to: '+1234567890',
  body: 'Hello, this is a test SMS',
  channel: 'sms',
  userId: 'user-id',
  leadId: 'lead-id',
  serviceType: 'sales_crm',
});

// Send WhatsApp
await messagingService.sendMessage({
  to: '+1234567890',
  body: 'Hello, this is a test WhatsApp message',
  channel: 'whatsapp',
  mediaUrls: ['https://example.com/image.jpg'],
  userId: 'user-id',
  leadId: 'lead-id',
  serviceType: 'sales_crm',
});

// Auto-select channel
const channel = await messagingService.selectChannel({
  phoneNumber: '+1234567890',
  hasWhatsApp: true,
  contactPreference: 'whatsapp',
});
```

### CS-Support Service

```typescript
// Same API - can be used from CS-Support Service
import { getUnifiedMessagingService } from '@/lib/services/unified-messaging-service';

const messagingService = getUnifiedMessagingService();

// Send support message
await messagingService.sendMessage({
  to: customerPhone,
  body: 'Your support ticket has been resolved.',
  channel: 'whatsapp', // or 'sms'
  userId: supportRepId,
  contactId: customerId,
  ticketId: ticketId,
  serviceType: 'cs_support',
});
```

---

## API Endpoints

### Send Message
**POST** `/api/v1/messages/send`

**Authentication:** Required (Clerk)

**Request Body:**
```json
{
  "to": "+1234567890",
  "body": "Hello, this is a test message",
  "channel": "whatsapp", // Optional: "sms" or "whatsapp"
  "hasWhatsApp": true, // Optional: whether contact has WhatsApp
  "contactPreference": "whatsapp", // Optional: contact's preferred channel
  "mediaUrls": ["https://..."], // Optional, WhatsApp only
  "templateName": "welcome_template", // Optional, WhatsApp only
  "templateParams": { "name": "John" }, // Optional, WhatsApp only
  "leadId": "uuid", // Optional
  "contactId": "uuid", // Optional
  "ticketId": "uuid", // Optional (CS-Support)
  "serviceType": "sales_crm", // Optional: "sales_crm" or "cs_support"
  "metadata": {} // Optional: additional metadata
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "uuid",
  "externalMessageId": "Twilio SID",
  "channel": "whatsapp",
  "status": "sent"
}
```

### SMS Webhook
**POST** `/api/v1/messages/webhook/sms`
- Handles incoming SMS messages from Twilio
- Processes status updates (sent, delivered, failed)
- Authentication: API Key (Twilio webhook)

### WhatsApp Webhook
**POST** `/api/v1/messages/webhook/whatsapp`
- Handles incoming WhatsApp messages from Twilio
- Processes status updates (sent, delivered, read, failed)
- Handles media attachments
- Authentication: API Key (Twilio webhook)

---

## Database Schema

### employee_messages Table

```sql
CREATE TABLE employee_messages (
  message_id UUID PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
  sender_id UUID, -- NULL for inbound messages
  recipient_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  media_urls JSONB, -- For WhatsApp: images, documents, videos
  message_status TEXT CHECK (message_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  read_at TIMESTAMPTZ, -- WhatsApp read receipt
  lead_id UUID,
  contact_id UUID,
  ticket_id UUID REFERENCES cs_tickets(ticket_id),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  external_message_id TEXT, -- Twilio message SID
  error_message TEXT,
  service_type TEXT CHECK (service_type IN ('sales_crm', 'cs_support')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_employee_messages_sender_id` - For querying by sender
- `idx_employee_messages_recipient_phone` - For querying by recipient
- `idx_employee_messages_channel` - For filtering by channel
- `idx_employee_messages_status` - For filtering by status
- `idx_employee_messages_lead_id` - For Sales CRM queries
- `idx_employee_messages_ticket_id` - For CS-Support queries
- `idx_employee_messages_external_message_id` - For webhook updates

---

## Configuration

### Environment Variables

**Twilio (SMS & WhatsApp):**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # For SMS
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890  # For WhatsApp
```

**Optional: WhatsApp Business API (Facebook)**
```env
WHATSAPP_BUSINESS_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_BUSINESS_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCESS_TOKEN=...
WHATSAPP_BUSINESS_APP_ID=...
WHATSAPP_BUSINESS_APP_SECRET=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...
```

---

## Channel Selection Logic

The service automatically selects the best channel based on:

1. **Contact Preference** (highest priority)
   - If contact has a preferred channel, use it

2. **Media Requirements**
   - If message includes media URLs, prefer WhatsApp

3. **Message Length**
   - If message > 1600 characters, prefer WhatsApp

4. **WhatsApp Availability**
   - If contact has WhatsApp, prefer WhatsApp

5. **Default**
   - Fallback to SMS

**Example:**
```typescript
// Auto-select: Will choose WhatsApp because hasWhatsApp=true
const result = await messagingService.sendMessage({
  to: '+1234567890',
  body: 'Hello!',
  hasWhatsApp: true,
  // channel not specified - will auto-select
});

// Force SMS
const result = await messagingService.sendMessage({
  to: '+1234567890',
  body: 'Hello!',
  channel: 'sms', // Explicitly choose SMS
});
```

---

## Files Created

**Core Service:**
- `lib/services/unified-messaging-service.ts` - Main unified messaging service

**API Endpoints:**
- `app/api/v1/messages/send/route.ts` - Send message API
- `app/api/v1/messages/webhook/sms/route.ts` - SMS webhook
- `app/api/v1/messages/webhook/whatsapp/route.ts` - WhatsApp webhook

**Database:**
- `database/migrations/025_employee_messages.sql` - Database migration

**Optional (Facebook WhatsApp API):**
- `lib/integrations/whatsapp/whatsapp-api.ts` - WhatsApp Business API client (if using Facebook API)

---

## Integration with CS-Support Service

The CS-Support Service can use the unified messaging service by:

1. **Importing the service:**
   ```typescript
   import { getUnifiedMessagingService } from '@/lib/services/unified-messaging-service';
   ```

2. **Using the same API:**
   - Same methods and interfaces
   - Same channel selection logic
   - Same database schema

3. **Sharing configuration:**
   - Both services use same Twilio credentials
   - Messages stored in same `employee_messages` table
   - Service type field distinguishes between services

---

## Integration with Sales CRM Service

The Sales CRM Service can use the unified messaging service by:

1. **Importing the service:**
   ```typescript
   import { getUnifiedMessagingService } from '@/lib/services/unified-messaging-service';
   ```

2. **Using for sales outreach:**
   ```typescript
   await messagingService.sendMessage({
     to: lead.phone,
     body: 'Hi! Interested in a demo?',
     leadId: lead.id,
     serviceType: 'sales_crm',
   });
   ```

3. **Sharing infrastructure:**
   - Same Twilio account
   - Same message tracking
   - Same webhook endpoints

---

## Benefits

1. **Code Reusability:** Single implementation for both services
2. **Consistency:** Same API and behavior across services
3. **Maintainability:** One place to update messaging logic
4. **Flexibility:** Easy to add new channels (e.g., Telegram, Signal)
5. **Cost Efficiency:** Shared infrastructure and configuration
6. **Unified Tracking:** All messages in one table for analytics

---

## Message Status Flow

### Outbound Messages
1. **pending** - Message created, not yet sent
2. **sent** - Message sent to provider (Twilio)
3. **delivered** - Message delivered to recipient
4. **read** - Message read by recipient (WhatsApp only)
5. **failed** - Message failed to send or deliver

### Inbound Messages
1. **delivered** - Message received and stored

---

## Error Handling

### Common Errors

1. **Invalid Phone Number:**
   - Error: `Invalid phone number format`
   - Solution: Use E.164 format (`+1234567890`)

2. **Message Too Long:**
   - SMS: `SMS message exceeds 1600 character limit`
   - WhatsApp: `WhatsApp message exceeds 4096 character limit`
   - Solution: Shorten message or split into multiple messages

3. **Missing Credentials:**
   - Error: `Twilio credentials not configured`
   - Solution: Set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`

4. **Provider Error:**
   - Error: `Twilio API error: {message}`
   - Solution: Check Twilio account, phone number, and API limits

---

## Testing

### Manual Testing

1. **Send SMS:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/messages/send \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "+1234567890",
       "body": "Test SMS",
       "channel": "sms"
     }'
   ```

2. **Send WhatsApp:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/messages/send \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "+1234567890",
       "body": "Test WhatsApp",
       "channel": "whatsapp"
     }'
   ```

3. **Check Message Status:**
   ```typescript
   const message = await messagingService.getMessage(messageId);
   console.log(message.message_status);
   ```

---

## Next Steps

1. **Database Migration:** Run migration `025_employee_messages.sql`
2. **Testing:** Test SMS and WhatsApp sending
3. **CS-Support Integration:** Update CS-Support service to use unified messaging
4. **Sales CRM Integration:** Update Sales CRM service to use unified messaging
5. **Analytics:** Add message analytics and reporting
6. **Templates:** Create message templates for common use cases
7. **Webhook Configuration:** Set up Twilio webhooks in Twilio console

---

## Migration from Existing Services

### CS-Support Service

If CS-Support is currently using `CommunicationSenderService` for SMS/WhatsApp:

1. **Option 1:** Keep both services (gradual migration)
   - Use `CommunicationSenderService` for template-based messages
   - Use `UnifiedMessagingService` for direct messages

2. **Option 2:** Migrate to unified service
   - Update all SMS/WhatsApp calls to use `UnifiedMessagingService`
   - Update webhook handlers to use unified service

### Sales CRM Service

1. **Import unified service:**
   ```typescript
   import { getUnifiedMessagingService } from '@/lib/services/unified-messaging-service';
   ```

2. **Replace existing SMS/WhatsApp code:**
   - Use `sendMessage()` instead of direct Twilio calls
   - Use `selectChannel()` for channel selection

---

## Status

✅ **Implementation Complete**

- ✅ Database migration (`employee_messages` table)
- ✅ Unified messaging service
- ✅ API endpoints (send, webhooks)
- ✅ Channel selection logic
- ✅ Message tracking
- ✅ Error handling
- ✅ Documentation

**Ready for:**
- Database migration
- Testing
- CS-Support integration
- Sales CRM integration

---

**Last Updated:** January 20, 2026
