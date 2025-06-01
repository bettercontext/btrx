export type ToolHandler = (
  args: unknown,
  mcpContext?: { CWD?: string },
) => Promise<any>

class ToolRegistry {
  private handlers = new Map<string, ToolHandler>()

  register(toolName: string, handler: ToolHandler): void {
    if (this.handlers.has(toolName)) {
      console.warn(
        `[ToolRegistry] Tool handler for "${toolName}" is being overridden`,
      )
    }
    this.handlers.set(toolName, handler)
    console.log(`[ToolRegistry] Registered handler for tool: ${toolName}`)
  }

  get(toolName: string): ToolHandler | undefined {
    return this.handlers.get(toolName)
  }

  getRegisteredTools(): string[] {
    return Array.from(this.handlers.keys())
  }

  unregister(toolName: string): boolean {
    const result = this.handlers.delete(toolName)
    if (result) {
      console.log(`[ToolRegistry] Unregistered handler for tool: ${toolName}`)
    }
    return result
  }

  clear(): void {
    this.handlers.clear()
    console.log('[ToolRegistry] Cleared all registered handlers')
  }
}

export const toolRegistry = new ToolRegistry()

export function validateToolsRegistry(definedTools: { name: string }[]): void {
  const registeredTools = toolRegistry.getRegisteredTools()
  const definedToolNames = definedTools.map((tool) => tool.name)

  const missingHandlers = definedToolNames.filter(
    (tool) => !registeredTools.includes(tool),
  )
  const orphanHandlers = registeredTools.filter(
    (tool) => !definedToolNames.includes(tool),
  )

  if (missingHandlers.length > 0) {
    console.warn('[ToolRegistry] Tools without handlers:', missingHandlers)
  }
  if (orphanHandlers.length > 0) {
    console.warn(
      '[ToolRegistry] Handlers without tool definitions:',
      orphanHandlers,
    )
  }

  if (missingHandlers.length === 0 && orphanHandlers.length === 0) {
    console.log('[ToolRegistry] All tools have matching handlers ✓')
  }
}
