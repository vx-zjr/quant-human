import { useSyncExternalStore } from 'react'

/**
 * 极简 hash 路由：#/path?key=value
 * 选择 hash 路由是为了让构建产物可以直接用 file:// 或任意静态服务器打开。
 */

export interface RouteState {
  path: string
  query: URLSearchParams
}

function read(): string {
  return window.location.hash.slice(1) || '/'
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): RouteState {
  const raw = useSyncExternalStore(subscribe, read, () => '/')
  const [path, qs] = raw.split('?')
  return { path: path || '/', query: new URLSearchParams(qs ?? '') }
}

export function navigate(path: string, query?: Record<string, string | undefined>) {
  const q = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
        .join('&')
    : ''
  window.location.hash = q ? `${path}?${q}` : path
}

export const href = (path: string) => `#${path}`
