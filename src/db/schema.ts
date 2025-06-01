import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core'

export const repositories = pgTable('repositories', {
  id: serial('id').primaryKey(),
  origin: text('origin').notNull().unique(),
})

export const guidelinesContexts = pgTable('guidelines_contexts', {
  id: serial('id').primaryKey(),
  repositoryId: integer('repository_id')
    .references(() => repositories.id)
    .notNull(),
  name: text('name').notNull(),
  prompt: text('prompt').notNull(),
})

export const guidelinesContent = pgTable('guidelines_content', {
  id: serial('id').primaryKey(),
  contextId: integer('context_id')
    .references(() => guidelinesContexts.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull().default(''),
  createdAt: integer('created_at').notNull().default(0),
  updatedAt: integer('updated_at').notNull().default(0),
})
