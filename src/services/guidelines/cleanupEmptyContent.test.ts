import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { db } from '@/db'
import {
  guidelinesContent,
  guidelinesContexts,
  repositories,
} from '@/db/schema'
import { cleanTestDb } from '@/testing/helpers/testDb'

import { cleanupEmptyContent } from './cleanupEmptyContent'

describe('Context Utils', () => {
  beforeEach(async () => {
    await cleanTestDb(db)
  })

  afterEach(async () => {
    await cleanTestDb(db)
  })

  it('should delete content entry when content is empty', async () => {
    const [repository] = await db
      .insert(repositories)
      .values({
        origin: 'https://github.com/test/repo.git',
      })
      .returning()

    const [context] = await db
      .insert(guidelinesContexts)
      .values({
        repositoryId: repository.id,
        name: 'Test Context',
        prompt: 'Test prompt',
      })
      .returning()

    const [contentEntry] = await db
      .insert(guidelinesContent)
      .values({
        contextId: context.id,
        content: '',
      })
      .returning()

    const contentBefore = await db
      .select()
      .from(guidelinesContent)
      .where(eq(guidelinesContent.id, contentEntry.id))

    expect(contentBefore).toHaveLength(1)

    await cleanupEmptyContent(context.id)

    const contentAfter = await db
      .select()
      .from(guidelinesContent)
      .where(eq(guidelinesContent.id, contentEntry.id))

    expect(contentAfter).toHaveLength(0)

    // Context should still exist
    const contextsAfter = await db
      .select()
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.id, context.id))

    expect(contextsAfter).toHaveLength(1)
  })

  it('should not delete content when it has guidelines', async () => {
    const [repository] = await db
      .insert(repositories)
      .values({
        origin: 'https://github.com/test/repo2.git',
      })
      .returning()

    const [context] = await db
      .insert(guidelinesContexts)
      .values({
        repositoryId: repository.id,
        name: 'Test Context',
        prompt: 'Test prompt',
      })
      .returning()

    const [contentEntry] = await db
      .insert(guidelinesContent)
      .values({
        contextId: context.id,
        content: 'Some guideline content',
      })
      .returning()

    await cleanupEmptyContent(context.id)

    const contentAfter = await db
      .select()
      .from(guidelinesContent)
      .where(eq(guidelinesContent.id, contentEntry.id))

    expect(contentAfter).toHaveLength(1)

    const contextsAfter = await db
      .select()
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.id, context.id))

    expect(contextsAfter).toHaveLength(1)
  })

  it('should handle context with no content record', async () => {
    const [repository] = await db
      .insert(repositories)
      .values({
        origin: 'https://github.com/test/repo3.git',
      })
      .returning()

    const [context] = await db
      .insert(guidelinesContexts)
      .values({
        repositoryId: repository.id,
        name: 'Test Context',
        prompt: 'Test prompt',
      })
      .returning()

    await cleanupEmptyContent(context.id)

    const contextsAfter = await db
      .select()
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.id, context.id))

    expect(contextsAfter).toHaveLength(1)
  })
})
