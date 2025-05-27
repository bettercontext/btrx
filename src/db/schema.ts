import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core'

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

export const guidelines = pgTable('guidelines', {
  id: serial('id').primaryKey(),
  contextId: integer('context_id')
    .references(() => guidelinesContexts.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  active: boolean('active').notNull().default(false),
})
