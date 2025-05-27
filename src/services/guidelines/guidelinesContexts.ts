import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { guidelinesContexts } from '@/db/schema'
import { findOrCreateRepositoryByPath } from '@/services/repositoryService'

import type { GuidelinesContext } from './types'

export const getGuidelinesContexts = async (
  repositoryPath: string,
  gitOriginUrl?: string | null,
): Promise<{ contexts: GuidelinesContext[]; repositoryId: number }> => {
  try {
    const { id: repositoryId } = await findOrCreateRepositoryByPath(
      repositoryPath,
      gitOriginUrl || null,
    )

    const contexts = await db
      .select()
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.repositoryId, repositoryId))

    return { contexts, repositoryId }
  } catch (error) {
    console.error('Error fetching contexts:', error)
    throw new Error('Failed to fetch contexts.')
  }
}

export const createGuidelinesContext = async (
  name: string,
  prompt: string,
  repositoryPath: string,
  gitOriginUrl?: string | null,
): Promise<GuidelinesContext> => {
  try {
    const { id: repositoryId } = await findOrCreateRepositoryByPath(
      repositoryPath,
      gitOriginUrl || null,
    )

    const existingContext = await db
      .select()
      .from(guidelinesContexts)
      .where(
        and(
          eq(guidelinesContexts.name, name),
          eq(guidelinesContexts.repositoryId, repositoryId),
        ),
      )

    if (existingContext.length > 0) {
      throw new Error(
        `A context with the name "${name}" already exists for this repository.`,
      )
    }

    const [newContext] = await db
      .insert(guidelinesContexts)
      .values({ name, prompt, repositoryId })
      .returning()

    return newContext
  } catch (error) {
    console.error('Error creating guidelines context:', error)
    throw new Error('Failed to create guidelines context.')
  }
}

export const updateGuidelinesContext = async (
  id: number,
  name: string,
  prompt: string,
): Promise<GuidelinesContext> => {
  try {
    const currentContext = await db
      .select({ repositoryId: guidelinesContexts.repositoryId })
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.id, id))
      .limit(1)

    if (currentContext.length === 0) {
      throw new Error('Context not found.')
    }
    const actualRepositoryId = currentContext[0].repositoryId

    const otherContextWithSameName = await db
      .select({ id: guidelinesContexts.id })
      .from(guidelinesContexts)
      .where(
        and(
          eq(guidelinesContexts.name, name),
          eq(guidelinesContexts.repositoryId, actualRepositoryId),
        ),
      )
      .limit(1)

    if (
      otherContextWithSameName.length > 0 &&
      otherContextWithSameName[0].id !== id
    ) {
      throw new Error(
        `A context with the name "${name}" already exists in this repository.`,
      )
    }

    const [updatedContext] = await db
      .update(guidelinesContexts)
      .set({ name, prompt })
      .where(eq(guidelinesContexts.id, id))
      .returning()

    if (!updatedContext) {
      throw new Error('Context not found.')
    }

    return updatedContext
  } catch (error) {
    console.error('Error updating guidelines context:', error)
    throw new Error('Failed to update guidelines context.')
  }
}

export const deleteGuidelinesContext = async (id: number): Promise<void> => {
  try {
    const [deletedContext] = await db
      .delete(guidelinesContexts)
      .where(eq(guidelinesContexts.id, id))
      .returning()

    if (!deletedContext) {
      throw new Error('Context not found.')
    }
  } catch (error) {
    console.error('Error deleting guidelines context:', error)
    throw new Error('Failed to delete guidelines context.')
  }
}
