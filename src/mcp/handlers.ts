import {
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

import { mcpServer } from './server'
import './toolHandlers/guidelines'
import { toolRegistry, validateToolsRegistry } from './toolRegistry'
import { toolsList } from './tools'

export function registerMcpHandlers() {
  mcpServer.setRequestHandler(
    z.object({
      method: z.literal('tools/list'),
      params: z.object({}).optional(),
    }),
    () => {
      const responsePayload = { tools: toolsList }
      console.log(
        '[MCP Handlers DEBUG] Sending tools/list response:',
        JSON.stringify(responsePayload, null, 2),
      )
      return Promise.resolve(responsePayload)
    },
  )

  mcpServer.setRequestHandler(
    CallToolRequestSchema,
    (request: z.infer<typeof CallToolRequestSchema>) => {
      const toolName = request.params.name
      console.log(`[MCP Handlers] Handling tool call: ${toolName}`)

      const CWD = process.env.BETTERCONTEXT_CWD
      const mcpContext = { CWD }
      console.log('[MCP Handlers] MCP Context with CWD:', mcpContext)

      const handler = toolRegistry.get(toolName)
      if (!handler) {
        console.error(`[MCP Handlers] Unknown tool: ${toolName}`)
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${toolName}`,
        )
      }

      console.log(
        `[MCP Handlers] Calling handler for tool: ${toolName}`,
        request.params.arguments,
      )
      return handler(request.params.arguments, mcpContext)
    },
  )

  console.log('[MCP Handlers] Registered MCP request handlers.')

  if (process.env.NODE_ENV !== 'production') {
    validateToolsRegistry(toolsList)
  }
}
