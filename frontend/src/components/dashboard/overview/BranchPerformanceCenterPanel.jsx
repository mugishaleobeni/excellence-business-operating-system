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

  const currentYear = new Date().getFullYear()
  const availableYears = [currentYear, currentYear - 1, currentYear - 2]
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [viewMode, setViewMode] = useState('both') // 'both' | 'heatmap' | 'bar' | 'profit'
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL')
  const [backendAnalytics, setBackendAnalytics] = useState(null)

  useEffect(() => {
    let active = true
    const fetchLiveAnalytics = () => {
      apiClient
        .getBranchAnalytics(activeArchId)
        .then((res) => {
          const analyticsData = res?.data?.data || res?.data
          if (active && res?.ok && analyticsData) {
            setBackendAnalytics(analyticsData)
          }
        })
        .catch(() => {})
    }

    fetchLiveAnalytics()
    const timer = window.setInterval(fetchLiveAnalytics, 12000)
    const onFocus = () => fetchLiveAnalytics()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchLiveAnalytics()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [activeArchId, branches.length, allWorkspaces])

  // Compute live branch stats + heatmap, automatically merging live MongoDB analytics
  // so sales recorded by Branch Managers on WhatsApp or another device appear instantaneously on Main HQ
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

    const liveBranches = Array.isArray(backendAnalytics?.branches) ? backendAnalytics.branches : []
    const useLiveBackend = liveBranches.length > 0

    let perfList = []
    let dailyMap = {}

    if (useLiveBackend) {
      perfList = liveBranches.map((b) => ({
        id: b.id,
        name: b.name,
        location: b.location || 'Rwanda',
        isMain: Boolean(b.isMain || b.id === 'main'),
        revenueRWF: Number(b.revenueRWF || 0),
        purchasesRWF: Number(b.purchasesRWF || 0),
        expensesRWF: Number(b.expensesRWF || 0),
        netProfitRWF: Number(b.netProfitRWF || 0),
        salesCount: Number(b.salesCount || 0)
      }))
      const liveDailyByBranch = backendAnalytics?.dailyActivityByBranch || {}
      if (selectedBranchFilter !== 'ALL' && liveDailyByBranch[selectedBranchFilter]) {
        dailyMap = liveDailyByBranch[selectedBranchFilter]
      } else {
        dailyMap = backendAnalytics?.dailyActivity || {}
      }
    } else {
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
        const raw = String(rec?.branchId || 'main').trim()
        return statsMap[raw] ? raw : null
      }

      const addDay = (dateStr, rev) => {
        const d = String(dateStr || '').slice(0, 10)
        if (d.length !== 10) return
        if (!dailyMap[d]) dailyMap[d] = { count: 0, revenueRWF: 0 }
        dailyMap[d].count += 1
        dailyMap[d].revenueRWF += rev
      }

      salesList.forEach((s) => {
        const bid = resolveBid(s)
        if (!bid || !statsMap[bid]) return
        const amt = Number(s.amountRWF || s.totalAmount || 0)
        statsMap[bid].revenueRWF += amt
        statsMap[bid].salesCount += 1
        if (selectedBranchFilter === 'ALL' || selectedBranchFilter === bid) {
          addDay(s.date, amt)
        }
      })

      purchasesList.forEach((p) => {
        const bid = resolveBid(p)
        if (!bid || !statsMap[bid]) return
        statsMap[bid].purchasesRWF += Number(p.amountRWF || 0)
        if (selectedBranchFilter === 'ALL' || selectedBranchFilter === bid) {
          addDay(p.date, 0)
        }
      })

      expensesList.forEach((e) => {
        const bid = resolveBid(e)
        if (!bid || !statsMap[bid]) return
        statsMap[bid].expensesRWF += Number(e.amountRWF || 0)
        if (selectedBranchFilter === 'ALL' || selectedBranchFilter === bid) {
          addDay(e.date, 0)
        }
      })

      perfList = Object.values(statsMap).map((b) => ({
        ...b,
        netProfitRWF: b.revenueRWF - b.purchasesRWF - b.expensesRWF
      }))
    }

    perfList.sort((a, b) => b.revenueRWF - a.revenueRWF || b.netProfitRWF - a.netProfitRWF)
    const bestBranch = perfList[0] || null
    const maxRevenue = Math.max(...perfList.map((b) => b.revenueRWF), 1)

    // Full 52-week GitHub-style contribution grid aligned to Sun..Sat rows with Month labels
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const today = new Date()
    const endDate =
      selectedYear === currentYear
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
        : new Date(selectedYear, 11, 31)
    const rawStart =
      selectedYear === currentYear
        ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 364)
        : new Date(selectedYear, 0, 1)
    // Align start to Sunday so rows match Sun(0), Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6)
    const startDate = new Date(rawStart)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const maxDayRev = Math.max(...Object.values(dailyMap).map((v) => v.revenueRWF), 1)
    const maxDayCnt = Math.max(...Object.values(dailyMap).map((v) => v.count), 1)

    const weeks = []
    const monthLabels = []
    let lastMonthKey = ''
    let yearTotalOps = 0
    const cursor = new Date(startDate)

    while (cursor <= endDate || weeks.length === 0) {
      const weekCol = []
      const weekIdx = weeks.length
      for (let d = 0; d < 7; d++) {
        const dt = new Date(cursor)
        const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
        const inRange = dt >= rawStart && dt <= endDate
        const entry = inRange ? (dailyMap[iso] || { count: 0, revenueRWF: 0 }) : { count: 0, revenueRWF: 0 }
        if (inRange) yearTotalOps += entry.count
        let level = 0
        if (inRange && (entry.count > 0 || entry.revenueRWF > 0)) {
          const ratio = Math.max(entry.revenueRWF / maxDayRev, entry.count / maxDayCnt)
          level = ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4
        }
        if (d === 0 && inRange) {
          const mKey = `${dt.getFullYear()}-${dt.getMonth()}`
          if (mKey !== lastMonthKey) {
            monthLabels.push({ weekIdx, label: MONTH_NAMES[dt.getMonth()] })
            lastMonthKey = mKey
          }
        }
        weekCol.push({ date: iso, ...entry, level, inRange })
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(weekCol)
      if (weeks.length >= 54) break
    }

    return {
      perfList,
      bestBranch,
      maxRevenue,
      weeks,
      monthLabels,
      yearTotalOps,
      totalOps: Object.values(dailyMap).reduce((a, b) => a + b.count, 0),
      totalBranchRev: perfList.reduce((a, b) => a + b.revenueRWF, 0)
    }
  }, [allWorkspaces, activeArchId, branches, selectedBranchFilter, backendAnalytics, selectedYear, currentYear])

  const customBranches = branches.filter((b) => !b.isMain && b.id !== 'main')
  // Only the Main HQ Dashboard visualizes cross-branch performance, and only when at least 1 custom branch exists
  if (activeBranchId !== 'main' || customBranches.length === 0) return null

  const displayBranches = computed.perfList
  const best = computed.bestBranch || backendAnalytics?.bestBranch

  return (
    <div className="rounded-3xl border border-[#218DFF]/30 bg-gradient-to-br from-[#06143D]/95 via-[#040D29]/95 to-[#07184A]/95 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl overflow-hidden max-w-full">
      {/* Header + Visualization Switcher */}
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3.5 border-b border-white/10 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#218DFF]/20 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF] shrink-0 mt-0.5">
            <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-orbitron text-sm sm:text-base font-bold text-white leading-snug">
                Main HQ · Branch Activity &amp; Best Performer
              </h3>
              {best && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-[11px] font-bold max-w-full">
                  <Trophy className="w-3 h-3 shrink-0" />
                  <span className="truncate">Top: {best.name}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ExBOS daily activity pulse &amp; cross-branch performance graph.
            </p>
          </div>
        </div>

        {/* Visualization Mode Switcher — all 4 tabs always visible on desktop without scrolling */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full 2xl:w-auto shrink-0">
          {branches.length > 1 && (
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs font-semibold text-white cursor-pointer shrink-0"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <div className="w-full sm:w-auto shrink-0">
            <div className="grid grid-cols-4 sm:inline-flex rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
              {[
                { id: 'both', label: 'Both', shortLabel: 'Both', icon: Layers },
                { id: 'heatmap', label: 'Activity Pulse', shortLabel: 'Pulse', icon: Grid3X3 },
                { id: 'bar', label: 'Branch Graph', shortLabel: 'Graph', icon: BarChart3 },
                { id: 'profit', label: 'Profit Share', shortLabel: 'Profit', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon
                const active = viewMode === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewMode(tab.id)}
                    className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                      active
                        ? 'bg-[#218DFF] text-white shadow'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {/* 1. GitHub-Style 52-Week Contribution Heatmap with ExBOS Sapphire Theme & Year Selector */}
        {(viewMode === 'both' || viewMode === 'heatmap') && (
          <div className="flex flex-col md:flex-row gap-4 min-w-0">
            <div className="flex-1 min-w-0 space-y-2.5">
              {/* Top Count Header (GitHub-style) */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
                <div className="text-xs sm:text-sm font-semibold text-white">
                  <span className="font-orbitron font-bold text-[#9EDCFF]">
                    {computed.yearTotalOps.toLocaleString()}
                  </span>{' '}
                  operations {selectedYear === currentYear ? 'in the last year' : `in ${selectedYear}`}
                </div>
                <span className="text-[11px] text-slate-400">
                  {hoveredDay
                    ? `${hoveredDay.date}: ${hoveredDay.count} ${hoveredDay.count === 1 ? 'entry' : 'entries'} · ${formatRWF(hoveredDay.revenueRWF, hideFinancials)}`
                    : 'Branch activity pulse'}
                </span>
              </div>

              {/* Framed Contribution Matrix Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#030B24]/80 border border-[#218DFF]/25 space-y-2.5 min-w-0 overflow-hidden">
                <div className="overflow-x-auto pb-1">
                  <div className="inline-block min-w-max">
                    {/* Month Labels Row */}
                    <div className="flex items-center mb-1.5 pl-8">
                      <div className="relative h-4" style={{ width: `${computed.weeks.length * 14}px` }}>
                        {computed.monthLabels.map((m) => (
                          <span
                            key={`${m.weekIdx}-${m.label}`}
                            style={{ left: `${m.weekIdx * 14}px` }}
                            className="absolute top-0 text-[10px] font-medium text-slate-300 select-none whitespace-nowrap"
                          >
                            {m.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Weekday Labels + 52-Week Squares Grid */}
                    <div className="flex items-start gap-2">
                      {/* Weekday Axis (Mon, Wed, Fri) */}
                      <div className="flex flex-col justify-between text-[10px] text-slate-400 font-medium select-none w-6 shrink-0 pt-[14px] h-[95px]">
                        <span className="leading-[11px]">Mon</span>
                        <span className="leading-[11px]">Wed</span>
                        <span className="leading-[11px]">Fri</span>
                      </div>

                      {/* Week Columns */}
                      <div className="inline-flex gap-[3px]">
                        {computed.weeks.map((week, wi) => (
                          <div key={wi} className="flex flex-col gap-[3px]">
                            {week.map((day) => (
                              <div
                                key={day.date}
                                onMouseEnter={() => day.inRange && setHoveredDay(day)}
                                onMouseLeave={() => setHoveredDay(null)}
                                onClick={() => day.inRange && setHoveredDay(day)}
                                title={
                                  day.inRange
                                    ? `${day.date}: ${day.count} entries · ${formatRWF(day.revenueRWF, hideFinancials)}`
                                    : ''
                                }
                                className={`w-[11px] h-[11px] rounded-[2px] border transition-transform ${
                                  day.inRange
                                    ? `hover:scale-125 cursor-pointer ${LEVEL_COLORS[day.level] || LEVEL_COLORS[0]}`
                                    : 'opacity-0 pointer-events-none border-transparent'
                                }`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Legend Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
                  <span>Hover or tap any square to inspect daily branch volume</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span>Less</span>
                    {LEVEL_COLORS.map((cls, idx) => (
                      <span key={idx} className={`w-[11px] h-[11px] rounded-[2px] border inline-block ${cls}`} />
                    ))}
                    <span>More</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right-Hand Year Selector Sidebar (GitHub-style, ExBOS Sapphire Blue Active Pill) */}
            <div className="flex flex-row md:flex-col gap-1.5 md:w-24 shrink-0 md:pt-7">
              {availableYears.map((yr) => {
                const active = selectedYear === yr
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setSelectedYear(yr)
                      setHoveredDay(null)
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#218DFF] text-white shadow-[0_4px_14px_rgba(33,141,255,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/10 bg-transparent'
                    }`}
                  >
                    {yr}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 2. Best Performing Branch Bar Graph */}
        {(viewMode === 'both' || viewMode === 'bar' || viewMode === 'profit') && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-orbitron font-bold text-[#9EDCFF]">
                {viewMode === 'profit' ? 'Branch Net Profit Comparison' : 'Best Performing Branch Ranking'}
              </span>
              <span className="font-mono text-emerald-300 whitespace-nowrap">
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

