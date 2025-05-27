import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db'

import { handleGetGuidelinesAnalysisPromptForContext } from './guidelinesAnalysis'

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

describe('handleGetGuidelinesAnalysisPromptForContext', () => {
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

  it('should return the correct prompt when contextId is valid', async () => {
    const args = { contextId: mockContextId }

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockContextEntry),
        }),
      }),
    } as any)

    const result = await handleGetGuidelinesAnalysisPromptForContext(args, {
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

    const error = await handleGetGuidelinesAnalysisPromptForContext(args, {
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
      handleGetGuidelinesAnalysisPromptForContext(args, {
        CWD: '/test/project',
      }),
    ).rejects.toThrow(McpError)
    try {
      await handleGetGuidelinesAnalysisPromptForContext(args, {
        CWD: '/test/project',
      })
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain('Expected number, received string')
    }
  })

  it('should throw McpError if contextId argument is missing', async () => {
    const args = {}
    await expect(
      handleGetGuidelinesAnalysisPromptForContext(args, {
        CWD: '/test/project',
      }),
    ).rejects.toThrow(McpError)
  })

  it('should throw McpError for extra arguments due to .strict()', async () => {
    const args = { contextId: mockContextId, extraParam: 'unexpected' }
    await expect(
      handleGetGuidelinesAnalysisPromptForContext(args, {
        CWD: '/test/project',
      }),
    ).rejects.toThrow(McpError)
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

    const error = await handleGetGuidelinesAnalysisPromptForContext(args, {
      CWD: '/test/project',
    }).catch((e) => e)

    expect(error).toBeInstanceOf(McpError)
    expect(error.code).toBe(ErrorCode.InternalError)
    expect(error.message).toContain(
      `Failed to read prompt for context ID ${mockContextId}`,
    )
  })
})
