/**
 * Polling Configuration
 * Configurable polling intervals to balance real-time updates with resource usage
 */

export const POLLING_CONFIG = {
  // Inbox list polling (less frequent - conversations don't change as often)
  INBOX_LIST: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_INBOX_POLLING === 'true',
    interval: parseInt(process.env.NEXT_PUBLIC_INBOX_POLL_INTERVAL || '30000', 10), // Default: 30 seconds
    idleInterval: parseInt(process.env.NEXT_PUBLIC_INBOX_POLL_IDLE_INTERVAL || '60000', 10), // Default: 60 seconds when tab inactive
  },
  
  // Conversation detail polling (more frequent - new messages are important)
  CONVERSATION_DETAIL: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_CONVERSATION_POLLING === 'true',
    interval: parseInt(process.env.NEXT_PUBLIC_CONVERSATION_POLL_INTERVAL || '10000', 10), // Default: 10 seconds
    idleInterval: parseInt(process.env.NEXT_PUBLIC_CONVERSATION_POLL_IDLE_INTERVAL || '30000', 10), // Default: 30 seconds when tab inactive
  },
  
  // WebSocket fallback (preferred over polling)
  WEBSOCKET: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3003/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
  },
}

/**
 * Recommended polling intervals based on usage:
 * - Low volume (< 50 tickets/day): 60-120 seconds
 * - Medium volume (50-200 tickets/day): 30-60 seconds
 * - High volume (200+ tickets/day): 10-30 seconds, consider WebSockets
 */

