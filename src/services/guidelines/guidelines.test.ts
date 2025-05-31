import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createTestContexts,
  createTestRepositories,
  TEST_REPOSITORY_DATA,
} from '@/testing/helpers/fixtures'
import { setupTestDbHooks } from '@/testing/helpers/testUtils'

import {
  createGuideline,
  deleteGuideline,
  getGuidelinesForRepositoryById,
  updateGuidelineContent,
  updateGuidelineState,
} from './guidelines'

let testDbInstance: any = null

vi.mock('@/db', async () => {
  return {
    get db() {
      if (!testDbInstance) {
        throw new Error('Test database not initialized')
      }
      return testDbInstance
    },
    ...(await import('@/db/schema')),
  }
})

vi.mock('@/services/repositoryService', () => ({
  findOrCreateRepositoryByPath: vi.fn(),
  findRepositoryByPath: vi.fn(),
}))

describe('guidelines service (with in-memory database)', () => {
  const { getDb } = setupTestDbHooks()
  let testRepositoryId: number
  let testContextId: number

  beforeEach(async () => {
    const db = getDb()
    if (!db) throw new Error('Test database not available')
    testDbInstance = db

    const repositories = await createTestRepositories(db, [
      TEST_REPOSITORY_DATA.repo1,
    ])
    const contexts = await createTestContexts(db, repositories[0].id, [
      'coding',
    ])

    testRepositoryId = repositories[0].id
    testContextId = contexts[0].id

    const { findOrCreateRepositoryByPath, findRepositoryByPath } = await import(
      '@/services/repositoryService'
    )

    vi.mocked(findOrCreateRepositoryByPath).mockResolvedValue({
      id: testRepositoryId,
    })

    vi.mocked(findRepositoryByPath).mockResolvedValue({
      id: testRepositoryId,
    })
  })

  describe('createGuideline', () => {
    it('should create a new guideline and store it as text', async () => {
      const guideline = await createGuideline(
        'Test guideline content',
        'coding-standards',
        '/test/path',
        TEST_REPOSITORY_DATA.repo1,
      )

      expect(guideline).toMatchObject({
        content: 'Test guideline content',
        active: false,
        contextId: testContextId,
        contextName: 'coding-standards',
      })
      expect(guideline.id).toBeTypeOf('number')
    })

    it('should prevent duplicate guidelines', async () => {
      await createGuideline(
        'Duplicate content',
        'coding-standards',
        '/test/path',
        TEST_REPOSITORY_DATA.repo1,
      )

      await expect(
        createGuideline(
          'Duplicate content',
          'coding-standards',
          '/test/path',
          TEST_REPOSITORY_DATA.repo1,
        ),
      ).rejects.toThrow('This guideline already exists for the given context.')
    })
  })

  describe('getGuidelinesForRepositoryById', () => {
    it('should return empty array when no guidelines exist', async () => {
      const guidelines = await getGuidelinesForRepositoryById(testRepositoryId)
      expect(guidelines).toEqual([])
    })

    it('should parse and return guidelines from text content', async () => {
      await createGuideline(
        'Active guideline',
        'coding-standards',
        '/test/path',
        TEST_REPOSITORY_DATA.repo1,
      )

      await createGuideline(
        'Inactive guideline',
        'coding-standards',
        '/test/path',
        TEST_REPOSITORY_DATA.repo1,
      )

      await createGuideline(
        'Another active',
        'coding-standards',
        '/test/path',
        TEST_REPOSITORY_DATA.repo1,
      )

      const guidelines = await getGuidelinesForRepositoryById(testRepositoryId)

      expect(guidelines).toHaveLength(3)
      expect(guidelines[0]).toMatchObject({
        content: 'Another active',
        active: false,
        contextName: 'coding-standards',
      })
      expect(guidelines[1]).toMatchObject({
        content: 'Inactive guideline',
        active: false,
        contextName: 'coding-standards',
      })
      expect(guidelines[2]).toMatchObject({
        content: 'Active guideline',
        active: false,
        contextName: 'coding-standards',
      })
    })
  })

  describe('updateGuidelineState', () => {
    it('should toggle guideline state in text', async () => {
      const created = await createGuideline(
        'Test toggle',
        'coding-standards',
        '/test/path',
        TEST_REPOSITORY_DATA.repo1,
      )

      const updated = await updateGuidelineState(created.id, true)
      expect(updated.active).toBe(true)
      expect(updated.content).toBe('Test toggle')
    })
  })

  describe('updateGuidelineContent', () => {
    it('should update guideline content in text', async () => {
      const created = await createGuideline(
        'Original content',
        'coding-standards',
        '/test/path',
        TEST_REPOSITORY_DATA.repo1,
      )

      const updated = await updateGuidelineContent(
        created.id,
        'Updated content',
      )
      expect(updated.content).toBe('Updated content')
      expect(updated.contextId).toBe(testContextId)
    })
  })

  describe('deleteGuideline', () => {
    it('should remove guideline from text', async () => {
      const created = await createGuideline(
        'To be deleted',
        'coding-standards',
        '/test/path',
        TEST_REPOSITORY_DATA.repo1,
      )

      const deleted = await deleteGuideline(created.id)
      expect(deleted.content).toBe('To be deleted')

      const remaining = await getGuidelinesForRepositoryById(testRepositoryId)
      expect(remaining).toHaveLength(0)
    })
  })
})
