import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db'
import {
  createTestContexts,
  createTestRepositories,
  TEST_REPOSITORY_DATA,
} from '@/testing/helpers/fixtures'
import { cleanTestDb } from '@/testing/helpers/testDb'

import { handleGuidelinesAnalysis } from './guidelinesAnalysis'

vi.mock('@/helpers/promptReader', () => ({
  readPrompt: vi.fn(),
}))

vi.mock('@/services/repositoryService', () => ({
  findOrCreateRepositoryByPath: vi.fn(),
}))

vi.mock('child_process', () => ({
  exec: vi.fn(),
}))

describe('handleGuidelinesAnalysis', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let testContextId: number

  beforeEach(async () => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // No-op to suppress console error during tests
    })

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

  describe('with contextIds (specific context prompt)', () => {
    it('should return the correct prompt when contextIds is valid', async () => {
      const args = { contextIds: [testContextId] }

      const result = await handleGuidelinesAnalysis(args, {
        CWD: '/test/project',
      })
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Guidelines for coding standards and best practices',
          },
        ],
      })
    })

    it('should throw McpError if context is not found for contextIds', async () => {
      const nonExistentContextId = 99999
      const args = { contextIds: [nonExistentContextId] }

      const error = await handleGuidelinesAnalysis(args, {
        CWD: '/test/project',
      }).catch((e) => e)

      expect(error).toBeInstanceOf(McpError)
      expect(error.code).toBe(ErrorCode.InvalidParams)
      expect(error.message).toContain(
        `Context with ID "${nonExistentContextId}" not found`,
      )
    })

    it('should throw McpError for invalid input (contextIds not an array)', async () => {
      const args = { contextIds: 'not-an-array' }
      await expect(
        handleGuidelinesAnalysis(args, {
          CWD: '/test/project',
        }),
      ).rejects.toThrow(McpError)
      try {
        await handleGuidelinesAnalysis(args, {
          CWD: '/test/project',
        })
      } catch (e: any) {
        expect(e.code).toBe(ErrorCode.InvalidParams)
        expect(e.message).toContain('Expected array, received string')
      }
    })
  })

  describe('without contextIds (start analysis flow)', () => {
    it('should throw McpError if CWD is not available', async () => {
      const args = {}

      const error = await handleGuidelinesAnalysis(args, {}).catch((e) => e)

      expect(error).toBeInstanceOf(McpError)
      expect(error.code).toBe(ErrorCode.InternalError)
      expect(error.message).toContain(
        'CWD not available in MCP context. Cannot determine repository.',
      )
    })
  })

  it('should throw McpError for completely invalid input structure', async () => {
    const args = { contextIds: null }
    await expect(
      handleGuidelinesAnalysis(args, {
        CWD: '/test/project',
      }),
    ).rejects.toThrow(McpError)
  })
})
