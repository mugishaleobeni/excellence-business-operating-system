import React, { useMemo } from 'react'
import {
  Layers,
  ShoppingCart,
  PieChart,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import { HYBRID_PRESETS } from '../../hybrid/data/hybridPresets'

export default function HybridStatusBanner({
  handleModuleClick = () => {},
  setActivePage = () => {}
}) {
  const { demoWorkspaces, hybridTrade = 'techRepair', hybridActivities } = useExbos()
  const currentPreset = HYBRID_PRESETS[hybridTrade] || HYBRID_PRESETS.techRepair
  const workspace = demoWorkspaces?.['hybrid'] || {}
  const records = workspace.records || {}

  const hybridItems = Array.isArray(records['HybridItems'])
    ? records['HybridItems']
    : []

  const mixedSales = Array.isArray(records['MixedSales'])
    ? records['MixedSales']
    : []

  // Active activities count
  const activeActivitiesCount = useMemo(() => {
    const acts = hybridActivities || currentPreset.activeActivities || {}
    return Object.values(acts).filter(Boolean).length
  }, [hybridActivities, currentPreset])

  // Total sales & blended margin
  const metrics = useMemo(() => {
    const totalRev = mixedSales.reduce((sum, s) => sum + (Number(s.totalAmountRWF) || 0), 0)
    const totalCost = mixedSales.reduce((sum, s) => sum + (Number(s.totalCostRWF) || 0), 0)
    const totalProfit = totalRev - totalCost
    const margin = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : '0.0'

    return {
      totalRev,
      totalProfit,
      margin,
      salesCount: mixedSales.length
    }
  }, [mixedSales])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Multi-Activity Engine */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Multi-Activity Engine</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
            {activeActivitiesCount} Active Streams
          </span>
        </div>
        <div className="space-y-1">
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
            {hybridItems.length} Catalog Items
          </div>
          <p className="text-[11px] text-slate-300">
            Combined retail products, billable labor &amp; dining on one system
          </p>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-indigo-300 font-semibold text-[11px]">
            {currentPreset.name}
          </span>
          <button
            type="button"
            onClick={() => {
              handleModuleClick('Products & Stock')
              setActivePage('All Products')
            }}
            className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <span>Catalog Matrix</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Mixed Sales Ledger */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span>Mixed Sales Revenue</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
            {metrics.salesCount} Checkouts
          </span>
        </div>
        <div className="space-y-1">
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.totalRev.toLocaleString()} RWF
          </div>
          <p className="text-[11px] text-slate-300">
            Unified billing: physical goods + labor services on 1 receipt
          </p>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-emerald-300 font-semibold text-[11px]">
            +{metrics.totalProfit.toLocaleString()} RWF Profit
          </span>
          <button
            type="button"
            onClick={() => {
              handleModuleClick('Sales')
              setActivePage('All Sales')
            }}
            className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <span>Sales Drawer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Cross-Activity Blended Margin */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span>Blended Margin Matrix</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-300">
            Synergy Active
          </span>
        </div>
        <div className="space-y-1">
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.margin}% Gross Margin
          </div>
          <p className="text-[11px] text-slate-300">
            High-margin service labor subsidizes physical stock turnover
          </p>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Cross-Activity Matrix</span>
          <button
            type="button"
            onClick={() => {
              handleModuleClick('Overview')
              setActivePage('Activity Summary')
            }}
            className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <span>Profit Matrix</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

