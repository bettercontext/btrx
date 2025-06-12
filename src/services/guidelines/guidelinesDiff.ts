import { diffArrays } from 'diff'
import { asc, count, eq, gt } from 'drizzle-orm'

import { db } from '@/db'
import { guidelinesContent, guidelinesContexts } from '@/db/schema'

import { normalizeGuidelineContent, parseGuidelinesText } from './textParser'

export const getCurrentGuidelines = async (
  contextId: number,
): Promise<string | null> => {
  const currentVersion = await db
    .select({ content: guidelinesContent.content })
    .from(guidelinesContent)
    .where(eq(guidelinesContent.contextId, contextId))
    .orderBy(asc(guidelinesContent.id))
    .limit(1)

  return currentVersion.length > 0 ? currentVersion[0].content : null
}

export const saveCurrentGuidelines = async (
  contextId: number,
  content: string,
): Promise<void> => {
  const existingEntriesCount = await db
    .select({ value: count() })
    .from(guidelinesContent)
    .where(eq(guidelinesContent.contextId, contextId))

  const existingEntriesDetails = await db
    .select({ id: guidelinesContent.id, content: guidelinesContent.content })
    .from(guidelinesContent)
    .where(eq(guidelinesContent.contextId, contextId))
    .orderBy(asc(guidelinesContent.id))

  console.log(
    `Debug: Context ID ${contextId}, Number of existing entries: ${existingEntriesCount[0].value}`,
  )
  console.log(
    `Debug: Existing entries for Context ID ${contextId}:`,
    existingEntriesDetails.map((entry) => ({
      id: entry.id,
      contentPreview:
        entry.content.length > 50
          ? `${entry.content.substring(0, 50)}...`
          : entry.content,
    })),
  )
  console.log(
    `Debug: Incoming payload to save for Context ID ${contextId} (preview):`,
    content.length > 50 ? `${content.substring(0, 50)}...` : content,
  )

  if (existingEntriesCount[0].value >= 2) {
    console.log(
      `Debug: Error triggered for Context ID ${contextId} due to multiple entries (${existingEntriesCount[0].value}).`,
    )
    throw new Error(
      'A diff is already in progress for this context. Please validate or cancel the existing diff before continuing.',
    )
  }

  // Check for identical content when there's exactly one existing entry
  if (existingEntriesCount[0].value === 1) {
    const existingContent = existingEntriesDetails[0].content
    if (existingContent === content) {
      console.log(
        `Debug: Identical content detected for Context ID ${contextId}. No changes to save.`,
      )
      throw new Error(
        'No changes detected. The new guidelines are identical to the existing ones.',
      )
    }
  }

  await db.insert(guidelinesContent).values({
    contextId,
    content,
  })
}

/**
 * Get all contexts that have pending guideline versions (more than one version).
 */
export const getContextsWithPendingVersions = async (): Promise<
  { id: number; name: string; repositoryId: number }[]
> => {
  const contexts = await db
    .select({
      id: guidelinesContexts.id,
      name: guidelinesContexts.name,
      repositoryId: guidelinesContexts.repositoryId,
      versionCount: count(guidelinesContent.id),
    })
    .from(guidelinesContexts)
    .leftJoin(
      guidelinesContent,
      eq(guidelinesContexts.id, guidelinesContent.contextId),
    )
    .groupBy(guidelinesContexts.id)
    .having(gt(count(guidelinesContent.id), 1))

  return contexts.map((ctx) => ({
    id: ctx.id,
    name: ctx.name,
    repositoryId: ctx.repositoryId,
  }))
}

/**
 * Get the diff between current and pending guideline versions for a specific context.
 * Uses the 'diff' library to compute guideline-level differences.
 */
export const getGuidelinesDiff = async (
  contextId: number,
): Promise<{ contextName: string; diff: any[] }> => {
  const context = await db
    .select({ name: guidelinesContexts.name })
    .from(guidelinesContexts)
    .where(eq(guidelinesContexts.id, contextId))
    .limit(1)

  if (context.length === 0) {
    throw new Error(`Context with ID ${contextId} not found.`)
  }

  const versions = await db
    .select({ id: guidelinesContent.id, content: guidelinesContent.content })
    .from(guidelinesContent)
    .where(eq(guidelinesContent.contextId, contextId))
    .orderBy(asc(guidelinesContent.id))
    .limit(2)

  if (versions.length < 2) {
    throw new Error(`No pending version found for context ID ${contextId}.`)
  }

  const currentContent = versions[0].content || ''
  const pendingContent = versions[1].content || ''

  // Parse guidelines to get the actual guideline entities
  const currentGuidelines = parseGuidelinesText(currentContent)
  const pendingGuidelines = parseGuidelinesText(pendingContent)

  // Extract normalized content for comparison, removing [DISABLED] state
  const currentGuidelineContents = currentGuidelines.map((g) =>
    normalizeGuidelineContent(g.content),
  )
  const pendingGuidelineContents = pendingGuidelines.map((g) =>
    normalizeGuidelineContent(g.content),
  )

  // Use diffArrays to compare guidelines as complete entities
  const diffResult = diffArrays(
    currentGuidelineContents,
    pendingGuidelineContents,
  )

  return {
    contextName: context[0].name,
    diff: diffResult,
  }
}

