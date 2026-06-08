/**
 * Security Module Exports
 * 
 * Provides scope-aware authentication and authorization for TrueVow microservices.
 */

// JWT Claims
export {
  type JWTClaims,
  type InternalJWTClaims,
  type TenantJWTClaims,
  type RawClerkClaims,
  type AuthScope,
  type InternalRole,
  type TenantRole,
  type InternalFunction,
  JWTValidationError,
  validateJWTClaims,
  getJWTClaims,
  isInternalClaims,
  isTenantClaims,
} from './jwt-claims'

// Authorization
export {
  type BaseUserContext,
  type UserContext,
  InternalUserContext,
  TenantUserContext,
  Permission,
  TenantPermission,
  getUserContext,
  requireAuth,
  requireInternalUser,
  requireTenantUser,
  requireInternalPermission,
  requireTenantPermission,
  withAuth,
  withInternalAuth,
  withTenantAuth,
  withInternalPermission,
  withTenantPermission,
} from './authorization'
