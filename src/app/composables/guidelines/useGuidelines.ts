import { ref, watch } from 'vue'

import { fetchApi } from '@/app/helpers/api'
import type { Guideline } from '@/services/guidelines'

export function useGuidelines() {
  // UI State
  const showCreateDialog = ref(false)
  const showEditDialog = ref(false)
  const showDeleteDialog = ref(false)
  const selectedContext = ref('')
  const repositoryId = ref<number | null>(null)

  // Data State
  const guidelines = ref<Guideline[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const updatingId = ref<number | null>(null)
  const selectedGuideline = ref<Guideline | null>(null)
  const selectedGuidelines = ref<Guideline[]>([])
  const selectionsByContext = ref<Record<string, number[]>>({})
  const editedContent = ref('')
  const newGuidelineContent = ref('')
  const contextForNew = ref('')

  // Methods
  const fetchGuidelines = async (repoId: number | null, context: string) => {
    if (repoId === null || repoId === undefined) {
      guidelines.value = []
      return
    }

    isLoading.value = true
    error.value = null
    try {
      const newGuidelines = await fetchApi<Guideline[]>(
        `/api/guidelines?repositoryId=${repoId}&context=${context}`,
      )
      guidelines.value = newGuidelines

      // Restore selections for this context
      if (selectionsByContext.value[context]) {
        selectedGuidelines.value = newGuidelines.filter((g) =>
          selectionsByContext.value[context].includes(g.id),
        )
      } else {
        selectedGuidelines.value = []
      }
    } catch (err: any) {
      console.error('Error fetching guidelines:', err)
      error.value = `Error fetching guidelines: ${err.message || 'Unknown error'}`
      guidelines.value = []
    } finally {
      isLoading.value = false
    }
  }

  const createGuideline = async () => {
    error.value = null
    try {
      const created = await fetchApi<Guideline>('/api/guidelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newGuidelineContent.value,
          context: contextForNew.value || selectedContext.value,
          repositoryId: repositoryId.value,
        }),
      })
      guidelines.value = [...guidelines.value, created].sort(
        (a, b) => a.id - b.id,
      )
      showCreateDialog.value = false
      newGuidelineContent.value = ''
      return created
    } catch (err: any) {
      console.error('Error creating guideline:', err)
      error.value = `Error creating guideline: ${err.message || 'Unknown error'}`
      throw err
    }
  }

  const updateState = async (id: number, newState: boolean) => {
    updatingId.value = id
    error.value = null
    try {
      const updated = await fetchApi<Guideline>(`/api/guidelines/${id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState }),
      })
      const index = guidelines.value.findIndex((g) => g.id === id)
      if (index !== -1) {
        guidelines.value[index] = updated
      }
      return updated
    } catch (err: any) {
      console.error('Error updating state:', err)
      error.value = `Error updating state: ${err.message || 'Unknown error'}`
      throw err
    } finally {
      updatingId.value = null
    }
  }

  const updateGuideline = async () => {
    if (!selectedGuideline.value) return

    error.value = null
    try {
      const updated = await fetchApi<Guideline>(
        `/api/guidelines/${selectedGuideline.value.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editedContent.value }),
        },
      )
      const index = guidelines.value.findIndex(
        (g) => g.id === selectedGuideline.value?.id,
      )
      if (index !== -1) {
        guidelines.value[index] = updated
      }
      showEditDialog.value = false
      return updated
    } catch (err: any) {
      console.error('Error updating guideline:', err)
      error.value = `Error updating guideline: ${err.message || 'Unknown error'}`
      throw err
    }
  }

  const bulkUpdateState = async (ids: number[], active: boolean) => {
    error.value = null
    try {
      const updated = await fetchApi<Guideline[]>(
        '/api/guidelines/bulk/state',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, active }),
        },
      )

      // Update guidelines in place
      updated.forEach((updatedGuideline) => {
        const index = guidelines.value.findIndex(
          (g) => g.id === updatedGuideline.id,
        )
        if (index !== -1) {
          guidelines.value[index] = updatedGuideline
        }
      })

      selectedGuidelines.value = []
      if (selectedContext.value) {
        selectionsByContext.value[selectedContext.value] = []
      }
      return updated
    } catch (err: any) {
      console.error('Error updating guidelines state:', err)
      error.value = `Error updating guidelines state: ${err.message || 'Unknown error'}`
      throw err
    }
  }

  const bulkDelete = async (ids: number[]) => {
    error.value = null
    try {
      await fetchApi('/api/guidelines/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      guidelines.value = guidelines.value.filter((g) => !ids.includes(g.id))
      selectedGuidelines.value = []
      if (selectedContext.value) {
        selectionsByContext.value[selectedContext.value] = []
      }
    } catch (err: any) {
      console.error('Error deleting guidelines:', err)
      error.value = `Error deleting guidelines: ${err.message || 'Unknown error'}`
      throw err
    }
  }

  const deleteGuideline = async () => {
    if (!selectedGuideline.value) return

    error.value = null
    try {
      await fetchApi(`/api/guidelines/${selectedGuideline.value.id}`, {
        method: 'DELETE',
      })
      guidelines.value = guidelines.value.filter(
        (g) => g.id !== selectedGuideline.value?.id,
      )
      showDeleteDialog.value = false
      if (selectedContext.value && selectedGuideline.value) {
        // Remove from context selections if present
        selectionsByContext.value[selectedContext.value] = (
          selectionsByContext.value[selectedContext.value] || []
        ).filter((id) => id !== selectedGuideline.value?.id)
      }
    } catch (err: any) {
      console.error('Error deleting guideline:', err)
      error.value = `Error deleting guideline: ${err.message || 'Unknown error'}`
      throw err
    }
  }

  const refetchGuidelines = async () => {
    if (repositoryId.value && selectedContext.value) {
      await fetchGuidelines(repositoryId.value, selectedContext.value)
    }
  }

  // Watchers
  // Watch for selection changes to update context-specific selections
  watch(selectedGuidelines, (newSelection) => {
    if (selectedContext.value) {
      selectionsByContext.value[selectedContext.value] = newSelection.map(
        (g) => g.id,
      )
    }
  })

  watch(
    [repositoryId, selectedContext],
    ([newRepoId, newContext]: [number | null, string]) => {
      if (newRepoId && newContext) {
        fetchGuidelines(newRepoId, newContext)
      }
    },
    { immediate: true },
  )

  watch(
    selectedContext,
    (newContext) => {
      contextForNew.value = newContext
    },
    { immediate: true },
  )

  return {
    // UI State
    showCreateDialog,
    showEditDialog,
    showDeleteDialog,
    selectedContext,
    repositoryId,
    selectedGuideline,
    editedContent,
    newGuidelineContent,
    contextForNew,

    // Data State
    guidelines,
    isLoading,
    error,
    updatingId,

    // Methods
    fetchGuidelines,
    createGuideline,
    updateState,
    updateGuideline,
    deleteGuideline,
    refetchGuidelines,
    bulkUpdateState,
    bulkDelete,
    selectedGuidelines,
  }
}

export const guidelinesState = useGuidelines()
