import type { User } from '@/payload-types'

/**
 * Thin REST client for the shadcn admin dashboard.
 *
 * The dashboard talks to Payload's generated REST API (`/api/*`) with
 * `credentials: 'include'`, so the `payload-token` httpOnly cookie set at login
 * authenticates every request and Payload's access control (admins / editors)
 * is enforced automatically on the server.
 */

const BASE = '/api'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init.headers,
    },
    ...init,
  })

  if (!res.ok) {
    let message = `Request gagal (${res.status})`
    try {
      const body = await res.json()
      if (body?.errors?.[0]?.message) message = body.errors[0].message
      else if (body?.message) message = body.message
      else if (body?.error) message = typeof body.error === 'string' ? body.error : JSON.stringify(body.error)
    } catch {
      // non-JSON error body; keep the generic message
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/* ---------------------------------- Auth ---------------------------------- */

export async function login(email: string, password: string): Promise<User> {
  const data = await request<{ user: User }>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return data.user
}

export async function logout(): Promise<void> {
  await request('/users/logout', { method: 'POST' })
}

export async function getMe(): Promise<User | null> {
  try {
    const data = await request<{ user: User | null }>('/users/me')
    return data.user ?? null
  } catch {
    return null
  }
}

/* --------------------------------- CRUD ----------------------------------- */

type Query = Record<string, unknown>

export interface ListResult<T> {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function find<T>(collection: string, query: Query = {}): Promise<ListResult<T>> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
  }
  return request<ListResult<T>>(`/${collection}?${params.toString()}`)
}

export function findOne<T>(collection: string, id: string | number, query: Query = {}): Promise<T> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
  }
  return request<T>(`/${collection}/${id}?${params.toString()}`)
}

export function count(collection: string, where: Query = {}): Promise<{ totalDocs: number }> {
  const params = new URLSearchParams()
  if (Object.keys(where).length) params.append('where', JSON.stringify(where))
  return request<{ totalDocs: number }>(`/${collection}/count?${params.toString()}`)
}

export function create<T>(collection: string, data: Record<string, unknown>, query: Query = {}): Promise<T> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.append(key, String(value))
  }
  return request<T>(`/${collection}?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function update<T>(
  collection: string,
  id: string | number,
  data: Record<string, unknown>,
  query: Query = {},
): Promise<T> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.append(key, String(value))
  }
  return request<T>(`/${collection}/${id}?${params.toString()}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function remove(collection: string, id: string | number): Promise<void> {
  return request(`/${collection}/${id}`, { method: 'DELETE' })
}

export function bulkDelete(collection: string, ids: (string | number)[]): Promise<void> {
  const where = { id: { in: ids } }
  const params = new URLSearchParams()
  params.append('where', JSON.stringify(where))
  return request(`/${collection}?${params.toString()}`, {
    method: 'DELETE',
  })
}

/* --------------------------------- Media ---------------------------------- */

export async function uploadMedia(file: File, alt: string): Promise<unknown> {
  // Payload's REST multipart parser only reads non-file fields from the
  // `_payload` JSON string — plain form fields are dropped, which makes
  // required fields like `alt` appear "missing".
  const form = new FormData()
  form.append('file', file)
  form.append('_payload', JSON.stringify({ alt }))
  return request('/media', { method: 'POST', body: form })
}

/* -------------------------------- Globals --------------------------------- */

export function findGlobal<T>(slug: string): Promise<T> {
  return request<T>(`/globals/${slug}`)
}

export function updateGlobal<T>(slug: string, data: Record<string, unknown>): Promise<T> {
  return request<T>(`/globals/${slug}`, { method: 'POST', body: JSON.stringify(data) })
}
