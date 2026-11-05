import React, { useState } from 'react'
import {
  Plus,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Truck
} from 'lucide-react'

export default function LiveWorkflowModal({
  isOpen,
  onClose,
  activeArchId = 'buy-and-sell',
  addDemoRecord
}) {
  const [workflowType, setWorkflowType] = useState('sale') // 'sale' | 'expense' | 'inventory' | 'customer' | 'supplier'
  const [workflowTitle, setWorkflowTitle] = useState('')
  const [workflowAmount, setWorkflowAmount] = useState('')
  const [workflowParty, setWorkflowParty] = useState('')
  const [workflowAccount, setWorkflowAccount] = useState('MoMo Business (MTN)')
  const [workflowQty, setWorkflowQty] = useState('1')
  const [workflowUnitCost, setWorkflowUnitCost] = useState('')
  const [workflowSellingPrice, setWorkflowSellingPrice] = useState('')
  const [workflowNotice, setWorkflowNotice] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!workflowTitle.trim()) return

    const amt = Number(workflowAmount) || 0
    const uCost = Number(workflowUnitCost) || 0
    const sPrice = Number(workflowSellingPrice) || 0
    const qty = Number(workflowQty) || 1

    if (addDemoRecord) {
      if (workflowType === 'sale') {
        addDemoRecord(activeArchId, 'Sales', {
          title: workflowTitle.trim(),
          subPage: 'Sales Order Entry',
          customer: workflowParty.trim() || 'Direct Client',
          amountRWF: amt,
          paymentMethod: workflowAccount,
          status: 'Completed Sale'
        })
      } else if (workflowType === 'expense') {
        addDemoRecord(activeArchId, 'Purchases', {
          title: workflowTitle.trim(),
          subPage: 'Operating Expenses',
          supplier: workflowParty.trim() || 'Operational Vendor',
          amountRWF: amt,
          status: 'Paid Outflow'
        })
      } else if (workflowType === 'inventory') {
        addDemoRecord(activeArchId, 'Inventory', {
          title: workflowTitle.trim(),
          subPage: 'Stock Items',
          unitCostRWF: uCost,
          sellingPriceRWF: sPrice,
          quantity: qty,
          trackStock: true,
          status: 'In Stock'
        })
      } else if (workflowType === 'customer') {
        addDemoRecord(activeArchId, 'Customers', {
          title: workflowTitle.trim(),
          subPage: 'Customer Balances',
          phone: workflowParty.trim() || '+250 788 000 000',
          balanceOwedRWF: amt,
          status: 'Pending Receivable'
        })
      } else if (workflowType === 'supplier') {
        addDemoRecord(activeArchId, 'Purchases', {
          title: workflowTitle.trim(),
          subPage: 'Supplier Balances',
          supplier: workflowParty.trim() || 'Key Supplier',
          amountRWF: amt,
          status: 'Pending Invoice'
        })
      }
    }

    setWorkflowNotice(`Successfully recorded "${workflowTitle.trim()}"! Metrics and curve updated.`)
    setTimeout(() => {
      onClose()
      setWorkflowNotice('')
      setWorkflowTitle('')
      setWorkflowAmount('')
      setWorkflowParty('')
      setWorkflowUnitCost('')
      setWorkflowSellingPrice('')
      setWorkflowQty('1')
    }, 1200)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_30px_rgba(33,141,255,0.25)] p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1045CA]/40 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF] shadow-inner">
              <Plus className="w-5 h-5 text-[#218DFF]" />
            </div>
            <div>
              <h3 className="font-orbitron text-base sm:text-lg font-extrabold text-white tracking-tight">
                Record Live Workflow Entry
              </h3>
              <p className="text-xs text-[#9EDCFF]/80 mt-0.5">
                Data updates your Overview KPI cards, Financial Curve, and Ledger instantly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer border border-white/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {workflowNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{workflowNotice}</span>
          </div>
        )}

        {/* Entry Type Selector */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
          {[
            { id: 'sale', label: 'Sale / Income', icon: TrendingUp },
            { id: 'expense', label: 'Expense', icon: TrendingDown },
            { id: 'inventory', label: 'Stock / Item', icon: Package },
            { id: 'customer', label: 'Receivable', icon: Users },
            { id: 'supplier', label: 'Payable', icon: Truck }
          ].map((t) => {
            const isCur = workflowType === t.id
            const TIcon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setWorkflowType(t.id)}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer transition-all border ${
                  isCur
                    ? 'bg-gradient-to-r from-[#218DFF] to-[#1045CA] border-[#9EDCFF]/50 text-white shadow-sm'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <TIcon className="w-3.5 h-3.5" />
                <span className="truncate">{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
              {workflowType === 'sale'
                ? 'Sale Item / Service Rendered *'
                : workflowType === 'expense'
                ? 'Expense / Purchase Description *'
                : workflowType === 'inventory'
                ? 'Item / Product Name *'
                : workflowType === 'customer'
                ? 'Client / Customer Name *'
                : 'Supplier / Vendor Name *'}
            </label>
            <input
              type="text"
              required
              value={workflowTitle}
              onChange={(e) => setWorkflowTitle(e.target.value)}
              placeholder={
                workflowType === 'sale'
                  ? 'e.g. 5 Bags Cement & Nails'
                  : workflowType === 'expense'
                  ? 'e.g. Monthly Warehouse Rent'
                  : workflowType === 'inventory'
                  ? 'e.g. Samsung 25W Fast Charger'
                  : workflowType === 'customer'
                  ? 'e.g. Kigali Builders Ltd'
                  : 'e.g. Bralirwa Distributor'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:bg-white/20 focus:outline-none focus:border-[#218DFF]"
            />
          </div>

          {workflowType === 'inventory' ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Unit Cost (RWF)
                </label>
                <input
                  type="number"
                  value={workflowUnitCost}
                  onChange={(e) => setWorkflowUnitCost(e.target.value)}
                  placeholder="12000"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Sell Price (RWF)
                </label>
                <input
                  type="number"
                  value={workflowSellingPrice}
                  onChange={(e) => setWorkflowSellingPrice(e.target.value)}
                  placeholder="18000"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Quantity
                </label>
                <input
                  type="number"
                  value={workflowQty}
                  onChange={(e) => setWorkflowQty(e.target.value)}
                  placeholder="10"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Amount (RWF) *
                </label>
                <input
                  type="number"
                  required
                  value={workflowAmount}
                  onChange={(e) => setWorkflowAmount(e.target.value)}
                  placeholder="150000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm font-bold text-white placeholder-slate-400 focus:bg-white/20 focus:outline-none focus:border-[#218DFF]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  {workflowType === 'customer'
                    ? 'Client Phone'
                    : workflowType === 'supplier'
                    ? 'Supplier Phone / Ref'
                    : 'Party / Contact'}
                </label>
                <input
                  type="text"
                  value={workflowParty}
                  onChange={(e) => setWorkflowParty(e.target.value)}
                  placeholder={
                    workflowType === 'customer' || workflowType === 'supplier'
                      ? '+250 788 123 456'
                      : 'Client / Vendor'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:bg-white/20 focus:outline-none focus:border-[#218DFF]"
                />
              </div>
            </div>
          )}

          {(workflowType === 'sale' || workflowType === 'expense') && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                Account / Payment Channel
              </label>
              <select
                value={workflowAccount}
                onChange={(e) => setWorkflowAccount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#071644] border border-white/20 text-xs sm:text-sm text-white focus:outline-none"
              >
                <option value="Cash in Hand (Main Till)">Cash in Hand (Main Till)</option>
                <option value="MoMo Business (MTN)">MoMo Business (MTN 0788•••)</option>
                <option value="Airtel Money (Business)">Airtel Money (Business)</option>
                <option value="Bank Account (BK Corporate)">Bank Account (BK Corporate)</option>
                <option value="Equity Bank Business">Equity Bank Business</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/15">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] border border-white/40 text-xs font-bold text-white cursor-pointer shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save &amp; Update Dashboard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

