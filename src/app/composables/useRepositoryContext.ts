import { onMounted, ref } from 'vue'

import { guidelinesState } from '@/app/composables/guidelines/useGuidelines'
import { fetchApi } from '@/app/helpers/api'

// Global state
const contextCwd = ref<string | null>(null)
const gitOriginUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(true)
const isLoadingGit = ref(false)
const repositoryId = ref<number | null>(null)
const isLoadingRepoId = ref(false)

const fetchGitInfo = async (cwd: string) => {
  if (isLoadingGit.value || gitOriginUrl.value) {
    return gitOriginUrl.value
  }

  isLoadingGit.value = true
  try {
    const data = await fetchApi<{ originUrl: string }>(
      `/api/git-info?path=${encodeURIComponent(cwd)}`,
    )
    gitOriginUrl.value = data.originUrl
    return data.originUrl
  } catch (e: any) {
    console.error('Failed to fetch Git info:', e)
    gitOriginUrl.value = null
    return null
  } finally {
    isLoadingGit.value = false
  }
}

const fetchRepositoryId = async (cwd: string) => {
  if (isLoadingRepoId.value) {
    return repositoryId.value
  }

  isLoadingRepoId.value = true
  try {
    // Get Git info first to try to get origin URL
    let originUrl = null
    try {
      const gitInfo = await fetchGitInfo(cwd)
      if (gitInfo) {
        originUrl = gitInfo
      }
    } catch (err) {
      console.warn('Not a git repository or no origin URL:', err)
    }

    const repoIdResult = await fetchApi<{ id: number }>(
      `/api/repositories?repositoryPath=${encodeURIComponent(cwd)}&gitOriginUrl=${
        originUrl ? encodeURIComponent(originUrl) : ''
      }`,
    )
    repositoryId.value = repoIdResult.id
    guidelinesState.repositoryId.value = repoIdResult.id
    return repoIdResult.id
  } catch (err: any) {
    console.error('Error fetching repository ID:', err)
    repositoryId.value = null
    throw err
  } finally {
    isLoadingRepoId.value = false
  }
}

const initialize = async () => {
  if (contextCwd.value) {
    return {
      cwd: contextCwd.value,
      repoId: repositoryId.value,
      gitUrl: gitOriginUrl.value,
    }
  }

  isLoading.value = true
  try {
    const data = await fetchApi<{ cwd: string }>('/api/cwd')

    contextCwd.value = data.cwd

    if (data.cwd) {
      // Only fetch git info on init, repository ID will be fetched when needed
      try {
        await fetchGitInfo(data.cwd)
      } catch {
        error.value = 'Failed to load repository context.'
      }
    }
  } catch (e: any) {
    const errorMessage = e.message || 'Failed to load context directory.'
    console.error('Failed to fetch CWD:', e)
    error.value = errorMessage
  } finally {
    isLoading.value = false
  }
}

const validateRepositoryPath = (): string | null => {
  if (!contextCwd.value) {
    return 'Repository path is missing'
  }
  return null
}

export function useRepositoryContext() {
  onMounted(() => {
    if (!contextCwd.value) {
      initialize()
    }
  })

  return {
    contextCwd,
    gitOriginUrl,
    error,
    isLoading,
    isLoadingGit,
    repositoryId,
    isLoadingRepoId,
    fetchRepositoryId,
    validateRepositoryPath,
    initialize,
  }
}
