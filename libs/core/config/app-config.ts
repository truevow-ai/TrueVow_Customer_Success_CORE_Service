/**
 * Application Configuration
 * Centralized configuration for all configurable values
 * All hardcoded values should be moved here and sourced from environment variables or database
 */

// ============================================================================
// SERVICE URLS - All inter-service communication URLs
// ============================================================================
export const SERVICE_URLS = {
  // Platform Service (SaaS Admin / Platform)
  PLATFORM_SERVICE_URL: process.env.PLATFORM_SERVICE_URL || 'http://localhost:3000',
  
  // Tenant Application API (FastAPI Backend)
  TENANT_SERVICE_URL: process.env.TENANT_APP_URL || process.env.FASTAPI_BACKEND_SERVICE_URL || process.env.TENANT_SERVICE_URL || 'http://localhost:8000',
  
  // Internal Ops Service
  INTERNAL_OPS_SERVICE_URL: process.env.INTERNAL_OPS_SERVICE_URL || process.env.SAAS_ADMIN_SERVICE_URL || 'http://localhost:3001',
  
  // Sales CRM Service
  SALES_SERVICE_URL: process.env.SALES_CRM_SERVICE_URL || process.env.SALES_SERVICE_URL || 'http://localhost:3002',
  
  // CS Support Service (this service)
  CS_SUPPORT_URL: process.env.CUSTOMER_SUCCESS_CORE_SERVICE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3061',
  
  // WebSocket URL
  WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3003/ws',
} as const

// ============================================================================
// EXTERNAL API URLS - Third-party service endpoints
// ============================================================================
export const EXTERNAL_API_URLS = {
  // Twilio API
  TWILIO_API_URL: 'https://api.twilio.com/2010-04-01',
  
  // Resend Email API
  RESEND_API_URL: 'https://api.resend.com',
  
  // CRM Integration (Intakely)
  CRM_API_URL: process.env.INTAKELY_CRM_API_URL || 'https://api.intakely.com',
} as const

// ============================================================================
// TIME DURATIONS - All time-based configuration
// ============================================================================
export const TIME_DURATIONS = {
  // Default periods for analytics (in days)
  DEFAULT_ANALYTICS_PERIOD_DAYS: parseInt(process.env.DEFAULT_ANALYTICS_PERIOD_DAYS || '30', 10),
  DEFAULT_TREND_PERIOD_DAYS: parseInt(process.env.DEFAULT_TREND_PERIOD_DAYS || '7', 10),
  EXTENDED_TREND_PERIOD_DAYS: parseInt(process.env.EXTENDED_TREND_PERIOD_DAYS || '14', 10),
  LONG_TERM_PERIOD_DAYS: parseInt(process.env.LONG_TERM_PERIOD_DAYS || '90', 10),
  ANNUAL_PERIOD_DAYS: parseInt(process.env.ANNUAL_PERIOD_DAYS || '365', 10),
  
  // Report expiration (in days)
  REPORT_EXPIRATION_DAYS: parseInt(process.env.REPORT_EXPIRATION_DAYS || '90', 10),
  
  // Upcoming renewals window (in days)
  UPCOMING_RENEWALS_WINDOW_DAYS: parseInt(process.env.UPCOMING_RENEWALS_WINDOW_DAYS || '90', 10),
  
  // Phone number reservation (in minutes)
  PHONE_RESERVATION_MINUTES: parseInt(process.env.PHONE_RESERVATION_MINUTES || '30', 10),
} as const

// ============================================================================
// API TIMEOUTS - Request timeout configuration (in milliseconds)
// ============================================================================
export const API_TIMEOUTS = {
  // Standard API timeout
  DEFAULT_TIMEOUT_MS: parseInt(process.env.API_DEFAULT_TIMEOUT_MS || '10000', 10),
  
  // Extended timeout for complex operations
  EXTENDED_TIMEOUT_MS: parseInt(process.env.API_EXTENDED_TIMEOUT_MS || '15000', 10),
  
  // Billing operations timeout
  BILLING_TIMEOUT_MS: parseInt(process.env.BILLING_TIMEOUT_MS || '15000', 10),
  
  // CRM sync timeout
  CRM_SYNC_TIMEOUT_MS: parseInt(process.env.CRM_SYNC_TIMEOUT_MS || '10000', 10),
} as const

// ============================================================================
// RETRY CONFIGURATION - Retry and backoff settings
// ============================================================================
export const RETRY_CONFIG = {
  // Maximum retry attempts
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
  
  // Base delay for exponential backoff (in milliseconds)
  BASE_DELAY_MS: parseInt(process.env.RETRY_BASE_DELAY_MS || '3600000', 10), // 1 hour
  
  // Max delay cap for backoff
  MAX_DELAY_MS: parseInt(process.env.RETRY_MAX_DELAY_MS || '86400000', 10), // 24 hours
} as const

// ============================================================================
// LIMITS - Default limits for queries and pagination
// ============================================================================
export const DEFAULT_LIMITS = {
  // Pagination defaults
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '50', 10),
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '1000', 10),
  
  // Call history
  CALL_HISTORY_LIMIT: parseInt(process.env.CALL_HISTORY_LIMIT || '20', 10),
  
  // Activity feed
  ACTIVITY_FEED_LIMIT: parseInt(process.env.ACTIVITY_FEED_LIMIT || '100', 10),
  
  // Pending executions
  PENDING_EXECUTIONS_LIMIT: parseInt(process.env.PENDING_EXECUTIONS_LIMIT || '100', 10),
  
  // Health score history
  HEALTH_SCORE_HISTORY_LIMIT: parseInt(process.env.HEALTH_SCORE_HISTORY_LIMIT || '30', 10),
} as const

