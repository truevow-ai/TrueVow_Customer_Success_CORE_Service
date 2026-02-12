/**
 * Optimistic UI Updates Utility
 * 
 * Update UI immediately, rollback on error
 * Pattern used by: Twitter, Linear, Notion
 * Benefit: Perceived performance improvement
 */

export interface OptimisticUpdateOptions<T> {
  currentData: T
  updateFn: (data: T) => T
  apiCall: () => Promise<any>
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
  rollbackFn?: (data: T) => T
}

/**
 * Perform an optimistic update
 * 
 * @example
 * await optimisticUpdate({
 *   currentData: items,
 *   updateFn: (data) => data.map(item => 
 *     item.id === id ? { ...item, active: !item.active } : item
 *   ),
 *   apiCall: () => updateItem(id),
 *   onSuccess: () => showToast({ type: 'success', title: 'Updated' }),
 *   onError: (error) => showToast({ type: 'error', title: error.message }),
 * })
 */
export async function optimisticUpdate<T>({
  currentData,
  updateFn,
  apiCall,
  onSuccess,
  onError,
  rollbackFn,
}: OptimisticUpdateOptions<T>): Promise<T> {
  // Store original data for rollback
  const originalData = currentData

  // Optimistically update UI immediately
  let optimisticData: T
  try {
    optimisticData = updateFn(currentData)
  } catch (error) {
    console.error('Error in optimistic update function:', error)
    throw error
  }

  // Perform API call
  try {
    const result = await apiCall()
    
    // Success - call success callback
    onSuccess?.(result)
    
    // Return optimistic data (which should match server state)
    return optimisticData
  } catch (error) {
    // Error - rollback to original data
    console.error('API call failed, rolling back optimistic update:', error)
    
    const rolledBackData = rollbackFn 
      ? rollbackFn(optimisticData)
      : originalData
    
    // Call error callback
    onError?.(error as Error)
    
    // Return rolled back data
    return rolledBackData
  }
}

/**
 * Batch optimistic updates
 * 
 * @example
 * await batchOptimisticUpdate({
 *   currentData: items,
 *   updates: [
 *     { id: '1', updateFn: (item) => ({ ...item, status: 'active' }) },
 *     { id: '2', updateFn: (item) => ({ ...item, status: 'inactive' }) },
 *   ],
 *   apiCall: () => batchUpdateItems(updates),
 * })
 */
export interface BatchOptimisticUpdateOptions<T> {
  currentData: T[]
  updates: Array<{
    id: string | number
    updateFn: (item: T) => T
  }>
  apiCall: () => Promise<any>
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
}

export async function batchOptimisticUpdate<T extends { id: string | number }>({
  currentData,
  updates,
  apiCall,
  onSuccess,
  onError,
}: BatchOptimisticUpdateOptions<T>): Promise<T[]> {
  const originalData = [...currentData]
  const updateMap = new Map(updates.map(u => [u.id, u.updateFn]))

  // Optimistically update all items
  const optimisticData = currentData.map(item => {
    const updateFn = updateMap.get(item.id)
    return updateFn ? updateFn(item) : item
  })

  try {
    const result = await apiCall()
    onSuccess?.(result)
    return optimisticData
  } catch (error) {
    console.error('Batch API call failed, rolling back:', error)
    onError?.(error as Error)
    return originalData
  }
}
