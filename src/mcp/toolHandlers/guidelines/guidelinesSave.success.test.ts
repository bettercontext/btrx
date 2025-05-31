import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as promptReader from '@/helpers/promptReader'
import * as guidelinesService from '@/services/guidelines'
import { db } from '@/db'
import { guidelinesContexts } from '@/db/schema'

import { handleGuidelinesSave } from './guidelinesSave'

vi.mock('@/helpers/promptReader', () => ({
  readPrompt: vi.fn(),
}))

vi.mock('@/services/guidelines', () => ({
  getGuidelinesForRepositoryById: vi.fn(),
  createGuidelineByContextId: vi.fn(),
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

describe('handleGuidelinesSave - Success Scenarios', () => {
  const mockGuidelinesList = ['guideline1', 'guideline2']
  const mockContextId = 10
  const mockRepositoryId = 1
  const mockNextContextId = 11
  const mockNextContextName = 'Next Context'

  const allRepoContextsDefault = [
    { id: mockContextId, name: 'Current Context' },
    { id: mockNextContextId, name: mockNextContextName },
    { id: 12, name: 'Another Context' },
  ]

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('should save new guidelines and prompt for the next context', async () => {
    // Mock context validation
    vi.mocked(db.query.guidelinesContexts.findFirst).mockResolvedValue({
      id: mockContextId,
      name: 'Test Context',
      repositoryId: mockRepositoryId,
      prompt: 'test prompt',
    })

    // Mock existing guidelines check (no existing guidelines for this context)
    vi.mocked(
      guidelinesService.getGuidelinesForRepositoryById,
    ).mockResolvedValue([])

    // Mock guidelines creation
    vi.mocked(guidelinesService.createGuidelineByContextId).mockResolvedValue({
      id: 100,
      content: 'mocked',
      active: true,
      contextId: mockContextId,
      contextName: 'Test Context',
    })

    // Mock contexts query for flow continuation
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(allRepoContextsDefault),
        }),
      }),
    } as any)

    const expectedPrompt = 'Continue with Next Context (ID 11)'
    vi.mocked(promptReader.readPrompt).mockResolvedValue(expectedPrompt)

    const args = { guidelines: mockGuidelinesList, contextId: mockContextId }
    const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

    expect(result).toEqual({
      content: [{ type: 'text', text: expectedPrompt }],
    })

    expect(db.query.guidelinesContexts.findFirst).toHaveBeenCalledWith({
      where: eq(guidelinesContexts.id, mockContextId),
    })

    expect(
      guidelinesService.getGuidelinesForRepositoryById,
    ).toHaveBeenCalledWith(mockRepositoryId)
    expect(guidelinesService.createGuidelineByContextId).toHaveBeenCalledTimes(
      mockGuidelinesList.length,
    )

    expect(promptReader.readPrompt).toHaveBeenCalledWith(
      'guidelines',
      'continueGuidelinesAnalysis',
      {
        nextContextId: mockNextContextId,
        nextContextName: mockNextContextName,
        remainingContextsList: JSON.stringify([
          { id: 12, name: 'Another Context' },
        ]),
        remainingContextsListIsNotEmpty: true,
      },
    )
  })

  it('should handle a mix of new and existing guidelines, then prompt for next context', async () => {
    const existingGuidelineContent = mockGuidelinesList[0]

    // Mock context validation
    vi.mocked(db.query.guidelinesContexts.findFirst).mockResolvedValue({
      id: mockContextId,
      name: 'Test Context',
      repositoryId: mockRepositoryId,
      prompt: 'test prompt',
    })

    // Mock existing guidelines check (one exists for this context)
    vi.mocked(
      guidelinesService.getGuidelinesForRepositoryById,
    ).mockResolvedValue([
      {
        id: 99,
        content: existingGuidelineContent,
        active: true,
        contextId: mockContextId,
        contextName: 'Test Context',
      },
    ])

    // Mock guidelines creation (only called for the new guideline)
    vi.mocked(guidelinesService.createGuidelineByContextId).mockResolvedValue({
      id: 101,
      content: 'mocked',
      active: true,
      contextId: mockContextId,
      contextName: 'Test Context',
    })

    // Mock contexts query for flow continuation
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(allRepoContextsDefault),
        }),
      }),
    } as any)

    const expectedPrompt = 'Mixed save, continue with Next Context (ID 11)'
    vi.mocked(promptReader.readPrompt).mockResolvedValue(expectedPrompt)

    const args = { guidelines: mockGuidelinesList, contextId: mockContextId }
    const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

    expect(result).toEqual({
      content: [{ type: 'text', text: expectedPrompt }],
    })

    expect(
      guidelinesService.getGuidelinesForRepositoryById,
    ).toHaveBeenCalledWith(mockRepositoryId)
    expect(guidelinesService.createGuidelineByContextId).toHaveBeenCalledTimes(
      1,
    )

    expect(promptReader.readPrompt).toHaveBeenCalledWith(
      'guidelines',
      'continueGuidelinesAnalysis',
      expect.any(Object),
    )
  })

  it('should handle all guidelines already existing, then prompt for next context', async () => {
    // Mock context validation
    vi.mocked(db.query.guidelinesContexts.findFirst).mockResolvedValue({
      id: mockContextId,
      name: 'Test Context',
      repositoryId: mockRepositoryId,
      prompt: 'test prompt',
    })

    // Mock existing guidelines check (all exist for this context)
    vi.mocked(
      guidelinesService.getGuidelinesForRepositoryById,
    ).mockResolvedValue(
      mockGuidelinesList.map((guideline, i) => ({
        id: 200 + i,
        content: guideline,
        active: true,
        contextId: mockContextId,
        contextName: 'Test Context',
      })),
    )

    // Mock contexts query for flow continuation
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(allRepoContextsDefault),
        }),
      }),
    } as any)

    const expectedPrompt = 'All exist, continue with Next Context (ID 11)'
    vi.mocked(promptReader.readPrompt).mockResolvedValue(expectedPrompt)

    const args = { guidelines: mockGuidelinesList, contextId: mockContextId }
    const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

    expect(result).toEqual({
      content: [{ type: 'text', text: expectedPrompt }],
    })

    expect(
      guidelinesService.getGuidelinesForRepositoryById,
    ).toHaveBeenCalledWith(mockRepositoryId)
    expect(guidelinesService.createGuidelineByContextId).not.toHaveBeenCalled()

    expect(promptReader.readPrompt).toHaveBeenCalledWith(
      'guidelines',
      'continueGuidelinesAnalysis',
      expect.any(Object),
    )
  })

  it('should save guidelines and indicate completion if it is the last context', async () => {
    const lastContextId = 12
    const contextsList = [
      { id: mockContextId, name: 'Some Context' },
      { id: lastContextId, name: 'Last Context' },
    ]

    // Mock context validation for last context
    vi.mocked(db.query.guidelinesContexts.findFirst).mockResolvedValue({
      id: lastContextId,
      name: 'Last Context',
      repositoryId: mockRepositoryId,
      prompt: 'test prompt',
    })

    // Mock existing guidelines check (no existing guidelines)
    vi.mocked(
      guidelinesService.getGuidelinesForRepositoryById,
    ).mockResolvedValue([])

    // Mock guidelines creation
    vi.mocked(guidelinesService.createGuidelineByContextId).mockResolvedValue({
      id: 300,
      content: 'mocked',
      active: true,
      contextId: lastContextId,
      contextName: 'Last Context',
    })

    // Mock contexts query - this is the last context
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(contextsList),
        }),
      }),
    } as any)

    const expectedPromptText = `Guidelines analysis complete for all contexts. Saved ${mockGuidelinesList.length} guidelines for the last context (ID: ${lastContextId}). 0 guidelines already existed. 0 errors.`

    const args = { guidelines: mockGuidelinesList, contextId: lastContextId }
    const result = await handleGuidelinesSave(args, { CWD: '/test/project' })

    expect(result).toEqual({
      content: [{ type: 'text', text: expectedPromptText }],
    })

    expect(
      guidelinesService.getGuidelinesForRepositoryById,
    ).toHaveBeenCalledWith(mockRepositoryId)
    expect(guidelinesService.createGuidelineByContextId).toHaveBeenCalledTimes(
      mockGuidelinesList.length,
    )

    expect(promptReader.readPrompt).not.toHaveBeenCalled()
  })
})
