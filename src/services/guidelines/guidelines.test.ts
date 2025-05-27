import { and, desc, eq } from 'drizzle-orm'
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
  createGuideline,
  deleteGuideline,
  getGuidelinesForRepository,
  getGuidelinesForRepositoryById,
  updateGuidelineContent,
  updateGuidelineState,
} from './guidelines'

vi.mock('@/db', async () => {
  const actualSchema = await vi.importActual('@/db/schema')

  const mockLimit = vi.fn().mockResolvedValue([])
  const mockOrderBy = vi.fn().mockReturnValue({ then: vi.fn() })
  const mockWhere = vi.fn().mockReturnValue({
    limit: mockLimit,
    orderBy: mockOrderBy,
  })
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
  const mockFrom = vi.fn().mockReturnValue({
    leftJoin: mockLeftJoin,
    where: mockWhere,
  })
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
    guidelines: actualSchema.guidelines,
    guidelinesContexts: actualSchema.guidelinesContexts,
    __mocks: {
      mockSelect,
      mockFrom,
      mockLeftJoin,
      mockWhere,
      mockOrderBy,
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
  findRepositoryByPath: vi.fn(),
  findOrCreateRepositoryByPath: vi.fn(),
}))

describe('guidelines service', () => {
  const mockRepositoryId = 1
  const mockRepositoryPath = '/test/project'
  const mockGitOriginUrl = 'git@github.com:test/repo.git'
  const mockContextId = 1
  const mockContextName = 'test-context'
  const mockGuidelineId = 1
  const mockGuidelineContent = 'Test guideline content'

  let mockSelect: Mock
  let mockFrom: Mock
  let mockLeftJoin: Mock
  let mockWhere: Mock
  let mockOrderBy: Mock
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
    mockLeftJoin = mocks.mockLeftJoin
    mockWhere = mocks.mockWhere
    mockOrderBy = mocks.mockOrderBy
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
    mockFrom.mockReturnValue({
      leftJoin: mockLeftJoin,
      where: mockWhere,
    })
    mockLeftJoin.mockReturnValue({ where: mockWhere })
    mockWhere.mockReturnValue({
      limit: mockLimit,
      orderBy: mockOrderBy,
    })
    mockOrderBy.mockResolvedValue([])
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

  describe('getGuidelinesForRepositoryById', () => {
    const mockGuidelineData = {
      id: mockGuidelineId,
      content: mockGuidelineContent,
      active: true,
      contextId: mockContextId,
      contextRepositoryId: mockRepositoryId,
      contextName: mockContextName,
    }

    it('should fetch all guidelines for repository without context filter', async () => {
      mockOrderBy.mockResolvedValueOnce([mockGuidelineData])

      const result = await getGuidelinesForRepositoryById(mockRepositoryId)

      expect(mockSelect).toHaveBeenCalledWith({
        id: dbIndex.guidelines.id,
        content: dbIndex.guidelines.content,
        active: dbIndex.guidelines.active,
        contextId: dbIndex.guidelines.contextId,
        contextRepositoryId: dbIndex.guidelinesContexts.repositoryId,
        contextName: dbIndex.guidelinesContexts.name,
      })
      expect(mockFrom).toHaveBeenCalledWith(dbIndex.guidelines)
      expect(mockLeftJoin).toHaveBeenCalledWith(
        dbIndex.guidelinesContexts,
        eq(dbIndex.guidelines.contextId, dbIndex.guidelinesContexts.id),
      )
      expect(mockWhere).toHaveBeenCalledWith(
        and(eq(dbIndex.guidelinesContexts.repositoryId, mockRepositoryId)),
      )
      expect(mockOrderBy).toHaveBeenCalledWith(desc(dbIndex.guidelines.id))

      expect(result).toEqual([
        {
          id: mockGuidelineId,
          content: mockGuidelineContent,
          active: true,
          contextId: mockContextId,
          contextName: mockContextName,
        },
      ])
    })

    it('should fetch guidelines filtered by context name', async () => {
      mockOrderBy.mockResolvedValueOnce([mockGuidelineData])

      const result = await getGuidelinesForRepositoryById(
        mockRepositoryId,
        mockContextName,
      )

      expect(mockWhere).toHaveBeenCalledWith(
        and(
          eq(dbIndex.guidelinesContexts.repositoryId, mockRepositoryId),
          eq(dbIndex.guidelinesContexts.name, mockContextName),
        ),
      )

      expect(result).toEqual([
        {
          id: mockGuidelineId,
          content: mockGuidelineContent,
          active: true,
          contextId: mockContextId,
          contextName: mockContextName,
        },
      ])
    })

    it('should return empty array when no guidelines found', async () => {
      mockOrderBy.mockResolvedValueOnce([])

      const result = await getGuidelinesForRepositoryById(mockRepositoryId)

      expect(result).toEqual([])
    })

    it('should throw error when guidelines have incomplete data', async () => {
      const incompleteData = {
        ...mockGuidelineData,
        contextRepositoryId: null,
      }
      mockOrderBy.mockResolvedValueOnce([incompleteData])

      await expect(
        getGuidelinesForRepositoryById(mockRepositoryId),
      ).rejects.toThrow(
        'Incomplete guideline data: some guidelines have missing contextRepositoryId or contextName',
      )
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockOrderBy.mockRejectedValueOnce(dbError)

      await expect(
        getGuidelinesForRepositoryById(mockRepositoryId),
      ).rejects.toThrow('Failed to fetch guidelines.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching guidelines by repository ID:',
        dbError,
      )
    })
  })

  describe('getGuidelinesForRepository', () => {
    it('should fetch guidelines when repository exists', async () => {
      const mockGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        active: true,
        contextId: mockContextId,
        contextName: mockContextName,
      }

      vi.mocked(repositoryService.findRepositoryByPath).mockResolvedValueOnce({
        id: mockRepositoryId,
      })
      mockOrderBy.mockResolvedValueOnce([
        {
          ...mockGuideline,
          contextRepositoryId: mockRepositoryId,
        },
      ])

      const result = await getGuidelinesForRepository(
        mockRepositoryPath,
        mockGitOriginUrl,
        mockContextName,
      )

      expect(repositoryService.findRepositoryByPath).toHaveBeenCalledWith(
        mockRepositoryPath,
        mockGitOriginUrl,
      )
      expect(result).toEqual([mockGuideline])
    })

    it('should return empty array when repository not found', async () => {
      vi.mocked(repositoryService.findRepositoryByPath).mockResolvedValueOnce(
        null,
      )

      const result = await getGuidelinesForRepository(
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      expect(result).toEqual([])
    })

    it('should handle null gitOriginUrl', async () => {
      vi.mocked(repositoryService.findRepositoryByPath).mockResolvedValueOnce({
        id: mockRepositoryId,
      })
      mockOrderBy.mockResolvedValueOnce([])

      await getGuidelinesForRepository(mockRepositoryPath, null)

      expect(repositoryService.findRepositoryByPath).toHaveBeenCalledWith(
        mockRepositoryPath,
        null,
      )
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Repository lookup failed')
      vi.mocked(repositoryService.findRepositoryByPath).mockRejectedValueOnce(
        dbError,
      )

      await expect(
        getGuidelinesForRepository(mockRepositoryPath, mockGitOriginUrl),
      ).rejects.toThrow('Failed to fetch guidelines.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching guidelines:',
        dbError,
      )
    })
  })

  describe('createGuideline', () => {
    it('should create guideline successfully', async () => {
      const mockRepository = { id: mockRepositoryId }
      const mockContext = { id: mockContextId }
      const mockInsertedGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        contextId: mockContextId,
        active: false,
      }
      const mockCompleteGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        active: false,
        contextId: mockContextId,
        contextName: mockContextName,
      }

      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce(mockRepository)

      // Context lookup call
      mockLimit.mockResolvedValueOnce([mockContext])
      // Duplicate check call
      mockLimit.mockResolvedValueOnce([])
      // Guideline insertion
      mockInsertReturning.mockResolvedValueOnce([mockInsertedGuideline])
      // Complete guideline fetch
      mockOrderBy.mockResolvedValueOnce([mockCompleteGuideline])

      const result = await createGuideline(
        mockGuidelineContent,
        mockContextName,
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, mockGitOriginUrl)
      expect(mockInsert).toHaveBeenCalledWith(dbIndex.guidelines)
      expect(mockInsertValues).toHaveBeenCalledWith({
        content: mockGuidelineContent,
        contextId: mockContextId,
        active: false,
      })
      expect(result).toEqual(mockCompleteGuideline)
    })

    it('should throw error when context not found', async () => {
      const mockRepository = { id: mockRepositoryId }

      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce(mockRepository)
      mockLimit.mockResolvedValueOnce([]) // No context found

      await expect(
        createGuideline(
          mockGuidelineContent,
          mockContextName,
          mockRepositoryPath,
          mockGitOriginUrl,
        ),
      ).rejects.toThrow(
        `Context "${mockContextName}" not found for repository "${mockRepositoryPath}"`,
      )
    })

    it('should throw error when guideline already exists', async () => {
      const mockRepository = { id: mockRepositoryId }
      const mockContext = { id: mockContextId }
      const existingGuideline = { id: 999 }

      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce(mockRepository)
      mockLimit.mockResolvedValueOnce([mockContext]) // Context found
      mockLimit.mockResolvedValueOnce([existingGuideline]) // Duplicate found

      await expect(
        createGuideline(
          mockGuidelineContent,
          mockContextName,
          mockRepositoryPath,
          mockGitOriginUrl,
        ),
      ).rejects.toThrow('This guideline already exists for the given context.')
    })

    it('should handle null gitOriginUrl', async () => {
      const mockRepository = { id: mockRepositoryId }
      const mockContext = { id: mockContextId }
      const mockInsertedGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        contextId: mockContextId,
        active: false,
      }
      const mockCompleteGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        active: false,
        contextId: mockContextId,
        contextName: mockContextName,
      }

      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce(mockRepository)
      mockLimit.mockResolvedValueOnce([mockContext])
      mockLimit.mockResolvedValueOnce([])
      mockInsertReturning.mockResolvedValueOnce([mockInsertedGuideline])
      mockOrderBy.mockResolvedValueOnce([mockCompleteGuideline])

      await createGuideline(
        mockGuidelineContent,
        mockContextName,
        mockRepositoryPath,
        null,
      )

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, null)
    })

    it('should throw error when guideline creation fails', async () => {
      const mockRepository = { id: mockRepositoryId }
      const mockContext = { id: mockContextId }

      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockResolvedValueOnce(mockRepository)
      mockLimit.mockResolvedValueOnce([mockContext])
      mockLimit.mockResolvedValueOnce([])
      mockInsertReturning.mockResolvedValueOnce([])

      await expect(
        createGuideline(
          mockGuidelineContent,
          mockContextName,
          mockRepositoryPath,
          mockGitOriginUrl,
        ),
      ).rejects.toThrow('Failed to create guideline.')
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database error')
      vi.mocked(
        repositoryService.findOrCreateRepositoryByPath,
      ).mockRejectedValueOnce(dbError)

      await expect(
        createGuideline(
          mockGuidelineContent,
          mockContextName,
          mockRepositoryPath,
          mockGitOriginUrl,
        ),
      ).rejects.toThrow('Failed to create guideline.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating guideline:',
        dbError,
      )
    })
  })

  describe('updateGuidelineState', () => {
    it('should update guideline state successfully', async () => {
      const existingGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        active: false,
        contextId: mockContextId,
        contextName: mockContextName,
      }
      const updatedGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        active: true,
        contextId: mockContextId,
      }

      mockLimit.mockResolvedValueOnce([existingGuideline])
      mockUpdateReturning.mockResolvedValueOnce([updatedGuideline])

      const result = await updateGuidelineState(mockGuidelineId, true)

      expect(mockUpdate).toHaveBeenCalledWith(dbIndex.guidelines)
      expect(mockUpdateSet).toHaveBeenCalledWith({ active: true })
      expect(mockUpdateWhere).toHaveBeenCalledWith(
        eq(dbIndex.guidelines.id, mockGuidelineId),
      )
      expect(result).toEqual({
        ...updatedGuideline,
        contextName: mockContextName,
      })
    })

    it('should throw error when guideline not found', async () => {
      mockLimit.mockResolvedValueOnce([])

      await expect(updateGuidelineState(mockGuidelineId, true)).rejects.toThrow(
        'Guideline not found.',
      )
    })

    it('should throw error when guideline has no context name', async () => {
      const incompleteGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        active: false,
        contextId: mockContextId,
        contextName: null,
      }
      mockLimit.mockResolvedValueOnce([incompleteGuideline])

      await expect(updateGuidelineState(mockGuidelineId, true)).rejects.toThrow(
        'Guideline not found.',
      )
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database update failed')
      mockLimit.mockRejectedValueOnce(dbError)

      await expect(updateGuidelineState(mockGuidelineId, true)).rejects.toThrow(
        'Failed to update guideline state.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guideline state:',
        dbError,
      )
    })
  })

  describe('updateGuidelineContent', () => {
    it('should update guideline content successfully', async () => {
      const existingGuideline = {
        id: mockGuidelineId,
        content: 'Old content',
        active: true,
        contextId: mockContextId,
        contextName: mockContextName,
      }
      const updatedGuideline = {
        id: mockGuidelineId,
        content: 'New content',
        active: true,
        contextId: mockContextId,
      }

      mockLimit.mockResolvedValueOnce([existingGuideline])
      mockUpdateReturning.mockResolvedValueOnce([updatedGuideline])

      const result = await updateGuidelineContent(
        mockGuidelineId,
        'New content',
      )

      expect(mockUpdate).toHaveBeenCalledWith(dbIndex.guidelines)
      expect(mockUpdateSet).toHaveBeenCalledWith({
        content: 'New content',
      })
      expect(mockUpdateWhere).toHaveBeenCalledWith(
        eq(dbIndex.guidelines.id, mockGuidelineId),
      )
      expect(result).toEqual({
        ...updatedGuideline,
        contextName: mockContextName,
      })
    })

    it('should throw error when guideline not found', async () => {
      mockLimit.mockResolvedValueOnce([])

      await expect(
        updateGuidelineContent(mockGuidelineId, 'New content'),
      ).rejects.toThrow('Guideline not found.')
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database update failed')
      mockLimit.mockRejectedValueOnce(dbError)

      await expect(
        updateGuidelineContent(mockGuidelineId, 'New content'),
      ).rejects.toThrow('Failed to update guideline content.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guideline content:',
        dbError,
      )
    })
  })

  describe('deleteGuideline', () => {
    it('should delete guideline successfully', async () => {
      const existingGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        active: true,
        contextId: mockContextId,
        contextName: mockContextName,
      }
      const deletedGuideline = {
        id: mockGuidelineId,
        content: mockGuidelineContent,
        active: true,
        contextId: mockContextId,
      }

      mockLimit.mockResolvedValueOnce([existingGuideline])
      mockDeleteReturning.mockResolvedValueOnce([deletedGuideline])

      const result = await deleteGuideline(mockGuidelineId)

      expect(mockDelete).toHaveBeenCalledWith(dbIndex.guidelines)
      expect(mockDeleteWhere).toHaveBeenCalledWith(
        eq(dbIndex.guidelines.id, mockGuidelineId),
      )
      expect(result).toEqual({
        ...deletedGuideline,
        contextName: mockContextName,
      })
    })

    it('should throw error when guideline not found', async () => {
      mockLimit.mockResolvedValueOnce([])

      await expect(deleteGuideline(mockGuidelineId)).rejects.toThrow(
        'Guideline not found.',
      )
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database delete failed')
      mockLimit.mockRejectedValueOnce(dbError)

      await expect(deleteGuideline(mockGuidelineId)).rejects.toThrow(
        'Failed to delete guideline.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting guideline:',
        dbError,
      )
    })
  })
})
