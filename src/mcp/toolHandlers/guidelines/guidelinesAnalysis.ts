import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { exec } from 'child_process'
import { eq } from 'drizzle-orm'
import { promisify } from 'util'
import { z } from 'zod'

import { db } from '@/db'
import { guidelinesContexts } from '@/db/schema'
import { readPrompt } from '@/helpers/promptReader'
import { findOrCreateRepositoryByPath } from '@/services/repositoryService'

const execAsync = promisify(exec)

const GuidelinesAnalysisInputSchema = z
  .object({
    contextIds: z.array(z.number().int()).optional(),
  })
  .strict()

interface UserDefinedContext {
  id: number
  name: string
}

export async function handleGuidelinesAnalysis(
  args: unknown,
  mcpContext?: { CWD?: string },
) {
  console.log('[GuidelinesAnalysis Handler] Received args:', args)
  console.log('[GuidelinesAnalysis Handler] MCP Context:', mcpContext)

  const parseResult = GuidelinesAnalysisInputSchema.safeParse(args)

  if (!parseResult.success) {
    console.error(
      '[GuidelinesAnalysis Handler] Invalid arguments:',
      parseResult.error,
    )
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid arguments for guidelines_analysis tool: ${parseResult.error.message}`,
    )
  }

  const { contextIds } = parseResult.data

  try {
    if (!mcpContext || !mcpContext.CWD) {
      throw new McpError(
        ErrorCode.InternalError,
        'CWD not available in MCP context. Cannot determine repository.',
      )
    }
    const { CWD } = mcpContext

    if (!contextIds || contextIds.length === 0) {
      // Get Git origin URL with fallback to CWD path
      let gitOriginUrl: string | null = null
      try {
        const { stdout } = await execAsync('git remote get-url origin', {
          cwd: CWD,
        })
        gitOriginUrl = stdout.trim()
      } catch {
        // Not a git repository or no origin, will use CWD as fallback
      }

      // Use repositoryService to find or create repository with proper fallback logic
      const repositoryResult = await findOrCreateRepositoryByPath(
        CWD,
        gitOriginUrl,
      )
      const repositoryId = repositoryResult.id

      const contexts = await db
        .select({
          id: guidelinesContexts.id,
          name: guidelinesContexts.name,
        })
        .from(guidelinesContexts)
        .where(eq(guidelinesContexts.repositoryId, repositoryId))

      if (contexts.length === 0) {
        const promptText = await readPrompt('guidelines', 'noContextsFound')
        return {
          content: [
            {
              type: 'text',
              text: promptText,
            },
          ],
        }
      }

      const userDefinedContexts: UserDefinedContext[] = contexts.map((c) => ({
        id: c.id,
        name: c.name,
      }))

      const promptText = await readPrompt(
        'guidelines',
        'beginGuidelinesAnalysis',
        {
          contexts: userDefinedContexts,
        },
      )

      console.log(
        `[GuidelinesAnalysis Handler] Discovery phase: found ${contexts.length} contexts, asking user to select`,
      )
      return { content: [{ type: 'text', text: promptText }] }
    }

    // Analysis phase: process the first context in the contextIds array
    const currentContextId = contextIds[0]
    const contextEntry = await db
      .select()
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.id, currentContextId))
      .limit(1)

    if (contextEntry.length === 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Context with ID "${currentContextId}" not found`,
      )
    }

    const prompt = contextEntry[0].prompt
    console.log(
      `[GuidelinesAnalysis Handler] Returning prompt for context ID: ${currentContextId}`,
    )
    return { content: [{ type: 'text', text: prompt }] }
  } catch (error) {
    console.error(
      '[GuidelinesAnalysis Handler] Failed to process request:',
      error,
    )
    if (error instanceof McpError) {
      throw error
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to process guidelines analysis request: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
