import { Router } from 'express'

import { API_PORT } from '@/config'

const router = Router()

router.get('/', (req, res) => {
  const httpUrl = `http://${req.hostname}:${API_PORT}/mcp`

  res.json({
    available: true,
    httpUrl,
  })
})

export default router
