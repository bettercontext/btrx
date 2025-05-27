import { ref } from 'vue'

import { API_BASE_URL } from '@/app/config'

interface McpTool {
  name: string
  description: string
}

export function useMcpTools() {
  const tools = ref<McpTool[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function fetchMcpTools() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp-tools`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      tools.value = await response.json()
    } catch (e) {
      console.error('Failed to fetch MCP tools:', e)
      error.value = 'Failed to load MCP tools. Please try again later.'
    } finally {
      loading.value = false
    }
  }

  return {
    tools,
    loading,
    error,
    fetchMcpTools,
  }
}
