import { beforeEach, describe, expect, it, vi } from 'vitest'

import { API_BASE_URL } from '@/app/config'

import { useMcpTools } from './useMcpTools'

describe('useMcpTools', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('should initialize with default values', () => {
    const { tools, loading, error } = useMcpTools()
    expect(tools.value).toEqual([])
    expect(loading.value).toBe(true)
    expect(error.value).toBe(null)
  })

  it('should fetch tools successfully', async () => {
    const mockTools = [
      { name: 'tool1', description: 'desc1' },
      { name: 'tool2', description: 'desc2' },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTools),
    })

    const { tools, loading, error, fetchMcpTools } = useMcpTools()
    await fetchMcpTools()

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/mcp-tools`)
    expect(tools.value).toEqual(mockTools)
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('should handle network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { tools, loading, error, fetchMcpTools } = useMcpTools()
    await fetchMcpTools()

    expect(tools.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(error.value).toBe(
      'Failed to load MCP tools. Please try again later.',
    )
  })

  it('should handle HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    const { tools, loading, error, fetchMcpTools } = useMcpTools()
    await fetchMcpTools()

    expect(tools.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(error.value).toBe(
      'Failed to load MCP tools. Please try again later.',
    )
  })
})
