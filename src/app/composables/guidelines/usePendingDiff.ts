import { ref } from 'vue'

import { fetchApi } from '@/app/helpers/api'
import type { PendingContext } from '@/services/guidelines/types'

export const usePendingDiff = () => {
  const pendingContextsCount = ref(0)
  const isLoadingPending = ref(false)

  const fetchPendingContextsCount = async () => {
    try {
      isLoadingPending.value = true
      const response = await fetchApi<PendingContext[]>(
        '/api/guidelines-diff/contexts',
      )
      pendingContextsCount.value = response.length
    } catch (error) {
      console.error('Error fetching pending contexts:', error)
      pendingContextsCount.value = 0
    } finally {
      isLoadingPending.value = false
    }
  }

  return {
    pendingContextsCount,
    isLoadingPending,
    fetchPendingContextsCount,
  }
}
