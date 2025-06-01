import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@/app/helpers/api'

import { useGuidelinesPresets } from './useGuidelinesPresets'

vi.mock('@/app/helpers/api', () => ({
  fetchApi: vi.fn(),
}))

const mockToast = {
  add: vi.fn(),
}

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast,
}))

describe('useGuidelinesPresets', () => {
  const mockPresetFiles = ['preset1.md', 'preset2.md']
  const mockPresetContent = {
    name: 'Test Preset',
    prompt: 'Test prompt content',
  }

  beforeEach(() => {
    vi.mocked(api.fetchApi).mockReset()
    mockToast.add.mockReset()
  })

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { presets, isLoading } = useGuidelinesPresets()

      expect(presets.value).toEqual([])
      expect(isLoading.value).toBe(false)
    })
  })

  describe('fetchPresets', () => {
    it('should fetch presets successfully', async () => {
      vi.mocked(api.fetchApi).mockResolvedValueOnce(mockPresetFiles)

      const { presets, isLoading, fetchPresets } = useGuidelinesPresets()
      await fetchPresets()

      expect(api.fetchApi).toHaveBeenCalledWith('/api/guidelines-presets/list')
      expect(presets.value).toEqual([
        { label: 'None', value: null },
        { label: 'preset1', value: 'preset1.md' },
        { label: 'preset2', value: 'preset2.md' },
      ])
      expect(isLoading.value).toBe(false)
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Network error'
      vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

      const { presets, isLoading, fetchPresets } = useGuidelinesPresets()
      await fetchPresets()

      expect(presets.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error fetching presets',
        detail: errorMessage,
        life: 3000,
      })
    })

    it('should set and reset loading state', async () => {
      vi.mocked(api.fetchApi).mockResolvedValueOnce(mockPresetFiles)

      const { isLoading, fetchPresets } = useGuidelinesPresets()

      const fetchPromise = fetchPresets()
      expect(isLoading.value).toBe(true)

      await fetchPromise
      expect(isLoading.value).toBe(false)
    })
  })

  describe('loadPresetContent', () => {
    it('should return null for null filename', async () => {
      const { loadPresetContent } = useGuidelinesPresets()
      const result = await loadPresetContent(null)

      expect(result).toBeNull()
      expect(api.fetchApi).not.toHaveBeenCalled()
    })

    it('should load preset content successfully', async () => {
      vi.mocked(api.fetchApi).mockResolvedValueOnce(mockPresetContent)

      const { loadPresetContent } = useGuidelinesPresets()
      const result = await loadPresetContent('test-preset.md')

      expect(api.fetchApi).toHaveBeenCalledWith(
        '/api/guidelines-presets/content?filename=test-preset.md',
      )
      expect(result).toEqual(mockPresetContent)
    })

    it('should handle load error', async () => {
      const errorMessage = 'Failed to load preset'
      vi.mocked(api.fetchApi).mockRejectedValueOnce(new Error(errorMessage))

      const { loadPresetContent } = useGuidelinesPresets()
      const result = await loadPresetContent('test-preset.md')

      expect(result).toBeNull()
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error loading preset content',
        detail: errorMessage,
        life: 3000,
      })
    })
  })
})
