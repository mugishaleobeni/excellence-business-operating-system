import { reportSystemError } from './errorReporter'

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

export async function apiRequest(endpoint, { method = 'GET', body = null, timeoutMs = 12000 } = {}) {
  const fetchWithTimeout = async (url, options, ms) => {
    if (typeof AbortController === 'undefined' || !ms) {
      return fetch(url, options)
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

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
      response = await fetchWithTimeout(`${apiBase}${endpoint}`, options, timeoutMs)
    } catch (firstErr) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw firstErr
      }
      if (typeof window !== 'undefined' && isLocalHost(window.location?.hostname || '')) {
        // Fallback to Vite proxy on localhost if direct port 5000 is unreachable
        response = await fetchWithTimeout(`/api/v1${endpoint}`, options, timeoutMs)
      } else {
        // Retry once against production backend in case of transient connection reset
        await new Promise((r) => setTimeout(r, 500))
        response = await fetchWithTimeout(`${apiBase}${endpoint}`, options, timeoutMs)
      }
    }
    const data = await response.json().catch(() => null)
    if (response.status === 403 && typeof window !== 'undefined') {
      const code = data?.details?.code || data?.code || ''
      if (code === 'ACCOUNT_SUSPENDED' || code === 'ACCOUNT_DELETED') {
        window.dispatchEvent(
          new CustomEvent('exbos:account-suspended', {
            detail: {
              code,
              reason: data?.details?.reason || data?.error || 'Your account has been suspended by ExBOS Super Admin.'
            }
          })
        )
      }
    }
    if (response.status === 402 && typeof window !== 'undefined') {
      const detail =
        (data?.details && typeof data.details === 'object' ? data.details : null) || {
          code: 'PLAN_LIMIT_REACHED',
          message: data?.error || data?.message || 'Upgrade your ExBOS plan to unlock this feature.',
          requiredPlan: 'Silver'
        }
      window.dispatchEvent(new CustomEvent('exbos:plan-limit', { detail }))
    }
    if (response.status >= 500 && !String(endpoint || '').includes('/health/report-error')) {
      try {
        reportSystemError({
          source: 'api-5xx',
          message: data?.error || data?.message || `HTTP ${response.status} on ${endpoint}`,
          statusCode: response.status,
          endpoint
        })
      } catch {
        /* ignore reporting errors */
      }
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
  health: () => apiRequest('/health', { timeoutMs: 6000 }),
  sendVerification: (payload) =>
    apiRequest('/auth/send-verification', { method: 'POST', body: payload }),
  verifyEmail: (payload) =>
    apiRequest('/auth/verify-email', { method: 'POST', body: payload }),
  getVerificationStatus: (email) =>
    apiRequest(`/auth/verification-status?email=${encodeURIComponent(email || '')}`),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (payload) => apiRequest('/auth/me', { method: 'PATCH', body: payload }),
  forgotPassword: (email, channel = 'email', phone = '') =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: phone ? { email, channel, phone } : { email, channel }
    }),
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
  requestSubscriptionUpgrade: (payload = {}) =>
    apiRequest(withScope('/auth/subscription/request-upgrade'), {
      method: 'POST',
      body: payload
    }),
  getMySubscriptionRequests: () =>
    apiRequest(withScope('/auth/subscription/requests')),
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
  whatsappGetConfig: () => apiRequest(withScope('/whatsapp/config')),
  whatsappUpdateConfig: (payload = {}) =>
    apiRequest(withScope('/whatsapp/config'), { method: 'PATCH', body: payload }),
  whatsappAddRecipient: (payload = {}) =>
    apiRequest(withScope('/whatsapp/recipients'), { method: 'POST', body: payload }),
  whatsappRemoveRecipient: (phone) =>
    apiRequest(withScope(`/whatsapp/recipients/${encodeURIComponent(phone)}`), { method: 'DELETE' }),
  whatsappTestSend: (payload = {}) =>
    apiRequest(withScope('/whatsapp/test-send'), { method: 'POST', body: payload }),
  whatsappSendDailySummary: (payload = {}) =>
    apiRequest(withScope('/whatsapp/daily-summary'), { method: 'POST', body: payload }),
  getBranches: () => apiRequest(withScope('/branches')),
  createBranch: (payload = {}) =>
    apiRequest(withScope('/branches'), { method: 'POST', body: payload }),
  updateBranch: (branchId, payload = {}) =>
    apiRequest(withScope(`/branches/${branchId}`), { method: 'PATCH', body: payload }),
  deleteBranch: (branchId) =>
    apiRequest(withScope(`/branches/${branchId}`), { method: 'DELETE' }),
  assignBranchManager: (branchId, payload = {}) =>
    apiRequest(withScope(`/branches/${branchId}/assign-manager`), { method: 'POST', body: payload }),
  createBranchManagerInvite: (branchId, payload = {}) =>
    apiRequest(withScope(`/branches/${encodeURIComponent(branchId)}/manager-invite`), {
      method: 'POST',
      body: payload
    }),
  getBranchManagerInvite: (token) =>
    apiRequest(`/branches/invite/${encodeURIComponent(token)}`),
  completeBranchManagerInvite: (token, payload = {}) =>
    apiRequest(`/branches/invite/${encodeURIComponent(token)}/complete`, {
      method: 'POST',
      body: payload
    }),
  getBranchNotifications: () => apiRequest(withScope('/branches/notifications')),
  markBranchNotificationRead: (notifId) =>
    apiRequest(withScope(`/branches/notifications/${encodeURIComponent(notifId)}/read`), {
      method: 'PATCH'
    }),
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
    apiRequest('/super-admin/error-reports/clear-resolved', { method: 'DELETE' }),
  superAdminGetUpgradeRequests: (status = 'all') =>
    apiRequest(`/super-admin/upgrade-requests?status=${encodeURIComponent(status)}`),
  superAdminReviewUpgradeRequest: (reqId, payload = {}) =>
    apiRequest(`/super-admin/upgrade-requests/${encodeURIComponent(reqId)}/review`, {
      method: 'POST',
      body: payload
    }),
  superAdminRevokePayment: (email, payload = {}) =>
    apiRequest(`/super-admin/users/${encodeURIComponent(email)}/revoke-payment`, {
      method: 'POST',
      body: payload
    }),
  superAdminDeleteUser: (email, payload = {}) =>
    apiRequest(`/super-admin/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      body: payload
    }),
  superAdminGetPricingPlans: () => apiRequest('/super-admin/pricing-plans'),
  superAdminGetPlanLimits: () => apiRequest('/super-admin/plan-limits'),
  superAdminUpdatePlanLimits: (planKey, payload = {}) =>
    apiRequest(`/super-admin/plan-limits/${encodeURIComponent(planKey)}`, {
      method: 'PUT',
      body: payload
    }),
  superAdminResetPlanLimits: () =>
    apiRequest('/super-admin/plan-limits/reset', { method: 'POST' }),
  getTaxProfile: () => apiRequest(withScope('/tax/profile')),
  updateTaxProfile: (payload = {}) =>
    apiRequest(withScope('/tax/profile'), { method: 'PUT', body: payload }),
  getTaxSummary: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.startDate) qs.set('startDate', params.startDate)
    if (params.endDate) qs.set('endDate', params.endDate)
    if (params.branchId && params.branchId !== 'all') qs.set('branchId', params.branchId)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return apiRequest(withScope(`/tax/summary${suffix}`))
  },
  downloadTaxExport: async (exportType, params = {}) => {
    const qs = new URLSearchParams()
    if (params.startDate) qs.set('startDate', params.startDate)
    if (params.endDate) qs.set('endDate', params.endDate)
    if (params.branchId && params.branchId !== 'all') qs.set('branchId', params.branchId)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    const path = withScope(`/tax/export/${encodeURIComponent(exportType)}${suffix}`)
    const authHeaders = getAuthHeaders()
    const headers = authHeaders.Authorization ? { Authorization: authHeaders.Authorization } : {}
    const res = await fetch(`${resolveApiBase()}${path}`, {
      method: 'GET',
      headers
    })
    if (!res.ok) {
      let data = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }
      const err = new Error(data?.error || `Export failed (${res.status})`)
      err.status = res.status
      err.details = data?.details
      if (res.status === 402 && typeof window !== 'undefined') {
        const denial = Array.isArray(data?.details) && data.details[0] ? data.details[0] : data
        window.dispatchEvent(
          new CustomEvent('exbos:plan-limit', {
            detail: {
              feature: denial?.feature || 'allowRraTaxPack',
              currentPlan: denial?.currentPlan || 'Free',
              requiredPlan: denial?.requiredPlan || 'Bronze',
              message: err.message
            }
          })
        )
      }
      throw err
    }
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rra-${exportType}-${params.startDate || 'period'}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    return { ok: true }
  },
  sendTaxPackToAccountant: (payload = {}) =>
    apiRequest(withScope('/tax/send-to-accountant'), { method: 'POST', body: payload }),

  // Staff Training & Academy (Free-to-Paid Engine)
  getTrainingCatalog: () => apiRequest('/training/catalog'),
  getTrainingCourses: (archId = '') =>
    apiRequest(`/training/courses${archId ? `?archId=${encodeURIComponent(archId)}` : ''}`),
  updateTrainingProgress: (payload = {}) =>
    apiRequest('/training/progress', { method: 'POST', body: payload }),
  getMyTrainingBookings: () => apiRequest('/training/bookings'),
  createTrainingBooking: (payload = {}) =>
    apiRequest('/training/bookings', { method: 'POST', body: payload }),
  superAdminGetTrainingOverview: () => apiRequest('/training/admin/overview'),
  superAdminUpdateTrainingConfig: (payload = {}) =>
    apiRequest('/training/admin/config', { method: 'PUT', body: payload }),
  superAdminUpdateTrainingBooking: (bookingId, payload = {}) =>
    apiRequest(`/training/admin/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'PUT',
      body: payload
    }),
  superAdminUpsertTrainingCourse: (payload = {}) =>
    apiRequest('/training/admin/courses', { method: 'POST', body: payload }),
  superAdminDeleteTrainingCourse: (courseId) =>
    apiRequest(`/training/admin/courses/${encodeURIComponent(courseId)}`, {
      method: 'DELETE'
    }),

  // Bulk CSV Product Import, Cashier Shifts (Z-Report) & Daily WhatsApp Digest
  bulkImportProducts: (archId, payload = {}) =>
    apiRequest(withScope(`/workspaces/${encodeURIComponent(archId || 'buy-and-sell')}/records/Inventory/bulk`), {
      method: 'POST',
      body: payload
    }),
  getShifts: (branchId = '') =>
    apiRequest(`/shifts${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''}`),
  openShift: (payload = {}) =>
    apiRequest('/shifts/open', { method: 'POST', body: payload }),
  closeShift: (shiftId, payload = {}) =>
    apiRequest(`/shifts/${encodeURIComponent(shiftId)}/close`, { method: 'POST', body: payload }),
  getDigestSettings: () => apiRequest('/shifts/digest/settings'),
  updateDigestSettings: (payload = {}) =>
    apiRequest('/shifts/digest/settings', { method: 'PUT', body: payload }),
  sendDigestNow: (payload = {}) =>
    apiRequest('/shifts/digest/send-now', { method: 'POST', body: payload })
}

export const apiClient = exbosApi
export default exbosApi

