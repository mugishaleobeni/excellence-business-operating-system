import React, { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  ShieldCheck,
  Phone,
  ArrowRight,
  Lock,
  Clock,
  AlertTriangle,
  X,
  CreditCard
} from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import { apiClient } from '../../../utils/apiClient'
import {
  getEffectivePlanForUser,
  getPlanLimitsForUser
} from '../../../utils/planEntitlements'

function UsageMeter({ label, used = 0, limit = null }) {
  const isUnlimited = limit === null || limit === undefined
  const pct = isUnlimited ? 15 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100))
  const isNearLimit = !isUnlimited && pct >= 85
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-300 font-semibold">{label}</span>
        <span className={`font-orbitron font-bold ${isNearLimit ? 'text-amber-300' : 'text-white'}`}>
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNearLimit
              ? 'bg-gradient-to-r from-amber-400 to-rose-500'
              : 'bg-gradient-to-r from-[#218DFF] to-emerald-400'
          }`}
          style={{ width: `${Math.max(used > 0 ? 6 : 0, pct)}%` }}
        />
      </div>
    </div>
  )
}

export default function SubscriptionBillingView({
  user = {},
  currentArch = {},
  addToast
}) {
  const { updateUserProfile } = useExbos()
  const effPlanKey = getEffectivePlanForUser(user)
  const currentPlan = effPlanKey.charAt(0).toUpperCase() + effPlanKey.slice(1)
  const limits = getPlanLimitsForUser(user)
  const usage = user?.planUsage || {
    branchesUsed: 1,
    staffUsed: 0,
    productsUsed: 0,
    monthlySalesUsed: 0
  }

  const [upgradeModalPlan, setUpgradeModalPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('MTN MoMo Business')
  const [paymentReference, setPaymentReference] = useState('')
  const [payerPhone, setPayerPhone] = useState(user?.phone || '')
  const [submitting, setSubmitting] = useState(false)
  const [myRequests, setMyRequests] = useState([])

  const loadRequests = useCallback(async () => {
    const res = await apiClient.getMySubscriptionRequests()
    if (res.ok && Array.isArray(res.data?.data?.requests)) {
      setMyRequests(res.data.data.requests)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const plans = [
    {
      id: 'Free',
      name: 'Forever Free',
      priceRWF: '0',
      period: 'Forever',
      description: 'Solo trader core ledgers to get off paper notebooks.',
      features: [
        '1 Branch (Main HQ)',
        'Owner Login Only',
        'Up to 100 Catalog Items',
        'Up to 150 Sales / Month',
        'Basic Cash + MoMo Summary'
      ],
      badge: 'Starter'
    },
    {
      id: 'Bronze',
      name: 'Bronze Growth',
      priceRWF: '10,000',
      period: '/ month',
      description: 'Ideal for busy single-shop retail, salons & workshops.',
      features: [
        'Up to 2 Staff Logins',
        'Up to 1,000 Catalog Items',
        'Unlimited Monthly Sales',
        'WhatsApp Receipts & Public Links',
        'Gmail Financial Reports'
      ],
      badge: 'Popular'
    },
    {
      id: 'Silver',
      name: 'Silver Enterprise',
      priceRWF: '20,000',
      period: '/ month',
      description: 'Full multi-branch control, Hybrid mode & Google Drive Vault.',
      features: [
        'Up to 5 Branches + Stock Transfers',
        'Up to 10 Staff + Custom Permissions',
        'Unlimited Products & Sales',
        'Google Drive Vault & Hybrid Mode',
        'Branch Freeze & Priority Support'
      ],
      badge: 'Recommended'
    },
    {
      id: 'Gold',
      name: 'Gold Corporate',
      priceRWF: '35,000',
      period: '/ month',
      description: 'Unlimited branches, unlimited staff & dedicated support.',
      features: [
        'Unlimited Branches & HQ Analytics',
        'Unlimited Staff & Manager Locks',
        'All 6 Architectures + Hybrid',
        'Automated Backups & Audit Trail',
        '24/7 Dedicated Account Manager'
      ],
      badge: 'Full Power'
    }
  ]

  const handleSelectPlan = async (planObj) => {
    if (planObj.id === currentPlan) return
    if (planObj.id === 'Free') {
      if (updateUserProfile) {
        await updateUserProfile({ plan: 'Free', planTier: 'Free' })
      }
      addToast?.({
        type: 'info',
        title: 'Switched to Forever Free',
        message: 'Your account is now on the Forever Free tier. No existing data was deleted.'
      })
      return
    }
    // Paid plans require payment reference submission (verified by Super Admin)
    setUpgradeModalPlan(planObj)
  }

  const handleSubmitUpgradeRequest = async (e) => {
    e.preventDefault()
    if (!upgradeModalPlan || !paymentReference.trim()) return
    setSubmitting(true)
    const res = await apiClient.requestSubscriptionUpgrade({
      plan: upgradeModalPlan.id,
      paymentMethod,
      paymentReference: paymentReference.trim(),
      payerPhone: payerPhone.trim()
    })
    setSubmitting(false)

    if (!res.ok) {
      addToast?.({
        type: 'error',
        title: 'Submission Failed',
        message: res.error || 'Could not submit upgrade request.'
      })
      return
    }

    addToast?.({
      type: 'success',
      title: 'Payment Verification Submitted',
      message:
        res.data?.message ||
        `Your ${upgradeModalPlan.name} request is pending Super Admin verification.`
    })
    setUpgradeModalPlan(null)
    setPaymentReference('')
    loadRequests()
  }

  return (
    <div className="space-y-6">
      {/* Expired Subscription Renewal Notice */}
      {user?.subscriptionExpired && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
          <div>
            <strong>Subscription Expired:</strong> Your paid plan expired and your workspace safely fell back to <strong>Forever Free</strong> with zero data loss. Renew below to restore full limits.
          </div>
        </div>
      )}

      {/* Active Subscription & Live Usage Banner */}
      <div className="exbos-glass-card p-6 relative overflow-hidden space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-orbitron font-bold text-[10px] border border-emerald-500/30 uppercase">
                Active · {user?.billingType || 'Standard'}
              </span>
              <span className="text-xs text-slate-400">Architecture: {currentArch.name}</span>
              {user?.subscriptionExpiry && (
                <span className="text-xs text-[#9EDCFF]">
                  · Valid until {user.subscriptionExpiry}
                </span>
              )}
            </div>
            <h2 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white">
              {currentPlan} Subscription Plan
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Pay via MTN MoMo Business, Airtel Money, or Bank Transfer. Instant activation upon Super Admin verification.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF] block">
              Official Billing Helpline
            </span>
            <a
              href="https://wa.me/250781963981"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-sm font-bold hover:underline mt-0.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+250 781 963 981</span>
            </a>
          </div>
        </div>

        {/* Live Plan Usage Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <UsageMeter label="Branches" used={usage.branchesUsed ?? 1} limit={limits.maxBranches} />
          <UsageMeter label="Staff Logins" used={usage.staffUsed ?? 0} limit={limits.maxStaff} />
          <UsageMeter label="Catalog Items" used={usage.productsUsed ?? 0} limit={limits.maxProducts} />
          <UsageMeter label="Monthly Sales" used={usage.monthlySalesUsed ?? 0} limit={limits.maxMonthlySales} />
        </div>
      </div>

      {/* Pricing Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => {
          const isCurrent = currentPlan.toLowerCase() === p.id.toLowerCase()
          const hasPending = myRequests.some(
            (r) => r.status === 'pending' && String(r.requestedPlan).toLowerCase() === p.id.toLowerCase()
          )
          return (
            <div
              key={p.id}
              className={`exbos-glass-card p-5 rounded-2xl flex flex-col justify-between transition-all ${
                isCurrent ? 'ring-2 ring-[#218DFF] bg-[#218DFF]/10' : 'hover:bg-white/[0.04]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-orbitron font-bold text-white uppercase">
                    {p.name}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? 'bg-[#218DFF] text-white'
                        : hasPending
                        ? 'bg-amber-500/25 text-amber-200'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {isCurrent ? 'Current' : hasPending ? 'Pending' : p.badge}
                  </span>
                </div>

                <div className="my-3">
                  <span className="font-orbitron font-extrabold text-2xl text-white">
                    {p.priceRWF} RWF
                  </span>
                  <span className="text-xs text-slate-400 ml-1">{p.period}</span>
                </div>

                <p className="text-[11px] text-slate-300 mb-4">{p.description}</p>

                <div className="space-y-2 border-t border-white/10 pt-3">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-white/10">
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(p)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : 'btn-sapphire-clean cursor-pointer'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Current Plan</span>
                    </>
                  ) : hasPending ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Verification Pending</span>
                    </>
                  ) : (
                    <>
                      <span>{p.id === 'Free' ? 'Switch to Free' : `Upgrade to ${p.id}`}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Upgrade Requests */}
      {myRequests.length > 0 && (
        <div className="exbos-glass-card p-5 rounded-2xl space-y-3">
          <h3 className="font-orbitron text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#9EDCFF]" />
            <span>Your Subscription Upgrade Requests</span>
          </h3>
          <div className="space-y-2">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-white">{req.requestedPlan} Plan</span>{' '}
                  <span className="text-slate-400">
                    ({Number(req.amountRWF || 0).toLocaleString()} RWF · {req.paymentMethod} · Ref:{' '}
                    <code className="text-[#9EDCFF]">{req.paymentReference}</code>)
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    req.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : req.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-200'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rwanda Payment & Upgrade Verification Modal */}
      {upgradeModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#071544] border border-[#9EDCFF]/30 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setUpgradeModalPlan(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-orbitron uppercase text-[#9EDCFF] font-bold">
                <Lock className="w-3 h-3" /> Verified Plan Upgrade
              </span>
              <h3 className="font-orbitron font-bold text-lg mt-1">
                Upgrade to {upgradeModalPlan.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Send <strong>{upgradeModalPlan.priceRWF} RWF</strong> via MTN MoMo Business (
                <code className="text-[#9EDCFF]">+250 781 963 981</code>) or Bank Transfer, then paste your transaction reference below for instant activation.
              </p>
            </div>

            <form onSubmit={handleSubmitUpgradeRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Payment Channel
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F] border border-white/15 text-white outline-none"
                >
                  <option value="MTN MoMo Business">MTN MoMo Business (+250 781 963 981)</option>
                  <option value="Airtel Money">Airtel Money Rwanda</option>
                  <option value="Bank of Kigali Transfer">Bank of Kigali (BK) Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Transaction Reference / Receipt ID *
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. MP261122.1204.A9821"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white outline-none focus:border-[#218DFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Phone Number Used to Pay
                </label>
                <input
                  type="text"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="+250 788 000 000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white outline-none focus:border-[#218DFF]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setUpgradeModalPlan(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-sapphire-clean px-5 py-2 font-bold cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit for Activation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
