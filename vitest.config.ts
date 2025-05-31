import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    root: '.',
    globals: true,
    environment: 'node',
    setupFiles: ['./src/testing/setup.ts'],
  },
})
