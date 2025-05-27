import type { Request, Response } from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function handleWebRoot(_req: Request, res: Response) {
  const htmlPath = path.resolve(__dirname, '@/public/index.html')
  res.sendFile(htmlPath)
}
