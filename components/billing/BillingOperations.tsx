'use client'

import { useState } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { Input } from '@/components/shared/Input'
import { Form, FormField, FormLabel } from '@/components/shared/Form'
import {
  DollarSign,
  Percent,
  CreditCard,
  Gift,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react'

interface BillingInfo {
  tenantId: string
  currentTier: string
  balance: number
  billingEmail: string
  paymentMethod: string | null
  discounts: Array<{ percent: number; reason: string }>
  credits: Array<{ amount: number; reason: string }>
}

interface BillingOperationsProps {
  tenantId: string
  ticketId?: string
  onOperationComplete?: () => void
}

export function BillingOperations({ tenantId, ticketId, onOperationComplete }: BillingOperationsProps) {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [activeOperation, setActiveOperation] = useState<string | null>(null)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form states
  const [discountPercent, setDiscountPercent] = useState('')
  const [discountReason, setDiscountReason] = useState('')
  const [newTier, setNewTier] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const fetchBillingInfo = async () => {
    try {
      setLoadingInfo(true)
      const response = await fetch(`/api/v1/billing/info?tenant_id=${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch billing info')
      
      const data = await response.json()
      setBillingInfo(data.data)
    } catch (error) {
      console.error('Error fetching billing info:', error)
    } finally {
      setLoadingInfo(false)
    }
  }

  const handleOperation = async (operation: string) => {
    try {
      setLoading(true)
      setStatus(null)

      const operationData: any = {
        operation,
        tenantId,
      }

      if (ticketId) {
        operationData.ticketId = ticketId
      }

      switch (operation) {
        case 'add_discount':
          operationData.discountPercent = parseFloat(discountPercent)
          operationData.discountReason = discountReason
          break
        case 'change_tier':
          operationData.newTier = newTier
          break
        case 'add_credit':
          operationData.creditAmount = parseFloat(creditAmount)
          operationData.creditReason = creditReason
          break
        case 'refund':
          operationData.refundAmount = parseFloat(refundAmount)
          operationData.refundReason = refundReason
          break
      }

      const response = await fetch('/api/v1/billing/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operationData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Operation failed')
      }

      const result = await response.json()
      setStatus({ type: 'success', message: result.message || 'Operation completed successfully' })
      
      // Clear form
      setDiscountPercent('')
      setDiscountReason('')
      setNewTier('')
      setCreditAmount('')
      setCreditReason('')
      setRefundAmount('')
      setRefundReason('')
      setActiveOperation(null)

      // Refresh billing info
      await fetchBillingInfo()
      onOperationComplete?.()
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Operation failed',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 lg:p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Billing Operations</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBillingInfo}
            disabled={loadingInfo}
            className="touch-manipulation"
          >
            <RefreshCw className={`h-4 w-4 ${loadingInfo ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`p-3 rounded-md flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <span className="text-sm">{status.message}</span>
          </div>
        )}

        {/* Billing Info */}
        {billingInfo && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Tier:</span>
              <Badge>{billingInfo.currentTier}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Balance:</span>
              <span className="font-semibold">${billingInfo.balance?.toFixed(2) || '0.00'}</span>
            </div>
            {billingInfo.paymentMethod && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <span className="text-sm">{billingInfo.paymentMethod}</span>
              </div>
            )}
          </div>
        )}

        {/* Operations */}
        <div className="space-y-3">
          {/* Add Discount */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Add Discount</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveOperation(activeOperation === 'discount' ? null : 'discount')}
                className="touch-manipulation"
              >
                {activeOperation === 'discount' ? 'Cancel' : 'Add'}
              </Button>
            </div>
            {activeOperation === 'discount' && (
              <div className="space-y-3 mt-3">
                <FormField>
                  <FormLabel>Discount Percent (0-100)</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="10.5"
                    className="touch-manipulation"
                  />
                </FormField>
                <FormField>
                  <FormLabel>Reason</FormLabel>
                  <Input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Customer retention discount"
                    maxLength={500}
                    className="touch-manipulation"
                  />
                </FormField>
                <Button
                  onClick={() => handleOperation('add_discount')}
                  disabled={loading || !discountPercent || !discountReason}
                  className="w-full touch-manipulation min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Percent className="h-4 w-4 mr-2" />
                      Apply Discount
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Change Tier */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Change Pricing Tier</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveOperation(activeOperation === 'tier' ? null : 'tier')}
                className="touch-manipulation"
              >
                {activeOperation === 'tier' ? 'Cancel' : 'Change'}
              </Button>
            </div>
            {activeOperation === 'tier' && (
              <div className="space-y-3 mt-3">
                <FormField>
                  <FormLabel>New Tier</FormLabel>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm touch-manipulation"
                  >
                    <option value="">Select tier...</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </FormField>
                <Button
                  onClick={() => handleOperation('change_tier')}
                  disabled={loading || !newTier}
                  className="w-full touch-manipulation min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Change Tier
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Add Credit */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Add Credit</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveOperation(activeOperation === 'credit' ? null : 'credit')}
                className="touch-manipulation"
              >
                {activeOperation === 'credit' ? 'Cancel' : 'Add'}
              </Button>
            </div>
            {activeOperation === 'credit' && (
              <div className="space-y-3 mt-3">
                <FormField>
                  <FormLabel>Credit Amount ($)</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="100.00"
                    className="touch-manipulation"
                  />
                </FormField>
                <FormField>
                  <FormLabel>Reason</FormLabel>
                  <Input
                    type="text"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="Service credit for downtime"
                    maxLength={500}
                    className="touch-manipulation"
                  />
                </FormField>
                <Button
                  onClick={() => handleOperation('add_credit')}
                  disabled={loading || !creditAmount || !creditReason}
                  className="w-full touch-manipulation min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Add Credit
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Refund */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Process Refund</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveOperation(activeOperation === 'refund' ? null : 'refund')}
                className="touch-manipulation"
              >
                {activeOperation === 'refund' ? 'Cancel' : 'Refund'}
              </Button>
            </div>
            {activeOperation === 'refund' && (
              <div className="space-y-3 mt-3">
                <FormField>
                  <FormLabel>Refund Amount ($)</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="50.00"
                    className="touch-manipulation"
                  />
                </FormField>
                <FormField>
                  <FormLabel>Reason</FormLabel>
                  <Input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Refund for cancelled service"
                    maxLength={500}
                    className="touch-manipulation"
                  />
                </FormField>
                <Button
                  onClick={() => handleOperation('refund')}
                  disabled={loading || !refundAmount || !refundReason}
                  className="w-full touch-manipulation min-h-[44px] bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Refund
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          <strong>Security:</strong> All billing operations are logged and require authorization. Only CSM, Head of CS, and Support Managers can modify billing.
        </div>
      </div>
    </Card>
  )
}
