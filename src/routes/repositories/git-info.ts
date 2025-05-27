import { exec } from 'child_process'
import {
  type Request,
  type RequestHandler,
  type Response,
  Router,
} from 'express'
import { promises as fs } from 'fs'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)
const router = Router()

const gitInfoHandler: RequestHandler = async (req: Request, res: Response) => {
  const { path: requestPath } = req.query

  if (!requestPath || typeof requestPath !== 'string') {
    res.status(400).json({ error: 'Path parameter is required' })
    return
  }

  try {
    const gitDirPath = path.join(requestPath, '.git')

    // Verify directory exists and is accessible
    try {
      await fs.access(requestPath)
    } catch {
      res.status(400).json({
        error: `Directory not found or not accessible: ${requestPath}`,
      })
      return
    }

    // Check if it's a git repository
    try {
      await fs.access(gitDirPath)
    } catch {
      res.status(400).json({
        error: `Not a git repository: ${requestPath}`,
      })
      return
    }

    // Get git remote URL
    try {
      const { stdout } = await execAsync('git remote get-url origin', {
        cwd: requestPath,
      })
      res.json({
        cwd: requestPath,
        isGitRepository: true,
        originUrl: stdout.trim(),
      })
    } catch (gitError) {
      console.warn(`Failed to get origin URL for ${requestPath}:`, gitError)
      res.status(400).json({
        error: `Repository has no origin remote: ${requestPath}`,
      })
    }
  } catch (error: any) {
    console.error(
      `Unexpected error in gitInfoHandler for path ${requestPath}:`,
      error,
    )
    res.status(500).json({
      error: 'Unexpected error while processing Git information.',
    })
  }
}

router.get('/', gitInfoHandler)

export default router
