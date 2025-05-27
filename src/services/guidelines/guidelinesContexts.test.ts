import { and, eq } from 'drizzle-orm'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest'

import * as dbIndex from '@/db'
import * as repositoryService from '@/services/repositoryService'

import {
  createGuidelinesContext,
  deleteGuidelinesContext,
  getGuidelinesContexts,
  updateGuidelinesContext,
} from './guidelinesContexts'

vi.mock('@/db', async () => {
  const actualSchema = await vi.importActual('@/db/schema')

  const mockLimit = vi.fn().mockResolvedValue([])
  const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

  const mockInsertReturning = vi.fn().mockResolvedValue([])
  const mockInsertValues = vi
    .fn()
    .mockReturnValue({ returning: mockInsertReturning })
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues })

  const mockUpdateReturning = vi.fn().mockResolvedValue([])
  const mockUpdateWhere = vi
    .fn()
    .mockReturnValue({ returning: mockUpdateReturning })
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

  const mockDeleteReturning = vi.fn().mockResolvedValue([])
  const mockDeleteWhere = vi
    .fn()
    .mockReturnValue({ returning: mockDeleteReturning })
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere })

  const mockedDbModule: any = {
    db: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    },
    guidelinesContexts: actualSchema.guidelinesContexts,
    __mocks: {
      mockSelect,
      mockFrom,
      mockWhere,
      mockLimit,
      mockInsert,
      mockInsertValues,
      mockInsertReturning,
      mockUpdate,
      mockUpdateSet,
      mockUpdateWhere,
      mockUpdateReturning,
      mockDelete,
      mockDeleteWhere,
      mockDeleteReturning,
    },
  }
  return mockedDbModule
})

vi.mock('@/services/repositoryService', () => ({
  findOrCreateRepositoryByPath: vi.fn(),
}))

