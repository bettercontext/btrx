import { describe, expect, it } from 'vitest'

import type { ParsedGuideline } from './types'
import {
  findGuidelineByVirtualId,
  generateVirtualId,
  parseGuidelinesToVirtual,
} from './virtualIds'

describe('virtualIds', () => {
  describe('generateVirtualId', () => {
    it('should generate a consistent ID for the same inputs', () => {
      const contextId = 1

      const id1 = generateVirtualId(contextId, 0)
      const id2 = generateVirtualId(contextId, 0)

      expect(id1).toBe(id2)
      expect(typeof id1).toBe('number')
      expect(id1).toBeGreaterThan(0)
    })

    it('should generate different IDs for different positions', () => {
      const contextId = 1

      const id1 = generateVirtualId(contextId, 0)
      const id2 = generateVirtualId(contextId, 1)

      expect(id1).not.toBe(id2)
    })

    it('should generate different IDs for different context IDs', () => {
      const id1 = generateVirtualId(1, 0)
      const id2 = generateVirtualId(2, 0)

      expect(id1).not.toBe(id2)
    })

    it('should generate different IDs for different positions even with same content', () => {
      const contextId = 1

      const id1 = generateVirtualId(contextId, 0)
      const id2 = generateVirtualId(contextId, 1)
      const id3 = generateVirtualId(contextId, 2)

      expect(id1).not.toBe(id2)
      expect(id1).not.toBe(id3)
      expect(id2).not.toBe(id3)
    })

    it('should handle empty position', () => {
      const id = generateVirtualId(1, 0)

      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThanOrEqual(0)
    })

    it('should handle large context IDs and positions', () => {
      const id = generateVirtualId(999999, 12345)

      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
    })
  })

  describe('parseGuidelinesToVirtual', () => {
    it('should add virtual IDs to all guidelines', () => {
      const contextId = 1
      const guidelines: ParsedGuideline[] = [
        { content: 'First guideline', active: true, line: 0 },
        { content: 'Second guideline', active: false, line: 1 },
        { content: 'Third guideline', active: true, line: 2 },
      ]

      const result = parseGuidelinesToVirtual(contextId, guidelines)

      expect(result).toHaveLength(3)
      expect(result[0]).toHaveProperty('id')
      expect(result[1]).toHaveProperty('id')
      expect(result[2]).toHaveProperty('id')

      // All IDs should be different
      expect(result[0].id).not.toBe(result[1].id)
      expect(result[1].id).not.toBe(result[2].id)
      expect(result[0].id).not.toBe(result[2].id)

      // Original properties should be preserved
      expect(result[0]).toMatchObject(guidelines[0])
      expect(result[1]).toMatchObject(guidelines[1])
      expect(result[2]).toMatchObject(guidelines[2])
    })

    it('should handle empty guidelines array', () => {
      const result = parseGuidelinesToVirtual(1, [])

      expect(result).toHaveLength(0)
      expect(Array.isArray(result)).toBe(true)
    })

    it('should generate consistent IDs for the same guidelines', () => {
      const contextId = 1
      const guidelines: ParsedGuideline[] = [
        { content: 'Test guideline', active: true, line: 0 },
      ]

      const result1 = parseGuidelinesToVirtual(contextId, guidelines)
      const result2 = parseGuidelinesToVirtual(contextId, guidelines)

      expect(result1[0].id).toBe(result2[0].id)
    })

    it('should handle guidelines with identical content but different positions', () => {
      const contextId = 1
      const guidelines: ParsedGuideline[] = [
        { content: 'Same content', active: true, line: 0 },
        { content: 'Same content', active: false, line: 1 },
      ]

      const result = parseGuidelinesToVirtual(contextId, guidelines)

      expect(result).toHaveLength(2)
      expect(result[0].id).not.toBe(result[1].id) // Same content, different positions = different IDs
    })

    it('should handle guidelines with same position for different contexts', () => {
      const guidelines: ParsedGuideline[] = [
        { content: 'Same content', active: true, line: 0 },
      ]

      const result1 = parseGuidelinesToVirtual(1, guidelines)
      const result2 = parseGuidelinesToVirtual(2, guidelines)

      expect(result1[0].id).not.toBe(result2[0].id) // Different contexts should have different IDs
    })
  })

  describe('findGuidelineByVirtualId', () => {
    const mockGuidelines: ParsedGuideline[] = [
      { content: 'First guideline', active: true, line: 0 },
      { content: 'Second guideline', active: false, line: 1 },
      { content: 'Third guideline', active: true, line: 2 },
    ]

    it('should find existing guideline by virtual ID', () => {
      const contextId = 1
      const expectedGuideline = mockGuidelines[1]
      const virtualId = generateVirtualId(contextId, 1)

      const result = findGuidelineByVirtualId(
        mockGuidelines,
        contextId,
        virtualId,
      )

      expect(result).toEqual(expectedGuideline)
    })

    it('should return null for non-existing virtual ID', () => {
      const contextId = 1
      const nonExistingId = 999999999

      const result = findGuidelineByVirtualId(
        mockGuidelines,
        contextId,
        nonExistingId,
      )

      expect(result).toBeNull()
    })

    it('should return null for empty guidelines array', () => {
      const result = findGuidelineByVirtualId([], 1, 123456)

      expect(result).toBeNull()
    })

    it('should find guideline with special characters', () => {
      const contextId = 1
      const specialGuideline: ParsedGuideline = {
        content: 'Special chars: éàç!@#$%^&*()',
        active: true,
        line: 0,
      }
      const guidelines = [specialGuideline]

      const virtualId = generateVirtualId(contextId, 0)

      const result = findGuidelineByVirtualId(guidelines, contextId, virtualId)

      expect(result).toEqual(specialGuideline)
    })

    it('should find guideline with unicode content', () => {
      const contextId = 1
      const unicodeGuideline: ParsedGuideline = {
        content: '测试内容 🚀 الاختبار 🎯',
        active: false,
        line: 5,
      }
      const guidelines = [unicodeGuideline]

      const virtualId = generateVirtualId(contextId, 0)

      const result = findGuidelineByVirtualId(guidelines, contextId, virtualId)

      expect(result).toEqual(unicodeGuideline)
    })

    it('should not find guideline when context ID differs', () => {
      const virtualId = generateVirtualId(1, 0)

      // Search with different context ID
      const result = findGuidelineByVirtualId(mockGuidelines, 2, virtualId)

      expect(result).toBeNull()
    })
  })

  describe('integration tests', () => {
    it('should work end-to-end: parse -> find -> verify', () => {
      const contextId = 5
      const originalGuidelines: ParsedGuideline[] = [
        { content: 'Integration test guideline 1', active: true, line: 0 },
        { content: 'Integration test guideline 2', active: false, line: 1 },
        { content: 'Integration test guideline 3', active: true, line: 2 },
      ]

      // Parse to add virtual IDs
      const withIds = parseGuidelinesToVirtual(contextId, originalGuidelines)

      // Find each guideline by its generated ID
      for (let i = 0; i < withIds.length; i++) {
        const found = findGuidelineByVirtualId(
          originalGuidelines,
          contextId,
          withIds[i].id,
        )

        expect(found).toEqual(originalGuidelines[i])
      }
    })

    it('should maintain ID stability across multiple operations', () => {
      const contextId = 1
      const guideline: ParsedGuideline = {
        content: 'Stable ID test',
        active: true,
        line: 0,
      }

      // Generate ID multiple times
      const id1 = generateVirtualId(contextId, 0)
      const id2 = generateVirtualId(contextId, 0)

      // Parse the same guideline multiple times
      const parsed1 = parseGuidelinesToVirtual(contextId, [guideline])
      const parsed2 = parseGuidelinesToVirtual(contextId, [guideline])

      // All IDs should be identical
      expect(id1).toBe(id2)
      expect(parsed1[0].id).toBe(id1)
      expect(parsed2[0].id).toBe(id1)

      // Finding should work consistently
      const found1 = findGuidelineByVirtualId([guideline], contextId, id1)
      const found2 = findGuidelineByVirtualId([guideline], contextId, id2)

      expect(found1).toEqual(guideline)
      expect(found2).toEqual(guideline)
    })

    it('should handle complex scenarios with mixed content', () => {
      const contextId = 42
      const complexGuidelines: ParsedGuideline[] = [
        { content: '', active: true, line: 0 }, // Empty content
        { content: 'Normal guideline', active: true, line: 2 },
        {
          content: 'Very long guideline '.repeat(100),
          active: false,
          line: 3,
        }, // Very long content
        { content: '🚀🎯🔥💎', active: false, line: 5 }, // Emojis only
      ]

      const withIds = parseGuidelinesToVirtual(contextId, complexGuidelines)

      // All should have unique IDs since content is different
      const ids = withIds.map((g) => g.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)

      // All should be findable
      for (const guideline of withIds) {
        const found = findGuidelineByVirtualId(
          complexGuidelines,
          contextId,
          guideline.id,
        )
        expect(found).toBeTruthy()
        expect(found?.content).toBe(guideline.content)
      }
    })
  })
})
