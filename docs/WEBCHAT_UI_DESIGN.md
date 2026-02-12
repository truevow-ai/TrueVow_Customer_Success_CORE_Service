# WebChat Widget UI Design

**Date:** January 15, 2026  
**Status:** ✅ Complete UI Implementation

---

## 🎨 **Visual Design Overview**

The webchat widgets have a **modern, clean design** with a floating button that expands into a chat window.

---

## 📱 **Two Widget Types**

### **1. Customer Support WebChat** (Customer Portal)
- **Purpose:** Customer support
- **Context:** CS inbox
- **File:** `components/customer-portal/WebChatWidget.tsx`

### **2. Sales WebChat** (Marketing Website)
- **Purpose:** Convert prospects to leads
- **Context:** Sales inbox
- **File:** `components/marketing-website/SalesWebChatWidget.tsx`

---

## 🎯 **UI States & Layout**

### **State 1: Closed (Floating Button)**

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│                          ┌──────┐   │
│                          │  💬  │   │  ← Blue circular button
│                          └──────┘   │     (56px × 56px)
│                                     │     Bottom-right corner
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Blue circular button (`#2563eb`)
- MessageSquare icon (white)
- Shadow for depth
- Hover effect (slight scale + darker blue)
- Position: Bottom-right or bottom-left

---

### **State 2: Open (Chat Window)**

