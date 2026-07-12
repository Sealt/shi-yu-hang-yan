import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getVisitorId(): string {
  const key = 'hyy_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem('hyy_admin_token')
}

export function setAdminToken(token: string | null) {
  if (token) sessionStorage.setItem('hyy_admin_token', token)
  else sessionStorage.removeItem('hyy_admin_token')
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('x-visitor-id', getVisitorId())
  const token = getAdminToken()
  if (token) headers.set('x-admin-token', token)

  const res = await fetch(path, { ...options, headers, credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `请求失败 (${res.status})`)
  }
  return data as T
}
