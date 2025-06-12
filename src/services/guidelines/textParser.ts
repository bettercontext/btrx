import type { ParsedGuideline } from './types'

export function normalizeGuidelineContent(content: string): string {
  return content
    .trim()
    .replace(/^\[DISABLED\]\s*/u, '')
    .trim()
}

export function parseGuidelinesText(content: string): ParsedGuideline[] {
  if (!content.trim()) {
    return []
  }

  const sections = content.split('\n-_-_-\n')
  const guidelines: ParsedGuideline[] = []

  sections.forEach((section, index) => {
    const trimmedSection = section.trim()

    if (trimmedSection === '') {
      return
    }

    const isInactive = trimmedSection.startsWith('[DISABLED] ')
    const guidelineContent = isInactive
      ? trimmedSection.substring(11) // Remove '[DISABLED] '
      : trimmedSection

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
      const prefix = guideline.active ? '' : '[DISABLED] '
      return `${prefix}${guideline.content}`
    })
    .join('\n-_-_-\n')
}

export function addGuidelineToText(
  existingContent: string,
  newGuideline: string,
  active: boolean = true,
): string {
  const guidelines = parseGuidelinesText(existingContent)
  const normalizedContent = normalizeGuidelineContent(newGuideline)

  guidelines.push({
    line: guidelines.length + 1,
    content: normalizedContent,
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
  const normalizedTarget = normalizeGuidelineContent(targetContent)

  const guidelineIndex = guidelines.findIndex(
    (g) => normalizeGuidelineContent(g.content) === normalizedTarget,
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
  const normalizedTarget = normalizeGuidelineContent(targetContent)

  const guidelineIndex = guidelines.findIndex(
    (g) => normalizeGuidelineContent(g.content) === normalizedTarget,
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
  const normalizedTarget = normalizeGuidelineContent(targetContent)

  const filteredGuidelines = guidelines.filter(
    (g) => normalizeGuidelineContent(g.content) !== normalizedTarget,
  )
  if (filteredGuidelines.length === guidelines.length) {
    throw new Error('Guideline not found')
  }

  return serializeGuidelinesText(filteredGuidelines)
}
