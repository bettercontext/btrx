import { Router } from 'express'

import guidelinesRouter from './guidelines'
import mcpRouter from './mcp'
import repositoriesRouter from './repositories'
import systemRouter from './system'

const router = Router()

// Disable caching for all API routes
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

router.use('/', guidelinesRouter)
router.use('/', repositoriesRouter)
router.use('/', mcpRouter)
router.use('/', systemRouter)

export default router
