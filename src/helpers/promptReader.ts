import { promises as fs } from 'fs'
import { join } from 'path'

export type TemplateVariables = Record<
  string,
  string | number | boolean | any[]
>

function replaceTemplateVariables(
  content: string,
  variables: TemplateVariables = {},
): string {
  return content.replace(/\{\{(\w+)\}\}/gu, (match, name) => {
    if (name in variables) {
      const value = variables[name]
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
    return match // Keep original if variable not found
  })
}

export async function readPrompt(
  category: string,
  promptName: string,
  variables?: TemplateVariables,
): Promise<string> {
  try {
    const filePath = join(
      process.cwd(),
      'src',
      'prompts',
      category,
      `${promptName}.md`,
    )
    const content = await fs.readFile(filePath, 'utf-8')
    const trimmedContent = content.trim()
    return variables
      ? replaceTemplateVariables(trimmedContent, variables)
      : trimmedContent
  } catch (error) {
    console.error(
      `Failed to read prompt file for ${category}/${promptName}:`,
      error,
    )
    throw error
  }
}

export async function readContextPrompt(
  context: string,
  variables?: TemplateVariables,
): Promise<string> {
  try {
    const filePath = join(
      process.cwd(),
      'src',
      'prompts',
      'guidelines',
      'contexts',
      `${context}.md`,
    )
    const content = await fs.readFile(filePath, 'utf-8')
    const trimmedContent = content.trim()
    return variables
      ? replaceTemplateVariables(trimmedContent, variables)
      : trimmedContent
  } catch (error) {
    console.error(`Failed to read context prompt file for ${context}:`, error)
    throw error
  }
}
