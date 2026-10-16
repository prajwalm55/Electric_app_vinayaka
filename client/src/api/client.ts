const TOKEN_KEY = 'veew_token'
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const API_TIMEOUT_MS = 45_000
const READ_RETRY_DELAYS_MS = [1_500, 4_000]

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function isRetryable(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof ApiError && [502, 503, 504].includes(error.status))
  )
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isRead = !options.method || options.method.toUpperCase() === 'GET'
  const attempts = isRead ? READ_RETRY_DELAYS_MS.length + 1 : 1

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const token = getToken()
    const headers = new Headers(options.headers)
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json')
    }
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE_URL}/api${path}`, { ...options, headers, signal: controller.signal })
      if (response.status === 204) return undefined as T

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new ApiError(response.status, payload.error || 'Request failed')
      }
      return payload as T
    } catch (error) {
      const canRetry = isRead && attempt < attempts - 1 && isRetryable(error)
      if (!canRetry) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('The server took too long to respond. It may be waking up; please try again.')
        }
        throw error
      }
      await wait(READ_RETRY_DELAYS_MS[attempt])
    } finally {
      window.clearTimeout(timeout)
    }
  }

  throw new Error('Request failed')
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: async (
    file: File,
    folder: 'customers' | 'properties' | 'projects',
    entityId: string,
    fileType: string,
  ): Promise<{
    fileUrl: string
    fileName: string
    fileSize: number
    mimeType: string
    s3Key: string
  }> => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('entityId', entityId)
    formData.append('fileType', fileType)

    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const response = await fetch(`${API_BASE_URL}/api/upload/single`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new ApiError(response.status, payload.error || 'Upload failed')
    }
    return payload
  },
  getDownloadUrl: async (s3Key: string): Promise<string> => {
    const res = await api.get<{ url: string }>(`/upload/download-url?s3Key=${encodeURIComponent(s3Key)}`)
    return res.url
  },
  download: async (path: string, filename: string) => {
    const token = getToken()
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const response = await fetch(`${API_BASE_URL}/api${path}`, { headers })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new ApiError(response.status, payload.error || 'Download failed')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
