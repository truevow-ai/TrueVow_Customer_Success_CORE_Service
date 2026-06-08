// @ts-nocheck
/**
 * Example Service Test
 * This is a template for writing service tests
 *
 * ARCHITECTURAL NOTE:
 * HealthScoringService is now a PROXY LAYER to SaaS Admin.
 * CS Core does NOT compute health scores locally.
 * Tests should mock the intelligence client, not local computation methods.
 */

import { HealthScoringService } from '@/lib/services/health-scoring'
import * as intelligenceClient from '@/lib/intelligence/client'

// Mock the intelligence client
jest.mock('@/lib/intelligence/client', () => ({
  getHealthScore: jest.fn(),
  calculateHealthScore: jest.fn(),
  getHealthScoreHistory: jest.fn(),
  getHealthSignals: jest.fn(),
}))

describe('HealthScoringService (Proxy Layer)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getHealthScore', () => {
    it('should proxy to SaaS Admin for health score', async () => {
      const tenantId = 'test-tenant-123'
      const customerEmail = 'test@example.com'
      const mockHealthScore = {
        health_id: 'test-health-id',
        tenant_id: tenantId,
        customer_email: customerEmail,
        health_score: 75,
        health_level: 'healthy',
        engagement_score: 70,
        usage_score: 80,
        support_score: 75,
        billing_score: 85,
        product_fit_score: 70,
        churn_risk: 25,
        expansion_probability: 60,
        renewal_probability: 80,
        score_trend: 'stable',
        recommended_actions: [],
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      ;(intelligenceClient.getHealthScore as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockHealthScore,
      })

      const result = await HealthScoringService.getHealthScore(tenantId, customerEmail)

      expect(intelligenceClient.getHealthScore).toHaveBeenCalledWith(tenantId, customerEmail)
      expect(result).toEqual(mockHealthScore)
    })

    it('should return null when SaaS Admin returns 404', async () => {
      const tenantId = 'test-tenant-123'
      const customerEmail = 'notfound@example.com'

      ;(intelligenceClient.getHealthScore as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      })

      const result = await HealthScoringService.getHealthScore(tenantId, customerEmail)

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      const tenantId = 'test-tenant-123'
      const customerEmail = 'test@example.com'

      ;(intelligenceClient.getHealthScore as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await HealthScoringService.getHealthScore(tenantId, customerEmail)

      expect(result).toBeNull()
    })
  })

  describe('calculateHealthScore', () => {
    it('should proxy to SaaS Admin for health score calculation', async () => {
      const tenantId = 'test-tenant-123'
      const customerEmail = 'test@example.com'
      const mockHealthScore = {
        health_id: 'test-health-id',
        tenant_id: tenantId,
        customer_email: customerEmail,
        health_score: 85,
        health_level: 'healthy',
      }

      ;(intelligenceClient.getHealthScore as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockHealthScore,
      })

      const result = await HealthScoringService.calculateHealthScore(tenantId, customerEmail)

      expect(intelligenceClient.getHealthScore).toHaveBeenCalledWith(tenantId, customerEmail)
      expect(result).toEqual(mockHealthScore)
    })

    it('should throw when SaaS Admin returns error', async () => {
      const tenantId = 'test-tenant-123'
      const customerEmail = 'test@example.com'

      ;(intelligenceClient.getHealthScore as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      })

      await expect(
        HealthScoringService.calculateHealthScore(tenantId, customerEmail)
      ).rejects.toThrow('Failed to fetch health score from SaaS Admin')
    })
  })

  describe('Architectural Boundaries', () => {
    it('should NOT have local computation methods', () => {
      // These methods should NOT exist anymore (they were moved to SaaS Admin)
      expect((HealthScoringService as any).calculateEngagementScore).toBeUndefined()
      expect((HealthScoringService as any).calculateUsageScore).toBeUndefined()
      expect((HealthScoringService as any).calculateSupportScore).toBeUndefined()
      expect((HealthScoringService as any).calculateBillingScore).toBeUndefined()
      expect((HealthScoringService as any).calculateProductFitScore).toBeUndefined()
      expect((HealthScoringService as any).calculateChurnRisk).toBeUndefined()
      expect((HealthScoringService as any).calculateExpansionProbability).toBeUndefined()
      expect((HealthScoringService as any).calculateRenewalProbability).toBeUndefined()
      expect((HealthScoringService as any).determineHealthLevel).toBeUndefined()
      expect((HealthScoringService as any).determineTrend).toBeUndefined()
      expect((HealthScoringService as any).generateRecommendedActions).toBeUndefined()
      expect((HealthScoringService as any).detectSignals).toBeUndefined()
    })

    it('should have proxy methods that call SaaS Admin', () => {
      // These methods should exist and proxy to SaaS Admin
      expect(typeof HealthScoringService.getHealthScore).toBe('function')
      expect(typeof HealthScoringService.calculateHealthScore).toBe('function')
      expect(typeof HealthScoringService.getHealthScoreHistory).toBe('function')
      expect(typeof HealthScoringService.getRecentSignals).toBe('function')
    })
  })
})
