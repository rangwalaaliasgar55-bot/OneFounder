const BASE = '/api'

async function parseJSONResponse(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const err = (await parseJSONResponse(res)) || { error: 'Request failed' }
    throw new Error((err as any).error || 'Request failed')
  }
  return (await parseJSONResponse(res)) as T
}

function authFetch(path: string, options: RequestInit) {
  return fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  }).then(async res => {
    const body = await parseJSONResponse(res)
    if (!res.ok) {
      const error = (body as any)?.error || 'Request failed'
      throw new Error(error)
    }
    return body
  })
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: any) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export const authApi = {
  signIn: (email: string, password: string) =>
    authFetch('/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signUp: (name: string, email: string, password: string) =>
    authFetch('/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  signOut: () =>
    authFetch('/auth/sign-out', { method: 'POST' }),

  getSession: () =>
    authFetch('/auth/get-session', { method: 'GET' }),
}
