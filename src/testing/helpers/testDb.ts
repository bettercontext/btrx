import { PGlite } from '@electric-sql/pglite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'

import * as schema from '@/db/schema'

export type TestDatabase = ReturnType<typeof drizzle<typeof schema>>

let testDbCounter = 0

export async function setupTestDb(db: TestDatabase): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "guidelines_content" (
      "id" serial PRIMARY KEY NOT NULL,
      "context_id" integer NOT NULL,
      "content" text DEFAULT '' NOT NULL,
      "created_at" integer DEFAULT 0 NOT NULL,
      "updated_at" integer DEFAULT 0 NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE "guidelines_contexts" (
      "id" serial PRIMARY KEY NOT NULL,
      "repository_id" integer NOT NULL,
      "name" text NOT NULL,
      "prompt" text NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE "repositories" (
      "id" serial PRIMARY KEY NOT NULL,
      "origin" text NOT NULL,
      CONSTRAINT "repositories_origin_unique" UNIQUE("origin")
    )
  `)

  await db.execute(sql`
    ALTER TABLE "guidelines_content" 
    ADD CONSTRAINT "guidelines_content_context_id_guidelines_contexts_id_fk" 
    FOREIGN KEY ("context_id") REFERENCES "guidelines_contexts"("id") ON DELETE cascade ON UPDATE no action
  `)

  await db.execute(sql`
    ALTER TABLE "guidelines_contexts" 
    ADD CONSTRAINT "guidelines_contexts_repository_id_repositories_id_fk" 
    FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE no action ON UPDATE no action
  `)
}

export async function createTestDb(): Promise<TestDatabase> {
  testDbCounter++
  console.log(`Creating test database #${testDbCounter}`)

  const client = new PGlite()
  const db = drizzle(client, { schema })

  await setupTestDb(db)

  return db
}

export async function cleanTestDb(db: TestDatabase): Promise<void> {
  await db.execute(sql`DELETE FROM guidelines_content`)
  await db.execute(sql`DELETE FROM guidelines_contexts`)
  await db.execute(sql`DELETE FROM repositories`)

  await db.execute(sql`ALTER SEQUENCE guidelines_content_id_seq RESTART WITH 1`)
  await db.execute(
    sql`ALTER SEQUENCE guidelines_contexts_id_seq RESTART WITH 1`,
  )
  await db.execute(sql`ALTER SEQUENCE repositories_id_seq RESTART WITH 1`)
}

export async function destroyTestDb(db: TestDatabase): Promise<void> {
  try {
    await db.execute(sql`DROP TABLE IF EXISTS guidelines_content CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS guidelines_contexts CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS repositories CASCADE`)
  } catch (error) {
    console.warn('Error destroying test database:', error)
  }
}
