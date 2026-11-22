import { resolveApiBase } from './apiClient'

const recentFingerprints = new Map()
let installed = false

function getActiveUserMeta() {
  try {
    const raw = localStorage.getItem('exbos_user')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        userEmail: parsed?.email || 'anonymous',
        architectureId: parsed?.architectureId || ''
      }
    }
  } catch {
    /* ignore */
  }
  return { userEmail: 'anonymous', architectureId: '' }
}

/**
 * Silently report a frontend runtime error, React crash, or backend 5xx
 * to MongoDB so Super Admin sees it in real time inside System Health.
 */
export function reportSystemError({
  source = 'frontend',
  message = 'Unknown error',
  stack = '',
  statusCode = 0,
  endpoint = ''
} = {}) {
  try {
    const msg = String(message || 'Unknown error').slice(0, 500)
    // Never recursively report errors from the error-reporting endpoint itself
    if (endpoint.includes('/health/report-error') || msg.includes('/health/report-error')) {
      return
    }
    const now = Date.now()
    const key = `${source}|${msg}|${statusCode}`
    const last = recentFingerprints.get(key) || 0
    if (now - last < 30000) return
    recentFingerprints.set(key, now)

    const { userEmail, architectureId } = getActiveUserMeta()
    const payload = {
      source,
      message: msg,
      stack: String(stack || '').slice(0, 2000),
      statusCode: Number(statusCode || 0),
      endpoint: String(endpoint || '').slice(0, 300),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userEmail,
      architectureId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    }

    const url = `${resolveApiBase()}/health/report-error`
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {})
  } catch {
    /* never throw from telemetry */
  }
}

export function installGlobalErrorReporter() {
  if (installed || typeof window === 'undefined') return
  installed = true

  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message || 'Uncaught window error'
    const stack = event?.error?.stack || `${event?.filename || ''}:${event?.lineno || 0}:${event?.colno || 0}`
    reportSystemError({ source: 'window.onerror', message: msg, stack })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason
    const msg =
      (reason && (reason.message || String(reason))) || 'Unhandled Promise rejection'
    const stack = reason?.stack || ''
    reportSystemError({ source: 'unhandledrejection', message: msg, stack })
  })
}

