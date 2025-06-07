import cors from 'cors'
import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import { API_BASE_URL, API_PORT, WEB_BASE_URL, WEB_PORT } from './config'
import { handleHttpStreamRequest } from './http/transport'
import { registerMcpHandlers } from './mcp/handlers'
import apiRouter from './routes/api'
import { handleHealthCheck } from './routes/system/health'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
;(() => {
  registerMcpHandlers()

  if (process.env.NODE_ENV === 'production') {
    const webApp = express()
    webApp.use(cors())
    webApp.use(express.json())

    const vueAppPath = path.resolve(__dirname, '..', 'dist', 'app')
    console.log(`[Web Server] Serving Vue app static files from: ${vueAppPath}`)

    webApp.get('/healthz', handleHealthCheck)

    webApp.use(express.static(vueAppPath))

    webApp.use((req, res, next) => {
      if (
        req.method === 'GET' &&
        req.accepts('html') &&
        !req.path.startsWith('/api')
      ) {
        res.sendFile(path.resolve(vueAppPath, 'index.html'), (err) => {
          if (err) {
            next(err)
          }
        })
      } else {
        next()
      }
    })

    webApp.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        console.error('[Web App Error Handler]', err)
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error')
        }
      },
    )

    webApp.listen(WEB_PORT, () => {
      console.log(`[Web Server] Server running on port ${WEB_PORT}`)
      console.log(`[Web Server] Web interface available at: ${WEB_BASE_URL}/`)
      console.log(`[Web Server] Health check: ${WEB_BASE_URL}/healthz`)
    })
  } else {
    console.log(
      '[Web Server] Skipping Web App setup in development mode. Vite will handle the frontend.',
    )
  }

  // API Server
  const apiApp = express()
  apiApp.use(cors())
  apiApp.use(express.json())

  apiApp.get('/api/cwd', (req: express.Request, res: express.Response) => {
    const contextCwd = process.env.BETTERCONTEXT_CWD || process.cwd()
    res.json({ cwd: contextCwd })
  })

  apiApp.use('/api', apiRouter)

  apiApp.all('/mcp', (req, res, next) => {
    handleHttpStreamRequest(req, res).catch(next)
  })

  apiApp.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('[API App Error Handler]', err)
      if (!res.headersSent) {
        res.status(500).send('API Server Error')
      }
    },
  )

  apiApp.listen(API_PORT, () => {
    console.log(`[API Server] Server running on port ${API_PORT}`)
    console.log(`[API Server] API base URL: ${API_BASE_URL}/api`)
    console.log(`[API Server] MCP endpoint: ${API_BASE_URL}/mcp`)
  })
})()
