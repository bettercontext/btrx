import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db'
import {
  createTestContexts,
  createTestRepositories,
  TEST_REPOSITORY_DATA,
} from '@/testing/helpers/fixtures'
import { cleanTestDb } from '@/testing/helpers/testDb'

import {
  createGuidelineByContextId,
  getGuidelinesForRepositoryById,
} from './guidelines'
import {
  bulkDeleteGuidelines,
  bulkUpdateGuidelinesState,
} from './guidelinesBulk'

vi.mock('@/services/repositoryService', () => ({
  findOrCreateRepositoryByPath: vi.fn(),
  findRepositoryByPath: vi.fn(),
}))

describe('guidelinesBulk service (with in-memory database)', () => {
  let testRepositoryId: number
  let testContextId: number

  beforeEach(async () => {
    await cleanTestDb(db)

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

  describe('bulkUpdateGuidelinesState', () => {
    it('should update multiple guidelines state in text', async () => {
      // Create multiple guidelines
      const guideline1 = await createGuidelineByContextId(
        'First guideline',
        testContextId,
      )

      const guideline2 = await createGuidelineByContextId(
        'Second guideline',
        testContextId,
      )

      // Activate both guidelines
      const updated = await bulkUpdateGuidelinesState(
        [guideline1.id, guideline2.id],
        true,
      )

      expect(updated).toHaveLength(2)
      expect(updated[0]).toMatchObject({
        content: 'First guideline',
        active: true,
        contextName: 'coding-standards',
      })
      expect(updated[1]).toMatchObject({
        content: 'Second guideline',
        active: true,
        contextName: 'coding-standards',
      })

      // Verify in database - both should be active (no "// " prefix)
      const { guidelinesContent } = await import('@/db/schema')
      const { eq } = await import('drizzle-orm')

      const contentRows = await db
        .select()
        .from(guidelinesContent)
        .where(eq(guidelinesContent.contextId, testContextId))

      expect(contentRows[0].content).toBe('First guideline\nSecond guideline')
    })

    it('should throw error when no guidelines found', async () => {
      await expect(bulkUpdateGuidelinesState([999999], true)).rejects.toThrow(
        'Guideline with ID 999999 not found.',
      )
    })

    it('should throw error when IDs array is empty', async () => {
      await expect(bulkUpdateGuidelinesState([], true)).rejects.toThrow(
        'At least one guideline ID is required.',
      )
    })
  })

  describe('bulkDeleteGuidelines', () => {
    it('should delete multiple guidelines from text', async () => {
      // Create multiple guidelines
      const guideline1 = await createGuidelineByContextId(
        'To delete 1',
        testContextId,
      )

      const guideline2 = await createGuidelineByContextId(
        'To delete 2',
        testContextId,
      )

      const guideline3 = await createGuidelineByContextId(
        'To keep',
        testContextId,
      )

      // Delete first two guidelines
      const deleted = await bulkDeleteGuidelines([guideline1.id, guideline2.id])

      expect(deleted).toHaveLength(2)
      expect(deleted[0]).toMatchObject({
        content: 'To delete 1',
        contextName: 'coding-standards',
      })
      expect(deleted[1]).toMatchObject({
        content: 'To delete 2',
        contextName: 'coding-standards',
      })

      // Verify in database - only the third guideline should remain
      const { guidelinesContent } = await import('@/db/schema')
      const { eq } = await import('drizzle-orm')

      const contentRows = await db
        .select()
        .from(guidelinesContent)
        .where(eq(guidelinesContent.contextId, testContextId))

      expect(contentRows[0].content).toBe('// To keep')

      // Also verify that guideline3 still exists and can be retrieved
      const remainingGuidelines =
        await getGuidelinesForRepositoryById(testRepositoryId)
      expect(remainingGuidelines).toHaveLength(1)
      expect(remainingGuidelines[0]).toMatchObject({
        content: 'To keep',
        active: false,
        contextName: 'coding-standards',
      })
      // Note: ID should remain the same because virtual IDs are based on content,
      // not line positions
      expect(remainingGuidelines[0].id).toBe(guideline3.id)
      expect(remainingGuidelines[0].id).toBeTypeOf('number')
    })

    it('should throw error when no guidelines found', async () => {
      await expect(bulkDeleteGuidelines([999999])).rejects.toThrow(
        'Guideline with ID 999999 not found.',
      )
    })

    it('should throw error when IDs array is empty', async () => {
      await expect(bulkDeleteGuidelines([])).rejects.toThrow(
        'At least one guideline ID is required.',
      )
    })
  })

  describe('cross-context operations', () => {
    it('should handle guidelines from different contexts', async () => {
      const { guidelinesContexts } = await import('@/db/schema')

      // Create second context
      const [context2] = await db
        .insert(guidelinesContexts)
        .values({
          repositoryId: testRepositoryId,
          name: 'second-context',
          prompt: 'Second prompt',
        })
        .returning()

      // Mock for second context
      const { findOrCreateRepositoryByPath } = await import(
        '@/services/repositoryService'
      )
      vi.mocked(findOrCreateRepositoryByPath).mockImplementation(
        (_path, _origin) => {
          return Promise.resolve({ id: testRepositoryId })
        },
      )

      // Create guidelines in both contexts
      const guideline1 = await createGuidelineByContextId(
        'Context 1 guideline',
        testContextId,
      )

      const guideline2 = await createGuidelineByContextId(
        'Context 2 guideline',
        context2.id,
      )

      // Update both
      const updated = await bulkUpdateGuidelinesState(
        [guideline1.id, guideline2.id],
        true,
      )

      expect(updated).toHaveLength(2)
      expect(
        updated.find((g) => g.contextName === 'coding-standards'),
      ).toBeTruthy()
      expect(
        updated.find((g) => g.contextName === 'second-context'),
      ).toBeTruthy()

      // Verify both contexts were updated
      const { guidelinesContent } = await import('@/db/schema')
      const { eq } = await import('drizzle-orm')

      const content1 = await db
        .select()
        .from(guidelinesContent)
        .where(eq(guidelinesContent.contextId, testContextId))

      const content2 = await db
        .select()
        .from(guidelinesContent)
        .where(eq(guidelinesContent.contextId, context2.id))

      expect(content1[0].content).toBe('Context 1 guideline')
      expect(content2[0].content).toBe('Context 2 guideline')
    })
  })
})
