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
  deleteGuideline,
  getGuidelinesForRepositoryById,
  updateGuidelineContent,
  updateGuidelineState,
} from './guidelines'

vi.mock('@/services/repositoryService', () => ({
  findOrCreateRepositoryByPath: vi.fn(),
  findRepositoryByPath: vi.fn(),
}))

describe('guidelines service (with in-memory database)', () => {
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

  describe('createGuidelineByContextId', () => {
    it('should create a new guideline and store it as text', async () => {
      const guideline = await createGuidelineByContextId(
        'Test guideline content',
        testContextId,
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
      await createGuidelineByContextId('Duplicate content', testContextId)

      await expect(
        createGuidelineByContextId('Duplicate content', testContextId),
      ).rejects.toThrow('This guideline already exists for the given context.')
    })

    it('should normalize guideline content and prevent duplicates with different formats', async () => {
      await createGuidelineByContextId('Test rule', testContextId)

      // These should all be considered duplicates
      await expect(
        createGuidelineByContextId('// Test rule', testContextId),
      ).rejects.toThrow('This guideline already exists for the given context.')

      await expect(
        createGuidelineByContextId('  Test rule  ', testContextId),
      ).rejects.toThrow('This guideline already exists for the given context.')

      await expect(
        createGuidelineByContextId('//  Test rule  ', testContextId),
      ).rejects.toThrow('This guideline already exists for the given context.')
    })

    it('should normalize content when adding guidelines', async () => {
      const guideline = await createGuidelineByContextId(
        '// Test normalized content  ',
        testContextId,
      )

      expect(guideline.content).toBe('Test normalized content')
    })
  })

  describe('getGuidelinesForRepositoryById', () => {
    it('should return empty array when no guidelines exist', async () => {
      const guidelines = await getGuidelinesForRepositoryById(testRepositoryId)
      expect(guidelines).toEqual([])
    })

    it('should parse and return guidelines from text content', async () => {
      await createGuidelineByContextId('Active guideline', testContextId)

      await createGuidelineByContextId('Inactive guideline', testContextId)

      await createGuidelineByContextId('Another active', testContextId)

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
      const created = await createGuidelineByContextId(
        'Test toggle',
        testContextId,
      )

      const updated = await updateGuidelineState(created.id, true)
      expect(updated.active).toBe(true)
      expect(updated.content).toBe('Test toggle')
    })
  })

  describe('updateGuidelineContent', () => {
    it('should update guideline content in text', async () => {
      const created = await createGuidelineByContextId(
        'Original content',
        testContextId,
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
      const created = await createGuidelineByContextId(
        'To be deleted',
        testContextId,
      )

      const deleted = await deleteGuideline(created.id)
      expect(deleted.content).toBe('To be deleted')

      const remaining = await getGuidelinesForRepositoryById(testRepositoryId)
      expect(remaining).toHaveLength(0)
    })

    it('should work with stable virtual IDs after multiple operations', async () => {
      // Create multiple guidelines
      const guideline1 = await createGuidelineByContextId(
        'Rule 1',
        testContextId,
      )
      const guideline2 = await createGuidelineByContextId(
        'Rule 2',
        testContextId,
      )
      const guideline3 = await createGuidelineByContextId(
        'Rule 3',
        testContextId,
      )

      // Delete the middle one
      await deleteGuideline(guideline2.id)

      // Verify the other two still exist and can be deleted by their IDs
      let remaining = await getGuidelinesForRepositoryById(testRepositoryId)
      expect(remaining).toHaveLength(2)

      // Delete guideline 3 - this should work even though line numbers have shifted
      await deleteGuideline(guideline3.id)

      remaining = await getGuidelinesForRepositoryById(testRepositoryId)
      expect(remaining).toHaveLength(1)
      expect(remaining[0].content).toBe('Rule 1')

      // Delete the last one
      await deleteGuideline(guideline1.id)

      remaining = await getGuidelinesForRepositoryById(testRepositoryId)
      expect(remaining).toHaveLength(0)
    })
  })
})
