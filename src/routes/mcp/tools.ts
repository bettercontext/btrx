import { Router } from 'express'

import { toolsList } from '@/mcp/tools'

const router = Router()

router.get('/', (req, res) => {
  res.json(toolsList)
})

export default router
