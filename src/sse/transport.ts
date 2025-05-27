import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { EventEmitter } from 'events'
import type { Request, Response } from 'express'

import { MCP_BASE_URL } from '@/config'
import { mcpServer } from '@/mcp/server'

export const sessions: Record<
  string,
  {
    transport: SSEServerTransport
    response: Response
  }
> = {}

const SSE_STATUS_EVENT = 'sseStatusChange'
const sseEvents = new EventEmitter()

export function getMcpClientCount(): number {
  return Object.keys(sessions).length
}

export function subscribeToMcpClientStatus(
  callback: (_count: number) => void,
): () => void {
  const handler = () => callback(getMcpClientCount())
  sseEvents.on(SSE_STATUS_EVENT, handler)
  return () => sseEvents.off(SSE_STATUS_EVENT, handler)
}

function cleanupSession(sessionId: string, fromTransport = false): void {
  const session = sessions[sessionId]
  if (!session) return

  try {
    if (!fromTransport && session.transport.close) {
      session.transport.close()
    }

    if (!session.response.writableEnded) {
      session.response.end()
    }
  } catch (error) {
    console.error(
      `[SSE Transport] Error during cleanup of session ${sessionId}:`,
      error,
    )
  } finally {
    Reflect.deleteProperty(sessions, sessionId)
    console.log(`[SSE Transport] Session ${sessionId} cleaned up`)
    sseEvents.emit(SSE_STATUS_EVENT)
  }
}

export async function handleSseConnection(req: Request, res: Response) {
  console.log(`[SSE Transport] New SSE connection request from ${req.ip}`)

  try {
    let transport: SSEServerTransport
    try {
      transport = new SSEServerTransport(`${MCP_BASE_URL}/message`, res)
      console.log(
        '[SSE Transport DEBUG] SSE transport instance created successfully',
      )
    } catch (e) {
      const error =
        e instanceof Error
          ? e
          : new Error('Unknown error during transport creation')
      console.error(
        '[SSE Transport DEBUG] Failed to create SSE transport:',
        error,
      )
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create SSE transport' })
      }
      return
    }

    console.log(
      `[SSE Transport DEBUG] Attempting to connect transport with message URL: ${MCP_BASE_URL}/message`,
    )

    await mcpServer.connect(transport)
    console.log('[SSE Transport DEBUG] SSE Transport connected')

    const sessionId = transport.sessionId
    if (!sessionId) {
      throw new Error('No session ID generated')
    }

    sessions[sessionId] = { transport, response: res }
    console.log(`[SSE Transport] SSE Session ${sessionId} established.`)
    sseEvents.emit(SSE_STATUS_EVENT)

    req.on('close', () => {
      if (sessionId) {
        console.log(
          `[SSE Transport] Client disconnected (session ${sessionId})`,
        )
        cleanupSession(sessionId, false)
      }
    })
  } catch (error) {
    console.error(
      `[SSE Transport] Failed to set up SSE transport: ${error instanceof Error ? error.message : error}`,
    )

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to establish SSE connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    } else if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ error: 'Failed to establish SSE connection' })}\n\n`,
      )
      res.end()
    }
  }
}

export async function handlePostMessage(req: Request, res: Response) {
  const sessionId = req.query.sessionId as string
  if (!sessionId) {
    console.warn('[SSE Transport] POST /message: Missing sessionId parameter')
    if (!res.headersSent) {
      return res.status(400).send('Missing sessionId parameter')
    }
    return
  }

  const session = sessions[sessionId]
  if (!session?.transport) {
    console.warn(
      `[SSE Transport] POST /message: No active SSE session found for ID ${sessionId}`,
    )
    if (!res.headersSent) {
      return res
        .status(404)
        .send(`No active SSE connection found for session ${sessionId}`)
    }
    return
  }

  try {
    console.log(
      `[SSE Transport] handlePostMessage: req.readable=${req.readable}, res.writableEnded=${res.writableEnded}`,
    )
    if (!req.readable) {
      if (!res.headersSent) {
        return res.status(400).send('Request stream is not readable')
      }
      return
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Message handling timeout')), 5000)
    })

    await Promise.race([
      session.transport.handlePostMessage(req, res),
      timeoutPromise,
    ])
  } catch (error) {
    console.error(
      `[SSE Transport] Error in handlePostMessage for session ${sessionId}: ${error instanceof Error ? error.message : error}`,
    )
    if (!res.headersSent && !res.writableEnded) {
      res.status(500).send('Error processing message')
    }
  }
}
