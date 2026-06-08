/**
 * Tag Sync Service
 * 
 * Integrates CS CORE with Internal Ops Centralized Tag Management.
 * 
 * Architecture:
 * - Internal Ops owns the canonical tag dictionary
 * - CS CORE syncs tags on startup
 * - CS CORE records assignments to Internal Ops (async)
 * - CS CORE subscribes to tag updates
 */

// ============================================================
// TYPES
// ============================================================

export interface Tag {
  slug: string
  name: string
  description: string | null
  color: string
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TagAssignment {
  tag_slug: string
  entity_type: string
  entity_id: string
  source_service: string
  assigned_by: string | null
  assigned_at: string
}

export interface TagSubscriber {
  service_name: string
  sync_url: string
  subscribed_categories: string[]
  last_sync_at: string | null
  is_active: boolean
}

export interface SyncResponse {
  tags: Tag[]
  sync_token: string
  synced_at: string
}

export interface SubscribeRequest {
  service_name: string
  sync_url: string
  subscribed_categories: string[]
}

export interface AssignmentRequest {
  tag_slug: string
  entity_type: string
  entity_id: string
  source_service: string
  assigned_by?: string
}

// ============================================================
// CONFIGURATION
// ============================================================

const INTERNAL_OPS_URL = process.env.INTERNAL_OPS_SERVICE_URL || process.env.INTERNAL_OPS_URL || 'http://localhost:3006'
const INTERNAL_OPS_API_KEY = process.env.INTERNAL_OPS_SERVICE_API_KEY || process.env.INTERNAL_OPS_API_KEY || process.env.SERVICE_REGISTRY_API_KEY || ''
const SERVICE_NAME = process.env.SERVICE_NAME || 'cs-core'

// Categories CS CORE is interested in
const CS_CORE_TAG_CATEGORIES = ['cs', 'compliance', 'agent']

// ============================================================
// TAG SYNC CLIENT
// ============================================================

class TagSyncClient {
  private tags: Map<string, Tag> = new Map()
  private syncToken: string | null = null
  private lastSyncAt: Date | null = null
  private isSubscribed: boolean = false

  /**
   * Subscribe to Internal Ops tag updates
   */
  async subscribe(): Promise<boolean> {
    try {
      const syncUrl = `${process.env.SERVICE_HOST || `http://localhost:${process.env.SERVICE_PORT || 3061}`}/api/v1/tags/sync`
      
      const response = await fetch(`${INTERNAL_OPS_URL}/api/v1/tags/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-API-Key': INTERNAL_OPS_API_KEY,
        },
        body: JSON.stringify({
          service_name: SERVICE_NAME,
          sync_url: syncUrl,
          subscribed_categories: CS_CORE_TAG_CATEGORIES,
        } as SubscribeRequest),
      })

      if (!response.ok) {
        console.error(`[TagSync] Subscribe failed: ${response.status}`)
        return false
      }

      this.isSubscribed = true
      console.log(`[TagSync] Subscribed to categories: ${CS_CORE_TAG_CATEGORIES.join(', ')}`)
      return true
    } catch (error) {
      console.error('[TagSync] Subscribe error:', error)
      return false
    }
  }

  /**
   * Pull all tags from Internal Ops (full sync)
   */
  async sync(): Promise<Tag[]> {
    try {
      const params = new URLSearchParams({
        service_name: SERVICE_NAME,
        categories: CS_CORE_TAG_CATEGORIES.join(','),
      })

      const response = await fetch(`${INTERNAL_OPS_URL}/api/v1/tags/sync?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-API-Key': INTERNAL_OPS_API_KEY,
        },
      })

      if (!response.ok) {
        console.error(`[TagSync] Sync failed: ${response.status}`)
        return []
      }

      const data: SyncResponse = await response.json()
      
      // Update local cache
      this.tags.clear()
      for (const tag of data.tags) {
        this.tags.set(tag.slug, tag)
      }
      this.syncToken = data.sync_token
      this.lastSyncAt = new Date(data.synced_at)

