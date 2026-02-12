# External Support Page - UI Visual Guide

**Date:** January 15, 2026  
**Status:** ✅ Full-Page Chat Interface Complete

---

## 🎨 **UI Overview**

Full-page chat interface similar to ChatGPT/Claude, with option buttons within chat (like Vercel).

---

## 📱 **Full-Page Layout**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  🤖 TrueVow Support              [🎤 Voice]     │  │  ← Header
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │  ┌───┐                                            │  │
│  │  │ 🤖│  Welcome to TrueVow Support!              │  │  ← Assistant
│  │  └───┘  How can we help you today?              │  │     (left-aligned)
│  │                                                   │  │
│  │      ┌──────────────────────┐                   │  │
│  │      │ 🔧 Technical Support  │                   │  │  ← Option buttons
│  │      └──────────────────────┘                   │  │     (Charcoal)
│  │      ┌──────────────────────┐                   │  │
│  │      │ 💳 Billing Question   │                   │  │
│  │      └──────────────────────┘                   │  │
│  │      ┌──────────────────────┐                   │  │
│  │      │ 👤 Account Help       │                   │  │
│  │      └──────────────────────┘                   │  │
│  │      ┌──────────────────────┐                   │  │
│  │      │ ✨ AI Support Agent   │                   │  │
│  │      └──────────────────────┘                   │  │
│  │                                                   │  │
│  │                            ┌───┐                 │  │
│  │                            │ U │  Technical      │  │  ← User (right)
│  │                            └───┘  Support        │  │
│  │                                                   │  │
│  │  ┌───┐                                            │  │
│  │  │ 🤖│  I'm here to help with technical          │  │  ← Assistant
│  │  └───┘  support. Please describe the issue...   │  │
│  │                                                   │  │
│  │                            ┌───┐                 │  │
│  │                            │ U │  I can't log in │  │  ← User
│  │                            └───┘                 │  │
│  │                                                   │  │
│  │  ┌───┐                                            │  │
│  │  │ 🤖│  Let me help you with that. Can you...    │  │  ← Assistant
│  │  └───┘                                            │  │
│  │                                                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Type your message...]              [Send] [🎤] │  │  ← Input area
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 **Color Scheme**

### **Applied Colors:**
- **Header:** Blue (`#2563eb`) - Clear, professional
- **Option Buttons:** Charcoal (`#1f2937`) - Sophisticated
- **Messages:** Light grey (`#f3f4f6`) - Neutral
- **Text:** Dark grey (`#1f2937`) - High contrast
- **Background:** White (`#ffffff`) - Clean

---

## 🎯 **Key Features**

### **1. Option Buttons Within Chat** ⭐
- Shown in assistant messages
- Charcoal black buttons
- Icons for each option
- Click to select → Routes to appropriate agent

### **2. Full-Page Experience**
- No floating widgets
- ChatGPT/Claude-like interface
- Centered conversation (max-width: 4xl)
- Fixed input at bottom

### **3. Voice Mode**
- Toggle in header
- Voice indicator badge
- Real-time transcription
- Switch between text/voice

### **4. Message Layout**
- Assistant: Left-aligned, avatar (🤖)
- User: Right-aligned, avatar (U)
- Messages: Light grey background
- Timestamps: Small, gray text

---

## 📐 **Dimensions**

- **Max Width:** 4xl (896px)
- **Header Height:** ~64px
- **Input Height:** ~52px (min)
- **Message Padding:** 16px
- **Avatar Size:** 32px (8x8)

---

## 🔄 **User Flow**

1. Visit `/support`
2. See welcome message with 4 option buttons
3. Click option (e.g., "Technical Support")
4. Chat begins with first-line agent
5. Continue conversation
6. Can switch to voice mode anytime

---

## ✅ **Benefits**

- ✅ **Security:** Isolated from customer portal
- ✅ **Clean UI:** Full-page, focused experience
- ✅ **Intelligent:** Option buttons within chat (like Vercel)
- ✅ **Modern:** ChatGPT/Claude-like interface
- ✅ **Flexible:** Routes to different agents

---

**Last Updated:** January 15, 2026
