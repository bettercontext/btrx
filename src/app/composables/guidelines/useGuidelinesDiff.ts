import { ref } from 'vue'

import { fetchApi } from '@/app/helpers/api'
import type { DiffData, PendingContext } from '@/services/guidelines/types'

import { guidelinesState } from './useGuidelines'

export function useGuidelinesDiff() {
  const diffDataByContext = ref<Record<number, DiffData>>({})
  const contextsWithPending = ref<PendingContext[]>([])
  const isLoadingDiff = ref(false)
  const diffError = ref<string | null>(null)

  const fetchContextsWithPending = async () => {
    try {
      const response = await fetchApi<PendingContext[]>(
        '/api/guidelines-diff/contexts',
      )
      contextsWithPending.value = response
      return response
    } catch (error) {
      console.error('Error fetching contexts with pending changes:', error)
      contextsWithPending.value = []
      return []
    }
  }

  const fetchDiffData = async (contextId: number) => {
    if (diffDataByContext.value[contextId]) {
      return diffDataByContext.value[contextId]
    }

    try {
      isLoadingDiff.value = true
      diffError.value = null
      const response = await fetchApi<DiffData>(
        `/api/guidelines-diff/${contextId}`,
      )
      diffDataByContext.value[contextId] = response
      return response
    } catch (error) {
      console.error(`Error fetching diff for context ${contextId}:`, error)
      diffError.value = 'Failed to load diff data'
      throw error
    } finally {
      isLoadingDiff.value = false
    }
  }

  const validatePending = async (contextId: number) => {
    try {
      await fetchApi(`/api/guidelines-diff/${contextId}/validate`, {
        method: 'POST',
      })

      // Remove diff data from cache since it's no longer pending
      const { [contextId]: _, ...remaining } = diffDataByContext.value
      diffDataByContext.value = remaining

      // Refresh contexts
      await fetchContextsWithPending()

      // Refresh guidelines to get updated data
      await guidelinesState.refetchGuidelines()

      return true
    } catch (error) {
      console.error(
        `Error validating pending changes for context ${contextId}:`,
        error,
      )
      diffError.value = 'Failed to validate changes'
      throw error
    }
  }

  const cancelPending = async (contextId: number) => {
    try {
      await fetchApi(`/api/guidelines-diff/${contextId}/cancel`, {
        method: 'POST',
      })

      // Remove diff data from cache since it's cancelled
      const { [contextId]: _, ...remaining } = diffDataByContext.value
      diffDataByContext.value = remaining

      // Refresh contexts
      await fetchContextsWithPending()

      // Refresh guidelines to get updated data
      await guidelinesState.refetchGuidelines()

      return true
    } catch (error) {
      console.error(
        `Error cancelling pending changes for context ${contextId}:`,
        error,
      )
      diffError.value = 'Failed to cancel changes'
      throw error
    }
  }

  const getDiffRows = (contextId: number) => {
    const diffData = diffDataByContext.value[contextId]
    if (!diffData || !diffData.diff) return []

    const rows: { id: number; type: string; content: string }[] = []
    let idCounter = 0

    diffData.diff.forEach((part) => {
      // part.value is now an array of guidelines from diffArrays
      const guidelines = Array.isArray(part.value) ? part.value : [part.value]

      guidelines.forEach((guideline: string) => {
        // Keep each guideline as a single row, preserving multi-line content
        if (guideline.trim() !== '') {
          if (part.added) {
            rows.push({ id: idCounter++, type: 'added', content: guideline })
          } else if (part.removed) {
            rows.push({ id: idCounter++, type: 'removed', content: guideline })
          } else {
            rows.push({
              id: idCounter++,
              type: 'unchanged',
              content: guideline,
            })
          }
        }
      })
    })

    return rows
  }

  const getContextById = (contextId: number) => {
    return contextsWithPending.value.find((ctx) => ctx.id === contextId)
  }

  return {
    diffDataByContext,
    contextsWithPending,
    isLoadingDiff,
    diffError,
    fetchContextsWithPending,
    fetchDiffData,
    validatePending,
    cancelPending,
    getDiffRows,
    getContextById,
  }
}

export const guidelinesDiffState = useGuidelinesDiff()
