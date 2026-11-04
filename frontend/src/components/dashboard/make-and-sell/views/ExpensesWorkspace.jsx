import React, { useState, useMemo } from 'react'
import {
  Wallet,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Clock,
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingDown,
  Repeat
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'
import ExportDrawer from '../ExportDrawer'
import CustomSelect from '../../../common/CustomSelect'

export default function ExpensesWorkspace({
  activeSubPage = 'All Expenses',
  expenses = [],
  onUpdateExpenses = null,
  isCashier = false,
  hideFinancials = false,
  addToast = null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [newExpenseDrawerOpen, setNewExpenseDrawerOpen] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // Expense Categories with monthly budgets
  const [categories, setCategories] = useState([
    { id: 'cat-gas', name: 'Gas & Oven Fuel', budgetRWF: 150000 },
    { id: 'cat-labour', name: 'Bakery Labour', budgetRWF: 350000 },
    { id: 'cat-rent', name: 'Workshop Rent', budgetRWF: 250000 },
    { id: 'cat-trans', name: 'Delivery Transport', budgetRWF: 100000 },
    { id: 'cat-elec', name: 'Electricity & Utilities', budgetRWF: 80000 },
    { id: 'cat-pack', name: 'Packaging Supplies', budgetRWF: 120000 }
  ])

  // New Expense Form State
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10))
  const [expCategory, setExpCategory] = useState('Gas & Oven Fuel')
  const [expAmount, setExpAmount] = useState('')
  const [expPaidFrom, setExpPaidFrom] = useState('Main Cash Till')
  const [expPaidTo, setExpPaidTo] = useState('')
  const [expDescription, setExpDescription] = useState('')
  const [expRepeatMonthly, setExpRepeatMonthly] = useState(false)

  // 3-Number Summary Strip
  const summary = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const thisMonthStr = todayStr.slice(0, 7)

    let todayExp = 0
    let monthExp = 0
    const catTotals = {}

    expenses.forEach((e) => {
      const amt = Number(e.amountRWF || e.amount || 0)
      const d = (e.date || '').slice(0, 10)
      if (d === todayStr) todayExp += amt
      if (d.startsWith(thisMonthStr)) {
        monthExp += amt
        const cat = e.category || 'General'
        catTotals[cat] = (catTotals[cat] || 0) + amt
      }
    })

    let biggestCat = 'None'
    let maxVal = 0
    Object.entries(catTotals).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val
        biggestCat = cat
      }
    })

    return { todayExp, monthExp, biggestCat }
  }, [expenses])

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses
    const q = searchQuery.toLowerCase().trim()
    return expenses.filter(
      (e) =>
        (e.description || e.title || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.paidTo || '').toLowerCase().includes(q) ||
        (e.paidFrom || '').toLowerCase().includes(q)
    )
  }, [expenses, searchQuery])

  // Category spending aggregation for budget bars
  const categorySpending = useMemo(() => {
    const thisMonthStr = new Date().toISOString().slice(0, 7)
    const spendingMap = {}

    expenses.forEach((e) => {
      const d = (e.date || '').slice(0, 7)
      if (d === thisMonthStr) {
        const cat = e.category || 'General'
        spendingMap[cat] = (spendingMap[cat] || 0) + Number(e.amountRWF || e.amount || 0)
      }
    })

    return categories.map((c) => {
      const spent = spendingMap[c.name] || 0
      const budget = c.budgetRWF || 100000
      const pct = Math.round((spent / budget) * 100)
      return { ...c, spent, pct }
    })
  }, [categories, expenses])

  // Save Expense
  const handleSaveExpense = (keepOpen = false) => {
    const amt = Number(expAmount) || 0
    if (amt <= 0) {
      alert('Please enter an expense amount.')
      return
    }

    const newExp = {
      id: `EXP-${Date.now().toString().slice(-6)}`,
      date: expDate,
      category: expCategory,
      amountRWF: amt,
      paidFrom: expPaidFrom,
      paidTo: expPaidTo || 'Direct Payee',
      description: expDescription || expCategory,
      repeatMonthly: expRepeatMonthly
    }

    if (onUpdateExpenses) {
      onUpdateExpenses([newExp, ...expenses])
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Expense Recorded',
        message: `Recorded ${formatRWF(amt)} for ${newExp.category}.`
      })
    }

    if (keepOpen) {
      setExpAmount('')
      setExpDescription('')
      setExpPaidTo('')
    } else {
      setNewExpenseDrawerOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Expenses · {activeSubPage}
            </span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeSubPage === 'All Expenses' ? 'Operating Expenses Ledger' : 'Expense Categories & Budgets'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {activeSubPage === 'All Expenses'
              ? 'Track factory rent, oven gas, worker wages, delivery fuel, and overhead expenses.'
              : 'Monitor category spending limits and budget variances with automated warnings.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
          >
            Export
          </button>

          {activeSubPage === 'All Expenses' && (
            <button
              type="button"
              onClick={() => {
                setExpAmount('')
                setExpDescription('')
                setExpPaidTo('')
                setNewExpenseDrawerOpen(true)
              }}
              className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ New Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Number Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
            Today's Expenses
          </span>
          <div className="font-orbitron text-2xl font-bold text-white">
            {formatRWF(summary.todayExp)}
          </div>
          <span className="text-[11px] text-slate-400">Paid out today</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-rose-300/80 tracking-wider">
            This Month's Total
          </span>
          <div className="font-orbitron text-2xl font-bold text-rose-400">
            {formatRWF(summary.monthExp)}
          </div>
          <span className="text-[11px] text-slate-400">Factory operating overhead</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-amber-300/80 tracking-wider">
            Largest Category
          </span>
          <div className="font-orbitron text-xl font-bold text-white truncate">
            {summary.biggestCat}
          </div>
          <span className="text-[11px] text-slate-400">Highest monthly spend</span>
        </div>
      </div>

      {/* --- SUBPAGE 1: ALL EXPENSES TABLE --- */}
      {activeSubPage === 'All Expenses' && (
        <>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by description, category, or payee..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
            />
          </div>

          <div className="exbos-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Date &amp; ID</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Paid To</th>
                    <th className="p-3.5">Paid From</th>
                    <th className="p-3.5 pr-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No expenses recorded yet. Click "+ New Expense" to record daily operating costs.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 pl-5">
                          <div className="font-bold text-white">{exp.date}</div>
                          <div className="text-[10px] text-slate-500">{exp.id}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-[#9EDCFF]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-200 font-medium">
                          {exp.description || exp.category}
                          {exp.repeatMonthly && (
                            <span className="ml-2 text-[10px] text-amber-400 font-semibold">
                              (Monthly recurring)
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400">{exp.paidTo || 'Direct Payee'}</td>
                        <td className="p-3.5 text-slate-400">{exp.paidFrom || 'Main Cash Till'}</td>
                        <td className="p-3.5 pr-5 text-right font-mono font-bold text-rose-400">
                          -{formatRWF(exp.amountRWF || exp.amount || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- SUBPAGE 2: EXPENSE CATEGORIES & BUDGET BARS --- */}
      {activeSubPage === 'Expense Categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorySpending.map((cat) => {
              const isOver = cat.pct > 100
              const isNear = cat.pct >= 80 && !isOver

              return (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-orbitron font-bold text-white text-base">{cat.name}</h4>
                      <span className="text-xs text-slate-400">
                        Monthly Budget: <span className="font-mono text-slate-200">{formatRWF(cat.budgetRWF)}</span>
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        isOver
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isNear
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/40'
                      }`}
                    >
                      {cat.pct}% Used
                    </span>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 rounded-full bg-[#040C26] overflow-hidden border border-white/10">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isOver ? 'bg-rose-500' : isNear ? 'bg-amber-400' : 'bg-[#218DFF]'
                        }`}
                        style={{ width: `${Math.min(cat.pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Spent: <strong className="text-white font-mono">{formatRWF(cat.spent)}</strong></span>
                      <span>Remaining: <span className="font-mono">{formatRWF(Math.max(0, cat.budgetRWF - cat.spent))}</span></span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* --- NEW EXPENSE DRAWER --- */}
      {newExpenseDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setNewExpenseDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#071330] border-l border-white/15 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                    Expenses · New Expense
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">+ New Operating Expense</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewExpenseDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Expense Date</label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                    <CustomSelect
                      value={expCategory}
                      onChange={(val) => setExpCategory(val)}
                      options={categories.map((c) => ({ value: c.name, label: c.name }))}
                      placeholder="Select Category"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (RWF) *</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Paid From</label>
                    <CustomSelect
                      value={expPaidFrom}
                      onChange={(val) => setExpPaidFrom(val)}
                      options={[
                        { value: 'Main Cash Till', label: 'Main Cash Till' },
                        { value: 'MTN MoMo Business', label: 'MTN MoMo Business' },
                        { value: 'Bank Account', label: 'Bank Account' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Paid To</label>
                    <input
                      type="text"
                      value={expPaidTo}
                      onChange={(e) => setExpPaidTo(e.target.value)}
                      placeholder="e.g. Landlord, Driver, SP Gas"
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    placeholder="e.g. 38kg Industrial Gas Refill for Bakery"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                {/* Repeat Monthly Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <span className="block text-slate-200 font-semibold">Repeat Monthly</span>
                    <span className="text-[10px] text-slate-400">Fixed expense (e.g. rent, retainer)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={expRepeatMonthly}
                    onChange={(e) => setExpRepeatMonthly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#218DFF] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveExpense(false)}
                className="flex-1 btn-sapphire-clean py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Save Expense
              </button>
              <button
                type="button"
                onClick={() => handleSaveExpense(true)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer"
              >
                Save &amp; Add Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPORT DRAWER --- */}
      <ExportDrawer
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Operating Expenses Export"
        pageTitle="Expenses · All Expenses"
        data={filteredExpenses.map((e) => ({
          Date: e.date,
          Category: e.category,
          Description: e.description,
          PaidTo: e.paidTo,
          PaidFrom: e.paidFrom,
          Amount: formatRWF(e.amountRWF || e.amount || 0)
        }))}
        columns={[
          { key: 'Date', label: 'Date' },
          { key: 'Category', label: 'Category' },
          { key: 'Description', label: 'Description' },
          { key: 'PaidTo', label: 'Paid To' },
          { key: 'PaidFrom', label: 'Paid From' },
          { key: 'Amount', label: 'Amount' }
        ]}
        businessName="Inyange Artisan Bakery & Roastery"
      />
    </div>
  )
}

