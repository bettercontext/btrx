import {
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

import { mcpServer } from './server'
import { handleGetGuidelinesAnalysisPromptForContext } from './toolHandlers/guidelines/guidelinesAnalysis'
import { handleSaveGuidelines } from './toolHandlers/guidelines/saveGuidelines'
import { handleStartGuidelinesAnalysisFlow } from './toolHandlers/guidelines/startGuidelinesAnalysisFlow'
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

      switch (toolName) {
        case 'start_guidelines_analysis_flow': {
          console.log(
            'start_guidelines_analysis_flow tool called with args:',
            request.params.arguments,
          )
          return handleStartGuidelinesAnalysisFlow(
            request.params.arguments,
            mcpContext,
          )
        }
        case 'get_guidelines_analysis_prompt_for_context': {
          console.log(
            'get_guidelines_analysis_prompt_for_context tool called with args:',
            request.params.arguments,
          )
          return handleGetGuidelinesAnalysisPromptForContext(
            request.params.arguments,
            mcpContext,
          )
        }
        case 'save_guidelines': {
          console.log(
            'save_guidelines tool called with args:',
            request.params.arguments,
          )
          return handleSaveGuidelines(request.params.arguments, mcpContext)
        }
        default:
          console.error(`[MCP Handlers] Unknown tool: ${toolName}`)
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${toolName}`,
          )
      }
    },
  )

  console.log('[MCP Handlers] Registered MCP request handlers.')
}