/**
 * Validate the pending version as the new current version, removing the old current version.
 */
export const validatePendingGuidelines = async (
  contextId: number,
): Promise<void> => {
  const versions = await db
    .select({ id: guidelinesContent.id, content: guidelinesContent.content })
    .from(guidelinesContent)
    .where(eq(guidelinesContent.contextId, contextId))
    .orderBy(asc(guidelinesContent.id))
    .limit(2)

  if (versions.length < 2) {
    throw new Error(
      `No pending version to validate for context ID ${contextId}.`,
    )
  }

  const parsedCurrent = parseGuidelinesText(versions[0].content)
  const parsedPending = parseGuidelinesText(versions[1].content)

  const currentNormalizedArr = parsedCurrent.map((g) =>
    normalizeGuidelineContent(g.content),
  )
  const pendingNormalizedArr = parsedPending.map((g) =>
    normalizeGuidelineContent(g.content),
  )

  const diff = diffArrays(currentNormalizedArr, pendingNormalizedArr)

  const finalGuidelines: { content: string; active: boolean }[] = []
  let currentArrIdx = 0
  let pendingArrIdx = 0
  let lastSingleRemovedGuidelineState: boolean | null = null // Renamed for clarity

  for (const part of diff) {
    if (part.removed) {
      // If a single guideline is removed, store its active state.
      // This state might be used by a subsequent 'added' part if it's a modification.
      if (part.count === 1 && currentArrIdx < parsedCurrent.length) {
        lastSingleRemovedGuidelineState = parsedCurrent[currentArrIdx].active
      } else {
        // If multiple items are removed, or no current guideline to reference,
        // then there's no single state to carry over.
        lastSingleRemovedGuidelineState = null
      }
      currentArrIdx += part.count
      continue // Important: Don't reset lastSingleRemovedGuidelineState yet.
    }

    if (part.added) {
      for (let i = 0; i < part.count; i++) {
        // Ensure pendingArrIdx is within bounds
        if (pendingArrIdx < parsedPending.length) {
          const pendingGuideline = parsedPending[pendingArrIdx++]
          let activeState = pendingGuideline.active // Default to its own parsed state

          // If this is the first added item (i === 0) AND
          // the immediately preceding operation was a single removal,
          // then this added item inherits the state of the removed item.
          if (lastSingleRemovedGuidelineState !== null && i === 0) {
            activeState = lastSingleRemovedGuidelineState
            lastSingleRemovedGuidelineState = null // Consume the state; it applies only to this first added item
          }
          finalGuidelines.push({
            content: pendingGuideline.content,
            active: activeState,
          })
        }
      }
    } else {
      // Common part: content from pending, active state from current
      for (let i = 0; i < part.count; i++) {
        // Ensure indices are within bounds
        if (
          currentArrIdx < parsedCurrent.length &&
          pendingArrIdx < parsedPending.length
        ) {
          const currentGuideline = parsedCurrent[currentArrIdx++]
          const pendingGuideline = parsedPending[pendingArrIdx++]
          finalGuidelines.push({
            content: pendingGuideline.content, // Take content from pending
            active: currentGuideline.active, // Preserve active state from current
          })
        }
      }
      // If we encounter a common part, any previous single removal state is irrelevant now.
      lastSingleRemovedGuidelineState = null
    }
  }

  const updatedContent = finalGuidelines
    .map((g) => (g.active ? g.content : `[DISABLED] ${g.content}`))
    .join('\n-_-_-\n')
    .trim() // Ensure no leading/trailing newlines if all content removed

  // Update content of pending version
  await db
    .update(guidelinesContent)
    .set({ content: updatedContent })
    .where(eq(guidelinesContent.id, versions[1].id))

  // Delete the old current version (smallest ID)
  await db
    .delete(guidelinesContent)
    .where(eq(guidelinesContent.id, versions[0].id))
}

/**
 * Cancel the pending version, removing it and keeping the current version.
 */
export const cancelPendingGuidelines = async (
  contextId: number,
): Promise<void> => {
  const versions = await db
    .select({ id: guidelinesContent.id })
    .from(guidelinesContent)
    .where(eq(guidelinesContent.contextId, contextId))
    .orderBy(asc(guidelinesContent.id))
    .limit(2)

  if (versions.length < 2) {
    throw new Error(`No pending version to cancel for context ID ${contextId}.`)
  }

  // Delete the pending version (largest ID)
  await db
    .delete(guidelinesContent)
    .where(eq(guidelinesContent.id, versions[1].id))
}
