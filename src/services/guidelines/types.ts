export interface Guideline {
  id: number
  content: string
  active: boolean
  contextId: number
  contextName: string
}

export interface ParsedGuideline {
  line: number
  content: string
  active: boolean
}

export interface GuidelinesContent {
  id: number
  contextId: number
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface GuidelinesContext {
  id: number
  name: string
  prompt: string
  repositoryId: number
  content?: GuidelinesContent
}

export interface PendingContext {
  id: number
  name: string
  repositoryId: number
}

export interface DiffData {
  contextName: string
  diff: Array<{
    value: string
    added?: boolean
    removed?: boolean
  }>
}
