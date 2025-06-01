import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { guidelinesContexts, repositories } from '@/db/schema'

export const findRepositoryByPath = async (
  currentPath: string,
  gitOriginUrl: string | null,
): Promise<{ id: number } | null> => {
  if (!currentPath || typeof currentPath !== 'string') {
    throw new Error('Missing or invalid "currentPath" argument.')
  }

  try {
    // Use git origin URL if available, otherwise use the current path
    const identifier = gitOriginUrl || currentPath

    const repo = await db
      .select({
        id: repositories.id,
        origin: repositories.origin,
      })
      .from(repositories)
      .where(eq(repositories.origin, identifier))
      .limit(1)

    if (repo.length > 0) {
      return { id: repo[0].id }
    }

    // Repository not found, return null instead of creating
    return null
  } catch (error) {
    console.error(
      `Error searching repository with path "${currentPath}":`,
      error,
    )
    throw new Error(`Failed to search repository for path "${currentPath}".`)
  }
}

export const findOrCreateRepositoryByPath = async (
  currentPath: string,
  gitOriginUrl: string | null,
): Promise<{ id: number }> => {
  if (!currentPath || typeof currentPath !== 'string') {
    throw new Error('Missing or invalid "currentPath" argument.')
  }

  try {
    // Use git origin URL if available, otherwise use the current path
    const identifier = gitOriginUrl || currentPath

    const repo = await db
      .select({
        id: repositories.id,
        origin: repositories.origin,
      })
      .from(repositories)
      .where(eq(repositories.origin, identifier))
      .limit(1)

    if (repo.length > 0) {
      return { id: repo[0].id }
    }

    // If no existing repo found, create new one
    const newRepo = await db
      .insert(repositories)
      .values({
        origin: identifier,
      })
      .returning({ id: repositories.id })

    if (newRepo.length > 0) {
      return { id: newRepo[0].id }
    } else {
      throw new Error('Failed to create repository entry.')
    }
  } catch (error) {
    console.error(
      `Error processing repository with path "${currentPath}":`,
      error,
    )
    throw new Error(
      `Failed to process repository request for path "${currentPath}".`,
    )
  }
}

/**
 * Get all repositories from the database.
 * @returns A list of all repositories.
 */
export const getAllRepositories = async (): Promise<
  {
    id: number
    origin: string
  }[]
> => {
  try {
    const repos = await db
      .select({
        id: repositories.id,
        origin: repositories.origin,
      })
      .from(repositories)

    return repos
  } catch (error) {
    console.error('Error fetching repositories:', error)
    throw new Error('Failed to fetch repositories.')
  }
}

/**
 * Update a repository.
 * @param id Repository ID
 * @param data Updated repository data
 * @returns Updated repository
 */
export const updateRepository = async (
  id: number,
  data: {
    origin?: string
  },
): Promise<{
  id: number
  origin: string
}> => {
  try {
    const updated = await db
      .update(repositories)
      .set(data)
      .where(eq(repositories.id, id))
      .returning({
        id: repositories.id,
        origin: repositories.origin,
      })

    if (updated.length === 0) {
      throw new Error('Repository not found.')
    }

    return updated[0]
  } catch (error) {
    console.error('Error updating repository:', error)
    throw new Error('Failed to update repository.')
  }
}

/**
 * Delete a repository and all its associated data.
 * This will cascade delete all guidelines_contexts and their related guidelines_content.
 * @param id Repository ID
 */
export const deleteRepository = async (id: number): Promise<void> => {
  try {
    await db.transaction(async (tx) => {
      // First check if repository exists
      const existingRepo = await tx
        .select({ id: repositories.id })
        .from(repositories)
        .where(eq(repositories.id, id))
        .limit(1)

      if (existingRepo.length === 0) {
        throw new Error('Repository not found.')
      }

      // Delete all guidelines_contexts for this repository
      // This will cascade delete all guidelines_content due to the FK constraint with onDelete: 'cascade'
      await tx
        .delete(guidelinesContexts)
        .where(eq(guidelinesContexts.repositoryId, id))

      // Then delete the repository itself
      await tx.delete(repositories).where(eq(repositories.id, id))
    })
  } catch (error) {
    console.error('Error deleting repository:', error)
    if (error instanceof Error && error.message === 'Repository not found.') {
      throw error
    }
    throw new Error('Failed to delete repository.')
  }
}
