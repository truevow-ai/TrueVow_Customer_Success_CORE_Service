# Shared Inbox UI Improvements

## Design Philosophy

The shared inbox UI is designed based on best practices from top-tier support tools like:
- **Intercom**: Clean, modern interface with excellent message threading
- **Zendesk**: Powerful filtering and assignment features
- **Help Scout**: Intuitive conversation management
- **Front**: Multi-channel support with unified inbox

## Key UI Features

### 1. **Three-Panel Layout** (Standard Pattern)
- **Left Panel**: Conversation list with filters
- **Middle Panel**: Message thread
- **Right Panel**: Customer context, ticket details, internal notes

### 2. **Smart Polling Configuration**
- Default: 30 seconds for inbox list (conversations don't change often)
- Default: 10 seconds for active conversation (new messages are important)
- Configurable via environment variables
- Can be disabled entirely
- Future: WebSocket support for real-time updates

### 3. **Provider Abstraction**
- Voice/SMS providers: Twilio, Plivo (easily extensible)
- Speech providers: Deepgram, LiveKit, custom (easily extensible)
- Factory pattern for easy switching

### 4. **Multi-Channel Support**
- Email (SendGrid)
- SMS (Twilio/Plivo)
- Calls (Twilio/Plivo with transcription)
- Chat (future)
- Social media (future)

## Current Implementation Status

✅ **Completed:**
- Basic three-panel layout
- Conversation list with filtering
- Message thread display
- Reply functionality
- Internal notes
- Status management
- Configurable polling

🔄 **In Progress:**
- Provider abstraction (Twilio/Plivo, Deepgram/LiveKit)
- Webhook handlers using factory pattern

📋 **Planned:**
- Right panel with customer context
- Assignment UI
- Tag management
- Search functionality
- Keyboard shortcuts
- WebSocket real-time updates
- Rich text editor
- File attachments
- Message templates

## Polling Configuration

### Environment Variables

```env
# Inbox List Polling
NEXT_PUBLIC_ENABLE_INBOX_POLLING=true
NEXT_PUBLIC_INBOX_POLL_INTERVAL=30000  # 30 seconds (default)
NEXT_PUBLIC_INBOX_POLL_IDLE_INTERVAL=60000  # 60 seconds when tab inactive

# Conversation Detail Polling
NEXT_PUBLIC_ENABLE_CONVERSATION_POLLING=true
NEXT_PUBLIC_CONVERSATION_POLL_INTERVAL=10000  # 10 seconds (default)
NEXT_PUBLIC_CONVERSATION_POLL_IDLE_INTERVAL=30000  # 30 seconds when tab inactive

# WebSocket (Future)
NEXT_PUBLIC_ENABLE_WEBSOCKET=false
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3003/ws
```

### Recommended Settings by Volume

- **Low volume** (< 50 tickets/day): 60-120 seconds
- **Medium volume** (50-200 tickets/day): 30-60 seconds
- **High volume** (200+ tickets/day): 10-30 seconds, consider WebSockets

## Provider Configuration

### Voice/SMS Provider

```env
VOICE_PROVIDER=twilio  # or 'plivo'
```

### Speech Provider

```env
SPEECH_PROVIDER=deepgram  # or 'livekit', 'custom'
CUSTOM_SPEECH_API_URL=https://your-custom-api.com/transcribe  # if using 'custom'
```
