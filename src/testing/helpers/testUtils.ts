import { afterEach, beforeEach } from 'vitest'

import {
  cleanTestDb,
  createTestDb,
  destroyTestDb,
  type TestDatabase,
} from './testDb'

export function withTestDb<T>(
  testFn: (db: TestDatabase) => Promise<T>,
): () => Promise<T> {
  return async () => {
    const db = await createTestDb()
    try {
      return await testFn(db)
    } finally {
      await destroyTestDb(db)
    }
  }
}

export function setupTestDbHooks(): {
  getDb: () => TestDatabase | null
} {
  let testDb: TestDatabase | null = null

  beforeEach(async () => {
    testDb = await createTestDb()
  })

  afterEach(async () => {
    if (testDb) {
      await destroyTestDb(testDb)
      testDb = null
    }
  })

  return {
    getDb: () => testDb,
  }
}

export function setupTestDbHooksWithCleanup(): {
  getDb: () => TestDatabase | null
} {
  let testDb: TestDatabase | null = null

  beforeEach(async () => {
    if (!testDb) {
      testDb = await createTestDb()
    } else {
      await cleanTestDb(testDb)
    }
  })

  return {
    getDb: () => testDb,
  }
}

export function createMockTimestamp(offset = 0): number {
  return Math.floor(Date.now() / 1000) + offset
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
