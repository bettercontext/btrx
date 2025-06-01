import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as repositoryService from '@/services/repositoryService'
import { db } from '@/db'
import {
  createTestRepositories,
  TEST_REPOSITORY_DATA,
} from '@/testing/helpers/fixtures'
import { cleanTestDb } from '@/testing/helpers/testDb'

import {
  createGuidelinesContext,
  deleteGuidelinesContext,
  getGuidelinesContexts,
  updateGuidelinesContext,
} from './guidelinesContexts'

vi.mock('@/services/repositoryService', () => ({
  findOrCreateRepositoryByPath: vi.fn(),
}))

describe('guidelinesContexts service', () => {
  const mockRepositoryPath = '/test/project'
  const mockGitOriginUrl = 'git@github.com:test/repo.git'
  const mockContextName = 'test-context'
  const mockContextPrompt = 'Test context prompt'
  let testRepositoryId: number

  beforeEach(async () => {
    vi.resetAllMocks()

    await cleanTestDb(db)

    // Create a test repository
    const repositories = await createTestRepositories(db, [
      TEST_REPOSITORY_DATA.repo1,
    ])
    testRepositoryId = repositories[0].id

    // Mock repository service to return our test repository
    vi.mocked(repositoryService.findOrCreateRepositoryByPath).mockResolvedValue(
      {
        id: testRepositoryId,
      },
    )
  })

  describe('getGuidelinesContexts', () => {
    it('should fetch contexts for existing repository', async () => {
      const result = await getGuidelinesContexts(
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, mockGitOriginUrl)

      expect(result).toEqual({
        contexts: [],
        repositoryId: testRepositoryId,
      })
    })

    it('should handle null gitOriginUrl', async () => {
      await getGuidelinesContexts(mockRepositoryPath, null)

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, null)
    })

    it('should return empty contexts array when no contexts found', async () => {
      const result = await getGuidelinesContexts(
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      expect(result).toEqual({
        contexts: [],
        repositoryId: testRepositoryId,
      })
    })
  })

  describe('createGuidelinesContext', () => {
    it('should create context successfully', async () => {
      const result = await createGuidelinesContext(
        mockContextName,
        mockContextPrompt,
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, mockGitOriginUrl)

      expect(result).toHaveProperty('id')
      expect(result.name).toBe(mockContextName)
      expect(result.prompt).toBe(mockContextPrompt)
      expect(result.repositoryId).toBe(testRepositoryId)
    })

    it('should handle null gitOriginUrl', async () => {
      await createGuidelinesContext(
        'another-context',
        'Another prompt',
        mockRepositoryPath,
        null,
      )

      expect(
        repositoryService.findOrCreateRepositoryByPath,
      ).toHaveBeenCalledWith(mockRepositoryPath, null)
    })
  })

  describe('updateGuidelinesContext', () => {
    it('should update context successfully', async () => {
      // First create a context to update
      const createdContext = await createGuidelinesContext(
        'original-name',
        'Original prompt',
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      const result = await updateGuidelinesContext(
        createdContext.id,
        'updated-name',
        'Updated prompt',
      )

      expect(result.id).toBe(createdContext.id)
      expect(result.name).toBe('updated-name')
      expect(result.prompt).toBe('Updated prompt')
      expect(result.repositoryId).toBe(testRepositoryId)
    })

    it('should throw error when context not found', async () => {
      await expect(
        updateGuidelinesContext(99999, 'new-name', 'New prompt'),
      ).rejects.toThrow('Failed to update guidelines context.')
    })
  })

  describe('deleteGuidelinesContext', () => {
    it('should delete context successfully', async () => {
      // First create a context to delete
      const createdContext = await createGuidelinesContext(
        'to-delete',
        'To be deleted',
        mockRepositoryPath,
        mockGitOriginUrl,
      )

      await expect(
        deleteGuidelinesContext(createdContext.id),
      ).resolves.toBeUndefined()
    })

    it('should throw error when context not found', async () => {
      await expect(deleteGuidelinesContext(99999)).rejects.toThrow(
        'Failed to delete guidelines context.',
      )
    })
  })
})
