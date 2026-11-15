import React, { useState, useMemo } from "react";
import { TrendingUp, ArrowUpRight, Package, ShoppingBag, Plus } from "lucide-react";
import { formatRWF } from "../../../utils/currencyWords";

export default function SalesTrendsView({
  currentArch,
  records,
  hideFinancials,
  formatRWF,
  onRecordSale,
  onViewSale
}) {
  const [graphTimeframe, setGraphTimeframe] = useState('Days')
  const [activeCurveIndex, setActiveCurveIndex] = useState(6)

  // Compute dynamic datasets for Days, Weeks, Months from actual recorded sales
  const chartDatasets = useMemo(() => {
    const salesRecords = records || []
    const now = new Date()

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun (Today)']
    const daysBuckets = dayLabels.map((lbl, idx) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (6 - idx))
      return {
        label: lbl,
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        sales: 0,
        profit: 0,
        units: 0,
        orders: 0,
        change: '+0%'
      }
    })

    const weeksBuckets = [
      { label: 'Week 1', fullDate: '3 Weeks Ago', sales: 0, profit: 0, units: 0, orders: 0, change: '+0%' },
      { label: 'Week 2', fullDate: '2 Weeks Ago', sales: 0, profit: 0, units: 0, orders: 0, change: '+0%' },
      { label: 'Week 3', fullDate: 'Last Week', sales: 0, profit: 0, units: 0, orders: 0, change: '+0%' },
      { label: 'Current Week', fullDate: 'This Week', sales: 0, profit: 0, units: 0, orders: 0, change: '+0%' }
    ]

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthsBuckets = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
      const mName = monthNames[d.getMonth()]
      return {
        label: idx === 5 ? `${mName} (Current)` : mName,
        fullDate: `${mName} ${d.getFullYear()}`,
        sales: 0,
        profit: 0,
        units: 0,
        orders: 0,
        change: '+0%'
      }
    })

    salesRecords.forEach((r) => {
      const amt = Number(r.amountRWF ?? r.totalAmountRWF ?? 0) || 0
      if (amt <= 0) return
      const prof = Number(r.profitRWF) || Math.round(amt * 0.35)
      const qty = Number(r.quantity) || 1
      const rawDate = r.date || r.createdAt
      const parsed = rawDate ? new Date(rawDate) : now
      const validDate = isNaN(parsed.getTime()) ? now : parsed
      const diffDays = Math.max(0, Math.floor((now.getTime() - validDate.getTime()) / (1000 * 60 * 60 * 24)))

      const dayIdx = Math.max(0, 6 - Math.min(6, diffDays))
      daysBuckets[dayIdx].sales += amt
      daysBuckets[dayIdx].profit += prof
      daysBuckets[dayIdx].units += qty
      daysBuckets[dayIdx].orders += 1

      const weekIdx = Math.max(0, 3 - Math.min(3, Math.floor(diffDays / 7)))
      weeksBuckets[weekIdx].sales += amt
      weeksBuckets[weekIdx].profit += prof
      weeksBuckets[weekIdx].units += qty
      weeksBuckets[weekIdx].orders += 1

      const monthDiff = (now.getFullYear() - validDate.getFullYear()) * 12 + (now.getMonth() - validDate.getMonth())
      const monthIdx = Math.max(0, 5 - Math.min(5, Math.max(0, monthDiff)))
      monthsBuckets[monthIdx].sales += amt
      monthsBuckets[monthIdx].profit += prof
      monthsBuckets[monthIdx].units += qty
      monthsBuckets[monthIdx].orders += 1
    })

    return { Days: daysBuckets, Weeks: weeksBuckets, Months: monthsBuckets }
  }, [records])

  const currentData = chartDatasets[graphTimeframe] || chartDatasets.Days
  const safeIndex = Math.min(activeCurveIndex, currentData.length - 1)
  const activeData = currentData[safeIndex] || currentData[0]

  // Aggregated totals for the active timeframe
  const timeframeTotalSales = useMemo(() => {
    return currentData.reduce((acc, d) => acc + d.sales, 0)
  }, [currentData])

  const timeframeTotalProfit = useMemo(() => {
    return currentData.reduce((acc, d) => acc + d.profit, 0)
  }, [currentData])

  const timeframeTotalUnits = useMemo(() => {
    return currentData.reduce((acc, d) => acc + d.units, 0)
  }, [currentData])

  const timeframeTotalOrders = useMemo(() => {
    return currentData.reduce((acc, d) => acc + d.orders, 0)
  }, [currentData])

  const timeframeAOV = timeframeTotalOrders > 0 
    ? Math.round(timeframeTotalSales / timeframeTotalOrders) 
    : 0

  const marginPct = timeframeTotalSales > 0 
    ? Math.round((timeframeTotalProfit / timeframeTotalSales) * 100) 
    : 0

  // SVG Curve Math matching Cash Performance Curve
  const svgWidth = 880
  const svgHeight = 250
  const paddingLeft = 56
  const paddingRight = 28
  const paddingTop = 36
  const paddingBottom = 42

  const rawMax = Math.max(...currentData.map((d) => Math.max(d.sales, d.profit * 1.25)), 1000)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)))
  const maxVal = Math.ceil((rawMax * 1.15) / magnitude) * magnitude
  const minVal = 0
  const range = maxVal - minVal

  const formatShortMoney = (val) => {
    if (val === 0) return '0'
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)}k`
    }
    return `${Math.round(val)}`
  }

  const yAxisSteps = [
    { pct: 0, val: maxVal },
    { pct: 0.25, val: maxVal * 0.75 },
    { pct: 0.5, val: maxVal * 0.5 },
    { pct: 0.75, val: maxVal * 0.25 },
    { pct: 1, val: 0 }
  ]

  const buildCustomPath = (data, valueKey) => {
    if (!data || data.length === 0) return { linePath: '', leadInPath: '', areaPath: '', points: [] }
    const usableW = svgWidth - paddingLeft - paddingRight
    const stepX = usableW / Math.max(data.length - 1, 1)
    const baselineY = svgHeight - paddingBottom
    const getY = (val) => {
      const norm = (val - minVal) / range
      return baselineY - norm * (svgHeight - paddingTop - paddingBottom)
    }

    const points = data.map((d, i) => {
      const x = paddingLeft + i * stepX
      const y = getY(d[valueKey] || 0)
      return { x, y, data: d }
    })

    const pulseVertices = []
    const maxSeriesVal = Math.max(...data.map((d) => Math.abs(Number(d[valueKey]) || 0)), 0)

    for (let i = 0; i < data.length; i++) {
      const val = Number(data[i]?.[valueKey]) || 0
      const cx = points[i].x
      const cy = points[i].y

      if (i === 0) {
        pulseVertices.push({ x: cx, y: val > 0 ? getY(val * 0.15) : baselineY })
      }

      if (val > 0) {
        const leftBaseX = i === 0 ? cx : cx - stepX * 0.42
        const preSpikeX = i === 0 ? cx + stepX * 0.08 : cx - stepX * 0.24
        const preValleyX = i === 0 ? cx + stepX * 0.14 : cx - stepX * 0.14
        const shoulderX = cx + stepX * 0.08
        const rightValleyX = i === data.length - 1 ? cx : cx + stepX * 0.18
        const echoPeakX = i === data.length - 1 ? cx : cx + stepX * 0.28
        const rightBaseX = i === data.length - 1 ? cx : cx + stepX * 0.40

        if (i > 0) {
          pulseVertices.push({ x: leftBaseX, y: baselineY })
          pulseVertices.push({ x: preSpikeX, y: getY(val * 0.34) })
          pulseVertices.push({ x: preValleyX, y: getY(val * 0.06) })
        }
        pulseVertices.push({ x: cx, y: cy })
        if (i < data.length - 1) {
          if (val >= maxSeriesVal * 0.6) {
            pulseVertices.push({ x: shoulderX, y: getY(val * 0.46) })
            pulseVertices.push({ x: shoulderX + stepX * 0.05, y: getY(val * 0.46) })
          }
          pulseVertices.push({ x: rightValleyX, y: baselineY })
          pulseVertices.push({ x: echoPeakX, y: getY(val * 0.28) })
          pulseVertices.push({ x: rightBaseX, y: baselineY })
        }
      } else {
        pulseVertices.push({ x: cx, y: baselineY })
      }
    }

    pulseVertices.sort((a, b) => a.x - b.x)
    const clamped = pulseVertices.map((pt) => ({
      x: Math.max(paddingLeft, Math.min(svgWidth - paddingRight, pt.x)),
      y: Math.min(baselineY, Math.max(paddingTop, pt.y))
    }))

    let d = `M ${clamped[0].x} ${clamped[0].y}`
    for (let i = 1; i < clamped.length; i++) {
      d += ` L ${clamped[i].x} ${clamped[i].y}`
    }

    const leadInY = Math.max(paddingTop, baselineY - (maxSeriesVal > 0 ? 18 : 4))
    const leadInPath = `M ${Math.max(paddingLeft - 10, 4)} ${leadInY} L ${clamped[0].x} ${clamped[0].y}`
    const areaPath = `${d} L ${clamped[clamped.length - 1].x} ${baselineY} L ${clamped[0].x} ${baselineY} Z`
    return { linePath: d, leadInPath, areaPath, points }
  }

  const salesCurve = buildCustomPath(currentData, 'sales')
  const profitCurve = buildCustomPath(currentData, 'profit')
  const activePoint = salesCurve.points[safeIndex] || salesCurve.points[0]
  const xRatio = activePoint ? activePoint.x / svgWidth : 0.5
  // Edge-aware tooltip translation: shifts left on right-most points and right on left-most points so it never overflows the card
  const tooltipTranslateX = xRatio > 0.75 ? '-92%' : xRatio < 0.22 ? '-8%' : '-50%'

  return (
    <div className="space-y-6">
      {/* 4 Dynamic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Total Sales Revenue */}
        <div className="exbos-glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9EDCFF] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#218DFF]" />
                <span>Total Money Earned</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[10px] font-bold text-[#9EDCFF]">
                {graphTimeframe}
              </span>
            </div>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white pt-1">
              {formatRWF(timeframeTotalSales, hideFinancials)}
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>Sales Revenue</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +28.5%
            </span>
          </div>
        </div>

        {/* 2. Total Gross Profit */}
        <div className="exbos-glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gross Sales Profit</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                +{marginPct}% Margin
              </span>
            </div>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-emerald-400 pt-1">
              +{formatRWF(timeframeTotalProfit, hideFinancials)}
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>Net of Product Cost</span>
            <span className="text-emerald-300 font-semibold">Healthy Velocity</span>
          </div>
        </div>

        {/* 3. Volume Sold */}
        <div className="exbos-glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#218DFF]" />
                <span>Volume Sold</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-slate-300">
                Physical Stock
              </span>
            </div>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white pt-1">
              {timeframeTotalUnits} <span className="text-sm font-normal text-slate-400 font-sans">Units</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>Across all recorded products</span>
            <span className="text-[#9EDCFF] font-bold">{timeframeTotalOrders} orders</span>
          </div>
        </div>

        {/* 4. Average Ticket Size (AOV) */}
        <div className="exbos-glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9EDCFF] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#9EDCFF]" />
                <span>Average Ticket</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[10px] font-bold text-[#9EDCFF]">
                AOV
              </span>
            </div>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white pt-1">
              {formatRWF(timeframeAOV, hideFinancials)}
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>Per sale average</span>
            <button
              type="button"
              onClick={onRecordSale}
              className="text-[#9EDCFF] hover:text-white font-bold cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0"
            >
              <span>+ New Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Glass Card: Sales Performance & Revenue Curve */}
      <div className="exbos-glass-card p-6 sm:p-7 space-y-6">
        {/* Header & Days/Weeks/Months Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 border border-[#218DFF]/40 text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                Sales Trajectory
              </span>
              <span className="text-xs text-slate-300">
                {currentArch.number} · {currentArch.name} · Sales Trends
              </span>
            </div>
            <h3 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1 tracking-tight">
              Sales Trends &amp; Revenue Curve
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Visualizing money earned from sales, order velocity, and gross margins over Days, Weeks, and Months.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Days / Weeks / Months Switcher Pill */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 border border-white/15">
              {['Days', 'Weeks', 'Months'].map((tab) => {
                const isActive = graphTimeframe === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setGraphTimeframe(tab)
                      setActiveCurveIndex(
                        tab === 'Days' ? 6 : tab === 'Weeks' ? 3 : 5
                      )
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
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

            {/* Quick Record Sale Button */}
            <button
              type="button"
              onClick={onRecordSale}
              className="btn-sapphire-clean px-4 py-2 text-xs font-bold hidden sm:inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Sale</span>
            </button>
          </div>
        </div>

        {/* SVG Curve Canvas with Floating Tooltip & Spline */}
        <div className="relative pt-6 pb-2 select-none w-full">
          {/* Floating Glass Tooltip Tag above Active Point */}
          {activePoint && (
            <div
              className="absolute z-30 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#06143b]/95 border-2 border-[#218DFF]/70 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_28px_rgba(33,141,255,0.45)] transition-all duration-150 pointer-events-none backdrop-blur-xl"
              style={{
                left: `${(activePoint.x / svgWidth) * 100}%`,
                top: `${Math.max(4, activePoint.y - 74)}px`,
                transform: `translateX(${tooltipTranslateX})`
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#218DFF]" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Sales Earned:
                </span>
                <strong className="font-orbitron text-xs sm:text-sm font-extrabold text-white">
                  {formatRWF(activeData.sales, hideFinancials)}
                </strong>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                  {activeData.change || '+24%'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-white/10 w-full justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Profit:</span>
                  <strong className="text-emerald-400 font-bold font-orbitron">
                    +{formatRWF(activeData.profit, hideFinancials)}
                  </strong>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <span>{activeData.units} units</span>
                  <span>({activeData.orders} orders)</span>
                </div>
              </div>
            </div>
          )}

          {/* SVG Wave Graphic */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-64 sm:h-80 overflow-visible"
            >
              <defs>
                {/* Pulse Sapphire Area Fill */}
                <linearGradient id="sapphireSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#218DFF" stopOpacity="0.28" />
                  <stop offset="65%" stopColor="#1045CA" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#040C26" stopOpacity="0.03" />
                </linearGradient>

                {/* Profit Pulse Fill */}
                <linearGradient id="profitSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="glowSapphireSales" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Horizontal Y-Axis Grid Lines */}
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
                      stroke={isBaseline ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 12}
                      y={yPos + 4}
                      textAnchor="end"
                      className={`font-orbitron text-xs sm:text-sm font-black ${
                        isBaseline ? 'fill-slate-200' : 'fill-white'
                      }`}
                    >
                      {formatShortMoney(step.val)}
                    </text>
                  </g>
                )
              })}

              {/* Shaded Area Fills */}
              <path d={salesCurve.areaPath} fill="url(#sapphireSalesGrad)" />
              <path d={profitCurve.areaPath} fill="url(#profitSalesGrad)" />

              {/* Secondary Profit Pulse Stroke */}
              <path
                d={profitCurve.linePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeOpacity="0.8"
              />

              {/* Primary Sales Dotted Lead-In + Sharp Angular Pulse Stroke */}
              {salesCurve.leadInPath && (
                <path
                  d={salesCurve.leadInPath}
                  fill="none"
                  stroke="#218DFF"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
              )}
              <path
                d={salesCurve.linePath}
                fill="none"
                stroke="#218DFF"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Subtle Hover Guideline & Indicator */}
              {activePoint && (
                <>
                  <line
                    x1={activePoint.x}
                    y1={paddingTop}
                    x2={activePoint.x}
                    y2={svgHeight - paddingBottom}
                    stroke="rgba(158,220,255,0.22)"
                    strokeWidth="1"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="4.5"
                    fill="#218DFF"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </>
              )}

              {/* Interactive Target Areas */}
              {salesCurve.points.map((pt, i) => (
                <rect
                  key={i}
                  x={pt.x - 24}
                  y={paddingTop}
                  width="48"
                  height={svgHeight - paddingTop - paddingBottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveCurveIndex(i)}
                  onClick={() => setActiveCurveIndex(i)}
                />
              ))}
            </svg>
          </div>

          {/* X-Axis Timeline Labels with Money Amount on Each Point */}
          <div
            className="flex items-start justify-between pt-2 text-xs"
            style={{
              paddingLeft: `${(paddingLeft / svgWidth) * 100}%`,
              paddingRight: `${(paddingRight / svgWidth) * 100}%`
            }}
          >
            {currentData.map((d, i) => {
              const isCur = i === safeIndex
              return (
                <button
                  key={d.label}
                  type="button"
                  onMouseEnter={() => setActiveCurveIndex(i)}
                  onClick={() => setActiveCurveIndex(i)}
                  className={`flex flex-col items-center gap-0.5 cursor-pointer border-0 bg-transparent transition-all p-0 ${
                    isCur
                      ? 'text-white font-black scale-105'
                      : 'text-slate-400 hover:text-white font-medium opacity-80 hover:opacity-100'
                  }`}
                >
                  <span className={`font-orbitron text-xs sm:text-sm font-black ${isCur ? 'text-white' : 'text-slate-200'}`}>
                    {d.label}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-orbitron font-black px-2 py-0.5 rounded-lg border whitespace-nowrap ${
                      isCur
                        ? 'bg-[#218DFF] text-white border-white shadow-[0_0_12px_rgba(33,141,255,0.7)]'
                        : 'bg-[#081f54] text-white border-[#218DFF]/40'
                    }`}
                  >
                    {formatShortMoney(d.sales)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Breakdown: Recent Sales Contributing to this Trend */}
      <div className="exbos-glass-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h4 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#218DFF]" />
              <span>Sales Ledger Activity</span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Live sales contributing to the performance curve above.
            </p>
          </div>
          <button
            type="button"
            onClick={onRecordSale}
            className="btn-sapphire-clean px-4 py-2 text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Sale</span>
          </button>
        </div>

        {(!records || records.length === 0) ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-white/5 rounded-2xl border border-white/10">
            No sales recorded yet. Click "Record New Sale" to start building your sales curve.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Product / Items</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Amount Earned</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {records.slice(0, 10).map((sale, idx) => {
                  const amt = Number(sale.amountRWF) || 0
                  const prof = Number(sale.profitRWF) || Math.round(amt * 0.35)
                  const isUnpaid = sale.status && (sale.status.includes('Unpaid') || sale.status.includes('Part-paid') || sale.status.includes('Credit'))
                  return (
                    <tr
                      key={sale.id || idx}
                      onClick={() => onViewSale && onViewSale(sale)}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {sale.date || 'Today'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {sale.customerName || sale.customer || 'Walk-in Client'}
                        {sale.customerPhone && (
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            {sale.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-200">{sale.productTitle || sale.title}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-white">
                        {sale.quantity || 1} {sale.unit || ''}
                      </td>
                      <td className="py-3 px-3 text-right font-orbitron font-bold text-white">
                        {formatRWF(amt, hideFinancials)}
                      </td>
                      <td className="py-3 px-3 text-right font-orbitron font-bold text-emerald-400">
                        +{formatRWF(prof, hideFinancials)}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-300">
                        {sale.paymentMethod || sale.account || 'MTN MoMo'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isUnpaid
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {sale.status || 'Paid in Full'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Unpaid Purchases View (Accounts Payable & Remaining Supplier Debt)
// -----------------------------------------------------------------------------
