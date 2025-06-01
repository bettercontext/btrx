export type TemplateVariables = Record<
  string,
  string | number | boolean | any[]
>

export function renderTemplate(
  content: string,
  variables: TemplateVariables = {},
): string {
  // Handle {{#each array}} blocks
  let result = content.replace(
    /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/(\w+)\}\}/gu,
    (
      match: string,
      arrayName: string,
      template: string,
      closingName: string,
    ) => {
      if (arrayName !== closingName) {
        return match // Keep original if opening/closing names don't match
      }

      if (arrayName in variables && Array.isArray(variables[arrayName])) {
        const array = variables[arrayName] as any[]
        // Trim the template to remove leading/trailing whitespace
        const trimmedTemplate = template
          .replace(/^\s*\n?/u, '')
          .replace(/\n?\s*$/u, '')
        return array
          .map((item) => {
            // Replace variables within the template for each array item
            return trimmedTemplate.replace(
              /\{\{(\w+)\}\}/gu,
              (varMatch: string, varName: string) => {
                if (varName in item) {
                  const value = item[varName]
                  return typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)
                }
                return varMatch // Keep original if variable not found
              },
            )
          })
          .join('\n')
      }
      return match // Keep original if variable not found or not an array
    },
  )

  // Handle simple {{variable}} replacements
  result = result.replace(/\{\{(\w+)\}\}/gu, (match: string, name: string) => {
    if (name in variables) {
      const value = variables[name]
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
    return match // Keep original if variable not found
  })

  return result
}
