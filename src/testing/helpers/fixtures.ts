import { eq } from 'drizzle-orm'

import {
  guidelinesContent,
  guidelinesContexts,
  repositories,
} from '@/db/schema'

import type { TestDatabase } from './testDb'

export interface TestRepository {
  id: number
  origin: string
}

export interface TestContext {
  id: number
  repositoryId: number
  name: string
  prompt: string
}

export interface TestGuideline {
  id: number
  contextId: number
  content: string
}

export interface TestDataSet {
  repositories: TestRepository[]
  contexts: TestContext[]
  guidelines: TestGuideline[]
}

export const TEST_REPOSITORY_DATA = {
  repo1: 'https://github.com/test/repo1.git',
  repo2: 'https://github.com/test/repo2.git',
  repo3: 'https://github.com/test/repo3.git',
} as const

export const TEST_CONTEXT_DATA = {
  coding: {
    name: 'coding-standards',
    prompt: 'Guidelines for coding standards and best practices',
  },
  testing: {
    name: 'testing-practices',
    prompt: 'Guidelines for testing practices and methodology',
  },
  documentation: {
    name: 'documentation',
    prompt: 'Guidelines for documentation and code comments',
  },
} as const

export async function createTestRepositories(
  db: TestDatabase,
  origins: string[] = [TEST_REPOSITORY_DATA.repo1, TEST_REPOSITORY_DATA.repo2],
): Promise<TestRepository[]> {
  const results: TestRepository[] = []

  for (const origin of origins) {
    const [repo] = await db
      .insert(repositories)
      .values({ origin })
      .returning({ id: repositories.id, origin: repositories.origin })

    results.push(repo)
  }

  return results
}

export async function createTestContexts(
  db: TestDatabase,
  repositoryId: number,
  contextNames: Array<keyof typeof TEST_CONTEXT_DATA> = ['coding', 'testing'],
): Promise<TestContext[]> {
  const results: TestContext[] = []

  for (const contextName of contextNames) {
    const contextData = TEST_CONTEXT_DATA[contextName]
    const [context] = await db
      .insert(guidelinesContexts)
      .values({
        repositoryId,
        name: contextData.name,
        prompt: contextData.prompt,
      })
      .returning({
        id: guidelinesContexts.id,
        repositoryId: guidelinesContexts.repositoryId,
        name: guidelinesContexts.name,
        prompt: guidelinesContexts.prompt,
      })

    results.push(context)
  }

  return results
}

export async function createTestGuidelines(
  db: TestDatabase,
  contextId: number,
  contents: string[] = [
    'Use TypeScript for all new code',
    '// Follow ESLint rules strictly',
    'Write unit tests for all functions',
  ],
): Promise<TestGuideline[]> {
  const results: TestGuideline[] = []

  for (const content of contents) {
    const [guideline] = await db
      .insert(guidelinesContent)
      .values({
        contextId,
        content,
      })
      .returning({
        id: guidelinesContent.id,
        contextId: guidelinesContent.contextId,
        content: guidelinesContent.content,
      })

    results.push(guideline)
  }

  return results
}

export async function seedTestData(db: TestDatabase): Promise<TestDataSet> {
  const testRepositories = await createTestRepositories(db)
  const testContexts = await createTestContexts(db, testRepositories[0].id)
  const testGuidelines = await createTestGuidelines(db, testContexts[0].id)

  return {
    repositories: testRepositories,
    contexts: testContexts,
    guidelines: testGuidelines,
  }
}

export async function getRepositoryByOrigin(
  db: TestDatabase,
  origin: string,
): Promise<TestRepository | null> {
  const result = await db
    .select({
      id: repositories.id,
      origin: repositories.origin,
    })
    .from(repositories)
    .where(eq(repositories.origin, origin))
    .limit(1)

  return result[0] || null
}

export async function getContextsByRepository(
  db: TestDatabase,
  repositoryId: number,
): Promise<TestContext[]> {
  return await db
    .select({
      id: guidelinesContexts.id,
      repositoryId: guidelinesContexts.repositoryId,
      name: guidelinesContexts.name,
      prompt: guidelinesContexts.prompt,
    })
    .from(guidelinesContexts)
    .where(eq(guidelinesContexts.repositoryId, repositoryId))
}

export async function getGuidelinesByContext(
  db: TestDatabase,
  contextId: number,
): Promise<TestGuideline[]> {
  return await db
    .select({
      id: guidelinesContent.id,
      contextId: guidelinesContent.contextId,
      content: guidelinesContent.content,
    })
    .from(guidelinesContent)
    .where(eq(guidelinesContent.contextId, contextId))
}
