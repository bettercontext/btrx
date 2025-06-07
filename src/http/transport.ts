import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { Request, Response } from 'express'

import { mcpServer } from '@/mcp/server'

async function createStatelessTransport(): Promise<StreamableHTTPServerTransport> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  await mcpServer.connect(transport)
  return transport
}

export async function handleHttpStreamRequest(req: Request, res: Response) {
  try {
    if (req.method === 'POST') {
      const transport = await createStatelessTransport()
      await transport.handleRequest(req, res, req.body)
    } else if (['GET', 'DELETE'].includes(req.method)) {
      const transport = await createStatelessTransport()
      await transport.handleRequest(req, res)
    } else {
      res.status(405).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed' },
        id: null,
      })
    }
  } catch (error) {
    console.error('[HTTP Streaming] Error:', error)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      })
    }
  }
}
