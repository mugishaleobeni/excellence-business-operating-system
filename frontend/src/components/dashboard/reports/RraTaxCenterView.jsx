import React, { useEffect, useState, useCallback } from 'react'
import {
  ShieldCheck,
  Download,
  Printer,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  FileSpreadsheet,
  Power,
  RefreshCw,
  Building2,
  Lock
} from 'lucide-react'
import { exbosApi } from '../../../utils/apiClient'
import { formatRWF } from '../../../utils/currencyWords'
import { DEFAULT_RRA_TAX_PROFILE, getNextRraDeadlines, openPrintableRraTaxPack } from '../../../utils/rraTaxUtils'
import { canUseFeature } from '../../../utils/planEntitlements'

function getPresetDates(preset) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const iso = (d) => d.toISOString().slice(0, 10)

  if (preset === 'last_month') {
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0)
    return { startDate: iso(start), endDate: iso(end) }
  }
  if (preset === 'this_quarter') {
    const qStartMonth = Math.floor(m / 3) * 3
    return { startDate: iso(new Date(y, qStartMonth, 1)), endDate: iso(now) }
  }
  if (preset === 'this_year') {
    return { startDate: iso(new Date(y, 0, 1)), endDate: iso(now) }
  }
  return { startDate: iso(new Date(y, m, 1)), endDate: iso(now) }
}

