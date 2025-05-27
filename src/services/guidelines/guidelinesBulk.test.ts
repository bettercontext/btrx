import { inArray } from 'drizzle-orm'
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
  bulkDeleteGuidelines,
  bulkUpdateGuidelinesState,
} from './guidelinesBulk'

vi.mock('@/db', async () => {
  const actualSchema = await vi.importActual('@/db/schema')

  const mockWhere = vi.fn()
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
  const mockFrom = vi.fn().mockReturnValue({
    leftJoin: mockLeftJoin,
    where: mockWhere,
  })
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

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

describe('guidelinesBulk service', () => {
  const mockGuidelineIds = [1, 2, 3]
  const mockContextId = 1
  const mockContextName = 'test-context'

  let mockSelect: Mock
  let mockFrom: Mock
  let mockLeftJoin: Mock
  let mockWhere: Mock
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
    mockWhere.mockResolvedValue([])
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

  describe('bulkUpdateGuidelinesState', () => {
    const mockExistingGuidelines = [
      {
        id: 1,
        content: 'Guideline 1',
        active: false,
        contextId: mockContextId,
        contextName: mockContextName,
      },
      {
        id: 2,
        content: 'Guideline 2',
        active: false,
        contextId: mockContextId,
        contextName: mockContextName,
      },
    ]

    const mockUpdatedResults = [
      {
        id: 1,
        content: 'Guideline 1',
        active: true,
        contextId: mockContextId,
      },
      {
        id: 2,
        content: 'Guideline 2',
        active: true,
        contextId: mockContextId,
      },
    ]

    it('should update guidelines state successfully', async () => {
      mockWhere.mockResolvedValueOnce(mockExistingGuidelines)
      mockUpdateReturning.mockResolvedValueOnce(mockUpdatedResults)

      const result = await bulkUpdateGuidelinesState([1, 2], true)

      expect(mockSelect).toHaveBeenCalledWith({
        id: dbIndex.guidelines.id,
        content: dbIndex.guidelines.content,
        active: dbIndex.guidelines.active,
        contextId: dbIndex.guidelines.contextId,
        contextName: dbIndex.guidelinesContexts.name,
      })
      expect(mockFrom).toHaveBeenCalledWith(dbIndex.guidelines)
      expect(mockLeftJoin).toHaveBeenCalledWith(
        dbIndex.guidelinesContexts,
        expect.any(Object),
      )
      expect(mockWhere).toHaveBeenCalledWith(
        inArray(dbIndex.guidelines.id, [1, 2]),
      )

      expect(mockUpdate).toHaveBeenCalledWith(dbIndex.guidelines)
      expect(mockUpdateSet).toHaveBeenCalledWith({ active: true })
      expect(mockUpdateWhere).toHaveBeenCalledWith(
        inArray(dbIndex.guidelines.id, [1, 2]),
      )

      expect(result).toEqual([
        {
          id: 1,
          content: 'Guideline 1',
          active: true,
          contextId: mockContextId,
          contextName: mockContextName,
        },
        {
          id: 2,
          content: 'Guideline 2',
          active: true,
          contextId: mockContextId,
          contextName: mockContextName,
        },
      ])
    })

    it('should throw error when ids array is empty', async () => {
      await expect(bulkUpdateGuidelinesState([], true)).rejects.toThrow(
        'At least one guideline ID is required.',
      )
    })

    it('should throw error when ids is not an array', async () => {
      await expect(
        bulkUpdateGuidelinesState(null as any, true),
      ).rejects.toThrow('At least one guideline ID is required.')

      await expect(
        bulkUpdateGuidelinesState(undefined as any, true),
      ).rejects.toThrow('At least one guideline ID is required.')

      await expect(
        bulkUpdateGuidelinesState('not-array' as any, true),
      ).rejects.toThrow('At least one guideline ID is required.')
    })

    it('should throw error when no guidelines found', async () => {
      mockWhere.mockResolvedValueOnce([])

      await expect(
        bulkUpdateGuidelinesState(mockGuidelineIds, true),
      ).rejects.toThrow('Failed to update guidelines state in bulk.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guidelines state in bulk:',
        expect.objectContaining({
          message: 'No guidelines found with the provided IDs.',
        }),
      )
    })

    it('should throw error when guideline has missing context data', async () => {
      const incompleteGuidelines = [
        {
          id: 1,
          content: 'Guideline 1',
          active: false,
          contextId: mockContextId,
          contextName: null,
        },
      ]
      const updatedResults = [
        {
          id: 1,
          content: 'Guideline 1',
          active: true,
          contextId: mockContextId,
        },
      ]

      mockWhere.mockResolvedValueOnce(incompleteGuidelines)
      mockUpdateReturning.mockResolvedValueOnce(updatedResults)

      await expect(bulkUpdateGuidelinesState([1], true)).rejects.toThrow(
        'Failed to update guidelines state in bulk.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guidelines state in bulk:',
        expect.objectContaining({
          message: 'Missing context data for guideline 1',
        }),
      )
    })

    it('should throw error when updated guideline not found in existing data', async () => {
      const existingGuidelines = [
        {
          id: 1,
          content: 'Guideline 1',
          active: false,
          contextId: mockContextId,
          contextName: mockContextName,
        },
      ]
      const updatedResults = [
        {
          id: 2, // Different ID
          content: 'Guideline 2',
          active: true,
          contextId: mockContextId,
        },
      ]

      mockWhere.mockResolvedValueOnce(existingGuidelines)
      mockUpdateReturning.mockResolvedValueOnce(updatedResults)

      await expect(bulkUpdateGuidelinesState([1], true)).rejects.toThrow(
        'Failed to update guidelines state in bulk.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guidelines state in bulk:',
        expect.objectContaining({
          message: 'Missing context data for guideline 2',
        }),
      )
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockWhere.mockRejectedValueOnce(dbError)

      await expect(
        bulkUpdateGuidelinesState(mockGuidelineIds, true),
      ).rejects.toThrow('Failed to update guidelines state in bulk.')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating guidelines state in bulk:',
        dbError,
      )
    })
  })

  describe('bulkDeleteGuidelines', () => {
    const mockExistingGuidelines = [
      {
        id: 1,
        content: 'Guideline 1',
        active: true,
        contextId: mockContextId,
        contextName: mockContextName,
      },
      {
        id: 2,
        content: 'Guideline 2',
        active: false,
        contextId: mockContextId,
        contextName: mockContextName,
      },
    ]

    const mockDeletedResults = [
      {
        id: 1,
        content: 'Guideline 1',
        active: true,
        contextId: mockContextId,
      },
      {
        id: 2,
        content: 'Guideline 2',
        active: false,
        contextId: mockContextId,
      },
    ]

    it('should delete guidelines successfully', async () => {
      mockWhere.mockResolvedValueOnce(mockExistingGuidelines)
      mockDeleteReturning.mockResolvedValueOnce(mockDeletedResults)

      const result = await bulkDeleteGuidelines([1, 2])

      expect(mockSelect).toHaveBeenCalledWith({
        id: dbIndex.guidelines.id,
        content: dbIndex.guidelines.content,
        active: dbIndex.guidelines.active,
        contextId: dbIndex.guidelines.contextId,
        contextName: dbIndex.guidelinesContexts.name,
      })
      expect(mockFrom).toHaveBeenCalledWith(dbIndex.guidelines)
      expect(mockLeftJoin).toHaveBeenCalledWith(
        dbIndex.guidelinesContexts,
        expect.any(Object),
      )
      expect(mockWhere).toHaveBeenCalledWith(
        inArray(dbIndex.guidelines.id, [1, 2]),
      )

      expect(mockDelete).toHaveBeenCalledWith(dbIndex.guidelines)
      expect(mockDeleteWhere).toHaveBeenCalledWith(
        inArray(dbIndex.guidelines.id, [1, 2]),
      )

      expect(result).toEqual([
        {
          id: 1,
          content: 'Guideline 1',
          active: true,
          contextId: mockContextId,
          contextName: mockContextName,
        },
        {
          id: 2,
          content: 'Guideline 2',
          active: false,
          contextId: mockContextId,
          contextName: mockContextName,
        },
      ])
    })

    it('should throw error when ids array is empty', async () => {
      await expect(bulkDeleteGuidelines([])).rejects.toThrow(
        'At least one guideline ID is required.',
      )
    })

    it('should throw error when ids is not an array', async () => {
      await expect(bulkDeleteGuidelines(null as any)).rejects.toThrow(
        'At least one guideline ID is required.',
      )

      await expect(bulkDeleteGuidelines(undefined as any)).rejects.toThrow(
        'At least one guideline ID is required.',
      )

      await expect(bulkDeleteGuidelines('not-array' as any)).rejects.toThrow(
        'At least one guideline ID is required.',
      )
    })

    it('should throw error when no guidelines found', async () => {
      mockWhere.mockResolvedValueOnce([])

      await expect(bulkDeleteGuidelines(mockGuidelineIds)).rejects.toThrow(
        'Failed to delete guidelines in bulk.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting guidelines in bulk:',
        expect.objectContaining({
          message: 'No guidelines found with the provided IDs.',
        }),
      )
    })

    it('should throw error when guideline has missing context data', async () => {
      const incompleteGuidelines = [
        {
          id: 1,
          content: 'Guideline 1',
          active: true,
          contextId: mockContextId,
          contextName: null,
        },
      ]
      const deletedResults = [
        {
          id: 1,
          content: 'Guideline 1',
          active: true,
          contextId: mockContextId,
        },
      ]

      mockWhere.mockResolvedValueOnce(incompleteGuidelines)
      mockDeleteReturning.mockResolvedValueOnce(deletedResults)

      await expect(bulkDeleteGuidelines([1])).rejects.toThrow(
        'Failed to delete guidelines in bulk.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting guidelines in bulk:',
        expect.objectContaining({
          message: 'Missing context data for guideline 1',
        }),
      )
    })

    it('should throw error when deleted guideline not found in existing data', async () => {
      const existingGuidelines = [
        {
          id: 1,
          content: 'Guideline 1',
          active: true,
          contextId: mockContextId,
          contextName: mockContextName,
        },
      ]
      const deletedResults = [
        {
          id: 2, // Different ID
          content: 'Guideline 2',
          active: true,
          contextId: mockContextId,
        },
      ]

      mockWhere.mockResolvedValueOnce(existingGuidelines)
      mockDeleteReturning.mockResolvedValueOnce(deletedResults)

      await expect(bulkDeleteGuidelines([1])).rejects.toThrow(
        'Failed to delete guidelines in bulk.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting guidelines in bulk:',
        expect.objectContaining({
          message: 'Missing context data for guideline 2',
        }),
      )
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockWhere.mockRejectedValueOnce(dbError)

      await expect(bulkDeleteGuidelines(mockGuidelineIds)).rejects.toThrow(
        'Failed to delete guidelines in bulk.',
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting guidelines in bulk:',
        dbError,
      )
    })
  })
})
