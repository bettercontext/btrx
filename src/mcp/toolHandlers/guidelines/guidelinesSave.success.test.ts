import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db'
import { saveCurrentGuidelines } from '@/services/guidelines'
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

describe('handleGuidelinesSave - Success Scenarios', () => {
  const mockGuidelines = ['guideline1', 'guideline2']
  let testRepositoryId: number
  let testContextId: number
  let testNextContextId: number
  let testLastContextId: number

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
      'testing',
    ])
    testContextId = contexts[0].id
    testNextContextId = contexts[1].id
    testLastContextId = contexts[2].id
  })

  it('should save new guidelines and prompt for the next context', async () => {
    const args = {
      guidelines: mockGuidelines,
      contextId: testContextId,
      remainingContextIds: [testNextContextId, testLastContextId],
    }
    const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Guidelines saved for context ${testContextId}. Continue with: guidelines_analysis({"contextIds": [${testNextContextId},${testLastContextId}]})`,
        },
      ],
    })
  })

  it('should handle updating existing guidelines, then prompt for next context', async () => {
    // Create existing guidelines first
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

  it('should save guidelines when no previous version exists, then prompt for next context', async () => {
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

  it('should save guidelines and indicate completion if it is the last context', async () => {
    const expectedPromptText = `Guidelines analysis complete for all selected contexts! Guidelines saved for context ${testLastContextId}.`

    const args = {
      guidelines: mockGuidelines,
      contextId: testLastContextId,
      remainingContextIds: [], // Empty array indicates this is the last context
    }
    const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

    expect(result).toEqual({
      content: [{ type: 'text', text: expectedPromptText }],
    })
  })
})
