import { Router } from 'express'

import infoRouter from './info'

const router = Router()

router.use('/', infoRouter)

export default router
