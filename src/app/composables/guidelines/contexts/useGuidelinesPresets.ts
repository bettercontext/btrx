import { ref } from 'vue'

import { useToast } from 'primevue/usetoast'

import { fetchApi } from '@/app/helpers/api'

export interface GuidelinesPreset {
  name: string
  prompt: string
}

export interface PresetOption {
  label: string
  value: string | null
}

export function useGuidelinesPresets() {
  const presets = ref<PresetOption[]>([])
  const isLoading = ref(false)
  const toast = useToast()

  const fetchPresets = async () => {
    isLoading.value = true
    try {
      const presetFiles = await fetchApi<string[]>(
        '/api/guidelines-presets/list',
      )
      presets.value = [
        { label: 'None', value: null },
        ...presetFiles.map((file: string) => ({
          label: file.replace(/\.md$/u, ''),
          value: file,
        })),
      ]
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error fetching presets',
        detail: error.message,
        life: 3000,
      })
    } finally {
      isLoading.value = false
    }
  }

  const loadPresetContent = async (
    filename: string | null,
  ): Promise<GuidelinesPreset | null> => {
    if (!filename) return null

    try {
      const presetData = await fetchApi<GuidelinesPreset>(
        `/api/guidelines-presets/content?filename=${filename}`,
      )
      return presetData
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error loading preset content',
        detail: error.message,
        life: 3000,
      })
      return null
    }
  }

  return {
    presets,
    isLoading,
    fetchPresets,
    loadPresetContent,
  }
}
