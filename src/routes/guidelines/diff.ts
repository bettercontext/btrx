import { type RequestHandler, Router } from 'express'

import {
  cancelPendingGuidelines,
  getContextsWithPendingVersions,
  getGuidelinesDiff,
  validatePendingGuidelines,
} from '@/services/guidelines'

const router = Router()

/**
 * GET /api/guidelines/diff/contexts
 * Get all contexts with pending guideline versions.
 */
const getContextsHandler: RequestHandler = async (req, res) => {
  try {
    const contexts = await getContextsWithPendingVersions()
    res.json(contexts)
  } catch (error) {
    console.error('Error fetching contexts with pending versions:', error)
    res
      .status(500)
      .json({ error: 'Failed to fetch contexts with pending versions.' })
  }
}

/**
 * GET /api/guidelines/diff/:contextId
 * Get the diff for a specific context.
 */
const getDiffHandler: RequestHandler = async (req, res) => {
  try {
    const contextId = parseInt(req.params.contextId, 10)
    if (isNaN(contextId)) {
      res.status(400).json({ error: 'Invalid context ID.' })
      return
    }
    const diffData = await getGuidelinesDiff(contextId)
    res.json(diffData)
  } catch (error) {
    console.error(
      `Error fetching diff for context ID ${req.params.contextId}:`,
      error,
    )
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to fetch diff data.' })
  }
}

/**
 * POST /api/guidelines/diff/:contextId/validate
 * Validate the pending version for a specific context.
 */
const validateHandler: RequestHandler = async (req, res) => {
  try {
    const contextId = parseInt(req.params.contextId, 10)
    if (isNaN(contextId)) {
      res.status(400).json({ error: 'Invalid context ID.' })
      return
    }
    await validatePendingGuidelines(contextId)
    res.status(200).json({ message: 'Pending version validated successfully.' })
  } catch (error) {
    console.error(
      `Error validating pending version for context ID ${req.params.contextId}:`,
      error,
    )
    if (
      error instanceof Error &&
      error.message.includes('No pending version')
    ) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to validate pending version.' })
  }
}

/**
 * POST /api/guidelines/diff/:contextId/cancel
 * Cancel the pending version for a specific context.
 */
const cancelHandler: RequestHandler = async (req, res) => {
  try {
    const contextId = parseInt(req.params.contextId, 10)
    if (isNaN(contextId)) {
      res.status(400).json({ error: 'Invalid context ID.' })
      return
    }
    await cancelPendingGuidelines(contextId)
    res.status(200).json({ message: 'Pending version cancelled successfully.' })
  } catch (error) {
    console.error(
      `Error cancelling pending version for context ID ${req.params.contextId}:`,
      error,
    )
    if (
      error instanceof Error &&
      error.message.includes('No pending version')
    ) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to cancel pending version.' })
  }
}

router.get('/contexts', getContextsHandler)
router.get('/:contextId', getDiffHandler)
router.post('/:contextId/validate', validateHandler)
router.post('/:contextId/cancel', cancelHandler)

export default router
