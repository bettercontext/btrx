#!/usr/bin/env node
import { spawn } from 'child_process'
import path from 'path'
// eslint-disable-next-line import/extensions
import 'tsconfig-paths/register.js'
import { fileURLToPath } from 'url'

const userCwd = process.cwd()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')

console.log(`Launching bettercontext server from: ${projectRoot}`)
console.log(`User's current working directory: ${userCwd}`)

const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    BETTERCONTEXT_CWD: userCwd,
    TS_NODE_TRANSPILE_ONLY: 'true',
  },
})

serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err)
  process.exit(1)
})

serverProcess.on('exit', (code, signal) => {
  if (code !== null) {
    console.log(`Server process exited with code ${code}`)
  } else if (signal !== null) {
    console.log(`Server process exited due to signal ${signal}`)
  } else {
    console.log('Server process exited.')
  }
  process.exit(code ?? 1)
})
