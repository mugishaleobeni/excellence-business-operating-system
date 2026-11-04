import React, { useState } from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export default function ReportPerformanceChart({
  title = 'Performance Trend',
  subtitle = '',
  granularity = 'Daily', // 'Daily' | 'Weekly' | 'Monthly'
  onGranularityChange = null, // callback if switch is allowed
  data = [], // [{ label: 'Nov 1', value: 20000, value2: 15000 }, ...]
  series = [{ key: 'value', label: 'Sales', color: '#218DFF' }],
  hideFinancials = false,
  isCurrency = true,
  unit = ''
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Calculate maximum value for chart scaling
  const allValues = data.flatMap((d) =>
    series.map((s) => Number(d[s.key]) || 0)
  )
  const maxValue = Math.max(...allValues, 10)

  // Chart dimensions
  const chartHeight = 160
  const barWidth = Math.max(12, Math.min(36, Math.floor(400 / Math.max(data.length, 1))))

  return (
    <div className="exbos-glass-card p-5 space-y-4">
      {/* Header with Granularity Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#218DFF]" />
            <h4 className="font-orbitron text-sm font-bold text-white">{title}</h4>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Series Legend */}
          <div className="flex items-center gap-3 text-xs">
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-slate-300 text-[11px]">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Granularity switch pills */}
          {onGranularityChange && (
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/5 border border-white/10">
              {['Daily', 'Weekly', 'Monthly'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onGranularityChange(g)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    granularity === g
                      ? 'bg-[#218DFF] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      {data.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
          No data recorded for this time range.
        </div>
      ) : (
        <div className="pt-2">
          <div className="h-48 flex items-end justify-between gap-2 border-b border-white/10 pb-2 relative px-2">
            {/* Background horizontal grid lines */}
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/5 pointer-events-none" />

            {data.map((item, idx) => {
              const isHovered = hoveredIndex === idx
              return (
                <div
                  key={item.label || idx}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer min-w-0"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-14 z-30 bg-[#040C26]/95 border border-[#218DFF]/60 px-3 py-1.5 rounded-xl text-center shadow-2xl pointer-events-none animate-in fade-in duration-100 whitespace-nowrap">
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.label}
                      </div>
                      {series.map((s) => (
                        <div
                          key={s.key}
                          className="font-orbitron text-xs font-bold"
                          style={{ color: s.color }}
                        >
                          {s.label}:{' '}
                          {isCurrency
                            ? formatRWF(Number(item[s.key]) || 0, hideFinancials)
                            : `${item[s.key] || 0} ${unit}`}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bars grouped together for this item */}
                  <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                    {series.map((s) => {
                      const val = Number(item[s.key]) || 0
                      const heightPercent = Math.max(4, Math.round((val / maxValue) * 100))
                      return (
                        <div
                          key={s.key}
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: s.color,
                            maxWidth: `${barWidth}px`
                          }}
                          className={`w-full rounded-t-md transition-all duration-300 opacity-85 group-hover:opacity-100 ${
                            isHovered ? 'ring-2 ring-white/50 scale-y-105 origin-bottom' : ''
                          }`}
                        />
                      )
                    })}
                  </div>

                  {/* X-axis Label */}
                  <span
                    className={`text-[10px] font-mono mt-1 truncate max-w-full block transition-colors ${
                      isHovered ? 'text-white font-bold' : 'text-slate-400'
                    }`}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

