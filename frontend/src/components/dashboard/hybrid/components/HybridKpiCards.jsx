import React from 'react'
import {
  Layers,
  Scale,
  Receipt,
  TrendingUp,
  Package,
  Wrench,
  CheckCircle2
} from 'lucide-react'

export default function HybridKpiCards({
  items = [],
  mixedSales = [],
  activeActivities = {},
  onNavigateTab
}) {
  // Count physical products vs services
  const physicalItems = items.filter((i) => i.trackStock === true)
  const serviceItems = items.filter((i) => i.trackStock === false)

  // Total mixed sales revenue & profit
  const totalMixedRevenue = mixedSales.reduce((sum, s) => sum + (Number(s.totalAmountRWF) || 0), 0)
  const totalMixedProfit = mixedSales.reduce((sum, s) => sum + (Number(s.netProfitRWF) || 0), 0)

  // Active activities count
  const activeCount = Object.values(activeActivities).filter(Boolean).length

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Combined Hybrid Profit */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Overview', 'Profit Matrix')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-cyan-300 transition-colors uppercase tracking-wider">
            Combined Profit
          </span>
          <div className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-cyan-300 mt-1">
          {totalMixedProfit > 0 ? `+${totalMixedProfit.toLocaleString()}` : totalMixedProfit.toLocaleString()} RWF
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
          From {mixedSales.length} mixed checkouts
        </div>
      </button>

      {/* 2. Mixed Invoices Checkout */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Sales', 'All Sales')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
            Mixed Sales Till
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Receipt className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
          {totalMixedRevenue.toLocaleString()} RWF
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Single bill across all activities
        </div>
      </button>

      {/* 3. Selective Stock Switch */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Products & Stock', 'All Products')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-sky-300 transition-colors uppercase tracking-wider">
            Selective Stock
          </span>
          <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Scale className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-sky-300 mt-1">
          {physicalItems.length} Goods · {serviceItems.length} Services
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Stock Switch ON / OFF per item
        </div>
      </button>

      {/* 4. Active Business Activities */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Settings', 'Business Activities (On/Off)')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-purple-300 transition-colors uppercase tracking-wider">
            Active Branches
          </span>
          <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-purple-300 mt-1">
          {activeCount} Activities ON
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Modular Activity Switcher
        </div>
      </button>
    </div>
  )
}

