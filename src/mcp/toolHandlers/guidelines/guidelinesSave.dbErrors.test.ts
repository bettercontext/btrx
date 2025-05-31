import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as guidelinesService from '@/services/guidelines'
import { db } from '@/db'

import { handleGuidelinesSave } from './guidelinesSave'

vi.mock('@/services/guidelines', () => ({
  getGuidelinesForRepositoryById: vi.fn(),
  createGuideline: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    query: {
      guidelinesContexts: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(),
        })),
      })),
    })),
  },
}))

describe('handleGuidelinesSave - DB and Runtime Error Scenarios', () => {
  const mockGuidelinesList = ['guideline1', 'guideline2']
  const mockContextId = 10
  const mockRepositoryId = 1
  const mcpContext = { CWD: '/test/project' }

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('should throw McpError if context validation fails', async () => {
    vi.mocked(db.query.guidelinesContexts.findFirst).mockRejectedValue(
      new Error('DB context validation failed'),
    )

    const args = { guidelines: mockGuidelinesList, contextId: mockContextId }
    await expect(handleGuidelinesSave(args, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleGuidelinesSave(args, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InternalError)
      expect(e.message).toContain('DB context validation failed')
    }
  })

  it('should throw McpError if existing guidelines check fails', async () => {
    // Mock successful context validation
    vi.mocked(db.query.guidelinesContexts.findFirst).mockResolvedValue({
      id: mockContextId,
      name: 'Test Context',
      repositoryId: mockRepositoryId,
      prompt: 'test prompt',
    })

    // Mock service to fail on getGuidelinesForRepositoryById
    vi.mocked(
      guidelinesService.getGuidelinesForRepositoryById,
    ).mockRejectedValue(new Error('Service guidelines fetch failed'))

    const args = { guidelines: mockGuidelinesList, contextId: mockContextId }
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
    // Mock successful context validation
    vi.mocked(db.query.guidelinesContexts.findFirst).mockResolvedValue({
      id: mockContextId,
      name: 'Test Context',
      repositoryId: mockRepositoryId,
      prompt: 'test prompt',
    })

    // Mock successful guidelines fetch (no existing guidelines)
    vi.mocked(
      guidelinesService.getGuidelinesForRepositoryById,
    ).mockResolvedValue([])

    // Mock failed guidelines creation
    vi.mocked(guidelinesService.createGuideline).mockRejectedValue(
      new Error('Service guidelines creation failed'),
    )

    // Mock successful contexts query (needed for flow continuation)
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi
            .fn()
            .mockResolvedValue([{ id: mockContextId, name: 'Test Context' }]),
        }),
      }),
    } as any)

    const args = { guidelines: mockGuidelinesList, contextId: mockContextId }
    const result = await handleGuidelinesSave(args, mcpContext)

    // Should complete successfully but report errors
    expect(result).toHaveProperty('content')
    expect(result.content[0].type).toBe('text')
    expect(result.content[0].text).toContain('2 errors')
    expect(result.content[0].text).toContain('Saved 0 guidelines')
  })

  it('should throw McpError if contexts query for flow continuation fails', async () => {
    // Mock successful context validation
    vi.mocked(db.query.guidelinesContexts.findFirst).mockResolvedValue({
      id: mockContextId,
      name: 'Test Context',
      repositoryId: mockRepositoryId,
      prompt: 'test prompt',
    })

    // Mock successful guidelines service calls
    vi.mocked(
      guidelinesService.getGuidelinesForRepositoryById,
    ).mockResolvedValue([])
    vi.mocked(guidelinesService.createGuideline).mockResolvedValue({
      id: 100,
      content: 'mocked',
      active: true,
      contextId: mockContextId,
      contextName: 'Test Context',
    })

    // Mock the contexts query to fail
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('DB select all contexts failed')
    })

    const args = { guidelines: mockGuidelinesList, contextId: mockContextId }
    await expect(handleGuidelinesSave(args, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleGuidelinesSave(args, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InternalError)
      expect(e.message).toContain('DB select all contexts failed')
    }
  })

  it('should handle database and runtime errors gracefully', async () => {
    // This test validates that any unexpected error during operation is properly wrapped as McpError
    // We mock a general error scenario that could happen during any database operation
    vi.mocked(db.query.guidelinesContexts.findFirst).mockRejectedValue(
      new Error('Unexpected database error'),
    )

    const args = { guidelines: mockGuidelinesList, contextId: mockContextId }
    await expect(handleGuidelinesSave(args, mcpContext)).rejects.toThrow(
      McpError,
    )

    try {
      await handleGuidelinesSave(args, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InternalError)
      expect(e.message).toContain('Unexpected database error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    }
  })
})
