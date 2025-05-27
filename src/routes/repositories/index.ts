import { Router } from 'express'

import gitInfoRouter from './git-info'
import repositoriesRouter from './repositories'

const router = Router()

router.use('/git-info', gitInfoRouter)
router.use('/repositories', repositoriesRouter)

export default router
