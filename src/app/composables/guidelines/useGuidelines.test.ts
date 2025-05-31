import { nextTick } from 'vue'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@/app/helpers/api'

import { useGuidelines } from './useGuidelines'

vi.mock('@/app/helpers/api', () => ({
  fetchApi: vi.fn(),
}))

describe('useGuidelines', () => {
  const mockGuideline = {
    id: 1,
    content: 'Test guideline',
    active: true,
    contextId: 1,
    contextName: 'test',
  }

  beforeEach(() => {
    vi.mocked(api.fetchApi).mockReset()
  })

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const {
        guidelines,
        isLoading,
        error,
        showCreateDialog,
        showEditDialog,
        showDeleteDialog,
        selectedContext,
        repositoryId,
        selectedGuideline,
        selectedGuidelines,
        editedContent,
        newGuidelineContent,
        contextForNew,
      } = useGuidelines()

      expect(guidelines.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(showCreateDialog.value).toBe(false)
      expect(showEditDialog.value).toBe(false)
      expect(showDeleteDialog.value).toBe(false)
      expect(selectedContext.value).toBe('')
      expect(repositoryId.value).toBeNull()
      expect(selectedGuideline.value).toBeNull()
      expect(selectedGuidelines.value).toEqual([])
      expect(editedContent.value).toBe('')
      expect(newGuidelineContent.value).toBe('')
      expect(contextForNew.value).toBe('')
    })
  })

  describe('fetchGuidelines', () => {
    it('should fetch guidelines successfully', async () => {
      const mockGuidelines = [mockGuideline]
      vi.mocked(api.fetchApi).mockResolvedValueOnce(mockGuidelines)

      const { guidelines, isLoading, error, fetchGuidelines } = useGuidelines()
      await fetchGuidelines(1, 'test')

      expect(api.fetchApi).toHaveBeenCalledWith(
        '/api/guidelines?repositoryId=1&context=test',
      )
      expect(guidelines.value).toEqual(mockGuidelines)
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should clear guidelines when repositoryId is null', async () => {
      const { guidelines, fetchGuidelines } = useGuidelines()
      guidelines.value = [mockGuideline]

      await fetchGuidelines(null, 'test')

      expect(guidelines.value).toEqual([])
      expect(api.fetchApi).not.toHaveBeenCalled()
    })

    it('should restore selections for context', async () => {
      const mockGuidelines = [mockGuideline]
      vi.mocked(api.fetchApi).mockResolvedValueOnce(mockGuidelines)

      const { selectedGuidelines, selectedContext, fetchGuidelines } =
        useGuidelines()

      // Set context first
      selectedContext.value = 'test'
      // Set selection and wait for watcher
      selectedGuidelines.value = [mockGuideline]
      await nextTick()

      // Now fetch, which should restore the selection
      await fetchGuidelines(1, 'test')

      expect(selectedGuidelines.value).toEqual([mockGuideline])
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Network error'
      vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

      const { guidelines, isLoading, error, fetchGuidelines } = useGuidelines()
      await fetchGuidelines(1, 'test')

      expect(guidelines.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(error.value).toBe(`Error fetching guidelines: ${errorMessage}`)
    })
  })

  describe('Guidelines Management', () => {
    describe('Create', () => {
      it('should create guideline successfully', async () => {
        vi.mocked(api.fetchApi).mockResolvedValueOnce(mockGuideline)

        const {
          guidelines,
          error,
          newGuidelineContent,
          contextForNew,
          showCreateDialog,
          createGuideline,
        } = useGuidelines()

        newGuidelineContent.value = 'Test guideline'
        contextForNew.value = 'test'

        await createGuideline()

        expect(api.fetchApi).toHaveBeenCalledWith('/api/guidelines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Test guideline',
            context: 'test',
            repositoryId: null,
          }),
        })
        expect(guidelines.value).toEqual([mockGuideline])
        expect(error.value).toBeNull()
        expect(showCreateDialog.value).toBe(false)
        expect(newGuidelineContent.value).toBe('')
      })

      it('should handle create error', async () => {
        const errorMessage = 'Creation failed'
        vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

        const { error, createGuideline } = useGuidelines()

        await expect(createGuideline()).rejects.toThrow()
        expect(error.value).toBe(`Error creating guideline: ${errorMessage}`)
      })
    })

    describe('Update', () => {
      it('should update guideline successfully', async () => {
        const updatedGuideline = {
          ...mockGuideline,
          content: 'Updated content',
        }
        vi.mocked(api.fetchApi).mockResolvedValueOnce(updatedGuideline)

        const {
          guidelines,
          error,
          selectedGuideline,
          editedContent,
          showEditDialog,
          updateGuideline,
        } = useGuidelines()

        guidelines.value = [mockGuideline]
        selectedGuideline.value = mockGuideline
        editedContent.value = 'Updated content'

        await updateGuideline()

        expect(api.fetchApi).toHaveBeenCalledWith('/api/guidelines/1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Updated content' }),
        })
        expect(guidelines.value).toEqual([updatedGuideline])
        expect(error.value).toBeNull()
        expect(showEditDialog.value).toBe(false)
      })

      it('should update state successfully', async () => {
        const updatedGuideline = { ...mockGuideline, active: false }
        vi.mocked(api.fetchApi).mockResolvedValueOnce(updatedGuideline)

        const { guidelines, error, updateState } = useGuidelines()
        guidelines.value = [mockGuideline]

        await updateState(1, false)

        expect(api.fetchApi).toHaveBeenCalledWith('/api/guidelines/1/state', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: false }),
        })
        expect(guidelines.value).toEqual([updatedGuideline])
        expect(error.value).toBeNull()
      })

      it('should handle update error', async () => {
        const errorMessage = 'Update failed'
        vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

        const { error, selectedGuideline, updateGuideline } = useGuidelines()
        selectedGuideline.value = mockGuideline

        await expect(updateGuideline()).rejects.toThrow()
        expect(error.value).toBe(`Error updating guideline: ${errorMessage}`)
      })
    })

    describe('Delete', () => {
      it('should delete guideline successfully', async () => {
        vi.mocked(api.fetchApi).mockResolvedValueOnce(undefined)

        const {
          guidelines,
          error,
          selectedGuideline,
          showDeleteDialog,
          deleteGuideline,
        } = useGuidelines()

        guidelines.value = [mockGuideline]
        selectedGuideline.value = mockGuideline

        await deleteGuideline()

        expect(api.fetchApi).toHaveBeenCalledWith('/api/guidelines/1', {
          method: 'DELETE',
        })
        expect(guidelines.value).toEqual([])
        expect(error.value).toBeNull()
        expect(showDeleteDialog.value).toBe(false)
      })

      it('should handle delete error', async () => {
        const errorMessage = 'Delete failed'
        vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

        const { error, selectedGuideline, deleteGuideline } = useGuidelines()
        selectedGuideline.value = mockGuideline

        await expect(deleteGuideline()).rejects.toThrow()
        expect(error.value).toBe(`Error deleting guideline: ${errorMessage}`)
      })

      it('should perform bulk delete successfully', async () => {
        vi.mocked(api.fetchApi).mockResolvedValueOnce(undefined)

        const { guidelines, error, selectedGuidelines, bulkDelete } =
          useGuidelines()

        const mockGuidelines = [mockGuideline, { ...mockGuideline, id: 2 }]
        guidelines.value = mockGuidelines
        selectedGuidelines.value = mockGuidelines

        await bulkDelete([1, 2])

        expect(api.fetchApi).toHaveBeenCalledWith('/api/guidelines/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [1, 2] }),
        })
        expect(guidelines.value).toEqual([])
        expect(error.value).toBeNull()
        expect(selectedGuidelines.value).toEqual([])
      })
    })
  })

  describe('Watchers', () => {
    it('should track selections by context', async () => {
      const { selectedGuidelines, selectedContext } = useGuidelines()

      selectedContext.value = 'test'
      selectedGuidelines.value = [mockGuideline]

      await nextTick()

      // Internal state is not directly accessible, but we can verify
      // behavior when fetching guidelines
      vi.mocked(api.fetchApi).mockResolvedValueOnce([mockGuideline])
      const { fetchGuidelines } = useGuidelines()
      await fetchGuidelines(1, 'test')

      expect(selectedGuidelines.value).toEqual([mockGuideline])
    })

    it('should fetch guidelines on repository/context change', async () => {
      vi.mocked(api.fetchApi).mockResolvedValue([mockGuideline])

      const { repositoryId, selectedContext } = useGuidelines()

      repositoryId.value = 1
      selectedContext.value = 'test'

      await nextTick()

      expect(api.fetchApi).toHaveBeenCalledWith(
        '/api/guidelines?repositoryId=1&context=test',
      )
    })

    it('should sync context with new guideline form', async () => {
      const { selectedContext, contextForNew } = useGuidelines()

      selectedContext.value = 'test'
      await nextTick()

      expect(contextForNew.value).toBe('test')
    })
  })
})
