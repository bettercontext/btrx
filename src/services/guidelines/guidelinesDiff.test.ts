import { beforeEach, describe, expect, it } from 'vitest'

import { db } from '@/db'
import {
  createTestContexts,
  createTestRepositories,
  TEST_REPOSITORY_DATA,
} from '@/testing/helpers/fixtures'
import { cleanTestDb } from '@/testing/helpers/testDb'

import {
  cancelPendingGuidelines,
  getContextsWithPendingVersions,
  getCurrentGuidelines,
  getGuidelinesDiff,
  saveCurrentGuidelines,
  validatePendingGuidelines,
} from './guidelinesDiff'

describe('Guidelines Diff Services', () => {
  let testRepositoryId: number
  let testContextId: number
  let testOtherContextId: number

  beforeEach(async () => {
    await cleanTestDb(db)

    // Create test repository
    const repositories = await createTestRepositories(db, [
      TEST_REPOSITORY_DATA.repo1,
    ])
    testRepositoryId = repositories[0].id

    // Create test contexts
    const contexts = await createTestContexts(db, testRepositoryId, [
      'coding',
      'documentation',
    ])
    testContextId = contexts[0].id
    testOtherContextId = contexts[1].id
  })

  describe('getContextsWithPendingVersions', () => {
    it('should return empty array when no pending versions exist', async () => {
      const contexts = await getContextsWithPendingVersions()
      expect(contexts).toEqual([])
    })

    it('should return contexts with pending versions', async () => {
      // Create initial guidelines
      await saveCurrentGuidelines(testContextId, 'initial guideline')
      // Create pending version
      await saveCurrentGuidelines(testContextId, 'updated guideline')

      const contexts = await getContextsWithPendingVersions()
      expect(contexts).toHaveLength(1)
      expect(contexts[0]).toEqual({
        id: testContextId,
        name: 'coding-standards',
        repositoryId: testRepositoryId,
      })
    })

    it('should not return contexts with only one version', async () => {
      // Create only initial guidelines
      await saveCurrentGuidelines(testContextId, 'initial guideline')

      const contexts = await getContextsWithPendingVersions()
      expect(contexts).toEqual([])
    })

    it('should return multiple contexts with pending versions', async () => {
      // Create pending versions for both contexts
      await saveCurrentGuidelines(testContextId, 'initial guideline 1')
      await saveCurrentGuidelines(testContextId, 'updated guideline 1')

      await saveCurrentGuidelines(testOtherContextId, 'initial guideline 2')
      await saveCurrentGuidelines(testOtherContextId, 'updated guideline 2')

      const contexts = await getContextsWithPendingVersions()
      expect(contexts).toHaveLength(2)
      expect(contexts.map((c) => c.id)).toContain(testContextId)
      expect(contexts.map((c) => c.id)).toContain(testOtherContextId)
    })
  })

  describe('getGuidelinesDiff', () => {
    it('should throw error when context does not exist', async () => {
      const nonExistentContextId = 99999
      await expect(getGuidelinesDiff(nonExistentContextId)).rejects.toThrow(
        `Context with ID ${nonExistentContextId} not found.`,
      )
    })

    it('should throw error when no pending version exists', async () => {
      await expect(getGuidelinesDiff(testContextId)).rejects.toThrow(
        `No pending version found for context ID ${testContextId}.`,
      )
    })

    it('should return diff between current and pending versions', async () => {
      // Create initial and pending versions
      await saveCurrentGuidelines(testContextId, 'original content\nline 2')
      await saveCurrentGuidelines(
        testContextId,
        'updated content\nline 2\nline 3',
      )

      const result = await getGuidelinesDiff(testContextId)

      expect(result.contextName).toBe('coding-standards')
      expect(result.diff).toBeDefined()
      expect(Array.isArray(result.diff)).toBe(true)

      // Check that diff contains changes
      const hasChanges = result.diff.some(
        (part: any) => part.added || part.removed,
      )
      expect(hasChanges).toBe(true)
    })

    it('should correctly identify unchanged lines when adding new content', async () => {
      // Test case from user: existing "Test 1", new ["Test 1", "Test 2"]
      // This case is adding a completely new guideline, so both should be present
      await saveCurrentGuidelines(testContextId, 'Test 1')
      await saveCurrentGuidelines(testContextId, 'Test 1\n-_-_-\nTest 2')

      const result = await getGuidelinesDiff(testContextId)

      expect(result.contextName).toBe('coding-standards')
      expect(result.diff).toBeDefined()
      expect(Array.isArray(result.diff)).toBe(true)

      // Should have exactly 2 parts: unchanged "Test 1" and added "Test 2"
      expect(result.diff).toHaveLength(2)

      // First part should be unchanged "Test 1"
      expect(result.diff[0]).toEqual({
        count: 1,
        value: ['Test 1'],
        added: false,
        removed: false,
      })

      // Second part should be added "Test 2"
      expect(result.diff[1]).toEqual({
        count: 1,
        value: ['Test 2'],
        added: true,
        removed: false,
      })
    })

    it('should correctly handle guidelines with separators', async () => {
      // Test with guidelines that use the -_-_- separator format
      await saveCurrentGuidelines(testContextId, 'Test 1\n-_-_-\nTest 2')
      await saveCurrentGuidelines(
        testContextId,
        'Test 1\n-_-_-\nTest 2\n-_-_-\nTest 3',
      )

      const result = await getGuidelinesDiff(testContextId)

      expect(result.contextName).toBe('coding-standards')
      expect(result.diff).toBeDefined()
      expect(Array.isArray(result.diff)).toBe(true)

      // Should have 2 parts: unchanged content and added "Test 3"
      expect(result.diff).toHaveLength(2)

      // First part should contain unchanged guidelines (without separators)
      expect(result.diff[0]).toEqual({
        count: 2,
        value: ['Test 1', 'Test 2'],
        added: false,
        removed: false,
      })

      // Second part should be added "Test 3"
      expect(result.diff[1]).toEqual({
        count: 1,
        value: ['Test 3'],
        added: true,
        removed: false,
      })
    })

    it('should correctly handle multi-line guideline modifications', async () => {
      // Test case: modifying a guideline to add line breaks
      // Before: ["Test 1", "Test 2", "Test 3"]
      // After: ["Test 1\nSaut de ligne", "Test 2", "Test 3"]
      await saveCurrentGuidelines(
        testContextId,
        'Test 1\n-_-_-\nTest 2\n-_-_-\nTest 3',
      )
      await saveCurrentGuidelines(
        testContextId,
        'Test 1\nSaut de ligne\n-_-_-\nTest 2\n-_-_-\nTest 3',
      )

      const result = await getGuidelinesDiff(testContextId)

      expect(result.contextName).toBe('coding-standards')
      expect(result.diff).toBeDefined()
      expect(Array.isArray(result.diff)).toBe(true)

      // Should have 3 parts: removed "Test 1", added "Test 1\nSaut de ligne", and unchanged others
      expect(result.diff).toHaveLength(3)

      // First part should be removed "Test 1"
      expect(result.diff[0]).toEqual({
        count: 1,
        value: ['Test 1'],
        added: false,
        removed: true,
      })

      // Second part should be added "Test 1\nSaut de ligne"
      expect(result.diff[1]).toEqual({
        count: 1,
        value: ['Test 1\nSaut de ligne'],
        added: true,
        removed: false,
      })

      // Third part should be unchanged "Test 2", "Test 3"
      expect(result.diff[2]).toEqual({
        count: 2,
        value: ['Test 2', 'Test 3'],
        added: false,
        removed: false,
      })
    })

    it('should prevent creating identical content versions', async () => {
      const content = 'same content\nline 2'
      await saveCurrentGuidelines(testContextId, content)

      // Should throw error when trying to save identical content
      await expect(
        saveCurrentGuidelines(testContextId, content),
      ).rejects.toThrow(
        'No changes detected. The new guidelines are identical to the existing ones.',
      )
    })
  })

  describe('validatePendingGuidelines', () => {
    it('should preserve disabled states during validation with complex changes', async () => {
      // Initial guidelines with mix of active/disabled
      await saveCurrentGuidelines(
        testContextId,
        'Active unchanged guideline\n-_-_-\n[DISABLED] Old disabled text\n-_-_-\n[DISABLED] Stays disabled unchanged',
      )

      // Updated guidelines:
      // - First one unchanged (active)
      // - Second one modified but should stay disabled
      // - Third new one
      // - Fourth one unchanged (disabled)
      // - Fifth one modified (active)
      // - Sixth one new
      await saveCurrentGuidelines(
        testContextId,
        'Active unchanged guideline\n-_-_-\nNew disabled text\n-_-_-\nBrand new guideline\n-_-_-\n[DISABLED] Stays disabled unchanged\n-_-_-\nModified active guideline\n-_-_-\nAnother new guideline',
      )

      // Validate the changes
      await validatePendingGuidelines(testContextId)

      // Get the final content and verify states are preserved
      const finalContent = await getCurrentGuidelines(testContextId)
      expect(finalContent).toBe(
        'Active unchanged guideline\n-_-_-\n' +
          '[DISABLED] New disabled text\n-_-_-\n' +
          'Brand new guideline\n-_-_-\n' +
          '[DISABLED] Stays disabled unchanged\n-_-_-\n' +
          'Modified active guideline\n-_-_-\n' +
          'Another new guideline',
      )
    })

    it('should throw error when no pending version exists', async () => {
      await expect(validatePendingGuidelines(testContextId)).rejects.toThrow(
        `No pending version to validate for context ID ${testContextId}.`,
      )
    })

    it('should validate pending version and remove old current version', async () => {
      // Create initial and pending versions
      await saveCurrentGuidelines(testContextId, 'initial content')
      await saveCurrentGuidelines(testContextId, 'updated content')

      // Validate pending version
      await validatePendingGuidelines(testContextId)

      // Should no longer have pending versions
      const contextsWithPending = await getContextsWithPendingVersions()
      expect(contextsWithPending).toEqual([])

      // Should not be able to get diff anymore
      await expect(getGuidelinesDiff(testContextId)).rejects.toThrow(
        'No pending version found',
      )
    })

    it('should handle single version case', async () => {
      // Only create initial version
      await saveCurrentGuidelines(testContextId, 'initial content')

      await expect(validatePendingGuidelines(testContextId)).rejects.toThrow(
        `No pending version to validate for context ID ${testContextId}.`,
      )
    })
  })

  describe('cancelPendingGuidelines', () => {
    it('should throw error when no pending version exists', async () => {
      await expect(cancelPendingGuidelines(testContextId)).rejects.toThrow(
        `No pending version to cancel for context ID ${testContextId}.`,
      )
    })

    it('should cancel pending version and keep current version', async () => {
      // Create initial and pending versions
      await saveCurrentGuidelines(testContextId, 'initial content')
      await saveCurrentGuidelines(testContextId, 'updated content')

      // Cancel pending version
      await cancelPendingGuidelines(testContextId)

      // Should no longer have pending versions
      const contextsWithPending = await getContextsWithPendingVersions()
      expect(contextsWithPending).toEqual([])

      // Should not be able to get diff anymore
      await expect(getGuidelinesDiff(testContextId)).rejects.toThrow(
        'No pending version found',
      )
    })

    it('should handle single version case', async () => {
      // Only create initial version
      await saveCurrentGuidelines(testContextId, 'initial content')

      await expect(cancelPendingGuidelines(testContextId)).rejects.toThrow(
        `No pending version to cancel for context ID ${testContextId}.`,
      )
    })
  })

  describe('saveCurrentGuidelines with diff logic', () => {
    it('should create new entry when no existing version', async () => {
      await saveCurrentGuidelines(testContextId, 'new content')

      // Should not have pending versions yet
      const contextsWithPending = await getContextsWithPendingVersions()
      expect(contextsWithPending).toEqual([])
    })

    it('should create pending version when existing version present', async () => {
      // Create initial version
      await saveCurrentGuidelines(testContextId, 'initial content')
      // Create pending version
      await saveCurrentGuidelines(testContextId, 'updated content')

      // Should have pending version
      const contextsWithPending = await getContextsWithPendingVersions()
      expect(contextsWithPending).toHaveLength(1)
      expect(contextsWithPending[0].id).toBe(testContextId)
    })

    it('should reject when trying to save identical content', async () => {
      const content = 'identical content'

      // Create initial version
      await saveCurrentGuidelines(testContextId, content)

      // Try to save identical content
      await expect(
        saveCurrentGuidelines(testContextId, content),
      ).rejects.toThrow(
        'No changes detected. The new guidelines are identical to the existing ones.',
      )

      // Should not have pending versions
      const contextsWithPending = await getContextsWithPendingVersions()
      expect(contextsWithPending).toEqual([])
    })

    it('should reject when trying to create third version', async () => {
      // Create initial and pending versions
      await saveCurrentGuidelines(testContextId, 'initial content')
      await saveCurrentGuidelines(testContextId, 'pending content')

      // Try to create third version
      await expect(
        saveCurrentGuidelines(testContextId, 'third content'),
      ).rejects.toThrow(
        'A diff is already in progress for this context. Please validate or cancel the existing diff before continuing.',
      )
    })
  })
})
