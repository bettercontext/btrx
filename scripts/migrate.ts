import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { migrate } from 'drizzle-orm/pglite/migrator'

import { db } from '@/db'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const migrationsFolder = path.resolve(
  __dirname,
  '..',
  'src',
  'db',
  'migrations',
)

async function runManualMigrations() {
  try {
    console.log(
      `[DB Migration Script] Applying migrations from: ${migrationsFolder}`,
    )
    await migrate(db, { migrationsFolder })
    console.log('[DB Migration Script] Migrations applied successfully.')
    process.exit(0)
  } catch (error) {
    console.error('[DB Migration Script] Error applying migrations:', error)
    process.exit(1)
  }
}

runManualMigrations()
