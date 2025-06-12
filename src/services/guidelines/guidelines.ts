import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { guidelinesContent, guidelinesContexts } from '@/db/schema'
import { findRepositoryByPath } from '@/services/repositoryService'

import { cleanupEmptyContent } from './cleanupEmptyContent'
import {
  addGuidelineToText,
  normalizeGuidelineContent,
  parseGuidelinesText,
  removeGuidelineFromText,
  toggleGuidelineStateInText,
  updateGuidelineInText,
} from './textParser'
import type { Guideline } from './types'
import {
  findGuidelineByVirtualId,
  generateVirtualId,
  parseGuidelinesToVirtual,
} from './virtualIds'

async function getOrCreateGuidelinesContent(
  contextId: number,
): Promise<string> {
  const existingContent = await db
    .select({ content: guidelinesContent.content })
    .from(guidelinesContent)
    .where(eq(guidelinesContent.contextId, contextId))
    .limit(1)

  if (existingContent.length > 0) {
    return existingContent[0].content
  }

  await db.insert(guidelinesContent).values({
    contextId,
    content: '',
  })

  return ''
}

async function updateGuidelinesContent(
  contextId: number,
  content: string,
): Promise<void> {
  await db
    .update(guidelinesContent)
    .set({ content })
    .where(eq(guidelinesContent.contextId, contextId))
}

export const getGuidelinesForRepositoryById = async (
  repositoryId: number,
  contextName?: string,
): Promise<Guideline[]> => {
  try {
    const whereConditions = [eq(guidelinesContexts.repositoryId, repositoryId)]

    if (contextName) {
      whereConditions.push(eq(guidelinesContexts.name, contextName))
    }

    const contexts = await db
      .select({
        id: guidelinesContexts.id,
        name: guidelinesContexts.name,
        content: guidelinesContent.content,
        contentId: guidelinesContent.id,
      })
      .from(guidelinesContexts)
      .leftJoin(
        guidelinesContent,
        eq(guidelinesContexts.id, guidelinesContent.contextId),
      )
      .where(and(...whereConditions))
      .orderBy(asc(guidelinesContent.id))

    const allGuidelines: Guideline[] = []
    const guidelinesByContext = new Map<number, Guideline[]>()

    for (const context of contexts) {
      const textContent = context.content || ''
      const parsedGuidelines = parseGuidelinesText(textContent)
      const guidelinesWithIds = parseGuidelinesToVirtual(
        context.id,
        parsedGuidelines,
      )

      const guidelines = guidelinesWithIds.map((guideline) => ({
        id: guideline.id,
        content: guideline.content,
        active: guideline.active,
        contextId: context.id,
        contextName: context.name,
      }))

      if (guidelinesByContext.has(context.id)) {
        const existingGuidelines = guidelinesByContext.get(context.id)
        if (existingGuidelines) {
          existingGuidelines.push(...guidelines)
        }
      } else {
        guidelinesByContext.set(context.id, guidelines)
      }
    }

    for (const guidelines of guidelinesByContext.values()) {
      allGuidelines.push(...guidelines)
    }

    return allGuidelines
  } catch (error) {
    console.error('Error fetching guidelines by repository ID:', error)
    throw new Error('Failed to fetch guidelines.')
  }
}

export const getGuidelinesForRepository = async (
  repositoryPath: string,
  gitOriginUrl?: string | null,
  contextName?: string,
): Promise<Guideline[]> => {
  try {
    const repository = await findRepositoryByPath(
      repositoryPath,
      gitOriginUrl || null,
    )

    if (!repository) {
      return []
    }

    return getGuidelinesForRepositoryById(repository.id, contextName)
  } catch (error) {
    console.error('Error fetching guidelines:', error)
    throw new Error('Failed to fetch guidelines.')
  }
}

export const createGuidelineByContextId = async (
  content: string,
  contextId: number,
): Promise<Guideline> => {
  try {
    const contextResult = await db
      .select({ id: guidelinesContexts.id, name: guidelinesContexts.name })
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.id, contextId))
      .limit(1)

    if (contextResult.length === 0) {
      throw new Error(`Context with ID "${contextId}" not found`)
    }

    const context = contextResult[0]

    const existingContent = await getOrCreateGuidelinesContent(contextId)
    const existingGuidelines = parseGuidelinesText(existingContent)

    const normalizedNewContent = normalizeGuidelineContent(content)
    const duplicateExists = existingGuidelines.some(
      (g) => normalizeGuidelineContent(g.content) === normalizedNewContent,
    )
    if (duplicateExists) {
      throw new Error('This guideline already exists for the given context.')
    }

    const newContent = addGuidelineToText(existingContent, content, true)
    await updateGuidelinesContent(contextId, newContent)

    const newGuidelines = parseGuidelinesText(newContent)
    const addedGuideline = newGuidelines.find(
      (g) => normalizeGuidelineContent(g.content) === normalizedNewContent,
    )

    if (!addedGuideline) {
      throw new Error('Failed to create guideline.')
    }

    // Find the position of the added guideline in the array
    const idx = newGuidelines.findIndex(
      (g) => normalizeGuidelineContent(g.content) === normalizedNewContent,
    )
    const virtualId = generateVirtualId(contextId, idx)

    return {
      id: virtualId,
      content: addedGuideline.content,
      active: addedGuideline.active,
      contextId,
      contextName: context.name,
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Context') ||
        error.message.includes('already exists') ||
        error.message.includes('Failed to create guideline'))
    ) {
      throw error
    }
    console.error('Error creating guideline by context ID:', error)
    throw new Error('Failed to create guideline.')
  }
}

