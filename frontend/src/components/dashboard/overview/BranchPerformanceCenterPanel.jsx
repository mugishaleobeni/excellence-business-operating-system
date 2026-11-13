import React, { useEffect, useMemo, useState } from 'react'
import { Trophy, Grid3X3, BarChart3, Layers, GitBranch, TrendingUp } from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import apiClient from '../../../utils/apiClient'
import { formatRWF } from '../../../utils/currencyWords'

const LEVEL_COLORS = [
  'bg-white/[0.06] border-white/10',
  'bg-[#0A2786] border-[#1045CA]/60',
  'bg-[#1045CA] border-[#218DFF]/60',
  'bg-[#218DFF] border-[#9EDCFF]/70',
  'bg-emerald-400 border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.45)]'
]

export default function BranchPerformanceCenterPanel({
  activeArchId = 'buy-and-sell',
  hideFinancials = false
}) {
  const {
    branches = [],
    activeBranchId = 'main',
    allWorkspaces = {},
    switchBranch
  } = useExbos()

  // Only the Main HQ Dashboard visualizes cross-branch performance
  if (activeBranchId !== 'main') return null

  const [viewMode, setViewMode] = useState('both') // 'both' | 'heatmap' | 'bar' | 'profit'
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL')
  const [backendAnalytics, setBackendAnalytics] = useState(null)

  useEffect(() => {
    apiClient
      .getBranchAnalytics(activeArchId)
      .then((res) => {
        if (res?.ok && res?.data) {
          setBackendAnalytics(res.data)
        }
      })
      .catch(() => {})
  }, [activeArchId, branches.length, allWorkspaces])

  // Compute live client-side branch stats + heatmap so updates reflect instantaneously
  const computed = useMemo(() => {
    const ws = allWorkspaces?.[activeArchId] || {}
    const records = ws.records || {}
    const salesList = [
      ...(records.Sales || []),
      ...(records.ServiceJobs || []),
      ...(records.KitchenOrders || []),
      ...(records.MixedSales || [])
    ]
    const purchasesList = records.Purchases || []
    const expensesList = records.Expenses || []

    const branchList =
      branches.length > 0
        ? branches
        : [{ id: 'main', name: 'Main HQ', isMain: true, location: 'Headquarters' }]

    const statsMap = {}
    branchList.forEach((b) => {
      statsMap[b.id] = {
        id: b.id,
        name: b.name,
        location: b.location || 'Rwanda',
        isMain: Boolean(b.isMain || b.id === 'main'),
        revenueRWF: 0,
        purchasesRWF: 0,
        expensesRWF: 0,
        netProfitRWF: 0,
        salesCount: 0
      }
    })

    const resolveBid = (rec) => {
      const raw = rec?.branchId || 'main'
      return statsMap[raw] ? raw : 'main'
    }

    const dailyMap = {}
    const addDay = (dateStr, rev) => {
      const d = String(dateStr || '').slice(0, 10)
      if (d.length !== 10) return
      if (!dailyMap[d]) dailyMap[d] = { count: 0, revenueRWF: 0 }
      dailyMap[d].count += 1
      dailyMap[d].revenueRWF += rev
    }

    salesList.forEach((s) => {
      const bid = resolveBid(s)
      const amt = Number(s.amountRWF || s.totalAmount || 0)
      statsMap[bid].revenueRWF += amt
      statsMap[bid].salesCount += 1
      if (selectedBranchFilter === 'ALL' || selectedBranchFilter === bid) {
        addDay(s.date, amt)
      }
    })

    purchasesList.forEach((p) => {
      const bid = resolveBid(p)
      statsMap[bid].purchasesRWF += Number(p.amountRWF || 0)
      if (selectedBranchFilter === 'ALL' || selectedBranchFilter === bid) {
        addDay(p.date, 0)
      }
    })

    expensesList.forEach((e) => {
      const bid = resolveBid(e)
      statsMap[bid].expensesRWF += Number(e.amountRWF || 0)
      if (selectedBranchFilter === 'ALL' || selectedBranchFilter === bid) {
        addDay(e.date, 0)
      }
    })

    const perfList = Object.values(statsMap).map((b) => ({
      ...b,
      netProfitRWF: b.revenueRWF - b.purchasesRWF - b.expensesRWF
    }))

    perfList.sort((a, b) => b.revenueRWF - a.revenueRWF || b.netProfitRWF - a.netProfitRWF)
    const bestBranch = perfList[0] || null
    const maxRevenue = Math.max(...perfList.map((b) => b.revenueRWF), 1)

    // 24 weeks (168 days) GitHub contribution grid
    const today = new Date()
    const days = 168
    const cells = []
    const maxDayRev = Math.max(...Object.values(dailyMap).map((v) => v.revenueRWF), 1)
    const maxDayCnt = Math.max(...Object.values(dailyMap).map((v) => v.count), 1)

    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(today)
      dt.setDate(today.getDate() - i)
      const iso = dt.toISOString().slice(0, 10)
      const entry = dailyMap[iso] || { count: 0, revenueRWF: 0 }
      let level = 0
      if (entry.count > 0 || entry.revenueRWF > 0) {
        const ratio = Math.max(entry.revenueRWF / maxDayRev, entry.count / maxDayCnt)
        level = ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4
      }
      cells.push({ date: iso, ...entry, level })
    }

    // Group into 24 columns of 7 days (like GitHub)
    const weeks = []
    for (let w = 0; w < cells.length; w += 7) {
      weeks.push(cells.slice(w, w + 7))
    }

    return {
      perfList,
      bestBranch,
      maxRevenue,
      weeks,
      totalOps: Object.values(dailyMap).reduce((a, b) => a + b.count, 0),
      totalBranchRev: perfList.reduce((a, b) => a + b.revenueRWF, 0)
    }
  }, [allWorkspaces, activeArchId, branches, selectedBranchFilter])

  const displayBranches = computed.perfList
  const best = computed.bestBranch || backendAnalytics?.bestBranch

  return (
    <div className="rounded-3xl border border-[#218DFF]/30 bg-gradient-to-br from-[#06143D]/95 via-[#040D29]/95 to-[#07184A]/95 p-5 sm:p-6 space-y-5 shadow-xl">
      {/* Header + Visualization Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#218DFF]/20 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF]">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-orbitron text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Main HQ · Branch Activity &amp; Best Performer</span>
              {best && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                  <Trophy className="w-3 h-3" />
                  <span>Top: {best.name}</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-300">
              GitHub-style daily business activity heatmap &amp; cross-branch performance graph.
            </p>
          </div>
        </div>

        {/* Visualization Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {branches.length > 1 && (
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs font-semibold text-white cursor-pointer"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
            {[
              { id: 'both', label: 'Both', icon: Layers },
              { id: 'heatmap', label: 'GitHub Grid', icon: Grid3X3 },
              { id: 'bar', label: 'Branch Graph', icon: BarChart3 },
              { id: 'profit', label: 'Profit Share', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon
              const active = viewMode === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    active
                      ? 'bg-[#218DFF] text-white shadow'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className={`grid gap-5 ${viewMode === 'both' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {/* 1. GitHub-Style Contribution Heatmap */}
        {(viewMode === 'both' || viewMode === 'heatmap') && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-orbitron font-bold text-[#9EDCFF]">
                Daily Contribution Heatmap (Last 24 Weeks)
              </span>
              <span className="font-mono text-slate-300">
                {computed.totalOps} transactions
              </span>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="inline-flex gap-1.5 min-w-max">
                {computed.weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1.5">
                    {week.map((day) => (
                      <div
                        key={day.date}
                        title={`${day.date}: ${day.count} entries · ${formatRWF(day.revenueRWF, hideFinancials)}`}
                        className={`w-3.5 h-3.5 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${
                          LEVEL_COLORS[day.level] || LEVEL_COLORS[0]
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Hover any square for daily volume</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                {LEVEL_COLORS.map((cls, idx) => (
                  <span key={idx} className={`w-3 h-3 rounded-[2px] border inline-block ${cls}`} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Best Performing Branch Bar Graph */}
        {(viewMode === 'both' || viewMode === 'bar' || viewMode === 'profit') && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-orbitron font-bold text-[#9EDCFF]">
                {viewMode === 'profit' ? 'Branch Net Profit Comparison' : 'Best Performing Branch Ranking'}
              </span>
              <span className="font-mono text-emerald-300">
                Total: {formatRWF(computed.totalBranchRev, hideFinancials)}
              </span>
            </div>

            <div className="space-y-3">
              {displayBranches.map((b, idx) => {
                const metricVal = viewMode === 'profit' ? Math.max(0, b.netProfitRWF) : b.revenueRWF
                const denom =
                  viewMode === 'profit'
                    ? Math.max(...displayBranches.map((x) => Math.max(0, x.netProfitRWF)), 1)
                    : computed.maxRevenue
                const pct = Math.min(100, Math.round((metricVal / denom) * 100))
                const isWinner = idx === 0 && metricVal > 0

                return (
                  <div
                    key={b.id}
                    onClick={() => switchBranch && switchBranch(b.id)}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                            isWinner
                              ? 'bg-amber-400 text-[#040C26]'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white truncate">{b.name}</span>
                        {isWinner && (
                          <span className="text-[9px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            Best
                          </span>
                        )}
                      </div>
                      <div className="text-right font-mono font-bold text-emerald-300 shrink-0">
                        {formatRWF(viewMode === 'profit' ? b.netProfitRWF : b.revenueRWF, hideFinancials)}
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isWinner
                            ? 'bg-gradient-to-r from-[#218DFF] to-emerald-400'
                            : 'bg-[#218DFF]/80'
                        }`}
                        style={{ width: `${Math.max(pct, metricVal > 0 ? 4 : 0)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{b.salesCount} sales</span>
                      <span>Net Profit: {formatRWF(b.netProfitRWF, hideFinancials)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

