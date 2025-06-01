import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as guidelinesService from '@/services/guidelines'
import { db } from '@/db'
import {
  createTestContexts,
  createTestRepositories,
  TEST_REPOSITORY_DATA,
} from '@/testing/helpers/fixtures'
import { cleanTestDb } from '@/testing/helpers/testDb'

import { handleGuidelinesSave } from './guidelinesSave'

vi.mock('@/services/guidelines', () => ({
  getGuidelinesForRepositoryById: vi.fn(),
  createGuidelineByContextId: vi.fn(),
}))

describe('handleGuidelinesSave - DB and Runtime Error Scenarios', () => {
  const mockGuidelinesList = ['guideline1', 'guideline2']
  let testContextId: number
  const mcpContext = { CWD: '/test/project' }

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await cleanTestDb(db)

    const repositories = await createTestRepositories(db, [
      TEST_REPOSITORY_DATA.repo1,
    ])
    const contexts = await createTestContexts(db, repositories[0].id, [
      'coding',
    ])

    testContextId = contexts[0].id
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('should throw McpError if existing guidelines check fails', async () => {
    // Mock service to fail on getGuidelinesForRepositoryById
    vi.mocked(
      guidelinesService.getGuidelinesForRepositoryById,
    ).mockRejectedValue(new Error('Service guidelines fetch failed'))

    const args = {
      guidelines: mockGuidelinesList,
      contextId: testContextId,
      remainingContextIds: [],
    }
    await expect(handleGuidelinesSave(args, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleGuidelinesSave(args, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InternalError)
      expect(e.message).toContain('Service guidelines fetch failed')
    }
  })

  it('should handle guidelines creation errors gracefully and report them', async () => {
    // Mock successful guidelines fetch (no existing guidelines)
    vi.mocked(
      guidelinesService.getGuidelinesForRepositoryById,
    ).mockResolvedValue([])

    // Mock failed guidelines creation
    vi.mocked(guidelinesService.createGuidelineByContextId).mockRejectedValue(
      new Error('Service guidelines creation failed'),
    )

    const args = {
      guidelines: mockGuidelinesList,
      contextId: testContextId,
      remainingContextIds: [],
    }
    const result = await handleGuidelinesSave(args, mcpContext)

    // Should complete successfully but report errors
    expect(result).toHaveProperty('content')
    expect(result.content[0].type).toBe('text')
    expect(result.content[0].text).toContain('2 errors')
    expect(result.content[0].text).toContain('Saved 0 guidelines')
  })

  it('should handle context not found error', async () => {
    const nonExistentContextId = 99999
    const args = {
      guidelines: mockGuidelinesList,
      contextId: nonExistentContextId,
      remainingContextIds: [],
    }

    await expect(handleGuidelinesSave(args, mcpContext)).rejects.toThrow(
      McpError,
    )

    try {
      await handleGuidelinesSave(args, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain('not found')
    }
  })
})
