/**
 * Polling Configuration
 * Configurable polling intervals to balance real-time updates with resource usage
 */

import { SERVICE_URLS, WEBSOCKET_CONFIG } from './app-config'

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
    url: SERVICE_URLS.WEBSOCKET_URL,
    reconnectInterval: WEBSOCKET_CONFIG.RECONNECT_INTERVAL_MS,
    maxReconnectAttempts: WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS,
  },
}

/**
 * Recommended polling intervals based on usage:
 * - Low volume (< 50 tickets/day): 60-120 seconds
 * - Medium volume (50-200 tickets/day): 30-60 seconds
 * - High volume (200+ tickets/day): 10-30 seconds, consider WebSockets
 */

