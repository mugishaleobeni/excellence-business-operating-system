import React, { useEffect, useState } from 'react'
import { ShieldCheck, FileText, Save, CheckCircle2, Info, Power, Mail, Receipt, Calculator, GitBranch, Lock } from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import { exbosApi } from '../../../utils/apiClient'
import { DEFAULT_RRA_TAX_PROFILE } from '../../../utils/rraTaxUtils'
import { readCachedTaxProfile, writeCachedTaxProfile } from '../../../utils/offlineStorage'

function getActiveTaxScope(branchId = 'main') {
  try {
    const raw = localStorage.getItem('exbos_user')
    const u = raw ? JSON.parse(raw) : null
    const base = String(u?.ownerScopeKey || u?.email || '').trim().toLowerCase()
    const bid = String(branchId || 'main').trim()
    return base ? `${base}__${bid}` : ''
  } catch {
    return ''
  }
}

export default function TaxProfileSettingsView({ addToast, onProfileSaved }) {
  const { branches = [], activeBranchId = 'main', isBranchManager = false } = useExbos()
  const [selectedBranchId, setSelectedBranchId] = useState(isBranchManager ? activeBranchId : 'main')
  const [profile, setProfile] = useState(() => {
    const cached = readCachedTaxProfile(getActiveTaxScope(isBranchManager ? activeBranchId : 'main'))
    return cached ? { ...DEFAULT_RRA_TAX_PROFILE, ...cached } : { ...DEFAULT_RRA_TAX_PROFILE, branchId: 'main', taxMode: 'separate', rraBranchCode: '00' }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [digest, setDigest] = useState({ enabled: false, sendHour: '20:00', phone: '', lastSentAt: '' })
  const [savingDigest, setSavingDigest] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)

  const targetBranchId = isBranchManager ? activeBranchId : selectedBranchId
  const isCustomBranch = targetBranchId !== 'main'
  const isInheritingMain = isCustomBranch && profile.taxMode === 'inherit_main'

  useEffect(() => {
    let mounted = true
    const scope = getActiveTaxScope(targetBranchId)
    setLoading(true)
    Promise.all([
      exbosApi.getTaxProfile(targetBranchId).catch(() => null),
      exbosApi.getDigestSettings().catch(() => null)
    ])
      .then(([res, digRes]) => {
        const fetchedProfile = res?.data?.data || (res?.data && 'rraEnabled' in res.data ? res.data : null)
        if (mounted && res?.ok && fetchedProfile) {
          const merged = { ...DEFAULT_RRA_TAX_PROFILE, ...fetchedProfile }
          setProfile(merged)
          writeCachedTaxProfile(scope, merged)
        }
        const digData = digRes?.data?.data || digRes?.data
        if (mounted && digRes?.ok && digData) {
          setDigest({
            enabled: Boolean(digData.enabled),
            sendHour: digData.sendHour || '20:00',
            phone: digData.phone || '',
            lastSentAt: digData.lastSentAt || ''
          })
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [targetBranchId])

  const handleSaveDigest = async () => {
    setSavingDigest(true)
    try {
      const res = await exbosApi.updateDigestSettings(digest)
      if (!res?.ok) {
        if (res?.status !== 402) {
          addToast?.({ type: 'error', title: 'Could Not Save Digest', message: res?.data?.error || 'Try again.' })
        }
        return
      }
      addToast?.({
        type: 'success',
        title: 'Daily WhatsApp Digest Saved',
        message: digest.enabled ? `Scheduled daily at ${digest.sendHour}.` : 'Daily WhatsApp Digest turned off.'
      })
    } finally {
      setSavingDigest(false)
    }
  }

  const handleSendDigestNow = async () => {
    setSendingDigest(true)
    try {
      const res = await exbosApi.sendDigestNow({ phone: digest.phone })
      if (!res?.ok) {
        if (res?.status !== 402) {
          addToast?.({ type: 'error', title: 'Digest Send Failed', message: res?.data?.error || 'Try again.' })
        }
        return
      }
      addToast?.({
        type: 'success',
        title: 'Daily Digest Sent',
        message: `Today's sales, cash/MoMo, and stock summary was sent to ${digest.phone || 'your WhatsApp'}.`
      })
    } finally {
      setSendingDigest(false)
    }
  }

  const updateField = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (overrideProfile = null) => {
    if (isBranchManager) return
    const payload = { ...(overrideProfile || profile), branchId: targetBranchId }
    const previousProfile = profile
    setSaving(true)
    try {
      const res = await exbosApi.updateTaxProfile(payload)
      if (!res?.ok) {
        setProfile(previousProfile)
        addToast &&
          addToast({
            type: 'error',
            title: 'Could Not Save Tax Profile',
            message: res?.data?.error || res?.data?.message || 'Please try again.'
          })
        return
      }
      const savedData = res?.data?.data || (res?.data && 'rraEnabled' in res.data ? res.data : null)
      const saved = savedData ? { ...DEFAULT_RRA_TAX_PROFILE, ...savedData } : payload
      setProfile(saved)
      writeCachedTaxProfile(getActiveTaxScope(targetBranchId), saved)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('exbos:tax-profile-updated', { detail: saved }))
      }
      onProfileSaved && onProfileSaved(saved)
      addToast &&
        addToast({
          type: 'success',
          title: saved.rraEnabled ? 'RRA Tax Profile Saved' : 'RRA Tax Tracking Turned Off',
          message: saved.rraEnabled
            ? 'Your Rwanda Revenue Authority tax settings are active across reports and receipts.'
            : 'RRA fields are now hidden so your daily POS and receipts stay uncluttered.'
        })
    } catch (err) {
      setProfile(previousProfile)
      addToast &&
        addToast({
          type: 'error',
          title: 'Could Not Save Tax Profile',
          message: err?.message || 'Please try again.'
        })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleMaster = () => {
    const next = { ...profile, rraEnabled: !profile.rraEnabled }
    setProfile(next)
    handleSave(next)
  }

  if (loading) {
    return (
      <div className="exbos-glass-card p-8 text-center text-slate-300 text-sm">
        Loading RRA Tax &amp; EBM settings...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Master Opt-In / Opt-Out Card */}
      <div className="exbos-glass-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-orbitron uppercase font-bold text-[#218DFF]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Rwanda Revenue Authority (RRA) Compliance</span>
            </span>
            <h2 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1">
              RRA Tax &amp; EBM Profile
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Optional module for Rwandan businesses preparing VAT (18%), 3% Turnover Tax, or EBM receipt reconciliation.
              If you are not ready for RRA tax tracking yet, simply leave it OFF.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleMaster}
            disabled={saving || isBranchManager || isInheritingMain}
            className={`px-4 py-3 rounded-2xl border font-orbitron text-xs font-bold flex items-center gap-2.5 transition cursor-pointer shrink-0 disabled:opacity-50 ${
              profile.rraEnabled
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Power className={`w-4 h-4 ${profile.rraEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{profile.rraEnabled ? 'RRA Tracking: ENABLED' : 'RRA Tracking: OFF (Not Ready)'}</span>
          </button>
        </div>

        {/* Multi-Branch TIN & Tax Mode Controller */}
        {!isBranchManager && branches.length > 1 && (
          <div className="p-4 rounded-2xl bg-[#03091F]/70 border border-[#218DFF]/30 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-[#9EDCFF] font-bold">
                <GitBranch className="w-4 h-4 shrink-0" />
                <span>Configure Tax &amp; TIN Per Branch</span>
              </div>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-white font-semibold cursor-pointer"
              >
                <option value="main">Main HQ (Default TIN)</option>
                {branches
                  .filter((b) => !b.isMain && b.id !== 'main')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      Branch: {b.name}
                    </option>
                  ))}
              </select>
            </div>

            {isCustomBranch && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...profile, taxMode: 'inherit_main' }
                    setProfile(next)
                    handleSave(next)
                  }}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    isInheritingMain
                      ? 'bg-[#218DFF]/20 border-[#218DFF] text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <div className="font-bold">Inherit Main HQ TIN &amp; Tax Regime</div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Same company TIN, separate RRA Branch Code (e.g. 01, 02).
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...profile, taxMode: 'separate' }
                    setProfile(next)
                    handleSave(next)
                  }}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    !isInheritingMain
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <div className="font-bold">Separate Branch TIN &amp; Tax Regime</div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Independent 9-digit TIN &amp; VAT/Turnover regime for this branch.
                  </p>
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-300 font-semibold">RRA EBM Branch Code:</label>
                <input
                  type="text"
                  maxLength={6}
                  value={profile.rraBranchCode || (isCustomBranch ? '01' : '00')}
                  onChange={(e) => updateField('rraBranchCode', e.target.value)}
                  placeholder="00"
                  className="w-20 px-2.5 py-1 rounded-lg bg-[#071644] border border-white/20 text-white font-mono text-xs"
                />
              </div>
              {isInheritingMain && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#218DFF] text-white font-bold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Branch Code'}
                </button>
              )}
            </div>
          </div>
        )}

        {isBranchManager && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center gap-2.5 text-xs text-amber-200">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Viewing your branch&apos;s RRA tax configuration (Read-Only). Only the Business Owner can modify TIN or Tax Regime settings.
            </span>
          </div>
        )}

        {isInheritingMain ? (
          <div className="p-5 rounded-2xl bg-[#03091F]/60 border border-[#218DFF]/30 flex items-start gap-3.5 text-xs text-slate-300">
            <Info className="w-5 h-5 text-[#9EDCFF] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">
                Inheriting Main HQ RRA Profile (Branch Code: {profile.rraBranchCode || '01'})
              </p>
              <p>
                Effective TIN: <strong className="text-white font-mono">{profile.tin || 'Not set on Main HQ'}</strong> ·
                Status: <strong className="text-emerald-300">{profile.rraEnabled ? 'ENABLED' : 'OFF'}</strong> ·
                Regime: <strong className="text-white">{profile.regime === 'vat_18' ? '18% VAT' : profile.regime === 'exempt' ? 'Exempt' : '3% Turnover'}</strong>.
                Switch to <strong>Separate Branch TIN</strong> above if this branch has its own legal 9-digit TIN.
              </p>
            </div>
          </div>
        ) : !profile.rraEnabled ? (
          <div className="p-5 rounded-2xl bg-[#03091F]/60 border border-white/10 flex items-start gap-3.5">
            <Info className="w-5 h-5 text-[#9EDCFF] shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-slate-300">
              <p className="font-bold text-white text-sm">RRA Tax Tracking is currently turned OFF</p>
              <p>
                Your POS sales, purchases, expenses, and receipts remain 100% simple with zero extra TIN or EBM fields.
                Whenever your business registers with RRA or wants to prepare monthly VAT / 3% Turnover declarations,
                click <strong>RRA Tracking: OFF</strong> above to activate it anytime.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business TIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#9EDCFF]" />
                  <span>Business TIN (9-Digit RRA Number)</span>
                </label>
                <input
                  type="text"
                  maxLength={9}
                  value={profile.tin}
                  onChange={(e) => updateField('tin', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="e.g. 102345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-[#218DFF]"
                />
                <p className="text-[11px] text-slate-400">
                  {profile.tin.length === 9 ? (
                    <span className="text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid 9-digit TIN format
                    </span>
                  ) : (
                    'Enter your 9-digit RRA Taxpayer Identification Number.'
                  )}
                </p>
              </div>

              {/* Tax Regime */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[#9EDCFF]" />
                  <span>RRA Taxpayer Regime</span>
                </label>
                <select
                  value={profile.regime}
                  onChange={(e) => updateField('regime', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-white text-sm focus:outline-none focus:border-[#218DFF]"
                >
                  <option value="turnover_3">Small Taxpayer — 3% Turnover Tax (Non-VAT)</option>
                  <option value="vat_18">VAT Registered — 18% Standard VAT</option>
                  <option value="exempt">Exempt / Non-Taxable Entity</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Businesses above 20M RWF annual turnover generally register for 18% VAT.
                </p>
              </div>

              {/* Pricing Mode (VAT only) */}
              {profile.regime === 'vat_18' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">Default Selling Price VAT Mode</label>
                  <select
                    value={profile.priceMode}
                    onChange={(e) => updateField('priceMode', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-white text-sm focus:outline-none focus:border-[#218DFF]"
                  >
                    <option value="inclusive">VAT-Inclusive Prices (Standard in Rwanda Retail)</option>
                    <option value="exclusive">VAT-Exclusive Prices (+18% Added on Top)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Inclusive splits 10,000 RWF into 8,475 RWF net + 1,525 RWF VAT automatically.
                  </p>
                </div>
              )}

              {/* Filing Frequency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">RRA Filing Frequency</label>
                <select
                  value={profile.filingFrequency}
                  onChange={(e) => updateField('filingFrequency', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-white text-sm focus:outline-none focus:border-[#218DFF]"
                >
                  <option value="monthly">Monthly (Due 15th of Following Month)</option>
                  <option value="quarterly">Quarterly (Small Taxpayer / IQP)</option>
                </select>
              </div>

              {/* Accountant Email */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#9EDCFF]" />
                  <span>Accountant / Tax Advisor Email (Optional)</span>
                </label>
                <input
                  type="email"
                  value={profile.accountantEmail}
                  onChange={(e) => updateField('accountantEmail', e.target.value)}
                  placeholder="accountant@yourfirm.rw"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-white text-sm focus:outline-none focus:border-[#218DFF]"
                />
                <p className="text-[11px] text-slate-400">
                  Used for 1-click delivery of your monthly RRA Tax-Ready Summary from the RRA Tax Center.
                </p>
              </div>
            </div>

            {/* Behavior Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  key: 'trackEbmNumbers',
                  label: 'Track EBM Receipt #',
                  desc: 'Show optional EBM & Customer/Supplier TIN fields in modals'
                },
                {
                  key: 'showOnReceipts',
                  label: 'Print TIN & VAT on Receipts',
                  desc: 'Include Business TIN and VAT breakdown on invoices & links'
                },
                {
                  key: 'trackWithholdingTax',
                  label: 'Track 15% Withholding Tax',
                  desc: 'Estimate WHT on professional, rent & consulting expenses'
                }
              ].map((item) => {
                const active = Boolean(profile[item.key])
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => updateField(item.key, !active)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      active
                        ? 'bg-[#218DFF]/15 border-[#218DFF]/50 text-white'
                        : 'bg-[#03091F]/60 border-white/10 text-slate-400 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{item.label}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-orbitron font-black ${
                          active ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {active ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300/80 mt-1 leading-snug">{item.desc}</p>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#0055FF] hover:brightness-110 text-white text-xs font-orbitron font-bold flex items-center gap-2 shadow-lg shadow-[#218DFF]/25 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save RRA Tax Profile'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Automated Daily Owner WhatsApp Digest Card */}
      <div className="exbos-glass-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-orbitron uppercase font-bold text-emerald-300">
              Executive End-of-Day Automation (Bronze+)
            </span>
            <h3 className="font-orbitron text-lg font-extrabold text-white mt-0.5">
              Automated Daily Owner WhatsApp Digest
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Receive an automatic daily WhatsApp summary of Total Sales, Cash vs MoMo, Expenses, Net Cashflow, Low Stock, and Expiring Items.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-white cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={digest.enabled}
              onChange={(e) => setDigest((p) => ({ ...p, enabled: e.target.checked }))}
            />
            <span>{digest.enabled ? 'Daily Digest: ON' : 'Daily Digest: OFF'}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-200 block mb-1">Owner WhatsApp Number</label>
            <input
              type="tel"
              value={digest.phone}
              onChange={(e) => setDigest((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+250788..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-white"
            />
          </div>
          <div>
            <label className="font-bold text-slate-200 block mb-1">Daily Send Time</label>
            <input
              type="time"
              value={digest.sendHour}
              onChange={(e) => setDigest((p) => ({ ...p, sendHour: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={sendingDigest}
            onClick={handleSendDigestNow}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold cursor-pointer"
          >
            {sendingDigest ? 'Sending...' : 'Send Today\'s Digest Now'}
          </button>
          <button
            type="button"
            disabled={savingDigest}
            onClick={handleSaveDigest}
            className="px-4 py-2 rounded-xl bg-[#218DFF] hover:bg-[#197be6] text-white text-xs font-orbitron font-bold cursor-pointer"
          >
            {savingDigest ? 'Saving...' : 'Save Digest Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

