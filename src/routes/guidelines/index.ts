import { Router } from 'express'

import contextsRouter from './contexts'
import guidelinesRouter from './guidelines'
import presetsRouter from './presets'

const router = Router()

router.use('/guidelines-contexts', contextsRouter)
router.use('/guidelines', guidelinesRouter)
router.use('/guidelines-presets', presetsRouter)

export default router
