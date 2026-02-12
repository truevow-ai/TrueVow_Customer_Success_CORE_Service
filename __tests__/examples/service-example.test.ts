// @ts-nocheck
/**
 * Example Service Test
 * This is a template for writing service tests
 */

import { HealthScoringService } from '@/lib/services/health-scoring'
import { createServerSupabase } from '@/lib/db/supabase'

jest.mock('@/lib/db/supabase', () => ({ createServerSupabase: jest.fn() }))
jest.mock('@/lib/repositories/tickets', () => ({ TicketRepository: { findById: jest.fn(), findByTenant: jest.fn() } }))
jest.mock('@/lib/repositories/messages', () => ({ MessageRepository: { findByTicket: jest.fn() } }))
jest.mock('@/lib/repositories/conversations', () => ({ ConversationRepository: { findByTenant: jest.fn() } }))

const chain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  upsert: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ data: null, error: null }),
}
const from = jest.fn(() => chain)

describe('HealthScoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createServerSupabase.mockReturnValue({ from })
    chain.single.mockResolvedValue({ data: null, error: null })
    jest.spyOn(HealthScoringService, 'calculateEngagementScore').mockResolvedValue(20)
    jest.spyOn(HealthScoringService, 'calculateUsageScore').mockResolvedValue(25)
    jest.spyOn(HealthScoringService, 'calculateSupportScore').mockResolvedValue(20)
    jest.spyOn(HealthScoringService, 'calculateBillingScore').mockResolvedValue(15)
    jest.spyOn(HealthScoringService, 'calculateProductFitScore').mockResolvedValue(20)
    jest.spyOn(HealthScoringService, 'calculateChurnRisk').mockResolvedValue(0.1)
    jest.spyOn(HealthScoringService, 'calculateExpansionProbability').mockResolvedValue(0.2)
    jest.spyOn(HealthScoringService, 'calculateRenewalProbability').mockResolvedValue(0.9)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('calculateHealthScore', () => {
    it('should call supabase for health score', async () => {
      const tenantId = 'test-tenant-123'
      const customerEmail = 'test@example.com'
      chain.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({
          data: {
            health_id: 'test-health-id',
            tenant_id: tenantId,
            customer_email: customerEmail,
            health_score: 75,
            health_level: 'healthy',
          },
          error: null,
        })

      jest.spyOn(HealthScoringService, 'detectSignals').mockResolvedValue(undefined)

      const result = await HealthScoringService.calculateHealthScore(tenantId, customerEmail)

      expect(result).toBeDefined()
      expect(result.health_score).toBeGreaterThanOrEqual(0)
      expect(result.health_score).toBeLessThanOrEqual(100)
      expect(from).toHaveBeenCalledWith('cs_customer_health_scores')
    })

    it('should handle errors gracefully', async () => {
      const tenantId = 'test-tenant-123'
      const customerEmail = 'test@example.com'
      chain.single.mockResolvedValue({ data: null, error: { message: 'Database error' } })

      await expect(
        HealthScoringService.calculateHealthScore(tenantId, customerEmail)
      ).rejects.toThrow()
    })
  })
})