describe('guidelinesContexts service', () => {
  const mockRepositoryId = 1
  const mockRepositoryPath = '/test/project'
  const mockGitOriginUrl = 'git@github.com:test/repo.git'
  const mockContextId = 1
  const mockContextName = 'test-context'
  const mockContextPrompt = 'Test context prompt'

  let mockSelect: Mock
  let mockFrom: Mock
  let mockWhere: Mock
  let mockLimit: Mock
  let mockInsert: Mock
  let mockInsertValues: Mock
  let mockInsertReturning: Mock
  let mockUpdate: Mock
  let mockUpdateSet: Mock
  let mockUpdateWhere: Mock
  let mockUpdateReturning: Mock
  let mockDelete: Mock
  let mockDeleteWhere: Mock
  let mockDeleteReturning: Mock
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const mocks = (dbIndex as any).__mocks
    mockSelect = mocks.mockSelect
    mockFrom = mocks.mockFrom
    mockWhere = mocks.mockWhere
    mockLimit = mocks.mockLimit
    mockInsert = mocks.mockInsert
    mockInsertValues = mocks.mockInsertValues
    mockInsertReturning = mocks.mockInsertReturning
    mockUpdate = mocks.mockUpdate
    mockUpdateSet = mocks.mockUpdateSet
    mockUpdateWhere = mocks.mockUpdateWhere
    mockUpdateReturning = mocks.mockUpdateReturning
    mockDelete = mocks.mockDelete
    mockDeleteWhere = mocks.mockDeleteWhere
    mockDeleteReturning = mocks.mockDeleteReturning

    // Reset mock implementations
    mockSelect.mockReturnValue({ from: mockFrom })
    mockFrom.mockReturnValue({ where: mockWhere })
    mockWhere.mockReturnValue({ limit: mockLimit })
    mockLimit.mockResolvedValue([])
    mockInsert.mockReturnValue({ values: mockInsertValues })
    mockInsertValues.mockReturnValue({ returning: mockInsertReturning })
    mockInsertReturning.mockResolvedValue([])
    mockUpdate.mockReturnValue({ set: mockUpdateSet })
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning })
    mockUpdateReturning.mockResolvedValue([])
    mockDelete.mockReturnValue({ where: mockDeleteWhere })
    mockDeleteWhere.mockReturnValue({ returning: mockDeleteReturning })
    mockDeleteReturning.mockResolvedValue([])
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    vi.restoreAllMocks()
  })

  describe('getGuidelinesContexts', () => {
    const mockContexts = [
      {
        id: mockContextId,
        name: mockContextName,
        prompt: mockContextPrompt,
        repositoryId: mockRepositoryId,
      },
    ]

    it('should fetch contexts for existing repository', async () => {
      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce({ id: mockRepositoryId })
      mockWhere.mockResolvedValueOnce(mockContexts)

      const result = await getGuidelinesContexts(
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, mockGitOriginUrl)
      expect(mockSelect).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(dbIndex.guidelinesContexts)
      expect(mockWhere).toHaveBeenCalledWith(
        eq(dbIndex.guidelinesContexts.repositoryId, mockRepositoryId),
      )

      expect(result).toEqual({
        contexts: mockContexts,
        repositoryId: mockRepositoryId,
      })
    })

    it('should handle null gitOriginUrl', async () => {
      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce({ id: mockRepositoryId })
      mockWhere.mockResolvedValueOnce([])

      await getGuidelinesContexts(mockRepositoryPath, null)

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, null)
    })

    it('should return empty contexts array when no contexts found', async () => {
      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce({ id: mockRepositoryId })
      mockWhere.mockResolvedValueOnce([])

      const result = await getGuidelinesContexts(
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      expect(result).toEqual({
        contexts: [],
        repositoryId: mockRepositoryId,
      })
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Repository creation failed')
      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockRejectedValueOnce(dbError)

      await expect(
        getGuidelinesContexts(mockRepositoryPath, mockGitOriginUrl),
      ).rejects.toThrow('Failed to fetch contexts.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching contexts:',
        dbError,
      )
    })
  })

  describe('createGuidelinesContext', () => {
    const mockNewContext = {
      id: mockContextId,
      name: mockContextName,
      prompt: mockContextPrompt,
      repositoryId: mockRepositoryId,
    }

    it('should create context successfully', async () => {
      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce({ id: mockRepositoryId })
      mockWhere.mockResolvedValueOnce([]) // No existing context
      mockInsertReturning.mockResolvedValueOnce([mockNewContext])

      const result = await createGuidelinesContext(
        mockContextName,
        mockContextPrompt,
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, mockGitOriginUrl)
      expect(mockSelect).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalledWith(
        and(
          eq(dbIndex.guidelinesContexts.name, mockContextName),
          eq(dbIndex.guidelinesContexts.repositoryId, mockRepositoryId),
        ),
      )
      expect(mockInsert).toHaveBeenCalledWith(dbIndex.guidelinesContexts)
      expect(mockInsertValues).toHaveBeenCalledWith({
        name: mockContextName,
        prompt: mockContextPrompt,
        repositoryId: mockRepositoryId,
      })

      expect(result).toEqual(mockNewContext)
    })

    it('should throw error when context with same name already exists', async () => {
      const existingContext = { id: 999 }
      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce({ id: mockRepositoryId })
      mockWhere.mockResolvedValueOnce([existingContext])

      await expect(
        createGuidelinesContext(
          mockContextName,
          mockContextPrompt,
          mockRepositoryPath,
          mockGitOriginUrl,
        ),
      ).rejects.toThrow('Failed to create guidelines context.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating guidelines context:',
        expect.objectContaining({
          message: `A context with the name "${mockContextName}" already exists for this repository.`,
        }),
      )
    })

    it('should handle null gitOriginUrl', async () => {
      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce({ id: mockRepositoryId })
      mockWhere.mockResolvedValueOnce([])
      mockInsertReturning.mockResolvedValueOnce([mockNewContext])

      await createGuidelinesContext(
        mockContextName,
        mockContextPrompt,
        mockRepositoryPath,
        null,
      )

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, null)
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database error')
      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockRejectedValueOnce(dbError)

      await expect(
        createGuidelinesContext(
          mockContextName,
          mockContextPrompt,
          mockRepositoryPath,
          mockGitOriginUrl,
        ),
      ).rejects.toThrow('Failed to create guidelines context.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating guidelines context:',
        dbError,
      )
    })
  })

  describe('updateGuidelinesContext', () => {
    const mockUpdatedContext = {
      id: mockContextId,
      name: 'updated-name',
      prompt: 'Updated prompt',
      repositoryId: mockRepositoryId,
    }

    it('should update context successfully', async () => {
      mockLimit.mockResolvedValueOnce([{ repositoryId: mockRepositoryId }]) // Current context
      mockLimit.mockResolvedValueOnce([]) // No other context with same name
      mockUpdateReturning.mockResolvedValueOnce([mockUpdatedContext])

      const result = await updateGuidelinesContext(
        mockContextId,
        'updated-name',
        'Updated prompt',
      )

      expect(mockSelect).toHaveBeenCalledWith({
        repositoryId: dbIndex.guidelinesContexts.repositoryId,
      })
      expect(mockWhere).toHaveBeenCalledWith(
        eq(dbIndex.guidelinesContexts.id, mockContextId),
      )
      expect(mockLimit).toHaveBeenCalledWith(1)

      expect(mockUpdate).toHaveBeenCalledWith(dbIndex.guidelinesContexts)
      expect(mockUpdateSet).toHaveBeenCalledWith({
        name: 'updated-name',
        prompt: 'Updated prompt',
      })
      expect(mockUpdateWhere).toHaveBeenCalledWith(
        eq(dbIndex.guidelinesContexts.id, mockContextId),
      )

      expect(result).toEqual(mockUpdatedContext)
    })

    it('should throw error when context not found', async () => {
      mockLimit.mockResolvedValueOnce([]) // No current context

      await expect(
        updateGuidelinesContext(mockContextId, 'new-name', 'New prompt'),
      ).rejects.toThrow('Failed to update guidelines context.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guidelines context:',
        expect.objectContaining({
          message: 'Context not found.',
        }),
      )
    })

    it('should throw error when another context with same name exists', async () => {
      mockLimit.mockResolvedValueOnce([{ repositoryId: mockRepositoryId }]) // Current context
      mockLimit.mockResolvedValueOnce([{ id: 999 }]) // Other context with same name

      await expect(
        updateGuidelinesContext(mockContextId, 'existing-name', 'New prompt'),
      ).rejects.toThrow('Failed to update guidelines context.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guidelines context:',
        expect.objectContaining({
          message:
            'A context with the name "existing-name" already exists in this repository.',
        }),
      )
    })

    it('should allow updating to same name (same context)', async () => {
      mockLimit.mockResolvedValueOnce([{ repositoryId: mockRepositoryId }]) // Current context
      mockLimit.mockResolvedValueOnce([{ id: mockContextId }]) // Same context with same name
      mockUpdateReturning.mockResolvedValueOnce([mockUpdatedContext])

      const result = await updateGuidelinesContext(
        mockContextId,
        'same-name',
        'Updated prompt',
      )

      expect(result).toEqual(mockUpdatedContext)
    })

    it('should throw error when update returns no result', async () => {
      mockLimit.mockResolvedValueOnce([{ repositoryId: mockRepositoryId }]) // Current context
      mockLimit.mockResolvedValueOnce([]) // No other context with same name
      mockUpdateReturning.mockResolvedValueOnce([]) // Update returns nothing

      await expect(
        updateGuidelinesContext(mockContextId, 'new-name', 'New prompt'),
      ).rejects.toThrow('Failed to update guidelines context.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guidelines context:',
        expect.objectContaining({
          message: 'Context not found.',
        }),
      )
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database error')
      mockLimit.mockRejectedValueOnce(dbError)

      await expect(
        updateGuidelinesContext(mockContextId, 'new-name', 'New prompt'),
      ).rejects.toThrow('Failed to update guidelines context.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guidelines context:',
        dbError,
      )
    })
  })

  describe('deleteGuidelinesContext', () => {
    const mockDeletedContext = {
      id: mockContextId,
      name: mockContextName,
      prompt: mockContextPrompt,
      repositoryId: mockRepositoryId,
    }

    it('should delete context successfully', async () => {
      mockDeleteReturning.mockResolvedValueOnce([mockDeletedContext])

      await deleteGuidelinesContext(mockContextId)

      expect(mockDelete).toHaveBeenCalledWith(dbIndex.guidelinesContexts)
      expect(mockDeleteWhere).toHaveBeenCalledWith(
        eq(dbIndex.guidelinesContexts.id, mockContextId),
      )
    })

    it('should throw error when context not found', async () => {
      mockDeleteReturning.mockResolvedValueOnce([]) // No deleted context

      await expect(deleteGuidelinesContext(mockContextId)).rejects.toThrow(
        'Failed to delete guidelines context.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting guidelines context:',
        expect.objectContaining({
          message: 'Context not found.',
        }),
      )
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database error')
      mockDeleteReturning.mockRejectedValueOnce(dbError)

      await expect(deleteGuidelinesContext(mockContextId)).rejects.toThrow(
        'Failed to delete guidelines context.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting guidelines context:',
        dbError,
      )
    })
  })
})
