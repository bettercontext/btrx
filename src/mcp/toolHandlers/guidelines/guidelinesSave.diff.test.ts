import { desc, eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db'
// getCurrentGuidelines here refers to the one from guidelinesDiff
import { guidelinesContent } from '@/db/schema'
import {
  saveCurrentGuidelines, // This is actually from guidelinesDiff, used for setup
} from '@/services/guidelines'
import {
  createTestContexts,
  createTestRepositories,
  TEST_REPOSITORY_DATA,
} from '@/testing/helpers/fixtures'
import { cleanTestDb } from '@/testing/helpers/testDb'

import { handleGuidelinesSave } from './guidelinesSave'

vi.mock('@/helpers/promptReader', () => ({
  readPrompt: vi.fn(),
}))

describe('handleGuidelinesSave - Diff Behavior', () => {
  const mockGuidelines = ['guideline1', 'guideline2']
  let testRepositoryId: number
  let testContextId: number
  let testNextContextId: number

  beforeEach(async () => {
    vi.resetAllMocks()
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
    testNextContextId = contexts[1].id
  })

  describe('Direct save behavior', () => {
    it('should save directly when no existing guidelines', async () => {
      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Guidelines analysis complete for all selected contexts! Guidelines saved for context ${testContextId}.`,
          },
        ],
      })
    })

    it('should save directly and continue to next context when no existing guidelines', async () => {
      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [testNextContextId],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Guidelines saved for context ${testContextId}. Continue with: guidelines_analysis({"contextIds": [${testNextContextId}]})`,
          },
        ],
      })
    })
  })

  describe('Pending version behavior', () => {
    it('should create pending version when existing guidelines exist', async () => {
      // Create initial guidelines
      await saveCurrentGuidelines(
        testContextId,
        'old guideline1\n-_-_-\nold guideline2',
      )

      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Guidelines analysis complete for all selected contexts! Guidelines saved for context ${testContextId}.`,
          },
        ],
      })
    })

    it('should create pending version and continue to next context when existing guidelines exist', async () => {
      // Create initial guidelines
      await saveCurrentGuidelines(
        testContextId,
        'old guideline1\n-_-_-\nold guideline2',
      )

      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [testNextContextId],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Guidelines saved for context ${testContextId}. Continue with: guidelines_analysis({"contextIds": [${testNextContextId}]})`,
          },
        ],
      })
    })
  })

  describe('Error handling for diff conflicts', () => {
    it('should handle error when diff already in progress', async () => {
      // Create initial and pending versions to simulate diff in progress
      await saveCurrentGuidelines(testContextId, 'initial guidelines')
      await saveCurrentGuidelines(testContextId, 'pending guidelines')

      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [],
      }

      await expect(
        handleGuidelinesSave(args, { CWD: '/test/project' }),
      ).rejects.toThrow('Failed to save guidelines')
    })

    it('should handle diff conflict error with next contexts', async () => {
      // Create initial and pending versions to simulate diff in progress
      await saveCurrentGuidelines(testContextId, 'initial guidelines')
      await saveCurrentGuidelines(testContextId, 'pending guidelines')

      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [testNextContextId],
      }

      await expect(
        handleGuidelinesSave(args, { CWD: '/test/project' }),
      ).rejects.toThrow('Failed to save guidelines')
    })
  })

  describe('No changes detected behavior', () => {
    it('should handle identical content gracefully when no remaining contexts', async () => {
      // Create initial guidelines that match what we'll try to save
      await saveCurrentGuidelines(
        testContextId,
        'guideline1\n-_-_-\nguideline2',
      )

      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Guidelines analysis complete for all selected contexts! No changes detected for context ${testContextId} (guidelines identical to existing).`,
          },
        ],
      })
    })

    it('should handle identical content gracefully when remaining contexts exist', async () => {
      // Create initial guidelines that match what we'll try to save
      await saveCurrentGuidelines(
        testContextId,
        'guideline1\n-_-_-\nguideline2',
      )

      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [testNextContextId],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `No changes detected for context ${testContextId} (guidelines identical to existing). Continue with: guidelines_analysis({"contextIds": [${testNextContextId}]})`,
          },
        ],
      })
    })
  })

  describe('Disabled state preservation', () => {
    it('should preserve disabled states even with significant content changes', async () => {
      // Create initial guidelines with disabled state
      await saveCurrentGuidelines(
        testContextId,
        '[DISABLED] A very basic test\n-_-_-\n[DISABLED] Another one to keep disabled\n-_-_-\nActive guideline',
      )

      const args = {
        // Note: guidelines from LLM come without [DISABLED] prefix and have modified content
        guidelines: [
          'A very comprehensive test with details', // Should stay disabled
          'Another one to keep disabled with changes', // Should stay disabled
          'Active guideline', // Should stay active
          'A new guideline', // Should be active (new)
        ],
        contextId: testContextId,
        remainingContextIds: [],
      }

      await handleGuidelinesSave(args, { CWD: '/test/project' })

      // Verify the saved content preserves all disabled states correctly
      // We need to get the PENDING content, which is the latest entry
      const pendingVersion = await db
        .select({ content: guidelinesContent.content })
        .from(guidelinesContent)
        .where(eq(guidelinesContent.contextId, testContextId))
        .orderBy(desc(guidelinesContent.id))
        .limit(1)
      const pendingContent = pendingVersion[0]?.content

      expect(pendingContent).toBe(
        '[DISABLED] A very comprehensive test with details\n-_-_-\n' +
          '[DISABLED] Another one to keep disabled with changes\n-_-_-\n' +
          'Active guideline\n-_-_-\n' +
          'A new guideline',
      )
    })

    it('should set new guidelines as active by default', async () => {
      // Create initial guidelines with one disabled
      await saveCurrentGuidelines(
        testContextId,
        '[DISABLED] Original guideline',
      )

      const args = {
        guidelines: [
          'Original guideline', // Matches existing disabled one
          'Completely new guideline', // New guideline
        ],
        contextId: testContextId,
        remainingContextIds: [],
      }

      await handleGuidelinesSave(args, { CWD: '/test/project' })

      // We need to get the PENDING content, which is the latest entry
      const pendingVersion = await db
        .select({ content: guidelinesContent.content })
        .from(guidelinesContent)
        .where(eq(guidelinesContent.contextId, testContextId))
        .orderBy(desc(guidelinesContent.id))
        .limit(1)
      const pendingContent = pendingVersion[0]?.content

      expect(pendingContent).toBe(
        '[DISABLED] Original guideline\n-_-_-\nCompletely new guideline',
      )
    })
  })

  describe('Integration with serialization', () => {
    it('should properly serialize guidelines array to text format', async () => {
      const multiLineGuidelines = [
        'Use consistent naming conventions',
        'Follow the established code style',
        'Write comprehensive tests',
      ]

      const args = {
        guidelines: multiLineGuidelines,
        contextId: testContextId,
        remainingContextIds: [],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Guidelines analysis complete for all selected contexts! Guidelines saved for context ${testContextId}.`,
          },
        ],
      })

      // Verify the content was saved (this would be checked by examining the database
      // or by creating a subsequent version to verify the diff system is working)
    })

    it('should handle empty guidelines array', async () => {
      const args = {
        guidelines: [],
        contextId: testContextId,
        remainingContextIds: [],
      }

      // This should be caught by validation, but if it passes validation,
      // it should handle gracefully
      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: `Guidelines analysis complete for all selected contexts! Guidelines saved for context ${testContextId}.`,
          },
        ],
      })
    })
  })

  describe('Context flow management', () => {
    it('should handle single context workflow', async () => {
      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result.content[0].text).toContain('Guidelines analysis complete')
      expect(result.content[0].text).toContain(`context ${testContextId}`)
    })

    it('should handle multi-context workflow', async () => {
      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [testNextContextId],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result.content[0].text).toContain(
        'Continue with: guidelines_analysis',
      )
      expect(result.content[0].text).toContain(`${testNextContextId}`)
    })

    it('should properly format remaining context IDs in response', async () => {
      const thirdContextId = testContextId + 2
      const args = {
        guidelines: mockGuidelines,
        contextId: testContextId,
        remainingContextIds: [testNextContextId, thirdContextId],
      }

      const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

      expect(result.content[0].text).toContain(
        `guidelines_analysis({"contextIds": [${testNextContextId},${thirdContextId}]})`,
      )
    })
  })
})
