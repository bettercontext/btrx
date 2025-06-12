import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { guidelinesContent, guidelinesContexts } from '@/db/schema'

import { cleanupEmptyContent } from './cleanupEmptyContent'
import {
  parseGuidelinesText,
  removeGuidelineFromText,
  toggleGuidelineStateInText,
} from './textParser'
import type { Guideline } from './types'
import { findGuidelineByVirtualId } from './virtualIds'

async function updateGuidelinesContent(
  contextId: number,
  content: string,
): Promise<void> {
  await db
    .update(guidelinesContent)
    .set({ content })
    .where(eq(guidelinesContent.contextId, contextId))
}

export const bulkUpdateGuidelinesState = async (
  ids: number[],
  active: boolean,
): Promise<Guideline[]> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('At least one guideline ID is required.')
  }

  try {
    // Get all contexts with their content
    const allContexts = await db
      .select({
        id: guidelinesContexts.id,
        name: guidelinesContexts.name,
        content: guidelinesContent.content,
      })
      .from(guidelinesContexts)
      .leftJoin(
        guidelinesContent,
        eq(guidelinesContexts.id, guidelinesContent.contextId),
      )

    const updatedGuidelines: Guideline[] = []
    const contextUpdates = new Map<number, string>()

    // Process each ID and find the corresponding guideline
    for (const id of ids) {
      let found = false

      for (const context of allContexts) {
        const textContent = context.content || ''
        const parsedGuidelines = parseGuidelinesText(textContent)
        const guideline = findGuidelineByVirtualId(
          parsedGuidelines,
          context.id,
          id,
        )

        if (guideline) {
          // Update the guideline state in the text
          let updatedContent = contextUpdates.get(context.id) || textContent
          updatedContent = toggleGuidelineStateInText(
            updatedContent,
            guideline.content,
            active,
          )
          contextUpdates.set(context.id, updatedContent)

          updatedGuidelines.push({
            id,
            content: guideline.content,
            active,
            contextId: context.id,
            contextName: context.name,
          })

          found = true
          break
        }
      }

      if (!found) {
        throw new Error(`Guideline with ID ${id} not found.`)
      }
    }

    // Update all modified contexts
    for (const [contextId, content] of contextUpdates) {
      await updateGuidelinesContent(contextId, content)
    }

    return updatedGuidelines
  } catch (error) {
    console.error('Error updating guidelines state in bulk:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update guidelines state in bulk.')
  }
}

export const bulkDeleteGuidelines = async (
  ids: number[],
): Promise<Guideline[]> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('At least one guideline ID is required.')
  }

  try {
    // Get all contexts with their content
    const allContexts = await db
      .select({
        id: guidelinesContexts.id,
        name: guidelinesContexts.name,
        content: guidelinesContent.content,
      })
      .from(guidelinesContexts)
      .leftJoin(
        guidelinesContent,
        eq(guidelinesContexts.id, guidelinesContent.contextId),
      )

    const deletedGuidelines: Guideline[] = []
    const contextUpdates = new Map<number, string>()

    // Process each ID and find the corresponding guideline
    for (const id of ids) {
      let found = false

      for (const context of allContexts) {
        const textContent = context.content || ''
        const parsedGuidelines = parseGuidelinesText(textContent)
        const guideline = findGuidelineByVirtualId(
          parsedGuidelines,
          context.id,
          id,
        )

        if (guideline) {
          // Remove the guideline from the text
          let updatedContent = contextUpdates.get(context.id) || textContent
          updatedContent = removeGuidelineFromText(
            updatedContent,
            guideline.content,
          )
          contextUpdates.set(context.id, updatedContent)

          deletedGuidelines.push({
            id,
            content: guideline.content,
            active: guideline.active,
            contextId: context.id,
            contextName: context.name,
          })

          found = true
          break
        }
      }

      if (!found) {
        throw new Error(`Guideline with ID ${id} not found.`)
      }
    }

    // Update all modified contexts
    for (const [contextId, content] of contextUpdates) {
      await updateGuidelinesContent(contextId, content)
    }

    // Cleanup empty content
    for (const contextId of contextUpdates.keys()) {
      await cleanupEmptyContent(contextId)
    }

    return deletedGuidelines
  } catch (error) {
    console.error('Error deleting guidelines in bulk:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to delete guidelines in bulk.')
  }
}
