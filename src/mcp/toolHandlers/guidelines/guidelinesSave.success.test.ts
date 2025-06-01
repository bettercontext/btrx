import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db'
import { createGuidelineByContextId } from '@/services/guidelines'
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
  const mockGuidelinesList = ['guideline1', 'guideline2']
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
      guidelines: mockGuidelinesList,
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

  it('should handle a mix of new and existing guidelines, then prompt for next context', async () => {
    // Create one existing guideline using the context ID directly
    await createGuidelineByContextId(mockGuidelinesList[0], testContextId)

    const args = {
      guidelines: mockGuidelinesList,
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

  it('should handle all guidelines already existing, then prompt for next context', async () => {
    // Create all existing guidelines using the context ID directly
    for (const guideline of mockGuidelinesList) {
      await createGuidelineByContextId(guideline, testContextId)
    }

    const args = {
      guidelines: mockGuidelinesList,
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
    const expectedPromptText = `Guidelines analysis complete for all selected contexts! Saved ${mockGuidelinesList.length} guidelines for the last context (ID: ${testLastContextId}). 0 guidelines already existed. 0 errors.`

    const args = {
      guidelines: mockGuidelinesList,
      contextId: testLastContextId,
      remainingContextIds: [], // Empty array indicates this is the last context
    }
    const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

    expect(result).toEqual({
      content: [{ type: 'text', text: expectedPromptText }],
    })
  })
})
