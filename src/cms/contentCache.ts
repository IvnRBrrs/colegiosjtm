import api from './api'
import { fetchContent, fetchPages, fetchPageContent } from './api'

const PREFIX = 'cms_'
function ck(id: string) { return PREFIX + id }

function getCached<T>(id: string): { v: number; d: T } | null {
  try { const r = localStorage.getItem(ck(id)); return r ? JSON.parse(r) : null }
  catch { return null }
}
function setCached<T>(id: string, v: number, d: T) {
  localStorage.setItem(ck(id), JSON.stringify({ v, d }))
}

export async function fetchContentVersion(): Promise<number> {
  console.log('[contentCache] fetchContentVersion START')
  try {
    const { data } = await api.get('/content/version')
    console.log('[contentCache] fetchContentVersion SUCCESS version:', data.version)
    return data.version
  } catch (err) {
    console.error('[contentCache] fetchContentVersion ERROR:', err)
    throw err
  }
}

function revalidate<T>(id: string, oldV: number, fetcher: () => Promise<T>, dispatchKey?: string) {
  fetchContentVersion().then((serverV) => {
    if (serverV !== oldV) {
      fetcher().then((fresh) => {
        setCached(id, serverV, fresh)
        window.dispatchEvent(new CustomEvent('cms-cache-update', { detail: { key: id, data: fresh } }))
      }).catch(() => {})
    }
  }).catch(() => {})
}

export function getCachedPageContent(slug: string): Record<string, string> | null {
  const c = getCached<Record<string, string>>('page_' + slug)
  if (!c || !c.d) return null
  const d = c.d
  if (typeof d !== 'object' || Object.keys(d).length === 0) return null
  return d
}

const _pendingFetches = new Map<string, Promise<{ data: any; cached: boolean }>>()

export async function fetchPageContentCached(slug: string): Promise<{ data: Record<string, string>; cached: boolean }> {
  const id = 'page_' + slug
  const cached = getCached<Record<string, string>>(id)
  const cacheValid = cached && typeof cached.d === 'object' && cached.d !== null && Object.keys(cached.d).length > 0
  if (cacheValid) {
    revalidate(id, cached.v, () => fetchPageContent(slug), id)
    return { data: cached.d, cached: true }
  }
  const pendingKey = 'page_' + slug
  const existing = _pendingFetches.get(pendingKey)
  if (existing) return existing
  const promise = (async () => {
    const data = await fetchPageContent(slug)
    fetchContentVersion().then((v) => setCached(id, v, data)).catch(() => {})
    return { data, cached: false }
  })()
  _pendingFetches.set(pendingKey, promise)
  promise.finally(() => { if (_pendingFetches.get(pendingKey) === promise) _pendingFetches.delete(pendingKey) })
  return promise
}

export async function fetchContentCached(): Promise<{ data: Record<string, string>; cached: boolean }> {
  const id = 'global_content'
  const cached = getCached<Record<string, string>>(id)
  if (cached) {
    revalidate(id, cached.v, () => fetchContent(), id)
    return { data: cached.d, cached: true }
  }
  const existing = _pendingFetches.get(id)
  if (existing) return existing as any
  const promise = (async () => {
    const data = await fetchContent()
    fetchContentVersion().then((v) => setCached(id, v, data)).catch(() => {})
    return { data, cached: false }
  })()
  _pendingFetches.set(id, promise)
  promise.finally(() => { if (_pendingFetches.get(id) === promise) _pendingFetches.delete(id) })
  return promise
}

export async function fetchPagesCached(): Promise<{ data: any[]; cached: boolean }> {
  const id = 'pages'
  const cached = getCached<any[]>(id)
  if (cached) {
    revalidate(id, cached.v, () => fetchPages(), id)
    return { data: cached.d, cached: true }
  }
  const existing = _pendingFetches.get(id)
  if (existing) return existing as any
  const promise = (async () => {
    const data = await fetchPages()
    fetchContentVersion().then((v) => setCached(id, v, data)).catch(() => {})
    return { data, cached: false }
  })()
  _pendingFetches.set(id, promise)
  promise.finally(() => { if (_pendingFetches.get(id) === promise) _pendingFetches.delete(id) })
  return promise
}
