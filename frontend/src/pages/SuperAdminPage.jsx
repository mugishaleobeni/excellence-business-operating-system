import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import { formatRWF } from '../utils/currencyWords'
import MoneyInput from '../components/common/MoneyInput'
import PublicNavbar from '../components/layout/PublicNavbar'
import { apiClient } from '../utils/apiClient'
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
  Flame
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

  const refreshAll = useCallback(() => {
    fetchAnalytics()
    fetchUsers()
    fetchAuditLogs()
  }, [fetchAnalytics, fetchUsers, fetchAuditLogs])

  useEffect(() => {
    fetchAnalytics()
    fetchAuditLogs()
  }, [fetchAnalytics, fetchAuditLogs])

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
    const nextStatus = target.accountStatus === 'Suspended' ? 'Active' : 'Suspended'
    const reason =
      nextStatus === 'Suspended'
        ? window.prompt(
            `Enter reason for suspending ${target.email}:`,
            'Non-payment / Policy review'
          )
        : 'Account reactivated by Super Admin'
    if (nextStatus === 'Suspended' && !reason) return

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
  }

  const handleToggleSuperAdmin = async (target) => {
    const nextSuper = !target.isSuperAdmin
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
  }

  const handleVerifyEmail = async (target) => {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#03091F] text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-20 space-y-6">
        {/* Executive Super Admin Hero Command Bar */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#071544] via-[#0A2786] to-[#040D29] border border-[#9EDCFF]/35 shadow-[0_24px_70px_rgba(0,0,0,0.65),0_0_40px_rgba(33,141,255,0.2)]">
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#218DFF]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-[11px] font-orbitron font-bold text-amber-200 tracking-wider">
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>EXBOS SUPER ADMIN COMMAND</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[11px] font-semibold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>MongoDB Live</span>
                </span>
                <span className="text-xs text-[#9EDCFF]/80 font-mono">
                  {currentUser?.email}
                </span>
              </div>

              <h1 className="font-orbitron text-2xl sm:text-4xl font-black tracking-tight text-white">
                Platform Intelligence &amp; Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-200/90 max-w-2xl">
                Monitor top-performing businesses in real time, control user access &amp; subscriptions with strict MRR isolation, broadcast notices, and audit every administrative action.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={refreshAll}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-[#9EDCFF] hover:text-white inline-flex items-center gap-2 cursor-pointer transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingAnalytics || loadingUsers ? 'animate-spin' : ''}`}
                />
                <span>Refresh Live</span>
              </button>
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-orbitron font-extrabold inline-flex items-center gap-1.5 no-underline shadow-lg transition"
              >
                <span>Manage My Business</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
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

        {/* Executive Navigation Pill Bar */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#071544]/70 border border-white/10">
          {[
            { id: 'overview', label: 'Executive Overview & Top Users', icon: Trophy },
            { id: 'users', label: 'Users & Access', icon: Users },
            { id: 'subscriptions', label: 'Subscriptions & Grants', icon: CreditCard },
            { id: 'pricing', label: 'Pricing & Platinum', icon: Crown },
            { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
            { id: 'audit', label: 'Audit Trail', icon: ScrollText }
          ].map((t) => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 rounded-xl font-orbitron text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#218DFF] to-[#1045CA] text-white shadow-[0_6px_20px_rgba(33,141,255,0.45)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

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
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-[#9EDCFF] font-semibold shrink-0">
                          {s.plan}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF] font-bold text-[10px]">
                              {u.plan}
                            </span>
                            <span className="text-[10px] text-slate-300">{u.billingType}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatRWF(u.monthlySpendRWF)}/mo
                            {u.subscriptionExpiry ? ` · Exp ${u.subscriptionExpiry}` : ''}
                          </div>
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
                                onClick={() => handleVerifyEmail(u)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <MailCheck className="w-3 h-3" /> Verify
                              </button>
                            )}
                            {!isSelf && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuperAdmin(u)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <ShieldAlert className="w-3 h-3" />
                                  {u.isSuperAdmin ? 'Revoke Admin' : 'Make Admin'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuspend(u)}
                                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer ${
                                    u.accountStatus === 'Suspended'
                                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
                                      : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300'
                                  }`}
                                >
                                  {u.accountStatus === 'Suspended' ? (
                                    <>
                                      <Unlock className="w-3 h-3" /> Reactivate
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3 h-3" /> Suspend
                                    </>
                                  )}
                                </button>
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

        {/* TAB 2: SUBSCRIPTIONS & COMPLIMENTARY ACCESS */}
        {activeTab === 'subscriptions' && (
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
                      {biz.auditNote && (
                        <div className="text-[11px] text-[#9EDCFF]/80 italic">{biz.auditNote}</div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-orbitron text-sm font-extrabold text-white">
                        {formatRWF(biz.monthlySpendRWF)} / mo
                      </div>
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        {biz.subscriptionExpiry ? `Exp: ${biz.subscriptionExpiry}` : biz.subscriptionStatus}
                      </span>
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
        )}

        {/* TAB 3: PRICING PLANS & PLATINUM REFERRAL */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
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
    </div>
  )
}
