const API_BASE = '/api/v1'

function getAuthHeaders() {
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
    const response = await fetch(`${API_BASE}${endpoint}`, options)
    const data = await response.json().catch(() => null)
    return { ok: response.ok, status: response.status, data }
  } catch (err) {
    return { ok: false, status: 0, error: err.message }
  }
}

export const exbosApi = {
  health: () => apiRequest('/health'),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  updateProfile: (payload) => apiRequest('/auth/me', { method: 'PATCH', body: payload }),
  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (payload) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: payload }),
  patchWorkspace: (archId, payload) =>
    apiRequest(`/workspaces/${archId}`, { method: 'PATCH', body: payload }),
  addModuleRecord: (archId, moduleName, payload) =>
    apiRequest(`/workspaces/${archId}/records/${moduleName}`, {
      method: 'POST',
      body: payload
    }),
  updateModuleRecord: (archId, moduleName, recordId, payload) =>
    apiRequest(`/workspaces/${archId}/records/${moduleName}/${recordId}`, {
      method: 'PATCH',
      body: payload
    }),
  deleteModuleRecord: (archId, moduleName, recordId) =>
    apiRequest(`/workspaces/${archId}/records/${moduleName}/${recordId}`, {
      method: 'DELETE'
    }),
  createTransaction: (payload) =>
    apiRequest('/transactions', { method: 'POST', body: payload }),
  editTransaction: (txId, payload) =>
    apiRequest(`/transactions/${txId}`, { method: 'PATCH', body: payload }),
  saveAnalysis: (payload) =>
    apiRequest('/tools/analyses', { method: 'POST', body: payload })
}

