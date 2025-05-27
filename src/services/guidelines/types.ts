export interface Guideline {
  id: number
  content: string
  active: boolean
  contextId: number
  contextName: string
}

export interface GuidelinesContext {
  id: number
  name: string
  prompt: string
  repositoryId: number
}
