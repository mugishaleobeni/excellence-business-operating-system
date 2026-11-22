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
    } catch (firstErr) {
      if (typeof window !== 'undefined' && isLocalHost(window.location?.hostname || '')) {
        // Fallback to Vite proxy on localhost if direct port 5000 is unreachable
        response = await fetch(`/api/v1${endpoint}`, options)
      } else {
        // Retry once against production backend in case of transient connection reset
        await new Promise((r) => setTimeout(r, 600))
        response = await fetch(`${apiBase}${endpoint}`, options)
      }
    }
    const data = await response.json().catch(() => null)
    if (response.status >= 500 && !String(endpoint || '').includes('/health/report-error')) {
      import('./errorReporter')
        .then(({ reportSystemError }) =>
          reportSystemError({
            source: 'api-5xx',
            message: data?.error || data?.message || `HTTP ${response.status} on ${endpoint}`,
            statusCode: response.status,
            endpoint
          })
        )
        .catch(() => {})
    }
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
      const scopeEmail = parsed?.ownerScopeKey || parsed?.email
      if (scopeEmail) {
        return `?scopeKey=${encodeURIComponent(String(scopeEmail).toLowerCase())}`
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
  getIntegrationsStatus: () => apiRequest(withScope('/integrations/status')),
  testGmailConnection: (payload) =>
    apiRequest(withScope('/integrations/gmail/test'), { method: 'POST', body: payload }),
  sendReportEmail: (payload) =>
    apiRequest(withScope('/integrations/gmail/send-report'), { method: 'POST', body: payload }),
  getGoogleDriveAuthUrl: (redirectUri = '') => {
    const uri =
      redirectUri ||
      (typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '')
    const qs = uri ? `?redirectUri=${encodeURIComponent(uri)}` : ''
    return apiRequest(withScope(`/integrations/google-drive/auth-url${qs}`))
  },
  exchangeGoogleDriveCode: (payload) => {
    const uri =
      payload?.redirectUri ||
      (typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '')
    return apiRequest(withScope('/integrations/google-drive/oauth-callback'), {
      method: 'POST',
      body: { ...payload, redirectUri: uri }
    })
  },
  exportReportToGoogleDrive: (payload) =>
    apiRequest(withScope('/integrations/google-drive/export-report'), { method: 'POST', body: payload }),
  disconnectGoogleDrive: () =>
    apiRequest(withScope('/integrations/google-drive/disconnect'), { method: 'POST' }),
  disconnectGmail: () =>
    apiRequest(withScope('/integrations/gmail/disconnect'), { method: 'POST' }),
  getTeamMembers: () => apiRequest(withScope('/auth/team')),
  inviteTeamMember: (payload = {}) =>
    apiRequest(withScope('/auth/team/invite'), {
      method: 'POST',
      body: {
        ...payload,
        appOrigin: typeof window !== 'undefined' ? window.location.origin : 'https://exbos.pages.dev'
      }
    }),
  removeTeamMember: (email) =>
    apiRequest(withScope(`/auth/team/${encodeURIComponent(email)}`), { method: 'DELETE' }),
  getPublicDocument: (docId) =>
    apiRequest(`/workspaces/public-document/${encodeURIComponent(docId)}`),
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
  updateBranch: (branchId, payload = {}) =>
    apiRequest(withScope(`/branches/${branchId}`), { method: 'PATCH', body: payload }),
  deleteBranch: (branchId) =>
    apiRequest(withScope(`/branches/${branchId}`), { method: 'DELETE' }),
  assignBranchManager: (branchId, payload = {}) =>
    apiRequest(withScope(`/branches/${branchId}/assign-manager`), { method: 'POST', body: payload }),
  verifyOwnerBranchSwitch: (payload = {}) =>
    apiRequest(withScope('/branches/verify-owner-switch'), { method: 'POST', body: payload }),
  transferBranchStock: (branchId, payload = {}) =>
    apiRequest(withScope(`/branches/${encodeURIComponent(branchId)}/transfer-stock`), {
      method: 'POST',
      body: payload
    }),
  getBranchAnalytics: (archId) =>
    apiRequest(withScope(`/branches/analytics?archId=${encodeURIComponent(archId || 'buy-and-sell')}`)),
  superAdminGetAnalytics: () => apiRequest('/super-admin/analytics'),
  superAdminGetUsers: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.plan && params.plan !== 'all') qs.set('plan', params.plan)
    if (params.status && params.status !== 'all') qs.set('status', params.status)
    if (params.role && params.role !== 'all') qs.set('role', params.role)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return apiRequest(`/super-admin/users${suffix}`)
  },
  superAdminUpdateUserAccess: (email, payload = {}) =>
    apiRequest(`/super-admin/users/${encodeURIComponent(email)}/access`, {
      method: 'PATCH',
      body: payload
    }),
  superAdminUpdateUserSubscription: (email, payload = {}) =>
    apiRequest(`/super-admin/users/${encodeURIComponent(email)}/subscription`, {
      method: 'PATCH',
      body: payload
    }),
  superAdminGetAuditLogs: (limit = 100) =>
    apiRequest(`/super-admin/audit-logs?limit=${limit}`),
  superAdminUpdatePricingPlan: (planId, payload = {}) =>
    apiRequest(`/super-admin/pricing-plans/${encodeURIComponent(planId)}`, {
      method: 'PUT',
      body: payload
    }),
  superAdminUpdatePlatinumProgram: (payload = {}) =>
    apiRequest('/super-admin/platinum-program', {
      method: 'PUT',
      body: payload
    }),
  superAdminPublishBroadcast: (payload = {}) =>
    apiRequest('/super-admin/broadcast', {
      method: 'POST',
      body: payload
    }),
  superAdminGetSystemHealth: () => apiRequest('/super-admin/system-health'),
  superAdminRunDiagnostics: () =>
    apiRequest('/super-admin/system-health/run-diagnostics', { method: 'POST' }),
  superAdminResolveErrorReport: (reportId, status = 'resolved') =>
    apiRequest(`/super-admin/error-reports/${encodeURIComponent(reportId)}`, {
      method: 'PATCH',
      body: { status }
    }),
  superAdminClearResolvedErrors: () =>
    apiRequest('/super-admin/error-reports/clear-resolved', { method: 'DELETE' })
}

export const apiClient = exbosApi
export default exbosApi

