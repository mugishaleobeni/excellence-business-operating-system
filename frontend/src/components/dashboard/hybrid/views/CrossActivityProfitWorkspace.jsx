import React, { useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ShoppingBag,
  Wrench,
  Coffee,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import { HYBRID_PRESETS } from '../data/hybridPresets'

export default function CrossActivityProfitWorkspace() {
  const { demoWorkspaces, hybridTrade } = useExbos()
  const hybridWorkspace = demoWorkspaces?.['hybrid'] || {}
  const mixedSales = hybridWorkspace.records?.MixedSales || []
  const preset = HYBRID_PRESETS[hybridTrade] || HYBRID_PRESETS.techRepair

  // Calculate dynamic matrix from MixedSales or fallback to preset baseline
  const matrixData = useMemo(() => {
    // If we have actual mixed sales recorded, calculate from them
    let hasSales = mixedSales.length > 0
    let retailRev = 0, retailCost = 0
    let serviceRev = 0, serviceCost = 0
    let foodRev = 0, foodCost = 0
    let prodRev = 0, prodCost = 0

    if (hasSales) {
      mixedSales.forEach((sale) => {
        (sale.items || []).forEach((item) => {
          const lTotal = Number(item.lineTotal || item.unitPriceRWF * item.quantity) || 0
          const lCost = Number(item.lineCost || item.unitCostRWF * item.quantity) || 0
          if (item.activity === 'retail') {
            retailRev += lTotal
            retailCost += lCost
          } else if (item.activity === 'service') {
            serviceRev += lTotal
            serviceCost += lCost
          } else if (item.activity === 'food') {
            foodRev += lTotal
            foodCost += lCost
          } else if (item.activity === 'production') {
            prodRev += lTotal
            prodCost += lCost
          }
        })
      })
    }

    const calcStream = (id, name, rev, cost, icon, color) => {
      const profit = rev - cost
      const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0'
      return { id, name, revenue: rev, cost, profit, margin: Number(margin), icon, color }
    }

    const streams = [
      calcStream('retail', 'Retail Goods & Parts', retailRev, retailCost, ShoppingBag, 'blue'),
      calcStream('service', 'Services & Billable Labor', serviceRev, serviceCost, Wrench, 'purple'),
      calcStream('food', 'Food, Bakery & Dining', foodRev, foodCost, Coffee, 'amber'),
      calcStream('production', 'Production & Assemblies', prodRev, prodCost, Layers, 'emerald')
    ]

    const totalRev = streams.reduce((acc, s) => acc + s.revenue, 0)
    const totalCost = streams.reduce((acc, s) => acc + s.cost, 0)
    const totalProfit = totalRev - totalCost
    const totalMargin = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : '0.0'

    return {
      streams,
      totalRev,
      totalCost,
      totalProfit,
      totalMargin,
      hasLiveSales: hasSales
    }
  }, [mixedSales, preset])

  return (
    <div className="space-y-5">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Cross-Activity Profitability Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare gross revenue, direct costs, and margins between physical goods and service labor.
          </p>
        </div>
        {!matrixData.hasLiveSales && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/15 px-3 py-1.5 rounded-xl">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Showing Preset Baseline Matrix</span>
          </div>
        )}
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/[0.03] rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Combined Enterprise Revenue</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {matrixData.totalRev.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-stream aggregate</div>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Enterprise Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            +{matrixData.totalProfit.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Total value creation</div>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Blended Enterprise Margin</span>
            <ArrowUpRight className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400">{matrixData.totalMargin}%</div>
          <div className="text-[11px] text-purple-300/80 mt-1">Weighted gross margin</div>
        </div>
      </div>

      {/* Cross-Activity Revenue Distribution Bar */}
      {matrixData.totalRev > 0 && (
        <div className="bg-white/[0.03] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Revenue Contribution Share</span>
            <span className="text-slate-400">100% of Total Revenue</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
            {matrixData.streams.map((s) => {
              const pct = (s.revenue / matrixData.totalRev) * 100
              if (pct === 0) return null
              let bg = 'bg-blue-500'
              if (s.id === 'service') bg = 'bg-purple-500'
              if (s.id === 'food') bg = 'bg-amber-500'
              if (s.id === 'production') bg = 'bg-emerald-500'
              return (
                <div
                  key={s.id}
                  style={{ width: `${pct}%` }}
                  className={`${bg} transition-all`}
                  title={`${s.name}: ${pct.toFixed(1)}%`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs pt-1">
            {matrixData.streams.map((s) => {
              const pct = matrixData.totalRev > 0 ? ((s.revenue / matrixData.totalRev) * 100).toFixed(1) : 0
              let dot = 'bg-blue-500'
              if (s.id === 'service') dot = 'bg-purple-500'
              if (s.id === 'food') dot = 'bg-amber-500'
              if (s.id === 'production') dot = 'bg-emerald-500'
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                  <span className="text-slate-300">{s.name}:</span>
                  <span className="font-bold text-white">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Comparative Matrix Table */}
      <div className="bg-white/[0.02] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3.5 border-b border-white/5">
          <div className="text-xs font-semibold text-white">
            Activity Stream Profit Breakdown
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.04] text-slate-400 border-b border-white/5 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Activity Stream</th>
                <th className="px-4 py-3 text-right">Revenue (RWF)</th>
                <th className="px-4 py-3 text-right">Direct Costs (RWF)</th>
                <th className="px-4 py-3 text-right">Gross Profit (RWF)</th>
                <th className="px-4 py-3 text-right">Gross Margin %</th>
                <th className="px-4 py-3 text-center">Business Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matrixData.streams.map((s) => {
                const Icon = s.icon
                const isZero = s.revenue === 0
                return (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            s.id === 'retail'
                              ? 'bg-blue-500/20 text-blue-400'
                              : s.id === 'service'
                              ? 'bg-purple-500/20 text-purple-400'
                              : s.id === 'food'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{s.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {isZero ? 'Inactive in current preset' : 'Active stream'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-white whitespace-nowrap">
                      {s.revenue.toLocaleString()} RWF
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-slate-400 whitespace-nowrap">
                      {s.cost.toLocaleString()} RWF
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          s.profit > 0 ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        +{s.profit.toLocaleString()} RWF
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                      <span
                        className={
                          s.margin >= 70
                            ? 'text-emerald-400'
                            : s.margin >= 30
                            ? 'text-indigo-400'
                            : 'text-amber-400'
                        }
                      >
                        {s.margin}%
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {s.id === 'service' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Cash Flow Engine
                        </span>
                      )}
                      {s.id === 'retail' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          Turnover Volume
                        </span>
                      )}
                      {s.id === 'food' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          High Foot-Traffic
                        </span>
                      )}
                      {s.id === 'production' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Value Multiplier
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-white/[0.04] font-bold text-white border-t border-white/10">
              <tr>
                <td className="px-4 py-3">Total Consolidated</td>
                <td className="px-4 py-3 text-right">
                  {matrixData.totalRev.toLocaleString()} RWF
                </td>
                <td className="px-4 py-3 text-right text-slate-400">
                  {matrixData.totalCost.toLocaleString()} RWF
                </td>
                <td className="px-4 py-3 text-right text-emerald-400">
                  +{matrixData.totalProfit.toLocaleString()} RWF
                </td>
                <td className="px-4 py-3 text-right text-purple-400">
                  {matrixData.totalMargin}%
                </td>
                <td className="px-4 py-3 text-center text-xs text-indigo-400">
                  Enterprise Margin
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Strategic Synergy Callout */}
      <div className="bg-white/[0.03] rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-white">Hybrid Cross-Subsidization Advantage</div>
          <p className="text-slate-400 leading-relaxed">
            In a hybrid business, high-margin service labor (typically 75–85% gross margin) provides
            immediate cash buffer that finances physical inventory restocking without requiring
            expensive short-term bank loans.
          </p>
        </div>
      </div>
    </div>
  )
}

