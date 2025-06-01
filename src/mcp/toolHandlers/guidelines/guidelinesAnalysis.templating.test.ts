import { describe, expect, it } from 'vitest'

import { readPrompt } from '@/helpers/promptReader'

describe('Guidelines Analysis Templating', () => {
  it('should correctly render beginGuidelinesAnalysis template with contexts', async () => {
    const contexts = [
      { id: 1, name: 'Frontend' },
      { id: 2, name: 'Backend' },
      { id: 3, name: 'Database' },
    ]

    const result = await readPrompt('guidelines', 'beginGuidelinesAnalysis', {
      contexts,
    })

    expect(result).toContain('- **Frontend** (ID: 1)')
    expect(result).toContain('- **Backend** (ID: 2)')
    expect(result).toContain('- **Database** (ID: 3)')
    expect(result).toContain('You are about to begin an analysis')
    expect(result).toContain('IMPORTANT: You must ask the user which contexts')

    // Should not contain template syntax
    expect(result).not.toContain('{{#each contexts}}')
    expect(result).not.toContain('{{/contexts}}')
    expect(result).not.toContain('{{name}}')
    expect(result).not.toContain('{{id}}')
  })

  it('should handle empty contexts array', async () => {
    const contexts: any[] = []

    const result = await readPrompt('guidelines', 'beginGuidelinesAnalysis', {
      contexts,
    })

    // Should still contain the main text but no context list items
    expect(result).toContain('You are about to begin an analysis')
    expect(result).not.toContain('- **')
    expect(result).not.toContain('(ID:')

    // Should not contain template syntax
    expect(result).not.toContain('{{#each contexts}}')
    expect(result).not.toContain('{{/contexts}}')
  })
})
