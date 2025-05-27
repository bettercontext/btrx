import { Server } from '@modelcontextprotocol/sdk/server/index.js'

export const mcpServer = new Server(
  { name: 'task-executor', version: '1.0.0' },
  {
    capabilities: {
      tools: {
        listChanged: true,
      },
    },
  },
)
