import { describe, expect, it } from 'vitest'

import { readContextPrompt, readPrompt } from './promptReader'
import type { TemplateVariables } from './templateEngine'

describe('promptReader', () => {
  describe('readPrompt', () => {
    it('should successfully read and process a prompt file', async () => {
      const result = await readPrompt('test', 'test-prompt')

      expect(result).toBe(
        'This is a test prompt\nwith multiple lines\n{{variable1}} and {{variable2}}',
      )
    })

    it('should handle template variables', async () => {
      const variables: TemplateVariables = {
        variable1: 'hello',
        variable2: 'world',
      }

      const result = await readPrompt('test', 'test-prompt', variables)

      expect(result).toBe(
        'This is a test prompt\nwith multiple lines\nhello and world',
      )
    })

    it('should keep original template when variable is not provided', async () => {
      const variables: TemplateVariables = {
        variable1: 'hello',
      }

      const result = await readPrompt('test', 'test-prompt', variables)

      expect(result).toBe(
        'This is a test prompt\nwith multiple lines\nhello and {{variable2}}',
      )
    })

    it('should throw an error for non-existent files', async () => {
      await expect(readPrompt('test', 'nonexistent')).rejects.toThrow()
    })
  })

  describe('readContextPrompt', () => {
    it('should read and process front context file', async () => {
      const result = await readContextPrompt('front')
      expect(result).toBeTruthy() // Just verify it can read the file
    })

    it('should handle template variables in context content', async () => {
      const result = await readContextPrompt('front', {
        name: 'test',
        value: 'example',
      })
      expect(typeof result).toBe('string')
    })

    it('should throw an error for invalid context files', async () => {
      await expect(readContextPrompt('invalid_context')).rejects.toThrow()
    })
  })
})
