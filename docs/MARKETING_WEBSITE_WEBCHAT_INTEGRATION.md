# Marketing Website Sales WebChat Integration

**Date:** January 15, 2026  
**Status:** ✅ Complete - Sales WebChat Widget Ready for Integration

---

## 🎯 **Purpose**

This is a **SALES/PROSPECT** webchat widget for the **marketing website**. It is **NOT** for customer support.

### Key Distinctions:

| Marketing Website Widget | Customer Portal Widget |
|-------------------------|----------------------|
| **Purpose:** Convert prospects to leads | **Purpose:** Customer support |
| **Context:** Sales inbox | **Context:** CS inbox |
| **Users:** Prospects/Leads | **Users:** Existing customers |
| **Auto-detects:** Existing customers → Redirects | **Auto-detects:** N/A (already customers) |

---

## 📁 **Integration Files**

All files are located in:
```
C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\2025-TrueVow-Website\webchat-integration\
```

**Files:**
1. `README.md` - Complete integration guide
2. `widget.js` - Standalone JavaScript widget
3. `widget.css` - Widget styles
4. `integration-example.html` - Example HTML integration

---

## 🔄 **Customer Detection & Redirect Flow**

```
Marketing Website Visitor
    ↓
Opens Sales WebChat Widget
    ↓
Enters Email
    ↓
Widget checks: POST /api/v1/sales-webchat/check-customer
    ↓
Is Existing Customer?
    ├─ YES → Show redirect message
    │         "You're already a customer!"
    │         Link to: /customer-portal/support
    │
    └─ NO → Create sales chat session
             Assign to Sales context
             Connect to Sales team
```

---

## 🏗️ **Architecture**

### Services Created:

1. **`lib/services/sales-webchat-service.ts`**
   - `checkIfCustomer()` - Detects existing customers
   - `getOrCreateSalesSession()` - Creates sales chat (prospects only)
   - `sendMessage()` - Sends messages
   - `getMessages()` - Fetches messages

### API Endpoints Created:

1. **`POST /api/v1/sales-webchat/check-customer`**
   - Checks if email/phone belongs to existing customer
   - Returns redirect URL if customer

2. **`POST /api/v1/sales-webchat/session`**
   - Creates sales chat session (prospects only)
   - Throws error if existing customer tries to use

3. **`GET /api/v1/sales-webchat/[id]/messages`**
   - Fetches chat messages

4. **`POST /api/v1/sales-webchat/[id]/messages`**
   - Sends chat message

### Components Created:

1. **`components/marketing-website/SalesWebChatWidget.tsx`**
   - React component for marketing website
   - Customer detection built-in
   - Redirect logic included

---

## 📋 **Integration Instructions for Website Agent**

### Step 1: Copy Files

Copy the `webchat-integration` folder to your marketing website:
```
2025-TrueVow-Website/
└── webchat-integration/
    ├── README.md
    ├── widget.js
    ├── widget.css
    └── integration-example.html
```

### Step 2: Add to HTML

Add before closing `</body>` tag:

```html
<!-- TrueVow Sales WebChat Widget -->
<link rel="stylesheet" href="/webchat-integration/widget.css">
<script src="/webchat-integration/widget.js"></script>
<script>
  TrueVowSalesChat.init({
    apiBaseUrl: 'https://cs-support.truevow.com', // CS-Support service URL
    position: 'bottom-right', // or 'bottom-left'
  });
</script>
```

### Step 3: Configure API URL

Update `apiBaseUrl` to point to your CS-Support service:
- Production: `https://cs-support.truevow.com`
- Staging: `https://cs-support-staging.truevow.com`
- Local: `http://localhost:3000` (for testing)

### Step 4: Test

1. **Test as Prospect:**
   - Use a new email address
   - Should create sales chat session
   - Should appear in Sales inbox

2. **Test as Customer:**
   - Use an existing customer email
   - Should show redirect message
   - Should link to customer portal

---

## 🔒 **Security & CORS**

### CORS Configuration Required:

The CS-Support service must allow requests from the marketing website domain:

```typescript
// In CS-Support service CORS config
allowedOrigins: [
  'https://www.truevow.com',
  'https://truevow.com',
  // Add other marketing website domains
]
```

### API Authentication:

- **Prospects:** No authentication required
- **Agents:** Use existing auth middleware
- **Customer Detection:** Email-only check (privacy-safe)

---

## 📊 **Conversation Flow**

### Sales Chat Flow:

1. Prospect opens widget on marketing website
2. Enters email (customer detection runs)
3. If prospect → Sales chat session created
4. Conversation assigned to **Sales context** (not CS)
5. Sales team sees in unified inbox (Sales tab)
6. Sales team responds
7. Prospect receives message

### Customer Redirect Flow:

1. Customer opens widget on marketing website
2. Enters email (customer detection runs)
3. System detects: Existing customer
4. Widget shows: "You're already a customer!"
5. Provides link to: `/customer-portal/support`
6. Customer clicks link → Goes to customer portal
7. Customer portal has:
   - Knowledge base (self-service)
   - Customer support webchat (CS context)

---

## 🎨 **Customization**

### Styling:

Override CSS variables in your stylesheet:

```css
:root {
  --truevow-chat-primary: #2563eb; /* Your brand color */
  --truevow-chat-primary-hover: #1d4ed8;
  --truevow-chat-bg: #ffffff;
  --truevow-chat-text: #1f2937;
}
```

### Positioning:

```javascript
TrueVowSalesChat.init({
  position: 'bottom-right', // or 'bottom-left'
  zIndex: 9999, // Adjust if needed
});
```

---

## ✅ **Integration Checklist**

- [ ] Copy `webchat-integration` folder to marketing website
- [ ] Add widget code to HTML (before `</body>`)
- [ ] Configure `apiBaseUrl` (CS-Support service URL)
- [ ] Configure CORS on CS-Support service
- [ ] Test as prospect (new email)
- [ ] Test as customer (existing email)
- [ ] Verify redirect to customer portal works
- [ ] Verify sales team receives chats in Sales inbox
- [ ] Test on mobile devices
- [ ] Customize styling if needed

---

## 🔗 **Related Documentation**

- **Integration Guide:** `/webchat-integration/README.md` (in marketing website folder)
- **Sales WebChat Service:** `/lib/services/sales-webchat-service.ts`
- **Customer Portal Widget:** `/components/customer-portal/WebChatWidget.tsx` (different widget)
- **Unified Inbox:** `/docs/UNIFIED_INBOX_ARCHITECTURE.md`

---

## 📞 **Support**

For integration questions:
1. Review `/webchat-integration/README.md`
2. Check API documentation
3. Contact TrueVow development team

---

**Last Updated:** January 15, 2026  
**Version:** 1.0.0
