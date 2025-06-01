import { describe, expect, it } from 'vitest'

import {
  addGuidelineToText,
  parseGuidelinesText,
  removeGuidelineFromText,
  serializeGuidelinesText,
  toggleGuidelineStateInText,
  updateGuidelineInText,
} from './textParser'

describe('textParser', () => {
  describe('parseGuidelinesText', () => {
    it('should parse empty content', () => {
      expect(parseGuidelinesText('')).toEqual([])
      expect(parseGuidelinesText('   ')).toEqual([])
    })

    it('should parse active guidelines', () => {
      const content = 'Active guideline 1\nActive guideline 2'
      const result = parseGuidelinesText(content)

      expect(result).toEqual([
        { line: 1, content: 'Active guideline 1', active: true },
        { line: 2, content: 'Active guideline 2', active: true },
      ])
    })

    it('should parse inactive guidelines', () => {
      const content = '// Inactive guideline 1\n// Inactive guideline 2'
      const result = parseGuidelinesText(content)

      expect(result).toEqual([
        { line: 1, content: 'Inactive guideline 1', active: false },
        { line: 2, content: 'Inactive guideline 2', active: false },
      ])
    })

    it('should parse mixed active and inactive guidelines', () => {
      const content = 'Active guideline\n// Inactive guideline\nAnother active'
      const result = parseGuidelinesText(content)

      expect(result).toEqual([
        { line: 1, content: 'Active guideline', active: true },
        { line: 2, content: 'Inactive guideline', active: false },
        { line: 3, content: 'Another active', active: true },
      ])
    })

    it('should skip empty lines', () => {
      const content = 'Guideline 1\n\n\nGuideline 2\n\n'
      const result = parseGuidelinesText(content)

      expect(result).toEqual([
        { line: 1, content: 'Guideline 1', active: true },
        { line: 4, content: 'Guideline 2', active: true },
      ])
    })
  })

  describe('serializeGuidelinesText', () => {
    it('should serialize empty guidelines', () => {
      expect(serializeGuidelinesText([])).toBe('')
    })

    it('should serialize active guidelines', () => {
      const guidelines = [
        { line: 1, content: 'Active 1', active: true },
        { line: 2, content: 'Active 2', active: true },
      ]
      const result = serializeGuidelinesText(guidelines)

      expect(result).toBe('Active 1\nActive 2')
    })

    it('should serialize inactive guidelines', () => {
      const guidelines = [
        { line: 1, content: 'Inactive 1', active: false },
        { line: 2, content: 'Inactive 2', active: false },
      ]
      const result = serializeGuidelinesText(guidelines)

      expect(result).toBe('// Inactive 1\n// Inactive 2')
    })

    it('should serialize mixed guidelines', () => {
      const guidelines = [
        { line: 1, content: 'Active', active: true },
        { line: 2, content: 'Inactive', active: false },
        { line: 3, content: 'Another active', active: true },
      ]
      const result = serializeGuidelinesText(guidelines)

      expect(result).toBe('Active\n// Inactive\nAnother active')
    })
  })

  describe('roundtrip parsing', () => {
    it('should maintain content through parse/serialize cycle', () => {
      const original = 'Active guideline\n// Inactive guideline\nAnother active'
      const parsed = parseGuidelinesText(original)
      const serialized = serializeGuidelinesText(parsed)

      expect(serialized).toBe(original)
    })
  })

  describe('addGuidelineToText', () => {
    it('should add to empty content', () => {
      const result = addGuidelineToText('', 'New guideline')
      expect(result).toBe('New guideline')
    })

    it('should add active guideline to existing content', () => {
      const result = addGuidelineToText('Existing', 'New guideline')
      expect(result).toBe('Existing\nNew guideline')
    })

    it('should add inactive guideline to existing content', () => {
      const result = addGuidelineToText('Existing', 'New guideline', false)
      expect(result).toBe('Existing\n// New guideline')
    })
  })

  describe('updateGuidelineInText', () => {
    it('should update existing guideline', () => {
      const content = 'Guideline 1\nGuideline 2'
      const result = updateGuidelineInText(
        content,
        'Guideline 1',
        'Updated guideline',
      )
      expect(result).toBe('Updated guideline\nGuideline 2')
    })

    it('should throw error if guideline not found', () => {
      const content = 'Guideline 1\nGuideline 2'
      expect(() =>
        updateGuidelineInText(content, 'Non-existent', 'Updated'),
      ).toThrow('Guideline not found')
    })
  })

  describe('toggleGuidelineStateInText', () => {
    it('should activate inactive guideline', () => {
      const content = '// Inactive guideline\nActive guideline'
      const result = toggleGuidelineStateInText(
        content,
        'Inactive guideline',
        true,
      )
      expect(result).toBe('Inactive guideline\nActive guideline')
    })

    it('should deactivate active guideline', () => {
      const content = 'Active guideline\n// Inactive guideline'
      const result = toggleGuidelineStateInText(
        content,
        'Active guideline',
        false,
      )
      expect(result).toBe('// Active guideline\n// Inactive guideline')
    })

    it('should throw error if guideline not found', () => {
      const content = 'Guideline 1'
      expect(() =>
        toggleGuidelineStateInText(content, 'Non-existent', true),
      ).toThrow('Guideline not found')
    })
  })

  describe('removeGuidelineFromText', () => {
    it('should remove existing guideline', () => {
      const content = 'Guideline 1\nGuideline 2\nGuideline 3'
      const result = removeGuidelineFromText(content, 'Guideline 2')
      expect(result).toBe('Guideline 1\nGuideline 3')
    })

    it('should remove inactive guideline', () => {
      const content = 'Active\n// Inactive\nAnother active'
      const result = removeGuidelineFromText(content, 'Inactive')
      expect(result).toBe('Active\nAnother active')
    })

    it('should throw error if guideline not found', () => {
      const content = 'Guideline 1'
      expect(() => removeGuidelineFromText(content, 'Non-existent')).toThrow(
        'Guideline not found',
      )
    })
  })
})
