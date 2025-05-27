import * as os from 'node:os'
import * as path from 'node:path'

import Conf from 'conf'
import { defineConfig } from 'drizzle-kit'

const configSchema = {
  dataDirectory: {
    type: 'string',
    default: path.join(os.homedir(), '.bettercontext'),
  },
} as const

const config = new Conf({ schema: configSchema, projectName: 'bettercontext' })

const dataDir = config.get('dataDirectory') as string

export default defineConfig({
  dialect: 'postgresql',
  driver: 'pglite',
  schema: './src/db/schema.ts',
  out: 'src/db/migrations',
  dbCredentials: {
    url: dataDir,
  },
})
