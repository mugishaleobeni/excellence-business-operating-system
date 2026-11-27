import React, { useEffect, useState } from 'react'
import { ShieldCheck, FileText, Save, CheckCircle2, Info, Power, Mail, Receipt, Calculator } from 'lucide-react'
import { exbosApi } from '../../../utils/apiClient'
import { DEFAULT_RRA_TAX_PROFILE } from '../../../utils/rraTaxUtils'

export default function TaxProfileSettingsView({ addToast, onProfileSaved }) {
  const [profile, setProfile] = useState(DEFAULT_RRA_TAX_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    exbosApi
      .getTaxProfile()
      .then((res) => {
        const fetchedProfile = res?.data?.data || (res?.data && 'rraEnabled' in res.data ? res.data : null)
        if (mounted && res?.ok && fetchedProfile) {
          setProfile({ ...DEFAULT_RRA_TAX_PROFILE, ...fetchedProfile })
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const updateField = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (overrideProfile = null) => {
    const payload = overrideProfile || profile
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
            disabled={saving}
            className={`px-4 py-3 rounded-2xl border font-orbitron text-xs font-bold flex items-center gap-2.5 transition cursor-pointer shrink-0 ${
              profile.rraEnabled
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Power className={`w-4 h-4 ${profile.rraEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{profile.rraEnabled ? 'RRA Tracking: ENABLED' : 'RRA Tracking: OFF (Not Ready)'}</span>
          </button>
        </div>

        {!profile.rraEnabled ? (
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
    </div>
  )
}

