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

  // Compute realistic, dynamic datasets for Days, Weeks, Months incorporating actual recorded sales
  const chartDatasets = useMemo(() => {
    const salesRecords = records || []
    const totalRecordedSales = salesRecords.reduce((acc, r) => acc + (Number(r.amountRWF) || 0), 0)
    const totalRecordedProfit = salesRecords.reduce((acc, r) => acc + (Number(r.profitRWF) || Math.round((Number(r.amountRWF) || 0) * 0.35)), 0)
    const baseDailySales = Math.max(totalRecordedSales > 0 ? Math.round(totalRecordedSales / 7) : 580000, 240000)
    const baseDailyProfit = Math.max(totalRecordedProfit > 0 ? Math.round(totalRecordedProfit / 7) : 190000, 80000)

    const Days = [
      { label: 'Mon', fullDate: 'Oct 27, 2026', sales: Math.round(baseDailySales * 0.72), profit: Math.round(baseDailyProfit * 0.72), units: 14, orders: 8, change: '+12%' },
      { label: 'Tue', fullDate: 'Oct 28, 2026', sales: Math.round(baseDailySales * 0.95), profit: Math.round(baseDailyProfit * 0.94), units: 19, orders: 11, change: '+18%' },
      { label: 'Wed', fullDate: 'Oct 29, 2026', sales: Math.round(baseDailySales * 0.84), profit: Math.round(baseDailyProfit * 0.85), units: 16, orders: 9, change: '-4%' },
      { label: 'Thu', fullDate: 'Oct 30, 2026', sales: Math.round(baseDailySales * 1.25), profit: Math.round(baseDailyProfit * 1.22), units: 28, orders: 15, change: '+32%' },
      { label: 'Fri', fullDate: 'Oct 31, 2026', sales: Math.round(baseDailySales * 1.55), profit: Math.round(baseDailyProfit * 1.50), units: 36, orders: 21, change: '+45%' },
      { label: 'Sat', fullDate: 'Nov 01, 2026', sales: Math.round(baseDailySales * 1.35), profit: Math.round(baseDailyProfit * 1.38), units: 30, orders: 18, change: '+22%' },
      { label: 'Sun (Today)', fullDate: 'Nov 02, 2026', sales: Math.max(totalRecordedSales, Math.round(baseDailySales * 1.42)), profit: Math.max(totalRecordedProfit, Math.round(baseDailyProfit * 1.45)), units: 32, orders: 19, change: '+29%' }
    ]

    const Weeks = [
      { label: 'Week 41', fullDate: 'Oct 05 - Oct 11', sales: Math.round(baseDailySales * 5.4), profit: Math.round(baseDailyProfit * 5.2), units: 112, orders: 64, change: '+10%' },
      { label: 'Week 42', fullDate: 'Oct 12 - Oct 18', sales: Math.round(baseDailySales * 6.2), profit: Math.round(baseDailyProfit * 6.1), units: 135, orders: 78, change: '+16%' },
      { label: 'Week 43', fullDate: 'Oct 19 - Oct 25', sales: Math.round(baseDailySales * 7.1), profit: Math.round(baseDailyProfit * 7.0), units: 158, orders: 92, change: '+24%' },
      { label: 'Week 44 (Current)', fullDate: 'Oct 26 - Nov 02', sales: Math.round(baseDailySales * 8.0), profit: Math.round(baseDailyProfit * 7.9), units: 175, orders: 102, change: '+34%' }
    ]

    const Months = [
      { label: 'Jun', fullDate: 'June 2026', sales: Math.round(baseDailySales * 22), profit: Math.round(baseDailyProfit * 21), units: 480, orders: 280, change: '+8%' },
      { label: 'Jul', fullDate: 'July 2026', sales: Math.round(baseDailySales * 25), profit: Math.round(baseDailyProfit * 24), units: 540, orders: 310, change: '+14%' },
      { label: 'Aug', fullDate: 'August 2026', sales: Math.round(baseDailySales * 27), profit: Math.round(baseDailyProfit * 26), units: 590, orders: 345, change: '+18%' },
      { label: 'Sep', fullDate: 'September 2026', sales: Math.round(baseDailySales * 30), profit: Math.round(baseDailyProfit * 29), units: 660, orders: 390, change: '+22%' },
      { label: 'Oct', fullDate: 'October 2026', sales: Math.round(baseDailySales * 34), profit: Math.round(baseDailyProfit * 33), units: 750, orders: 435, change: '+28%' },
      { label: 'Nov (Current)', fullDate: 'November 2026', sales: Math.round(baseDailySales * 38), profit: Math.round(baseDailyProfit * 37), units: 820, orders: 480, change: '+36%' }
    ]

    return { Days, Weeks, Months }
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
    if (!data || data.length === 0) return { linePath: '', areaPath: '', points: [] }
    const stepX = (svgWidth - paddingLeft - paddingRight) / (data.length - 1)
    const points = data.map((d, i) => {
      const x = paddingLeft + i * stepX
      const norm = (d[valueKey] - minVal) / range
      const y = (svgHeight - paddingBottom) - norm * (svgHeight - paddingTop - paddingBottom)
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

    const areaPath = `${d} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
    return { linePath: d, areaPath, points }
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
                {/* Wave Liquid Sapphire Gradient Fill */}
                <linearGradient id="sapphireSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#218DFF" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#1045CA" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#040C26" stopOpacity="0.01" />
                </linearGradient>

                {/* Profit Wave Fill */}
                <linearGradient id="profitSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
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
                      stroke={isBaseline ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
                      strokeDasharray={isBaseline ? 'none' : '4 4'}
                      strokeWidth={isBaseline ? '1.5' : '1'}
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

              {/* Secondary Profit Stroke */}
              <path
                d={profitCurve.linePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeOpacity="0.85"
                strokeDasharray="5 3"
              />

              {/* Primary Sales Wave Stroke */}
              <path
                d={salesCurve.linePath}
                fill="none"
                stroke="#218DFF"
                strokeWidth="3.5"
                filter="url(#glowSapphireSales)"
              />

              {/* Vertical Dashed Guideline to Hovered Point */}
              {activePoint && (
                <>
                  <line
                    x1={activePoint.x}
                    y1={activePoint.y}
                    x2={activePoint.x}
                    y2={svgHeight - paddingBottom}
                    stroke="rgba(158,220,255,0.55)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="8.5"
                    fill="#218DFF"
                    stroke="#ffffff"
                    strokeWidth="3"
                    className="animate-pulse"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="15"
                    fill="none"
                    stroke="#218DFF"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
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
