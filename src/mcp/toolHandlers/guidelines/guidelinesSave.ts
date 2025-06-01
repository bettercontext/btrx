import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { guidelinesContexts } from '@/db/schema'
import {
  createGuidelineByContextId,
  getGuidelinesForRepositoryById,
} from '@/services/guidelines'

const SaveGuidelinesInputSchema = z
  .object({
    guidelines: z.array(z.string().min(1)).min(1),
    contextId: z.number().int(),
    remainingContextIds: z.array(z.number().int()),
  })
  .strict()

export async function handleGuidelinesSave(
  args: unknown,
  mcpContext?: { CWD?: string },
) {
  console.log('[GuidelinesSave Handler] Received args:', args)
  console.log('[GuidelinesSave Handler] MCP Context:', mcpContext)
  const parseResult = SaveGuidelinesInputSchema.safeParse(args)

  if (!parseResult.success) {
    console.error(
      '[GuidelinesSave Handler] Invalid arguments:',
      parseResult.error,
    )
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid arguments for guidelines_save tool: ${parseResult.error.message}`,
    )
  }

  const {
    guidelines: guidelinesList,
    contextId,
    remainingContextIds,
  } = parseResult.data

  try {
    const currentContextRecord = await db.query.guidelinesContexts.findFirst({
      where: eq(guidelinesContexts.id, contextId),
    })

    if (!currentContextRecord) {
      console.error(
        `[GuidelinesSave Handler] Context ID "${contextId}" not found`,
      )
      throw new McpError(
        ErrorCode.InvalidParams,
        `Context ID "${contextId}" not found`,
      )
    }
    const repositoryId = currentContextRecord.repositoryId

    let savedCount = 0
    const errors: { guideline: string; error: string }[] = []
    const existingGuidelinesMessages: {
      guideline: string
      message: string
      existingGuidelineId?: number
    }[] = []

    // Get existing guidelines for this context using the new service
    const allGuidelines = await getGuidelinesForRepositoryById(repositoryId)
    const existingGuidelines = allGuidelines.filter(
      (g) => g.contextId === contextId,
    )

    for (const guidelineContent of guidelinesList) {
      // Check if guideline already exists
      const existingGuideline = existingGuidelines.find(
        (g) => g.content === guidelineContent,
      )

      if (existingGuideline) {
        existingGuidelinesMessages.push({
          guideline: guidelineContent,
          message: 'Guideline already exists for this context.',
          existingGuidelineId: existingGuideline.id,
        })
      } else {
        try {
          // Create new guideline using the context ID directly
          await createGuidelineByContextId(guidelineContent, contextId)
          savedCount++
        } catch (error) {
          errors.push({
            guideline: guidelineContent,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }

    let promptText: string

    if (remainingContextIds.length > 0) {
      promptText = `Guidelines saved for context ${contextId}. Continue with: guidelines_analysis({"contextIds": ${JSON.stringify(remainingContextIds)}})`
      console.log(
        `[GuidelinesSave Handler] Saved ${savedCount} guidelines for context ${contextId}. Next contexts: ${remainingContextIds.join(', ')}`,
      )
    } else {
      promptText = `Guidelines analysis complete for all selected contexts! Saved ${savedCount} guidelines for the last context (ID: ${contextId}). ${existingGuidelinesMessages.length} guidelines already existed. ${errors.length} errors.`
      console.log(
        `[GuidelinesSave Handler] Saved ${savedCount} guidelines for context ${contextId}. Analysis complete.`,
      )
    }

    return { content: [{ type: 'text', text: promptText }] }
  } catch (error) {
    console.error('[GuidelinesSave Handler] Caught error:', error)
    if (error instanceof McpError) {
      throw error
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Operation failed in handleGuidelinesSave: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
