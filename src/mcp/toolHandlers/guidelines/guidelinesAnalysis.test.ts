import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db'

import { handleGuidelinesAnalysis } from './guidelinesAnalysis'

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
    })),
  },
}))

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

  const mockContextId = 101
  const mockContextPrompt = 'This is a test prompt for context 101.'
  const mockContextEntry = [
    {
      id: mockContextId,
      name: 'Test Context',
      prompt: mockContextPrompt,
      repositoryId: 1,
    },
  ]

  beforeEach(() => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // No-op to suppress console error during tests
    })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('with contextId (specific context prompt)', () => {
    it('should return the correct prompt when contextId is valid', async () => {
      const args = { contextId: mockContextId }

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockContextEntry),
          }),
        }),
      } as any)

      const result = await handleGuidelinesAnalysis(args, {
        CWD: '/test/project',
      })
      expect(result).toEqual({
        content: [{ type: 'text', text: mockContextPrompt }],
      })
    })

    it('should throw McpError if context is not found for contextId', async () => {
      const args = { contextId: mockContextId }

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No context found
          }),
        }),
      } as any)

      const error = await handleGuidelinesAnalysis(args, {
        CWD: '/test/project',
      }).catch((e) => e)

      expect(error).toBeInstanceOf(McpError)
      expect(error.code).toBe(ErrorCode.InvalidParams)
      expect(error.message).toContain(
        `Context with ID "${mockContextId}" not found`,
      )
    })

    it('should throw McpError for invalid input (contextId not a number)', async () => {
      const args = { contextId: 'not-a-number' }
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
        expect(e.message).toContain('Expected number, received string')
      }
    })

    it('should throw McpError if database query fails', async () => {
      const args = { contextId: mockContextId }
      const dbError = new Error('Database connection failed')

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(dbError),
          }),
        }),
      } as any)

      const error = await handleGuidelinesAnalysis(args, {
        CWD: '/test/project',
      }).catch((e) => e)

      expect(error).toBeInstanceOf(McpError)
      expect(error.code).toBe(ErrorCode.InternalError)
      expect(error.message).toContain(
        'Failed to process guidelines analysis request',
      )
    })
  })

  describe('without contextId (start analysis flow)', () => {
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
    const args = { contextId: null }
    await expect(
      handleGuidelinesAnalysis(args, {
        CWD: '/test/project',
      }),
    ).rejects.toThrow(McpError)
  })
})
