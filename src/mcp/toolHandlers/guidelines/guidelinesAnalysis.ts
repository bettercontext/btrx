import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { guidelinesContexts } from '@/db/schema'

const GetGuidelinesAnalysisPromptForContextInputSchema = z
  .object({
    contextId: z.number().int(),
  })
  .strict()

export async function handleGetGuidelinesAnalysisPromptForContext(
  args: unknown,
  mcpContext?: { CWD?: string },
) {
  console.log(
    '[GetGuidelinesAnalysisPromptForContext Handler] Received args:',
    args,
  )
  console.log(
    '[GetGuidelinesAnalysisPromptForContext Handler] MCP Context:',
    mcpContext,
  )

  const parseResult =
    GetGuidelinesAnalysisPromptForContextInputSchema.safeParse(args)

  if (!parseResult.success) {
    console.error(
      '[GetGuidelinesAnalysisPromptForContext Handler] Invalid arguments:',
      parseResult.error,
    )
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid arguments for get_guidelines_analysis_prompt_for_context tool: ${parseResult.error.message}`,
    )
  }

  const { contextId } = parseResult.data

  try {
    const contextEntry = await db
      .select()
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.id, contextId))
      .limit(1)

    if (contextEntry.length === 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Context with ID "${contextId}" not found`,
      )
    }

    const prompt = contextEntry[0].prompt
    console.log(
      `[GetGuidelinesAnalysisPromptForContext Handler] Returning prompt for context ID: ${contextId}`,
    )
    return { content: [{ type: 'text', text: prompt }] }
  } catch (error) {
    console.error(
      `[GetGuidelinesAnalysisPromptForContext Handler] Failed to read prompt for context ID ${contextId}:`,
      error,
    )
    if (error instanceof McpError) {
      throw error
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to read prompt for context ID ${contextId}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
