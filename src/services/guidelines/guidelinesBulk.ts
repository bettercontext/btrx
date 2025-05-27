import { eq, inArray } from 'drizzle-orm'

import { db } from '@/db'
import { guidelines, guidelinesContexts } from '@/db/schema'

import type { Guideline } from './types'

export const bulkUpdateGuidelinesState = async (
  ids: number[],
  active: boolean,
): Promise<Guideline[]> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('At least one guideline ID is required.')
  }

  try {
    // First get existing guidelines with context names
    const existingGuidelines = await db
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
      .where(inArray(guidelines.id, ids))

    if (existingGuidelines.length === 0) {
      throw new Error('No guidelines found with the provided IDs.')
    }

    // Then update and merge with context names
    const updatedResults = await db
      .update(guidelines)
      .set({ active })
      .where(inArray(guidelines.id, ids))
      .returning()

    // Map results ensuring all required fields are present
    return updatedResults.map((result) => {
      const existing = existingGuidelines.find((g) => g.id === result.id)
      if (!existing || !existing.contextName) {
        throw new Error(`Missing context data for guideline ${result.id}`)
      }
      return { ...result, contextName: existing.contextName }
    })
  } catch (error) {
    console.error('Error updating guidelines state in bulk:', error)
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
    // First get existing guidelines with context names
    const existingGuidelines = await db
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
      .where(inArray(guidelines.id, ids))

    if (existingGuidelines.length === 0) {
      throw new Error('No guidelines found with the provided IDs.')
    }

    // Then delete and return with context names
    const deletedResults = await db
      .delete(guidelines)
      .where(inArray(guidelines.id, ids))
      .returning()

    // Map results ensuring all required fields are present
    return deletedResults.map((result) => {
      const existing = existingGuidelines.find((g) => g.id === result.id)
      if (!existing || !existing.contextName) {
        throw new Error(`Missing context data for guideline ${result.id}`)
      }
      return { ...result, contextName: existing.contextName }
    })
  } catch (error) {
    console.error('Error deleting guidelines in bulk:', error)
    throw new Error('Failed to delete guidelines in bulk.')
  }
}
