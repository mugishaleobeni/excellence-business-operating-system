import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Package,
  TrendingDown,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react'

export default function AlertsAndDeadStockView({
  inventory = [],
  sales = [],
  hideFinancials = false,
  formatRWF = (v) => `${Number(v || 0).toLocaleString()} RWF`,
  onOpenReorder
}) {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'low' | 'dead'

  // Analyze inventory for low stock and dead stock
  const analysis = useMemo(() => {
    const soldItemIds = new Set(
      (sales || []).map((s) => s.productId || s.itemId).filter(Boolean)
    )

    const lowStockItems = []
    const deadStockItems = []

    inventory.forEach((item) => {
      const currentQty = Number(item.quantity ?? item.stock ?? item.currentStock) || 0
      const reorderLevel = Number(item.lowStockAlert ?? item.reorderLevel ?? item.minimumStockLevel) || 5
      const unitCost = Number(item.unitCostRWF ?? item.costPerUnitRWF ?? item.costPriceRWF) || 0
      const sellingPrice = Number(item.unitPriceRWF ?? item.sellingPriceRWF ?? item.priceRWF) || 0

      const isLow = currentQty <= reorderLevel
      const isDead = currentQty > 0 && !soldItemIds.has(item.id)

      if (isLow) {
        lowStockItems.push({
          ...item,
          currentQty,
          reorderLevel,
          unitCost,
          sellingPrice,
          deficit: Math.max(0, reorderLevel * 2 - currentQty)
        })
      }

      if (isDead) {
        deadStockItems.push({
          ...item,
          currentQty,
          reorderLevel,
          unitCost,
          sellingPrice,
          tiedUpCapital: currentQty * unitCost
        })
      }
    })

    const tiedUpInDeadStock = deadStockItems.reduce(
      (sum, i) => sum + (i.tiedUpCapital || 0),
      0
    )

    return {
      lowStockItems,
      deadStockItems,
      tiedUpInDeadStock
    }
  }, [inventory, sales])

  const displayedItems = useMemo(() => {
    if (activeTab === 'low') return analysis.lowStockItems
    if (activeTab === 'dead') return analysis.deadStockItems
    const combined = [...analysis.lowStockItems]
    analysis.deadStockItems.forEach((d) => {
      if (!combined.some((c) => c.id === d.id)) combined.push(d)
    })
    return combined
  }, [activeTab, analysis])

  return (
    <div className="space-y-6">
      {/* 3 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="exbos-glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Low Stock Alerts</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-300">
              Needs Reorder
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-orbitron font-extrabold text-2xl text-white">
              {analysis.lowStockItems.length}
            </span>
            <span className="text-xs text-rose-300 font-medium">SKUs critical</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Items at or below reorder minimum threshold.
          </p>
        </div>

        <div className="exbos-glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Dead Stock / Slow Movers</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
              Zero Sales
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-orbitron font-extrabold text-2xl text-amber-300">
              {analysis.deadStockItems.length}
            </span>
            <span className="text-xs text-amber-200 font-medium">Unsold lines</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Stock sitting without recorded checkout activity.
          </p>
        </div>

        <div className="exbos-glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Trapped Working Capital</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-300">
              Tied in Stock
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-orbitron font-extrabold text-2xl text-white">
              {formatRWF(analysis.tiedUpInDeadStock, hideFinancials)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cash locked in dormant inventory awaiting liquidation.
          </p>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: `All Alerts (${analysis.lowStockItems.length + analysis.deadStockItems.length})` },
            { id: 'low', label: `Critical Low Stock (${analysis.lowStockItems.length})` },
            { id: 'dead', label: `Dead Stock (${analysis.deadStockItems.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-[#218DFF] text-white shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Alert Items */}
      <div className="exbos-glass-card rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Item / SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Current Stock</th>
                <th className="px-4 py-3 text-center">Reorder Threshold</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-center">Alert Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <span>No critical inventory alerts or dead stock found. Stock is well balanced.</span>
                  </td>
                </tr>
              ) : (
                displayedItems.map((item) => {
                  const isLow = (Number(item.currentQty ?? item.quantity) || 0) <= (Number(item.reorderLevel) || 5)
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-xs">{item.name || item.title}</div>
                        <span className="font-mono text-[10px] text-slate-400">{item.id}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.category || 'General'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-white">
                        {item.currentQty ?? item.quantity ?? 0} {item.unit || 'pcs'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-400">
                        {item.reorderLevel || 5} {item.unit || 'pcs'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {formatRWF(item.sellingPrice || item.sellingPriceRWF || item.priceRWF, hideFinancials)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                            Dead Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isLow && onOpenReorder ? (
                          <button
                            type="button"
                            onClick={() => onOpenReorder(item)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reorder</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Discount promo</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

