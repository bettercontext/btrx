import type { ParsedGuideline } from './types'

export function parseGuidelinesText(content: string): ParsedGuideline[] {
  if (!content.trim()) {
    return []
  }

  const lines = content.split('\n')
  const guidelines: ParsedGuideline[] = []

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    if (trimmedLine === '') {
      return
    }

    const isInactive = trimmedLine.startsWith('// ')
    const guidelineContent = isInactive ? trimmedLine.substring(3) : trimmedLine

    if (guidelineContent.trim() !== '') {
      guidelines.push({
        line: index + 1,
        content: guidelineContent,
        active: !isInactive,
      })
    }
  })

  return guidelines
}

export function serializeGuidelinesText(guidelines: ParsedGuideline[]): string {
  if (guidelines.length === 0) {
    return ''
  }

  return guidelines
    .map((guideline) => {
      const prefix = guideline.active ? '' : '// '
      return `${prefix}${guideline.content}`
    })
    .join('\n')
}

export function addGuidelineToText(
  existingContent: string,
  newGuideline: string,
  active: boolean = true,
): string {
  const guidelines = parseGuidelinesText(existingContent)

  guidelines.push({
    line: guidelines.length + 1,
    content: newGuideline,
    active,
  })

  return serializeGuidelinesText(guidelines)
}

export function updateGuidelineInText(
  existingContent: string,
  targetContent: string,
  newContent: string,
): string {
  const guidelines = parseGuidelinesText(existingContent)

  const guidelineIndex = guidelines.findIndex(
    (g) => g.content === targetContent,
  )
  if (guidelineIndex === -1) {
    throw new Error('Guideline not found')
  }

  guidelines[guidelineIndex].content = newContent

  return serializeGuidelinesText(guidelines)
}

export function toggleGuidelineStateInText(
  existingContent: string,
  targetContent: string,
  newState: boolean,
): string {
  const guidelines = parseGuidelinesText(existingContent)

  const guidelineIndex = guidelines.findIndex(
    (g) => g.content === targetContent,
  )
  if (guidelineIndex === -1) {
    throw new Error('Guideline not found')
  }

  guidelines[guidelineIndex].active = newState

  return serializeGuidelinesText(guidelines)
}

export function removeGuidelineFromText(
  existingContent: string,
  targetContent: string,
): string {
  const guidelines = parseGuidelinesText(existingContent)

  const filteredGuidelines = guidelines.filter(
    (g) => g.content !== targetContent,
  )
  if (filteredGuidelines.length === guidelines.length) {
    throw new Error('Guideline not found')
  }

  return serializeGuidelinesText(filteredGuidelines)
}
