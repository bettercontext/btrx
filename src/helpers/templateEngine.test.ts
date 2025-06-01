import { describe, expect, it } from 'vitest'

import { renderTemplate } from './templateEngine'

describe('templateEngine', () => {
  describe('renderTemplate', () => {
    it('should handle simple variable replacement', () => {
      const template = 'Hello {{name}}, welcome to {{place}}!'
      const variables = { name: 'John', place: 'Paris' }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Hello John, welcome to Paris!')
    })

    it('should handle array iteration with {{#each}}', () => {
      const template = 'Users:\n{{#each users}}- {{name}} ({{id}})\n{{/users}}'
      const variables = {
        users: [
          { name: 'John', id: 1 },
          { name: 'Jane', id: 2 },
        ],
      }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Users:\n- John (1)\n- Jane (2)')
    })

    it('should handle contexts array like in beginGuidelinesAnalysis', () => {
      const template = `Available contexts:

{{#each contexts}}
- **{{name}}** (ID: {{id}})
{{/contexts}}`

      const variables = {
        contexts: [
          { name: 'Frontend', id: 1 },
          { name: 'Backend', id: 2 },
        ],
      }

      const result = renderTemplate(template, variables)

      expect(result).toBe(`Available contexts:

- **Frontend** (ID: 1)
- **Backend** (ID: 2)`)
    })

    it('should keep template unchanged if variable not found', () => {
      const template = 'Hello {{name}}, {{missing}} variable'
      const variables = { name: 'John' }

      const result = renderTemplate(template, variables)

      expect(result).toBe('Hello John, {{missing}} variable')
    })

    it('should handle empty arrays', () => {
      const template = '{{#each items}}Item: {{name}}\n{{/items}}'
      const variables = { items: [] }

      const result = renderTemplate(template, variables)

      expect(result).toBe('')
    })

    it('should handle non-array variables in each blocks', () => {
      const template = '{{#each notArray}}Item\n{{/notArray}}'
      const variables = { notArray: 'string' }

      const result = renderTemplate(template, variables)

      expect(result).toBe('{{#each notArray}}Item\n{{/notArray}}')
    })
  })
})
