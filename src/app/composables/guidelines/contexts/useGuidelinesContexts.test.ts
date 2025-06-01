import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@/app/helpers/api'

import { useGuidelinesContexts } from './useGuidelinesContexts'

vi.mock('@/app/helpers/api', () => ({
  fetchApi: vi.fn(),
}))

const mockToast = {
  add: vi.fn(),
}

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast,
}))

describe('useGuidelinesContexts', () => {
  const mockContext = {
    id: 1,
    name: 'Test Context',
    prompt: 'Test prompt',
    repositoryId: 1,
  }

  const mockRepositoryPath = '/test/path'

  beforeEach(() => {
    vi.mocked(api.fetchApi).mockReset()
    mockToast.add.mockReset()
  })

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { contexts, isLoadingContexts } = useGuidelinesContexts()

      expect(contexts.value).toEqual([])
      expect(isLoadingContexts.value).toBe(false)
    })
  })

  describe('fetchContexts', () => {
    it('should return empty array if no repository path provided', async () => {
      const { contexts, fetchContexts } = useGuidelinesContexts()
      await fetchContexts(null)

      expect(contexts.value).toEqual([])
      expect(api.fetchApi).not.toHaveBeenCalled()
    })

    it('should fetch contexts successfully', async () => {
      const mockContexts = [mockContext]
      vi.mocked(api.fetchApi).mockResolvedValueOnce({
        contexts: mockContexts,
        repositoryId: 1,
      })

      const { contexts, isLoadingContexts, fetchContexts } =
        useGuidelinesContexts()
      await fetchContexts(mockRepositoryPath)

      expect(api.fetchApi).toHaveBeenCalledWith(
        `/api/guidelines-contexts?repositoryPath=${encodeURIComponent(mockRepositoryPath)}`,
      )
      expect(contexts.value).toEqual(mockContexts)
      expect(isLoadingContexts.value).toBe(false)
    })

    it('should skip loading if contexts exist and no force reload', async () => {
      const mockContexts = [mockContext]
      const { contexts, fetchContexts } = useGuidelinesContexts()
      contexts.value = mockContexts

      await fetchContexts(mockRepositoryPath)

      expect(api.fetchApi).not.toHaveBeenCalled()
      expect(contexts.value).toEqual(mockContexts)
    })

    it('should force reload when requested', async () => {
      const mockContexts = [mockContext]
      vi.mocked(api.fetchApi).mockResolvedValueOnce({
        contexts: mockContexts,
        repositoryId: 1,
      })

      const { contexts, fetchContexts } = useGuidelinesContexts()
      contexts.value = [{ ...mockContext, name: 'Old name' }]

      await fetchContexts(mockRepositoryPath, true)

      expect(api.fetchApi).toHaveBeenCalledWith(
        `/api/guidelines-contexts?repositoryPath=${encodeURIComponent(mockRepositoryPath)}`,
      )
      expect(contexts.value).toEqual(mockContexts)
    })

    it('should handle concurrent requests', async () => {
      const mockContexts = [mockContext]
      vi.mocked(api.fetchApi).mockResolvedValueOnce({
        contexts: mockContexts,
        repositoryId: 1,
      })

      const { contexts, fetchContexts } = useGuidelinesContexts()

      // Start multiple concurrent requests
      const request1 = fetchContexts(mockRepositoryPath)
      const request2 = fetchContexts(mockRepositoryPath)
      const request3 = fetchContexts(mockRepositoryPath)

      await Promise.all([request1, request2, request3])

      expect(api.fetchApi).toHaveBeenCalledTimes(1)
      expect(contexts.value).toEqual(mockContexts)
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Network error'
      vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

      const { contexts, isLoadingContexts, fetchContexts } =
        useGuidelinesContexts()

      await expect(fetchContexts(mockRepositoryPath)).rejects.toThrow()

      expect(contexts.value).toEqual([])
      expect(isLoadingContexts.value).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000,
      })
    })
  })

  describe('createContext', () => {
    const newContext = {
      name: 'New Context',
      prompt: 'New prompt',
      repositoryPath: mockRepositoryPath,
    }

    it('should create context successfully', async () => {
      vi.mocked(api.fetchApi)
        .mockResolvedValueOnce({ id: 1 }) // repository fetch
        .mockResolvedValueOnce(undefined) // context creation

      const { createContext } = useGuidelinesContexts()
      const result = await createContext(newContext)

      expect(api.fetchApi).toHaveBeenNthCalledWith(
        1,
        `/api/repositories?repositoryPath=${encodeURIComponent(mockRepositoryPath)}`,
      )
      expect(api.fetchApi).toHaveBeenNthCalledWith(
        2,
        '/api/guidelines-contexts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newContext,
            repositoryId: 1,
            gitOriginUrl: null,
          }),
        },
      )
      expect(result).toBe(true)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Context created successfully',
        life: 3000,
      })
    })

    it('should handle create error', async () => {
      const errorMessage = 'Creation failed'
      vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

      const { createContext } = useGuidelinesContexts()
      const result = await createContext(newContext)

      expect(result).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000,
      })
    })
  })

  describe('updateContext', () => {
    const updatedContext = {
      name: 'Updated Context',
      prompt: 'Updated prompt',
    }

    it('should update context successfully', async () => {
      vi.mocked(api.fetchApi).mockResolvedValueOnce(undefined)

      const { updateContext } = useGuidelinesContexts()
      const result = await updateContext(1, updatedContext)

      expect(api.fetchApi).toHaveBeenCalledWith('/api/guidelines-contexts/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedContext),
      })
      expect(result).toBe(true)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Context updated successfully',
        life: 3000,
      })
    })

    it('should handle update error', async () => {
      const errorMessage = 'Update failed'
      vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

      const { updateContext } = useGuidelinesContexts()
      const result = await updateContext(1, updatedContext)

      expect(result).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000,
      })
    })
  })

  describe('deleteContext', () => {
    it('should delete context successfully', async () => {
      vi.mocked(api.fetchApi).mockResolvedValueOnce(undefined)

      const { deleteContext } = useGuidelinesContexts()
      const result = await deleteContext(1)

      expect(api.fetchApi).toHaveBeenCalledWith('/api/guidelines-contexts/1', {
        method: 'DELETE',
      })
      expect(result).toBe(true)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Context deleted successfully',
        life: 3000,
      })
    })

    it('should handle delete error', async () => {
      const errorMessage = 'Delete failed'
      vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

      const { deleteContext } = useGuidelinesContexts()
      const result = await deleteContext(1)

      expect(result).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000,
      })
    })
  })
})