export default function RraTaxCenterView({ user, businessName, hideFinancials = false, addToast }) {
  const initialRange = getPresetDates('this_month')
  const [preset, setPreset] = useState('this_month')
  const [startDate, setStartDate] = useState(initialRange.startDate)
  const [endDate, setEndDate] = useState(initialRange.endDate)
  const [activeTab, setActiveTab] = useState('sales')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [accountantEmailInput, setAccountantEmailInput] = useState('')
  const [summary, setSummary] = useState(null)

  const hasExportAccess = canUseFeature(user, 'allowRraTaxPack')

  const loadSummary = useCallback(async (sDate, eDate) => {
    setLoading(true)
    try {
      const res = await exbosApi.getTaxSummary({ startDate: sDate, endDate: eDate })
      const summaryData = res?.data?.data || (res?.data && 'profile' in res.data ? res.data : null)
      if (res?.ok && summaryData) {
        setSummary(summaryData)
        if (summaryData.profile?.accountantEmail) {
          setAccountantEmailInput(summaryData.profile.accountantEmail)
        }
      } else if (!res?.ok) {
        addToast &&
          addToast({
            type: 'error',
            title: 'Failed to Load Tax Summary',
            message: res?.data?.error || res?.data?.message || 'Could not compute RRA tax ledger.'
          })
      }
    } catch (err) {
      addToast &&
        addToast({
          type: 'error',
          title: 'Failed to Load Tax Summary',
          message: err?.message || 'Could not compute RRA tax ledger.'
        })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadSummary(startDate, endDate)
  }, [startDate, endDate, loadSummary])

  const handlePresetChange = (nextPreset) => {
    setPreset(nextPreset)
    const range = getPresetDates(nextPreset)
    setStartDate(range.startDate)
    setEndDate(range.endDate)
  }

  const handleToggleRraEnabled = async () => {
    const currentProfile = summary?.profile || DEFAULT_RRA_TAX_PROFILE
    const nextEnabled = !currentProfile.rraEnabled
    try {
      const res = await exbosApi.updateTaxProfile({ ...currentProfile, rraEnabled: nextEnabled })
      if (!res?.ok) {
        addToast &&
          addToast({
            type: 'error',
            title: 'Update Failed',
            message: res?.data?.error || res?.data?.message || 'Could not update RRA status.'
          })
        return
      }
      const savedData = res?.data?.data || (res?.data && 'rraEnabled' in res.data ? res.data : null)
      const saved = savedData ? { ...DEFAULT_RRA_TAX_PROFILE, ...savedData } : { ...currentProfile, rraEnabled: nextEnabled }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('exbos:tax-profile-updated', { detail: saved }))
      }
      await loadSummary(startDate, endDate)
      addToast &&
        addToast({
          type: 'success',
          title: nextEnabled ? 'RRA Tax Tracking Activated' : 'RRA Tax Tracking Paused',
          message: nextEnabled
            ? 'You can now track TIN, VAT 18% / 3% Turnover, and export RRA Annexes.'
            : 'RRA tax fields are now hidden from your daily POS workflow.'
        })
    } catch (err) {
      addToast &&
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: err?.message || 'Could not update RRA status.'
        })
    }
  }

  const handleExportCsv = async (type) => {
    setExporting(type)
    try {
      await exbosApi.downloadTaxExport(type, { startDate, endDate })
      addToast &&
        addToast({
          type: 'success',
          title: 'RRA Export Downloaded',
          message: `Your ${type.replace('-', ' ')} CSV is ready for Excel / RRA e-Tax.`
        })
    } catch (err) {
      if (err?.status !== 402) {
        addToast &&
          addToast({
            type: 'error',
            title: 'Export Failed',
            message: err?.message || 'Could not generate CSV.'
          })
      }
    } finally {
      setExporting('')
    }
  }

  const handlePrintPack = () => {
    if (!hasExportAccess) {
      window.dispatchEvent(
        new CustomEvent('exbos:plan-limit', {
          detail: {
            feature: 'allowRraTaxPack',
            currentPlan: user?.plan || 'Free',
            requiredPlan: 'Bronze',
            message: 'Upgrade to Bronze or higher to print and export RRA Tax-Ready Packs.'
          }
        })
      )
      return
    }
    openPrintableRraTaxPack({
      businessName,
      profile: summary?.profile || DEFAULT_RRA_TAX_PROFILE,
      period: { startDate, endDate },
      totals: summary?.totals || {},
      warnings: summary?.readinessWarnings || []
    })
  }

  const handleSendToAccountant = async () => {
    const email = (accountantEmailInput || summary?.profile?.accountantEmail || '').trim()
    if (!email || !email.includes('@')) {
      addToast &&
        addToast({
          type: 'warning',
          title: 'Accountant Email Required',
          message: 'Enter your accountant email address first.'
        })
      return
    }
    setSendingEmail(true)
    try {
      const res = await exbosApi.sendTaxPackToAccountant({
        recipientEmail: email,
        startDate,
        endDate
      })
      if (!res?.ok) {
        if (res?.status !== 402) {
          addToast &&
            addToast({
              type: 'error',
              title: 'Email Failed',
              message: res?.data?.error || res?.data?.message || 'Could not send tax pack.'
            })
        }
        return
      }
      addToast &&
        addToast({
          type: 'success',
          title: 'Sent to Accountant',
          message: `RRA Tax-Ready Summary sent to ${email}.`
        })
    } catch (err) {
      if (err?.status !== 402) {
        addToast &&
          addToast({
            type: 'error',
            title: 'Email Failed',
            message: err?.message || 'Could not send tax pack.'
          })
      }
    } finally {
      setSendingEmail(false)
    }
  }

  const profile = summary?.profile || DEFAULT_RRA_TAX_PROFILE
  const totals = summary?.totals || {}
  const deadlines = summary?.deadlines || getNextRraDeadlines()
  const warnings = summary?.readinessWarnings || []
  const salesAnnex = summary?.salesAnnex || []
  const purchasesAnnex = summary?.purchasesAnnex || []
  const mask = (v) => (hideFinancials ? '••••••' : formatRWF(v || 0))

  return (
    <div className="space-y-5">
      {/* Top Status & User Opt-In / Opt-Out Bar */}
      <div className="exbos-glass-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-orbitron font-bold bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              RRA TAX-READY CENTER
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                profile.rraEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-slate-500/20 text-slate-300 border border-white/10'
              }`}
            >
              {profile.rraEnabled ? 'Active' : 'Optional · Currently OFF'}
            </span>
            {profile.tin && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white">
                TIN: {profile.tin}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300">
            {profile.rraEnabled
              ? `Regime: ${
                  profile.regime === 'vat_18'
                    ? 'VAT Registered (18%)'
                    : profile.regime === 'exempt'
                    ? 'Exempt / Non-VAT'
                    : 'Small Taxpayer (3% Turnover Tax)'
                } · Export RRA-formatted Sales & Purchases Annexes anytime.`
              : 'Not ready to file with RRA yet? Keep this OFF and ExBOS stays completely simple. Turn it ON whenever you are ready.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleRraEnabled}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              profile.rraEnabled
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/25'
                : 'bg-[#218DFF] border-[#218DFF] text-white hover:brightness-110'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{profile.rraEnabled ? 'Turn RRA OFF' : 'Enable RRA Tax Tracking'}</span>
          </button>
          <button
            type="button"
            onClick={() => loadSummary(startDate, endDate)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Period Filter + RRA Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 exbos-glass-card p-4 flex flex-wrap items-center gap-2.5">
          {[
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_quarter', label: 'This Quarter' },
            { id: 'this_year', label: 'This Year' }
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetChange(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                preset === p.id
                  ? 'bg-[#218DFF] text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPreset('custom')
                setStartDate(e.target.value)
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#03091F]/80 border border-white/15 text-white text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPreset('custom')
                setEndDate(e.target.value)
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#03091F]/80 border border-white/15 text-white text-xs"
            />
          </div>
        </div>

        <div className="exbos-glass-card p-4 flex items-center justify-between gap-3 border border-amber-400/20 bg-amber-500/5">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <div className="text-[10px] font-orbitron uppercase font-bold text-amber-300">
                Next RRA Filing Deadlines
              </div>
              <div className="text-xs text-white font-semibold">
                Monthly (15th): <span className="text-amber-200">{deadlines.nextMonthlyDeadline}</span> ({deadlines.daysUntilMonthly}d)
              </div>
              <div className="text-[11px] text-slate-300">
                Quarterly IQP: {deadlines.nextIqpDeadline} ({deadlines.daysUntilIqp}d)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Tax KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="exbos-glass-card p-4">
          <div className="text-[11px] uppercase font-bold text-slate-400">Total Gross Sales</div>
          <div className="text-xl font-orbitron font-extrabold text-white mt-1">{mask(totals.totalGrossSales)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{totals.salesCount || 0} recorded sales in period</div>
        </div>

        <div className="exbos-glass-card p-4">
          <div className="text-[11px] uppercase font-bold text-slate-400">
            {profile.regime === 'vat_18' ? 'Output VAT (18% Collected)' : 'Est. 3% Turnover Tax'}
          </div>
          <div className="text-xl font-orbitron font-extrabold text-[#9EDCFF] mt-1">
            {mask(profile.regime === 'vat_18' ? totals.outputVat : totals.turnoverTax3Percent)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {profile.regime === 'vat_18'
              ? `Taxable net: ${mask(totals.taxableSalesNet)}`
              : 'Small Taxpayer flat 3% estimate'}
          </div>
        </div>

        <div className="exbos-glass-card p-4">
          <div className="text-[11px] uppercase font-bold text-slate-400">Claimable Input VAT</div>
          <div className="text-xl font-orbitron font-extrabold text-emerald-300 mt-1">
            {mask(totals.claimableInputVat)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Non-claimable (missing TIN/EBM): {mask(totals.nonClaimableInputVat)}
          </div>
        </div>

        <div className="exbos-glass-card p-4 border border-[#218DFF]/30 bg-[#218DFF]/10">
          <div className="text-[11px] uppercase font-bold text-[#9EDCFF]">
            {profile.regime === 'vat_18' ? 'Net VAT Payable / (Credit)' : 'Estimated Net Profit'}
          </div>
          <div className="text-xl font-orbitron font-extrabold text-white mt-1">
            {mask(profile.regime === 'vat_18' ? totals.netVatPayable : totals.estimatedNetProfit)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            {profile.trackWithholdingTax
              ? `Est. 15% WHT: ${mask(totals.estimatedWht15Percent)}`
              : `Expenses & Purchases: ${mask(totals.totalPurchasesAndExpenses)}`}
          </div>
        </div>
      </div>

      {/* Pre-Filing Readiness Audit Checklist */}
      {warnings.length > 0 && (
        <div className="exbos-glass-card p-4 space-y-2">
          <div className="text-xs font-orbitron uppercase font-bold text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#9EDCFF]" />
            <span>Pre-Filing RRA Readiness Audit</span>
          </div>
          <div className="space-y-2">
            {warnings.map((w, idx) => (
              <div
                key={`${w.code}-${idx}`}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  w.severity === 'warning'
                    ? 'bg-amber-500/10 border-amber-400/30 text-amber-200'
                    : w.severity === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
                    : 'bg-[#218DFF]/10 border-[#218DFF]/30 text-[#9EDCFF]'
                }`}
              >
                {w.severity === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : w.severity === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* One-Click RRA Export Pack & Accountant Delivery */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-orbitron text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#9EDCFF]" />
              <span>One-Click RRA Tax-Ready Export Pack</span>
              {!hasExportAccess && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Lock className="w-3 h-3" /> Bronze+
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Download UTF-8 Excel-ready CSV files formatted for RRA e-Tax VAT Annexures or email directly to your accountant.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => handleExportCsv('sales-annex')}
            disabled={exporting === 'sales-annex'}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#0055FF] hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting === 'sales-annex' ? 'Exporting...' : 'RRA Sales Annex CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportCsv('purchases-annex')}
            disabled={exporting === 'purchases-annex'}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting === 'purchases-annex' ? 'Exporting...' : 'RRA Purchases / Input VAT CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportCsv('summary-csv')}
            disabled={exporting === 'summary-csv'}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tax Summary CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPack}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Accountant PDF Pack</span>
          </button>
        </div>

        {/* Send to Accountant Bar */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="email"
            value={accountantEmailInput}
            onChange={(e) => setAccountantEmailInput(e.target.value)}
            placeholder="Enter accountant email (e.g. accountant@firm.rw)"
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#03091F]/80 border border-white/15 text-white text-xs focus:outline-none focus:border-[#218DFF]"
          />
          <button
            type="button"
            onClick={handleSendToAccountant}
            disabled={sendingEmail}
            className="px-4 py-2 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/35 border border-indigo-400/40 text-indigo-100 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{sendingEmail ? 'Sending...' : 'Email Pack to Accountant'}</span>
          </button>
        </div>
      </div>

      {/* Itemized Tax Annex Tables */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === 'sales' ? 'bg-[#218DFF] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Sales Tax Annex ({salesAnnex.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === 'purchases' ? 'bg-[#218DFF] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Purchases &amp; Input VAT Annex ({purchasesAnnex.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'sales' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Customer / TIN</th>
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">EBM #</th>
                  <th className="py-2 pr-3 text-right">Net</th>
                  <th className="py-2 pr-3 text-right">VAT 18%</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {salesAnnex.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No sales recorded in this tax period.
                    </td>
                  </tr>
                ) : (
                  salesAnnex.slice(0, 100).map((row) => (
                    <tr key={row.id} className="hover:bg-white/5">
                      <td className="py-2.5 pr-3 text-slate-300 font-mono">{row.date}</td>
                      <td className="py-2.5 pr-3">
                        <div className="text-white font-semibold">{row.customerName}</div>
                        {row.customerTin && <div className="text-[10px] text-slate-400 font-mono">TIN: {row.customerTin}</div>}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-200">{row.item}</td>
                      <td className="py-2.5 pr-3 font-mono text-slate-300">{row.ebmNumber || '—'}</td>
                      <td className="py-2.5 pr-3 text-right text-slate-300">{mask(row.netAmount)}</td>
                      <td className="py-2.5 pr-3 text-right text-[#9EDCFF] font-semibold">{mask(row.vatAmount)}</td>
                      <td className="py-2.5 text-right text-white font-bold">{mask(row.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Supplier / TIN</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">EBM #</th>
                  <th className="py-2 pr-3 text-right">Input VAT</th>
                  <th className="py-2 pr-3 text-right">Total</th>
                  <th className="py-2 text-right">Claimable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {purchasesAnnex.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No purchases or expenses recorded in this tax period.
                    </td>
                  </tr>
                ) : (
                  purchasesAnnex.slice(0, 100).map((row) => (
                    <tr key={row.id} className="hover:bg-white/5">
                      <td className="py-2.5 pr-3 text-slate-300 font-mono">{row.date}</td>
                      <td className="py-2.5 pr-3">
                        <div className="text-white font-semibold">{row.supplierName}</div>
                        {row.supplierTin && <div className="text-[10px] text-slate-400 font-mono">TIN: {row.supplierTin}</div>}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">{row.type}</td>
                      <td className="py-2.5 pr-3 font-mono text-slate-300">{row.ebmNumber || '—'}</td>
                      <td className="py-2.5 pr-3 text-right text-emerald-300 font-semibold">{mask(row.vatAmount)}</td>
                      <td className="py-2.5 pr-3 text-right text-white font-bold">{mask(row.totalAmount)}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.claimable
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {row.claimable ? 'YES' : 'NO'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

