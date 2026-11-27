/**
 * Resilient tenant-scoped offline storage for ExBOS.
 * Uses IndexedDB (hundreds of MB capacity) as primary large-payload store
 * with synchronous localStorage fallback for instant boot hydration.
 */

const DB_NAME = 'exbos_offline_db'
const DB_VERSION = 1
const STORE_NAME = 'kv_store'

let dbPromise = null

function openOfflineDb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

export async function idbGet(key) {
  if (!key) return null
  const db = await openOfflineDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function idbSet(key, value) {
  if (!key) return false
  const db = await openOfflineDb()
  if (!db) return false
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, key)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

export function generateQueueId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function getFailedQueueKey(scope) {
  const s = String(scope || '').trim().toLowerCase()
  return s ? `exbos_offline_failed_${s}` : 'exbos_offline_failed'
}

export function readFailedOfflineActions(scope) {
  try {
    const raw = localStorage.getItem(getFailedQueueKey(scope))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeFailedOfflineActions(scope, items) {
  try {
    const safe = Array.isArray(items) ? items.slice(-50) : []
    localStorage.setItem(getFailedQueueKey(scope), JSON.stringify(safe))
  } catch {
    /* ignore quota errors on failed list */
  }
}

export function getTaxProfileCacheKey(scope) {
  const s = String(scope || '').trim().toLowerCase()
  return s ? `exbos_tax_profile_${s}` : 'exbos_tax_profile'
}

export function readCachedTaxProfile(scope) {
  try {
    const raw = localStorage.getItem(getTaxProfileCacheKey(scope))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeCachedTaxProfile(scope, profile) {
  if (!profile || typeof profile !== 'object') return
  try {
    localStorage.setItem(getTaxProfileCacheKey(scope), JSON.stringify(profile))
  } catch {
    /* ignore */
  }
}
