import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db, guidelinesContent, guidelinesContexts, repositories } from '@/db'
import { cleanTestDb } from '@/testing/helpers/testDb'

import {
  deleteRepository,
  findOrCreateRepositoryByPath,
  findRepositoryByPath,
  getAllRepositories,
  updateRepository,
} from './repositoryService'

describe('repositoryService', () => {
  const mockCurrentPath = '/test/project'
  const mockGitOriginUrl = 'git@github.com:test/repo.git'
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await cleanTestDb(db)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('findRepositoryByPath', () => {
    it('should find and return existing repository by git origin URL', async () => {
      // Create a repository in the database
      const [createdRepo] = await db
        .insert(repositories)
        .values({
          origin: mockGitOriginUrl,
        })
        .returning({ id: repositories.id })

      const result = await findRepositoryByPath(
        mockCurrentPath,
        mockGitOriginUrl,
      )

      expect(result).toEqual({ id: createdRepo.id })
    })

    it('should find and return existing repository by current path when no git URL', async () => {
      // Create a repository in the database
      const [createdRepo] = await db
        .insert(repositories)
        .values({
          origin: mockCurrentPath,
        })
        .returning({ id: repositories.id })

      const result = await findRepositoryByPath(mockCurrentPath, null)

      expect(result).toEqual({ id: createdRepo.id })
    })

    it('should return null when repository not found', async () => {
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
  })

  describe('findOrCreateRepositoryByPath', () => {
    it('should return existing repository when found', async () => {
      // Create a repository in the database
      const [createdRepo] = await db
        .insert(repositories)
        .values({
          origin: mockGitOriginUrl,
        })
        .returning({ id: repositories.id })

      const result = await findOrCreateRepositoryByPath(
        mockCurrentPath,
        mockGitOriginUrl,
      )

      expect(result).toEqual({ id: createdRepo.id })
    })

    it('should create new repository when not found using git origin URL', async () => {
      const result = await findOrCreateRepositoryByPath(
        mockCurrentPath,
        mockGitOriginUrl,
      )

      expect(result).toHaveProperty('id')
      expect(typeof result.id).toBe('number')
    })

    it('should create new repository when not found using current path', async () => {
      const result = await findOrCreateRepositoryByPath(mockCurrentPath, null)

      expect(result).toHaveProperty('id')
      expect(typeof result.id).toBe('number')
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
  })

  describe('getAllRepositories', () => {
    it('should return all repositories', async () => {
      // Create some repositories in the database
      await db
        .insert(repositories)
        .values([{ origin: 'repo1' }, { origin: 'repo2' }])

      const result = await getAllRepositories()

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('origin')
      expect(result[1]).toHaveProperty('id')
      expect(result[1]).toHaveProperty('origin')
    })

    it('should return empty array when no repositories exist', async () => {
      const result = await getAllRepositories()

      expect(result).toEqual([])
    })
  })

  describe('updateRepository', () => {
    const updateData = { origin: 'updated-origin' }

    it('should update and return repository', async () => {
      // Create a repository in the database
      const [createdRepo] = await db
        .insert(repositories)
        .values({
          origin: 'original-origin',
        })
        .returning({ id: repositories.id, origin: repositories.origin })

      const result = await updateRepository(createdRepo.id, updateData)

      expect(result).toEqual({
        id: createdRepo.id,
        origin: 'updated-origin',
      })
    })

    it('should throw error when repository not found', async () => {
      await expect(updateRepository(99999, updateData)).rejects.toThrow(
        'Failed to update repository.',
      )
    })
  })

  describe('deleteRepository', () => {
    it('should delete repository successfully', async () => {
      // Create a repository in the database
      const [createdRepo] = await db
        .insert(repositories)
        .values({
          origin: 'to-be-deleted',
        })
        .returning({ id: repositories.id })

      await expect(deleteRepository(createdRepo.id)).resolves.toBeUndefined()

      // Verify it was deleted
      const result = await getAllRepositories()
      expect(result).toEqual([])
    })

    it('should throw error when repository not found', async () => {
      await expect(deleteRepository(99999)).rejects.toThrow(
        'Repository not found.',
      )
    })

    it('should cascade delete all related guidelines_contexts and guidelines_content', async () => {
      // Create a repository
      const [createdRepo] = await db
        .insert(repositories)
        .values({
          origin: 'test-repo-with-guidelines',
        })
        .returning({ id: repositories.id })

      // Create guidelines contexts for this repository
      const [context1] = await db
        .insert(guidelinesContexts)
        .values({
          repositoryId: createdRepo.id,
          name: 'Frontend Context',
          prompt: 'Frontend guidelines prompt',
        })
        .returning({ id: guidelinesContexts.id })

      const [context2] = await db
        .insert(guidelinesContexts)
        .values({
          repositoryId: createdRepo.id,
          name: 'Backend Context',
          prompt: 'Backend guidelines prompt',
        })
        .returning({ id: guidelinesContexts.id })

      // Create guidelines content for these contexts
      await db.insert(guidelinesContent).values([
        {
          contextId: context1.id,
          content: 'Use TypeScript for all frontend code',
        },
        {
          contextId: context2.id,
          content: 'Use Node.js for backend services',
        },
      ])

      // Verify initial state - should have data
      const initialContexts = await db
        .select()
        .from(guidelinesContexts)
        .where(eq(guidelinesContexts.repositoryId, createdRepo.id))
      expect(initialContexts).toHaveLength(2)

      const initialContent = await db.select().from(guidelinesContent)
      expect(initialContent).toHaveLength(2)

      // Delete the repository
      await deleteRepository(createdRepo.id)

      // Verify repository was deleted
      const remainingRepos = await getAllRepositories()
      expect(remainingRepos).toEqual([])

      // Verify all guidelines_contexts were cascade deleted
      const remainingContexts = await db
        .select()
        .from(guidelinesContexts)
        .where(eq(guidelinesContexts.repositoryId, createdRepo.id))
      expect(remainingContexts).toEqual([])

      // Verify all guidelines_content were cascade deleted
      const remainingContent = await db.select().from(guidelinesContent)
      expect(remainingContent).toEqual([])
    })
  })
})
