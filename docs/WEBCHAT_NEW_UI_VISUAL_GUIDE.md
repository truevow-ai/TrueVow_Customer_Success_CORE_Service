# WebChat Widget - New UI Visual Guide

**Date:** January 15, 2026  
**Status:** ✅ Enhanced UI Complete

---

## 🎨 **New UI Overview**

The webchat widgets now feature:
1. **Research-based blue color scheme** (trust, professionalism)
2. **Preconfigured engagement options** (reduces friction)
3. **Voice agent integration** (hands-free interaction)
4. **Real-time voice transcript display** (seamless experience)

---

## 📱 **Sales WebChat - New UI Flow**

### **Step 1: Closed State (Floating Button)**

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                          ┌──────┐   │
│                          │  💬  │   │  ← Blue (#2563eb)
│                          └──────┘   │     Circular button
│                                     │     56px × 56px
│                                     │
└─────────────────────────────────────┘
```

**Color:** `#2563eb` (Research-based trust blue)

---

### **Step 2: Email Entry Screen**

```
┌─────────────────────────────────────────┐
│ 💬 Chat with Sales            [─] [×] │  ← Blue header
├─────────────────────────────────────────┤
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
│  │        Start Chat                │   │  ← Blue button
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Colors:**
- Header: `#2563eb` (Blue)
- Input borders: `#e5e7eb` (Light gray)
- Button: `#2563eb` (Blue) → `#1d4ed8` (Hover)

---

### **Step 3: Preconfigured Engagement Options** ⭐ NEW

```
┌─────────────────────────────────────────┐
│ 💬 Chat with Sales            [─] [×] │  ← Blue header
├─────────────────────────────────────────┤
│                                         │
│         Welcome to TrueVow!              │
│                                         │
│         How can we help you today?      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        Get a Demo                │   │  ← Blue button
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        Pricing                    │   │  ← Blue button
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        Product Tour               │   │  ← Blue button
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Chat with our AI Virtual Rep ✨  │   │  ← Blue button
│  └─────────────────────────────────┘   │     (Enables voice)
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- 4 preconfigured options (like reference images)
- All buttons: `#2563eb` background, white text
- AI option includes ✨ sparkle icon
- Clicking AI option → Auto-enables voice mode

---

### **Step 4: Chat Interface (Text Mode)**

```
┌─────────────────────────────────────────┐
│ 💬 Chat with Sales            [─] [×] │  ← Blue header
├─────────────────────────────────────────┤
│                                         │
│      ┌──────────────────────────┐       │
│      │ Hi, I'm interested in   │       │  ← Agent (gray)
│      │ your pricing plans      │       │     #f3f4f6
│      │ 2:30 PM                 │       │
│      └──────────────────────────┘     │
│                                         │
│  ┌──────────────────────────────┐      │
│  │ I'd like to see a demo       │      │  ← Customer (blue)
│  │ 2:32 PM                       │      │     #dbeafe
│  └──────────────────────────────┘      │
│                                         │
│      ┌──────────────────────────┐       │
│      │ I'll connect you with    │       │  ← Agent (gray)
│      │ our sales team...        │       │
│      │ 2:33 PM                 │       │
│      └──────────────────────────┘     │
│                                         │
├─────────────────────────────────────────┤
│ [Type message...]    [📤] [🎤]         │  ← Input area
└─────────────────────────────────────────┘
```

**Message Colors:**
- **Customer:** `#dbeafe` (Light blue), right-aligned
- **Agent:** `#f3f4f6` (Light gray), left-aligned
- **Text:** `#1f2937` (Dark gray/black)

---

### **Step 5: Voice Mode Interface** ⭐ NEW

```
┌─────────────────────────────────────────┐
│ 💬 Chat with Sales    [🎤 Voice] [─] [×]│  ← Voice indicator
├─────────────────────────────────────────┤
│                                         │
│      ┌──────────────────────────┐       │
│      │ Welcome! I'm your AI    │       │  ← Agent (gray)
│      │ Virtual Rep. How can I   │       │
│      │ help you today?         │       │
│      │ 🔊 Voice conversation   │       │
│      │ 2:30 PM                 │       │
│      └──────────────────────────┘     │
│                                         │
│  ┌──────────────────────────────┐      │
│  │ I'm looking for pricing      │      │  ← Customer (blue)
│  │ 🎤 Speaking...               │      │     Real-time transcript
│  │ 2:32 PM                       │      │
│  └──────────────────────────────┘      │
│                                         │
│      ┌──────────────────────────┐       │
│      │ I'd be happy to help     │       │  ← Agent (gray)
│      │ with pricing. Let me...  │       │
│      │ 🔊 Voice conversation   │       │
│      │ 2:33 PM                 │       │
│      └──────────────────────────┘     │
│                                         │
├─────────────────────────────────────────┤
│ [🔴 Stop]  [Switch to Text]            │  ← Voice controls
└─────────────────────────────────────────┘
```

**Voice Features:**
- **Listening indicator:** Red pulsing button when active
- **Real-time transcript:** Shows as you speak
- **Voice labels:** 🔊 icon for voice messages
- **Toggle:** Switch between text and voice anytime

---

## 🎨 **Customer Support WebChat - New UI**

### **Step 1: Preconfigured Support Options** ⭐ NEW

```
┌─────────────────────────────────────────┐
│ 💬 Chat with us              [📞] [─] [×]│  ← Blue header
├─────────────────────────────────────────┤
│                                         │
│              ❓                          │
│                                         │
│         How can we help you today?      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │    Technical Support             │   │  ← Blue button
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │    Billing Question              │   │  ← Blue button
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │    Account Help                  │   │  ← Blue button
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Chat with AI Support Agent ✨   │   │  ← Blue button
│  └─────────────────────────────────┘   │     (Enables voice)
│                                         │
└─────────────────────────────────────────┘
```

**Support Options:**
- Technical Support
- Billing Question
- Account Help
- Chat with AI Support Agent ✨

---

### **Step 2: Active Chat with Voice**

```
┌─────────────────────────────────────────┐
│ 💬 Chat with us    [🎤 Voice] [📞] [─] [×]│
├─────────────────────────────────────────┤
│                                         │
│      ┌──────────────────────────┐       │
│      │ Hi! I can help with      │       │  ← Agent (gray)
│      │ technical support...     │       │
│      │ 2:30 PM                 │       │
│      └──────────────────────────┘     │
│                                         │
│  ┌──────────────────────────────┐      │
│  │ I can't log into my account  │      │  ← Customer (blue)
│  │ 🎤 Speaking...               │      │     Real-time voice
│  │ 2:32 PM                       │      │
│  └──────────────────────────────┘      │
│                                         │
│      ┌──────────────────────────┐       │
│      │ Let me help you with     │       │  ← Agent (gray)
│      │ that. Can you try...     │       │
│      │ 🔊 Voice conversation   │       │
│      │ 2:33 PM                 │       │
│      └──────────────────────────┘     │
│                                         │
├─────────────────────────────────────────┤
│ [🔴 Stop]  [Switch to Text]            │  ← Voice controls
└─────────────────────────────────────────┘
```

---

## 🎨 **Color Scheme Reference**

### **Primary Colors:**
```
Header/Border:     #2563eb  (Trust Blue)
Hover State:       #1d4ed8  (Darker Blue)
Customer Messages: #dbeafe  (Light Blue)
Agent Messages:    #f3f4f6  (Light Gray)
Text:              #1f2937  (Dark Gray/Black)
Borders:           #e5e7eb  (Light Gray)
Background:        #ffffff  (White)
Input Background:   #f9fafb  (Very Light Gray)
```

### **Visual Hierarchy:**
1. **Header:** Blue (`#2563eb`) - Primary action area
2. **Buttons:** Blue (`#2563eb`) - Call-to-action
3. **Customer Messages:** Light Blue (`#dbeafe`) - User's own messages
4. **Agent Messages:** Light Gray (`#f3f4f6`) - System/agent messages
5. **Text:** Dark Gray (`#1f2937`) - High contrast for readability

---

## 🎯 **Key Visual Features**

### **1. Preconfigured Options (NEW)**
- **Layout:** Centered, vertical stack
- **Buttons:** Full-width, rounded corners
- **Spacing:** Comfortable gaps between options
- **Icons:** Sparkle (✨) for AI options
- **Colors:** Blue background, white text

### **2. Voice Mode Indicators (NEW)**
- **Header Badge:** "🎤 Voice" or "🎤 Listening..."
- **Message Labels:** 🔊 icon for voice conversations
- **Real-time Transcript:** Shows as you speak
- **Controls:** Red "Stop" button when listening

### **3. Message Bubbles**
- **Customer:** Right-aligned, light blue (`#dbeafe`)
- **Agent:** Left-aligned, light gray (`#f3f4f6`)
- **Timestamps:** Small gray text below
- **Voice Indicators:** Microphone/volume icons

### **4. Input Area**
- **Text Mode:** Input field + Send button + Mic button
- **Voice Mode:** Stop button + Switch to Text button
- **Background:** Very light gray (`#f9fafb`)
- **Borders:** Light gray (`#e5e7eb`)

---

## 📐 **Dimensions & Spacing**

### **Widget Size:**
- **Width:** 384px (w-96)
- **Height:** 500px (h-[500px])
- **Border Radius:** 8px (rounded-lg)
- **Shadow:** Large shadow for depth

### **Button Sizes:**
- **Preconfigured Options:** Full width, ~48px height
- **Send Button:** ~40px × 40px
- **Voice Button:** ~40px × 40px

### **Spacing:**
- **Between Options:** 12px (space-y-3)
- **Message Padding:** 12px (p-3)
- **Input Padding:** 16px (p-4)

---

## 🎬 **User Flow Visualization**

### **Sales WebChat Flow:**
```
1. Click floating button (blue circle)
   ↓
2. Enter email + name
   ↓
3. See preconfigured options (4 buttons)
   ↓
4. Select option (e.g., "Get a Demo")
   ↓
5. Chat interface opens
   ↓
6. Can switch to voice mode anytime
   ↓
7. Voice transcript appears in real-time
```

### **CS WebChat Flow:**
```
1. Click floating button (blue circle)
   ↓
2. See preconfigured support options (4 buttons)
   ↓
3. Select option (e.g., "Technical Support")
   ↓
4. Chat interface opens
   ↓
5. Can switch to voice mode anytime
   ↓
6. Voice transcript appears in real-time
```

---

## ✨ **What's New vs. Old**

### **Before:**
- ❌ No preconfigured options
- ❌ No voice mode
- ❌ Generic blue colors
- ❌ Email prompt only (sales)

### **After:**
- ✅ Preconfigured engagement options (like reference images)
- ✅ Voice agent integration (speech-to-text, text-to-speech)
- ✅ Research-based blue color scheme
- ✅ Real-time voice transcript display
- ✅ Seamless text/voice switching
- ✅ Visual voice indicators

---

## 🎨 **Visual Comparison**

### **Old Header:**
```
💬 Chat with Sales        [─] [×]
```

### **New Header (Voice Mode):**
```
💬 Chat with Sales    [🎤 Voice] [─] [×]
```

### **Old Messages:**
```
[Customer message] 2:30 PM
```

### **New Messages (Voice):**
```
[Customer message] 🎤 Speaking... 2:30 PM
[Agent response] 🔊 Voice conversation 2:32 PM
```

---

## 📱 **Mobile Responsive**

On mobile devices:
- Full-width minus padding
- Touch-friendly button sizes (44px minimum)
- Optimized spacing
- Voice controls remain accessible

---

**Last Updated:** January 15, 2026  
**Version:** 2.0.0
