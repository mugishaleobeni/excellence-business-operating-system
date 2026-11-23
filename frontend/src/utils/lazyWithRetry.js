import { lazy } from 'react'

const CHUNK_RELOAD_KEY = 'exbos_chunk_reload_ts'

export function isChunkLoadError(err) {
  const msg = String(err?.message || err || '').toLowerCase()
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('loading chunk') ||
    msg.includes('chunkloaderror') ||
    msg.includes('dynamically imported module')
  )
}

/**
 * Drop-in replacement for React.lazy() that automatically recovers when a new
 * Cloudflare Pages deployment replaces old hashed JS chunks while a user has
 * an older tab or PWA open.
 */
export function lazyWithRetry(importFn) {
  return lazy(async () => {
    try {
      return await importFn()
    } catch (err) {
      if (typeof window !== 'undefined' && isChunkLoadError(err)) {
        try {
          const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
          const now = Date.now()
          // Guard against infinite reload loops (max once every 20 seconds)
          if (now - lastReload > 20000) {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now))
            // Clear stale PWA caches before reloading so the fresh index.html & chunks load
            if ('caches' in window) {
              const keys = await caches.keys().catch(() => [])
              await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})))
            }
            window.location.reload()
            return new Promise(() => {})
          }
        } catch {
          window.location.reload()
          return new Promise(() => {})
        }
      }
      throw err
    }
  })
}
