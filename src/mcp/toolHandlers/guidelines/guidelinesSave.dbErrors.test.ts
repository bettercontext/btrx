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
  saveCurrentGuidelines: vi.fn(),
  getCurrentGuidelines: vi.fn().mockResolvedValue(null),
}))

describe('handleGuidelinesSave - DB and Runtime Error Scenarios', () => {
  const mockGuidelines = ['guideline1', 'guideline2']
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

  it('should throw McpError if guidelines save fails', async () => {
    const mockError = new Error('Service guidelines save failed')
    // Mock service to fail on saveCurrentGuidelines
    vi.mocked(guidelinesService.saveCurrentGuidelines).mockRejectedValue(
      mockError,
    )

    const args = {
      guidelines: mockGuidelines,
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
      expect(e.message).toBe('MCP error -32603: Failed to save guidelines')
    }
  })

  it('should handle guidelines save errors gracefully', async () => {
    const mockError = new Error('Service guidelines save failed')
    // Mock failed guidelines save
    vi.mocked(guidelinesService.saveCurrentGuidelines).mockRejectedValue(
      mockError,
    )

    const args = {
      guidelines: mockGuidelines,
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
      expect(e.message).toBe('MCP error -32603: Failed to save guidelines')
    }
  })

  it('should handle context not found error', async () => {
    const nonExistentContextId = 99999
    const args = {
      guidelines: mockGuidelines,
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
