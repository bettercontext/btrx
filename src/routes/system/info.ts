import { Router } from 'express'

const router = Router()

router.get('/cwd', (req, res) => {
  const contextCwd = process.env.BETTERCONTEXT_CWD || process.cwd()
  res.json({ cwd: contextCwd })
})

export default router
