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

// ---------------------------------------------------------------------------
// Offline Salted SHA-256 Credential & Owner PIN Verifiers (never stores plaintext)
// ---------------------------------------------------------------------------
async function sha256Hex(input) {
  const text = String(input || '')
  const Encoder = typeof globalThis !== 'undefined' ? globalThis.TextEncoder : undefined
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof Encoder === 'function') {
    const data = new Encoder().encode(text)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // Fallback deterministic non-plaintext digest for older non-HTTPS contexts
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `fnv_${(h >>> 0).toString(16)}`
}

const OFFLINE_AUTH_KEY = 'exbos_offline_auth_verifiers_v1'

export async function saveOfflineCredentialVerifier(email, password, userProfile) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  if (!cleanEmail || !password || !userProfile) return
  try {
    const salt = `exbos_${cleanEmail}_${Math.random().toString(36).slice(2, 10)}`
    const hash = await sha256Hex(`${salt}:${password}`)
    const existing = JSON.parse(localStorage.getItem(OFFLINE_AUTH_KEY) || '{}')
    existing[cleanEmail] = {
      salt,
      hash,
      user: userProfile,
      savedAt: Date.now()
    }
    localStorage.setItem(OFFLINE_AUTH_KEY, JSON.stringify(existing))
  } catch {
    /* ignore storage errors */
  }
}

export async function verifyOfflineCredential(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  if (!cleanEmail || !password) return null
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_AUTH_KEY) || '{}')
    const rec = existing[cleanEmail]
    if (!rec || !rec.salt || !rec.hash || !rec.user) return null
    const candidate = await sha256Hex(`${rec.salt}:${password}`)
    if (candidate === rec.hash) {
      return rec.user
    }
    return null
  } catch {
    return null
  }
}

export async function saveOfflineOwnerSecretVerifier(scope, secret) {
  const s = String(scope || '').trim().toLowerCase()
  const sec = String(secret || '').trim()
  if (!s || !sec) return
  try {
    const salt = `pin_${s}_${Math.random().toString(36).slice(2, 10)}`
    const hash = await sha256Hex(`${salt}:${sec}`)
    localStorage.setItem(`exbos_offline_owner_pin_${s}`, JSON.stringify({ salt, hash, savedAt: Date.now() }))
  } catch {
    /* ignore */
  }
}

export async function verifyOfflineOwnerSecret(scope, secret) {
  const s = String(scope || '').trim().toLowerCase()
  const sec = String(secret || '').trim()
  if (!s || !sec) return false
  try {
    const raw = localStorage.getItem(`exbos_offline_owner_pin_${s}`)
    if (raw) {
      const rec = JSON.parse(raw)
      if (rec?.salt && rec?.hash) {
        const cand = await sha256Hex(`${rec.salt}:${sec}`)
        if (cand === rec.hash) return true
      }
    }
    // Also accept the Owner's cached login password offline
    const userMatch = await verifyOfflineCredential(s, sec)
    return Boolean(userMatch)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Offline Caches for Monthly Commitments & Cashier Shifts
// ---------------------------------------------------------------------------
export function readOfflineJsonCache(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeOfflineJsonCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota errors */
  }
}

