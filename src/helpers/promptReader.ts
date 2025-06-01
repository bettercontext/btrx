import { promises as fs } from 'fs'
import { join } from 'path'

import { renderTemplate, type TemplateVariables } from './templateEngine'

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
      ? renderTemplate(trimmedContent, variables)
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
      ? renderTemplate(trimmedContent, variables)
      : trimmedContent
  } catch (error) {
    console.error(`Failed to read context prompt file for ${context}:`, error)
    throw error
  }
}
