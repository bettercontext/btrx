import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { and, eq, or } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { guidelines, guidelinesContexts } from '@/db/schema'
import { readPrompt } from '@/helpers/promptReader'

const SaveGuidelinesInputSchema = z
  .object({
    guidelines: z.array(z.string().min(1)).min(1),
    contextId: z.number().int(),
  })
  .strict()

export async function handleSaveGuidelines(
  args: unknown,
  mcpContext?: { CWD?: string },
) {
  console.log('[SaveGuidelines Handler] Received args:', args)
  console.log('[SaveGuidelines Handler] MCP Context:', mcpContext)
  const parseResult = SaveGuidelinesInputSchema.safeParse(args)

  if (!parseResult.success) {
    console.error(
      '[SaveGuidelines Handler] Invalid arguments:',
      parseResult.error,
    )
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid arguments for save_guidelines tool: ${parseResult.error.message}`,
    )
  }

  const { guidelines: guidelinesList, contextId } = parseResult.data

  try {
    const currentContextRecord = await db.query.guidelinesContexts.findFirst({
      where: eq(guidelinesContexts.id, contextId),
    })

    if (!currentContextRecord) {
      console.error(
        `[SaveGuidelines Handler] Context ID "${contextId}" not found`,
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

    const existingGuidelinesCheckConditions = guidelinesList.map(
      (guidelineContent) => {
        return and(
          eq(guidelines.content, guidelineContent),
          eq(guidelines.contextId, contextId),
        )
      },
    )

    let foundExistingGuidelines: { id: number; content: string }[] = []
    if (existingGuidelinesCheckConditions.length > 0) {
      foundExistingGuidelines = await db
        .select({ id: guidelines.id, content: guidelines.content })
        .from(guidelines)
        .where(or(...existingGuidelinesCheckConditions))
    }

    const guidelinesToInsert: {
      content: string
      contextId: number
      active: boolean
    }[] = []
    for (const guidelineContent of guidelinesList) {
      const isExisting = foundExistingGuidelines.some(
        (er) => er.content === guidelineContent,
      )
      if (isExisting) {
        const existingGuideline = foundExistingGuidelines.find(
          (er) => er.content === guidelineContent,
        )
        existingGuidelinesMessages.push({
          guideline: guidelineContent,
          message: 'Guideline already exists for this context.',
          existingGuidelineId: existingGuideline?.id,
        })
      } else {
        guidelinesToInsert.push({
          content: guidelineContent,
          contextId,
          active: false,
        })
      }
    }

    if (guidelinesToInsert.length > 0) {
      const insertResult = await db
        .insert(guidelines)
        .values(guidelinesToInsert)
        .returning({ id: guidelines.id })
      savedCount = insertResult.length
    }

    const allRepoContexts = await db
      .select({
        id: guidelinesContexts.id,
        name: guidelinesContexts.name,
      })
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.repositoryId, repositoryId))
      .orderBy(guidelinesContexts.id)

    const currentIndex = allRepoContexts.findIndex((c) => c.id === contextId)
    let promptText: string

    if (currentIndex !== -1 && currentIndex < allRepoContexts.length - 1) {
      const nextContext = allRepoContexts[currentIndex + 1]
      const remainingContextsAfterNext = allRepoContexts.slice(currentIndex + 2)

      promptText = await readPrompt(
        'guidelines',
        'continueGuidelinesAnalysis',
        {
          nextContextId: nextContext.id,
          nextContextName: nextContext.name,
          remainingContextsList: JSON.stringify(
            remainingContextsAfterNext.map((c) => ({ id: c.id, name: c.name })),
          ),
          remainingContextsListIsNotEmpty:
            remainingContextsAfterNext.length > 0,
        },
      )
      console.log(
        `[SaveGuidelines Handler] Saved ${savedCount} guidelines for context ${contextId}. Next context: ID ${nextContext.id} ("${nextContext.name}")`,
      )
    } else {
      promptText = `Guidelines analysis complete for all contexts. Saved ${savedCount} guidelines for the last context (ID: ${contextId}). ${existingGuidelinesMessages.length} guidelines already existed. ${errors.length} errors.`
      console.log(
        `[SaveGuidelines Handler] Saved ${savedCount} guidelines for context ${contextId}. This was the last context.`,
      )
    }

    return { content: [{ type: 'text', text: promptText }] }
  } catch (error) {
    console.error('[SaveGuidelines Handler] Caught error:', error)
    if (error instanceof McpError) {
      throw error
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Operation failed in handleSaveGuidelines: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