export const updateGuidelineState = async (
  id: number,
  active: boolean,
): Promise<Guideline> => {
  try {
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

    let foundGuideline: Guideline | null = null
    let foundContext: {
      id: number
      name: string
      content: string | null
    } | null = null

    for (const context of allContexts) {
      const textContent = context.content || ''
      const parsedGuidelines = parseGuidelinesText(textContent)
      const guideline = findGuidelineByVirtualId(
        parsedGuidelines,
        context.id,
        id,
      )

      if (guideline) {
        foundGuideline = {
          id,
          content: guideline.content,
          active: guideline.active,
          contextId: context.id,
          contextName: context.name,
        }
        foundContext = context
        break
      }
    }

    if (!foundGuideline || !foundContext) {
      throw new Error('Guideline not found.')
    }

    const existingContent = foundContext.content || ''
    const newContent = toggleGuidelineStateInText(
      existingContent,
      foundGuideline.content,
      active,
    )
    await updateGuidelinesContent(foundContext.id, newContent)

    return {
      ...foundGuideline,
      active,
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Guideline not found.') {
      throw error
    }
    console.error('Error updating guideline state:', error)
    throw new Error('Failed to update guideline state.')
  }
}

export const updateGuidelineContent = async (
  id: number,
  newContent: string,
): Promise<Guideline> => {
  try {
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

    let foundGuideline: Guideline | null = null
    let foundContext: {
      id: number
      name: string
      content: string | null
    } | null = null

    for (const context of allContexts) {
      const textContent = context.content || ''
      const parsedGuidelines = parseGuidelinesText(textContent)
      const guideline = findGuidelineByVirtualId(
        parsedGuidelines,
        context.id,
        id,
      )

      if (guideline) {
        foundGuideline = {
          id,
          content: guideline.content,
          active: guideline.active,
          contextId: context.id,
          contextName: context.name,
        }
        foundContext = context
        break
      }
    }

    if (!foundGuideline || !foundContext) {
      throw new Error('Guideline not found.')
    }

    const normalizedNewContent = normalizeGuidelineContent(newContent)
    const existingContent = foundContext.content || ''
    const existingGuidelines = parseGuidelinesText(existingContent)

    const duplicateExists = existingGuidelines.some(
      (g) =>
        g.content !== foundGuideline.content &&
        normalizeGuidelineContent(g.content) === normalizedNewContent,
    )

    if (duplicateExists) {
      throw new Error(
        'A guideline with this content already exists in the context.',
      )
    }

    const updatedContent = updateGuidelineInText(
      existingContent,
      foundGuideline.content,
      newContent,
    )
    await updateGuidelinesContent(foundContext.id, updatedContent)

    const updatedGuidelines = parseGuidelinesText(updatedContent)
    const idx = updatedGuidelines.findIndex(
      (g) =>
        normalizeGuidelineContent(g.content) ===
        normalizeGuidelineContent(newContent),
    )
    const newVirtualId = generateVirtualId(foundContext.id, idx)

    return {
      id: newVirtualId,
      content: newContent,
      active: foundGuideline.active,
      contextId: foundContext.id,
      contextName: foundContext.name,
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Guideline not found.' ||
        error.message.includes('already exists'))
    ) {
      throw error
    }
    console.error('Error updating guideline content:', error)
    throw new Error('Failed to update guideline content.')
  }
}

export const deleteGuideline = async (id: number): Promise<Guideline> => {
  try {
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

    let foundGuideline: Guideline | null = null
    let foundContext: {
      id: number
      name: string
      content: string | null
    } | null = null

    for (const context of allContexts) {
      const textContent = context.content || ''
      const parsedGuidelines = parseGuidelinesText(textContent)
      const guideline = findGuidelineByVirtualId(
        parsedGuidelines,
        context.id,
        id,
      )

      if (guideline) {
        foundGuideline = {
          id,
          content: guideline.content,
          active: guideline.active,
          contextId: context.id,
          contextName: context.name,
        }
        foundContext = context
        break
      }
    }

    if (!foundGuideline || !foundContext) {
      throw new Error('Guideline not found.')
    }

    const existingContent = foundContext.content || ''
    const newContent = removeGuidelineFromText(
      existingContent,
      foundGuideline.content,
    )
    await updateGuidelinesContent(foundContext.id, newContent)

    await cleanupEmptyContent(foundContext.id)

    return foundGuideline
  } catch (error) {
    if (error instanceof Error && error.message === 'Guideline not found.') {
      throw error
    }
    console.error('Error deleting guideline:', error)
    throw new Error('Failed to delete guideline.')
  }
}
