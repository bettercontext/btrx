import { type Request, type Response, Router } from 'express'

const router = Router()

export function handleHealthCheck(_req: Request, res: Response) {
  res.send('ok')
}

router.get('/', handleHealthCheck)

export default router
