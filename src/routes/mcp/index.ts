import { Router } from 'express'

import clientStatusRouter from './client-status'
import toolsRouter from './tools'

const router = Router()

router.use('/mcp-tools', toolsRouter)
router.use('/mcp-client-status', clientStatusRouter)

export default router
