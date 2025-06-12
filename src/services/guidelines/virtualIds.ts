import type { ParsedGuideline } from './types'

function hashString(str: string): number {
  let hash = 0
  if (str.length === 0) return hash

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return Math.abs(hash)
}

export function generateVirtualId(contextId: number, position: number): number {
  const combined = `${contextId}-${position}`
  return hashString(combined)
}

export function parseGuidelinesToVirtual(
  contextId: number,
  guidelines: ParsedGuideline[],
): Array<ParsedGuideline & { id: number }> {
  return guidelines.map((guideline, idx) => ({
    ...guideline,
    id: generateVirtualId(contextId, idx),
  }))
}

export function findGuidelineByVirtualId(
  guidelines: ParsedGuideline[],
  contextId: number,
  virtualId: number,
): ParsedGuideline | null {
  return (
    guidelines.find(
      (_, idx) => generateVirtualId(contextId, idx) === virtualId,
    ) || null
  )
}
