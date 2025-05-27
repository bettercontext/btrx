import express, {
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const router: Router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const presetsDir = path.join(__dirname, '../../prompts/guidelines/contexts')

router.get(
  '/list',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const files = await fs.readdir(presetsDir)
      const mdFiles = files.filter((file) => file.endsWith('.md'))
      res.json(mdFiles)
    } catch (error) {
      console.error('Error listing presets:', error)
      next(error)
    }
  },
)

router.get(
  '/content',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filename = req.query.filename as string

      if (!filename || typeof filename !== 'string') {
        res.status(400).json({
          error: 'Filename query parameter is required and must be a string.',
        })
        return
      }

      if (!filename.endsWith('.md')) {
        res.status(400).json({ error: 'Filename must end with .md' })
        return
      }

      // Basic security: sanitize filename to prevent directory traversal
      const sanitizedFilename = path
        .normalize(filename)
        .replace(/^(\.\.(\/|\\|$))+/u, '')
      if (sanitizedFilename !== filename) {
        res.status(400).json({ error: 'Invalid filename.' })
        return
      }

      const filePath = path.join(presetsDir, sanitizedFilename)

      // Ensure the resolved path is still within the presetsDir
      if (!filePath.startsWith(presetsDir)) {
        res.status(400).json({
          error: 'Invalid filename (directory traversal attempt detected).',
        })
        return
      }

      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const name = sanitizedFilename.replace(/\.md$/u, '')
        res.json({ name, prompt: content })
      } catch (readError: any) {
        if (readError.code === 'ENOENT') {
          res.status(404).json({ error: 'Preset not found' })
          return
        }
        throw readError
      }
    } catch (error) {
      console.error(
        `Error processing request for ${req.query.filename}:`,
        error,
      )
      next(error)
    }
  },
)

export default router
