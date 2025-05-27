import { Router } from 'express'

import { MCP_PORT } from '@/config'
import { getMcpClientCount } from '@/sse/transport'

const router = Router()

router.get('/', (req, res) => {
  const sseUrl = `http://${req.hostname}:${MCP_PORT}/sse`
  res.json({
    count: getMcpClientCount(),
    sseUrl,
  })
})

export default router
