import React, { useState, useMemo } from 'react'
import { formatRWF } from '../../../utils/currencyWords'
import { FINANCIAL_DATASETS } from '../data/financialDatasets'

export default function CashFlowCurveChart({
  activeArchId = 'buy-and-sell',
  currentArch = {},
  archTransactions = [],
  hideFinancials = false
}) {
  const [graphTimeframe, setGraphTimeframe] = useState('Months') // 'Days' | 'Weeks' | 'Months'
  const [activeCurveIndex, setActiveCurveIndex] = useState(5)

  const activeArchDatasets =
    FINANCIAL_DATASETS[activeArchId] || FINANCIAL_DATASETS['buy-and-sell']

  // Compute chart series dynamically: When user inputs real transactions, reflect them in the timeline
  const computedChartData = useMemo(() => {
    const defaultData =
      activeArchDatasets[graphTimeframe] || activeArchDatasets.Months
    const hasTransactions = archTransactions && archTransactions.length > 0
    if (!hasTransactions) {
      // Clean zero baseline ready for live entries
      return defaultData.map((d) => ({
        ...d,
        income: 0,
        expense: 0,
        change: '+0%'
      }))
    }

    // Accumulate total user recorded money in and money out for this architecture
    const totalIn = archTransactions
      .filter((t) => t.type === 'in')
      .reduce((acc, t) => acc + (t.amountRWF || 0), 0)
    const totalOut = archTransactions
      .filter((t) => t.type === 'out')
      .reduce((acc, t) => acc + (t.amountRWF || 0), 0)

    // Distribute progressively across current timeframe points with latest having highest weight
    return defaultData.map((d, idx) => {
      const weight = (idx + 1) / defaultData.length
      const inc = Math.round(totalIn * weight)
      const exp = Math.round(totalOut * weight)
      return {
        ...d,
        income: inc,
        expense: exp,
        change:
          inc > exp
            ? `+${Math.round(((inc - exp) / (exp || 1)) * 100)}%`
            : '+0%'
      }
    })
  }, [activeArchDatasets, graphTimeframe, archTransactions])

  const currentChartData = computedChartData

  const svgWidth = 880
  const svgHeight = 250
  const paddingLeft = 56
  const paddingRight = 28
  const paddingTop = 36
  const paddingBottom = 42

  // Calculate true max from active data and create clean rounded ceiling
  const rawMax = Math.max(
    ...currentChartData.map((d) => Math.max(d.income, d.expense)),
    1000
  )
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

  // Catmull-Rom smooth spline calculation with dedicated padding for responsive axes
  const buildCustomPath = (data, valueKey) => {
    if (!data || data.length === 0) return { linePath: '', areaPath: '', points: [] }
    const stepX = (svgWidth - paddingLeft - paddingRight) / (data.length - 1)
    const points = data.map((d, i) => {
      const x = paddingLeft + i * stepX
      const norm = (d[valueKey] - minVal) / range
      const y =
        svgHeight - paddingBottom - norm * (svgHeight - paddingTop - paddingBottom)
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

    const areaPath = `${d} L ${points[points.length - 1].x} ${
      svgHeight - paddingBottom
    } L ${points[0].x} ${svgHeight - paddingBottom} Z`
    return { linePath: d, areaPath, points }
  }

  const incomeCurve = buildCustomPath(currentChartData, 'income')
  const expenseCurve = buildCustomPath(currentChartData, 'expense')
  const safeIndex = Math.min(activeCurveIndex, currentChartData.length - 1)
  const activePoint = incomeCurve.points[safeIndex] || incomeCurve.points[0]
  const activeData = currentChartData[safeIndex] || currentChartData[0]
  const xRatio = activePoint ? activePoint.x / svgWidth : 0.5
  const tooltipTranslateX =
    xRatio > 0.75 ? '-92%' : xRatio < 0.22 ? '-8%' : '-50%'

  return (
    <div className="exbos-glass-card p-6 sm:p-7 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 border border-[#218DFF]/40 text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Financial Trajectory
            </span>
            <span className="text-xs text-slate-300">
              {currentArch?.number || '01'} · {currentArch?.name || 'Architecture'}
            </span>
          </div>
          <h3 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1 tracking-tight">
            Cash Performance Curve
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Visualizing income elevation, true costs, and profit velocity over time.
          </p>
        </div>

        {/* Days / Weeks / Months Switcher Pill */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 border border-white/15 self-start sm:self-auto">
          {['Days', 'Weeks', 'Months'].map((tab) => {
            const isActive = graphTimeframe === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setGraphTimeframe(tab)
                  setActiveCurveIndex(
                    tab === 'Days' ? 5 : tab === 'Weeks' ? 2 : 5
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
      </div>

      {/* SVG Curve Canvas with Responsive Y-Axis */}
      <div className="relative pt-6 pb-2 select-none w-full">
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
                Income:
              </span>
              <strong className="font-orbitron text-xs sm:text-sm font-extrabold text-white">
                {formatRWF(activeData.income, hideFinancials)}
              </strong>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                {activeData.change || '+24%'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-white/10 w-full justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-slate-300">Expense:</span>
                <strong className="text-rose-300 font-bold">
                  {formatRWF(activeData.expense, hideFinancials)}
                </strong>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Net:</span>
                <strong className="text-emerald-400 font-bold font-orbitron">
                  +{formatRWF(activeData.income - activeData.expense, hideFinancials)}
                </strong>
              </div>
            </div>
          </div>
        )}

        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-64 sm:h-80 overflow-visible"
          >
            <defs>
              <linearGradient id="sapphireWaveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#218DFF" stopOpacity="0.55" />
                <stop offset="60%" stopColor="#1045CA" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#040C26" stopOpacity="0.01" />
              </linearGradient>

              <linearGradient id="expenseWaveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.01" />
              </linearGradient>

              <filter id="glowSapphire" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Y-Axis Grid Lines */}
            {yAxisSteps.map((step, i) => {
              const yPos =
                paddingTop + step.pct * (svgHeight - paddingTop - paddingBottom)
              const isBaseline = i === yAxisSteps.length - 1
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={svgWidth - paddingRight}
                    y2={yPos}
                    stroke={
                      isBaseline
                        ? 'rgba(255,255,255,0.22)'
                        : 'rgba(255,255,255,0.08)'
                    }
                    strokeDasharray={isBaseline ? 'none' : '4 4'}
                    strokeWidth={isBaseline ? '1.5' : '1'}
                  />
                  <text
                    x={paddingLeft - 12}
                    y={yPos + 4}
                    textAnchor="end"
                    className={`font-orbitron text-[10px] sm:text-[11px] font-bold ${
                      isBaseline ? 'fill-slate-300' : 'fill-slate-400'
                    }`}
                  >
                    {formatShortMoney(step.val)}
                  </text>
                </g>
              )
            })}

            {/* Shaded Area Fills */}
            <path d={incomeCurve.areaPath} fill="url(#sapphireWaveGrad)" />
            <path d={expenseCurve.areaPath} fill="url(#expenseWaveGrad)" />

            {/* Secondary Expense Stroke */}
            <path
              d={expenseCurve.linePath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeOpacity="0.8"
              strokeDasharray="5 3"
            />

            {/* Primary Income Flow Wave Stroke */}
            <path
              d={incomeCurve.linePath}
              fill="none"
              stroke="#218DFF"
              strokeWidth="3.5"
              filter="url(#glowSapphire)"
            />

            {/* Vertical Guideline & Point Markers */}
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
                  r="8"
                  fill="#ffffff"
                  stroke="#218DFF"
                  strokeWidth="4"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="16"
                  fill="#218DFF"
                  fillOpacity="0.25"
                  className="animate-ping"
                />

                {expenseCurve.points[safeIndex] && (
                  <circle
                    cx={expenseCurve.points[safeIndex].x}
                    cy={expenseCurve.points[safeIndex].y}
                    r="5"
                    fill="#ffffff"
                    stroke="#f43f5e"
                    strokeWidth="3"
                  />
                )}
              </>
            )}

            {/* Interactive Hover Zones */}
            {incomeCurve.points.map((pt, i) => (
              <rect
                key={i}
                x={pt.x - 24}
                y="0"
                width="48"
                height={svgHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActiveCurveIndex(i)}
                onClick={() => setActiveCurveIndex(i)}
              />
            ))}
          </svg>
        </div>

        {/* X-Axis Timeline Labels */}
        <div
          className="flex items-start justify-between pt-2 text-xs"
          style={{
            paddingLeft: `${(paddingLeft / svgWidth) * 100}%`,
            paddingRight: `${(paddingRight / svgWidth) * 100}%`
          }}
        >
          {currentChartData.map((d, i) => {
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
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-orbitron text-[11px] font-bold tracking-wider">
                  {d.label}
                </span>
                <span
                  className={`text-[9px] font-mono transition-colors ${
                    isCur ? 'text-[#9EDCFF] font-bold' : 'text-slate-400'
                  }`}
                >
                  {formatShortMoney(d.income)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-[#218DFF] shadow-sm inline-block" />
            <span className="text-white font-semibold">Income Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-rose-400 shadow-sm inline-block" />
            <span className="text-white font-semibold">Expenses &amp; Outflow</span>
          </div>
        </div>

        <div className="text-slate-300 text-[11px]">
          Viewing {graphTimeframe.toLowerCase()} trajectory for{' '}
          <strong className="text-[#9EDCFF]">
            {currentArch?.name || 'Architecture'}
          </strong>
        </div>
      </div>
    </div>
  )
}

