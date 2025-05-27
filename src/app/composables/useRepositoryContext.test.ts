import type * as vue from 'vue'
import { nextTick } from 'vue'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@/app/helpers/api'

import { useRepositoryContext } from './useRepositoryContext'

vi.mock('@/app/helpers/api', () => ({
  fetchApi: vi.fn(),
}))

let onMountedCallback: (() => void) | null = null
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof vue>('vue')
  return {
    ...actual,
    onMounted: (fn: () => void) => {
      onMountedCallback = fn // Capture the callback
    },
  }
})

// Helper to run the captured onMounted callback
const triggerOnMounted = async () => {
  if (onMountedCallback) {
    onMountedCallback()
    onMountedCallback = null // Reset after running
    await nextTick() // Allow Vue to process updates
  }
}

// Get the refs once to be reset in beforeEach
const {
  contextCwd: _contextCwd,
  gitOriginUrl: _gitOriginUrl,
  error: _error,
  isLoading: _isLoading,
  isLoadingGit: _isLoadingGit,
  repositoryId: _repositoryId,
  isLoadingRepoId: _isLoadingRepoId,
} = useRepositoryContext()

describe('useRepositoryContext', () => {
  const mockCwd = '/test/path'
  const mockRepoId = 123
  const mockGitUrl = 'git@github.com:test/repo.git'

  const waitForInitialization = async () => {
    await vi.runAllTimersAsync()
    await nextTick()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.fetchApi).mockReset()
    vi.useFakeTimers()
    onMountedCallback = null // Reset captured callback

    // Reset global state directly
    _contextCwd.value = null
    _gitOriginUrl.value = null
    _error.value = null
    _isLoading.value = true // Default initial state before onMounted runs
    _isLoadingGit.value = false
    _repositoryId.value = null
    _isLoadingRepoId.value = false
  })

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const {
        contextCwd,
        gitOriginUrl,
        error,
        isLoading,
        isLoadingGit,
        repositoryId,
        isLoadingRepoId,
      } = useRepositoryContext() // onMounted callback is captured, not run

      expect(contextCwd.value).toBeNull()
      expect(gitOriginUrl.value).toBeNull()
      expect(error.value).toBeNull()
      expect(isLoading.value).toBe(true) // This is the default before initialize runs
      expect(isLoadingGit.value).toBe(false)
      expect(repositoryId.value).toBeNull()
      expect(isLoadingRepoId.value).toBe(false)
    })
  })

  describe('fetchRepositoryId', () => {
    it('should fetch and set repository ID', async () => {
      vi.mocked(api.fetchApi)
        .mockResolvedValueOnce({ originUrl: mockGitUrl }) // git info fetch
        .mockResolvedValueOnce({ id: mockRepoId }) // repository fetch

      const { fetchRepositoryId, repositoryId, isLoadingRepoId } =
        useRepositoryContext()

      const result = await fetchRepositoryId(mockCwd)

      expect(result).toBe(mockRepoId)
      expect(repositoryId.value).toBe(mockRepoId)
      expect(isLoadingRepoId.value).toBe(false)
      expect(api.fetchApi).toHaveBeenCalledWith(
        `/api/repositories?repositoryPath=${encodeURIComponent(mockCwd)}&gitOriginUrl=${encodeURIComponent(mockGitUrl)}`,
      )
    })

    it('should handle fetch repository ID error', async () => {
      const errorMessage = 'Failed to fetch repository ID'
      vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

      const { fetchRepositoryId, repositoryId, isLoadingRepoId } =
        useRepositoryContext()

      await expect(fetchRepositoryId(mockCwd)).rejects.toThrow(Error)
      expect(repositoryId.value).toBeNull()
      expect(isLoadingRepoId.value).toBe(false)
    })

    it('should prevent concurrent repository ID fetches', async () => {
      vi.mocked(api.fetchApi)
        .mockResolvedValueOnce({ originUrl: mockGitUrl }) // git info fetch
        .mockResolvedValueOnce({ id: mockRepoId }) // repository fetch
      const { fetchRepositoryId, isLoadingRepoId } = useRepositoryContext()

      const firstFetch = fetchRepositoryId(mockCwd)
      const secondFetch = fetchRepositoryId(mockCwd)

      await Promise.all([firstFetch, secondFetch])

      expect(api.fetchApi).toHaveBeenCalledTimes(2) // git info + repository fetch
      expect(isLoadingRepoId.value).toBe(false)
    })
  })

  describe('validateRepositoryPath', () => {
    it('should return null when contextCwd is set', () => {
      const { validateRepositoryPath } = useRepositoryContext()
      _contextCwd.value = mockCwd

      const result = validateRepositoryPath()
      expect(result).toBeNull()
    })

    it('should return error message when contextCwd is null', () => {
      const { validateRepositoryPath } = useRepositoryContext()
      _contextCwd.value = null

      const result = validateRepositoryPath()
      expect(result).toBe('Repository path is missing')
    })
  })

  describe('Initialization', () => {
    it('should initialize successfully with all data', async () => {
      vi.mocked(api.fetchApi)
        .mockResolvedValueOnce({ cwd: mockCwd }) // 1. cwd fetch
        .mockResolvedValueOnce({ originUrl: mockGitUrl }) // 2. git info fetch

      const instance = useRepositoryContext()
      await triggerOnMounted() // Calls initialize()
      await waitForInitialization() // Waits for initialize's async ops

      expect(api.fetchApi).toHaveBeenCalledTimes(2)
      expect(instance.contextCwd.value).toBe(mockCwd)
      expect(instance.gitOriginUrl.value).toBe(mockGitUrl)
      expect(instance.error.value).toBeNull()
      expect(instance.isLoading.value).toBe(false)
      expect(instance.repositoryId.value).toBeNull()
    })

    it('should handle CWD fetch error', async () => {
      const errorMessage = 'Failed to fetch CWD'
      vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

      const instance = useRepositoryContext()
      await triggerOnMounted()
      await waitForInitialization()

      expect(instance.error.value).toBe(errorMessage)
      expect(instance.isLoading.value).toBe(false)
      expect(api.fetchApi).toHaveBeenCalledTimes(1)
    })

    it('should handle git info fetch error gracefully', async () => {
      vi.mocked(api.fetchApi)
        .mockResolvedValueOnce({ cwd: mockCwd })
        .mockRejectedValueOnce(new Error('Failed to fetch git info'))

      const instance = useRepositoryContext()
      await triggerOnMounted()
      await waitForInitialization()

      expect(instance.gitOriginUrl.value).toBeNull()
      expect(instance.error.value).toBeNull()
      expect(instance.isLoading.value).toBe(false)
      expect(instance.isLoadingGit.value).toBe(false)
      expect(api.fetchApi).toHaveBeenCalledTimes(2)
    })
  })
})
