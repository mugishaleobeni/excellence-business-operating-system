import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import { formatRWF, amountToWords } from '../utils/currencyWords'
import MoneyInput from '../components/common/MoneyInput'
import PublicNavbar from '../components/layout/PublicNavbar'
import {
  ShieldCheck,
  Crown,
  Users,
  Gift,
  Megaphone,
  Image,
  Calculator,
  TrendingUp,
  CheckCircle2,
  Plus,
  Building2,
  ArrowUpRight,
  Sliders
} from 'lucide-react'

export default function SuperAdminPage() {
  const {
    language,
    pricingPlans,
    setPricingPlans,
    platinumProgram,
    setPlatinumProgram,
    businesses,
    setBusinesses,
    superAdminBroadcast,
    setSuperAdminBroadcast,
    architectures,
    setArchitectures,
    financialTools,
    setFinancialTools
  } = useExbos()

  const [activeTab, setActiveTab] = useState('pricing')
  const [savedToast, setSavedToast] = useState(null)

  // Grant Complimentary Access / Edit Subscription Modal State
  const [selectedBizId, setSelectedBizId] = useState(businesses[0]?.id || 'BIZ-1001')
  const [grantPlan, setGrantPlan] = useState('Gold')
  const [grantBillingType, setGrantBillingType] = useState('Complimentary')
  const [grantExpiry, setGrantExpiry] = useState('2027-12-31')
  const [grantReason, setGrantReason] = useState('Strategic SME Partner Complimentary Grant')

  // Broadcast Editor State
  const [broadcastTitle, setBroadcastTitle] = useState(
    superAdminBroadcast?.title || 'Scheduled Night Maintenance Notice'
  )
  const [broadcastMsg, setBroadcastMsg] = useState(
    superAdminBroadcast?.message ||
      'From 01:00 to 02:00 at night the system will undergo database maintenance.'
  )

  const showNotice = (msg) => {
    setSavedToast(msg)
    setTimeout(() => setSavedToast(null), 4000)
  }

  const handlePlanPriceChange = (planId, newPrice) => {
    setPricingPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, priceRWF: Number(newPrice) || 0 } : p))
    )
    showNotice('Published new plan pricing version. Public Landing Page & Registration updated live!')
  }

  const handleApplySubscriptionChange = (e) => {
    e.preventDefault()
    const planPrice =
      pricingPlans.find((p) => p.tier === grantPlan)?.priceRWF || 0
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id !== selectedBizId) return b
        return {
          ...b,
          plan: grantPlan,
          billingType: grantBillingType,
          status: grantBillingType === 'Complimentary trial' ? 'Expires in 14 days' : 'Active',
          // Section 8.2: Never record complimentary access as a fake paid transaction
          monthlySpendRWF: grantBillingType === 'Paid' ? planPrice : 0,
          expiryDate: grantExpiry,
          auditNote: `[Super Admin Audit · ${new Date().toISOString().slice(0, 10)}] ${grantReason}`
        }
      })
    )
    showNotice(
      `Updated ${selectedBizId} to ${grantPlan} (${grantBillingType}) with verified audit record.`
    )
  }

  const handlePublishBroadcast = (e) => {
    e.preventDefault()
    setSuperAdminBroadcast({
      id: `ADV-${Date.now()}`,
      title: broadcastTitle,
      message: broadcastMsg,
      active: true,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      author: 'Platform Super Administrator'
    })
    showNotice('Broadcast published! Every business will now see this alert on login & in notifications.')
  }

  const handleArchMediaUpdate = (archId, field, value) => {
    setArchitectures((prev) =>
      prev.map((a) => (a.id === archId ? { ...a, [field]: value } : a))
    )
    showNotice('Updated Business Architecture Showcase media on Landing Page.')
  }

  // Revenue Analytics (Separating Paid MRR from Complimentary Grants — Section 8.1 & 8.2)
  const paidBusinesses = businesses.filter((b) => b.billingType === 'Paid')
  const complimentaryBusinesses = businesses.filter((b) =>
    b.billingType.toLowerCase().includes('complimentary')
  )
  const monthlyRecurringRevenue = paidBusinesses.reduce(
    (sum, b) => sum + (Number(b.monthlySpendRWF) || 0),
    0
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#edf4ff] dark:bg-[#03091F]">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-20 space-y-8">
        {/* Top Super Admin Header */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#071544] via-[#0A2786] to-[#1045CA] text-white border border-[#9EDCFF]/45 shadow-sapphire-glow flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-[#9EDCFF]/40 text-xs font-orbitron text-[#9EDCFF]">
              <ShieldCheck className="w-4 h-4 text-[#9EDCFF]" />
              <span>PROTECTED PLATFORM SUPER ADMINISTRATOR WORKSPACE</span>
            </span>
            <h1 className="font-orbitron text-2xl sm:text-4xl font-extrabold">
              Subscription, Pricing, Complimentary Access &amp; Broadcast Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">
              Manage Forever Free, Bronze, Silver, Gold &amp; Platinum referral plans, grant audited complimentary subscriptions without fake payments, update architecture showcase media, and broadcast platform notices.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-[#03091F]/75 border border-[#9EDCFF]/30 text-center">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]">Live Companies</div>
              <div className="font-orbitron text-2xl font-black text-white">{businesses.length}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#03091F]/75 border border-[#9EDCFF]/30 text-center">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]">Verified Paid MRR</div>
              <div className="font-orbitron text-lg font-black text-emerald-400">
                {formatRWF(monthlyRecurringRevenue)}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#03091F]/75 border border-[#9EDCFF]/30 text-center">
              <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]">Complimentary</div>
              <div className="font-orbitron text-2xl font-black text-[#9EDCFF]">
                {complimentaryBusinesses.length}
              </div>
            </div>
          </div>
        </div>

        {savedToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'pricing', label: '1. Pricing Plans & Platinum Referral', icon: Crown },
            { id: 'subscriptions', label: '2. Customer Subscriptions & Complimentary Access', icon: Users },
            { id: 'broadcast', label: '3. Platform Broadcast Advertisement', icon: Megaphone },
            { id: 'media', label: '4. Architecture Showcase Media & Tools', icon: Image }
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

        {/* TAB 1: PRICING PLAN MANAGEMENT & PLATINUM REFERRAL */}
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
                    onChange={(v) => handlePlanPriceChange(plan.id, v)}
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
                </div>
              ))}
            </div>

            {/* Category 5: Platinum / Diamond Referral Configuration */}
            <div className="liquid-glass rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#218DFF]" />
                <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                  5. Platinum / Diamond Referral Program Rules
                </h3>
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
                    Prize / Reward Given to Qualified User (e.g. Discount on <span className="font-pylarix">PYLARIX</span> Products)
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

        {/* TAB 2: CUSTOMER SUBSCRIPTIONS & COMPLIMENTARY ACCESS (Section 8.2 & 8.4) */}
        {activeTab === 'subscriptions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 liquid-glass rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                    Customer Subscription &amp; Branch Performance Matrix (Section 8.2 &amp; 8.4)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Subscription tier is strictly separated from billing type so complimentary access never creates fake payment records.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {businesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="p-4 rounded-2xl bg-white/80 dark:bg-[#071544]/75 border border-blue-200/70 dark:border-[#9EDCFF]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="font-orbitron text-sm text-[#071544] dark:text-white">
                          {biz.name}
                        </strong>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 text-[#1045CA] dark:text-[#9EDCFF] font-orbitron font-bold">
                          Plan: {biz.plan}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold ${
                            biz.billingType === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : biz.billingType.includes('Complimentary')
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          Billing: {biz.billingType}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-300">
                        Owner: {biz.owner} ({biz.email}) · Active Branches: <strong>{biz.branches}</strong> · Expiry: {biz.expiryDate}
                      </div>
                      <div className="text-[11px] text-[#1045CA] dark:text-[#9EDCFF]/85 italic">
                        Audit: {biz.auditNote}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-orbitron text-sm font-extrabold text-[#071544] dark:text-white">
                        {formatRWF(biz.monthlySpendRWF)} / mo
                      </div>
                      <span className="text-[11px] text-emerald-500 font-semibold">{biz.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Grant Complimentary or Paid Access Form */}
            <form
              onSubmit={handleApplySubscriptionChange}
              className="lg:col-span-4 sapphire-analytics-card p-6 space-y-4 self-start"
            >
              <span className="text-xs font-orbitron uppercase text-[#218DFF] font-bold">
                Section 8.2 · Administrative Access Control
              </span>
              <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                Assign Plan or Complimentary Access
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                  Select Business
                </label>
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs font-bold text-[#071544] dark:text-white"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {b.name}
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
                    <option value="Complimentary trial">Complimentary Trial (14d)</option>
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
                  type="text"
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

              <button type="submit" className="w-full btn-sapphire py-3 text-xs font-orbitron">
                Apply Access &amp; Record Audit Entry
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SUPER ADMIN ADVERTISEMENT / BROADCAST (Section 8.5) */}
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
                  Section 8.5 · Super Admin Platform Broadcast Advertisement
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  When published, every business sees this notice inside their Dashboard notifications and top banner when they log in.
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
                Announcement Message (Sent to All Businesses)
              </label>
              <textarea
                rows={3}
                required
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" className="btn-sapphire px-6 py-3 text-xs font-orbitron">
                Publish to All Business Dashboards
              </button>
              <Link
                to="/dashboard"
                className="px-4 py-3 rounded-xl bg-white/60 dark:bg-white/10 text-xs font-semibold text-[#071544] dark:text-[#9EDCFF] no-underline"
              >
                Preview in Business Dashboard →
              </Link>
            </div>
          </form>
        )}

        {/* TAB 4: ARCHITECTURE SHOWCASE MEDIA & FINANCIAL TOOLS ADMIN */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="liquid-glass rounded-3xl p-6 space-y-4">
              <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                Landing Page Business Architecture Background Image &amp; Video Manager (Section 2.3)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {architectures.map((arch) => (
                  <div
                    key={arch.id}
                    className="p-4 rounded-2xl bg-white/75 dark:bg-[#071544]/75 border border-blue-200/60 dark:border-[#9EDCFF]/20 space-y-2.5 text-xs"
                  >
                    <div className="font-orbitron font-bold text-sm text-[#218DFF]">
                      {arch.number} — {arch.name}
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase opacity-75">
                        Background Image URL
                      </label>
                      <input
                        type="url"
                        value={arch.image}
                        onChange={(e) => handleArchMediaUpdate(arch.id, 'image', e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#03091F] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs text-[#071544] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase opacity-75">
                        Optional MP4 Video Background URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/entrepreneur-workshop.mp4"
                        value={arch.videoUrl || ''}
                        onChange={(e) => handleArchMediaUpdate(arch.id, 'videoUrl', e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#03091F] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs text-[#071544] dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3.4 Financial Calculators Toggle */}
            <div className="liquid-glass rounded-3xl p-6 space-y-4">
              <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                Financial Planning Tools Administration (Section 3.4)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {financialTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-4 rounded-2xl bg-white/75 dark:bg-[#071544]/75 border border-[#9EDCFF]/20 flex flex-col justify-between gap-3 text-xs"
                  >
                    <div>
                      <strong className="font-orbitron block text-[#071544] dark:text-white">
                        {tool.shortName}
                      </strong>
                      <p className="text-[11px] opacity-75 mt-1">{tool.tagline}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFinancialTools((prev) =>
                          prev.map((t) =>
                            t.id === tool.id ? { ...t, enabled: !t.enabled } : t
                          )
                        )
                      }
                      className={`py-2 rounded-xl font-orbitron text-[10px] font-bold cursor-pointer border ${
                        tool.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
                          : 'bg-rose-500/20 text-rose-400 border-rose-400/40'
                      }`}
                    >
                      {tool.enabled ? '✓ Enabled on Public Site' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
