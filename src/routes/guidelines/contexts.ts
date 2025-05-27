import { and, eq } from 'drizzle-orm'
import { type RequestHandler, Router } from 'express'

import { db } from '@/db'
import { guidelinesContexts } from '@/db/schema'
import {
  findOrCreateRepositoryByPath,
  findRepositoryByPath,
} from '@/services/repositoryService'

const router = Router()

const getGuidelinesContexts: RequestHandler = async (req, res) => {
  const { repositoryPath, gitOriginUrl } = req.query

  if (!repositoryPath || typeof repositoryPath !== 'string') {
    res.status(400).json({ error: 'Repository path is required' })
    return
  }

  try {
    const repository = await findRepositoryByPath(
      repositoryPath,
      typeof gitOriginUrl === 'string' ? gitOriginUrl : null,
    )

    if (!repository) {
      res.json({ contexts: [], repositoryId: null })
      return
    }

    const contexts = await db
      .select()
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.repositoryId, repository.id))

    res.json({ contexts, repositoryId: repository.id })
  } catch (error: any) {
    console.error('Error fetching contexts:', error)
    if (error.message?.includes('Failed to search repository')) {
      res.status(400).json({ error: 'Invalid repository path' })
    } else {
      res.status(500).json({ error: 'Failed to fetch contexts' })
    }
  }
}

const createGuidelinesContext: RequestHandler = async (req, res) => {
  const { name, prompt, repositoryPath, gitOriginUrl } = req.body

  if (!name || !prompt || !repositoryPath) {
    res
      .status(400)
      .json({ error: 'Name, prompt, and repositoryPath are required.' })
    return
  }

  if (typeof repositoryPath !== 'string') {
    res.status(400).json({ error: 'Invalid repositoryPath format.' })
    return
  }

  try {
    const { id: repositoryId } = await findOrCreateRepositoryByPath(
      repositoryPath,
      typeof gitOriginUrl === 'string' ? gitOriginUrl : null,
    )

    const existingContext = await db
      .select()
      .from(guidelinesContexts)
      .where(
        and(
          eq(guidelinesContexts.name, name),
          eq(guidelinesContexts.repositoryId, repositoryId),
        ),
      )

    if (existingContext.length > 0) {
      res.status(409).json({
        error: `A context with the name "${name}" already exists for this repository.`,
      })
      return
    }

    const [newContext] = await db
      .insert(guidelinesContexts)
      .values({ name, prompt, repositoryId })
      .returning()

    res.status(201).json(newContext)
  } catch (error: any) {
    console.error('Error creating guidelines context:', error)
    // Check if the error is from findOrCreateRepositoryByPath
    if (
      error.message.includes('Failed to process repository request') ||
      error.message.includes('Missing or invalid "repositoryPath" argument')
    ) {
      res.status(400).json({
        error: 'Invalid repositoryPath or failed to process repository.',
      })
    } else {
      res.status(500).json({ error: 'Failed to create guidelines context' })
    }
  }
}

const updateGuidelinesContext: RequestHandler = async (req, res) => {
  const { id } = req.params
  const { name, prompt } = req.body

  if (!name || !prompt) {
    res.status(400).json({ error: 'Name and prompt are required.' })
    return
  }

  try {
    const currentContext = await db
      .select({ repositoryId: guidelinesContexts.repositoryId })
      .from(guidelinesContexts)
      .where(eq(guidelinesContexts.id, Number.parseInt(id)))
      .limit(1)

    if (currentContext.length === 0) {
      res.status(404).json({ error: 'Context not found.' })
      return
    }
    const actualRepositoryId = currentContext[0].repositoryId

    const otherContextWithSameName = await db
      .select({ id: guidelinesContexts.id })
      .from(guidelinesContexts)
      .where(
        and(
          eq(guidelinesContexts.name, name),
          eq(guidelinesContexts.repositoryId, actualRepositoryId),
        ),
      )
      .limit(1)

    if (
      otherContextWithSameName.length > 0 &&
      otherContextWithSameName[0].id !== Number.parseInt(id)
    ) {
      res.status(409).json({
        error: `A context with the name "${name}" already exists in this repository.`,
      })
      return
    }

    const [updatedContext] = await db
      .update(guidelinesContexts)
      .set({ name, prompt })
      .where(eq(guidelinesContexts.id, Number.parseInt(id)))
      .returning()

    if (!updatedContext) {
      res.status(404).json({ error: 'Context not found.' })
      return
    }

    res.json(updatedContext)
  } catch (error) {
    console.error('Error updating guidelines context:', error)
    res.status(500).json({ error: 'Failed to update guidelines context' })
  }
}

const deleteGuidelinesContext: RequestHandler = async (req, res) => {
  const { id } = req.params

  try {
    const [deletedContext] = await db
      .delete(guidelinesContexts)
      .where(eq(guidelinesContexts.id, Number.parseInt(id)))
      .returning()

    if (!deletedContext) {
      res.status(404).json({ error: 'Context not found.' })
      return
    }

    res.json({ message: 'Context deleted successfully.' })
  } catch (error) {
    console.error('Error deleting guidelines context:', error)
    res.status(500).json({ error: 'Failed to delete guidelines context' })
  }
}

router.get('/', getGuidelinesContexts)
router.post('/', createGuidelinesContext)
router.put('/:id', updateGuidelinesContext)
router.delete('/:id', deleteGuidelinesContext)

export default router
