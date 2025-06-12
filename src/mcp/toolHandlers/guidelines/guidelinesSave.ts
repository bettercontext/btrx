import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import { diffArrays } from 'diff'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { guidelinesContexts } from '@/db/schema'
import {
  getCurrentGuidelines,
  saveCurrentGuidelines,
} from '@/services/guidelines'
import {
  normalizeGuidelineContent,
  parseGuidelinesText,
  serializeGuidelinesText,
} from '@/services/guidelines/textParser'
import type { ParsedGuideline } from '@/services/guidelines/types'

const SaveGuidelinesInputSchema = z
  .object({
    guidelines: z.array(z.string().min(1)),
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

  const { guidelines, contextId, remainingContextIds } = parseResult.data

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

    let wasNoChanges = false

    try {
      // Get current guidelines (parsed)
      const currentContentText = await getCurrentGuidelines(contextId)
      const currentParsedGuidelines = currentContentText
        ? parseGuidelinesText(currentContentText)
        : []

      // Parse the input guidelines strings (respecting their [DISABLED] prefixes)
      // The `guidelines` variable here is an array of strings from the input.
      const inputParsedGuidelines: ParsedGuideline[] = parseGuidelinesText(
        guidelines.join('\n-_-_-\n'), // Temporarily join to use existing parser
      )

      // Prepare arrays for diffing (normalized content only)
      const currentNormalizedContents = currentParsedGuidelines.map((g) =>
        normalizeGuidelineContent(g.content),
      )
      const inputNormalizedContents = inputParsedGuidelines.map((g) =>
        normalizeGuidelineContent(g.content),
      )

      // Perform the diff
      const diffResult = diffArrays(
        currentNormalizedContents,
        inputNormalizedContents,
      )

      // Reconstruct the final list of guidelines to be saved
      const finalGuidelinesToSave: ParsedGuideline[] = []
      let currentIdx = 0 // Pointer for currentParsedGuidelines
      let inputIdx = 0 // Pointer for inputParsedGuidelines
      let removedStatesQueue: boolean[] = [] // Queue to store active states of removed guidelines

      for (const part of diffResult) {
        if (part.removed) {
          for (let i = 0; i < part.count; i++) {
            if (currentIdx + i < currentParsedGuidelines.length) {
              removedStatesQueue.push(
                currentParsedGuidelines[currentIdx + i].active,
              )
            }
          }
          currentIdx += part.count
          // Removed items are not added to finalGuidelinesToSave directly
          // Their state is transferred if they are part of a modification (handled in 'added' block)
        } else if (part.added) {
          for (let i = 0; i < part.count; i++) {
            // Ensure inputIdx is within bounds
            if (inputIdx < inputParsedGuidelines.length) {
              const addedGuidelineFromInput = inputParsedGuidelines[inputIdx++]
              let finalActiveState = addedGuidelineFromInput.active // Default state

              // If there's a state in the queue, it means this added item
              // is likely a modification of a previously removed item.
              if (removedStatesQueue.length > 0) {
                // Default to true (active) if shift() were to return undefined,
                // though the length check should prevent this.
                finalActiveState = removedStatesQueue.shift() ?? true
              }
              finalGuidelinesToSave.push({
                line: 0, // Line number is not critical here
                content: addedGuidelineFromInput.content,
                active: finalActiveState,
              })
            }
          }
        } else {
          // Common part (value is in both arrays)
          for (let i = 0; i < part.count; i++) {
            // Ensure indices are within bounds
            if (
              currentIdx < currentParsedGuidelines.length &&
              inputIdx < inputParsedGuidelines.length
            ) {
              const originalGuideline = currentParsedGuidelines[currentIdx++]
              const newGuidelineData = inputParsedGuidelines[inputIdx++] // consume from input
              finalGuidelinesToSave.push({
                line: 0, // Line number is not critical here
                content: newGuidelineData.content, // Use content from input
                active: originalGuideline.active, // Preserve active state from current
              })
            }
          }
          // If common items are found, any preceding removed states were truly removed,
          // not part of a modification that results in a common item.
          // Or, if they were part of a modification, the 'added' block already consumed them.
          removedStatesQueue = []
        }
      }
      const serializedContent = serializeGuidelinesText(finalGuidelinesToSave)

      // Save as single entry for this context
      await saveCurrentGuidelines(contextId, serializedContent)
      console.log(
        `[GuidelinesSave Handler] Saved ${guidelines.length} guidelines as single entry for context ${contextId}`,
      )
    } catch (error) {
      // Handle "no changes detected" error gracefully
      if (
        error instanceof Error &&
        error.message.includes('No changes detected')
      ) {
        console.log(
          `[GuidelinesSave Handler] No changes detected for context ${contextId}, continuing workflow`,
        )
        wasNoChanges = true
      } else {
        console.error(
          `[GuidelinesSave Handler] Failed to save guidelines for context ${contextId}:`,
          error,
        )
        // Throw McpError for operation failures
        throw new McpError(ErrorCode.InternalError, 'Failed to save guidelines')
      }
    }

    let promptText: string

    if (remainingContextIds.length > 0) {
      if (wasNoChanges) {
        promptText = `No changes detected for context ${contextId} (guidelines identical to existing). Continue with: guidelines_analysis({"contextIds": ${JSON.stringify(remainingContextIds)}})`
      } else {
        promptText = `Guidelines saved for context ${contextId}. Continue with: guidelines_analysis({"contextIds": ${JSON.stringify(remainingContextIds)}})`
      }
      console.log(
        `[GuidelinesSave Handler] ${wasNoChanges ? 'No changes for' : 'Saved guidelines for'} context ${contextId}. Next contexts: ${remainingContextIds.join(', ')}`,
      )
    } else {
      if (wasNoChanges) {
        promptText = `Guidelines analysis complete for all selected contexts! No changes detected for context ${contextId} (guidelines identical to existing).`
      } else {
        promptText = `Guidelines analysis complete for all selected contexts! Guidelines saved for context ${contextId}.`
      }
      console.log(
        `[GuidelinesSave Handler] ${wasNoChanges ? 'No changes for' : 'Saved guidelines for'} context ${contextId}. Analysis complete.`,
      )
    }

    return { content: [{ type: 'text', text: promptText }] }
  } catch (error) {
    console.error('[GuidelinesSave Handler] Caught error:', error)
    // Handle MCP errors
    // Re-throw MCP errors (validation errors)
    if (error instanceof McpError) {
      throw error
    }
    // Wrap other errors in McpError
    throw new McpError(ErrorCode.InternalError, 'Failed to save guidelines')
  }
}
