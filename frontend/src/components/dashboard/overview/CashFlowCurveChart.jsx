import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  TrendingUp,
  BarChart2,
  LineChart,
  Sliders,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PlusCircle,
  Eye,
  Info
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import { FINANCIAL_DATASETS } from '../data/financialDatasets'

const ARCH_METADATA = {
  'make-and-sell': {
    number: '01',
    badge: 'Smart Workshop Production',
    title: 'Workshop Cash Velocity & Batch Margins',
    subtitle: 'Finished goods turnover vs raw material consumption & batch operational costs.',
    inflowName: 'Finished Goods Sales',
    outflowName: 'Raw Materials & Batch Runs'
  },
  'buy-and-sell': {
    number: '02',
    badge: 'Wholesale & Retail Commerce',
    title: 'Store Turnover & Inventory Cash Flow',
    subtitle: 'Customer retail cash receipts vs supplier inventory replenishment & store overhead.',
    inflowName: 'Store Sales Receipts',
    outflowName: 'Wholesale Restock & Expenses'
  },
  'services': {
    number: '03',
    badge: 'Professional Service Hub',
    title: 'Service Bookings & Labor Margins',
    subtitle: 'Billable client sessions & contracts vs technician commissions & operational supplies.',
    inflowName: 'Service Fees & Deposits',
    outflowName: 'Staff Commissions & Supplies'
  },
  'agriculture': {
    number: '04',
    badge: 'Livestock & Crop Operations',
    title: 'Farm Yield & Cycle Cash Flow',
    subtitle: 'Harvest, animal sales & dairy turnover vs commercial feed & veterinary care expenses.',
    inflowName: 'Livestock & Yield Sales',
    outflowName: 'Feed, Vet & Farm Overhead'
  },
  'food-and-hospitality': {
    number: '05',
    badge: 'Dining & Lodging Enterprise',
    title: 'Hospitality Turnover & Kitchen Margins',
    subtitle: 'Dining table orders, guest rooms & folios vs kitchen food ingredients & room upkeep.',
    inflowName: 'Dining & Room Folios',
    outflowName: 'Kitchen Ingredients & Rooms'
  },
  'hybrid': {
    number: '06',
    badge: 'Multi-Activity Enterprise',
    title: 'Cross-Activity Consolidated Trajectory',
    subtitle: 'Blended retail checkouts & service bookings vs consolidated group overhead.',
    inflowName: 'Blended Cart Checkout',
    outflowName: 'Consolidated Operations'
  }
}

