import React, { useEffect, useState, useCallback } from 'react'
import {
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  Target,
  X
} from 'lucide-react'
import { exbosApi } from '../../../utils/apiClient'
import { formatRWF, formatWithCommas, parseNumericInput } from '../../../utils/currencyWords'

const BILL_CATEGORIES = [
  'Shop Rent',
  'Electricity & Water',
  'Internet & Phone',
  'Security & Cleaning',
  'Bank / Loan Repayment',
  'Taxes & Licenses',
  'Equipment Lease',
  'Other Fixed Bill'
]

export default function MonthlyFixedCostsAndBreakEvenPanel({
  activeArchId = 'buy-and-sell',
  activeBranchId = 'main',
  hideFinancials = false,
  addToast
}) {
  const [monthKey, setMonthKey] = useState(() => new Date().toISOString().slice(0, 7))
  const [activeTab, setActiveTab] = useState('employees') // 'employees' | 'bills'
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [fixedBills, setFixedBills] = useState([])
  const [breakEven, setBreakEven] = useState(null)

  // Add Employee / Fixed Bill inline form
  const [showAddForm, setShowAddForm] = useState(false)
  const [formKind, setFormKind] = useState('employee')
  const [formName, setFormName] = useState('')
  const [formRoleOrCat, setFormRoleOrCat] = useState('Cashier')
  const [formPhone, setFormPhone] = useState('')
  const [formMonthlyAmt, setFormMonthlyAmt] = useState('')
  const [formDueDay, setFormDueDay] = useState('28')
  const [savingForm, setSavingForm] = useState(false)

  // Pay Salary / Pay Bill modal
  const [payTarget, setPayTarget] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('MTN MoMo')
  const [payNotes, setPayNotes] = useState('')
  const [paying, setPaying] = useState(false)

  const mask = (v) => (hideFinancials ? '••••••' : formatRWF(Number(v || 0)))

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await exbosApi.getCommitments({
        archId: activeArchId,
        branchId: activeBranchId || 'main',
        month: monthKey
      })
      const data = res?.data?.data || res?.data
      if (res?.ok && data) {
        setEmployees(Array.isArray(data.employees) ? data.employees : [])
        setFixedBills(Array.isArray(data.fixedBills) ? data.fixedBills : [])
        setBreakEven(data.breakEven || null)
      }
    } finally {
      setLoading(false)
    }
  }, [activeArchId, activeBranchId, monthKey])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openAdd = (kind) => {
    setFormKind(kind)
    setFormName('')
    setFormRoleOrCat(kind === 'employee' ? 'Cashier' : 'Shop Rent')
    setFormPhone('')
    setFormMonthlyAmt('')
    setFormDueDay(kind === 'employee' ? '28' : '5')
    setShowAddForm(true)
  }

  const handleSaveCommitment = async (e) => {
    e.preventDefault()
    const amt = parseNumericInput(formMonthlyAmt)
    if (!formName.trim() || amt <= 0) return
    setSavingForm(true)
    try {
      const res = await exbosApi.createCommitment({
        kind: formKind,
        name: formName.trim(),
        roleOrCategory: formRoleOrCat.trim(),
        phone: formPhone.trim(),
        monthlyAmountRWF: amt,
        dueDay: Number(formDueDay || 28),
        archId: activeArchId,
        branchId: activeBranchId || 'main'
      })
      if (!res?.ok) {
        addToast?.({ type: 'error', title: 'Save Failed', message: res?.data?.error || 'Could not save commitment.' })
        return
      }
      addToast?.({
        type: 'success',
        title: formKind === 'employee' ? 'Employee Added to Payroll' : 'Monthly Fixed Bill Added',
        message: `${formName.trim()} (${formatRWF(amt)}/mo) is now included in your live Break-Even tracker.`
      })
      setShowAddForm(false)
      setActiveTab(formKind === 'employee' ? 'employees' : 'bills')
      loadData()
    } finally {
      setSavingForm(false)
    }
  }

  const handleDeleteCommitment = async (item) => {
    const res = await exbosApi.deleteCommitment(item.id)
    if (res?.ok) {
      addToast?.({ type: 'info', title: 'Removed', message: `Removed "${item.name}" from monthly commitments.` })
      loadData()
    }
  }

  const openPayModal = (item) => {
    setPayTarget(item)
    const defaultAmt = item.remainingThisMonthRWF > 0 ? item.remainingThisMonthRWF : item.monthlyAmountRWF
    setPayAmount(defaultAmt ? String(defaultAmt) : '')
    setPayMethod('MTN MoMo')
    setPayNotes('')
  }

  const handleConfirmPayment = async (e) => {
    e.preventDefault()
    if (!payTarget) return
    const amt = parseNumericInput(payAmount)
    if (amt <= 0) return
    setPaying(true)
    try {
      const res = await exbosApi.payCommitment(payTarget.id, {
        amountRWF: amt,
        paymentMethod: payMethod,
        notes: payNotes.trim(),
        monthKey,
        archId: activeArchId
      })
      if (!res?.ok) {
        addToast?.({ type: 'error', title: 'Payment Failed', message: res?.data?.error || 'Could not record payment.' })
        return
      }
      addToast?.({
        type: 'success',
        title: payTarget.kind === 'employee' ? 'Salary Payment Recorded' : 'Fixed Bill Paid',
        message: `Paid ${formatRWF(amt)} for ${payTarget.name}. Expenses & Where Is My Money updated.`
      })
      setPayTarget(null)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('exbos:offline-synced'))
      }
      loadData()
    } finally {
      setPaying(false)
    }
  }

  const be = breakEven || {
    totalMonthlySalariesRWF: 0,
    totalMonthlyFixedBillsRWF: 0,
    totalMonthlyFixedRWF: 0,
    paidFixedThisMonthRWF: 0,
    remainingFixedThisMonthRWF: 0,
    monthSalesRWF: 0,
    monthGrossProfitRWF: 0,
    monthVariableExpensesRWF: 0,
    totalMonthlyBurdenRWF: 0,
    netMonthlyProfitOrLossRWF: 0,
    profitGapToBreakEvenRWF: 0,
    salesNeededToBreakEvenRWF: 0,
    breakEvenPercent: 0,
    isProfitable: false,
    remainingDaysInMonth: 15,
    dailySalesTargetToBreakEvenRWF: 0
  }

  const activeList = activeTab === 'employees' ? employees : fixedBills

  return (
    <div className="space-y-4">
      {/* 1. LIVE MONTHLY BREAK-EVEN & LOSS/BENEFIT COMMAND CARD */}
      <div className="rounded-3xl border border-[#218DFF]/35 bg-gradient-to-br from-[#071644] via-[#040E2E] to-[#081A52] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-orbitron font-bold bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/35">
                <Target className="w-3.5 h-3.5" />
                MONTHLY PAYROLL, RENT &amp; BREAK-EVEN ENGINE
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  be.totalMonthlyBurdenRWF === 0 && be.monthGrossProfitRWF === 0
                    ? 'bg-white/10 text-slate-300'
                    : be.isProfitable
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                }`}
              >
                {be.totalMonthlyBurdenRWF === 0 && be.monthGrossProfitRWF === 0
                  ? 'Add Salaries & Rent Below'
                  : be.isProfitable
                  ? 'Profit / Benefit Zone'
                  : 'Loss Zone — Below Break-Even'}
              </span>
            </div>
            <h3 className="font-orbitron text-base sm:text-lg font-extrabold text-white mt-1.5">
              Monthly Fixed Costs vs. Live Profit ({monthKey})
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="month"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#03091F] border border-white/20 text-xs font-semibold text-white"
            />
          </div>
        </div>

        {/* 4 Executive Break-Even KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#030B24]/80 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Monthly Salaries + Rent
            </span>
            <div className="font-orbitron text-sm sm:text-base font-extrabold text-white">
              {mask(be.totalMonthlyFixedRWF)}
            </div>
            <span className="text-[10px] text-amber-300 block">
              Paid: {mask(be.paidFixedThisMonthRWF)} · Still Due: {mask(be.remainingFixedThisMonthRWF)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#030B24]/80 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Month Gross Profit
            </span>
            <div className="font-orbitron text-sm sm:text-base font-extrabold text-[#9EDCFF]">
              {mask(be.monthGrossProfitRWF)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              From {mask(be.monthSalesRWF)} sales
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#030B24]/80 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              {be.isProfitable ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-400" />
              )}
              <span>Net Monthly Benefit / Loss</span>
            </span>
            <div
              className={`font-orbitron text-sm sm:text-base font-extrabold ${
                be.netMonthlyProfitOrLossRWF >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {be.netMonthlyProfitOrLossRWF > 0 ? '+' : ''}
              {mask(be.netMonthlyProfitOrLossRWF)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              After fixed + {mask(be.monthVariableExpensesRWF)} variable costs
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#030B24]/80 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Daily Sales Needed
            </span>
            <div className="font-orbitron text-sm sm:text-base font-extrabold text-amber-300">
              {be.isProfitable && be.totalMonthlyBurdenRWF > 0
                ? 'Covered!'
                : mask(be.dailySalesTargetToBreakEvenRWF)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {be.isProfitable && be.totalMonthlyBurdenRWF > 0
                ? 'All salaries & rent covered'
                : `Over ${be.remainingDaysInMonth} day${be.remainingDaysInMonth === 1 ? '' : 's'} left`}
            </span>
          </div>
        </div>

        {/* Break-Even Progress Gauge */}
        <div className="p-3.5 rounded-2xl bg-[#030B24]/90 border border-white/10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-white">
              Monthly Break-Even Progress:{' '}
              <span className={be.isProfitable ? 'text-emerald-300' : 'text-[#9EDCFF]'}>
                {be.breakEvenPercent}%
              </span>
            </span>
            <span className="text-[11px] text-slate-300">
              {be.totalMonthlyBurdenRWF <= 0
                ? 'Add your employees and monthly rent below to activate your live Break-Even calculator.'
                : be.isProfitable
                ? `All monthly costs covered! True net benefit so far: +${mask(be.netMonthlyProfitOrLossRWF)}.`
                : `Need ${mask(be.profitGapToBreakEvenRWF)} more profit (~${mask(be.salesNeededToBreakEvenRWF)} in sales) to break even this month.`}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                be.isProfitable
                  ? 'bg-gradient-to-r from-[#218DFF] to-emerald-400'
                  : 'bg-gradient-to-r from-rose-500 via-amber-400 to-[#218DFF]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, be.breakEvenPercent))}%` }}
            />
          </div>
        </div>

        {/* 2. EMPLOYEES & FIXED BILLS TABS */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                activeTab === 'employees' ? 'bg-[#218DFF] text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Employees &amp; Salaries ({employees.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                activeTab === 'bills' ? 'bg-[#218DFF] text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Rent &amp; Fixed Bills ({fixedBills.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAdd('employee')}
              className="px-3 py-1.5 rounded-xl bg-[#218DFF] hover:bg-[#197be6] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Employee
            </button>
            <button
              type="button"
              onClick={() => openAdd('fixed_bill')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#9EDCFF] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rent / Bill
            </button>
          </div>
        </div>

        {/* Inline Add Form */}
        {showAddForm && (
          <form
            onSubmit={handleSaveCommitment}
            className="p-4 rounded-2xl bg-[#030B24] border border-[#218DFF]/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs"
          >
            <div className="lg:col-span-2">
              <label className="text-[10px] text-slate-400 block mb-1">
                {formKind === 'employee' ? 'Employee Full Name *' : 'Bill Title (e.g. Kigali Shop Rent) *'}
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={formKind === 'employee' ? 'e.g. Alice Uwimana' : 'e.g. Main Shop Rent'}
                className="w-full px-3 py-2 rounded-xl bg-[#06143D] border border-white/15 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                {formKind === 'employee' ? 'Job Role' : 'Bill Category'}
              </label>
              {formKind === 'employee' ? (
                <input
                  type="text"
                  value={formRoleOrCat}
                  onChange={(e) => setFormRoleOrCat(e.target.value)}
                  placeholder="Cashier / Manager"
                  className="w-full px-3 py-2 rounded-xl bg-[#06143D] border border-white/15 text-white"
                />
              ) : (
                <select
                  value={formRoleOrCat}
                  onChange={(e) => setFormRoleOrCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#06143D] border border-white/15 text-white"
                >
                  {BILL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Monthly Amount (RWF) *</label>
              <input
                type="text"
                required
                inputMode="numeric"
                value={formMonthlyAmt}
                onChange={(e) => setFormMonthlyAmt(formatWithCommas(e.target.value))}
                placeholder="e.g. 150,000"
                className="w-full px-3 py-2 rounded-xl bg-[#06143D] border border-white/15 text-emerald-300 font-mono font-bold"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={savingForm}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold cursor-pointer"
              >
                {savingForm ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Commitments List */}
        {loading ? (
          <div className="py-4 text-center text-xs text-slate-400">Loading monthly payroll &amp; fixed bills...</div>
        ) : activeList.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#030B24]/60 border border-white/10 text-center text-xs text-slate-300">
            {activeTab === 'employees'
              ? 'No employees recorded yet. Click "Add Employee" to track monthly salaries and remaining payroll owed.'
              : 'No monthly rent or fixed bills recorded yet. Click "Add Rent / Bill" to include them in your Break-Even calculator.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {activeList.map((item) => {
              const isPaid = item.monthStatus === 'Paid'
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#030B24]/80 border border-white/10 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-[#9EDCFF]">
                          {item.roleOrCategory}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Monthly: <strong className="text-white">{mask(item.monthlyAmountRWF)}</strong> · Paid:{' '}
                        <strong className="text-emerald-300">{mask(item.paidThisMonthRWF)}</strong> · Remaining:{' '}
                        <strong className={item.remainingThisMonthRWF > 0 ? 'text-amber-300' : 'text-emerald-300'}>
                          {mask(item.remainingThisMonthRWF)}
                        </strong>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 inline-flex items-center gap-1 ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.monthStatus === 'Partial'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {item.monthStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => openPayModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#218DFF] hover:bg-[#197be6] text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>
                        {item.kind === 'employee'
                          ? isPaid
                            ? 'Pay Bonus / Extra'
                            : 'Pay Salary'
                          : isPaid
                          ? 'Record Payment'
                          : 'Pay Bill'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCommitment(item)}
                      className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-500/15 cursor-pointer"
                      title="Remove commitment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pay Salary / Pay Fixed Bill Modal */}
      {payTarget && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmPayment}
            className="w-full max-w-md rounded-3xl bg-[#06143D] border border-[#218DFF]/40 p-5 space-y-4 text-white shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="font-orbitron text-sm font-bold">
                  {payTarget.kind === 'employee' ? `Pay Salary — ${payTarget.name}` : `Pay Bill — ${payTarget.name}`}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Remaining for {monthKey}: <strong>{mask(payTarget.remainingThisMonthRWF)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-200 block mb-1">Amount Paying Now (RWF)</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={payAmount ? formatWithCommas(payAmount) : ''}
                  onChange={(e) => setPayAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/20 text-emerald-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-200 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/20 text-white"
                >
                  <option value="MTN MoMo">MTN MoMo</option>
                  <option value="Cash">Cash</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-200 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Mid-month salary advance"
                  className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/20 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paying}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-extrabold cursor-pointer"
              >
                {paying ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
