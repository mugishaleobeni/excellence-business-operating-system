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
  Trash2
} from 'lucide-react'

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

  const [activeTab, setActiveTab] = useState('users')
  const [savedToast, setSavedToast] = useState(null)
  const [errorToast, setErrorToast] = useState(null)

  // Real MongoDB Users + Platform KPIs
  const [platformUsers, setPlatformUsers] = useState([])
  const [platformMeta, setPlatformMeta] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    paidCount: 0,
    complimentaryCount: 0,
    paidMrrRWF: 0
  })
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
      if (res.data?.meta) setPlatformMeta(res.data.meta)
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

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab, fetchAuditLogs])

  const ownerAccounts = useMemo(
    () => platformUsers.filter((u) => u.isOwner),
    [platformUsers]
  )

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
    fetchUsers()
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
    fetchUsers()
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
    fetchUsers()
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
    fetchUsers()
  }

  const handleSavePricingPlan = async (plan) => {
    const res = await apiClient.superAdminUpdatePricingPlan(plan.id, {
      name: plan.name,
      monthlyPriceRWF: Number(plan.priceRWF || 0),
      priceRWF: Number(plan.priceRWF || 0),
      description: plan.description
    })
    if (!res.ok) {
      showError(res.error || `Could not save pricing for ${plan.name}.`)
      return
    }
    showNotice(`Saved ${plan.name} (${formatRWF(plan.priceRWF)}) live to MongoDB.`)
  }

  const handleSavePlatinum = async () => {
    const res = await apiClient.superAdminUpdatePlatinumProgram(platinumProgram)
    if (!res.ok) {
      showError(res.error || 'Could not save Platinum program settings.')
      return
    }
    showNotice('Platinum referral program rules saved live to MongoDB.')
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
    setSuperAdminBroadcast(res.data?.data || { title: broadcastTitle, message: broadcastMsg, active: true })
    showNotice('Broadcast published live to MongoDB! Every business will see it on login.')
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
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#edf4ff] dark:bg-[#03091F]">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-20 space-y-6">
        {/* Top Super Admin Header */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#071544] via-[#0A2786] to-[#1045CA] text-white border border-[#9EDCFF]/45 shadow-sapphire-glow flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-[#9EDCFF]/40 text-xs font-orbitron text-[#9EDCFF]">
              <ShieldCheck className="w-4 h-4 text-[#9EDCFF]" />
              <span>SUPER ADMINISTRATOR · {currentUser?.email}</span>
            </span>
            <h1 className="font-orbitron text-2xl sm:text-3xl font-extrabold">
              Users, Access Control, Subscriptions &amp; Audit Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">
              Live MongoDB platform control: manage real users, suspend or grant access, assign Paid or Complimentary subscriptions (with strict MRR isolation), and inspect the immutable audit trail.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-[#03091F]/75 border border-[#9EDCFF]/30 text-center">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]">Total Users</div>
              <div className="font-orbitron text-xl font-black text-white">{platformMeta.totalUsers}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#03091F]/75 border border-[#9EDCFF]/30 text-center">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]">Businesses</div>
              <div className="font-orbitron text-xl font-black text-white">{platformMeta.totalBusinesses}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#03091F]/75 border border-[#9EDCFF]/30 text-center">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]">Paid MRR</div>
              <div className="font-orbitron text-sm font-black text-emerald-400 mt-1">
                {formatRWF(platformMeta.paidMrrRWF)}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#03091F]/75 border border-[#9EDCFF]/30 text-center">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]">Suspended</div>
              <div className="font-orbitron text-xl font-black text-rose-400">
                {platformMeta.suspendedUsers}
              </div>
            </div>
          </div>
        </div>

        {savedToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        {errorToast && (
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-xs sm:text-sm font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorToast}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'users', label: '1. Users & Access Control', icon: Users },
            { id: 'subscriptions', label: '2. Subscriptions & Grants', icon: CreditCard },
            { id: 'pricing', label: '3. Pricing & Platinum', icon: Crown },
            { id: 'broadcast', label: '4. Platform Broadcast', icon: Megaphone },
            { id: 'audit', label: '5. Audit Trail', icon: ScrollText }
          ].map((t) => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 rounded-2xl font-orbitron text-xs font-bold flex items-center gap-2 cursor-pointer border transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#1045CA] to-[#0A2786] text-white border-[#9EDCFF] shadow-sapphire-glow'
                    : 'liquid-glass text-[#071544] dark:text-white hover:border-[#218DFF]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* TAB 1: REAL USERS & ACCESS CONTROL */}
        {activeTab === 'users' && (
          <div className="liquid-glass rounded-3xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email, name, business, or phone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs text-[#071544] dark:text-white outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs font-semibold text-[#071544] dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs font-semibold text-[#071544] dark:text-white"
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
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs font-semibold text-[#071544] dark:text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owners</option>
                  <option value="staff">Staff</option>
                  <option value="superadmin">Super Admins</option>
                </select>
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="p-2.5 rounded-xl bg-white/80 dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-[#1045CA] dark:text-[#9EDCFF] cursor-pointer"
                  title="Refresh users"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-blue-200/60 dark:border-white/10 text-[11px] uppercase text-slate-500 dark:text-[#9EDCFF]">
                  <tr>
                    <th className="py-3 px-3">User &amp; Business</th>
                    <th className="py-3 px-3">Role / Arch</th>
                    <th className="py-3 px-3">Subscription</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100/60 dark:divide-white/5">
                  {platformUsers.map((u) => {
                    const isSelf =
                      String(u.email).toLowerCase() ===
                      String(currentUser?.email || '').toLowerCase()
                    return (
                      <tr key={u.id || u.email} className="hover:bg-white/40 dark:hover:bg-white/[0.02]">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-[#071544] dark:text-white">
                            {u.fullName}{' '}
                            {u.isSuperAdmin && (
                              <span className="ml-1 px-2 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-500 border border-amber-400/40 font-orbitron">
                                SUPER ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-300">
                            {u.email} · <strong>{u.businessName}</strong>
                          </div>
                          {u.ownerScopeKey && (
                            <div className="text-[10px] text-[#218DFF]">
                              Staff under {u.ownerScopeKey}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-[#071544] dark:text-white">{u.role}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {u.architectureId}
                            {u.isOwner ? ` · ${u.branchCount} branch · ${u.staffCount} staff` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[#1045CA] dark:text-[#9EDCFF] font-bold text-[10px]">
                              {u.plan}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-300">
                              {u.billingType}
                            </span>
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
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-400/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                            }`}
                          >
                            {u.accountStatus}
                          </span>
                          {!u.emailVerified && (
                            <div className="text-[10px] text-amber-400 mt-0.5">Unverified Email</div>
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
                              className="px-2.5 py-1.5 rounded-lg bg-[#218DFF]/15 hover:bg-[#218DFF]/25 text-[#1045CA] dark:text-[#9EDCFF] font-bold text-[10px] cursor-pointer"
                            >
                              Plan
                            </button>
                            {!u.emailVerified && (
                              <button
                                type="button"
                                onClick={() => handleVerifyEmail(u)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                title="Verify Email"
                              >
                                <MailCheck className="w-3 h-3" /> Verify
                              </button>
                            )}
                            {!isSelf && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuperAdmin(u)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                  title={u.isSuperAdmin ? 'Revoke Super Admin' : 'Grant Super Admin'}
                                >
                                  <ShieldAlert className="w-3 h-3" />
                                  {u.isSuperAdmin ? 'Revoke Admin' : 'Make Admin'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuspend(u)}
                                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer ${
                                    u.accountStatus === 'Suspended'
                                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400'
                                      : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400'
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
            <div className="lg:col-span-7 liquid-glass rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                  Live Business Subscriptions (Synced to MongoDB)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
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
                        ? 'bg-[#218DFF]/15 border-[#218DFF]'
                        : 'bg-white/80 dark:bg-[#071544]/75 border-blue-200/70 dark:border-[#9EDCFF]/25 hover:border-[#218DFF]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="font-orbitron text-sm text-[#071544] dark:text-white">
                          {biz.businessName}
                        </strong>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 text-[#1045CA] dark:text-[#9EDCFF] font-orbitron font-bold">
                          {biz.plan}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold ${
                            biz.billingType === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : String(biz.billingType || '').toLowerCase().includes('complimentary')
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {biz.billingType}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-300">
                        {biz.fullName} ({biz.email}) · Branches: <strong>{biz.branchCount}</strong> · Staff:{' '}
                        <strong>{biz.staffCount}</strong>
                      </div>
                      {biz.auditNote && (
                        <div className="text-[11px] text-[#1045CA] dark:text-[#9EDCFF]/85 italic">
                          {biz.auditNote}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-orbitron text-sm font-extrabold text-[#071544] dark:text-white">
                        {formatRWF(biz.monthlySpendRWF)} / mo
                      </div>
                      <span className="text-[11px] text-emerald-500 font-semibold">
                        {biz.subscriptionExpiry ? `Exp: ${biz.subscriptionExpiry}` : biz.subscriptionStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Grant Complimentary or Paid Access Form */}
            <form
              onSubmit={handleApplySubscriptionChange}
              className="lg:col-span-5 sapphire-analytics-card p-6 space-y-4 self-start"
            >
              <span className="text-xs font-orbitron uppercase text-[#218DFF] font-bold">
                Administrative Subscription Control
              </span>
              <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                Assign Plan or Complimentary Grant
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                  Select Business Owner / User
                </label>
                <select
                  value={selectedUserEmail}
                  onChange={(e) => setSelectedUserEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs font-bold text-[#071544] dark:text-white"
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
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                    Access Tier
                  </label>
                  <select
                    value={grantPlan}
                    onChange={(e) => setGrantPlan(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs font-bold text-[#071544] dark:text-white"
                  >
                    <option value="Free">Free</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                    Billing Type
                  </label>
                  <select
                    value={grantBillingType}
                    onChange={(e) => setGrantBillingType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs font-bold text-[#071544] dark:text-white"
                  >
                    <option value="Complimentary">Complimentary (0 RWF)</option>
                    <option value="Complimentary trial">Complimentary Trial (0 RWF)</option>
                    <option value="Paid">Verified Paid</option>
                    <option value="Free">Free Tier</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={grantExpiry}
                  onChange={(e) => setGrantExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs text-[#071544] dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs text-[#071544] dark:text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
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
                <div key={plan.id} className="sapphire-analytics-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron text-base font-black text-[#071544] dark:text-[#9EDCFF]">
                      {plan.name}
                    </span>
                    <span className="text-[10px] font-orbitron px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 text-[#218DFF]">
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
                    <label className="text-[11px] font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
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
                      className="w-full px-3 py-2 rounded-xl bg-white/85 dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs text-[#071544] dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSavePricingPlan(plan)}
                    className="w-full btn-sapphire py-2 text-xs font-orbitron cursor-pointer"
                  >
                    Save {plan.tier} Tier
                  </button>
                </div>
              ))}
            </div>

            <div className="liquid-glass rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#218DFF]" />
                  <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
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
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
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
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 font-orbitron font-bold text-sm text-[#071544] dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                    Prize / Reward Title
                  </label>
                  <input
                    type="text"
                    value={platinumProgram.rewardTitle}
                    onChange={(e) =>
                      setPlatinumProgram({ ...platinumProgram, rewardTitle: e.target.value })
                    }
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
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
            className="liquid-glass rounded-3xl p-6 sm:p-8 max-w-3xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#218DFF]/20 text-[#218DFF] flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                  Platform Global Broadcast Banner
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Persisted in MongoDB and displayed across all business dashboards immediately.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                Broadcast Headline
              </label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                Announcement Message
              </label>
              <textarea
                rows={3}
                required
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
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
                className="px-4 py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-400/30 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Active Broadcast
              </button>
              <Link
                to="/dashboard"
                className="px-4 py-3 rounded-xl bg-white/60 dark:bg-white/10 text-xs font-semibold text-[#071544] dark:text-[#9EDCFF] no-underline"
              >
                Preview in Dashboard →
              </Link>
            </div>
          </form>
        )}

        {/* TAB 5: IMMUTABLE AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="liquid-glass rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                  Immutable Super Admin Audit Trail
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Every subscription grant, account suspension, role change, pricing update, and broadcast is logged permanently.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchAuditLogs}
                className="p-2.5 rounded-xl bg-white/80 dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-[#1045CA] dark:text-[#9EDCFF] cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-blue-200/60 dark:border-white/10 text-[11px] uppercase text-slate-500 dark:text-[#9EDCFF]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100/60 dark:divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/40 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {String(log.createdAt || '').slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#071544] dark:text-white">
                        {log.actorEmail}
                      </td>
                      <td className="py-2.5 px-3 text-[#1045CA] dark:text-[#9EDCFF]">
                        {log.targetEmail}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-300">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {log.reason || '—'}
                      </td>
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