// ============================================================================
// THRESHOLDS - Business logic thresholds
// ============================================================================
export const BUSINESS_THRESHOLDS = {
  // Usage spike detection
  USAGE_SPIKE_PERCENTAGE_THRESHOLD: parseInt(process.env.USAGE_SPIKE_PERCENTAGE_THRESHOLD || '50', 10),
  USAGE_SPIKE_MIN_CONFIDENCE: parseInt(process.env.USAGE_SPIKE_MIN_CONFIDENCE || '60', 10),
  NEW_FEATURE_USAGE_CONFIDENCE: parseInt(process.env.NEW_FEATURE_USAGE_CONFIDENCE || '80', 10),
  
  // Renewal risk
  RENEWAL_RISK_THRESHOLD: parseInt(process.env.RENEWAL_RISK_THRESHOLD || '70', 10),
  
  // Billing limits
  MAX_BILLING_AMOUNT: parseInt(process.env.MAX_BILLING_AMOUNT || '1000000', 10),
  MAX_DISCOUNT_PERCENT: parseInt(process.env.MAX_DISCOUNT_PERCENT || '100', 10),
} as const

// ============================================================================
// INPUT VALIDATION - String length limits
// ============================================================================
export const INPUT_LIMITS = {
  MAX_STRING_LENGTH: parseInt(process.env.MAX_STRING_LENGTH || '10000', 10),
  MAX_CASE_ID_LENGTH: parseInt(process.env.MAX_CASE_ID_LENGTH || '100', 10),
  MAX_TITLE_LENGTH: parseInt(process.env.MAX_TITLE_LENGTH || '500', 10),
  MAX_DESCRIPTION_LENGTH: parseInt(process.env.MAX_DESCRIPTION_LENGTH || '10000', 10),
  MAX_EMAIL_LENGTH: parseInt(process.env.MAX_EMAIL_LENGTH || '255', 10),
  MAX_NAME_LENGTH: parseInt(process.env.MAX_NAME_LENGTH || '255', 10),
  MAX_REASON_LENGTH: parseInt(process.env.MAX_REASON_LENGTH || '500', 10),
} as const

// ============================================================================
// WEBSOCKET CONFIGURATION
// ============================================================================
export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL_MS: parseInt(process.env.WEBSOCKET_RECONNECT_INTERVAL_MS || '5000', 10),
  MAX_RECONNECT_ATTEMPTS: parseInt(process.env.WEBSOCKET_MAX_RECONNECT_ATTEMPTS || '10', 10),
} as const

// ============================================================================
// TWILIO DEFAULTS - Default Twilio configuration
// ============================================================================
export const TWILIO_DEFAULTS = {
  // Default WhatsApp number (Twilio sandbox number - should be overridden in production)
  DEFAULT_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
} as const

// ============================================================================
// DEVELOPMENT DEFAULTS - Only used in development mode
// ============================================================================
export const DEV_DEFAULTS = {
  // Mock CSM user for development
  MOCK_USER_ID: process.env.DEV_MOCK_USER_ID || 'user_csm_1',
  MOCK_EMAIL: process.env.DEV_MOCK_EMAIL || 'csm@example.com',
  MOCK_ROLE: process.env.DEV_MOCK_ROLE || 'csm',
  // Mock team ID should be fetched from database, not hardcoded
  // This is only used when database lookup fails in development
} as const

// ============================================================================
// HELPER FUNCTIONS - Utility functions for configuration
// ============================================================================

/**
 * Get the Twilio API URL for a specific account
 */
export function getTwilioApiUrl(accountSid: string): string {
  return `${EXTERNAL_API_URLS.TWILIO_API_URL}/Accounts/${accountSid}`
}

/**
 * Get the Twilio Messages API URL
 */
export function getTwilioMessagesUrl(accountSid: string): string {
  return `${getTwilioApiUrl(accountSid)}/Messages.json`
}

/**
 * Get the Twilio Calls API URL
 */
export function getTwilioCallsUrl(accountSid: string): string {
  return `${getTwilioApiUrl(accountSid)}/Calls.json`
}

/**
 * Calculate date from now with offset in days
 */
export function getDateFromNow(daysOffset: number): Date {
  return new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000)
}

/**
 * Calculate date in the past with offset in days
 */
export function getDateInPast(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
}

/**
 * Get default analytics period start date
 */
export function getDefaultAnalyticsPeriodStart(): Date {
  return getDateInPast(TIME_DURATIONS.DEFAULT_ANALYTICS_PERIOD_DAYS)
}

/**
 * Get upcoming renewals window date
 */
export function getUpcomingRenewalsWindowEnd(): Date {
  return getDateFromNow(TIME_DURATIONS.UPCOMING_RENEWALS_WINDOW_DAYS)
}

/**
 * Get report expiration date
 */
export function getReportExpirationDate(): Date {
  return getDateFromNow(TIME_DURATIONS.REPORT_EXPIRATION_DAYS)
}
