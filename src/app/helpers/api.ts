import { API_BASE_URL } from '../config'

const noCacheHeaders = {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
  },
}

export async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    ...noCacheHeaders,
    headers: {
      ...options.headers,
      ...noCacheHeaders.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  // Handle 204 No Content responses (like DELETE operations)
  if (response.status === 204) {
    return undefined as T
  }

  // Check if response has content before parsing JSON
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  // Fallback for non-JSON responses
  return undefined as T
}
