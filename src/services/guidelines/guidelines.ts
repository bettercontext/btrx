import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { guidelines, guidelinesContexts } from '@/db/schema'
import {
  findOrCreateRepositoryByPath,
  findRepositoryByPath,
} from '@/services/repositoryService'

import type { Guideline } from './types'

export const getGuidelinesForRepositoryById = async (
  repositoryId: number,
  contextName?: string,
): Promise<Guideline[]> => {
  try {
    const baseQuery = db
      .select({
        id: guidelines.id,
        content: guidelines.content,
        active: guidelines.active,
        contextId: guidelines.contextId,
        contextRepositoryId: guidelinesContexts.repositoryId,
        contextName: guidelinesContexts.name,
      })
      .from(guidelines)
      .leftJoin(
        guidelinesContexts,
        eq(guidelines.contextId, guidelinesContexts.id),
      )

    const conditions = [eq(guidelinesContexts.repositoryId, repositoryId)]

    if (contextName) {
      conditions.push(eq(guidelinesContexts.name, contextName))
    }

    const guidelinesRes = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(guidelines.id))

    const validGuidelines = guidelinesRes.filter(
      (
        guideline,
      ): guideline is {
        id: number
        content: string
        active: boolean
        contextId: number
        contextName: string
        contextRepositoryId: number
      } => Boolean(guideline.contextRepositoryId && guideline.contextName),
    )

    if (validGuidelines.length !== guidelinesRes.length) {
      throw new Error(
        'Incomplete guideline data: some guidelines have missing contextRepositoryId or contextName',
      )
    }

    return validGuidelines.map(
      ({ contextRepositoryId, ...guideline }) => guideline,
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Incomplete guideline data')
    ) {
      throw error
    }
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

export const createGuideline = async (
  content: string,
  contextName: string,
  repositoryPath: string,
  gitOriginUrl?: string | null,
): Promise<Guideline> => {
  try {
    const { id: repositoryId } = await findOrCreateRepositoryByPath(
      repositoryPath,
      gitOriginUrl || null,
    )

    const contextResult = await db
      .select({ id: guidelinesContexts.id })
      .from(guidelinesContexts)
      .where(
        and(
          eq(guidelinesContexts.name, contextName),
          eq(guidelinesContexts.repositoryId, repositoryId),
        ),
      )
      .limit(1)

    if (contextResult.length === 0) {
      throw new Error(
        `Context "${contextName}" not found for repository "${repositoryPath}"`,
      )
    }
    const contextId = contextResult[0].id

    const existingGuidelines = await db
      .select()
      .from(guidelines)
      .where(
        and(
          eq(guidelines.content, content),
          eq(guidelines.contextId, contextId),
        ),
      )
      .limit(1)

    if (existingGuidelines.length > 0) {
      throw new Error('This guideline already exists for the given context.')
    }

    const insertedResults = await db
      .insert(guidelines)
      .values({
        content,
        contextId,
        active: false,
      })
      .returning()

    if (insertedResults.length === 0) {
      throw new Error('Failed to create guideline.')
    }

    const [insertedRule] = insertedResults

    const completeGuidelineResults = await db
      .select({
        id: guidelines.id,
        content: guidelines.content,
        active: guidelines.active,
        contextId: guidelines.contextId,
        contextName: guidelinesContexts.name,
      })
      .from(guidelines)
      .leftJoin(
        guidelinesContexts,
        eq(guidelines.contextId, guidelinesContexts.id),
      )
      .where(eq(guidelines.id, insertedRule.id))
      .orderBy(desc(guidelines.id))

    const [completeGuideline] = completeGuidelineResults

    if (!completeGuideline || !completeGuideline.contextName) {
      throw new Error('Failed to create guideline with context.')
    }

    return completeGuideline as Guideline
  } catch (error) {
    if (
      error instanceof Error &&
      ((error.message.includes('Context') &&
        error.message.includes('not found')) ||
        error.message.includes('already exists') ||
        error.message.includes('Failed to create guideline'))
    ) {
      throw error
    }
    console.error('Error creating guideline:', error)
    throw new Error('Failed to create guideline.')
  }
}

export const updateGuidelineState = async (
  id: number,
  active: boolean,
): Promise<Guideline> => {
  try {
    const guidelineResults = await db
      .select({
        id: guidelines.id,
        content: guidelines.content,
        active: guidelines.active,
        contextId: guidelines.contextId,
        contextName: guidelinesContexts.name,
      })
      .from(guidelines)
      .leftJoin(
        guidelinesContexts,
        eq(guidelines.contextId, guidelinesContexts.id),
      )
      .where(eq(guidelines.id, id))
      .limit(1)

    if (guidelineResults.length === 0) {
      throw new Error('Guideline not found.')
    }

    const [guideline] = guidelineResults

    if (!guideline.contextName) {
      throw new Error('Guideline not found.')
    }

    const updateResults = await db
      .update(guidelines)
      .set({ active })
      .where(eq(guidelines.id, id))
      .returning()

    if (updateResults.length === 0) {
      throw new Error('Failed to update guideline state.')
    }

    const [result] = updateResults

    return { ...result, contextName: guideline.contextName }
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
  content: string,
): Promise<Guideline> => {
  try {
    const guidelineResults = await db
      .select({
        id: guidelines.id,
        content: guidelines.content,
        active: guidelines.active,
        contextId: guidelines.contextId,
        contextName: guidelinesContexts.name,
      })
      .from(guidelines)
      .leftJoin(
        guidelinesContexts,
        eq(guidelines.contextId, guidelinesContexts.id),
      )
      .where(eq(guidelines.id, id))
      .limit(1)

    if (guidelineResults.length === 0) {
      throw new Error('Guideline not found.')
    }

    const [guideline] = guidelineResults

    if (!guideline.contextName) {
      throw new Error('Guideline not found.')
    }

    const updateResults = await db
      .update(guidelines)
      .set({ content })
      .where(eq(guidelines.id, id))
      .returning()

    if (updateResults.length === 0) {
      throw new Error('Failed to update guideline content.')
    }

    const [result] = updateResults

    return { ...result, contextName: guideline.contextName }
  } catch (error) {
    if (error instanceof Error && error.message === 'Guideline not found.') {
      throw error
    }
    console.error('Error updating guideline content:', error)
    throw new Error('Failed to update guideline content.')
  }
}

export const deleteGuideline = async (id: number): Promise<Guideline> => {
  try {
    const guidelineResults = await db
      .select({
        id: guidelines.id,
        content: guidelines.content,
        active: guidelines.active,
        contextId: guidelines.contextId,
        contextName: guidelinesContexts.name,
      })
      .from(guidelines)
      .leftJoin(
        guidelinesContexts,
        eq(guidelines.contextId, guidelinesContexts.id),
      )
      .where(eq(guidelines.id, id))
      .limit(1)

    if (guidelineResults.length === 0) {
      throw new Error('Guideline not found.')
    }

    const [guideline] = guidelineResults

    if (!guideline.contextName) {
      throw new Error('Guideline not found.')
    }

    const deleteResults = await db
      .delete(guidelines)
      .where(eq(guidelines.id, id))
      .returning()

    if (deleteResults.length === 0) {
      throw new Error('Failed to delete guideline.')
    }

    const [result] = deleteResults

    return { ...result, contextName: guideline.contextName }
  } catch (error) {
    if (error instanceof Error && error.message === 'Guideline not found.') {
      throw error
    }
    console.error('Error deleting guideline:', error)
    throw new Error('Failed to delete guideline.')
  }
}