export default function CashFlowCurveChart({
  activeArchId = 'buy-and-sell',
  currentArch = {},
  archTransactions = [],
  hideFinancials = false,
  onOpenWorkflowModal
}) {
  // Graph Mode: 'spline' (Smooth Area Curve) | 'bars' (Comparative Dual Bars) | 'cumulative' (Cumulative Net Runway) | 'velocity' (Period Net Velocity Waterfall)
  const [graphMode, setGraphMode] = useState(() => {
    try {
      return localStorage.getItem('exbos_cash_curve_mode') || 'spline'
    } catch {
      return 'spline'
    }
  })

  // Timeframe: 'Days' | 'Weeks' | 'Months'
  const [graphTimeframe, setGraphTimeframe] = useState(() => {
    try {
      return localStorage.getItem('exbos_cash_curve_timeframe') || 'Months'
    } catch {
      return 'Months'
    }
  })

  // Metric Focus: 'all' | 'income' | 'expense' | 'net'
  const [metricFocus, setMetricFocus] = useState(() => {
    try {
      return localStorage.getItem('exbos_cash_curve_focus') || 'all'
    } catch {
      return 'all'
    }
  })

  // Data Mode: false = Live DB records (clean zero baseline if 0 transactions), true = Benchmark Forecast
  const [useBenchmarkForecast, setUseBenchmarkForecast] = useState(false)
  const [activeCurveIndex, setActiveCurveIndex] = useState(5)
  const svgRef = useRef(null)

  const archMeta = ARCH_METADATA[activeArchId] || ARCH_METADATA['buy-and-sell']
  const activeArchDatasets = FINANCIAL_DATASETS[activeArchId] || FINANCIAL_DATASETS['buy-and-sell']

  // Persist graph settings on change
  const handleSelectMode = (mode) => {
    setGraphMode(mode)
    try {
      localStorage.setItem('exbos_cash_curve_mode', mode)
    } catch {}
  }

  const handleSelectTimeframe = (tf) => {
    setGraphTimeframe(tf)
    setActiveCurveIndex(tf === 'Days' ? 6 : tf === 'Weeks' ? 3 : 5)
    try {
      localStorage.setItem('exbos_cash_curve_timeframe', tf)
    } catch {}
  }

  const handleSelectFocus = (focus) => {
    setMetricFocus(focus)
    try {
      localStorage.setItem('exbos_cash_curve_focus', focus)
    } catch {}
  }

  const hasLiveTransactions = Array.isArray(archTransactions) && archTransactions.length > 0

  // Computed Chart Series
  const computedChartData = useMemo(() => {
    const defaultData = activeArchDatasets[graphTimeframe] || activeArchDatasets.Months

    // If user has chosen to view Benchmark Forecast, or if no live transactions exist and user toggled forecast
    if (useBenchmarkForecast) {
      let runNet = 0
      return defaultData.map((d) => {
        const net = (d.income || 0) - (d.expense || 0)
        runNet += net
        return {
          ...d,
          net,
          cumulative: runNet,
          margin: d.income > 0 ? Math.round((net / d.income) * 100) : 0
        }
      })
    }

    // Live Database Calculation:
    if (!hasLiveTransactions) {
      // Clean zero baseline ready for live transactions
      return defaultData.map((d) => ({
        ...d,
        income: 0,
        expense: 0,
        net: 0,
        cumulative: 0,
        margin: 0,
        change: '+0%'
      }))
    }

    // Accumulate actual money in and out from real user transactions
    const totalIn = archTransactions
      .filter((t) => t.type === 'in')
      .reduce((acc, t) => acc + (Number(t.amountRWF) || 0), 0)
    const totalOut = archTransactions
      .filter((t) => t.type === 'out')
      .reduce((acc, t) => acc + (Number(t.amountRWF) || 0), 0)

    // Distribute across timeline buckets based on dates or progressive weighted trajectory
    let runningNet = 0
    return defaultData.map((d, idx) => {
      const weight = (idx + 1) / defaultData.length
      const inc = Math.round(totalIn * weight)
      const exp = Math.round(totalOut * weight)
      const net = inc - exp
      runningNet += net
      const prevInc = idx > 0 ? Math.round(totalIn * (idx / defaultData.length)) : 0
      const changePct =
        prevInc > 0 && inc > prevInc
          ? `+${Math.round(((inc - prevInc) / prevInc) * 100)}%`
          : inc > exp
          ? `+${Math.round(((inc - exp) / (exp || 1)) * 100)}%`
          : '+0%'

      return {
        ...d,
        income: inc,
        expense: exp,
        net,
        cumulative: runningNet,
        margin: inc > 0 ? Math.round((net / inc) * 100) : 0,
        change: changePct
      }
    })
  }, [activeArchDatasets, graphTimeframe, archTransactions, hasLiveTransactions, useBenchmarkForecast])

  const currentChartData = computedChartData
  const safeIndex = Math.min(activeCurveIndex, currentChartData.length - 1)
  const activeData = currentChartData[safeIndex] || currentChartData[0] || { income: 0, expense: 0, net: 0, cumulative: 0, label: '' }

  // Aggregate Period KPI metrics
  const periodKpi = useMemo(() => {
    const totalInc = currentChartData.reduce((sum, d) => sum + (d.income || 0), 0)
    const totalExp = currentChartData.reduce((sum, d) => sum + (d.expense || 0), 0)
    const netTakeHome = totalInc - totalExp
    const margin = totalInc > 0 ? Math.round((netTakeHome / totalInc) * 100) : 0
    const peakItem = [...currentChartData].sort((a, b) => (b.income || 0) - (a.income || 0))[0] || { label: 'None', income: 0 }
    return {
      totalInc,
      totalExp,
      netTakeHome,
      margin,
      peakLabel: peakItem.label,
      peakIncome: peakItem.income
    }
  }, [currentChartData])

  // SVG Geometry Dimensions
  const svgWidth = 840
  const svgHeight = 280
  const paddingLeft = 20
  const paddingRight = 20
  const paddingTop = 28
  const paddingBottom = 32

  // Determine scale range based on current graphMode & metricFocus
  const { minVal, maxVal, range } = useMemo(() => {
    let rawMax = 1000
    let rawMin = 0

    if (graphMode === 'cumulative') {
      const vals = currentChartData.map((d) => d.cumulative || 0)
      rawMax = Math.max(...vals, 1000)
      rawMin = Math.min(...vals, 0)
    } else if (graphMode === 'velocity') {
      const vals = currentChartData.map((d) => d.net || 0)
      rawMax = Math.max(...vals, 1000)
      rawMin = Math.min(...vals, -1000)
    } else {
      // spline or bars
      if (metricFocus === 'income') {
        rawMax = Math.max(...currentChartData.map((d) => d.income), 1000)
      } else if (metricFocus === 'expense') {
        rawMax = Math.max(...currentChartData.map((d) => d.expense), 1000)
      } else if (metricFocus === 'net') {
        const vals = currentChartData.map((d) => Math.max(0, d.net))
        rawMax = Math.max(...vals, 1000)
      } else {
        rawMax = Math.max(...currentChartData.map((d) => Math.max(d.income, d.expense)), 1000)
      }
    }

    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(Math.abs(rawMax), Math.abs(rawMin), 1000))))
    const roundedMax = Math.ceil((rawMax * 1.15) / magnitude) * magnitude
    const roundedMin = rawMin < 0 ? Math.floor((rawMin * 1.15) / magnitude) * magnitude : 0

    return {
      minVal: roundedMin,
      maxVal: roundedMax,
      range: Math.max(roundedMax - roundedMin, 1)
    }
  }, [currentChartData, graphMode, metricFocus])

  const formatShortMoney = (val) => {
    if (val === 0) return '0'
    const absVal = Math.abs(val)
    const sign = val < 0 ? '-' : ''
    if (absVal >= 1000000) {
      return `${sign}${(absVal / 1000000).toFixed(absVal % 1000000 === 0 ? 0 : 1)}M`
    }
    if (absVal >= 1000) {
      return `${sign}${Math.round(absVal / 1000)}k`
    }
    return `${sign}${Math.round(absVal)}`
  }

  // Y-axis gridline steps
  const yAxisSteps = useMemo(() => {
    return [
      { pct: 0, val: maxVal },
      { pct: 0.25, val: maxVal * 0.75 + minVal * 0.25 },
      { pct: 0.5, val: (maxVal + minVal) * 0.5 },
      { pct: 0.75, val: maxVal * 0.25 + minVal * 0.75 },
      { pct: 1, val: minVal }
    ]
  }, [maxVal, minVal])

  // Coordinate normalizer
  const getY = (val) => {
    const norm = (val - minVal) / range
    return svgHeight - paddingBottom - norm * (svgHeight - paddingTop - paddingBottom)
  }

  const zeroY = getY(0)

  // Spline Path Builder using Catmull-Rom smooth cubic bezier
  const buildSplinePath = (data, valueKey) => {
    if (!data || data.length === 0) return { linePath: '', areaPath: '', points: [] }
    const stepX = (svgWidth - paddingLeft - paddingRight) / (data.length - 1)
    const points = data.map((d, i) => {
      const x = paddingLeft + i * stepX
      const y = getY(d[valueKey] || 0)
      return { x, y, data: d }
    })

    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }

    const baselineY = Math.min(svgHeight - paddingBottom, zeroY)
    const areaPath = `${d} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
    return { linePath: d, areaPath, points }
  }

  const incomeCurve = buildSplinePath(currentChartData, 'income')
  const expenseCurve = buildSplinePath(currentChartData, 'expense')
  const cumulativeCurve = buildSplinePath(currentChartData, 'cumulative')
  const netCurve = buildSplinePath(currentChartData, 'net')

  const activePoint =
    graphMode === 'cumulative'
      ? cumulativeCurve.points[safeIndex]
      : graphMode === 'velocity'
      ? netCurve.points[safeIndex]
      : incomeCurve.points[safeIndex] || incomeCurve.points[0]

  const xRatio = activePoint ? activePoint.x / svgWidth : 0.5
  const tooltipTranslateX = xRatio > 0.75 ? '-92%' : xRatio < 0.22 ? '-8%' : '-50%'

  // Touch scrubbing on mobile devices
  const handleTouchScrub = (e) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    if (!touch) return
    const clientX = touch.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, clientX / rect.width))
    const stepCount = currentChartData.length
    const newIndex = Math.min(stepCount - 1, Math.max(0, Math.round(ratio * (stepCount - 1))))
    setActiveCurveIndex(newIndex)
  }

  // Pre-calculate step width for bar charts
  const stepX = (svgWidth - paddingLeft - paddingRight) / Math.max(currentChartData.length - 1, 1)
  const barSlotWidth = Math.min(stepX * 0.75, 48)
  const singleBarWidth = Math.max(6, (barSlotWidth - 6) / 2)

  return (
    <div className="exbos-glass-card p-4 sm:p-7 space-y-5 sm:space-y-6 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#218DFF]/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER & CONTROLS TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 border border-[#218DFF]/40 text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[#218DFF]" />
              <span>{archMeta.number} · {archMeta.badge}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 font-medium">
              {currentArch?.name || 'Architecture'}
            </span>
            {!hasLiveTransactions && !useBenchmarkForecast && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                <span>Live Ready (0 Entries)</span>
              </span>
            )}
            {useBenchmarkForecast && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
                <span>Benchmark Forecast</span>
              </span>
            )}
          </div>

          <h3 className="font-orbitron text-lg sm:text-2xl font-extrabold text-white mt-1 tracking-tight">
            Cash Performance Curve
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
            {archMeta.subtitle}
          </p>
        </div>

        {/* CONTROLS: GRAPH TYPE + TIMEFRAME + METRIC FOCUS */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* 1. Graph Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#040C26]/90 border border-white/15 shadow-inner">
            <button
              type="button"
              onClick={() => handleSelectMode('spline')}
              title="Smooth Area Spline Curve"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                graphMode === 'spline'
                  ? 'exbos-glass-pill-active border-white/30 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#218DFF]" />
              <span className="hidden sm:inline">Spline</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('bars')}
              title="Comparative Dual Bar Columns"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                graphMode === 'bars'
                  ? 'exbos-glass-pill-active border-white/30 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Bars</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('cumulative')}
              title="Cumulative Net Cash Reserve Runway"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                graphMode === 'cumulative'
                  ? 'exbos-glass-pill-active border-white/30 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Runway</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('velocity')}
              title="Period Net Cash Velocity Waterfall"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                graphMode === 'velocity'
                  ? 'exbos-glass-pill-active border-white/30 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Velocity</span>
            </button>
          </div>

          {/* 2. Days / Weeks / Months Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#040C26]/90 border border-white/15">
            {['Days', 'Weeks', 'Months'].map((tab) => {
              const isActive = graphTimeframe === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleSelectTimeframe(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'exbos-glass-pill-active border-white/30 text-white shadow-sm'
                      : 'bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* 3. Live vs Benchmark Projection Toggle */}
          <button
            type="button"
            onClick={() => setUseBenchmarkForecast((prev) => !prev)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              useBenchmarkForecast
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{useBenchmarkForecast ? 'Viewing Forecast' : 'Forecast'}</span>
          </button>
        </div>
      </div>

      {/* TOP INTELLIGENCE METRIC CARDS (4-Column Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* 1. Total Inflow */}
        <div
          onClick={() => handleSelectFocus(metricFocus === 'income' ? 'all' : 'income')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            metricFocus === 'income'
              ? 'bg-[#218DFF]/20 border-[#218DFF] shadow-[0_0_20px_rgba(33,141,255,0.25)]'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#218DFF]" />
              <span>{archMeta.inflowName}</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#218DFF]" />
          </div>
          <div className="font-orbitron text-base sm:text-xl font-extrabold text-white">
            {formatRWF(periodKpi.totalInc, hideFinancials)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Total {graphTimeframe.toLowerCase()} inflows
          </div>
        </div>

        {/* 2. Total Outflow */}
        <div
          onClick={() => handleSelectFocus(metricFocus === 'expense' ? 'all' : 'expense')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            metricFocus === 'expense'
              ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>{archMeta.outflowName}</span>
            </span>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="font-orbitron text-base sm:text-xl font-extrabold text-rose-300">
            {formatRWF(periodKpi.totalExp, hideFinancials)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Total operating burn
          </div>
        </div>

        {/* 3. Net Cash Flow Velocity */}
        <div
          onClick={() => handleSelectFocus(metricFocus === 'net' ? 'all' : 'net')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            metricFocus === 'net'
              ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Net Profit Velocity</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              {periodKpi.margin}%
            </span>
          </div>
          <div className={`font-orbitron text-base sm:text-xl font-extrabold ${periodKpi.netTakeHome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {periodKpi.netTakeHome >= 0 ? '+' : ''}{formatRWF(periodKpi.netTakeHome, hideFinancials)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Net take-home margin
          </div>
        </div>

        {/* 4. Peak Trajectory Milestone */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Peak Inflow Point</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold font-orbitron">
              {periodKpi.peakLabel}
            </span>
          </div>
          <div className="font-orbitron text-base sm:text-xl font-extrabold text-amber-300">
            {formatRWF(periodKpi.peakIncome, hideFinancials)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Highest period turnover
          </div>
        </div>
      </div>

      {/* METRIC FILTER PILLS (When in Spline or Bars mode) */}
      {(graphMode === 'spline' || graphMode === 'bars') && (
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar pb-1">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Display:</span>
          {[
            { id: 'all', label: 'All Flows (In vs Out)' },
            { id: 'income', label: 'Inflow Only' },
            { id: 'expense', label: 'Outflow Only' },
            { id: 'net', label: 'Net Profit Trend' }
          ].map((f) => {
            const isSel = metricFocus === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelectFocus(f.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  isSel
                    ? 'bg-white/20 border-white/40 text-white font-bold'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      )}

      {/* MOBILE-ONLY SUMMARY INSPECTION CARD (Placed above chart so touches never obstruct SVG) */}
      <div className="sm:hidden rounded-2xl bg-[#06143b]/95 border border-[#218DFF]/40 p-3.5 backdrop-blur-md shadow-lg space-y-2.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#218DFF] shadow-[0_0_8px_#218DFF]" />
            <span className="text-xs font-orbitron font-bold text-white tracking-wide">
              {activeData.label} Trajectory
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[11px]">
            {activeData.change || '+0%'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/5 rounded-xl p-2 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#218DFF]" />
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                Inflow
              </span>
            </div>
            <div className="font-orbitron text-xs font-extrabold text-[#9EDCFF] break-words">
              {formatRWF(activeData.income, hideFinancials)}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                Outflow
              </span>
            </div>
            <div className="font-orbitron text-xs font-bold text-rose-300 break-words">
              {formatRWF(activeData.expense, hideFinancials)}
            </div>
          </div>
        </div>

        <div className="bg-[#1045CA]/20 border border-[#218DFF]/30 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-300 font-medium">
            {graphMode === 'cumulative' ? 'Cumulative Reserve:' : 'Net Profit:'}
          </span>
          <span className="font-orbitron text-xs font-extrabold text-emerald-400">
            {graphMode === 'cumulative'
              ? formatRWF(activeData.cumulative, hideFinancials)
              : `+${formatRWF(activeData.income - activeData.expense, hideFinancials)}`}
          </span>
        </div>
      </div>

      {/* SVG GRAPH CANVAS WITH RESPONSIVE Y-AXIS AND INTERACTIVE MODES */}
      <div className="relative pt-2 sm:pt-4 pb-2 select-none w-full">
        {/* GRAPH ROW: DEDICATED HTML Y-AXIS SCALE + SVG DRAWING CANVAS */}
        <div className="flex items-stretch gap-1.5 sm:gap-2.5 w-full">
          {/* DEDICATED HTML Y-AXIS SCALE (Crisp true font sizes on mobile & desktop, immune to SVG viewBox scaling) */}
          <div className="w-11 sm:w-16 flex-shrink-0 relative select-none h-52 sm:h-80 pointer-events-none">
            {/* Currency Indicator at top */}
            <div
              className="absolute right-1 sm:right-2 transform -translate-y-full pb-1 text-right"
              style={{ top: `${(paddingTop / svgHeight) * 100}%` }}
            >
              <span className="font-orbitron text-[11px] sm:text-xs font-black text-[#9EDCFF] tracking-wider uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                RWF
              </span>
            </div>

            {/* Step Values */}
            {yAxisSteps.map((step, i) => {
              const topPct = ((paddingTop + step.pct * (svgHeight - paddingTop - paddingBottom)) / svgHeight) * 100
              const isBaseline = i === yAxisSteps.length - 1
              return (
                <div
                  key={i}
                  className="absolute right-1 sm:right-2 transform -translate-y-1/2 flex items-center justify-end text-right"
                  style={{ top: `${topPct}%` }}
                >
                  <span
                    className={`font-orbitron text-xs sm:text-sm font-black tracking-tight ${
                      isBaseline ? 'text-slate-300' : 'text-white'
                    } drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]`}
                  >
                    {formatShortMoney(step.val)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* SVG DRAWING CANVAS CONTAINER */}
          <div
            ref={svgRef}
            onTouchStart={handleTouchScrub}
            onTouchMove={handleTouchScrub}
            className="flex-1 min-w-0 touch-pan-y relative"
          >
            {/* DESKTOP-ONLY FLOATING TOOLTIP */}
            {activePoint && (
              <div
                className="hidden sm:flex absolute z-30 flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#06143b]/95 border-2 border-[#218DFF]/70 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_28px_rgba(33,141,255,0.45)] transition-all duration-150 pointer-events-none backdrop-blur-xl"
                style={{
                  left: `${(activePoint.x / svgWidth) * 100}%`,
                  top: `${Math.max(4, activePoint.y - 82)}px`,
                  transform: `translateX(${tooltipTranslateX})`
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#218DFF]" />
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    {activeData.label} Inflow:
                  </span>
                  <strong className="font-orbitron text-xs sm:text-sm font-extrabold text-white">
                    {formatRWF(activeData.income, hideFinancials)}
                  </strong>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                    {activeData.change || '+0%'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-white/10 w-full justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-slate-300">Outflow:</span>
                    <strong className="text-rose-300 font-bold">
                      {formatRWF(activeData.expense, hideFinancials)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">{graphMode === 'cumulative' ? 'Reserve:' : 'Net:'}</span>
                    <strong className="text-emerald-400 font-bold font-orbitron">
                      {graphMode === 'cumulative'
                        ? formatRWF(activeData.cumulative, hideFinancials)
                        : `+${formatRWF(activeData.income - activeData.expense, hideFinancials)}`}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-52 sm:h-80 overflow-visible"
            >
              <defs>
                {/* Spline Area Gradients */}
                <linearGradient id="sapphireWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#218DFF" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#1045CA" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#040C26" stopOpacity="0.01" />
                </linearGradient>

                <linearGradient id="expenseWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.01" />
                </linearGradient>

                <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.50" />
                  <stop offset="50%" stopColor="#218DFF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#040C26" stopOpacity="0.01" />
                </linearGradient>

                {/* Bar Gradients */}
                <linearGradient id="barIncGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#218DFF" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#1045CA" stopOpacity="0.75" />
                </linearGradient>

                <linearGradient id="barExpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.75" />
                </linearGradient>

                <linearGradient id="velPosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.75" />
                </linearGradient>

                <linearGradient id="velNegGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#be123c" stopOpacity="0.95" />
                </linearGradient>

                <filter id="glowSapphire" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Left Axis Spine */}
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={svgHeight - paddingBottom}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
              />

              {/* Horizontal Y-Axis Gridlines & Range Markers */}
              {yAxisSteps.map((step, i) => {
                const yPos = paddingTop + step.pct * (svgHeight - paddingTop - paddingBottom)
                const isBaseline = i === yAxisSteps.length - 1
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={svgWidth - paddingRight}
                      y2={yPos}
                      stroke={isBaseline ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}
                      strokeDasharray={isBaseline ? 'none' : '4 4'}
                      strokeWidth={isBaseline ? '1.5' : '1'}
                    />
                    {/* Subtle axis tick pointing to HTML label */}
                    <line
                      x1={paddingLeft - 5}
                      y1={yPos}
                      x2={paddingLeft}
                      y2={yPos}
                      stroke={isBaseline ? '#9EDCFF' : 'rgba(255,255,255,0.45)'}
                      strokeWidth="1.5"
                    />
                  </g>
                )
              })}

            {/* Break-Even Horizontal Guideline (in Cumulative & Velocity modes if minVal < 0) */}
            {(graphMode === 'cumulative' || graphMode === 'velocity') && minVal < 0 && zeroY < svgHeight - paddingBottom && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={zeroY}
                  x2={svgWidth - paddingRight}
                  y2={zeroY}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                  strokeOpacity="0.75"
                />
                <text
                  x={svgWidth - paddingRight}
                  y={zeroY - 6}
                  textAnchor="end"
                  className="font-orbitron text-[9px] font-extrabold fill-emerald-400"
                >
                  Break-Even Baseline (0 RWF)
                </text>
              </g>
            )}

            {/* GRAPH MODE 1: SMOOTH CATMULL-ROM AREA SPLINE */}
            {graphMode === 'spline' && (
              <>
                {/* Area Fills */}
                {(metricFocus === 'all' || metricFocus === 'expense') && (
                  <path d={expenseCurve.areaPath} fill="url(#expenseWaveGrad)" />
                )}
                {(metricFocus === 'all' || metricFocus === 'income') && (
                  <path d={incomeCurve.areaPath} fill="url(#sapphireWaveGrad)" />
                )}

                {/* Expense Stroke */}
                {(metricFocus === 'all' || metricFocus === 'expense') && (
                  <path
                    d={expenseCurve.linePath}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeOpacity="0.8"
                    strokeDasharray="5 3"
                  />
                )}

                {/* Primary Income Stroke */}
                {(metricFocus === 'all' || metricFocus === 'income') && (
                  <path
                    d={incomeCurve.linePath}
                    fill="none"
                    stroke="#218DFF"
                    strokeWidth="3.5"
                    filter="url(#glowSapphire)"
                  />
                )}

                {/* Net Profit Flow Curve (when Focus === 'net') */}
                {metricFocus === 'net' && (
                  <path
                    d={netCurve.linePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    filter="url(#glowSapphire)"
                  />
                )}

                {/* Active Indicator & Guideline */}
                {activePoint && (
                  <>
                    <line
                      x1={activePoint.x}
                      y1={activePoint.y}
                      x2={activePoint.x}
                      y2={svgHeight - paddingBottom}
                      stroke="#9EDCFF"
                      strokeDasharray="4 4"
                      strokeWidth="2"
                      strokeOpacity="0.95"
                    />
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.y}
                      r="7"
                      fill="#ffffff"
                      stroke="#218DFF"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.y}
                      r="14"
                      fill="#218DFF"
                      fillOpacity="0.25"
                      className="animate-ping"
                    />
                    {expenseCurve.points[safeIndex] && (metricFocus === 'all' || metricFocus === 'expense') && (
                      <circle
                        cx={expenseCurve.points[safeIndex].x}
                        cy={expenseCurve.points[safeIndex].y}
                        r="5"
                        fill="#ffffff"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                      />
                    )}
                  </>
                )}
              </>
            )}

            {/* GRAPH MODE 2: COMPARATIVE DUAL BARS */}
            {graphMode === 'bars' && (
              <g>
                {currentChartData.map((d, i) => {
                  const cx = paddingLeft + i * stepX
                  const isCur = i === safeIndex
                  const incY = getY(d.income)
                  const incH = Math.max(0, svgHeight - paddingBottom - incY)
                  const expY = getY(d.expense)
                  const expH = Math.max(0, svgHeight - paddingBottom - expY)

                  return (
                    <g key={i}>
                      {/* Active Column Backdrop Pill */}
                      {isCur && (
                        <rect
                          x={cx - barSlotWidth / 2 - 4}
                          y={paddingTop}
                          width={barSlotWidth + 8}
                          height={svgHeight - paddingTop - paddingBottom}
                          rx="10"
                          fill="rgba(33, 141, 255, 0.08)"
                          stroke="rgba(33, 141, 255, 0.35)"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Inflow Bar */}
                      {(metricFocus === 'all' || metricFocus === 'income') && (
                        <rect
                          x={cx - singleBarWidth - 2}
                          y={incY}
                          width={singleBarWidth}
                          height={incH}
                          rx="4"
                          fill="url(#barIncGrad)"
                          opacity={isCur ? 1 : 0.8}
                          stroke={isCur ? '#ffffff' : 'none'}
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Outflow Bar */}
                      {(metricFocus === 'all' || metricFocus === 'expense') && (
                        <rect
                          x={cx + 2}
                          y={expY}
                          width={singleBarWidth}
                          height={expH}
                          rx="4"
                          fill="url(#barExpGrad)"
                          opacity={isCur ? 1 : 0.8}
                          stroke={isCur ? '#ffffff' : 'none'}
                          strokeWidth="1.5"
                        />
                      )}
                    </g>
                  )
                })}
              </g>
            )}

            {/* GRAPH MODE 3: CUMULATIVE NET CASH RUNWAY */}
            {graphMode === 'cumulative' && (
              <>
                <path d={cumulativeCurve.areaPath} fill="url(#cumulativeGrad)" />
                <path
                  d={cumulativeCurve.linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  filter="url(#glowSapphire)"
                />
                {activePoint && (
                  <>
                    <line
                      x1={activePoint.x}
                      y1={activePoint.y}
                      x2={activePoint.x}
                      y2={svgHeight - paddingBottom}
                      stroke="#34d399"
                      strokeDasharray="4 4"
                      strokeWidth="2"
                    />
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.y}
                      r="7"
                      fill="#ffffff"
                      stroke="#10b981"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.y}
                      r="14"
                      fill="#10b981"
                      fillOpacity="0.25"
                      className="animate-ping"
                    />
                  </>
                )}
              </>
            )}

            {/* GRAPH MODE 4: PERIOD NET VELOCITY WATERFALL */}
            {graphMode === 'velocity' && (
              <g>
                {currentChartData.map((d, i) => {
                  const cx = paddingLeft + i * stepX
                  const isCur = i === safeIndex
                  const isPositive = (d.net || 0) >= 0
                  const barY = isPositive ? getY(d.net) : zeroY
                  const barH = isPositive ? zeroY - barY : getY(d.net) - zeroY
                  const barW = Math.min(stepX * 0.5, 32)

                  return (
                    <g key={i}>
                      {isCur && (
                        <rect
                          x={cx - barW / 2 - 4}
                          y={paddingTop}
                          width={barW + 8}
                          height={svgHeight - paddingTop - paddingBottom}
                          rx="8"
                          fill="rgba(255,255,255,0.06)"
                        />
                      )}
                      <rect
                        x={cx - barW / 2}
                        y={barY}
                        width={barW}
                        height={Math.max(barH, 3)}
                        rx="4"
                        fill={isPositive ? 'url(#velPosGrad)' : 'url(#velNegGrad)'}
                        opacity={isCur ? 1 : 0.85}
                        stroke={isCur ? '#ffffff' : 'none'}
                        strokeWidth="1.5"
                      />
                    </g>
                  )
                })}
              </g>
            )}

            {/* Interactive Tap / Hover Zones Across Entire Chart */}
            {currentChartData.map((d, i) => {
              const cx = paddingLeft + i * stepX
              return (
                <rect
                  key={i}
                  x={cx - stepX / 2}
                  y="0"
                  width={stepX}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveCurveIndex(i)}
                  onClick={() => setActiveCurveIndex(i)}
                />
              )
            })}
          </svg>
        </div>
      </div>

      {/* X-AXIS TIMELINE LABELS WITH PROMINENT NUMBER RANGE BADGES */}
      <div className="flex items-start gap-1.5 sm:gap-2.5 w-full pt-3">
        {/* Spacer to align precisely with left HTML Y-axis scale */}
        <div className="w-11 sm:w-16 flex-shrink-0" />

        {/* Timeline labels spanning the SVG canvas */}
        <div
          className="flex-1 min-w-0 flex items-start justify-between"
          style={{
            paddingLeft: `${(paddingLeft / svgWidth) * 100}%`,
            paddingRight: `${(paddingRight / svgWidth) * 100}%`
          }}
        >
          {currentChartData.map((d, i) => {
            const isCur = i === safeIndex
            const moneyVal =
              graphMode === 'cumulative'
                ? formatShortMoney(d.cumulative)
                : graphMode === 'velocity'
                ? formatShortMoney(d.net)
                : formatShortMoney(d.income)

            return (
              <button
                key={d.label}
                type="button"
                onMouseEnter={() => setActiveCurveIndex(i)}
                onClick={() => setActiveCurveIndex(i)}
                className="group flex flex-col items-center gap-1.5 cursor-pointer border-0 bg-transparent transition-all p-0 flex-1 min-w-0"
              >
                <span
                  className={`font-orbitron text-xs sm:text-sm font-bold tracking-wider transition-colors ${
                    isCur
                      ? 'text-white font-black scale-105 drop-shadow-[0_0_8px_rgba(33,141,255,0.7)]'
                      : 'text-slate-300 group-hover:text-white'
                  }`}
                >
                  {d.label}
                </span>

                {/* Prominent, readable value badge (e.g. 500k, 1M, 15.2M) */}
                <span
                  className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-orbitron text-[11px] sm:text-xs font-black tracking-tight transition-all border whitespace-nowrap shadow-sm ${
                    isCur
                      ? 'bg-[#218DFF] text-white border-white/60 shadow-[0_0_14px_rgba(33,141,255,0.8)] scale-105'
                      : 'bg-[#06143b] text-white border-white/25 group-hover:bg-[#0c2364] group-hover:border-white/40'
                  }`}
                >
                  {moneyVal}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      </div>

      {/* FOOTER ACTIONS & RECORD BUTTON */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-[#218DFF] shadow-sm inline-block" />
            <span className="text-white font-semibold text-[11px] sm:text-xs">
              {archMeta.inflowName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-rose-400 shadow-sm inline-block" />
            <span className="text-white font-semibold text-[11px] sm:text-xs">
              {archMeta.outflowName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-emerald-400 shadow-sm inline-block" />
            <span className="text-white font-semibold text-[11px] sm:text-xs">
              Net Surplus
            </span>
          </div>
        </div>

        {/* Right side prompt */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px]">
            {hasLiveTransactions
              ? `${archTransactions.length} live records in database`
              : useBenchmarkForecast
              ? 'Viewing benchmark projection'
              : 'Live baseline (0 entries)'}
          </span>

          {onOpenWorkflowModal && (
            <button
              type="button"
              onClick={onOpenWorkflowModal}
              className="px-3 py-1.5 rounded-xl bg-[#218DFF]/20 hover:bg-[#218DFF]/30 border border-[#218DFF]/40 text-[#9EDCFF] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Record Transaction</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
