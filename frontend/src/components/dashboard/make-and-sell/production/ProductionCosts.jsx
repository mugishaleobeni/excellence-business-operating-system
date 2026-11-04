import React from 'react'
import {
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart2,
  Calendar,
  AlertCircle,
  Package
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'

export default function ProductionCosts({
  orders = [],
  recipes = [],
  products = [],
  hideFinancials = false
}) {
  const completedOrders = orders.filter((o) => o.status === 'Completed' || o.totalProductionCostRWF > 0)

  const totalCostAllCompleted = completedOrders.reduce(
    (sum, o) => sum + (o.totalProductionCostRWF || 0),
    0
  )

  const totalUnitsProduced = completedOrders.reduce(
    (sum, o) => sum + (o.actualQuantity || o.plannedQuantity || 0),
    0
  )

  const averageUnitCost = totalUnitsProduced > 0
    ? Math.round(totalCostAllCompleted / totalUnitsProduced)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-tight">
            Production Costs &amp; Unit Cost Analysis
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Analyze direct material costs, labor allocations, and energy expenses per manufactured unit.
          </p>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="exbos-glass-card p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Audited Production Cost</span>
          <div className="font-orbitron text-2xl sm:text-3xl font-black text-white">
            {formatRWF(totalCostAllCompleted, hideFinancials)}
          </div>
          <span className="text-[11px] text-slate-400">Across {completedOrders.length} completed batches</span>
        </div>

        <div className="exbos-glass-card p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase text-[#9EDCFF]">Average Manufacturing Cost</span>
          <div className="font-orbitron text-2xl sm:text-3xl font-black text-[#9EDCFF]">
            {formatRWF(averageUnitCost, hideFinancials)}
          </div>
          <span className="text-[11px] text-slate-400">Weighted average per usable unit</span>
        </div>

        <div className="exbos-glass-card p-5 space-y-2">
          <span className="text-[11px] font-bold uppercase text-emerald-400">Finished Units Yielded</span>
          <div className="font-orbitron text-2xl sm:text-3xl font-black text-emerald-400">
            {totalUnitsProduced} units
          </div>
          <span className="text-[11px] text-slate-400">Added to physical sale inventory</span>
        </div>
      </div>

      {/* Product Unit Cost Matrix */}
      <div className="exbos-glass-card p-5 space-y-4">
        <h4 className="font-orbitron text-sm font-bold text-white">
          Product Cost vs Selling Price &amp; Realized Margins
        </h4>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Production Cost</th>
                <th className="py-2.5 px-3 text-right">Catalog Selling Price</th>
                <th className="py-2.5 px-3 text-right">Gross Profit / Unit</th>
                <th className="py-2.5 px-3 text-right">Gross Margin (%)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((prod) => {
                const cost = Number(prod.unitProductionCostRWF || prod.unitCostRWF || 0)
                const price = Number(prod.sellingPriceRWF || 0)
                const profit = price - cost
                const margin = price > 0 ? Number(((profit / price) * 100).toFixed(1)) : 0
                const isUnderpriced = price > 0 && profit < 0

                return (
                  <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {prod.name || prod.title}
                      <span className="block text-[10px] text-slate-400">{prod.category}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatRWF(cost, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {formatRWF(price, hideFinancials)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {profit >= 0 ? `+${formatRWF(profit, hideFinancials)}` : `-${formatRWF(Math.abs(profit), hideFinancials)}`}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      margin >= 20 ? 'text-emerald-400' : margin > 0 ? 'text-amber-300' : 'text-rose-400'
                    }`}>
                      {margin}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isUnderpriced
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : margin < 20
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isUnderpriced ? 'Loss Warning' : margin < 20 ? 'Low Margin' : 'Healthy Margin'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Batch Cost Records */}
      <div className="exbos-glass-card p-5 space-y-4">
        <h4 className="font-orbitron text-sm font-bold text-white">
          Historical Batch Cost Audits
        </h4>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Units Produced</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Total Production Cost</th>
                <th className="py-2.5 px-3 text-right">Actual Unit Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {completedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-white">{order.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{order.productName}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {order.actualQuantity || order.plannedQuantity}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {order.completionDate || order.plannedDate}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-white font-bold">
                    {formatRWF(order.totalProductionCostRWF, hideFinancials)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#9EDCFF] font-bold">
                    {formatRWF(order.unitCostRWF, hideFinancials)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

