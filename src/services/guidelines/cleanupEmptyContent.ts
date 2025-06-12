import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { guidelinesContent } from '@/db/schema'

import { parseGuidelinesText } from './textParser'

export async function cleanupEmptyContent(contextId: number): Promise<void> {
  try {
    const contentEntries = await db
      .select({ id: guidelinesContent.id, content: guidelinesContent.content })
      .from(guidelinesContent)
      .where(eq(guidelinesContent.contextId, contextId))

    for (const entry of contentEntries) {
      const content = entry.content || ''
      const guidelines = parseGuidelinesText(content)

      if (guidelines.length === 0) {
        await db
          .delete(guidelinesContent)
          .where(eq(guidelinesContent.id, entry.id))
      }
    }
  } catch (error) {
    console.error('Error cleaning up empty content:', error)
  }
}
