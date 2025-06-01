import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db'
import {
  createTestContexts,
  createTestRepositories,
  TEST_REPOSITORY_DATA,
} from '@/testing/helpers/fixtures'
import { cleanTestDb } from '@/testing/helpers/testDb'

import { handleGuidelinesSave } from './guidelinesSave'

describe('handleGuidelinesSave - Validation Error Scenarios', () => {
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

  it('should throw McpError for invalid arguments (missing guidelines)', async () => {
    const args = { contextId: testContextId } // Missing guidelines
    await expect(handleGuidelinesSave(args as any, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleGuidelinesSave(args as any, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain('Invalid arguments for guidelines_save tool')
      expect(e.message).toContain('Required') // Zod error message for missing field
    }
  })

  it('should throw McpError for invalid arguments (empty guidelines array)', async () => {
    const args = { guidelines: [], contextId: testContextId }
    await expect(handleGuidelinesSave(args, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleGuidelinesSave(args, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toMatch(/Array must contain at least 1 element\(s\)/u) // Zod error for min array length
    }
  })

  it('should throw McpError for invalid arguments (contextId not a number)', async () => {
    const args = { guidelines: mockGuidelinesList, contextId: 'not-a-number' }
    await expect(handleGuidelinesSave(args as any, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleGuidelinesSave(args as any, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain('Expected number, received string') // Zod error for type mismatch
    }
  })

  it('should throw McpError for invalid arguments (missing contextId)', async () => {
    const args = { guidelines: mockGuidelinesList }
    await expect(handleGuidelinesSave(args as any, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleGuidelinesSave(args as any, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain('Required') // Zod error for missing field
    }
  })

  it('should throw McpError if contextId does not exist', async () => {
    const nonExistentContextId = 99999
    const args = {
      guidelines: mockGuidelinesList,
      contextId: nonExistentContextId,
      remainingContextIds: [],
    }

    try {
      await handleGuidelinesSave(args, mcpContext)
      expect.fail(
        'Expected handleGuidelinesSave to throw an McpError, but it did not.',
      )
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toBe(
        `MCP error -32602: Context ID "${nonExistentContextId}" not found`,
      )
    }
  })

  it('should throw McpError for unexpected parameters (strict schema)', async () => {
    const args = {
      guidelines: mockGuidelinesList,
      contextId: testContextId,
      unexpectedParam: 'test',
    }
    await expect(handleGuidelinesSave(args, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleGuidelinesSave(args, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain(
        // Zod error for unrecognized keys
        "Unrecognized key(s) in object: 'unexpectedParam'",
      )
    }
  })
})
