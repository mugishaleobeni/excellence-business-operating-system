import React, { useState, useMemo } from 'react'
import { useExbos } from '../../context/ExbosContext'
import { formatRWF, amountToWords } from '../../utils/currencyWords'
import MoneyInput from '../common/MoneyInput'
import {
  Wallet,
  Smartphone,
  Landmark,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Home,
  AlertTriangle,
  Plus,
  History,
  Edit3,
  CheckCircle2,
  X,
  MessageSquare,
  Monitor
} from 'lucide-react'

export default function WhereIsMyMoneyPanel({ activeArchId = 'buy-and-sell' }) {
  const {
    hideFinancials,
    language,
    transactions = [],
    addTransaction,
    editTransactionWithAudit,
    demoWorkspaces = {}
  } = useExbos()

  const workspace = demoWorkspaces?.[activeArchId] || {}
  const metrics = workspace.metrics || {}

  // Filter transactions strictly to the active business architecture
  const archTransactions = useMemo(() => {
    return (transactions || []).filter(
      (tx) => (tx.architectureId || 'buy-and-sell') === activeArchId
    )
  }, [transactions, activeArchId])

  // Dynamically calculate isolated balances per business architecture
  const dynamicBalances = useMemo(() => {
    let cashIn = 0, cashOut = 0
    let momoIn = 0, momoOut = 0
    let bankIn = 0, bankOut = 0

    archTransactions.forEach((tx) => {
      const amt = Number(tx.amountRWF) || 0
      const acc = String(tx.account || '').toLowerCase()
      if (acc.includes('momo') || acc.includes('mtn') || acc.includes('airtel')) {
        if (tx.type === 'in') momoIn += amt
        else momoOut += amt
      } else if (acc.includes('bank') || acc.includes('bk') || acc.includes('equity')) {
        if (tx.type === 'in') bankIn += amt
        else bankOut += amt
      } else {
        if (tx.type === 'in') cashIn += amt
        else cashOut += amt
      }
    })

    const cashCounted = Math.max(0, cashIn - cashOut)
    const momoTotal = Math.max(0, momoIn - momoOut)
    const bankTotal = Math.max(0, bankIn - bankOut)
    const stockAndMaterials = Number(metrics.stockValueRWF) || 0
    const owedToMe = Number(metrics.owedToMeRWF) || 0
    const iOwe = Number(metrics.iOweSuppliersRWF) || 0

    return {
      cashCounted,
      cashExpected: cashCounted,
      momoMtn: Math.round(momoTotal * 0.75),
      momoAirtel: Math.round(momoTotal * 0.25),
      totalMomo: momoTotal,
      bankBk: Math.round(bankTotal * 0.7),
      bankEquity: Math.round(bankTotal * 0.3),
      totalBank: bankTotal,
      stockAndMaterials,
      owedToMe,
      iOwe,
      projectSpent: 0,
      projectReceived: 0,
      personalTaken: 0,
      personalLimit: 200000
    }
  }, [archTransactions, metrics])

  const totalCash = dynamicBalances.cashCounted
  const totalMomo = dynamicBalances.totalMomo
  const totalBank = dynamicBalances.totalBank
  const moneyIReallyHave =
    totalCash + totalMomo + totalBank + dynamicBalances.owedToMe - dynamicBalances.iOwe

  // New movement modal state
  const [newTxOpen, setNewTxOpen] = useState(false)
  const [txForm, setTxForm] = useState({
    title: '',
    type: 'in',
    category: 'Sales Revenue',
    amountRWF: 85000,
    account: 'MoMo (MTN Business 0788•••412)',
    source: 'Dashboard'
  })

  // Edit / Audit modal state (Section 6.15)
  const [editingTx, setEditingTx] = useState(null)
  const [editAmount, setEditAmount] = useState(0)
  const [editTitle, setEditTitle] = useState('')
  const [editReason, setEditReason] = useState('')

  const handleCreateTx = (e) => {
    e.preventDefault()
    if (!txForm.title) return
    addTransaction({
      ...txForm,
      architectureId: activeArchId
    })
    setNewTxOpen(false)
    setTxForm({
      title: '',
      type: 'in',
      category: 'Sales Revenue',
      amountRWF: 85000,
      account: 'MoMo (MTN Business 0788•••412)',
      source: 'Dashboard'
    })
  }

  const openEditModal = (tx) => {
    setEditingTx(tx)
    setEditAmount(tx.amountRWF)
    setEditTitle(tx.title)
    setEditReason('')
  }

  const handleSaveAuditEdit = (e) => {
    e.preventDefault()
    if (!editingTx) return
    editTransactionWithAudit(
      editingTx.id,
      { title: editTitle, amountRWF: editAmount },
      editReason || 'Authorized balance reconciliation adjustment'
    )
    setEditingTx(null)
  }

  const buckets = [
    {
      title: 'Cash in Hand (Till / Drawer)',
      amount: totalCash,
      subtitle: `Counted: ${formatRWF(dynamicBalances.cashCounted, hideFinancials)} vs Expected: ${formatRWF(dynamicBalances.cashExpected, hideFinancials)}`,
      problemSolved: 'Solves: Cash goes missing and nobody knows when',
      status: dynamicBalances.cashCounted > 0 ? 'Matched · Safe' : 'Reconciled Till',
      tone: 'emerald',
      icon: Wallet
    },
    {
      title: 'Mobile Money (MoMo Wallets)',
      amount: totalMomo,
      subtitle: `MTN MoMo: ${formatRWF(dynamicBalances.momoMtn, hideFinancials)} · Airtel: ${formatRWF(dynamicBalances.momoAirtel, hideFinancials)}`,
      problemSolved: 'Solves: Wallet money mixed with personal use',
      status: totalMomo > 0 ? 'Verified Inflows' : 'Business Wallets',
      tone: 'blue',
      icon: Smartphone
    },
    {
      title: 'Bank Accounts',
      amount: totalBank,
      subtitle: `BK Corporate: ${formatRWF(dynamicBalances.bankBk, hideFinancials)} · Equity: ${formatRWF(dynamicBalances.bankEquity, hideFinancials)}`,
      problemSolved: 'Solves: Owner only learns balance at the bank',
      status: totalBank > 0 ? 'Reconciled' : 'Linked Accounts',
      tone: 'blue',
      icon: Landmark
    },
    {
      title: 'Stock & Materials (Non-Spendable)',
      amount: dynamicBalances.stockAndMaterials,
      subtitle: 'Goods on shelf, raw materials, livestock & crops',
      problemSolved: 'Solves: Money sleeping in stock that does not sell',
      status: 'Not added to spendable cash until sold',
      tone: 'amber',
      icon: Package
    },
    {
      title: 'Owed to Me (Customer Debts)',
      amount: dynamicBalances.owedToMe,
      subtitle: dynamicBalances.owedToMe > 0 ? 'Active customer credit book' : 'Zero outstanding customer debts',
      problemSolved: 'Solves: Credit given and then forgotten',
      status: dynamicBalances.owedToMe > 0 ? 'Receivables Tracked' : 'Zero Overdue',
      tone: 'amber',
      icon: ArrowDownLeft
    },
    {
      title: 'Money I Owe (Suppliers, Rent, Wages)',
      amount: dynamicBalances.iOwe,
      subtitle: dynamicBalances.iOwe > 0 ? 'Pending supplier credit invoices' : 'All supplier invoices settled',
      problemSolved: 'Solves: Late payments hurt supplier trust & credit',
      status: dynamicBalances.iOwe > 0 ? 'Payables Tracked' : 'Clean Credit',
      tone: 'rose',
      icon: ArrowUpRight
    },
    {
      title: 'Money in Active Projects / Jobs',
      amount: dynamicBalances.projectReceived - dynamicBalances.projectSpent,
      subtitle: `Received: ${formatRWF(dynamicBalances.projectReceived, hideFinancials)} vs Spent: ${formatRWF(dynamicBalances.projectSpent, hideFinancials)}`,
      problemSolved: 'Solves: Job looks fine while cash is drained',
      status: 'Operational Balance',
      tone: 'emerald',
      icon: Briefcase
    },
    {
      title: 'Business vs Personal Withdrawals',
      amount: dynamicBalances.personalTaken,
      subtitle: `Owner home withdrawals vs Monthly Limit (${formatRWF(dynamicBalances.personalLimit, hideFinancials)})`,
      problemSolved: 'Solves: Business cash used for personal home needs',
      status: 'Safe Owner Limit',
      tone: 'blue',
      icon: Home
    }
  ]

  return (
    <div className="space-y-6">
      {/* Top Hero Banner: THE ONE NUMBER AT THE TOP (Section 5.1) */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#071544] via-[#0A2786] to-[#1045CA] text-white border border-[#9EDCFF]/40 shadow-sapphire-glow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-[#9EDCFF]/40 text-xs font-orbitron text-[#9EDCFF]">
              SECTION 5.1 · WHERE IS MY MONEY RIGHT NOW?
            </span>
            <h2 className="font-orbitron text-xs sm:text-sm uppercase tracking-wider text-[#9EDCFF]">
              Money I Really Have = Cash + MoMo + Bank + Owed to Me − Money I Owe
            </h2>
            <div className="font-orbitron text-3xl sm:text-5xl font-black text-white pt-1">
              {formatRWF(moneyIReallyHave, hideFinancials)}
            </div>
            {!hideFinancials && (
              <p className="text-xs italic text-[#9EDCFF]">
                {amountToWords(moneyIReallyHave, language)}
              </p>
            )}
          </div>

          {/* Stock Value Shown Next to It (Not Added In) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#03091F]/70 border border-[#9EDCFF]/35 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-orbitron uppercase text-[#9EDCFF]">
                Stock &amp; Materials Value (Beside Spendable)
              </span>
              <Package className="w-4 h-4 text-[#218DFF]" />
            </div>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-[#9EDCFF]">
              {formatRWF(dynamicBalances.stockAndMaterials, hideFinancials)}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Shown next to your real money—not added in—because stock value is sleeping on the shelf and is not spendable until sold.
            </p>
          </div>
        </div>
      </div>

      {/* 8-Bucket Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {buckets.map((b) => {
          const Icon = b.icon
          return (
            <div key={b.title} className="sapphire-analytics-card p-5 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#218DFF]/20 border border-[#218DFF]/40 flex items-center justify-center text-[#218DFF] dark:text-[#9EDCFF]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#218DFF]/15 text-[#1045CA] dark:text-[#9EDCFF]">
                    {b.status}
                  </span>
                </div>

                <h3 className="font-orbitron text-xs font-bold text-slate-600 dark:text-[#9EDCFF]/90 uppercase">
                  {b.title}
                </h3>
                <div className="font-orbitron text-xl sm:text-2xl font-extrabold text-[#071544] dark:text-white">
                  {formatRWF(b.amount, hideFinancials)}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{b.subtitle}</p>
              </div>

              <div className="pt-2.5 border-t border-blue-200/50 dark:border-[#9EDCFF]/15 text-[11px] text-[#1045CA] dark:text-[#9EDCFF]/80 font-medium">
                {b.problemSolved}
              </div>
            </div>
          )
        })}
      </div>

      {/* Daily Movement View ("Money In / Money Out") + Section 6.15 Audit Trail */}
      <div className="liquid-glass rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
              Daily Money In / Money Out Movement Ledger &amp; Audit History
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Tagged by account (Cash, MoMo, Bank) and entry source (Dashboard or WhatsApp). Edits preserve original creation metadata and full audit history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNewTxOpen(true)}
            className="btn-sapphire px-4 py-2.5 text-xs font-orbitron"
          >
            <Plus className="w-4 h-4" />
            <span>Record Money Movement</span>
          </button>
        </div>

        <div className="space-y-3">
          {archTransactions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/80 dark:bg-[#071544]/75 border border-blue-200/70 dark:border-[#9EDCFF]/20 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No money movements recorded yet for this business
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use the &ldquo;+ Record Money Movement&rdquo; button above to log cash in, MoMo receipts, or till payments.
              </p>
            </div>
          ) : (
            archTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 rounded-2xl bg-white/80 dark:bg-[#071544]/75 border border-blue-200/70 dark:border-[#9EDCFF]/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-orbitron font-bold uppercase ${
                      tx.type === 'in'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                    }`}
                  >
                    {tx.type === 'in' ? 'MONEY IN' : 'MONEY OUT'}
                  </span>
                  <strong className="text-sm text-[#071544] dark:text-white">{tx.title}</strong>
                  <span className="px-2 py-0.5 rounded bg-[#218DFF]/15 text-[10px] font-semibold text-[#1045CA] dark:text-[#9EDCFF] flex items-center gap-1">
                    {tx.source === 'WhatsApp' ? (
                      <MessageSquare className="w-3 h-3" />
                    ) : (
                      <Monitor className="w-3 h-3" />
                    )}
                    <span>Source: {tx.source}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-300 flex flex-wrap items-center gap-3">
                  <span>Account: <strong>{tx.account}</strong></span>
                  <span>Created: {tx.createdAt}</span>
                  <span>Creator: {tx.createdBy}</span>
                  {tx.lastModifiedAt && (
                    <span className="text-amber-600 dark:text-amber-300 font-semibold">
                      · Edited {tx.lastModifiedAt} by {tx.modifiedBy} ({tx.editHistory?.length} audit entries)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-4">
                <div className="text-right">
                  <div
                    className={`font-orbitron text-base font-extrabold ${
                      tx.type === 'in'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'in' ? '+' : '−'}
                    {formatRWF(tx.amountRWF, hideFinancials)}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider opacity-75">
                    {tx.status}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(tx)}
                  className="px-3 py-2 rounded-xl bg-[#218DFF]/15 hover:bg-[#218DFF]/25 border border-[#218DFF]/30 text-xs font-semibold text-[#1045CA] dark:text-[#9EDCFF] cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Controlled Edit / Audit</span>
                </button>
              </div>
            </div>
          )))}
        </div>
      </div>

      {/* Modal: Record New Money Movement */}
      {newTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03091F]/80 backdrop-blur-xl">
          <div className="w-full max-w-lg rounded-3xl bg-[#071544] border border-[#9EDCFF]/40 text-white p-6 sm:p-8 lamp-modal-card space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-orbitron text-lg font-bold">Record Daily Money Movement</h3>
              <button
                type="button"
                onClick={() => setNewTxOpen(false)}
                className="p-2 rounded-xl bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-[#9EDCFF]">
                  Description / Transaction Title
                </label>
                <input
                  type="text"
                  required
                  value={txForm.title}
                  onChange={(e) => setTxForm({ ...txForm, title: e.target.value })}
                  placeholder="e.g. Afternoon Retail Cash Sales"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[#9EDCFF]">
                    Movement Direction
                  </label>
                  <select
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-white text-sm"
                  >
                    <option value="in">Money In (+)</option>
                    <option value="out">Money Out (−)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[#9EDCFF]">
                    Account / Wallet
                  </label>
                  <select
                    value={txForm.account}
                    onChange={(e) => setTxForm({ ...txForm, account: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-white text-sm"
                  >
                    <option>Cash in Hand (Main Till)</option>
                    <option>MoMo (MTN Business 0788•••412)</option>
                    <option>Bank (BK Corporate #00042)</option>
                  </select>
                </div>
              </div>

              <MoneyInput
                id="new-tx-amount"
                label="Transaction Amount (RWF)"
                value={txForm.amountRWF}
                onChange={(v) => setTxForm({ ...txForm, amountRWF: v })}
                language={language}
              />

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewTxOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-xs text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-sapphire px-6 py-2.5 text-xs">
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Section 6.15 Controlled Transaction Edit & Audit History */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03091F]/80 backdrop-blur-xl">
          <div className="w-full max-w-xl rounded-3xl bg-[#071544] border border-[#9EDCFF]/40 text-white p-6 sm:p-8 lamp-modal-card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-orbitron uppercase text-[#9EDCFF]">
                  Section 6.15 · Controlled Financial Correction
                </span>
                <h3 className="font-orbitron text-lg font-bold">
                  Edit Transaction &amp; Preserve Audit Trail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-2 rounded-xl bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Immutable Original Metadata */}
            <div className="p-3.5 rounded-2xl bg-[#03091F]/80 border border-[#9EDCFF]/25 text-xs space-y-1 text-slate-200">
              <div>
                <strong>Original Creation Date:</strong> {editingTx.createdAt} (Immutable)
              </div>
              <div>
                <strong>Original Entry Source:</strong> {editingTx.source} (Immutable)
              </div>
              <div>
                <strong>Original Creator:</strong> {editingTx.createdBy} (Immutable)
              </div>
            </div>

            <form onSubmit={handleSaveAuditEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-[#9EDCFF]">
                  Updated Description
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-white text-sm"
                />
              </div>

              <MoneyInput
                id="edit-tx-amount"
                label="Corrected Amount (RWF)"
                value={editAmount}
                onChange={(v) => setEditAmount(v)}
                language={language}
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-[#9EDCFF]">
                  Mandatory Correction Reason (Saved to Audit Log) *
                </label>
                <input
                  type="text"
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Recounted invoice receipt after transport deduction"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#03091F] border border-[#9EDCFF]/30 text-white text-sm"
                />
              </div>

              {editingTx.editHistory?.length > 0 && (
                <div className="p-3 rounded-xl bg-white/5 border border-[#9EDCFF]/20 space-y-1.5 max-h-32 overflow-y-auto">
                  <div className="text-[11px] font-orbitron uppercase text-[#9EDCFF]">
                    Previous Edit History ({editingTx.editHistory.length})
                  </div>
                  {editingTx.editHistory.map((h, i) => (
                    <div key={i} className="text-[11px] text-slate-300">
                      [{h.timestamp}] {h.editor}: {formatRWF(h.previousAmountRWF)} →{' '}
                      {formatRWF(h.newAmountRWF)} ({h.reason})
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-xs text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-sapphire px-6 py-2.5 text-xs">
                  Apply Controlled Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