```
┌─────────────────────────────────────┐
│  ┌──────────────────────────────┐  │
│  │ 💬 Chat with us        [─] [×]│  │  ← Header (Blue bg)
│  ├──────────────────────────────┤  │
│  │                              │  │
│  │  ┌────────────────────┐     │  │
│  │  │ Customer message   │     │  │  ← Messages area
│  │  │ 2:30 PM            │     │  │     (Scrollable)
│  │  └────────────────────┘     │  │
│  │                              │  │
│  │     ┌──────────────────┐     │  │
│  │     │ Agent response   │     │  │
│  │     │ 2:32 PM          │     │  │
│  │     └──────────────────┘     │  │
│  │                              │  │
│  ├──────────────────────────────┤  │
│  │ [Type message...]      [Send]│  │  ← Input area
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Dimensions:**
- Width: `384px` (w-96)
- Height: `500px` (h-[500px])
- Position: Fixed, bottom-right/left
- Shadow: Large shadow for depth

---

## 🎨 **Detailed UI Breakdown**

### **Header Section**

```
┌─────────────────────────────────────────┐
│ 💬 Chat with us        [📞] [─] [×]    │  ← Blue background (#2563eb)
└─────────────────────────────────────────┘
```

**Elements:**
- **Icon:** MessageSquare icon (left)
- **Title:** "Chat with us" (CS) or "Chat with Sales" (Sales)
- **Actions:**
  - Phone icon (CS only - for callback)
  - Minimize button (─)
  - Close button (×)
- **Background:** Blue (`#2563eb`)
- **Text:** White

---

### **Email Prompt (Sales WebChat Only)**

```
┌─────────────────────────────────────────┐
│                                         │
│         Let's get started!              │
│                                         │
│  Enter your email to start chatting     │
│  with our sales team                    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ your@email.com                  │   │  ← Email input
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Your name (optional)             │   │  ← Name input
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        Start Chat                │   │  ← Submit button
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Centered layout
- Email input (required)
- Name input (optional)
- "Start Chat" button
- Customer detection runs on submit

---

### **Customer Redirect Message (Sales WebChat)**

```
┌─────────────────────────────────────────┐
│ ⚠️ Existing Customer            [×]    │  ← Alert header
├─────────────────────────────────────────┤
│                                         │
│         ⚠️                              │
│                                         │
│    Existing Customer                    │
│                                         │
│  You're already a TrueVow customer!     │
│  For support, please visit our          │
│  customer portal.                       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Go to Customer Portal          │   │  ← Redirect button
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Alert icon
- Clear message
- Redirect button to customer portal

---

### **Messages Area**

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌──────────────────────────────┐      │
│  │ Customer message              │      │  ← Customer (right-aligned)
│  │ 2:30 PM                       │      │     Blue background
│  └──────────────────────────────┘      │
│                                         │
│      ┌──────────────────────────┐        │
│      │ Agent response          │        │  ← Agent (left-aligned)
│      │ 2:32 PM                 │        │     Gray background
│      └──────────────────────────┘        │
│                                         │
│  ┌──────────────────────────────┐      │
│  │ Another customer message      │      │
│  │ 2:35 PM                       │      │
│  └──────────────────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

**Message Bubbles:**
- **Customer messages:**
  - Right-aligned
  - Blue background (`bg-blue-100`)
  - Max width: 80%
  
- **Agent messages:**
  - Left-aligned
  - Gray background (`bg-gray-100`)
  - Max width: 80%

- **Timestamps:**
  - Small gray text below message
  - Format: `2:30 PM`

- **Auto-scroll:** Automatically scrolls to latest message

---

### **Input Area**

```
┌─────────────────────────────────────────┐
│ [Type your message...]          [📤]    │  ← Input + Send button
└─────────────────────────────────────────┘
```

**Features:**
- Text input (full width minus button)
- Placeholder: "Type your message..."
- Send button (blue, with Send icon)
- Enter key to send
- Disabled when sending or no session
- Loading spinner when sending

---

### **Callback Panel (CS WebChat Only)**

```
┌─────────────────────────────────────────┐
│ Request a Callback                     │
│                                         │
│ ┌──────────────────────────────┐ [📞] │
│ │ (555) 123-4567                │      │  ← Phone input + button
│ └──────────────────────────────┘      │
│                                         │
│ An agent will call you at this number  │
└─────────────────────────────────────────┘
```

**Features:**
- Toggleable panel (shown when phone icon clicked)
- Phone number input
- Callback button
- Helper text

---

## 🎨 **Color Scheme**

### **Primary Colors:**
- **Blue:** `#2563eb` (Primary)
- **Blue Hover:** `#1d4ed8`
- **White:** `#ffffff` (Background)
- **Gray:** `#1f2937` (Text)
- **Light Gray:** `#e5e7eb` (Borders)

### **Message Colors:**
- **Customer messages:** `#dbeafe` (Light blue)
- **Agent messages:** `#e5e7eb` (Light gray)
- **Timestamps:** `#9ca3af` (Medium gray)

---

## 📐 **Dimensions & Spacing**

### **Floating Button:**
- Size: `56px × 56px` (w-14 h-14)
- Position: `24px` from bottom and right/left
- Border radius: `50%` (circular)

### **Chat Window:**
- Width: `384px` (w-96)
- Height: `500px` (h-[500px])
- Border radius: `8px` (rounded-lg)
- Shadow: Large shadow for depth

### **Minimized State:**
- Width: `320px` (w-80)
- Height: `64px` (h-16)
- Shows only header

---

## 📱 **Mobile Responsive**

On mobile devices (< 640px):
- Width: `calc(100vw - 48px)` (full width minus padding)
- Height: `calc(100vh - 48px)` (full height minus padding)
- Max height: `500px`
- Positioned: `24px` from edges

---

## 🎯 **Key UI Features**

### **1. Smooth Animations:**
- Button hover: Scale + color change
- Window open/close: Smooth transitions
- Message send: Loading spinner

### **2. Accessibility:**
- ARIA labels on buttons
- Keyboard support (Enter to send)
- Screen reader friendly
- Focus states

### **3. User Experience:**
- Auto-scroll to latest message
- Real-time message polling (every 3 seconds)
- Loading states
- Error handling
- Empty states with helpful messages

---

## 🖼️ **Visual Mockup Description**

### **Closed State:**
```
Bottom-right corner of page:
  ┌──────┐
  │  💬  │  ← Blue circle, white icon
  └──────┘
```

### **Open State:**
```
┌─────────────────────────────┐
│ 💬 Chat with us    [─] [×] │  ← Blue header
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐   │
│  │ Customer message    │   │  ← Right-aligned, blue
│  │ 2:30 PM             │   │
│  └─────────────────────┘   │
│                             │
│     ┌─────────────────┐    │
│     │ Agent response   │    │  ← Left-aligned, gray
│     │ 2:32 PM          │    │
│     └─────────────────┘    │
│                             │
├─────────────────────────────┤
│ [Type message...]    [📤]  │  ← Input area
└─────────────────────────────┘
```

---

## 🎨 **Styling Details**

### **Typography:**
- Font: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`)
- Header: `16px`, `font-semibold`
- Messages: `14px` (text-sm)
- Timestamps: `11px` (text-xs)

### **Shadows:**
- Button: `0 10px 25px rgba(0, 0, 0, 0.1)`
- Window: `shadow-2xl` (large shadow)

### **Borders:**
- Border radius: `8px` (rounded-lg)
- Border color: `#e5e7eb` (light gray)

---

## ✅ **UI States Summary**

1. **Closed:** Floating blue button
2. **Open - Email Prompt (Sales):** Email/name form
3. **Open - Customer Redirect (Sales):** Alert message
4. **Open - Chat:** Messages + input
5. **Minimized:** Header only (64px height)
6. **Loading:** Spinner in button/input
7. **Sending:** Disabled input, spinner in send button
8. **Empty:** "Start a conversation" message

---

**Last Updated:** January 15, 2026
