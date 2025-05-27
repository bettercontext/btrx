import { type RequestHandler, Router } from 'express'

import {
  bulkDeleteGuidelines,
  bulkUpdateGuidelinesState,
  createGuideline as createGuidelineService,
  deleteGuideline as deleteGuidelineService,
  getGuidelinesForRepository,
  getGuidelinesForRepositoryById,
  updateGuidelineContent as updateGuidelineContentService,
  updateGuidelineState as updateGuidelineStateService,
} from '@/services/guidelines'

const router = Router()

const getGuidelinesList: RequestHandler = async (req, res) => {
  try {
    const {
      path,
      gitUrl,
      context,
      repositoryId: repositoryIdQuery,
      repositoryPath,
    } = req.query

    // Support both new path-based and old repositoryId-based patterns
    if (!path && !repositoryPath && !repositoryIdQuery) {
      res.status(400).json({
        error:
          'Missing required query parameter. Either "path" or "repositoryId" is required.',
      })
      return
    }

    // Helper function to safely convert query param to string
    const toSafeString = (
      param: string | string[] | Record<string, any> | undefined,
    ): string => {
      if (Array.isArray(param)) return param[0]?.toString() || ''
      if (typeof param === 'object' && param !== null) {
        return Object.prototype.toString.call(param)
      }
      return param?.toString() || ''
    }

    const contextStr = toSafeString(context)

    // If repositoryId is provided and is a valid number, use the ID-based approach
    if (repositoryIdQuery) {
      const repositoryId = Number.parseInt(toSafeString(repositoryIdQuery), 10)
      if (!isNaN(repositoryId) && repositoryId > 0) {
        const guidelines = await getGuidelinesForRepositoryById(
          repositoryId,
          contextStr || undefined,
        )
        res.json(guidelines)
        return
      }
    }

    // Otherwise, use the path-based approach
    const effectivePath = toSafeString(path) || toSafeString(repositoryPath)

    if (!effectivePath) {
      res.status(400).json({
        error: 'Invalid repositoryId or missing path parameter.',
      })
      return
    }

    const gitUrlStr = toSafeString(gitUrl)

    const guidelines = await getGuidelinesForRepository(
      effectivePath,
      gitUrlStr || null,
      contextStr || undefined,
    )
    res.json(guidelines)
  } catch (error) {
    console.error('Error fetching guidelines:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to fetch guidelines' })
    }
  }
}

const createGuidelineHandler: RequestHandler = async (req, res) => {
  const { content, context, path, gitUrl, repositoryId } = req.body

  if (!content || !context) {
    res.status(400).json({ error: 'Content and context are required.' })
    return
  }

  if (!path && !repositoryId) {
    res.status(400).json({ error: 'Either path or repositoryId is required.' })
    return
  }

  try {
    const newGuideline = await createGuidelineService(
      content,
      context,
      path || repositoryId.toString(),
      gitUrl,
    )
    res.status(201).json(newGuideline)
  } catch (error) {
    console.error('Error adding guideline:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to add guideline' })
    }
  }
}

const updateGuidelineStateHandler: RequestHandler = async (req, res) => {
  const { id } = req.params
  const { active } = req.body

  if (active === undefined) {
    res.status(400).json({ error: 'Status is required.' })
    return
  }

  try {
    const guidelineId = Number.parseInt(id, 10)
    if (isNaN(guidelineId) || guidelineId <= 0) {
      res.status(400).json({
        error: 'Invalid guideline ID. Must be a positive integer.',
      })
      return
    }

    const updatedGuideline = await updateGuidelineStateService(
      guidelineId,
      active,
    )
    res.json(updatedGuideline)
  } catch (error) {
    console.error('Error updating guideline state:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to update guideline state' })
    }
  }
}

const updateGuidelineContentHandler: RequestHandler = async (req, res) => {
  const { id } = req.params
  const { content } = req.body

  if (!content) {
    res.status(400).json({ error: 'Content is required.' })
    return
  }

  try {
    const guidelineId = Number.parseInt(id, 10)
    if (isNaN(guidelineId) || guidelineId <= 0) {
      res.status(400).json({
        error: 'Invalid guideline ID. Must be a positive integer.',
      })
      return
    }

    const updatedGuideline = await updateGuidelineContentService(
      guidelineId,
      content,
    )
    res.json(updatedGuideline)
  } catch (error) {
    console.error('Error updating guideline content:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to update guideline content' })
    }
  }
}

const bulkUpdateStateHandler: RequestHandler = async (req, res) => {
  const { ids, active } = req.body

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'At least one guideline ID is required.' })
    return
  }

  if (active === undefined) {
    res.status(400).json({ error: 'Active state is required.' })
    return
  }

  try {
    const updatedGuidelines = await bulkUpdateGuidelinesState(
      ids.map((id) => Number(id)),
      active,
    )
    res.json(updatedGuidelines)
  } catch (error) {
    console.error('Error updating guidelines state in bulk:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to update guidelines state' })
    }
  }
}

const bulkDeleteHandler: RequestHandler = async (req, res) => {
  const { ids } = req.body

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'At least one guideline ID is required.' })
    return
  }

  try {
    const deletedGuidelines = await bulkDeleteGuidelines(
      ids.map((id) => Number(id)),
    )
    res.json(deletedGuidelines)
  } catch (error) {
    console.error('Error deleting guidelines in bulk:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to delete guidelines' })
    }
  }
}

const deleteGuidelineHandler: RequestHandler = async (req, res) => {
  const { id } = req.params

  try {
    const guidelineId = Number.parseInt(id, 10)
    if (isNaN(guidelineId) || guidelineId <= 0) {
      res.status(400).json({
        error: 'Invalid guideline ID. Must be a positive integer.',
      })
      return
    }

    const deletedGuideline = await deleteGuidelineService(guidelineId)
    res.json(deletedGuideline)
  } catch (error) {
    console.error('Error deleting guideline:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to delete guideline' })
    }
  }
}

router.get('/', getGuidelinesList)
router.post('/', createGuidelineHandler)
router.patch('/bulk/state', bulkUpdateStateHandler)
router.delete('/bulk', bulkDeleteHandler)
router.patch('/:id/state', updateGuidelineStateHandler)
router.patch('/:id', updateGuidelineContentHandler)
router.delete('/:id', deleteGuidelineHandler)

export default router
