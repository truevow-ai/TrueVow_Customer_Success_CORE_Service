# External Customer Support Page Architecture

**Date:** January 15, 2026  
**Status:** ✅ Complete - Full-Page Chat Interface

---

## 🎯 **Architecture Decision**

### **Why External Support Page?**

1. **Security:** LLM connection requires isolation from customer portal
2. **Separation of Concerns:** Support is separate from customer account management
3. **Clean Experience:** Full-page chat interface (like ChatGPT/Claude)
4. **No Floating Widgets:** Dedicated, focused support experience

---

## 🏗️ **Implementation**

### **Route:**
- **Path:** `/support`
- **File:** `app/support/page.tsx`
- **Component:** `components/support/CustomerSupportChat.tsx`

### **Key Features:**

1. **Full-Page Chat Interface**
   - Similar to ChatGPT/Claude
   - Clean, minimal header
   - Centered chat area
   - Fixed input at bottom

2. **Option Buttons Within Chat**
   - Shown in assistant messages (like Vercel)
   - Intelligent placement
   - Context-aware options

3. **First-Line Support Agent**
   - Routes based on selected option
   - Technical Support → Technical agent
   - Billing → Billing specialist
   - Account Help → Account specialist
   - AI Agent → AI Support Agent

4. **Voice Mode**
   - Toggle between text and voice
   - Real-time transcription
   - Visual indicators

---

## 🎨 **UI Design**

### **Layout:**
```
┌─────────────────────────────────────────┐
│  TrueVow Support              [Voice]  │  ← Minimal header
├─────────────────────────────────────────┤
│                                         │
│  ┌───┐                                  │
│  │ 🤖│  Welcome! How can we help?      │  ← Assistant
│  └───┘                                  │
│      [Technical] [Billing] [Account]   │  ← Option buttons
│      [AI Agent ✨]                      │
│                                         │
│                    ┌───┐               │
│                    │ U │  I need help │  ← User
│                    └───┘               │
│                                         │
│  ┌───┐                                  │
│  │ 🤖│  I can help with that...        │  ← Assistant
│  └───┘                                  │
│                                         │
├─────────────────────────────────────────┤
│ [Type message...]              [Send]   │  ← Input area
└─────────────────────────────────────────┘
```

### **Color Scheme:**
- **Header:** Blue (`#2563eb`)
- **Options:** Charcoal (`#1f2937`)
- **Messages:** Light grey (`#f3f4f6`)
- **Text:** Dark grey (`#1f2937`)

---

## 🔒 **Security Considerations**

### **Isolation:**
- Separate route from customer portal
- No shared authentication (if needed)
- LLM connections isolated
- API endpoints secured

### **Data Flow:**
```
Customer → /support → CS-Support API → LLM
                    ↓
              Conversation stored
              (separate from portal)
```

---

## 📁 **Files Created**

1. ✅ `app/support/page.tsx` - External support route
2. ✅ `components/support/CustomerSupportChat.tsx` - Full-page chat component
3. ✅ `docs/EXTERNAL_SUPPORT_PAGE_ARCHITECTURE.md` - This file

---

## 🎯 **User Flow**

1. Customer visits `/support`
2. Sees welcome message with option buttons
3. Selects option (e.g., "Technical Support")
4. Chat begins with first-line agent
5. Can switch to voice mode anytime
6. Conversation continues in full-page interface

---

## ✅ **Benefits**

- ✅ **Security:** Isolated from customer portal
- ✅ **Clean UI:** Full-page, focused experience
- ✅ **Intelligent:** Option buttons within chat (like Vercel)
- ✅ **Flexible:** Can route to different agents
- ✅ **Modern:** ChatGPT/Claude-like interface

---

**Last Updated:** January 15, 2026
