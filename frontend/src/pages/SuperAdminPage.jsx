import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import { formatRWF } from '../utils/currencyWords'
import MoneyInput from '../components/common/MoneyInput'
import { apiClient } from '../utils/apiClient'
import { buildDisplayPlansFromLimits } from '../utils/planEntitlements'
import {
  ShieldCheck,
  Crown,
  Users,
  Gift,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Search,
  Ban,
  Unlock,
  ShieldAlert,
  RefreshCw,
  ScrollText,
  CreditCard,
  MailCheck,
  Trash2,
  Trophy,
  Activity,
  BarChart3,
  Building2,
  Layers,
  Clock,
  Sparkles,
  ArrowUpRight,
  Flame,
  HeartPulse,
  Play,
  Bug,
  CheckCheck,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react'

const ARCH_LABELS = {
  'buy-and-sell': { label: 'Buy & Sell', color: 'from-sky-500 to-blue-600' },
  'make-and-sell': { label: 'Make & Sell', color: 'from-amber-400 to-orange-500' },
  services: { label: 'Services', color: 'from-violet-500 to-purple-600' },
  agriculture: { label: 'Agriculture & Livestock', color: 'from-emerald-400 to-teal-600' },
  'food-and-hospitality': { label: 'Food & Hospitality', color: 'from-rose-400 to-pink-600' },
  hybrid: { label: 'Hybrid Multi-Activity', color: 'from-cyan-400 to-indigo-600' }
}

const PLAN_COLORS = {
  Free: 'from-slate-400 to-slate-500',
  Bronze: 'from-amber-600 to-orange-500',
  Silver: 'from-sky-400 to-blue-500',
  Gold: 'from-yellow-400 to-amber-500'
}

export default function SuperAdminPage() {
  const {
    user: currentUser,
    language,
    pricingPlans,
    setPricingPlans,
    platinumProgram,
    setPlatinumProgram,
    superAdminBroadcast,
    setSuperAdminBroadcast
  } = useExbos()

  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [savedToast, setSavedToast] = useState(null)
  const [errorToast, setErrorToast] = useState(null)

  // Executive Analytics (Top Working Users + Breakdowns)
  const [analytics, setAnalytics] = useState({
    summary: {
      totalUsers: 0,
      totalBusinesses: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      paidMrrRWF: 0,
      complimentaryCount: 0,
      totalRecords: 0,
      totalTransactions: 0,
      activeLast7Days: 0
    },
    topWorkingUsers: [],
    architectureBreakdown: {},
    planBreakdown: {},
    recentSignups: []
  })
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  // Real MongoDB Users + Platform KPIs
  const [platformUsers, setPlatformUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole] = useState('all')

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // System Health, Quick Diagnostics & Auto-Reported Errors
  const [systemHealth, setSystemHealth] = useState(null)
  const [loadingHealth, setLoadingHealth] = useState(false)
  const [diagResults, setDiagResults] = useState(null)
  const [runningDiag, setRunningDiag] = useState(false)

  // Customer Payment Upgrade Requests
  const [upgradeRequests, setUpgradeRequests] = useState([])
  const [pendingUpgradesCount, setPendingUpgradesCount] = useState(0)

  // Live Editable Plan Limits & Feature Matrix (Free, Bronze, Silver, Gold, Platinum)
  const [planLimitsMap, setPlanLimitsMap] = useState(null)
  const [editingTierKey, setEditingTierKey] = useState('free')
  const [savingLimits, setSavingLimits] = useState(false)

  // Subscription / Complimentary Access Form
  const [selectedUserEmail, setSelectedUserEmail] = useState('')
  const [grantPlan, setGrantPlan] = useState('Gold')
  const [grantBillingType, setGrantBillingType] = useState('Complimentary')
  const [grantExpiry, setGrantExpiry] = useState('2027-12-31')
  const [grantReason, setGrantReason] = useState('Strategic SME Partner Complimentary Grant')
  const [notifyUserOnSub, setNotifyUserOnSub] = useState(true)
  const [submittingSub, setSubmittingSub] = useState(false)

  // Broadcast Editor State
  const [broadcastTitle, setBroadcastTitle] = useState(
    superAdminBroadcast?.title || 'Scheduled System Upgrade Notice'
  )
  const [broadcastMsg, setBroadcastMsg] = useState(
    superAdminBroadcast?.message ||
      'ExBOS will perform a brief maintenance window tonight from 01:00 to 01:30 CAT.'
  )
  const [savingBroadcast, setSavingBroadcast] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const isBusy = (key) => busyAction === key

  const showNotice = (msg) => {
    setErrorToast(null)
    setSavedToast(msg)
    setTimeout(() => setSavedToast(null), 4500)
  }

  const showError = (msg) => {
    setSavedToast(null)
    setErrorToast(msg)
    setTimeout(() => setErrorToast(null), 5000)
  }

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true)
    const res = await apiClient.superAdminGetAnalytics()
    if (res.ok && res.data?.data) {
      setAnalytics(res.data.data)
    }
    setLoadingAnalytics(false)
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    const res = await apiClient.superAdminGetUsers({
      search: searchQuery.trim(),
      plan: filterPlan,
      status: filterStatus,
      role: filterRole
    })
    if (res.ok) {
      const list = Array.isArray(res.data?.data) ? res.data.data : []
      setPlatformUsers(list)
      if (!selectedUserEmail && list.length > 0) {
        const firstOwner = list.find((u) => u.isOwner) || list[0]
        setSelectedUserEmail(firstOwner.email)
      }
    } else {
      showError(res.error || 'Could not load platform users from MongoDB.')
    }
    setLoadingUsers(false)
  }, [searchQuery, filterPlan, filterStatus, filterRole, selectedUserEmail])

  const fetchAuditLogs = useCallback(async () => {
    setLoadingLogs(true)
    const res = await apiClient.superAdminGetAuditLogs(100)
    if (res.ok && Array.isArray(res.data?.data)) {
      setAuditLogs(res.data.data)
    }
    setLoadingLogs(false)
  }, [])

  const fetchSystemHealth = useCallback(async () => {
    setLoadingHealth(true)
    const res = await apiClient.superAdminGetSystemHealth()
    if (res.ok && res.data?.data) {
      setSystemHealth(res.data.data)
    }
    setLoadingHealth(false)
  }, [])

  const fetchUpgradeRequests = useCallback(async () => {
    const res = await apiClient.superAdminGetUpgradeRequests('all')
    if (res.ok) {
      setUpgradeRequests(Array.isArray(res.data?.data) ? res.data.data : [])
      setPendingUpgradesCount(Number(res.data?.meta?.pendingCount || 0))
    }
  }, [])

  const fetchPlanLimits = useCallback(async () => {
    const res = await apiClient.superAdminGetPlanLimits()
    if (res.ok && res.data?.data) {
      setPlanLimitsMap(res.data.data)
    }
  }, [])

  const updateEditingTierField = (field, value) => {
    setPlanLimitsMap((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [editingTierKey]: {
          ...(prev[editingTierKey] || {}),
          [field]: value
        }
      }
    })
  }

  const handleSaveTierLimits = async () => {
    if (!planLimitsMap?.[editingTierKey]) return
    setSavingLimits(true)
    const res = await apiClient.superAdminUpdatePlanLimits(
      editingTierKey,
      planLimitsMap[editingTierKey]
    )
    setSavingLimits(false)
    if (!res.ok) {
      showError(res.error || 'Could not save plan limits.')
      return
    }
    if (res.data?.allPlanLimits) {
      setPlanLimitsMap(res.data.allPlanLimits)
      setPricingPlans(buildDisplayPlansFromLimits(res.data.allPlanLimits, pricingPlans))
    }
    showNotice(res.data?.message || `Saved live feature matrix for ${editingTierKey}.`)
    fetchAuditLogs()
  }

  const handleResetAllPlanLimits = async () => {
    setSavingLimits(true)
    const res = await apiClient.superAdminResetPlanLimits()
    setSavingLimits(false)
    if (!res.ok) {
      showError(res.error || 'Could not reset plan limits.')
      return
    }
    if (res.data?.data) {
      setPlanLimitsMap(res.data.data)
    }
    showNotice('All plan limits & feature switches reset to factory defaults.')
    fetchAuditLogs()
  }

  const handleReviewUpgrade = async (reqId, action) => {
    const res = await apiClient.superAdminReviewUpgradeRequest(reqId, {
      action,
      durationDays: 30
    })
    if (!res.ok) {
      showError(res.error || 'Could not review upgrade request.')
      return
    }
    showNotice(res.data?.message || `Upgrade request ${action}d.`)
    refreshAll()
  }

  const handleRunDiagnostics = async () => {
    setRunningDiag(true)
    const res = await apiClient.superAdminRunDiagnostics()
    setRunningDiag(false)
    if (!res.ok) {
      showError(res.error || 'Could not run quick system diagnostics.')
      return
    }
    setDiagResults(res.data?.data || null)
    showNotice(res.data?.message || 'Quick system diagnostics completed.')
    fetchSystemHealth()
    fetchAuditLogs()
  }

  const handleResolveError = async (reportId, nextStatus = 'resolved') => {
    const res = await apiClient.superAdminResolveErrorReport(reportId, nextStatus)
    if (!res.ok) {
      showError(res.error || 'Could not update error report status.')
      return
    }
    showNotice(res.data?.message || `Error ${reportId} marked ${nextStatus}.`)
    fetchSystemHealth()
  }

  const handleClearResolvedErrors = async () => {
    const res = await apiClient.superAdminClearResolvedErrors()
    if (!res.ok) {
      showError(res.error || 'Could not clear resolved errors.')
      return
    }
    showNotice(res.data?.message || 'Cleared resolved error reports.')
    fetchSystemHealth()
  }

  const refreshAll = useCallback(() => {
    fetchAnalytics()
    fetchUsers()
    fetchAuditLogs()
    fetchSystemHealth()
    fetchUpgradeRequests()
    fetchPlanLimits()
  }, [fetchAnalytics, fetchUsers, fetchAuditLogs, fetchSystemHealth, fetchUpgradeRequests, fetchPlanLimits])

  useEffect(() => {
    fetchAnalytics()
    fetchAuditLogs()
    fetchSystemHealth()
    fetchUpgradeRequests()
    fetchPlanLimits()
  }, [fetchAnalytics, fetchAuditLogs, fetchSystemHealth, fetchUpgradeRequests, fetchPlanLimits])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const ownerAccounts = useMemo(
    () => platformUsers.filter((u) => u.isOwner),
    [platformUsers]
  )

  const maxActivityScore = useMemo(() => {
    const scores = (analytics.topWorkingUsers || []).map((u) => Number(u.activityScore || 0))
    return Math.max(1, ...scores)
  }, [analytics.topWorkingUsers])

  const handleToggleSuspend = async (target) => {
    const key = `suspend:${target.email}`
    if (busyAction === key) return
    const nextStatus = target.accountStatus === 'Suspended' ? 'Active' : 'Suspended'
    const reason =
      nextStatus === 'Suspended'
        ? window.prompt(
            `Enter reason for suspending ${target.email}:`,
            'Non-payment / Policy review'
          )
        : 'Account reactivated by Super Admin'
    if (nextStatus === 'Suspended' && !reason) return

    setBusyAction(key)
    try {
      const res = await apiClient.superAdminUpdateUserAccess(target.email, {
        accountStatus: nextStatus,
        reason
      })
      if (!res.ok) {
        showError(res.error || 'Failed to update account status.')
        return
      }
      showNotice(res.data?.message || `${target.email} is now ${nextStatus}.`)
      refreshAll()
    } finally {
      setBusyAction('')
    }
  }

  const handleToggleSuperAdmin = async (target) => {
    const key = `admin:${target.email}`
    if (busyAction === key) return
    const nextSuper = !target.isSuperAdmin
    setBusyAction(key)
    try {
      const res = await apiClient.superAdminUpdateUserAccess(target.email, {
        isSuperAdmin: nextSuper,
        reason: nextSuper ? 'Promoted to Platform Super Admin' : 'Revoked Platform Super Admin'
      })
      if (!res.ok) {
        showError(res.error || 'Failed to update Super Admin role.')
        return
      }
      showNotice(res.data?.message || `Updated Super Admin role for ${target.email}.`)
      refreshAll()
    } finally {
      setBusyAction('')
    }
  }

  const handleVerifyEmail = async (target) => {
    const key = `verify:${target.email}`
    if (busyAction === key) return
    setBusyAction(key)
    try {
      const res = await apiClient.superAdminUpdateUserAccess(target.email, {
        emailVerified: true,
        reason: 'Manually verified by Super Admin'
      })
      if (!res.ok) {
        showError(res.error || 'Could not verify email.')
        return
      }
      showNotice(`Email verified for ${target.email}.`)
      refreshAll()
    } finally {
      setBusyAction('')
    }
  }

  const handleQuickRenew30Days = async (targetUser) => {
    const key = `renew:${targetUser.email}`
    if (busyAction === key) return
    const baseDate =
      targetUser.subscriptionExpiry && new Date(targetUser.subscriptionExpiry) > new Date()
        ? new Date(targetUser.subscriptionExpiry)
        : new Date()
    const nextExpiry = new Date(baseDate.getTime() + 30 * 86400000).toISOString().slice(0, 10)
    const targetPlan =
      targetUser.plan && String(targetUser.plan).toLowerCase() !== 'free'
        ? targetUser.plan
        : 'Bronze'
    setBusyAction(key)
    try {
      const res = await apiClient.superAdminUpdateUserSubscription(targetUser.email, {
        plan: targetPlan,
        billingType: 'Paid',
        subscriptionExpiry: nextExpiry,
        reason: `Renewed ${targetPlan} plan (+30 days until ${nextExpiry})`,
        notifyUser: true
      })
      if (!res.ok) {
        showError(res.error || 'Failed to renew subscription.')
        return
      }
      showNotice(`Renewed ${targetUser.email} (${targetPlan}) until ${nextExpiry}.`)
      refreshAll()
    } finally {
      setBusyAction('')
    }
  }

  const handleRevokePayment = async (targetUser, reqId = '') => {
    const key = `revoke:${targetUser.email}`
    if (busyAction === key) return
    const reason = window.prompt(
      `Revoke paid subscription for ${targetUser.email} due to corrupt/invalid payment?\nEnter reason:`,
      'Corrupt or unverified payment proof'
    )
    if (!reason) return
    const suspendAlso = window.confirm(
      `Also suspend ${targetUser.email}'s account immediately while revoking payment?`
    )
    setBusyAction(key)
    try {
      const res = await apiClient.superAdminRevokePayment(targetUser.email, {
        reason,
        suspendAccount: suspendAlso,
        requestId: reqId
      })
      if (!res.ok) {
        showError(res.error || 'Could not revoke payment.')
        return
      }
      showNotice(res.data?.message || `Payment revoked for ${targetUser.email}.`)
      refreshAll()
    } finally {
      setBusyAction('')
    }
  }

  const handleDeleteUser = async (targetUser) => {
    const key = `delete:${targetUser.email}`
    if (busyAction === key) return
    const confirmed = window.confirm(
      `PERMANENTLY DELETE ${targetUser.email} (${targetUser.businessName}) and all their workspaces, staff, and records from MongoDB Atlas?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return
    const reason = window.prompt(
      `Enter audit reason for deleting ${targetUser.email}:`,
      'Account removed by Super Admin'
    )
    if (reason === null) return
    setBusyAction(key)
    try {
      const res = await apiClient.superAdminDeleteUser(targetUser.email, {
        reason: reason || 'Account removed by Super Admin'
      })
      if (!res.ok) {
        showError(res.error || 'Failed to delete user.')
        return
      }
      showNotice(res.data?.message || `Deleted user ${targetUser.email}.`)
      refreshAll()
    } finally {
      setBusyAction('')
    }
  }

  const handleApplySubscriptionChange = async (e) => {
    e.preventDefault()
    if (!selectedUserEmail) {
      showError('Please select a user/business account first.')
      return
    }
    if (!grantReason.trim()) {
      showError('A mandatory audit reason is required.')
      return
    }
    setSubmittingSub(true)
    const res = await apiClient.superAdminUpdateUserSubscription(selectedUserEmail, {
      plan: grantPlan,
      billingType: grantBillingType,
      subscriptionExpiry: grantExpiry,
      reason: grantReason.trim(),
      notifyUser: notifyUserOnSub
    })
    setSubmittingSub(false)

    if (!res.ok) {
      showError(res.error || 'Failed to update subscription.')
      return
    }
    showNotice(
      res.data?.message ||
        `Updated ${selectedUserEmail} to ${grantPlan} (${grantBillingType}) and recorded audit log.`
    )
    refreshAll()
  }

  const handleSavePricingPlan = async (plan) => {
    const res = await apiClient.superAdminUpdatePricingPlan(plan.id, {
      name: plan.name,
      tier: plan.tier,
      monthlyPriceRWF: Number(plan.priceRWF || 0),
      priceRWF: Number(plan.priceRWF || 0),
      description: plan.description
    })
    if (!res.ok) {
      showError(res.error || `Could not save pricing for ${plan.name}.`)
      return
    }
    showNotice(`Saved ${plan.name} (${formatRWF(plan.priceRWF)}) live to MongoDB.`)
    fetchAuditLogs()
  }

  const handleSavePlatinum = async () => {
    const res = await apiClient.superAdminUpdatePlatinumProgram(platinumProgram)
    if (!res.ok) {
      showError(res.error || 'Could not save Platinum program settings.')
      return
    }
    showNotice('Platinum referral program rules saved live to MongoDB.')
    fetchAuditLogs()
  }

  const handlePublishBroadcast = async (e) => {
    e.preventDefault()
    setSavingBroadcast(true)
    const res = await apiClient.superAdminPublishBroadcast({
      title: broadcastTitle.trim(),
      message: broadcastMsg.trim(),
      type: 'info',
      targetArchitecture: 'all',
      active: true
    })
    setSavingBroadcast(false)
    if (!res.ok) {
      showError(res.error || 'Failed to publish broadcast.')
      return
    }
    setSuperAdminBroadcast(
      res.data?.data || { title: broadcastTitle, message: broadcastMsg, active: true }
    )
    showNotice('Broadcast published live to MongoDB! Every business will see it on login.')
    fetchAuditLogs()
  }

  const handleClearBroadcast = async () => {
    setSavingBroadcast(true)
    const res = await apiClient.superAdminPublishBroadcast({
      title: 'Cleared',
      message: 'Cleared',
      active: false
    })
    setSavingBroadcast(false)
    if (!res.ok) {
      showError(res.error || 'Failed to clear broadcast.')
      return
    }
    setSuperAdminBroadcast(null)
    showNotice('Global broadcast cleared.')
    fetchAuditLogs()
  }

  const summary = analytics.summary || {}
  const topUsers = analytics.topWorkingUsers || []
  const archBreakdown = analytics.architectureBreakdown || {}
  const planBreakdown = analytics.planBreakdown || {}
  const recentSignups = analytics.recentSignups || []

  const totalArchBusinesses = Math.max(
    1,
    Object.values(archBreakdown).reduce((a, b) => a + Number(b || 0), 0)
  )

  const navGroups = [
    {
      title: 'Command Center',
      items: [
        { id: 'overview', label: 'Executive Overview', shortLabel: 'Overview', icon: Trophy },
        {
          id: 'health',
          label: 'System Health & Errors',
          shortLabel: 'Health',
          icon: HeartPulse,
          badge: systemHealth?.errorSummary?.openCount || 0,
          badgeTone: 'rose'
        }
      ]
    },
    {
      title: 'Accounts & Revenue',
      items: [
        {
          id: 'users',
          label: 'Users & Access',
          shortLabel: 'Users',
          icon: Users,
          count: summary.totalUsers || 0
        },
        {
          id: 'subscriptions',
          label: 'Subscriptions & Grants',
          shortLabel: 'Billing',
          icon: CreditCard,
          badge: pendingUpgradesCount,
          badgeTone: 'amber'
        },
        { id: 'pricing', label: 'Pricing & Platinum', shortLabel: 'Pricing', icon: Crown }
      ]
    },
    {
      title: 'Governance',
      items: [
        { id: 'broadcast', label: 'Broadcasts', shortLabel: 'Broadcast', icon: Megaphone },
        { id: 'audit', label: 'Audit Trail', shortLabel: 'Audit', icon: ScrollText }
      ]
    }
  ]

  const allNavItems = navGroups.flatMap((g) => g.items)
  const activeNavMeta = allNavItems.find((item) => item.id === activeTab) || allNavItems[0]

  const handleSelectNav = (tabId) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex bg-[#03091F] text-white">
      {/* ==================== DESKTOP SIDEBAR MENU ==================== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen bg-[#050D2B] border-r border-white/10 transition-all duration-200 z-30 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand & Collapse Toggle */}
        <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 no-underline">
            <img
              src="/logo/exboslogo.png"
              alt="ExBOS Logo"
              className="w-9 h-9 rounded-xl border border-[#9EDCFF]/40 bg-[#03091F] object-contain shrink-0"
            />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-orbitron text-xs font-black tracking-wider text-white truncate">
                  EXBOS ADMIN
                </div>
                <div className="text-[10px] font-semibold text-[#9EDCFF] uppercase tracking-widest truncate">
                  Super Command
                </div>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? 'Expand Menu' : 'Collapse Menu'}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer transition shrink-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-orbitron font-bold uppercase tracking-widest text-slate-400">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const active = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                    } py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      active
                        ? 'bg-gradient-to-r from-[#218DFF] to-[#1045CA] text-white shadow-[0_6px_18px_rgba(33,141,255,0.4)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!sidebarCollapsed && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                          item.badgeTone === 'amber'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {!sidebarCollapsed && !item.badge && item.count > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">{item.count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="p-3 border-t border-white/10 space-y-2 bg-[#040A24]">
          <Link
            to="/dashboard"
            title="Manage My Business"
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
            } py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-orbitron font-extrabold no-underline shadow transition`}
          >
            <span className="flex items-center gap-2 truncate">
              <Building2 className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>My Business</span>}
            </span>
            {!sidebarCollapsed && <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />}
          </Link>

          <Link
            to="/"
            title="Public Home"
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center px-2' : 'gap-2 px-3'
            } py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white no-underline transition`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>ExBOS Home</span>}
          </Link>

          {!sidebarCollapsed && (
            <div className="px-2 pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate font-mono">{currentUser?.email}</span>
              <span className="inline-flex items-center gap-1 text-emerald-300 shrink-0 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* ==================== MOBILE SLIDE-OUT MENU DRAWER ==================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full bg-[#050D2B] border-r border-white/15 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo/exboslogo.png"
                  alt="ExBOS Logo"
                  className="w-8 h-8 rounded-lg border border-[#9EDCFF]/40 bg-[#03091F] object-contain"
                />
                <div>
                  <div className="font-orbitron text-xs font-black text-white">EXBOS ADMIN</div>
                  <div className="text-[10px] font-semibold text-[#9EDCFF] uppercase tracking-wider">
                    Super Admin Menu
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-white/10 text-slate-200 hover:text-white cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-orbitron font-bold uppercase tracking-widest text-slate-400">
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = activeTab === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectNav(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                          active
                            ? 'bg-gradient-to-r from-[#218DFF] to-[#1045CA] text-white shadow'
                            : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </span>
                        {item.badge > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                              item.badgeTone === 'amber'
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-rose-500 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-white/10 space-y-2 bg-[#040A24]">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-orbitron font-extrabold no-underline"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Manage My Business</span>
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 no-underline"
              >
                <Home className="w-3.5 h-3.5" />
                <span>ExBOS Home</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MAIN CONTENT COLUMN ==================== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Command Header (Sticky on Desktop & Mobile) */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 bg-[#050D2B]/90 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white cursor-pointer shrink-0"
              aria-label="Open Super Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-[10px] font-orbitron uppercase tracking-widest text-[#9EDCFF] truncate">
                Super Admin Console
              </div>
              <div className="font-orbitron text-sm sm:text-base font-extrabold text-white truncate">
                {activeNavMeta.label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[11px] font-semibold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>MongoDB Live</span>
            </span>
            <button
              type="button"
              onClick={refreshAll}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-[#9EDCFF] hover:text-white inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingAnalytics || loadingUsers ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh Live</span>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-16 space-y-6">
          {/* Executive Super Admin Hero Command Bar */}
          <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#071544] via-[#0A2786] to-[#040D29] border border-[#9EDCFF]/35 shadow-[0_24px_70px_rgba(0,0,0,0.65),0_0_40px_rgba(33,141,255,0.2)]">
            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#218DFF]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-[11px] font-orbitron font-bold text-amber-200 tracking-wider">
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>EXBOS SUPER ADMIN COMMAND</span>
                  </span>
                  <span className="text-xs text-[#9EDCFF]/80 font-mono">
                    {currentUser?.email}
                  </span>
                </div>

                <h1 className="font-orbitron text-xl sm:text-3xl font-black tracking-tight text-white">
                  Platform Intelligence &amp; Control Center
                </h1>
                <p className="text-xs sm:text-sm text-slate-200/90 max-w-2xl">
                  Monitor top-performing businesses in real time, control user access &amp; subscriptions with strict MRR isolation, broadcast notices, and audit every administrative action.
                </p>
              </div>
            </div>

            {/* 6 Live Executive KPI Cards */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/15">
            <div className="p-3.5 rounded-2xl bg-[#03091F]/70 border border-white/10">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/80">Total Users</div>
              <div className="font-orbitron text-2xl font-black text-white mt-1">
                {summary.totalUsers ?? 0}
              </div>
              <div className="text-[10px] text-emerald-300 mt-0.5">
                {summary.activeUsers ?? 0} active
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#03091F]/70 border border-white/10">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/80">Businesses</div>
              <div className="font-orbitron text-2xl font-black text-white mt-1">
                {summary.totalBusinesses ?? 0}
              </div>
              <div className="text-[10px] text-sky-300 mt-0.5">
                {summary.activeLast7Days ?? 0} active 7d
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#03091F]/70 border border-emerald-400/25">
              <div className="text-[10px] font-orbitron uppercase text-emerald-300">Verified Paid MRR</div>
              <div className="font-orbitron text-lg font-black text-emerald-400 mt-1.5 truncate">
                {formatRWF(summary.paidMrrRWF ?? 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">0% inflated</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#03091F]/70 border border-purple-400/25">
              <div className="text-[10px] font-orbitron uppercase text-purple-300">Complimentary</div>
              <div className="font-orbitron text-2xl font-black text-purple-200 mt-1">
                {summary.complimentaryCount ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">0 RWF grants</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#03091F]/70 border border-[#218DFF]/30">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]">Live Records</div>
              <div className="font-orbitron text-2xl font-black text-white mt-1">
                {(summary.totalRecords ?? 0) + (summary.totalTransactions ?? 0)}
              </div>
              <div className="text-[10px] text-[#9EDCFF]/80 mt-0.5">
                {summary.totalTransactions ?? 0} ledger tx
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#03091F]/70 border border-rose-400/25">
              <div className="text-[10px] font-orbitron uppercase text-rose-300">Suspended</div>
              <div className="font-orbitron text-2xl font-black text-rose-400 mt-1">
                {summary.suspendedUsers ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Locked accounts</div>
            </div>
          </div>
        </div>

        {/* Toast Banners */}
        {savedToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-xs sm:text-sm font-semibold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}
        {errorToast && (
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-xs sm:text-sm font-semibold text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorToast}</span>
          </div>
        )}

        {/* TAB 0: EXECUTIVE OVERVIEW & TOP WORKING USERS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top 3 Podium Cards */}
            {topUsers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topUsers.slice(0, 3).map((u, idx) => {
                  const medalStyles = [
                    'from-amber-400/20 via-[#071544] to-[#040D29] border-amber-400/50',
                    'from-slate-300/15 via-[#071544] to-[#040D29] border-slate-300/40',
                    'from-orange-500/15 via-[#071544] to-[#040D29] border-orange-400/40'
                  ][idx]
                  const badgeColors = [
                    'bg-amber-400 text-slate-950',
                    'bg-slate-200 text-slate-950',
                    'bg-orange-400 text-slate-950'
                  ][idx]
                  return (
                    <div
                      key={u.email}
                      className={`rounded-3xl p-5 bg-gradient-to-br ${medalStyles} border shadow-xl flex flex-col justify-between gap-4`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-orbitron font-black ${badgeColors}`}
                            >
                              #{idx + 1} TOP PERFORMER
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-[#9EDCFF] font-semibold">
                              {u.plan}
                            </span>
                          </div>
                          <h3 className="font-orbitron font-extrabold text-base text-white truncate">
                            {u.businessName}
                          </h3>
                          <p className="text-xs text-slate-300 truncate">
                            {u.fullName} · {u.email}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                          <Flame className="w-5 h-5 text-amber-300" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center bg-black/25 rounded-2xl p-3 border border-white/10">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Records</div>
                          <div className="font-orbitron text-sm font-black text-white">
                            {u.recordCount}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Ledger Tx</div>
                          <div className="font-orbitron text-sm font-black text-emerald-300">
                            {u.txCount}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Score</div>
                          <div className="font-orbitron text-sm font-black text-[#9EDCFF]">
                            {u.activityScore}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-300">
                          {ARCH_LABELS[u.architectureId]?.label || u.architectureId}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserEmail(u.email)
                            setGrantPlan(u.plan || 'Silver')
                            setGrantBillingType(u.billingType || 'Complimentary')
                            setActiveTab('subscriptions')
                          }}
                          className="text-[#9EDCFF] hover:text-white font-bold inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                        >
                          <span>Manage Plan</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Main 12-Col Grid: Full Leaderboard + Architecture & Plan Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 8 cols: Top Working Users & Businesses Table */}
              <div className="lg:col-span-8 rounded-3xl p-6 bg-[#071544]/75 border border-white/12 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-orbitron text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span>Top Working Users &amp; Most Active Businesses</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ranked live from MongoDB by operational records, transactions, branches, staff, and recent logins.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-bold text-[#9EDCFF] hover:text-white cursor-pointer bg-transparent border-0"
                  >
                    View All Users →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {topUsers.map((u, i) => {
                    const pct = Math.max(8, Math.round((u.activityScore / maxActivityScore) * 100))
                    return (
                      <div
                        key={u.email}
                        className="p-3.5 rounded-2xl bg-[#03091F]/70 border border-white/10 hover:border-[#218DFF]/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-orbitron text-xs font-black text-[#9EDCFF] shrink-0">
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-white truncate">
                                {u.businessName}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF] text-[10px] font-bold">
                                {ARCH_LABELS[u.architectureId]?.label || u.architectureId}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-200 text-[10px] font-semibold">
                                {u.plan}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {u.fullName} ({u.email}) · {u.recordCount} records · {u.txCount} tx ·{' '}
                              {u.branchCount} branch · {u.staffCount} staff
                            </div>
                          </div>
                        </div>

                        <div className="sm:w-44 shrink-0 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Activity Power</span>
                            <span className="font-orbitron font-bold text-emerald-300">
                              {u.activityScore} pts
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#218DFF] to-emerald-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {!loadingAnalytics && topUsers.length === 0 && (
                    <div className="py-10 text-center text-xs text-slate-400">
                      No active business workspaces found yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Right 4 cols: Architecture Mix + Plan Mix + Newest Signups */}
              <div className="lg:col-span-4 space-y-6">
                {/* Architecture Distribution */}
                <div className="rounded-3xl p-5 bg-[#071544]/75 border border-white/12 shadow-xl space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#218DFF]" />
                    <h3 className="font-orbitron text-sm font-bold text-white">
                      Businesses by Architecture
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {Object.entries(ARCH_LABELS).map(([archId, meta]) => {
                      const count = Number(archBreakdown[archId] || 0)
                      const pct = Math.round((count / totalArchBusinesses) * 100)
                      return (
                        <div key={archId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-200 font-medium">{meta.label}</span>
                            <span className="font-orbitron font-bold text-white">
                              {count}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${meta.color}`}
                              style={{ width: `${Math.max(count > 0 ? 6 : 0, pct)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Subscription Plan Mix */}
                <div className="rounded-3xl p-5 bg-[#071544]/75 border border-white/12 shadow-xl space-y-3.5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-orbitron text-sm font-bold text-white">
                      Subscription Tier Mix
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['Free', 'Bronze', 'Silver', 'Gold'].map((tier) => (
                      <div
                        key={tier}
                        className="p-3 rounded-2xl bg-[#03091F]/80 border border-white/10"
                      >
                        <div className="text-[10px] uppercase font-orbitron text-slate-400">
                          {tier}
                        </div>
                        <div className="font-orbitron text-xl font-black text-white mt-0.5">
                          {planBreakdown[tier] || 0}
                        </div>
                        <div
                          className={`h-1 w-10 rounded-full mt-1.5 bg-gradient-to-r ${PLAN_COLORS[tier]}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Newest Registered Users */}
                <div className="rounded-3xl p-5 bg-[#071544]/75 border border-white/12 shadow-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <h3 className="font-orbitron text-sm font-bold text-white">
                      Newest Signups
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {recentSignups.map((s) => (
                      <div
                        key={s.email}
                        className="p-2.5 rounded-xl bg-[#03091F]/70 border border-white/10 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{s.businessName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{s.email}</div>
                          {s.phone && (
                            <div className="text-[10px] text-emerald-300 font-mono truncate">{s.phone}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-[#9EDCFF] font-semibold">
                            {s.plan}
                          </span>
                          {!s.isSuperAdmin && String(s.email || '').toLowerCase() !== String(currentUser?.email || '').toLowerCase() && (
                            <button
                              type="button"
                              disabled={isBusy(`delete:${s.email}`)}
                              onClick={() => handleDeleteUser(s)}
                              className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/35 text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                              title={`Permanently delete ${s.email}`}
                            >
                              {isBusy(`delete:${s.email}`) ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SYSTEM HEALTH, QUICK FEATURE DIAGNOSTICS & AUTO-REPORTED USER ERRORS */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Top Health Score + Run Quick Feature Test Bar */}
            <div className="rounded-3xl p-6 bg-gradient-to-r from-[#071544] via-[#0A2786]/80 to-[#040D29] border border-[#9EDCFF]/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-orbitron border ${
                    (systemHealth?.healthScore ?? 100) >= 85
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                      : (systemHealth?.healthScore ?? 100) >= 60
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                      : 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                  }`}
                >
                  <span className="text-xl font-black">{systemHealth?.healthScore ?? '—'}</span>
                  <span className="text-[9px] uppercase">Score</span>
                </div>
                <div>
                  <h2 className="font-orbitron text-lg font-extrabold text-white flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-emerald-400" />
                    <span>Live System Health &amp; Quick Diagnostics</span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Test all core ExBOS features in 1 click and monitor automatic error reports from every user session.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={fetchSystemHealth}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-[#9EDCFF] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
                  <span>Check Pulse</span>
                </button>
                <button
                  type="button"
                  disabled={runningDiag}
                  onClick={handleRunDiagnostics}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-orbitron text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-lg"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{runningDiag ? 'Testing Features...' : 'Run Quick Feature Test'}</span>
                </button>
              </div>
            </div>

            {/* 4 Live Subsystem Cards */}
            {systemHealth?.subsystems && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl p-4 bg-[#071544]/80 border border-white/12 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-orbitron font-bold text-[#9EDCFF]">MongoDB Atlas</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        systemHealth.subsystems.database.status === 'healthy'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {systemHealth.subsystems.database.status}
                    </span>
                  </div>
                  <div className="font-orbitron text-xl font-black text-white">
                    {systemHealth.subsystems.database.latencyMs} ms
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {systemHealth.subsystems.database.collections?.workspaces ?? 0} workspaces ·{' '}
                    {systemHealth.subsystems.database.collections?.transactions ?? 0} transactions
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-[#071544]/80 border border-white/12 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-orbitron font-bold text-[#9EDCFF]">Email &amp; 2FA</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        systemHealth.subsystems.email.status === 'healthy'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {systemHealth.subsystems.email.status}
                    </span>
                  </div>
                  <div className="font-orbitron text-sm font-extrabold text-white">
                    {systemHealth.subsystems.email.httpsMailerConfigured
                      ? '24/7 HTTPS Mailer'
                      : systemHealth.subsystems.email.relayOnline
                      ? 'Outbox Relay Online'
                      : 'Relay Offline'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Pending: {systemHealth.subsystems.email.pendingOutbox} · Failed:{' '}
                    {systemHealth.subsystems.email.failedOutbox}
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-[#071544]/80 border border-white/12 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-orbitron font-bold text-[#9EDCFF]">WhatsApp API</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        systemHealth.subsystems.whatsapp.configured
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {systemHealth.subsystems.whatsapp.configured ? 'ready' : 'setup'}
                    </span>
                  </div>
                  <div className="font-orbitron text-sm font-extrabold text-white">
                    {systemHealth.subsystems.whatsapp.officialNumber}
                  </div>
                  <div className="text-[11px] text-slate-400">Meta Cloud API token &amp; Phone ID</div>
                </div>

                <div className="rounded-2xl p-4 bg-[#071544]/80 border border-white/12 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-orbitron font-bold text-[#9EDCFF]">User Errors</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        (systemHealth.errorSummary?.openCount || 0) === 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {systemHealth.errorSummary?.openCount || 0} open
                    </span>
                  </div>
                  <div className="font-orbitron text-xl font-black text-white">
                    {systemHealth.errorSummary?.openCount || 0}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {systemHealth.errorSummary?.resolvedCount || 0} resolved auto-reports
                  </div>
                </div>
              </div>
            )}

            {/* Quick System Feature Diagnostics Results */}
            {diagResults?.checks && (
              <div className="rounded-3xl p-6 bg-[#071544]/80 border border-emerald-400/30 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-orbitron text-base font-extrabold text-white">
                    Quick Feature Test Results ({diagResults.summary.passed}/{diagResults.summary.total} Passed)
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Ran at {String(diagResults.ranAt || '').slice(0, 19).replace('T', ' ')} UTC
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {diagResults.checks.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-[#03091F]/80 border border-white/10 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-300">{c.detail}</div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-orbitron font-bold uppercase ${
                            c.status === 'pass'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : c.status === 'warn'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                          }`}
                        >
                          {c.status}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400">{c.latencyMs} ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-Reported User Errors Inbox */}
            <div className="rounded-3xl p-6 bg-[#071544]/80 border border-white/12 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-orbitron text-base font-extrabold text-white flex items-center gap-2">
                    <Bug className="w-5 h-5 text-rose-400" />
                    <span>Auto-Reported User Errors Inbox</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Whenever any user encounters a JS crash, React error, or 5xx API failure, ExBOS automatically logs it here.
                  </p>
                </div>
                {(systemHealth?.errorSummary?.resolvedCount || 0) > 0 && (
                  <button
                    type="button"
                    onClick={handleClearResolvedErrors}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                    <span>Clear Resolved</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {(systemHealth?.errorReports || []).map((err) => (
                  <div
                    key={err.id}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      err.status === 'open'
                        ? 'bg-rose-950/25 border-rose-400/35'
                        : 'bg-[#03091F]/60 border-white/10 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-orbitron font-bold uppercase ${
                            err.status === 'open'
                              ? 'bg-rose-500/25 text-rose-200'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {err.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#9EDCFF] text-[10px] font-mono">
                          {err.source}
                        </span>
                        {err.occurrences > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-bold">
                            ×{err.occurrences}
                          </span>
                        )}
                        <span className="text-slate-300 font-semibold">{err.userEmail}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {String(err.lastSeenAt || err.createdAt || '').slice(0, 19).replace('T', ' ')} UTC
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleResolveError(err.id, err.status === 'open' ? 'resolved' : 'open')
                        }
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{err.status === 'open' ? 'Mark Resolved' : 'Reopen'}</span>
                      </button>
                    </div>

                    <div className="font-mono text-rose-200 break-words">{err.message}</div>
                    {err.url && (
                      <div className="text-[10px] text-slate-400 truncate">Page: {err.url}</div>
                    )}
                    {err.stack && (
                      <details className="text-[10px] text-slate-400">
                        <summary className="cursor-pointer text-[#9EDCFF] font-semibold">
                          View stack trace
                        </summary>
                        <pre className="mt-1.5 p-2.5 rounded-xl bg-black/40 overflow-x-auto text-[10px] text-slate-300 whitespace-pre-wrap">
                          {err.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
                {(systemHealth?.errorReports || []).length === 0 && (
                  <div className="py-10 text-center text-xs text-emerald-300 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    <span>Zero user errors reported — all systems running clean!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: REAL USERS & ACCESS CONTROL */}
        {activeTab === 'users' && (
          <div className="rounded-3xl p-6 bg-[#071544]/75 border border-white/12 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email, name, business, or phone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/25 text-xs text-white outline-none focus:border-[#218DFF]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#03091F] border border-[#9EDCFF]/25 text-xs font-semibold text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#03091F] border border-[#9EDCFF]/25 text-xs font-semibold text-white"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                </select>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#03091F] border border-[#9EDCFF]/25 text-xs font-semibold text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owners</option>
                  <option value="staff">Staff</option>
                  <option value="superadmin">Super Admins</option>
                </select>
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="p-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/25 text-[#9EDCFF] cursor-pointer"
                  title="Refresh users"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-[11px] uppercase text-[#9EDCFF]">
                  <tr>
                    <th className="py-3 px-3">User &amp; Business</th>
                    <th className="py-3 px-3">Role / Arch</th>
                    <th className="py-3 px-3">Subscription</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {platformUsers.map((u) => {
                    const isSelf =
                      String(u.email).toLowerCase() ===
                      String(currentUser?.email || '').toLowerCase()
                    return (
                      <tr key={u.id || u.email} className="hover:bg-white/[0.03]">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-white">
                            {u.fullName}{' '}
                            {u.isSuperAdmin && (
                              <span className="ml-1 px-2 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-400/40 font-orbitron">
                                SUPER ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {u.email} · <strong>{u.businessName}</strong>
                          </div>
                          {u.phone && (
                            <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
                              {u.phone}
                            </div>
                          )}
                          {u.ownerScopeKey && (
                            <div className="text-[10px] text-[#218DFF]">
                              Staff under {u.ownerScopeKey}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-white">{u.role}</div>
                          <div className="text-[10px] text-slate-400">
                            {ARCH_LABELS[u.architectureId]?.label || u.architectureId}
                            {u.isOwner ? ` · ${u.branchCount} branch · ${u.staffCount} staff` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF] font-bold text-[10px]">
                              {u.plan}
                            </span>
                            <span className="text-[10px] text-slate-300">{u.billingType}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatRWF(u.monthlySpendRWF)}/mo
                            {u.subscriptionExpiry ? ` · Renews ${u.subscriptionExpiry}` : ''}
                          </div>
                          {u.paidAt && (
                            <div className="text-[10px] text-emerald-300/90 mt-0.5">
                              Paid: {String(u.paidAt).slice(0, 16).replace('T', ' ')}
                            </div>
                          )}
                          {u.paymentMessageCopy && (
                            <div className="mt-1.5 p-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-200 font-mono whitespace-pre-wrap max-w-xs">
                              <span className="text-[#9EDCFF] font-sans font-bold uppercase tracking-wider block mb-0.5">
                                Payment Confirmation Message:
                              </span>
                              {u.paymentMessageCopy}
                            </div>
                          )}
                          {u.paymentScreenshot && (
                            <div className="mt-1">
                              <a
                                href={u.paymentScreenshot}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#9EDCFF] underline font-semibold"
                              >
                                View Payment Screenshot
                              </a>
                            </div>
                          )}
                          {u.timeRemainingLabel && (
                            <div
                              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                u.renewalStatus === 'expired'
                                  ? 'bg-rose-500/25 text-rose-300 border border-rose-400/40 animate-pulse'
                                  : u.renewalStatus === 'expiring_soon'
                                  ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                                  : u.renewalStatus === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                  : 'bg-white/5 text-slate-400'
                              }`}
                            >
                              {u.timeRemainingLabel}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              u.accountStatus === 'Suspended'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            }`}
                          >
                            {u.accountStatus}
                          </span>
                          {!u.emailVerified && (
                            <div className="text-[10px] text-amber-300 mt-0.5">Unverified Email</div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickRenew30Days(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] cursor-pointer"
                              title="Extend or Renew Plan by +30 Days"
                            >
                              +30d Renew
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserEmail(u.email)
                                setGrantPlan(u.plan || 'Silver')
                                setGrantBillingType(u.billingType || 'Complimentary')
                                setActiveTab('subscriptions')
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#218DFF]/20 hover:bg-[#218DFF]/30 text-[#9EDCFF] font-bold text-[10px] cursor-pointer"
                            >
                              Plan
                            </button>
                            {!u.emailVerified && (
                              <button
                                type="button"
                                disabled={isBusy(`verify:${u.email}`)}
                                onClick={() => handleVerifyEmail(u)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {isBusy(`verify:${u.email}`) ? <RefreshCw className="w-3 h-3 animate-spin" /> : <MailCheck className="w-3 h-3" />}
                                {isBusy(`verify:${u.email}`) ? 'Verifying...' : 'Verify'}
                              </button>
                            )}
                            {!isSelf && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy(`admin:${u.email}`)}
                                  onClick={() => handleToggleSuperAdmin(u)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {isBusy(`admin:${u.email}`) ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                                  {isBusy(`admin:${u.email}`) ? 'Updating...' : u.isSuperAdmin ? 'Revoke Admin' : 'Make Admin'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy(`suspend:${u.email}`)}
                                  onClick={() => handleToggleSuspend(u)}
                                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                                    u.accountStatus === 'Suspended'
                                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
                                      : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300'
                                  }`}
                                >
                                  {isBusy(`suspend:${u.email}`) ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" /> Processing...
                                    </>
                                  ) : u.accountStatus === 'Suspended' ? (
                                    <>
                                      <Unlock className="w-3 h-3" /> Reactivate
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3 h-3" /> Suspend
                                    </>
                                  )}
                                </button>
                                {String(u.plan || 'Free').toLowerCase() !== 'free' && (
                                  <button
                                    type="button"
                                    disabled={isBusy(`revoke:${u.email}`)}
                                    onClick={() => handleRevokePayment(u)}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Revoke paid plan due to corrupt or invalid payment proof"
                                  >
                                    {isBusy(`revoke:${u.email}`) && <RefreshCw className="w-3 h-3 animate-spin" />}
                                    {isBusy(`revoke:${u.email}`) ? 'Revoking...' : 'Revoke Payment'}
                                  </button>
                                )}
                                {!u.isSuperAdmin && (
                                  <button
                                    type="button"
                                    disabled={isBusy(`delete:${u.email}`)}
                                    onClick={() => handleDeleteUser(u)}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 text-rose-200 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Permanently delete user and all workspace data"
                                  >
                                    {isBusy(`delete:${u.email}`) ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    {isBusy(`delete:${u.email}`) ? 'Deleting...' : 'Delete'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!loadingUsers && platformUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No users match your current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SUBSCRIPTIONS, PAYMENT APPROVALS & COMPLIMENTARY ACCESS */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {/* Pending Customer MoMo / Bank Upgrade Requests */}
            {upgradeRequests.length > 0 && (
              <div className="rounded-3xl p-6 bg-gradient-to-r from-amber-500/10 via-[#071544] to-[#071544] border border-amber-400/35 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-orbitron text-base font-extrabold text-amber-200 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Customer MoMo / Bank Upgrade Requests ({pendingUpgradesCount} Pending)</span>
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {upgradeRequests.slice(0, 10).map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl bg-[#03091F]/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-white">{req.businessName}</strong>
                          <span className="text-slate-300">({req.email})</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF] font-bold text-[10px]">
                            {req.currentPlan} → {req.requestedPlan} ({formatRWF(req.amountRWF)})
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              req.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : req.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/25 text-amber-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {req.paymentMethod} · Ref: <code className="text-[#9EDCFF]">{req.paymentReference}</code> · Phone: {req.payerPhone || 'N/A'}
                          {req.paidAt && (
                            <span className="ml-2 text-emerald-300">
                              · Paid: {String(req.paidAt).slice(0, 16).replace('T', ' ')}
                            </span>
                          )}
                        </div>
                        {req.paymentMessageCopy && (
                          <div className="mt-1 p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-200 font-mono whitespace-pre-wrap">
                            SMS Copy: {req.paymentMessageCopy}
                          </div>
                        )}
                        {req.paymentScreenshot && (
                          <div className="mt-1.5">
                            <a
                              href={req.paymentScreenshot}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-[11px] text-[#9EDCFF] underline"
                            >
                              <img
                                src={req.paymentScreenshot}
                                alt="Payment Screenshot"
                                className="w-10 h-10 rounded-lg object-cover border border-white/20"
                              />
                              <span>View Uploaded Payment Screenshot</span>
                            </a>
                          </div>
                        )}
                      </div>
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleReviewUpgrade(req.id, 'approve')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                          >
                            Approve (30d Paid)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewUpgrade(req.id, 'reject')}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : req.status === 'approved' ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleRevokePayment(
                                { email: req.email, businessName: req.businessName },
                                req.id
                              )
                            }
                            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-200 font-bold text-[11px] cursor-pointer"
                          >
                            Revoke Payment
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-3xl p-6 bg-[#071544]/75 border border-white/12 shadow-xl space-y-4">
              <div>
                <h3 className="font-orbitron text-lg font-bold text-white">
                  Live Business Subscriptions (Synced to MongoDB)
                </h3>
                <p className="text-xs text-slate-300">
                  Paid MRR is strictly isolated from Complimentary grants. Updating an owner automatically syncs their staff accounts.
                </p>
              </div>

              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {ownerAccounts.map((biz) => (
                  <div
                    key={biz.email}
                    onClick={() => {
                      setSelectedUserEmail(biz.email)
                      setGrantPlan(biz.plan || 'Free')
                      setGrantBillingType(biz.billingType || 'Complimentary')
                      if (biz.subscriptionExpiry) setGrantExpiry(biz.subscriptionExpiry)
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      selectedUserEmail === biz.email
                        ? 'bg-[#218DFF]/20 border-[#218DFF]'
                        : 'bg-[#03091F]/70 border-white/10 hover:border-[#218DFF]/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="font-orbitron text-sm text-white">
                          {biz.businessName}
                        </strong>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF] font-orbitron font-bold">
                          {biz.plan}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold ${
                            biz.billingType === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : String(biz.billingType || '').toLowerCase().includes('complimentary')
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                              : 'bg-slate-500/20 text-slate-300'
                          }`}
                        >
                          {biz.billingType}
                        </span>
                      </div>
                      <div className="text-slate-300">
                        {biz.fullName} ({biz.email}) · Branches: <strong>{biz.branchCount}</strong> · Staff:{' '}
                        <strong>{biz.staffCount}</strong>
                      </div>
                      {biz.paidAt && (
                        <div className="text-[11px] text-emerald-300">
                          Paid Time: <strong>{String(biz.paidAt).slice(0, 16).replace('T', ' ')}</strong>
                          {biz.paymentMethod ? ` via ${biz.paymentMethod}` : ''}
                        </div>
                      )}
                      {biz.paymentMessageCopy && (
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-200 font-mono whitespace-pre-wrap">
                          <span className="text-[#9EDCFF] font-sans font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                            Payment Confirmation Message:
                          </span>
                          {biz.paymentMessageCopy}
                        </div>
                      )}
                      {biz.paymentScreenshot && (
                        <div className="pt-0.5">
                          <a
                            href={biz.paymentScreenshot}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#9EDCFF] underline font-semibold"
                          >
                            View Uploaded Payment Screenshot
                          </a>
                        </div>
                      )}
                      {biz.auditNote && (
                        <div className="text-[11px] text-[#9EDCFF]/80 italic">{biz.auditNote}</div>
                      )}
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="font-orbitron text-sm font-extrabold text-white">
                        {formatRWF(biz.monthlySpendRWF)} / mo
                      </div>
                      <div
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          biz.renewalStatus === 'expired'
                            ? 'bg-rose-500/25 text-rose-300 border border-rose-400/40 animate-pulse'
                            : biz.renewalStatus === 'expiring_soon'
                            ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                            : biz.renewalStatus === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {biz.timeRemainingLabel || (biz.subscriptionExpiry ? `Exp: ${biz.subscriptionExpiry}` : biz.subscriptionStatus)}
                      </div>
                      {biz.subscriptionExpiry && (
                        <div className="text-[10px] text-slate-400">
                          Renewal Due: {biz.subscriptionExpiry}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleQuickRenew30Days(biz)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold cursor-pointer"
                        >
                          +30 Days Renew
                        </button>
                        {String(biz.plan || 'Free').toLowerCase() !== 'free' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRevokePayment(biz)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-200 text-[10px] font-bold cursor-pointer"
                          >
                            Revoke Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleApplySubscriptionChange}
              className="lg:col-span-5 rounded-3xl p-6 bg-gradient-to-b from-[#0A2786]/80 to-[#071544]/95 border border-[#9EDCFF]/30 shadow-xl space-y-4 self-start"
            >
              <span className="text-xs font-orbitron uppercase text-[#9EDCFF] font-bold">
                Administrative Subscription Control
              </span>
              <h3 className="font-orbitron text-lg font-bold text-white">
                Assign Plan or Complimentary Grant
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                  Select Business Owner / User
                </label>
                <select
                  value={selectedUserEmail}
                  onChange={(e) => setSelectedUserEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-xs font-bold text-white"
                >
                  {platformUsers.map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.businessName} ({u.email}) — {u.plan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Access Tier
                  </label>
                  <select
                    value={grantPlan}
                    onChange={(e) => setGrantPlan(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-xs font-bold text-white"
                  >
                    <option value="Free">Free</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Billing Type
                  </label>
                  <select
                    value={grantBillingType}
                    onChange={(e) => setGrantBillingType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-xs font-bold text-white"
                  >
                    <option value="Complimentary">Complimentary (0 RWF)</option>
                    <option value="Complimentary trial">Complimentary Trial (0 RWF)</option>
                    <option value="Paid">Verified Paid</option>
                    <option value="Free">Free Tier</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={grantExpiry}
                  onChange={(e) => setGrantExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-xs text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyUserOnSub}
                  onChange={(e) => setNotifyUserOnSub(e.target.checked)}
                />
                <span>Email confirmation notice to this business owner</span>
              </label>

              <button
                type="submit"
                disabled={submittingSub}
                className="w-full btn-sapphire py-3 text-xs font-orbitron cursor-pointer disabled:opacity-60"
              >
                {submittingSub ? 'Saving to MongoDB...' : 'Apply Subscription & Record Audit'}
              </button>
            </form>
          </div>
          </div>
        )}

        {/* TAB 3: PRICING PLANS, LIVE PLAN_LIMITS FEATURE MATRIX & PLATINUM REFERRAL */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            {/* Live Editable PLAN_LIMITS & Feature Matrix Controller */}
            {planLimitsMap && planLimitsMap[editingTierKey] && (
              <div className="rounded-3xl p-6 bg-gradient-to-br from-[#071544] via-[#0A2786]/60 to-[#040D29] border border-[#9EDCFF]/35 shadow-2xl space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-orbitron uppercase tracking-wider text-amber-300 font-bold">
                      Live Backend Entitlements Controller (MongoDB Synced)
                    </span>
                    <h3 className="font-orbitron text-lg sm:text-xl font-extrabold text-white mt-0.5">
                      Edit Plan Limits &amp; Feature Access Per Tier
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Modify numeric quotas (or mark Unlimited) and toggle any ExBOS feature ON/OFF per tier. Changes enforce immediately on all APIs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={savingLimits}
                      onClick={handleResetAllPlanLimits}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                    <button
                      type="button"
                      disabled={savingLimits}
                      onClick={handleSaveTierLimits}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-orbitron text-xs font-extrabold cursor-pointer disabled:opacity-60 shadow-lg"
                    >
                      {savingLimits
                        ? 'Saving...'
                        : `Save ${planLimitsMap[editingTierKey].name || editingTierKey.toUpperCase()}`}
                    </button>
                  </div>
                </div>

                {/* Tier Selector Pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'free', label: 'Forever Free' },
                    { key: 'bronze', label: 'Bronze Growth' },
                    { key: 'silver', label: 'Silver Enterprise' },
                    { key: 'gold', label: 'Gold Corporate' },
                    { key: 'platinum', label: 'Platinum Partner' }
                  ].map((tier) => (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => setEditingTierKey(tier.key)}
                      className={`px-4 py-2 rounded-xl font-orbitron text-xs font-bold cursor-pointer transition border ${
                        editingTierKey === tier.key
                          ? 'bg-[#218DFF] text-white border-[#9EDCFF] shadow-md'
                          : 'bg-[#03091F]/70 text-slate-300 border-white/10 hover:border-[#218DFF]/60'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>

                {/* Tier Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#9EDCFF] mb-1">
                      Tier Display Name
                    </label>
                    <input
                      type="text"
                      value={planLimitsMap[editingTierKey].name || ''}
                      onChange={(e) => updateEditingTierField('name', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#9EDCFF] mb-1">
                      Monthly Price (RWF)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={planLimitsMap[editingTierKey].priceRWF ?? 0}
                      onChange={(e) => updateEditingTierField('priceRWF', Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white font-orbitron font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#9EDCFF] mb-1">
                      Target Business
                    </label>
                    <input
                      type="text"
                      value={planLimitsMap[editingTierKey].targetBusiness || ''}
                      onChange={(e) => updateEditingTierField('targetBusiness', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#9EDCFF] mb-1">
                      Support SLA
                    </label>
                    <input
                      type="text"
                      value={planLimitsMap[editingTierKey].supportSla || ''}
                      onChange={(e) => updateEditingTierField('supportSla', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                    />
                  </div>
                </div>

                {/* Numeric Quotas with Unlimited Toggle */}
                <div>
                  <h4 className="text-xs font-orbitron uppercase text-[#9EDCFF] font-bold mb-2.5">
                    Numeric Quotas (Check &ldquo;Unlimited&rdquo; for no limit)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                    {[
                      { key: 'maxBranches', label: 'Max Branches' },
                      { key: 'maxStaff', label: 'Max Staff Logins' },
                      { key: 'maxProducts', label: 'Max Products / Items' },
                      { key: 'maxMonthlySales', label: 'Max Monthly Sales' },
                      { key: 'maxArchitectures', label: 'Max Architectures' }
                    ].map((q) => {
                      const val = planLimitsMap[editingTierKey][q.key]
                      const isUnlim = val === null || val === undefined
                      return (
                        <div
                          key={q.key}
                          className="p-3 rounded-2xl bg-[#03091F]/80 border border-white/10 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white text-[11px]">{q.label}</span>
                            <label className="inline-flex items-center gap-1 text-[10px] text-emerald-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isUnlim}
                                onChange={(e) =>
                                  updateEditingTierField(q.key, e.target.checked ? null : 1)
                                }
                              />
                              <span>Unlim</span>
                            </label>
                          </div>
                          {isUnlim ? (
                            <div className="py-1.5 px-2.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-orbitron font-bold text-center text-[11px]">
                              Unlimited
                            </div>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={val}
                              onChange={(e) =>
                                updateEditingTierField(q.key, Math.max(0, Number(e.target.value) || 0))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white font-orbitron font-bold"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Feature Switches Grid */}
                <div>
                  <h4 className="text-xs font-orbitron uppercase text-[#9EDCFF] font-bold mb-2.5">
                    Feature Access Switches (Toggle ON / OFF for {planLimitsMap[editingTierKey].name})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                    {[
                      { key: 'allowHybrid', label: 'Hybrid Multi-Activity' },
                      { key: 'allowFullMoneyBuckets', label: 'Full 8-Bucket Money View' },
                      { key: 'allowPublicDocLinks', label: 'Public Share Links (/d/:id)' },
                      { key: 'allowWhatsappAutomation', label: 'WhatsApp Automation' },
                      { key: 'allowGmailReports', label: 'Gmail Financial Reports' },
                      { key: 'allowGoogleDrive', label: 'Google Drive Export Vault' },
                      { key: 'allowMultiBranchTransfer', label: 'Inter-Branch Stock Transfer' },
                      { key: 'allowBranchFreeze', label: 'Branch Freeze & Owner Lock' },
                      { key: 'allowAdvancedReports', label: 'Full P&L & Branch Analytics' },
                      { key: 'allowRraTaxPack', label: 'RRA Tax-Ready Export Pack' },
                      { key: 'allowTwoFactorSecurity', label: '2-Step Security & Audit Log' }
                    ].map((feat) => {
                      const enabled = Boolean(planLimitsMap[editingTierKey][feat.key])
                      return (
                        <button
                          key={feat.key}
                          type="button"
                          onClick={() => updateEditingTierField(feat.key, !enabled)}
                          className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                            enabled
                              ? 'bg-emerald-500/15 border-emerald-400/40 text-white'
                              : 'bg-[#03091F]/70 border-white/10 text-slate-400 hover:border-white/25'
                          }`}
                        >
                          <span className="font-semibold text-[11px] leading-tight">
                            {feat.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-orbitron font-black shrink-0 ${
                              enabled
                                ? 'bg-emerald-400 text-slate-950'
                                : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            {enabled ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-3xl p-5 bg-[#071544]/80 border border-white/15 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron text-base font-black text-[#9EDCFF]">
                      {plan.name}
                    </span>
                    <span className="text-[10px] font-orbitron px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF]">
                      {plan.tier}
                    </span>
                  </div>

                  <MoneyInput
                    id={`admin-price-${plan.id}`}
                    label="Monthly Price (RWF)"
                    value={plan.priceRWF}
                    onChange={(v) =>
                      setPricingPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id ? { ...p, priceRWF: Number(v) || 0 } : p
                        )
                      )
                    }
                    language={language}
                  />

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase text-[#9EDCFF]">
                      Plan Description
                    </label>
                    <textarea
                      rows={2}
                      value={plan.description}
                      onChange={(e) =>
                        setPricingPlans((prev) =>
                          prev.map((p) =>
                            p.id === plan.id ? { ...p, description: e.target.value } : p
                          )
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-xs text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSavePricingPlan(plan)}
                    className="w-full btn-sapphire py-2.5 text-xs font-orbitron cursor-pointer"
                  >
                    Save {plan.tier} Tier
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-3xl p-6 bg-[#071544]/75 border border-white/15 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#218DFF]" />
                  <h3 className="font-orbitron text-lg font-bold text-white">
                    Platinum / Diamond Referral Program Rules
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleSavePlatinum}
                  className="btn-sapphire px-5 py-2 text-xs font-orbitron cursor-pointer"
                >
                  Save Platinum Rules
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Required Verified Referrals
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={platinumProgram.requiredReferrals}
                    onChange={(e) =>
                      setPlatinumProgram({
                        ...platinumProgram,
                        requiredReferrals: Number(e.target.value) || 1
                      })
                    }
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 font-orbitron font-bold text-sm text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Prize / Reward Title
                  </label>
                  <input
                    type="text"
                    value={platinumProgram.rewardTitle}
                    onChange={(e) =>
                      setPlatinumProgram({ ...platinumProgram, rewardTitle: e.target.value })
                    }
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PLATFORM BROADCAST */}
        {activeTab === 'broadcast' && (
          <form
            onSubmit={handlePublishBroadcast}
            className="rounded-3xl p-6 sm:p-8 bg-[#071544]/75 border border-white/15 shadow-xl max-w-3xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#218DFF]/20 text-[#9EDCFF] flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-orbitron text-lg font-bold text-white">
                  Platform Global Broadcast Banner
                </h3>
                <p className="text-xs text-slate-300">
                  Persisted in MongoDB and displayed across all business dashboards immediately.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                Broadcast Headline
              </label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                Announcement Message
              </label>
              <textarea
                rows={3}
                required
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-sm text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={savingBroadcast}
                className="btn-sapphire px-6 py-3 text-xs font-orbitron cursor-pointer disabled:opacity-60"
              >
                {savingBroadcast ? 'Publishing...' : 'Publish to All Dashboards'}
              </button>
              <button
                type="button"
                disabled={savingBroadcast}
                onClick={handleClearBroadcast}
                className="px-4 py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-400/30 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Active Broadcast
              </button>
              <Link
                to="/dashboard"
                className="px-4 py-3 rounded-xl bg-white/10 text-xs font-semibold text-[#9EDCFF] no-underline"
              >
                Preview in Dashboard →
              </Link>
            </div>
          </form>
        )}

        {/* TAB 5: IMMUTABLE AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="rounded-3xl p-6 bg-[#071544]/75 border border-white/15 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-orbitron text-lg font-bold text-white">
                  Immutable Super Admin Audit Trail
                </h3>
                <p className="text-xs text-slate-300">
                  Every subscription grant, account suspension, role change, pricing update, and broadcast is logged permanently.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchAuditLogs}
                className="p-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-[#9EDCFF] cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-[11px] uppercase text-[#9EDCFF]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.03]">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {String(log.createdAt || '').slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">{log.actorEmail}</td>
                      <td className="py-2.5 px-3 text-[#9EDCFF]">{log.targetEmail}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-300">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-300">{log.reason || '—'}</td>
                    </tr>
                  ))}
                  {!loadingLogs && auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No Super Admin audit entries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </main>

        {/* ==================== MOBILE BOTTOM QUICK MENU ==================== */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#050D2B]/95 backdrop-blur-md border-t border-white/15 px-2 py-1.5 grid grid-cols-5 gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: Trophy },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'subscriptions', label: 'Billing', icon: CreditCard, badge: pendingUpgradesCount },
            {
              id: 'health',
              label: 'Health',
              icon: HeartPulse,
              badge: systemHealth?.errorSummary?.openCount || 0
            }
          ].map((item) => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-semibold cursor-pointer transition ${
                  active
                    ? 'bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="truncate">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute top-1 right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-white cursor-pointer transition"
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
