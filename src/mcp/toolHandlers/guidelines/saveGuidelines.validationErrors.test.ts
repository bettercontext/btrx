import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db'
import { guidelinesContexts } from '@/db/schema'

import { handleSaveGuidelines } from './saveGuidelines'

vi.mock('@/db', () => ({
  db: {
    query: {
      guidelinesContexts: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}))

describe('handleSaveGuidelines - Validation Error Scenarios', () => {
  const mockGuidelinesList = ['guideline1', 'guideline2']
  const mockContextId = 10
  const mcpContext = { CWD: '/test/project' }

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('should throw McpError for invalid arguments (missing guidelines)', async () => {
    const args = { contextId: mockContextId } // Missing guidelines
    await expect(handleSaveGuidelines(args as any, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleSaveGuidelines(args as any, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain('Invalid arguments for save_guidelines tool')
      expect(e.message).toContain('Required') // Zod error message for missing field
    }
  })

  it('should throw McpError for invalid arguments (empty guidelines array)', async () => {
    const args = { guidelines: [], contextId: mockContextId }
    await expect(handleSaveGuidelines(args, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleSaveGuidelines(args, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toMatch(/Array must contain at least 1 element\(s\)/u) // Zod error for min array length
    }
  })

  it('should throw McpError for invalid arguments (contextId not a number)', async () => {
    const args = { guidelines: mockGuidelinesList, contextId: 'not-a-number' }
    await expect(handleSaveGuidelines(args as any, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleSaveGuidelines(args as any, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain('Expected number, received string') // Zod error for type mismatch
    }
  })

  it('should throw McpError for invalid arguments (missing contextId)', async () => {
    const args = { guidelines: mockGuidelinesList }
    await expect(handleSaveGuidelines(args as any, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleSaveGuidelines(args as any, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain('Required') // Zod error for missing field
    }
  })

  it('should throw McpError if contextId does not exist', async () => {
    vi.mocked(db.query.guidelinesContexts.findFirst).mockResolvedValue(
      undefined,
    )

    const args = { guidelines: mockGuidelinesList, contextId: mockContextId }
    try {
      await handleSaveGuidelines(args, mcpContext)
      expect.fail(
        'Expected handleSaveGuidelines to throw an McpError, but it did not.',
      )
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toBe(
        `MCP error -32602: Context ID "${mockContextId}" not found`,
      )
    }
    expect(db.query.guidelinesContexts.findFirst).toHaveBeenCalledWith({
      where: eq(guidelinesContexts.id, mockContextId),
    })
  })

  it('should throw McpError for unexpected parameters (strict schema)', async () => {
    const args = {
      guidelines: mockGuidelinesList,
      contextId: mockContextId,
      unexpectedParam: 'test',
    }
    await expect(handleSaveGuidelines(args, mcpContext)).rejects.toThrow(
      McpError,
    )
    try {
      await handleSaveGuidelines(args, mcpContext)
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.InvalidParams)
      expect(e.message).toContain(
        // Zod error for unrecognized keys
        "Unrecognized key(s) in object: 'unexpectedParam'",
      )
    }
  })
})
