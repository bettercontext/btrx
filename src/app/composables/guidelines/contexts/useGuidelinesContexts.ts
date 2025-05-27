import { ref } from 'vue'

import { useToast } from 'primevue/usetoast'

import { guidelinesState } from '@/app/composables/guidelines/useGuidelines'
import { useRepositoryContext } from '@/app/composables/useRepositoryContext'
import { fetchApi } from '@/app/helpers/api'
import type { GuidelinesContext } from '@/services/guidelines'

export interface NewGuidelinesContext {
  name: string
  prompt: string
  repositoryPath?: string
  repositoryId?: number
}

export function useGuidelinesContexts() {
  const contexts = ref<GuidelinesContext[]>([])
  const isLoadingContexts = ref(false)
  const toast = useToast()
  const { gitOriginUrl, repositoryId: repoIdRef } = useRepositoryContext()

  const fetchContexts = async (
    repositoryPath: string | null,
    forceReload = false,
  ) => {
    if (!repositoryPath) {
      contexts.value = []
      return contexts.value
    }

    if (isLoadingContexts.value) {
      await new Promise((resolve) => {
        const checkLoading = () => {
          if (!isLoadingContexts.value) {
            resolve(true)
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
      return contexts.value
    }

    // Skip loading if we have contexts and no force reload
    if (contexts.value.length > 0 && !forceReload) {
      return contexts.value
    }

    isLoadingContexts.value = true
    try {
      const params = new URLSearchParams()
      params.append('repositoryPath', repositoryPath)
      if (gitOriginUrl.value) {
        params.append('gitOriginUrl', gitOriginUrl.value)
      }

      const response = await fetchApi<{
        contexts: GuidelinesContext[]
        repositoryId: number
      }>(`/api/guidelines-contexts?${params}`)

      // Update state when contexts exist
      if (response.contexts.length > 0) {
        repoIdRef.value = response.repositoryId
        guidelinesState.repositoryId.value = response.repositoryId
      }

      contexts.value = response.contexts
      return response.contexts
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 3000,
      })
      throw error
    } finally {
      isLoadingContexts.value = false
    }
  }

  const createContext = async (context: NewGuidelinesContext) => {
    if (!context.repositoryPath) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Repository path is required',
        life: 3000,
      })
      return false
    }

    try {
      const params = new URLSearchParams()
      params.append('repositoryPath', context.repositoryPath)
      if (gitOriginUrl.value) {
        params.append('gitOriginUrl', gitOriginUrl.value)
      }

      // First fetch/create repository ID
      const { id: repoId } = await fetchApi<{ id: number }>(
        `/api/repositories?${params}`,
      )

      // Update repository states
      repoIdRef.value = repoId
      guidelinesState.repositoryId.value = repoId

      // Then create the context with repository ID
      await fetchApi('/api/guidelines-contexts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...context,
          repositoryId: repoId,
          gitOriginUrl: gitOriginUrl.value,
        }),
      })

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Context created successfully',
        life: 3000,
      })

      return true
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 3000,
      })
      return false
    }
  }

  const updateContext = async (id: number, context: NewGuidelinesContext) => {
    try {
      await fetchApi(`/api/guidelines-contexts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      })

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Context updated successfully',
        life: 3000,
      })

      return true
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 3000,
      })
      return false
    }
  }

  const deleteContext = async (id: number) => {
    try {
      await fetchApi(`/api/guidelines-contexts/${id}`, {
        method: 'DELETE',
      })

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Context deleted successfully',
        life: 3000,
      })

      return true
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 3000,
      })
      return false
    }
  }

  return {
    contexts,
    isLoadingContexts,
    fetchContexts,
    createContext,
    updateContext,
    deleteContext,
  }
}
