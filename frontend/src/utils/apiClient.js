export function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    if (!payload.exp) return true
    const now = Math.floor(Date.now() / 1000)
    return payload.exp > now
  } catch {
    return false
  }
}

const PRODUCTION_BACKEND_ORIGIN = 'https://exbos.onrender.com'

function isLocalHost(host) {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.')
  )
}

export function resolveBackendOrigin() {
  const envBase = (import.meta?.env?.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (envBase) {
    return envBase.replace(/\/api\/v1$/, '')
  }
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || '127.0.0.1'
    if (isLocalHost(host)) {
      return `http://${host}:5000`
    }
    return PRODUCTION_BACKEND_ORIGIN
  }
  return PRODUCTION_BACKEND_ORIGIN
}

export function resolveApiBase() {
  return `${resolveBackendOrigin()}/api/v1`
}

export function resolveStorageUrl(scopeParam = '') {
  return `${resolveBackendOrigin()}/api/storage${scopeParam}`
}

export function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  try {
    const token = localStorage.getItem('exbos_access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  } catch {
    /* ignore storage errors */
  }
  return headers
}

export async function apiRequest(endpoint, { method = 'GET', body = null } = {}) {
  try {
    const options = {
      method,
      headers: getAuthHeaders()
    }
    if (body !== null) {
      options.body = JSON.stringify(body)
    }
    const apiBase = resolveApiBase()
    let response
    try {
      response = await fetch(`${apiBase}${endpoint}`, options)
    } catch {
      // Fallback to relative path if direct port 5000 is unreachable
      response = await fetch(`/api/v1${endpoint}`, options)
    }
    const data = await response.json().catch(() => null)
    return {
      ok: response.ok,
      status: response.status,
      data,
      error: !response.ok ? data?.error || data?.message || 'Request failed' : null
    }
  } catch (err) {
    return { ok: false, status: 0, error: err.message }
  }
}

function getActiveScopeQuery() {
  try {
    const saved = localStorage.getItem('exbos_user')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.email) {
        return `?scopeKey=${encodeURIComponent(String(parsed.email).toLowerCase())}`
      }
    }
  } catch {
    /* ignore */
  }
  return ''
}

function withScope(path) {
  const scopeQuery = getActiveScopeQuery()
  if (!scopeQuery) return path
  return path.includes('?') ? `${path}&${scopeQuery.slice(1)}` : `${path}${scopeQuery}`
}

export const exbosApi = {
  health: () => apiRequest('/health'),
  sendVerification: (payload) =>
    apiRequest('/auth/send-verification', { method: 'POST', body: payload }),
  verifyEmail: (payload) =>
    apiRequest('/auth/verify-email', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (payload) => apiRequest('/auth/me', { method: 'PATCH', body: payload }),
  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (payload) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: payload }),
  deleteAccount: (payload = {}) =>
    apiRequest('/auth/delete-account', { method: 'DELETE', body: payload }),
  patchWorkspace: (archId, payload) =>
    apiRequest(withScope(`/workspaces/${archId}`), { method: 'PATCH', body: payload }),
  addModuleRecord: (archId, moduleName, payload) =>
    apiRequest(withScope(`/workspaces/${archId}/records/${moduleName}`), {
      method: 'POST',
      body: payload
    }),
  updateModuleRecord: (archId, moduleName, recordId, payload) =>
    apiRequest(withScope(`/workspaces/${archId}/records/${moduleName}/${recordId}`), {
      method: 'PATCH',
      body: payload
    }),
  deleteModuleRecord: (archId, moduleName, recordId) =>
    apiRequest(withScope(`/workspaces/${archId}/records/${moduleName}/${recordId}`), {
      method: 'DELETE'
    }),
  createTransaction: (payload) =>
    apiRequest(withScope('/transactions'), { method: 'POST', body: payload }),
  editTransaction: (txId, payload) =>
    apiRequest(withScope(`/transactions/${txId}`), { method: 'PATCH', body: payload }),
  deleteTransaction: (txId) =>
    apiRequest(withScope(`/transactions/${txId}`), { method: 'DELETE' }),
  saveAnalysis: (payload) =>
    apiRequest('/tools/analyses', { method: 'POST', body: payload }),
  getIntegrationsStatus: () => apiRequest('/integrations/status'),
  testGmailConnection: (payload) =>
    apiRequest('/integrations/gmail/test', { method: 'POST', body: payload }),
  sendReportEmail: (payload) =>
    apiRequest('/integrations/gmail/send-report', { method: 'POST', body: payload }),
  getGoogleDriveAuthUrl: () => apiRequest('/integrations/google-drive/auth-url'),
  exchangeGoogleDriveCode: (payload) =>
    apiRequest('/integrations/google-drive/oauth-callback', { method: 'POST', body: payload }),
  exportReportToGoogleDrive: (payload) =>
    apiRequest('/integrations/google-drive/export-report', { method: 'POST', body: payload }),
  disconnectGoogleDrive: () =>
    apiRequest('/integrations/google-drive/disconnect', { method: 'POST' }),
  disconnectGmail: () =>
    apiRequest('/integrations/gmail/disconnect', { method: 'POST' }),
  whatsappStatus: () => apiRequest(withScope('/whatsapp/status')),
  whatsappConnect: (payload = {}) =>
    apiRequest(withScope('/whatsapp/connect'), { method: 'POST', body: payload }),
  whatsappSimulate: (payload = {}) =>
    apiRequest(withScope('/whatsapp/simulate'), { method: 'POST', body: payload }),
  whatsappGetUnpaid: (archId) =>
    apiRequest(withScope(`/whatsapp/unpaid?archId=${encodeURIComponent(archId || 'buy-and-sell')}`)),
  whatsappSendReminders: (payload = {}) =>
    apiRequest(withScope('/whatsapp/reminders/send'), { method: 'POST', body: payload }),
  whatsappVerifyPayment: (payload = {}) =>
    apiRequest(withScope('/whatsapp/reminders/verify'), { method: 'POST', body: payload }),
  getBranches: () => apiRequest(withScope('/branches')),
  createBranch: (payload = {}) =>
    apiRequest(withScope('/branches'), { method: 'POST', body: payload }),
  deleteBranch: (branchId) =>
    apiRequest(withScope(`/branches/${branchId}`), { method: 'DELETE' }),
  getBranchAnalytics: (archId) =>
    apiRequest(withScope(`/branches/analytics?archId=${encodeURIComponent(archId || 'buy-and-sell')}`))
}

export const apiClient = exbosApi
export default exbosApi

