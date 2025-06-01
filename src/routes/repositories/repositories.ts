import { type RequestHandler, Router } from 'express'

import {
  deleteRepository,
  findOrCreateRepositoryByPath,
  getAllRepositories,
  updateRepository,
} from '@/services/repositoryService'

const router = Router()

const getRepositoryByPathHandler: RequestHandler = async (req, res) => {
  const { repositoryPath, gitOriginUrl } = req.query

  if (!repositoryPath || typeof repositoryPath !== 'string') {
    res
      .status(400)
      .json({ error: 'Missing or invalid "repositoryPath" query parameter.' })
    return
  }

  try {
    const repo = await findOrCreateRepositoryByPath(
      repositoryPath,
      typeof gitOriginUrl === 'string' ? gitOriginUrl : null,
    )
    res.json({ id: repo.id })
  } catch (error: any) {
    console.error(
      `Error in getRepositoryByPathHandler for path "${repositoryPath}":`,
      error,
    )
    if (!res.headersSent) {
      if (
        error.message.includes('Missing or invalid "repositoryPath" argument')
      ) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Failed to process repository request.' })
      }
    }
  }
}

const getAllRepositoriesHandler: RequestHandler = async (req, res) => {
  try {
    const repositories = await getAllRepositories()
    res.json(repositories)
  } catch (error: any) {
    console.error('Error fetching repositories:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to fetch repositories.' })
    }
  }
}

const updateRepositoryHandler: RequestHandler = async (req, res) => {
  const { id } = req.params
  const { origin } = req.body

  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: 'Invalid repository ID.' })
    return
  }

  try {
    const updated = await updateRepository(Number(id), {
      origin,
    })
    res.json(updated)
  } catch (error: any) {
    console.error('Error updating repository:', error)
    if (!res.headersSent) {
      if (error.message.includes('Repository not found')) {
        res.status(404).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Failed to update repository.' })
      }
    }
  }
}

const deleteRepositoryHandler: RequestHandler = async (req, res) => {
  const { id } = req.params

  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: 'Invalid repository ID.' })
    return
  }

  try {
    console.log(`Attempting to delete repository with ID: ${id}`)
    await deleteRepository(Number(id))
    console.log(`Successfully deleted repository with ID: ${id}`)
    res.status(204).send()
  } catch (error: any) {
    console.error(`Error deleting repository ${id}:`, error)
    if (!res.headersSent) {
      if (error.message.includes('Repository not found')) {
        res.status(404).json({ error: error.message })
      } else {
        res
          .status(500)
          .json({ error: `Failed to delete repository: ${error.message}` })
      }
    }
  }
}

router.get('/', getRepositoryByPathHandler)
router.get('/all', getAllRepositoriesHandler)
router.put('/:id', updateRepositoryHandler)
router.delete('/:id', deleteRepositoryHandler)

export default router
