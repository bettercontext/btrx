import { Router } from 'express'

import contextsRouter from './contexts'
import diffRouter from './diff'
import guidelinesRouter from './guidelines'
import presetsRouter from './presets'

const router = Router()

router.use('/guidelines-contexts', contextsRouter)
router.use('/guidelines', guidelinesRouter)
router.use('/guidelines-presets', presetsRouter)
router.use('/guidelines-diff', diffRouter)

export default router
