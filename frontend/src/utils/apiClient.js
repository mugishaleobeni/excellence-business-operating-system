function resolveApiBase() {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || '127.0.0.1'
    return `http://${host}:5000/api/v1`
  }
  return '/api/v1'
}

export function resolveStorageUrl(scopeParam = '') {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || '127.0.0.1'
    return `http://${host}:5000/api/storage${scopeParam}`
  }
  return `/api/storage${scopeParam}`
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
  saveAnalysis: (payload) =>
    apiRequest('/tools/analyses', { method: 'POST', body: payload })
}
