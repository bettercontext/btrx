import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { PGlite } from '@electric-sql/pglite'
import Conf from 'conf'
import { drizzle } from 'drizzle-orm/pglite'

import * as schema from './schema'

export * from './schema'

function createProductionDb() {
  const configSchema = {
    dataDirectory: {
      type: 'string',
      default: path.join(os.homedir(), '.bettercontext'),
    },
  } as const

  const config = new Conf({
    schema: configSchema,
    projectName: 'bettercontext',
  })
  const dataDir = config.get('dataDirectory') as string

  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log(`[DB Init] Created data directory: ${dataDir}`)
    } catch (error) {
      console.error(
        `[DB Init] Error creating data directory ${dataDir}:`,
        error,
      )
    }
  } else {
    console.log(`[DB Init] Using existing data directory: ${dataDir}`)
  }

  console.log(`[DB Init] Initializing PGlite with data directory: ${dataDir}`)
  const client = new PGlite(dataDir)
  return drizzle(client, { schema })
}

async function createTestDb() {
  const { createTestDb: createTestDatabase } = await import(
    '../testing/helpers/testDb'
  )
  console.log('[DB Init] Using in-memory test database')
  return createTestDatabase()
}

export const db =
  process.env.NODE_ENV === 'test' ? await createTestDb() : createProductionDb()