      console.log(`[TagSync] Synced ${data.tags.length} tags from Internal Ops`)
      return data.tags
    } catch (error) {
      console.error('[TagSync] Sync error:', error)
      return []
    }
  }

  /**
   * Get all cached tags
   */
  getTags(): Tag[] {
    return Array.from(this.tags.values())
  }

  /**
   * Get tags by category
   */
  getTagsByCategory(category: string): Tag[] {
    return this.getTags().filter(tag => tag.category === category)
  }

  /**
   * Get a specific tag by slug
   */
  getTag(slug: string): Tag | undefined {
    return this.tags.get(slug)
  }

  /**
   * Record a tag assignment to Internal Ops
   */
  async recordAssignment(
    tagSlug: string,
    entityType: string,
    entityId: string,
    assignedBy?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${INTERNAL_OPS_URL}/api/v1/tags/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-API-Key': INTERNAL_OPS_API_KEY,
        },
        body: JSON.stringify({
          tag_slug: tagSlug,
          entity_type: entityType,
          entity_id: entityId,
          source_service: SERVICE_NAME,
          assigned_by: assignedBy,
        } as AssignmentRequest),
      })

      if (!response.ok) {
        console.error(`[TagSync] Assignment failed: ${response.status}`)
        return false
      }

      console.log(`[TagSync] Recorded assignment: ${tagSlug} → ${entityType}:${entityId}`)
      return true
    } catch (error) {
      console.error('[TagSync] Assignment error:', error)
      return false
    }
  }

  /**
   * Remove a tag assignment from Internal Ops
   */
  async removeAssignment(
    tagSlug: string,
    entityType: string,
    entityId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${INTERNAL_OPS_URL}/api/v1/tags/assignments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-API-Key': INTERNAL_OPS_API_KEY,
        },
        body: JSON.stringify({
          tag_slug: tagSlug,
          entity_type: entityType,
          entity_id: entityId,
          source_service: SERVICE_NAME,
        }),
      })

      if (!response.ok) {
        console.error(`[TagSync] Remove assignment failed: ${response.status}`)
        return false
      }

      console.log(`[TagSync] Removed assignment: ${tagSlug} → ${entityType}:${entityId}`)
      return true
    } catch (error) {
      console.error('[TagSync] Remove assignment error:', error)
      return false
    }
  }

  /**
   * Get all assignments for a tag (cross-service view)
   */
  async getTagAssignments(tagSlug: string): Promise<TagAssignment[]> {
    try {
      const response = await fetch(`${INTERNAL_OPS_URL}/api/v1/tags/${tagSlug}/assignments`, {
        headers: {
          'X-Internal-API-Key': INTERNAL_OPS_API_KEY,
        },
      })

      if (!response.ok) {
        console.error(`[TagSync] Get assignments failed: ${response.status}`)
        return []
      }

      return await response.json()
    } catch (error) {
      console.error('[TagSync] Get assignments error:', error)
      return []
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncAt(): Date | null {
    return this.lastSyncAt
  }

  /**
   * Check if subscribed
   */
  getIsSubscribed(): boolean {
    return this.isSubscribed
  }
}

// Singleton instance
export const tagSyncClient = new TagSyncClient()

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Initialize tag sync on startup
 * Called from instrumentation.ts
 */
export async function initializeTagSync(): Promise<void> {
  console.log('[TagSync] Initializing...')
  
  // 1. Subscribe to updates
  await tagSyncClient.subscribe()
  
  // 2. Pull all tags
  await tagSyncClient.sync()
  
  console.log('[TagSync] Initialization complete')
}

/**
 * Quick helper to tag a customer
 */
export async function tagCustomer(
  customerId: string,
  tagSlug: string,
  assignedBy?: string
): Promise<boolean> {
  return tagSyncClient.recordAssignment(tagSlug, 'customer', customerId, assignedBy)
}

/**
 * Quick helper to tag a ticket
 */
export async function tagTicket(
  ticketId: string,
  tagSlug: string,
  assignedBy?: string
): Promise<boolean> {
  return tagSyncClient.recordAssignment(tagSlug, 'ticket', ticketId, assignedBy)
}

/**
 * Quick helper to tag a conversation
 */
export async function tagConversation(
  conversationId: string,
  tagSlug: string,
  assignedBy?: string
): Promise<boolean> {
  return tagSyncClient.recordAssignment(tagSlug, 'conversation', conversationId, assignedBy)
}

/**
 * Quick helper to untag an entity
 */
export async function untagEntity(
  tagSlug: string,
  entityType: string,
  entityId: string
): Promise<boolean> {
  return tagSyncClient.removeAssignment(tagSlug, entityType, entityId)
}
