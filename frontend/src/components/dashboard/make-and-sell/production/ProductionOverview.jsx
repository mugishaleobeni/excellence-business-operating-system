import React from 'react'
import {
  Factory,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Package,
  Sparkles,
  Calendar
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'

export default function ProductionOverview({
  orders = [],
  recipes = [],
  rawMaterials = [],
  onNavigateTo = null,
  hideFinancials = false
}) {
  const plannedOrders = orders.filter((o) => o.status === 'Planned')
  const inProgressOrders = orders.filter((o) => o.status === 'In Progress')
  const completedOrders = orders.filter((o) => o.status === 'Completed')

  const totalProductionCosts = completedOrders.reduce(
    (sum, o) => sum + (o.totalProductionCostRWF || 0),
    0
  )

  const totalWaste = completedOrders.reduce(
    (sum, o) => sum + (o.wasteQuantity || 0),
    0
  )

  const lowStockCount = rawMaterials.filter((m) => {
    const qty = Number(m.quantity ?? m.currentStock ?? 0)
    const min = Number(m.minimumStockLevel ?? 5)
    return qty <= min
  }).length

  const summaryCards = [
    {
      title: 'Planned Production',
      value: `${plannedOrders.length} Orders`,
      subtitle: `${plannedOrders.reduce((s, o) => s + (o.plannedQuantity || 0), 0)} units scheduled`,
      icon: Calendar,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300'
    },
    {
      title: 'In Progress',
      value: `${inProgressOrders.length} Active`,
      subtitle: `${inProgressOrders.reduce((s, o) => s + (o.plannedQuantity || 0), 0)} units currently manufacturing`,
      icon: Clock,
      color: 'text-[#218DFF]',
      badgeBg: 'bg-[#218DFF]/20 text-[#9EDCFF]'
    },
    {
      title: 'Completed Production',
      value: `${completedOrders.length} Batches`,
      subtitle: `${completedOrders.reduce((s, o) => s + (o.actualQuantity || o.plannedQuantity || 0), 0)} finished units added`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      title: 'Total Production Costs',
      value: formatRWF(totalProductionCosts, hideFinancials),
      subtitle: 'Materials, direct labor & energy',
      icon: DollarSign,
      color: 'text-white',
      badgeBg: 'bg-white/10 text-white'
    },
    {
      title: 'Material Shortages / Low Stock',
      value: `${lowStockCount} Materials`,
      subtitle: lowStockCount > 0 ? 'Requires supplier reorder' : 'All materials optimal',
      icon: AlertTriangle,
      color: lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400',
      badgeBg: lowStockCount > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
    },
    {
      title: 'Recorded Spoilage / Waste',
      value: `${totalWaste} units`,
      subtitle: 'Audited production loss',
      icon: Factory,
      color: 'text-slate-300',
      badgeBg: 'bg-white/10 text-slate-300'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-tight">
            Production Management Overview
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Manufacturing workflow hub: monitor active batches, material requirements, recipes, and cost performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateTo && (
            <button
              type="button"
              onClick={() => onNavigateTo('Production Calculator')}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Production Calculator</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={i}
              className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group hover:border-[#218DFF]/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${card.color}`} />
                  <span>{card.title}</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${card.badgeBg}`}>
                  {card.title.split(' ')[0]}
                </span>
              </div>
              <div className="font-orbitron text-2xl font-black text-white">
                {card.value}
              </div>
              <p className="text-[11px] text-slate-400">
                {card.subtitle}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTo && onNavigateTo('Production Calculator')}
          className="p-5 rounded-2xl bg-gradient-to-br from-[#1045CA]/30 to-[#071644] border border-[#218DFF]/40 hover:border-[#218DFF] cursor-pointer space-y-2 transition-all group shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#9EDCFF]">Core Feature</span>
            <ArrowRight className="w-4 h-4 text-[#218DFF] group-hover:translate-x-1 transition-transform" />
          </div>
          <h4 className="font-orbitron text-base font-bold text-white">
            Production &amp; Profit Calculator
          </h4>
          <p className="text-xs text-slate-300">
            Scale recipes, check shortages, recommend purchases, and simulate target selling margins.
          </p>
        </div>

        <div
          onClick={() => onNavigateTo && onNavigateTo('Recipes & Materials')}
          className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer space-y-2 transition-all group shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Formulas &amp; BOM</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h4 className="font-orbitron text-base font-bold text-white">
            {recipes.length} Registered Recipes
          </h4>
          <p className="text-xs text-slate-300">
            Standard formulas with automated unit cost calculation and material bill definitions.
          </p>
        </div>

        <div
          onClick={() => onNavigateTo && onNavigateTo('Production Orders')}
          className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer space-y-2 transition-all group shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Order Dispatch</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h4 className="font-orbitron text-base font-bold text-white">
            {orders.length} Batch Workflows
          </h4>
          <p className="text-xs text-slate-300">
            Manage scheduled production orders and execute completion into finished stock.
          </p>
        </div>
      </div>

      {/* Recent Production Workflows Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h4 className="font-orbitron text-sm font-bold text-white">
            Recent Production Activity
          </h4>
          <button
            type="button"
            onClick={() => onNavigateTo && onNavigateTo('Production Orders')}
            className="text-xs text-[#9EDCFF] hover:text-white font-semibold cursor-pointer flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                <th className="py-2.5 px-3">Batch Order</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Unit Cost</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-white">{order.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{order.productName}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {order.actualQuantity || order.plannedQuantity}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {order.completionDate || order.plannedDate}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#9EDCFF]">
                    {formatRWF(order.unitCostRWF, hideFinancials)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : order.status === 'In Progress'
                          ? 'bg-[#218DFF]/20 text-[#9EDCFF]'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {order.status}
                    </span>
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

