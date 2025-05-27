import { eq } from 'drizzle-orm'
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

import {
  deleteRepository,
  findOrCreateRepositoryByPath,
  findRepositoryByPath,
  getAllRepositories,
  updateRepository,
} from './repositoryService'

vi.mock('@/db', async () => {
  const actualSchema = await vi.importActual('@/db/schema')

  const mockReturning = vi.fn()
  const mockLimit = vi.fn().mockReturnValue([])
  const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

  const mockInsertReturning = vi.fn()
  const mockInsertValues = vi
    .fn()
    .mockReturnValue({ returning: mockInsertReturning })
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues })

  const mockUpdateReturning = vi.fn()
  const mockUpdateWhere = vi
    .fn()
    .mockReturnValue({ returning: mockUpdateReturning })
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

  const mockDeleteReturning = vi.fn()
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
    repositories: actualSchema.repositories,
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
      mockReturning,
    },
  }
  return mockedDbModule
})

describe('repositoryService', () => {
  const mockCurrentPath = '/test/project'
  const mockGitOriginUrl = 'git@github.com:test/repo.git'
  const mockRepositoryId = 1

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

  describe('findRepositoryByPath', () => {
    it('should find and return existing repository by git origin URL', async () => {
      const mockRepo = { id: mockRepositoryId, origin: mockGitOriginUrl }
      mockLimit.mockResolvedValueOnce([mockRepo])

      const result = await findRepositoryByPath(
        mockCurrentPath,
        mockGitOriginUrl,
      )

      expect(result).toEqual({ id: mockRepositoryId })
      expect(mockSelect).toHaveBeenCalledWith({
        id: dbIndex.repositories.id,
        origin: dbIndex.repositories.origin,
      })
      expect(mockFrom).toHaveBeenCalledWith(dbIndex.repositories)
      expect(mockWhere).toHaveBeenCalledWith(
        eq(dbIndex.repositories.origin, mockGitOriginUrl),
      )
      expect(mockLimit).toHaveBeenCalledWith(1)
    })

    it('should find and return existing repository by current path when no git URL', async () => {
      const mockRepo = { id: mockRepositoryId, origin: mockCurrentPath }
      mockLimit.mockResolvedValueOnce([mockRepo])

      const result = await findRepositoryByPath(mockCurrentPath, null)

      expect(result).toEqual({ id: mockRepositoryId })
      expect(mockWhere).toHaveBeenCalledWith(
        eq(dbIndex.repositories.origin, mockCurrentPath),
      )
    })

    it('should return null when repository not found', async () => {
      mockLimit.mockResolvedValueOnce([])

      const result = await findRepositoryByPath(
        mockCurrentPath,
        mockGitOriginUrl,
      )

      expect(result).toBeNull()
    })

    it('should throw error when currentPath is missing', async () => {
      await expect(findRepositoryByPath('', mockGitOriginUrl)).rejects.toThrow(
        'Missing or invalid "currentPath" argument.',
      )
    })

    it('should throw error when currentPath is not a string', async () => {
      await expect(
        findRepositoryByPath(123 as any, mockGitOriginUrl),
      ).rejects.toThrow('Missing or invalid "currentPath" argument.')
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockLimit.mockRejectedValueOnce(dbError)

      await expect(
        findRepositoryByPath(mockCurrentPath, mockGitOriginUrl),
      ).rejects.toThrow(
        `Failed to search repository for path "${mockCurrentPath}".`,
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Error searching repository with path "${mockCurrentPath}":`,
        dbError,
      )
    })
  })

  describe('findOrCreateRepositoryByPath', () => {
    it('should return existing repository when found', async () => {
      const mockRepo = { id: mockRepositoryId, origin: mockGitOriginUrl }
      mockLimit.mockResolvedValueOnce([mockRepo])

      const result = await findOrCreateRepositoryByPath(
        mockCurrentPath,
        mockGitOriginUrl,
      )

      expect(result).toEqual({ id: mockRepositoryId })
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('should create new repository when not found using git origin URL', async () => {
      mockLimit.mockResolvedValueOnce([]) // Not found
      mockInsertReturning.mockResolvedValueOnce([{ id: mockRepositoryId }])

      const result = await findOrCreateRepositoryByPath(
        mockCurrentPath,
        mockGitOriginUrl,
      )

      expect(result).toEqual({ id: mockRepositoryId })
      expect(mockInsert).toHaveBeenCalledWith(dbIndex.repositories)
      expect(mockInsertValues).toHaveBeenCalledWith({
        origin: mockGitOriginUrl,
      })
      expect(mockInsertReturning).toHaveBeenCalledWith({
        id: dbIndex.repositories.id,
      })
    })

    it('should create new repository when not found using current path', async () => {
      mockLimit.mockResolvedValueOnce([])
      mockInsertReturning.mockResolvedValueOnce([{ id: mockRepositoryId }])

      const result = await findOrCreateRepositoryByPath(mockCurrentPath, null)

      expect(result).toEqual({ id: mockRepositoryId })
      expect(mockInsertValues).toHaveBeenCalledWith({
        origin: mockCurrentPath,
      })
    })

    it('should throw error when currentPath is missing', async () => {
      await expect(
        findOrCreateRepositoryByPath('', mockGitOriginUrl),
      ).rejects.toThrow('Missing or invalid "currentPath" argument.')
    })

    it('should throw error when currentPath is not a string', async () => {
      await expect(
        findOrCreateRepositoryByPath(null as any, mockGitOriginUrl),
      ).rejects.toThrow('Missing or invalid "currentPath" argument.')
    })

    it('should throw error when repository creation fails', async () => {
      mockLimit.mockResolvedValueOnce([])
      mockInsertReturning.mockResolvedValueOnce([])

      await expect(
        findOrCreateRepositoryByPath(mockCurrentPath, mockGitOriginUrl),
      ).rejects.toThrow(
        `Failed to process repository request for path "${mockCurrentPath}".`,
      )
    })

    it('should handle database errors during search', async () => {
      const dbError = new Error('Database search failed')
      mockLimit.mockRejectedValueOnce(dbError)

      await expect(
        findOrCreateRepositoryByPath(mockCurrentPath, mockGitOriginUrl),
      ).rejects.toThrow(
        `Failed to process repository request for path "${mockCurrentPath}".`,
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Error processing repository with path "${mockCurrentPath}":`,
        dbError,
      )
    })
  })

  describe('getAllRepositories', () => {
    it('should return all repositories', async () => {
      const mockRepos = [
        { id: 1, origin: 'repo1' },
        { id: 2, origin: 'repo2' },
      ]
      // For getAllRepositories, we need to mock the query without where/limit
      mockFrom.mockReturnValueOnce(mockRepos)

      const result = await getAllRepositories()

      expect(result).toEqual(mockRepos)
      expect(mockSelect).toHaveBeenCalledWith({
        id: dbIndex.repositories.id,
        origin: dbIndex.repositories.origin,
      })
      expect(mockFrom).toHaveBeenCalledWith(dbIndex.repositories)
    })

    it('should return empty array when no repositories exist', async () => {
      mockFrom.mockReturnValueOnce([])

      const result = await getAllRepositories()

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database query failed')
      mockFrom.mockRejectedValueOnce(dbError)

      await expect(getAllRepositories()).rejects.toThrow(
        'Failed to fetch repositories.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching repositories:',
        dbError,
      )
    })
  })

  describe('updateRepository', () => {
    const updateData = { origin: 'updated-origin' }

    it('should update and return repository', async () => {
      const updatedRepo = { id: mockRepositoryId, origin: 'updated-origin' }
      mockUpdateReturning.mockResolvedValueOnce([updatedRepo])

      const result = await updateRepository(mockRepositoryId, updateData)

      expect(result).toEqual(updatedRepo)
      expect(mockUpdate).toHaveBeenCalledWith(dbIndex.repositories)
      expect(mockUpdateSet).toHaveBeenCalledWith(updateData)
      expect(mockUpdateWhere).toHaveBeenCalledWith(
        eq(dbIndex.repositories.id, mockRepositoryId),
      )
      expect(mockUpdateReturning).toHaveBeenCalledWith({
        id: dbIndex.repositories.id,
        origin: dbIndex.repositories.origin,
      })
    })

    it('should throw error when repository not found', async () => {
      mockUpdateReturning.mockResolvedValueOnce([])

      await expect(
        updateRepository(mockRepositoryId, updateData),
      ).rejects.toThrow('Failed to update repository.')
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database update failed')
      mockUpdateReturning.mockRejectedValueOnce(dbError)

      await expect(
        updateRepository(mockRepositoryId, updateData),
      ).rejects.toThrow('Failed to update repository.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating repository:',
        dbError,
      )
    })
  })

  describe('deleteRepository', () => {
    it('should delete repository successfully', async () => {
      mockDeleteReturning.mockResolvedValueOnce([{ id: mockRepositoryId }])

      await expect(deleteRepository(mockRepositoryId)).resolves.toBeUndefined()

      expect(mockDelete).toHaveBeenCalledWith(dbIndex.repositories)
      expect(mockDeleteWhere).toHaveBeenCalledWith(
        eq(dbIndex.repositories.id, mockRepositoryId),
      )
      expect(mockDeleteReturning).toHaveBeenCalledWith({
        id: dbIndex.repositories.id,
      })
    })

    it('should throw error when repository not found', async () => {
      mockDeleteReturning.mockResolvedValueOnce([])

      await expect(deleteRepository(mockRepositoryId)).rejects.toThrow(
        'Failed to delete repository.',
      )
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database delete failed')
      mockDeleteReturning.mockRejectedValueOnce(dbError)

      await expect(deleteRepository(mockRepositoryId)).rejects.toThrow(
        'Failed to delete repository.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting repository:',
        dbError,
      )
    })
  })
})
