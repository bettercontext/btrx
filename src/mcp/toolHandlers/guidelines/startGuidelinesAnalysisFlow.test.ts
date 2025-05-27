import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as repositoryService from '@/services/repositoryService'
import { db } from '@/db'
import { readPrompt } from '@/helpers/promptReader'

import { handleStartGuidelinesAnalysisFlow } from './startGuidelinesAnalysisFlow'

vi.mock('@/helpers/promptReader', () => ({
  readPrompt: vi.fn(),
}))

vi.mock('@/services/repositoryService', () => ({
  findOrCreateRepositoryByPath: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}))

describe('handleStartGuidelinesAnalysisFlow', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  const mockMcpContext = { CWD: '/test/repo' }
  const mockRepository = { id: 1 }
  const mockContextsList = [
    { id: 10, name: 'Frontend' },
    { id: 11, name: 'Backend' },
    { id: 12, name: 'Tests' },
  ]
  const mockGeneratedPromptText = 'Generated prompt to start analysis.'

  it('should successfully start the analysis flow and return a prompt', async () => {
    vi.mocked(repositoryService.findOrCreateRepositoryByPath).mockResolvedValue(
      mockRepository,
    )
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockContextsList),
      }),
    } as any)
    vi.mocked(readPrompt).mockResolvedValue(mockGeneratedPromptText)

    const result = await handleStartGuidelinesAnalysisFlow({}, mockMcpContext)

    expect(repositoryService.findOrCreateRepositoryByPath).toHaveBeenCalledWith(
      mockMcpContext.CWD,
      null, // No git origin URL initially
    )

    const expectedAllContextsNamesString = mockContextsList
      .map((c) => `"${c.name}"`)
      .join(', ')
    const expectedRemainingContextsList = mockContextsList
      .slice(1)
      .map((c) => ({ id: c.id, name: c.name }))

    expect(readPrompt).toHaveBeenCalledWith(
      'guidelines',
      'beginGuidelinesAnalysis',
      {
        firstContextId: mockContextsList[0].id,
        firstContextName: mockContextsList[0].name,
        allContextsList: expectedAllContextsNamesString,
        remainingContextsList: JSON.stringify(expectedRemainingContextsList),
      },
    )
    expect(result).toEqual({
      content: [{ type: 'text', text: mockGeneratedPromptText }],
    })
  })

  it('should throw McpError if CWD is not available in MCP context', async () => {
    await expect(handleStartGuidelinesAnalysisFlow({}, {})).rejects.toThrow(
      new McpError(
        ErrorCode.InternalError,
        'CWD not available in MCP context. Cannot determine repository.',
      ),
    )
  })

  it('should return a specific message if no contexts are defined for the repository', async () => {
    vi.mocked(repositoryService.findOrCreateRepositoryByPath).mockResolvedValue(
      mockRepository,
    )
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]), // No contexts
      }),
    } as any)

    const result = await handleStartGuidelinesAnalysisFlow({}, mockMcpContext)

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `No guidelines contexts are defined for the repository at "${mockMcpContext.CWD}". Please define contexts for this repository first.`,
        },
      ],
    })
    expect(readPrompt).not.toHaveBeenCalled()
  })

  it('should pass schema validation with empty args and proceed if DB calls succeed', async () => {
    vi.mocked(repositoryService.findOrCreateRepositoryByPath).mockResolvedValue(
      mockRepository,
    )
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockContextsList.slice(0, 1)),
      }),
    } as any)
    vi.mocked(readPrompt).mockResolvedValue(mockGeneratedPromptText)

    await expect(
      handleStartGuidelinesAnalysisFlow({}, mockMcpContext),
    ).resolves.toEqual({
      content: [{ type: 'text', text: mockGeneratedPromptText }],
    })
    expect(readPrompt).toHaveBeenCalledTimes(1)
  })

  it('should throw McpError if schema validation fails (e.g. unexpected param)', async () => {
    const argsWithUnexpectedParam = { unexpected: 'param' }

    await expect(
      handleStartGuidelinesAnalysisFlow(
        argsWithUnexpectedParam,
        mockMcpContext,
      ),
    ).rejects.toThrow(McpError)
    try {
      await handleStartGuidelinesAnalysisFlow(
        argsWithUnexpectedParam,
        mockMcpContext,
      )
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain("Unrecognized key(s) in object: 'unexpected'")
    }
  })

  it('should re-throw McpError if readPrompt itself throws an McpError', async () => {
    vi.mocked(repositoryService.findOrCreateRepositoryByPath).mockResolvedValue(
      mockRepository,
    )
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockContextsList),
      }),
    } as any)
    const specificMcpError = new McpError(
      ErrorCode.InternalError,
      'Custom MCP error from readPrompt',
    )
    vi.mocked(readPrompt).mockRejectedValue(specificMcpError)

    await expect(
      handleStartGuidelinesAnalysisFlow({}, mockMcpContext),
    ).rejects.toThrow(specificMcpError)
  })

  it('should wrap and throw McpError if readPrompt fails with a generic error', async () => {
    vi.mocked(repositoryService.findOrCreateRepositoryByPath).mockResolvedValue(
      mockRepository,
    )
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockContextsList),
      }),
    } as any)
    const genericError = new Error('Network issue during prompt reading')
    vi.mocked(readPrompt).mockRejectedValue(genericError)

    await expect(
      handleStartGuidelinesAnalysisFlow({}, mockMcpContext),
    ).rejects.toThrow(
      new McpError(
        ErrorCode.InternalError,
        `Failed to process start guidelines analysis flow request: ${genericError.message}`,
      ),
    )
  })

  it('should throw McpError if findOrCreateRepositoryByPath fails', async () => {
    const serviceError = new Error('Failed to process repository request')
    vi.mocked(repositoryService.findOrCreateRepositoryByPath).mockRejectedValue(
      serviceError,
    )

    await expect(
      handleStartGuidelinesAnalysisFlow({}, mockMcpContext),
    ).rejects.toThrow(
      new McpError(
        ErrorCode.InternalError,
        `Failed to process start guidelines analysis flow request: ${serviceError.message}`,
      ),
    )
  })

  it('should throw McpError if db.select for contexts fails', async () => {
    vi.mocked(repositoryService.findOrCreateRepositoryByPath).mockResolvedValue(
      mockRepository,
    )
    const dbError = new Error('DB error selecting contexts')
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(dbError),
      }),
    } as any)

    await expect(
      handleStartGuidelinesAnalysisFlow({}, mockMcpContext),
    ).rejects.toThrow(
      new McpError(
        ErrorCode.InternalError,
        `Failed to process start guidelines analysis flow request: ${dbError.message}`,
      ),
    )
  })
})
